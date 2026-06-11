/** I1-I11 — cabinet, capital, legislature, stability, development, research, elections. */
import type { Clause, GameState, NationState } from '../engine/types';
import { BAL } from '../engine/balance';
import { clamp } from '../engine/util';
import { chronicle } from '../engine/chronicle';
import { getRelation } from '../engine/state';
import { nationMods } from './mods';
import { TECHS } from '../data/techs';
import { AGENDAS } from '../data/agendas';
import { controlledRegions, involved } from './economy';
import type { Rng } from '../engine/rng';

const techById = new Map(TECHS.map((t) => [t.id, t]));
const nodeById = new Map(AGENDAS.map((a) => [a.id, a]));

function ministerCompetence(state: GameState, nation: NationState, post: 'foreign' | 'economy' | 'defense' | 'interior'): number {
  const id = nation.ministers[post];
  const c = id ? state.characters[id] : null;
  return c && c.alive ? c.competence : 30;
}

export function runInternal(state: GameState, rng: Rng): void {
  for (const nation of Object.values(state.nations)) {
    if (!nation.alive) continue;
    const mods = nationMods(nation);
    const isPlayer = nation.id === state.playerId;

    // I2 — political capital income
    nation.politicalCapital = Math.min(
      50,
      nation.politicalCapital + BAL.capitalIncomeBase + mods.capitalBonus + (nation.stability - 50) / 25,
    );

    // I1 — ministers earn their keep
    nation.treasury += ministerCompetence(state, nation, 'economy') * 0.06;
    for (const a of nation.military.armies) {
      a.organization = clamp(a.organization + ministerCompetence(state, nation, 'defense') / 40, 5, 100);
    }

    // I4/I8 — regional unrest evolution
    let unrestSum = 0;
    for (const rid of nation.regionIds) {
      const r = state.regions[rid];
      if (!r) continue;
      let drift = -0.8 - ministerCompetence(state, nation, 'interior') / 90; // order slowly returns
      if (r.minority) {
        if (r.minority.policy === 'suppress') drift += BAL.minoritySuppressUnrest * (r.minority.share / 100);
        if (r.minority.policy === 'autonomy') drift -= 0.5;
        // a kin-state with high opinion of itself agitates (I8)
        if (r.minority.tiedTo && state.nations[r.minority.tiedTo]?.alive) {
          const kin = state.nations[r.minority.tiedTo];
          const rel = getRelation(state, r.minority.tiedTo, nation.id);
          if (rel.opinion < -20 && kin.ideology.natl > 30) drift += 1.2;
        }
      }
      r.unrest = clamp(r.unrest + drift, 0, 100);
      unrestSum += r.unrest;
    }
    const avgUnrest = nation.regionIds.length ? unrestSum / nation.regionIds.length : 0;

    // I4/I11 — stability drift
    const pressBonus = nation.press === 'state' ? 1.2 : nation.press === 'pressured' ? 0.5 : 0;
    const ideologyStrain = nation.factions.length
      ? Math.abs(nation.ideology.auth) > 60
        ? 1
        : 0
      : 0; // hard-authoritarian drift strains a parliamentary state
    const target = 62 - avgUnrest * 0.45 + pressBonus * 4 - ideologyStrain * 8;
    nation.stability = clamp(nation.stability + clamp(target - nation.stability, -1.4, 1.1) + mods.stabilityBonus, 0, 100);
    if (nation.press === 'state') nation.standing = clamp(nation.standing - 0.08, 0, 100);

    // I7 — research
    if (nation.research.current) {
      const edu = controlledRegions(state, nation).reduce((s, r) => s + r.development.education, 0);
      nation.research.progress += edu * BAL.researchPerEducation + mods.researchBonus + 2;
      const tech = techById.get(nation.research.current);
      if (tech && nation.research.progress >= tech.cost) {
        nation.techs.push(tech.id);
        nation.research = { current: null, progress: 0 };
        if (isPlayer) {
          chronicle(state, `${nation.name} masters ${tech.label.toLowerCase()}`, { tags: ['research'], nationId: nation.id });
        }
      }
    } else if (!isPlayer) {
      // AI picks the cheapest available tech
      const available = TECHS.filter((t) => !nation.techs.includes(t.id) && 1936 + state.turn / 12 >= t.year).sort(
        (a, b) => a.cost - b.cost,
      );
      if (available.length) nation.research.current = available[0].id;
    }

    // I6 — agenda
    if (nation.agenda.current) {
      nation.agenda.progress += 1;
      const node = nodeById.get(nation.agenda.current);
      if (node && nation.agenda.progress >= node.months) {
        nation.agenda.completed.push(node.id);
        nation.agenda = { ...nation.agenda, current: null, progress: 0 };
        for (const e of node.effects) e({ state, nation });
        if (isPlayer) state.digest.push(`National agenda complete: ${node.title}.`);
      }
    } else if (!isPlayer && nation.major) {
      const open = AGENDAS.filter(
        (a) =>
          (a.tree === 'generic' || a.tree === nation.id) &&
          !nation.agenda.completed.includes(a.id) &&
          (a.requires ?? []).every((r) => nation.agenda.completed.includes(r)) &&
          (!a.condition || a.condition(state, nation)),
      );
      if (open.length) nation.agenda.current = open[Math.floor(rng.next() * open.length)].id;
    }

    // I9 — corporations & unions lobby: loyal magnates pay off, estranged ones fund the opposition
    for (const c of Object.values(state.characters)) {
      if (c.nationId !== nation.id || !c.alive || (c.role !== 'magnate' && c.role !== 'union')) continue;
      if (c.loyalty > 65) {
        nation.treasury += c.competence * 0.02;
      } else if (c.loyalty < 30) {
        nation.stability = clamp(nation.stability - 0.3, 0, 100);
        if (nation.factions.length && rng.chance(0.1)) {
          const friend = [...nation.factions].sort(
            (x, y) => Math.abs(x.ideology.planned - c.ideology.planned) - Math.abs(y.ideology.planned - c.ideology.planned),
          )[0];
          friend.seats = Math.min(70, friend.seats + 1);
          const other = nation.factions.find((f) => f !== friend && f.seats > 5);
          if (other) other.seats -= 1;
          if (isPlayer) state.digest.push(`${c.name} is quietly bankrolling the ${friend.name}.`);
          c.log.push({ turn: state.turn, text: `Funded the ${friend.name} against the government.` });
        }
      }
    }

    // I1 — a deeply disloyal minister leaks (quiet drag, occasionally loud)
    for (const post of ['foreign', 'economy', 'defense', 'interior'] as const) {
      const id = nation.ministers[post];
      const m = id ? state.characters[id] : null;
      if (m && m.alive && m.loyalty < 25 && rng.chance(0.06)) {
        nation.politicalCapital = Math.max(0, nation.politicalCapital - 4);
        m.log.push({ turn: state.turn, text: 'Suspected of leaking cabinet business.' });
        if (isPlayer) state.digest.push(`${m.name} is suspected of leaking cabinet business.`);
      }
    }

    // I10 — elections
    if (nation.electionDue !== null) {
      nation.electionDue -= 1;
      if (nation.electionDue <= 0) runElection(state, nation, rng);
    }
  }
}

