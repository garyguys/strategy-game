/** D5/D6/D9/W9 — incident ladders, congress resolution, the League. */
import type { Crisis, GameState } from '../engine/types';
import { BAL } from '../engine/balance';
import { clamp, uid } from '../engine/util';
import { chronicle } from '../engine/chronicle';
import { getRelation } from '../engine/state';
import { ADJACENCY } from '../data/adjacency';
import { armyPower, atWarWith, regard } from './diplomacy';
import { declareWar } from './war';
import type { Rng } from '../engine/rng';

export const STAGE_LABEL = ['Murmurs', 'Protest Notes', 'Mobilization Threats', 'Ultimatum', 'The Brink'];

export type CrisisMove = 'escalate' | 'hold' | 'backDown' | 'appealLeague';

/** Player (or AI) makes a move in a crisis they are party to (D6). */
export function crisisMove(state: GameState, crisis: Crisis, moverId: string, move: CrisisMove, rng: Rng): string {
  const other = crisis.a === moverId ? crisis.b : crisis.a;
  const mover = state.nations[moverId];
  const opponent = state.nations[other];

  if (move === 'appealLeague') {
    return appealToLeague(state, crisis, moverId, rng);
  }

  if (move === 'backDown') {
    state.crises = state.crises.filter((c) => c.id !== crisis.id);
    mover.standing = clamp(mover.standing - 4, 0, 100);
    mover.stability = clamp(mover.stability - 3 - crisis.stage * 1.5, 0, 100);
    opponent.standing = clamp(opponent.standing + 2, 0, 100);
    const rel = getRelation(state, other, moverId);
    rel.fear = clamp(rel.fear - 8, 0, 100);
    state.worldTension = clamp(state.worldTension - BAL.tensionCrisisStep, 0, 100);
    chronicle(state, `${mover.name} backs down over ${crisis.title}`, { tags: ['crisis'], nationId: moverId });
    return `${mover.name} climbs down. The capitals exhale; your opposition does not.`;
  }

  if (move === 'hold') {
    crisis.turnsAtStage++;
    // standing firm long enough makes the other side blink, if they're weaker-willed
    const resolve = opponent.warSupport + getRelation(state, other, moverId).fear * -0.3 + armyPower(opponent) / Math.max(1, armyPower(mover)) * 20;
    if (crisis.turnsAtStage >= 2 && resolve < 45 && rng.chance(0.45)) {
      state.crises = state.crises.filter((c) => c.id !== crisis.id);
      opponent.standing = clamp(opponent.standing - 4, 0, 100);
      mover.standing = clamp(mover.standing + 3, 0, 100);
      chronicle(state, `${opponent.name} quietly lets ${crisis.title} drop`, { tags: ['crisis'] });
      return `${opponent.name} blinks first.`;
    }
    return 'The crisis holds at its current pitch.';
  }

  // escalate
  crisis.stage = Math.min(4, crisis.stage + 1);
  crisis.turnsAtStage = 0;
  state.worldTension = clamp(state.worldTension + BAL.tensionCrisisStep, 0, 100);
  mover.stability = clamp(mover.stability - 1, 0, 100);
  const relOpp = getRelation(state, other, moverId);
  relOpp.fear = clamp(relOpp.fear + 8, 0, 100);
  relOpp.opinion = clamp(relOpp.opinion - 8, -100, 100);

  if (crisis.stage >= 4) {
    // at the brink the weaker resolve folds — or the guns speak
    const moverResolve = mover.warSupport + armyPower(mover) / 10;
    const oppResolve = opponent.warSupport + armyPower(opponent) / 10;
    if (oppResolve < moverResolve * 0.75) {
      state.crises = state.crises.filter((c) => c.id !== crisis.id);
      opponent.standing = clamp(opponent.standing - 7, 0, 100);
      mover.standing = clamp(mover.standing + 4, 0, 100);
      mover.casusBelli.push({ vs: other, type: 'humiliation', expires: state.turn + 12 });
      chronicle(state, `${opponent.name} capitulates in the ${crisis.title} crisis`, { tags: ['crisis'] });
      return `${opponent.name} folds at the brink. Their humiliation will be remembered — by both sides.`;
    }
    if (rng.chance(0.5)) {
      state.crises = state.crises.filter((c) => c.id !== crisis.id);
      mover.casusBelli.push({ vs: other, type: 'crisis', expires: state.turn + 6 });
      declareWar(state, moverId, other, crisis.title);
      return 'The ultimatum expires. The guns answer.';
    }
  }
  chronicle(state, `${mover.name} escalates ${crisis.title} (${STAGE_LABEL[crisis.stage]})`, { tags: ['crisis'] });
  return `The crisis rises to "${STAGE_LABEL[crisis.stage]}".`;
}

