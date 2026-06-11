/** W1-W10 — justification, fronts, supply, exhaustion, occupation, peace pressure. */
import type { GameState, NationState, War } from '../engine/types';
import { BAL } from '../engine/balance';
import { clamp, uid } from '../engine/util';
import { chronicle } from '../engine/chronicle';
import { getRelation } from '../engine/state';
import { ADJACENCY } from '../data/adjacency';
import { atWarWith } from './diplomacy';
import { involved } from './economy';
import { warScoreFor, pushOffer, transferRegion, endWar } from './treaty';
import type { Rng } from '../engine/rng';

export const DOCTRINES = [
  { id: 'defense_in_depth', label: 'Defense in Depth', blurb: 'Trade ground for time; strongest on the defensive.' },
  { id: 'maneuver', label: 'War of Maneuver', blurb: 'Armor and tempo; strongest on the attack.' },
  { id: 'mass_mobilization', label: 'Mass Mobilization', blurb: 'The nation in arms; cheaper manpower, slower tempo.' },
] as const;

/** W1 — start fabricating a justification. */
export function startFabrication(state: GameState, nation: NationState, vs: string): void {
  nation.fabricating = { vs, progress: 0 };
  state.worldTension = clamp(state.worldTension + 2, 0, 100);
}

export function runFabrication(state: GameState): void {
  for (const nation of Object.values(state.nations)) {
    if (!nation.fabricating || !nation.alive) continue;
    nation.fabricating.progress += 12 + nation.standing / 10;
    if (nation.fabricating.progress >= 100) {
      nation.casusBelli.push({ vs: nation.fabricating.vs, type: 'fabricated claim', expires: state.turn + 18 });
      if (nation.id === state.playerId) {
        state.digest.push(`Our claim against ${state.nations[nation.fabricating.vs].name} is ready.`);
      }
      nation.fabricating = null;
    }
  }
}

function alliesOf(state: GameState, id: string): string[] {
  const out = new Set<string>();
  const me = state.nations[id];
  // defensive pacts + guarantees (T2/T8)
  for (const t of state.treaties) {
    for (const c of t.clauses) {
      if (c.type === 'defensivePact' && c.to === id) out.add(c.from);
      if (c.type === 'defensivePact' && c.from === id) out.add(c.to);
      if (c.type === 'guarantee' && c.to === id) out.add(c.from);
    }
  }
  // bloc members (D4)
  if (me.blocId) {
    const bloc = state.blocs.find((b) => b.id === me.blocId);
    if (bloc?.kind === 'alliance') for (const m of bloc.members) out.add(m);
  }
  out.delete(id);
  return [...out].filter((a) => state.nations[a]?.alive);
}

/** W1/W8 — declare war; allies of the defender honor their commitments. */
export function declareWar(state: GameState, attackerId: string, defenderId: string, goal: string): War | null {
  const attacker = state.nations[attackerId];
  const defender = state.nations[defenderId];
  if (!attacker.alive || !defender.alive || atWarWith(state, attackerId, defenderId)) return null;
  if (attacker.justArmistice.includes(defenderId)) return null;

  const hasCb = attacker.casusBelli.some((cb) => cb.vs === defenderId);
  if (!hasCb) {
    attacker.standing = clamp(attacker.standing - BAL.standingUnjustWar, 0, 100);
    state.worldTension = clamp(state.worldTension + 6, 0, 100);
    for (const n of Object.values(state.nations)) {
      if (!n.alive || n.id === attackerId) continue;
      const rel = getRelation(state, n.id, attackerId);
      rel.trust = clamp(rel.trust - 8, 0, 100);
      rel.fear = clamp(rel.fear + 6, 0, 100);
    }
  }

  const defenders = [defenderId, ...alliesOf(state, defenderId).filter((a) => a !== attackerId)];
  const attackers = [attackerId];

  const war: War = {
    id: uid('war'),
    name: `${attacker.name}–${defender.name} War`,
    attackers,
    defenders,
    goal,
    fronts: [],
    startTurn: state.turn,
    casualties: {},
  };
  rebuildFronts(state, war);
  state.wars.push(war);
  state.worldTension = clamp(state.worldTension + BAL.tensionWarStart, 0, 100);

  for (const d of defenders) {
    const rel = getRelation(state, d, attackerId);
    rel.trust = clamp(rel.trust - 25, 0, 100);
    rel.opinion = clamp(rel.opinion - 40, -100, 100);
    state.nations[d].memory.push({ turn: state.turn, vs: attackerId, text: 'Invaded us.', weight: -5 });
  }
  chronicle(state, `${attacker.name} declares war on ${defender.name}${hasCb ? '' : ' without pretext'}`, {
    tags: ['war'],
    nationId: attackerId,
  });
  return war;
}