/** I10/D8 — hold an election. Player loss is surfaced as a flag for the UI. */
function runElection(state: GameState, nation: NationState, rng: Rng): void {
  nation.electionDue = BAL.electionPeriod;
  if (!nation.factions.length) return;

  let incumbentShare =
    38 +
    (nation.stability - 50) * 0.5 +
    (nation.treasury > 0 ? 5 : -8) +
    (state.wars.some((w) => involved(w, nation.id)) ? (nation.warSupport - 50) * 0.3 : 4) +
    (rng.next() - 0.5) * 14;

  const rigger = nation.flags['rigged_by'];
  if (typeof rigger === 'string') {
    const sponsor = state.nations[rigger];
    // the sponsor pushes the result toward its own interest
    incumbentShare += getRelation(state, rigger, nation.id).opinion > 0 ? 12 : -12;
    delete nation.flags['rigged_by'];
    if (rng.chance(0.3) && sponsor) {
      sponsor.standing = clamp(sponsor.standing - 10, 0, 100);
      chronicle(state, `Ballot interference by ${sponsor.name} alleged in ${nation.name}`, { tags: ['espionage', 'politics'] });
    }
  }

  const won = incumbentShare >= 50;
  if (nation.id === state.playerId) {
    nation.flags['electionResult'] = won ? 'won' : 'lost';
    nation.flags['electionShare'] = Math.round(incumbentShare);
  } else if (!won) {
    // AI government falls: ideology shifts toward strongest faction
    const top = [...nation.factions].sort((a, b) => b.seats - a.seats)[0];
    nation.ideology.auth = clamp((nation.ideology.auth + top.ideology.auth) / 2, -100, 100);
    nation.ideology.planned = clamp((nation.ideology.planned + top.ideology.planned) / 2, -100, 100);
    nation.politicalCapital = Math.max(0, nation.politicalCapital - 5);
    chronicle(state, `${nation.name} votes its government out; ${top.name} forms a cabinet`, { tags: ['politics'] });
  }
  if (nation.id === state.playerId) {
    chronicle(state, won ? `${nation.name} re-elects its government with ${Math.round(incumbentShare)}%` : `${nation.name} votes the government out`, {
      tags: ['politics'],
      nationId: nation.id,
    });
  }
}

