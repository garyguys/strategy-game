/** T1-T8, W8 — clause valuation, negotiation, signing, breaking, expiry. */
import type { Clause, GameState, NationState, Treaty, TreatyOffer } from '../engine/types';
import { BAL } from '../engine/balance';
import { clamp, uid, dateLabel } from '../engine/util';
import { chronicle } from '../engine/chronicle';
import { getRelation } from '../engine/state';
import { monthlyDemand, monthlyProduction } from './economy';
import { GOOD_LABEL } from '../data/goods';
import { armyPower, regard, atWarWith } from './diplomacy';

export const CLAUSE_LABEL: Record<Clause['type'], string> = {
  nonAggression: 'Non-Aggression Pact',
  defensivePact: 'Defensive Pact',
  tradeAgreement: 'Trade Agreement',
  resourceContract: 'Resource Contract',
  militaryAccess: 'Military Access',
  guarantee: 'Guarantee of Independence',
  reparations: 'War Reparations',
  cession: 'Territorial Cession',
  demilitarized: 'Demilitarized Zone',
  techSharing: 'Technology Sharing',
  cash: 'Cash Payment',
  loan: 'Sovereign Loan',
};

export function describeClause(state: GameState, c: Clause): string {
  const from = state.nations[c.from]?.name ?? c.from;
  const to = state.nations[c.to]?.name ?? c.to;
  switch (c.type) {
    case 'resourceContract':
      return `${from} delivers ${c.qty} ${c.good ? GOOD_LABEL[c.good] : '?'} monthly to ${to} for ${c.amount}/mo`;
    case 'cash':
      return `${from} pays ${to} ${c.amount}`;
    case 'loan':
      return `${from} lends ${to} ${c.amount}`;
    case 'reparations':
      return `${from} pays ${to} ${c.amount}/mo in reparations`;
    case 'cession':
      return `${from} cedes ${state.regions[c.regionId ?? '']?.name ?? c.regionId} to ${to}`;
    case 'demilitarized':
      return `${from} demilitarizes ${state.regions[c.regionId ?? '']?.name ?? 'the border zone'}`;
    case 'guarantee':
      return `${from} guarantees the independence of ${to}`;
    default:
      return `${CLAUSE_LABEL[c.type]}: ${from} → ${to}`;
  }
}

/** Value of one clause to `evaluator`, in diplo-points. T1's pricing brain. */
function clauseValue(state: GameState, evaluator: NationState, other: NationState, c: Clause, months: number): number {
  const give = c.from === evaluator.id; // evaluator's obligation
  const sign = give ? -1 : 1;
  const rel = getRelation(state, evaluator.id, other.id);
  const trustFactor = 0.4 + rel.trust / 100; // promises from the untrusted are worth less
  const myPower = armyPower(evaluator);
  const theirPower = armyPower(other);
  const horizon = months === 0 ? 90 : Math.min(months, 90);

  switch (c.type) {
    case 'nonAggression':
      return rel.fear * 0.5 * trustFactor * (give ? -0.3 : 1) + 4;
    case 'defensivePact': {
      const cover = clamp((theirPower / Math.max(1, myPower)) * 18, 2, 45);
      const burden = clamp((myPower / Math.max(1, theirPower)) * 10, 2, 35);
      return give ? -burden + rel.opinion * 0.1 : cover * trustFactor;
    }
    case 'tradeAgreement':
      return 8; // mutual; both sides book a modest gain
    case 'resourceContract': {
      if (!c.good || !c.qty) return 0;
      const demand = monthlyDemand(state, evaluator)[c.good] ?? 0;
      const production = monthlyProduction(state, evaluator)[c.good] ?? 0;
      const market = state.market.prices[c.good];
      const unitGain = (c.amount ?? 0) / c.qty - market; // payment vs market price
      if (give) {
        const surplus = production - demand;
        const scarcity = surplus < c.qty ? -14 - (c.qty - Math.max(0, surplus)) : 0;
        return (unitGain * c.qty) / 10 + scarcity + 6;
      }
      const need = demand - production;
      const security = need > 0 ? clamp(need * 2.5, 0, 30) : 4; // locked supply beats spot market
      return security - (unitGain * c.qty) / 10;
    }
    case 'militaryAccess':
      return give ? -10 - rel.fear * 0.25 : 8 * trustFactor;
    case 'guarantee': {
      if (give) return -8 - clamp(theirPower / Math.max(1, myPower), 0, 1) * 14 + rel.opinion * 0.12;
      return clamp((theirPower / Math.max(1, myPower)) * 22, 4, 50) * trustFactor;
    }
    case 'reparations':
      return (sign * ((c.amount ?? 0) * horizon)) / 30;
    case 'cession': {
      const region = state.regions[c.regionId ?? ''];
      if (!region) return 0;
      const worth = region.population * 14 + region.development.industry * 10 + (region.chokepoint ? 40 : 0);
      return give ? -worth * 2.2 : worth;
    }
    case 'demilitarized':
      return give ? -16 : 14 * trustFactor;
    case 'techSharing':
      return give ? -10 : 12;
    case 'cash':
    case 'loan':
      return (sign * (c.amount ?? 0)) / 12;
  }
}