function rebuildFronts(state: GameState, war: War): void {
  const existing = new Set(war.fronts.map((f) => `${f.attackerId}|${f.defenderId}`));
  for (const a of war.attackers) {
    for (const d of war.defenders) {
      if (!(ADJACENCY[a] ?? []).includes(d)) continue;
      if (existing.has(`${a}|${d}`)) continue;
      war.fronts.push({
        id: uid('front'),
        attackerId: a,
        defenderId: d,
        progress: 0,
        name: `${state.nations[a].name}–${state.nations[d].name} front`,
      });
    }
  }
}

function frontPower(state: GameState, nation: NationState, frontId: string, attacking: boolean): number {
  const assigned = nation.military.armies.filter((a) => a.frontId === frontId);
  // unassigned armies defend home soil at half effect
  const reserve = nation.military.armies.filter((a) => !a.frontId);
  let p = 0;
  for (const a of assigned) {
    const general = a.generalId ? state.characters[a.generalId] : null;
    const genBonus = general ? 0.7 + general.competence / 150 : 0.85;
    const compBonus = 1 + a.composition.art / 250 + (attacking ? a.composition.arm / 120 : a.composition.arm / 220);
    p += a.strength * (a.organization / 100) * genBonus * compBonus;
  }
  if (!attacking) for (const a of reserve) p += a.strength * (a.organization / 100) * 0.4;
  const doctrine = nation.military.doctrine;
  if (doctrine === 'maneuver' && attacking) p *= 1.15;
  if (doctrine === 'defense_in_depth' && !attacking) p *= 1.2;
  if (doctrine === 'mass_mobilization') p *= 1.05;
  // supply state (W5): arms/oil shortage already bled organization in economy
  return p;
}