/** I2/T5 — legislature vote with whipping. Returns pass/fail and spends capital. */
export function legislatureVote(
  state: GameState,
  nation: NationState,
  partnerId: string,
  clauses: Clause[],
  whipCapital: number,
): { passed: boolean; support: number } {
  const partner = state.nations[partnerId];
  let support = 0;
  for (const f of nation.factions) {
    const ideoGap =
      Math.abs(f.ideology.auth - partner.ideology.auth) * 0.5 + Math.abs(f.ideology.planned - partner.ideology.planned) * 0.3;
    const cedes = clauses.some((c) => c.type === 'cession' && c.from === nation.id);
    let lean = 55 - ideoGap * 0.4 + getRelation(state, nation.id, partnerId).opinion * 0.25 - (cedes ? 30 : 0);
    lean += f.ideology.natl > 30 && cedes ? -20 : 0;
    support += (f.seats * clamp(lean, 5, 95)) / 100;
  }
  support += whipCapital * 1.4;
  nation.politicalCapital = Math.max(0, nation.politicalCapital - whipCapital);
  return { passed: support >= 50, support: Math.round(support) };
}

/** I3 — constitutional amendments. */
export const AMENDMENTS = [
  { id: 'emergencyPowers', label: 'Emergency Powers Act', cost: 18, blurb: 'Rule by decree: treaties skip ratification for two years. The opposition will not forget.' },
  { id: 'extendTerm', label: 'Extend the Mandate', cost: 14, blurb: 'Postpone the next election by two years.' },
  { id: 'expandSuffrage', label: 'Expand the Franchise', cost: 10, blurb: 'Broaden the vote; legitimacy now, uncertainty later.' },
  { id: 'stateDirection', label: 'State Direction of Industry', cost: 12, blurb: 'Bring the commanding heights under ministry control.' },
] as const;

export function amendConstitution(state: GameState, nation: NationState, id: (typeof AMENDMENTS)[number]['id']): string | null {
  const amendment = AMENDMENTS.find((a) => a.id === id)!;
  if (nation.politicalCapital < amendment.cost) return 'Not enough political capital.';
  nation.politicalCapital -= amendment.cost;
  switch (id) {
    case 'emergencyPowers':
      nation.ideology.auth = clamp(nation.ideology.auth + 30, -100, 100);
      nation.stability = clamp(nation.stability - 8, 0, 100);
      nation.flags['decreeUntil'] = state.turn + 24;
      break;
    case 'extendTerm':
      if (nation.electionDue !== null) nation.electionDue += 24;
      nation.ideology.auth = clamp(nation.ideology.auth + 18, -100, 100);
      nation.standing = clamp(nation.standing - 5, 0, 100);
      break;
    case 'expandSuffrage':
      nation.ideology.auth = clamp(nation.ideology.auth - 25, -100, 100);
      nation.stability = clamp(nation.stability + 5, 0, 100);
      nation.standing = clamp(nation.standing + 4, 0, 100);
      break;
    case 'stateDirection':
      nation.ideology.planned = clamp(nation.ideology.planned + 25, -100, 100);
      break;
  }
  const leader = state.characters[nation.leaderId];
  leader?.log.push({ turn: state.turn, text: `Carried the ${amendment.label}.` });
  chronicle(state, `${nation.name} adopts the ${amendment.label}`, { tags: ['politics'], nationId: nation.id });
  return null;
}

/** I1 — appoint a character to a cabinet post. */
export function appointMinister(state: GameState, nation: NationState, post: 'foreign' | 'economy' | 'defense' | 'interior', charId: string): string | null {
  if (nation.politicalCapital < 5) return 'Not enough political capital (5 needed).';
  const incoming = state.characters[charId];
  if (!incoming?.alive || incoming.nationId !== nation.id) return 'They are not available.';
  const outgoingId = nation.ministers[post];
  if (outgoingId) {
    const outgoing = state.characters[outgoingId];
    if (outgoing) {
      outgoing.post = null;
      outgoing.loyalty = clamp(outgoing.loyalty - 25, 0, 100);
      outgoing.log.push({ turn: state.turn, text: `Dismissed from the ${post} ministry.` });
    }
  }
  nation.politicalCapital -= 5;
  nation.ministers[post] = charId;
  incoming.post = post;
  incoming.loyalty = clamp(incoming.loyalty + 10, 0, 100);
  incoming.log.push({ turn: state.turn, text: `Appointed ${post} minister.` });
  return null;
}