/** D9 — put the dispute before the League of Nations. */
function appealToLeague(state: GameState, crisis: Crisis, moverId: string, rng: Rng): string {
  const other = crisis.a === moverId ? crisis.b : crisis.a;
  const mover = state.nations[moverId];
  const opponent = state.nations[other];
  const sympathy =
    state.leagueAuthority +
    mover.standing -
    opponent.standing +
    (Object.values(state.nations).filter((n) => n.major && regard(state, n.id, moverId) > regard(state, n.id, other)).length - 3) * 8;

  if (rng.chance(clamp(sympathy / 130, 0.1, 0.9))) {
    state.crises = state.crises.filter((c) => c.id !== crisis.id);
    state.leagueAuthority = clamp(state.leagueAuthority + 6, 0, 100);
    mover.standing = clamp(mover.standing + 5, 0, 100);
    opponent.standing = clamp(opponent.standing - 5, 0, 100);
    state.worldTension = clamp(state.worldTension - 5, 0, 100);
    chronicle(state, `The League rules for ${mover.name} in ${crisis.title}`, { tags: ['crisis', 'league'] });
    return 'Geneva finds in your favor. The ruling has no divisions, but it has weight.';
  }
  state.leagueAuthority = clamp(state.leagueAuthority - 5, 0, 100);
  chronicle(state, `The League fails to resolve ${crisis.title}`, { tags: ['crisis', 'league'] });
  return 'Committees, communiqués, adjournment. The crisis stands; the League shrinks.';
}

/** Monthly: AI moves in crises, new incidents spawn, stale ones cool (D6/W9). */
export function runCrises(state: GameState, rng: Rng): void {
  for (const crisis of [...state.crises]) {
    const aiParties = [crisis.a, crisis.b].filter((p) => p !== state.playerId);
    for (const pid of aiParties) {
      const n = state.nations[pid];
      if (!n?.alive) {
        state.crises = state.crises.filter((c) => c.id !== crisis.id);
        break;
      }
      const opp = state.nations[crisis.a === pid ? crisis.b : crisis.a];
      if (!opp?.alive) continue;
      const bold = n.personality === 'vengeful' || n.personality === 'ideologue';
      const stronger = armyPower(n) > armyPower(opp) * 1.2;
      const r = rng.next();
      if (r < (bold && stronger ? 0.3 : 0.1) && crisis.stage < 4) {
        crisisMove(state, crisis, pid, 'escalate', rng);
      } else if (r > 0.85 || (!stronger && crisis.stage >= 3 && !bold)) {
        crisisMove(state, crisis, pid, 'backDown', rng);
      } else {
        crisis.turnsAtStage++;
      }
      break; // one AI move per crisis per month
    }
  }

  // crises older than 8 months at the same stage fizzle
  for (const crisis of [...state.crises]) {
    if (crisis.turnsAtStage > 8) {
      state.crises = state.crises.filter((c) => c.id !== crisis.id);
      state.worldTension = clamp(state.worldTension - 2, 0, 100);
      chronicle(state, `${crisis.title} fades from the front pages`, { tags: ['crisis'], quiet: true });
    }
  }

  // W9 — border incidents between hostile neighbors
  if (state.crises.length < 3 && rng.chance(0.12 + state.worldTension / 400)) {
    const majors = Object.values(state.nations).filter((n) => n.alive && n.major);
    const candidates: [string, string][] = [];
    for (const n of majors) {
      for (const nb of ADJACENCY[n.id] ?? []) {
        const other = state.nations[nb];
        if (!other?.alive || atWarWith(state, n.id, nb)) continue;
        const rel = getRelation(state, n.id, nb);
        if (rel.opinion < -25 && !state.crises.some((c) => (c.a === n.id && c.b === nb) || (c.a === nb && c.b === n.id))) {
          candidates.push([n.id, nb]);
        }
      }
    }
    if (candidates.length) {
      const [a, b] = candidates[Math.floor(rng.next() * candidates.length)];
      const kinds = ['a border shooting', 'a seized customs post', 'a violated airspace', 'an expelled consul', 'a sunk fishing boat'];
      const what = kinds[Math.floor(rng.next() * kinds.length)];
      state.crises.push({
        id: uid('cr'),
        kind: 'borderIncident',
        title: `${what} on the ${state.nations[a].name}–${state.nations[b].name} frontier`,
        a,
        b,
        stage: 1,
        turnsAtStage: 0,
      });
      state.worldTension = clamp(state.worldTension + 2, 0, 100);
      if (a === state.playerId || b === state.playerId) {
        state.digest.push(`Incident: ${what} involving ${state.nations[a === state.playerId ? b : a].name}.`);
      }
      chronicle(state, `Incident: ${what} (${state.nations[a].name}–${state.nations[b].name})`, { tags: ['crisis'] });
    }
  }
}