export function runWars(state: GameState, rng: Rng): void {
  for (const war of [...state.wars]) {
    rebuildFronts(state, war);
    for (const front of war.fronts) {
      const attacker = state.nations[front.attackerId];
      const defender = state.nations[front.defenderId];
      const atk = frontPower(state, attacker, front.id, true) + 1;
      const def = frontPower(state, defender, front.id, false) + 1;
      const ratio = atk / def;
      const shift = clamp((ratio - 1) * BAL.frontBaseProgress, -BAL.frontBaseProgress * 1.5, BAL.frontBaseProgress * 1.5);
      front.progress = clamp(front.progress + shift + (rng.next() - 0.5) * 2, -100, 100);

      // casualties proportional to engagement
      const engaged = Math.min(atk, def);
      const lossA = engaged * 0.012 * (1 / Math.max(0.5, ratio));
      const lossD = engaged * 0.012 * Math.max(0.5, ratio);
      applyCasualties(attacker, lossA);
      applyCasualties(defender, lossD);
      war.casualties[attacker.id] = (war.casualties[attacker.id] ?? 0) + lossA;
      war.casualties[defender.id] = (war.casualties[defender.id] ?? 0) + lossD;

      // occupation thresholds (W10): every 34 points of progress occupies one defender region
      const shouldHold = Math.min(state.nations[front.defenderId].regionIds.length, Math.floor(Math.max(0, front.progress) / 34));
      const occupied = Object.values(state.regions).filter(
        (r) => r.ownerId === front.defenderId && r.controllerId === front.attackerId,
      ).length;
      if (shouldHold > occupied) {
        const target = Object.values(state.regions).find((r) => r.ownerId === front.defenderId && r.controllerId === front.defenderId);
        if (target) {
          target.controllerId = front.attackerId;
          target.resistance = 10;
          chronicle(state, `${attacker.name} occupies ${target.name}`, { tags: ['war'] });
        }
      } else if (shouldHold < occupied && front.progress < 0) {
        const lost = Object.values(state.regions).find((r) => r.ownerId === front.defenderId && r.controllerId === front.attackerId);
        if (lost) {
          lost.controllerId = front.defenderId;
          lost.resistance = 0;
          chronicle(state, `${defender.name} liberates ${lost.name}`, { tags: ['war'] });
        }
      }
    }

    runNavalAir(state, war);

    // capitulation: a defender (or attacker) with every region lost sues unconditionally
    for (const sideId of [...war.attackers, ...war.defenders]) {
      const n = state.nations[sideId];
      const holds = n.regionIds.some((rid) => state.regions[rid]?.controllerId === sideId);
      if (!holds && n.regionIds.length) {
        capitulate(state, war, sideId);
        break;
      }
    }

    // W7/W8 — exhausted AI belligerents sue for peace
    if (state.wars.includes(war)) peacePressure(state, war, rng);
  }

  // W10 — resistance in occupied regions
  for (const r of Object.values(state.regions)) {
    if (r.ownerId !== r.controllerId) {
      r.resistance = clamp((r.resistance ?? 0) + BAL.resistanceGrowth * (r.unrest > 50 ? 1.5 : 1), 0, 100);
      r.unrest = clamp(r.unrest + 2, 0, 100);
    } else if (r.resistance) {
      r.resistance = 0;
    }
  }
}

function applyCasualties(nation: NationState, loss: number): void {
  let remaining = loss;
  for (const a of nation.military.armies) {
    if (!a.frontId) continue;
    const take = Math.min(a.strength * 0.2, remaining);
    a.strength = Math.max(0, a.strength - take);
    a.organization = clamp(a.organization - take / 2, 5, 100);
    remaining -= take;
    if (remaining <= 0) break;
  }
  nation.military.armies = nation.military.armies.filter((a) => a.strength > 1);
  nation.warExhaustion = clamp(nation.warExhaustion + (loss / 10) * BAL.exhaustionPerCasualty, 0, 100);
}

/** W6 — resolve naval/air missions for belligerents. */
function runNavalAir(state: GameState, war: War): void {
  for (const sideId of [...war.attackers, ...war.defenders]) {
    const n = state.nations[sideId];
    const m = n.military;
    if (!m.navalMission || !m.navalTarget) continue;
    const target = state.nations[m.navalTarget];
    if (!target?.alive || !involved(war, m.navalTarget)) continue;
    if (m.navalMission === 'bombing' && m.air > target.military.air) {
      // strategic bombing burns stockpiles and raises unrest
      target.stockpiles.steel = Math.max(0, target.stockpiles.steel - m.air * 0.1);
      target.stockpiles.arms = Math.max(0, target.stockpiles.arms - m.air * 0.08);
      for (const rid of target.regionIds) {
        const r = state.regions[rid];
        if (r) r.unrest = clamp(r.unrest + 1, 0, 100);
      }
      target.warExhaustion = clamp(target.warExhaustion + 0.8, 0, 100);
    }
    if (m.navalMission === 'portStrike' && m.navy > 0) {
      const dmg = Math.min(target.military.navy, m.navy * 0.06);
      target.military.navy -= dmg;
      m.navy -= dmg * 0.3;
    }
    // blockade handled in economy (isBlockaded); escort/patrol reduce it
    if (m.navalMission === 'escort' || m.navalMission === 'patrol') {
      // soften enemy blockade by attriting blockaders
      for (const e of involvedEnemies(war, sideId)) {
        const enemy = state.nations[e];
        if (enemy.military.navalMission === 'blockade' && enemy.military.navalTarget === sideId) {
          enemy.military.navy = Math.max(0, enemy.military.navy - m.navy * 0.03);
        }
      }
    }
  }
}

