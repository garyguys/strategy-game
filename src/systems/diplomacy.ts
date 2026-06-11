/** D1-D3, D10 — relationship upkeep, fear, standing, tension, memory. */
import type { GameState, NationState } from '../engine/types';
import { BAL } from '../engine/balance';
import { clamp } from '../engine/util';
import { getRelation } from '../engine/state';
import { ADJACENCY } from '../data/adjacency';
import { nationMods } from './mods';
import { involved } from './economy';

/** Aggregate military power (used by fear, fronts, AI). */
export function armyPower(nation: NationState): number {
  const mods = nationMods(nation);
  let p = 0;
  for (const a of nation.military.armies) {
    const compBonus = 1 + a.composition.art / 250 + a.composition.arm / 150;
    p += a.strength * (a.organization / 100) * compBonus;
  }
  return p * (1 + mods.armyPower) * (nation.military.doctrine ? 1.1 : 1);
}

export function neighbors(state: GameState, id: string): NationState[] {
  const direct = ADJACENCY[id] ?? [];
  const out: NationState[] = [];
  for (const n of direct) {
    const nation = state.nations[n];
    if (nation?.alive) out.push(nation);
  }
  return out;
}

export function atWarWith(state: GameState, a: string, b: string): boolean {
  return state.wars.some(
    (w) =>
      (w.attackers.includes(a) && w.defenders.includes(b)) ||
      (w.attackers.includes(b) && w.defenders.includes(a)),
  );
}

export function runDiplomacy(state: GameState): void {
  const powers = new Map<string, number>();
  for (const n of Object.values(state.nations)) if (n.alive) powers.set(n.id, armyPower(n));

  for (const nation of Object.values(state.nations)) {
    if (!nation.alive) continue;
    const myPower = powers.get(nation.id) ?? 1;

    for (const [otherId, rel] of Object.entries(nation.relations)) {
      const other = state.nations[otherId];
      if (!other?.alive) continue;
      // opinion drifts toward 0 (D1)
      rel.opinion -= Math.sign(rel.opinion) * Math.min(Math.abs(rel.opinion), BAL.opinionDecay);
      // fear tracks the power ratio, sharper for neighbors
      const ratio = (powers.get(otherId) ?? 1) / Math.max(1, myPower);
      const adjacent = (ADJACENCY[nation.id] ?? []).includes(otherId);
      const targetFear = clamp((ratio - 0.8) * 40 * (adjacent ? 1.6 : 0.7) + (atWarWith(state, nation.id, otherId) ? 25 : 0), 0, 95);
      rel.fear += clamp(targetFear - rel.fear, -3, 3);
      // shared bloc membership slowly builds trust (D4)
      if (nation.blocId && nation.blocId === other.blocId) rel.trust = clamp(rel.trust + 0.3, 0, 100);
      // embargo grates (R5)
      if (other.embargoes.includes(nation.id)) rel.opinion = clamp(rel.opinion - 1.5, -100, 100);
    }

    // memories fade a little each year, vengeful nations hold them longer (D2)
    if (state.turn % 12 === 0) {
      const fade = nation.personality === 'vengeful' ? 0.06 : 0.18;
      for (const m of nation.memory) m.weight *= 1 - fade;
      nation.memory = nation.memory.filter((m) => Math.abs(m.weight) > 0.2);
    }
  }

  // world tension cools steadily and faster in quiet months (D10)
  state.worldTension = clamp(state.worldTension - BAL.tensionDecay * 0.6, 0, 100);
  if (!state.wars.length && !state.crises.length) {
    state.worldTension = clamp(state.worldTension - BAL.tensionDecay, 0, 100);
  }
  // active wars keep tension simmering
  state.worldTension = clamp(state.worldTension + state.wars.length * 0.25, 0, 100);

  // war support drains during war; recovers in peace (W7)
  for (const nation of Object.values(state.nations)) {
    if (!nation.alive) continue;
    const atWar = state.wars.some((w) => involved(w, nation.id));
    if (atWar) {
      nation.warSupport = clamp(nation.warSupport - BAL.warSupportDecay - nation.warExhaustion / 50, 0, 100);
    } else {
      nation.warSupport = clamp(nation.warSupport + 0.4, 0, 100);
      nation.warExhaustion = clamp(nation.warExhaustion - 0.8, 0, 100);
    }
  }
}

/** D2 — net remembered weight `owner` holds about `about`. */
export function memoryScore(nation: NationState, about: string): number {
  return nation.memory.filter((m) => m.vs === about).reduce((s, m) => s + m.weight, 0);
}

/** How warmly `owner` regards `about`, all things considered (drives AI). */
export function regard(state: GameState, ownerId: string, aboutId: string): number {
  const rel = getRelation(state, ownerId, aboutId);
  const owner = state.nations[ownerId];
  const about = state.nations[aboutId];
  const ideoGap =
    Math.abs(owner.ideology.auth - about.ideology.auth) +
    Math.abs(owner.ideology.planned - about.ideology.planned);
  return (
    rel.trust * 0.6 +
    rel.opinion * 0.45 +
    memoryScore(owner, aboutId) * 6 +
    (about.standing - 50) * 0.35 -
    ideoGap * 0.12 -
    rel.fear * 0.15
  );
}