export interface Evaluation {
  total: number;
  details: { clause: Clause; value: number }[];
}

export function evaluate(
  state: GameState,
  evaluatorId: string,
  proposerId: string,
  clauses: Clause[],
  duration: number,
  warScore = 0, // W8: positive = proposer is winning, pressures acceptance
  escape = false, // T4: escape clauses make the deal worth less to the other side
): Evaluation {
  const evaluator = state.nations[evaluatorId];
  const proposer = state.nations[proposerId];
  const details = clauses.map((clause) => ({
    clause,
    value: clauseValue(state, evaluator, proposer, clause, duration),
  }));
  let total = details.reduce((s, d) => s + d.value, 0);
  total += regard(state, evaluatorId, proposerId) * 0.15;
  total += warScore;
  if (escape) total -= 12;
  // personality margin (D2)
  const margin = { pragmatic: 0, opportunist: -2, vengeful: 6, ideologue: 5 }[evaluator.personality];
  total -= margin;
  return { total, details };
}

/** T7 — build a counter-offer when a proposal falls short. */
export function counterOffer(state: GameState, evaluatorId: string, proposerId: string, clauses: Clause[], duration: number, deficit: number): Clause[] | null {
  const adjusted = clauses.map((c) => ({ ...c }));
  // 1) trim what the evaluator gives
  for (const c of adjusted) {
    if (c.from === evaluatorId && c.type === 'resourceContract' && c.qty && c.qty > 2) {
      c.qty = Math.max(1, Math.round(c.qty * 0.6));
      const evald = evaluate(state, evaluatorId, proposerId, adjusted, duration);
      if (evald.total >= 0) return adjusted;
    }
  }
  // 2) ask for cash to bridge the gap
  const ask = Math.round(Math.abs(deficit) * 9 + 10);
  if (ask < 1500) {
    adjusted.push({ type: 'cash', from: proposerId, to: evaluatorId, amount: ask });
    const evald = evaluate(state, evaluatorId, proposerId, adjusted, duration);
    if (evald.total >= 0) return adjusted;
  }
  return null;
}

export interface ProposalResult {
  outcome: 'accepted' | 'countered' | 'rejected';
  counter?: Clause[];
  reason?: string;
}

/** Player → AI proposal (T1/T7). AI → player offers land in state.offers. */
export function propose(state: GameState, fromId: string, toId: string, clauses: Clause[], duration: number, opts: { guarantorId?: string; warId?: string; escape?: boolean } = {}): ProposalResult {
  const target = state.nations[toId];
  if (!target?.alive) return { outcome: 'rejected', reason: 'No government answers.' };
  if (atWarWith(state, fromId, toId) && !opts.warId) {
    return { outcome: 'rejected', reason: 'We are at war. Sue for peace at the front, not the salon.' };
  }
  let warScore = 0;
  if (opts.warId) {
    const war = state.wars.find((w) => w.id === opts.warId);
    if (war) warScore = warScoreFor(state, war, fromId);
  }
  const evald = evaluate(state, toId, fromId, clauses, duration, warScore, opts.escape ?? false);
  if (evald.total >= 0) {
    const treaty = sign(state, [fromId, toId], clauses, duration, opts.guarantorId);
    treaty.escape = opts.escape;
    if (opts.warId) endWar(state, opts.warId, `Peace of ${dateLabel(state.turn)}`);
    return { outcome: 'accepted' };
  }
  if (evald.total > -40) {
    const counter = counterOffer(state, toId, fromId, clauses, duration, evald.total);
    if (counter) return { outcome: 'countered', counter };
  }
  return { outcome: 'rejected', reason: rejectionLine(state, toId, evald.total) };
}