/** D5 — convene a congress over a stage-3+ crisis among majors. Returns proposals. */
export interface CongressProposal {
  id: string;
  label: string;
  blurb: string;
  apply: (state: GameState) => void;
}

export function congressProposals(state: GameState, crisis: Crisis): CongressProposal[] {
  const a = state.nations[crisis.a];
  const b = state.nations[crisis.b];
  return [
    {
      id: 'split',
      label: 'The Compromise',
      blurb: 'Both parties stand down with face intact; the great powers co-sign the settlement.',
      apply: (s) => {
        s.crises = s.crises.filter((c) => c.id !== crisis.id);
        s.worldTension = clamp(s.worldTension - 8, 0, 100);
        s.leagueAuthority = clamp(s.leagueAuthority + 4, 0, 100);
        for (const p of [crisis.a, crisis.b]) {
          s.nations[p].standing = clamp(s.nations[p].standing + 2, 0, 100);
        }
        chronicle(s, `A congress settles ${crisis.title}`, { tags: ['crisis', 'diplomacy'] });
      },
    },
    {
      id: 'favorA',
      label: `${a.name}'s Terms`,
      blurb: `${a.name} gets satisfaction; ${b.name} swallows it and remembers.`,
      apply: (s) => {
        s.crises = s.crises.filter((c) => c.id !== crisis.id);
        s.worldTension = clamp(s.worldTension - 4, 0, 100);
        a.standing = clamp(a.standing + 4, 0, 100);
        b.standing = clamp(b.standing - 4, 0, 100);
        b.memory.push({ turn: s.turn, vs: crisis.a, text: 'Humiliated us before the powers.', weight: -3 });
        chronicle(s, `The congress awards ${crisis.title} to ${a.name}`, { tags: ['crisis', 'diplomacy'] });
      },
    },
    {
      id: 'favorB',
      label: `${b.name}'s Terms`,
      blurb: `${b.name} gets satisfaction; ${a.name} swallows it and remembers.`,
      apply: (s) => {
        s.crises = s.crises.filter((c) => c.id !== crisis.id);
        s.worldTension = clamp(s.worldTension - 4, 0, 100);
        b.standing = clamp(b.standing + 4, 0, 100);
        a.standing = clamp(a.standing - 4, 0, 100);
        a.memory.push({ turn: s.turn, vs: crisis.b, text: 'Humiliated us before the powers.', weight: -3 });
        chronicle(s, `The congress awards ${crisis.title} to ${b.name}`, { tags: ['crisis', 'diplomacy'] });
      },
    },
  ];
}
