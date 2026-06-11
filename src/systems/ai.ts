/** AI nations: proposals to the player, AI-AI dealings, aggression, espionage. */
import type { Clause, GameState, NationState } from '../engine/types';
import { getRelation } from '../engine/state';
import { GOODS, GOOD_LABEL, type Good } from '../data/goods';
import { monthlyDemand, monthlyProduction } from './economy';
import { armyPower, atWarWith, regard, neighbors } from './diplomacy';
import { evaluate, pushOffer, sign } from './treaty';
import { declareWar, startFabrication } from './war';
import { setOperation } from './espionage';
import type { Rng } from '../engine/rng';

function deficits(state: GameState, nation: NationState): Partial<Record<Good, number>> {
  const production = monthlyProduction(state, nation);
  const demand = monthlyDemand(state, nation);
  const out: Partial<Record<Good, number>> = {};
  for (const g of GOODS) {
    const net = (production[g] ?? 0) - (demand[g] ?? 0);
    if (net < -0.5) out[g] = -net;
  }
  return out;
}

function surpluses(state: GameState, nation: NationState): Partial<Record<Good, number>> {
  const production = monthlyProduction(state, nation);
  const demand = monthlyDemand(state, nation);
  const out: Partial<Record<Good, number>> = {};
  for (const g of GOODS) {
    const net = (production[g] ?? 0) - (demand[g] ?? 0);
    if (net > 1) out[g] = net;
  }
  return out;
}

/** An AI nation drafts a treaty offer for the player (T1/T7 — they come to you). */
function draftPlayerOffer(state: GameState, nation: NationState, rng: Rng): void {
  const player = state.nations[state.playerId];
  if (!player.alive || atWarWith(state, nation.id, player.id)) return;
  if (state.offers.some((o) => o.from === nation.id)) return;
  const warmth = regard(state, nation.id, player.id);

  const clauses: Clause[] = [];
  let message = '';

  const need = deficits(state, nation);
  const playerSurplus = surpluses(state, player);
  const wanted = (Object.keys(need) as Good[]).find((g) => (playerSurplus[g] ?? 0) > 1);

  if (wanted && rng.chance(0.6)) {
    const qty = Math.max(1, Math.round(Math.min(need[wanted] ?? 1, playerSurplus[wanted] ?? 1)));
    const price = Math.round(state.market.prices[wanted] * qty * 1.15);
    clauses.push({ type: 'resourceContract', from: player.id, to: nation.id, good: wanted, qty, amount: price });
    message = `${nation.name} seeks a steady supply of ${GOOD_LABEL[wanted].toLowerCase()} and will pay above the market.`;
  } else if (warmth > 25 && rng.chance(0.4)) {
    clauses.push(
      { type: 'nonAggression', from: nation.id, to: player.id },
      { type: 'nonAggression', from: player.id, to: nation.id },
    );
    message = `${nation.name} proposes a pact of non-aggression.`;
  } else if (getRelation(state, nation.id, player.id).fear > 55 && rng.chance(0.5)) {
    clauses.push({ type: 'defensivePact', from: player.id, to: nation.id }, { type: 'defensivePact', from: nation.id, to: player.id });
    message = `${nation.name}, feeling the wind change, proposes a defensive pact.`;
  }

  if (!clauses.length) return;
  // only offer what they themselves would accept
  const evald = evaluate(state, nation.id, player.id, clauses, 60);
  if (evald.total < 0) return;
  pushOffer(state, { from: nation.id, clauses, duration: 60, message, expires: state.turn + 3 });
}

/** Sparse AI-AI treaty signing to keep the world alive. */
function aiToAiDeals(state: GameState, rng: Rng): void {
  const majors = Object.values(state.nations).filter((n) => n.alive && n.major && n.id !== state.playerId);
  if (!rng.chance(0.25)) return;
  const a = majors[Math.floor(rng.next() * majors.length)];
  const partners = majors.filter((m) => m.id !== a.id && !atWarWith(state, a.id, m.id));
  if (!partners.length) return;
  const b = partners.sort((x, y) => regard(state, a.id, y.id) - regard(state, a.id, x.id))[0];
  if (regard(state, a.id, b.id) < 15) return;
  if (state.treaties.some((t) => t.parties.includes(a.id) && t.parties.includes(b.id))) return;
  const need = deficits(state, a);
  const surplus = surpluses(state, b);
  const good = (Object.keys(need) as Good[]).find((g) => (surplus[g] ?? 0) > 1);
  const clauses: Clause[] = good
    ? [{ type: 'resourceContract', from: b.id, to: a.id, good, qty: Math.round(Math.min(need[good] ?? 1, surplus[good] ?? 1)), amount: Math.round(state.market.prices[good] * 1.1) }]
    : [
        { type: 'nonAggression', from: a.id, to: b.id },
        { type: 'nonAggression', from: b.id, to: a.id },
      ];
  sign(state, [a.id, b.id], clauses, 60);
}