function rejectionLine(state: GameState, byId: string, total: number): string {
  const by = state.nations[byId];
  const rel = getRelation(state, byId, state.playerId);
  if (rel.trust < 30) return `${by.name} does not believe we would honor it.`;
  if (total < -60) return `${by.name} considers the proposal close to an insult.`;
  return `${by.name} sees too little in it.`;
}

/** Create and record a treaty (T2/T3/T8). */
export function sign(state: GameState, parties: string[], clauses: Clause[], duration: number, guarantorId?: string): Treaty {
  const treaty: Treaty = {
    id: uid('tr'),
    parties,
    clauses,
    startTurn: state.turn,
    duration,
    guarantorId,
  };
  state.treaties.push(treaty);

  // immediate-effect clauses
  for (const c of clauses) {
    const from = state.nations[c.from];
    const to = state.nations[c.to];
    if (c.type === 'cash' && c.amount) {
      from.treasury -= c.amount;
      to.treasury += c.amount;
    }
    if (c.type === 'loan' && c.amount) {
      from.treasury -= c.amount;
      to.treasury += c.amount;
      to.debts.push({ holder: c.from, principal: c.amount, rate: 0.015 });
    }
    if (c.type === 'cession' && c.regionId) {
      transferRegion(state, c.regionId, c.to);
    }
    if (c.type === 'techSharing') {
      const donor = state.nations[c.from];
      const recipient = state.nations[c.to];
      const missing = donor.techs.filter((t) => !recipient.techs.includes(t));
      if (missing.length) recipient.techs.push(missing[0]);
    }
  }

  // signing warms relations a little
  for (const a of parties) {
    for (const b of parties) {
      if (a === b) continue;
      const rel = getRelation(state, a, b);
      rel.opinion = clamp(rel.opinion + 6, -100, 100);
      rel.trust = clamp(rel.trust + 2, 0, 100);
    }
  }

  const names = parties.map((p) => state.nations[p].name).join(' and ');
  const secret = clauses.some((c) => c.secret);
  chronicle(state, secret ? `${names} sign an accord; annexes undisclosed` : `${names} sign a ${clauses.length}-clause accord`, {
    tags: ['treaty'],
    nationId: parties[0],
  });
  return treaty;
}

export function transferRegion(state: GameState, regionId: string, toId: string): void {
  const region = state.regions[regionId];
  if (!region) return;
  const fromNation = state.nations[region.ownerId];
  const toNation = state.nations[toId];
  if (!toNation) return;
  if (fromNation) fromNation.regionIds = fromNation.regionIds.filter((r) => r !== regionId);
  region.ownerId = toId;
  region.controllerId = toId;
  region.unrest = clamp(region.unrest + 25, 0, 100);
  toNation.regionIds.push(regionId);
  if (fromNation && fromNation.regionIds.length === 0) {
    fromNation.alive = false;
    chronicle(state, `${fromNation.name} ceases to exist as an independent state`, { tags: ['war', 'treaty'] });
  }
}