function involvedEnemies(war: War, id: string): string[] {
  return war.attackers.includes(id) ? war.defenders : war.attackers;
}

function capitulate(state: GameState, war: War, loserId: string): void {
  const loser = state.nations[loserId];
  const winners = war.attackers.includes(loserId) ? war.defenders : war.attackers;
  const lead = state.nations[winners[0]];
  chronicle(state, `${loser.name} capitulates to ${lead.name}`, { tags: ['war'] });
  // unconditional peace: lead winner annexes the loser's regions
  for (const rid of [...loser.regionIds]) transferRegion(state, rid, winners[0]);
  endWar(state, war.id, 'Capitulation');
}

/** W7/W8 — AI peace feelers; player receives them as offers with warId. */
function peacePressure(state: GameState, war: War, rng: Rng): void {
  for (const sideId of [...war.attackers, ...war.defenders]) {
    const n = state.nations[sideId];
    if (n.id === state.playerId) continue;
    const score = warScoreFor(state, war, sideId);
    const desperate = n.warSupport < 22 || score < -35;
    if (!desperate || !rng.chance(0.4)) continue;

    const enemies = involvedEnemies(war, sideId);
    const playerEnemy = enemies.includes(state.playerId);
    if (playerEnemy) {
      // sue for peace with the player: offer reparations or a region if crushed
      const clauses = [];
      const occupiedRegion = n.regionIds.find((rid) => state.regions[rid]?.controllerId === state.playerId);
      if (score < -45 && occupiedRegion) {
        clauses.push({ type: 'cession' as const, from: n.id, to: state.playerId, regionId: occupiedRegion });
      } else {
        clauses.push({ type: 'reparations' as const, from: n.id, to: state.playerId, amount: Math.round(8 + n.treasury * 0.02) });
      }
      if (!state.offers.some((o) => o.warId === war.id && o.from === n.id)) {
        pushOffer(state, {
          from: n.id,
          clauses,
          duration: 60,
          message: `${n.name} sues for peace.`,
          expires: state.turn + 3,
          warId: war.id,
        });
      }
    } else if (enemies.every((e) => e !== state.playerId)) {
      // AI-AI settlement: leading side takes reparations or a region
      const enemyLead = state.nations[enemies[0]];
      const enemyScore = warScoreFor(state, war, enemies[0]);
      if (enemyScore > 25) {
        const region = n.regionIds.find((rid) => state.regions[rid]?.controllerId === enemies[0]);
        if (region) transferRegion(state, region, enemies[0]);
        else enemyLead.treasury += Math.min(80, Math.max(0, n.treasury * 0.2));
      }
      endWar(state, war.id, `Peace between ${enemyLead.name} and ${n.name}`);
      return;
    }
  }
}

/** Player action: raise a new army (W2). */
export function recruitArmy(nation: NationState, strength: number, composition: { inf: number; art: number; arm: number }): string | null {
  const costCash = (strength / 10) * BAL.recruitCostCash;
  const costArms = (strength / 10) * BAL.recruitCostArms;
  if (nation.military.manpower < strength) return 'Not enough trained manpower.';
  if (nation.treasury < costCash) return 'The treasury cannot fund it.';
  if (nation.stockpiles.arms < costArms) return 'Not enough arms in the depots.';
  nation.military.manpower -= strength;
  nation.treasury -= costCash;
  nation.stockpiles.arms -= costArms;
  nation.military.armies.push({
    id: uid('army'),
    name: `${nation.military.armies.length + 1}. Army`,
    generalId: null,
    strength,
    composition,
    organization: 35,
    frontId: null,
  });
  return null;
}