/** Aggression: bold, strong, high-tension nations move on weak grudge targets. */
function aiAggression(state: GameState, rng: Rng): void {
  if (state.worldTension < 30) return;
  for (const nation of Object.values(state.nations)) {
    if (!nation.alive || !nation.major || nation.id === state.playerId) continue;
    if (state.wars.some((w) => w.attackers.includes(nation.id) || w.defenders.includes(nation.id))) continue;
    const bold = nation.personality === 'vengeful' || nation.personality === 'ideologue';
    if (!bold || nation.warSupport < 45) continue;

    // use an existing casus belli first
    const cb = nation.casusBelli.find((c) => state.nations[c.vs]?.alive && !atWarWith(state, nation.id, c.vs));
    if (cb && armyPower(nation) > armyPower(state.nations[cb.vs]) * 1.5 && rng.chance(0.25)) {
      declareWar(state, nation.id, cb.vs, cb.type);
      continue;
    }
    // otherwise nurse a grudge into a claim
    if (!nation.fabricating && rng.chance(0.1 + state.worldTension / 500)) {
      const grudges = nation.memory
        .filter((m) => m.weight < -2 && state.nations[m.vs]?.alive)
        .sort((a, b) => a.weight - b.weight);
      const target = grudges[0]?.vs ?? neighbors(state, nation.id).find(
        (n) => nation.ideology.natl > 50 && armyPower(nation) > armyPower(n) * 2 && getRelation(state, nation.id, n.id).opinion < -20,
      )?.id;
      if (target && target !== state.playerId) startFabrication(state, nation, target);
      else if (target === state.playerId && state.worldTension > 55) startFabrication(state, nation, target);
    }
  }
}

/** Majors keep modest intelligence efforts running. */
function aiEspionage(state: GameState, rng: Rng): void {
  if (!rng.chance(0.3)) return;
  const majors = Object.values(state.nations).filter((n) => n.alive && n.major && n.id !== state.playerId);
  const spy = majors[Math.floor(rng.next() * majors.length)];
  if (!spy) return;
  const rivals = Object.values(state.nations)
    .filter((n) => n.alive && n.id !== spy.id && regard(state, spy.id, n.id) < -10)
    .sort((a, b) => regard(state, spy.id, a.id) - regard(state, spy.id, b.id));
  if (!rivals.length) return;
  const target = rivals[0];
  const net = spy.intel[target.id];
  if (!net || !net.op) {
    setOperation(spy, target.id, rng.chance(0.6) ? 'intel' : 'influence');
  }
}

/** Embargo upkeep: AI lifts embargoes when relations mend. */
function aiEmbargoes(state: GameState): void {
  for (const nation of Object.values(state.nations)) {
    if (!nation.alive) continue;
    nation.embargoes = nation.embargoes.filter((e) => {
      const target = state.nations[e];
      if (!target?.alive) return false;
      return regard(state, nation.id, e) < 20;
    });
  }
}

export function runAi(state: GameState, rng: Rng): void {
  const majors = Object.values(state.nations).filter((n) => n.alive && n.major && n.id !== state.playerId);
  // one offer attempt per month from a warm-ish major
  const suitor = majors[Math.floor(rng.next() * majors.length)];
  if (suitor && rng.chance(0.35)) draftPlayerOffer(state, suitor, rng);
  aiToAiDeals(state, rng);
  aiAggression(state, rng);
  aiEspionage(state, rng);
  aiEmbargoes(state);

  // station AI armies on their fronts
  for (const war of state.wars) {
    for (const front of war.fronts) {
      for (const sideId of [front.attackerId, front.defenderId]) {
        if (sideId === state.playerId) continue;
        const n = state.nations[sideId];
        for (const a of n.military.armies) if (!a.frontId) a.frontId = front.id;
      }
    }
  }

  state.rngState = rng.state;
}