/** T4 — break a treaty. Costs are the point. */
export function breakTreaty(state: GameState, breakerId: string, treaty: Treaty): void {
  state.treaties = state.treaties.filter((t) => t.id !== treaty.id);
  const breaker = state.nations[breakerId];
  if (treaty.escape) {
    chronicle(state, `${breaker.name} invokes the escape clause; the accord lapses`, { tags: ['treaty'], nationId: breakerId });
    return;
  }
  for (const p of treaty.parties) {
    if (p === breakerId) continue;
    const rel = getRelation(state, p, breakerId);
    rel.trust = clamp(rel.trust - BAL.trustBreakHit, 0, 100);
    rel.opinion = clamp(rel.opinion - 30, -100, 100);
    state.nations[p].memory.push({ turn: state.turn, vs: breakerId, text: 'Tore up our treaty.', weight: -4 });
  }
  breaker.standing = clamp(breaker.standing - BAL.standingBreakHit, 0, 100);
  // T8 — the guarantor answers
  if (treaty.guarantorId && treaty.guarantorId !== breakerId) {
    const guarantor = state.nations[treaty.guarantorId];
    if (guarantor?.alive) {
      guarantor.embargoes.push(breakerId);
      guarantor.casusBelli.push({ vs: breakerId, type: 'treaty violation', expires: state.turn + 24 });
      const rel = getRelation(state, treaty.guarantorId, breakerId);
      rel.opinion = clamp(rel.opinion - 35, -100, 100);
      chronicle(state, `${guarantor.name}, guarantor of the broken accord, answers with sanctions`, { tags: ['treaty', 'diplomacy'] });
    }
  }
  chronicle(state, `${breaker.name} repudiates its treaty obligations`, { tags: ['treaty'], nationId: breakerId });
}

/** T3 — expiry sweep; warns the player one month ahead via digest. */
export function expireTreaties(state: GameState): void {
  for (const t of [...state.treaties]) {
    if (t.duration === 0) continue;
    const left = t.startTurn + t.duration - state.turn;
    if (left === 1 && t.parties.includes(state.playerId)) {
      state.digest.push(`A treaty with ${t.parties.filter((p) => p !== state.playerId).map((p) => state.nations[p].name).join(', ')} expires next month.`);
    }
    if (left <= 0) {
      state.treaties = state.treaties.filter((x) => x.id !== t.id);
      if (t.parties.includes(state.playerId)) {
        chronicle(state, `An accord between ${t.parties.map((p) => state.nations[p].name).join(' and ')} lapses`, { tags: ['treaty'], quiet: false });
      }
    }
  }
  // expire stale offers and casus belli
  state.offers = state.offers.filter((o) => o.expires > state.turn);
  for (const n of Object.values(state.nations)) {
    n.casusBelli = n.casusBelli.filter((cb) => cb.expires > state.turn);
  }
}

/** T5 — does this treaty need a legislature vote for `nation`? */
export function needsRatification(nation: NationState, clauses: Clause[]): boolean {
  if (!nation.factions.length) return false;
  return clauses.some(
    (c) =>
      c.type === 'cession' ||
      (c.type === 'defensivePact' && c.from === nation.id) ||
      (c.type === 'guarantee' && c.from === nation.id) ||
      (c.type === 'militaryAccess' && c.from === nation.id),
  );
}

/** W8 — how strongly `sideId`'s war position weighs at the table. */
export function warScoreFor(state: GameState, war: { attackers: string[]; defenders: string[]; fronts: { progress: number }[]; casualties: Record<string, number> }, sideId: string): number {
  const attacker = war.attackers.includes(sideId);
  const frontSum = war.fronts.reduce((s, f) => s + f.progress, 0) / Math.max(1, war.fronts.length);
  const me = state.nations[sideId];
  const enemySide = attacker ? war.defenders : war.attackers;
  const enemyExhaustion = enemySide.reduce((s, e) => s + state.nations[e].warExhaustion, 0) / Math.max(1, enemySide.length);
  const myScore = (attacker ? frontSum : -frontSum) * 0.5 + enemyExhaustion * 0.45 - me.warExhaustion * 0.35;
  return clamp(myScore, -60, 60);
}

export function endWar(state: GameState, warId: string, label: string): void {
  const war = state.wars.find((w) => w.id === warId);
  if (!war) return;
  state.wars = state.wars.filter((w) => w.id !== warId);
  for (const id of [...war.attackers, ...war.defenders]) {
    const n = state.nations[id];
    if (!n) continue;
    for (const a of n.military.armies) a.frontId = null;
    n.justArmistice = [...war.attackers, ...war.defenders].filter((x) => x !== id);
  }
  state.worldTension = clamp(state.worldTension - 6, 0, 100);
  chronicle(state, `${label} ends the ${war.name}`, { tags: ['war', 'treaty'] });
}

/** Helper used by AI and congress code to draft an offer to the player. */
export function pushOffer(state: GameState, offer: Omit<TreatyOffer, 'id'>): void {
  state.offers.push({ ...offer, id: uid('off') });
}
