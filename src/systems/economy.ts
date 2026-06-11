/** R1-R8 — production, industry, market, contracts, consumption, budget, debt. */
import type { GameState, NationState } from '../engine/types';
import { GOODS, CHAINS, BASE_PRICE, type Good } from '../data/goods';
import { BAL } from '../engine/balance';
import { clamp } from '../engine/util';
import { chronicle } from '../engine/chronicle';
import { nationMods } from './mods';
import { getRelation } from '../engine/state';
import type { Rng } from '../engine/rng';

export function controlledRegions(state: GameState, nation: NationState) {
  return Object.values(state.regions).filter((r) => r.controllerId === nation.id);
}

/** Is `nation` under effective naval blockade? (W6/R5) */
export function isBlockaded(state: GameState, nation: NationState): boolean {
  return Object.values(state.nations).some(
    (n) => n.alive && n.military.navalMission === 'blockade' && n.military.navalTarget === nation.id && n.military.navy > nation.military.navy,
  );
}

/** Chokepoint holders who have closed the straits to `nation` (R6). */
export function straitsClosedAgainst(state: GameState, nation: NationState): boolean {
  return Object.values(state.nations).some(
    (holder) =>
      holder.alive &&
      holder.flags[`closeStraits_${nation.id}`] === true &&
      controlledRegions(state, holder).some((r) => r.chokepoint),
  );
}

function industryCapacity(state: GameState, nation: NationState): number {
  let total = 0;
  for (const r of controlledRegions(state, nation)) {
    let cap = r.development.industry;
    if (r.ownerId !== nation.id) cap *= BAL.occupationOutput * (1 - (r.resistance ?? 0) / 200);
    total += cap;
  }
  return total;
}

export function monthlyProduction(state: GameState, nation: NationState): Partial<Record<Good, number>> {
  const mods = nationMods(nation);
  const out: Partial<Record<Good, number>> = {};
  for (const r of controlledRegions(state, nation)) {
    let mult = 1 + 0.08 * (r.development.infra - 1);
    if (r.ownerId !== nation.id) mult *= BAL.occupationOutput * (1 - (r.resistance ?? 0) / 200);
    mult *= 1 - r.unrest / 250;
    for (const [g, qty] of Object.entries(r.production)) {
      const good = g as Good;
      out[good] = (out[good] ?? 0) + (qty ?? 0) * mult * (1 + (mods.prodMult[good] ?? 0));
    }
  }
  return out;
}

/** Civilian + military demand per month (R3). */
export function monthlyDemand(state: GameState, nation: NationState): Partial<Record<Good, number>> {
  const pop = controlledRegions(state, nation).reduce((s, r) => s + r.population, 0);
  const troops = nation.military.armies.reduce((s, a) => s + a.strength, 0) / 10;
  return {
    grain: pop * BAL.popGrainPerMillion + troops * BAL.armyUpkeepGrain,
    consumerGoods: pop * BAL.popConsumerPerMillion,
    arms: troops * BAL.armyUpkeepArms * (state.wars.some((w) => involved(w, nation.id)) ? 1.6 : 0.5),
    oil: troops * BAL.armyUpkeepOil + nation.military.navy * 0.1 + nation.military.air * 0.1,
  };
}

export function involved(war: { attackers: string[]; defenders: string[] }, id: string): boolean {
  return war.attackers.includes(id) || war.defenders.includes(id);
}

function runChains(nation: NationState, capacity: number): void {
  // capacity split: steel 35%, machinery 15%, consumer 30%, arms 20%
  const split = [0.35, 0.15, 0.3, 0.2];
  CHAINS.forEach((chain, i) => {
    let runs = capacity * split[i] * BAL.factoryOutputPerIndustry;
    for (const [g, need] of Object.entries(chain.inputs)) {
      runs = Math.min(runs, (nation.stockpiles[g as Good] ?? 0) / (need ?? 1));
    }
    runs = Math.max(0, Math.floor(runs * 10) / 10);
    if (runs <= 0) return;
    for (const [g, need] of Object.entries(chain.inputs)) {
      nation.stockpiles[g as Good] -= (need ?? 0) * runs;
    }
    nation.stockpiles[chain.output] += chain.qty * runs;
  });
}

/** Execute resource contracts & reparations from active treaties (R4/T2). */
function runContracts(state: GameState): void {
  for (const treaty of state.treaties) {
    for (const clause of treaty.clauses) {
      const from = state.nations[clause.from];
      const to = state.nations[clause.to];
      if (!from?.alive || !to?.alive) continue;
      if (clause.type === 'resourceContract' && clause.good && clause.qty) {
        const sent = Math.min(clause.qty, from.stockpiles[clause.good]);
        from.stockpiles[clause.good] -= sent;
        to.stockpiles[clause.good] += sent;
        const pay = (clause.amount ?? 0) * (sent / clause.qty);
        to.treasury -= pay;
        from.treasury += pay;
        if (sent < clause.qty * 0.6) {
          // chronic under-delivery sours the buyer
          getRelation(state, clause.to, clause.from).trust = clamp(
            getRelation(state, clause.to, clause.from).trust - 1,
            0,
            100,
          );
        }
      }
      if (clause.type === 'reparations' && clause.amount) {
        const pay = Math.min(clause.amount, Math.max(0, from.treasury));
        from.treasury -= pay;
        to.treasury += pay;
      }
    }
  }
}

/** AI nations trade their net positions on the world market; prices drift (R4). */
function runMarket(state: GameState): void {
  const pressure = Object.fromEntries(GOODS.map((g) => [g, 0])) as Record<Good, number>;

  for (const nation of Object.values(state.nations)) {
    if (!nation.alive) continue;
    const production = monthlyProduction(state, nation);
    const demand = monthlyDemand(state, nation);
    const mods = nationMods(nation);
    const blockaded = isBlockaded(state, nation);
    const strangled = straitsClosedAgainst(state, nation);
    const accessPenalty = (blockaded ? BAL.blockadeImportCut : 0) + (strangled ? 0.35 : 0);
    const isPlayer = nation.id === state.playerId;

    let tariffIncome = 0;
    for (const g of GOODS) {
      const net = (production[g] ?? 0) - (demand[g] ?? 0);
      const stock = nation.stockpiles[g];
      const price = state.market.prices[g];

      if (!isPlayer) {
        // AI: buy to cover deficits (keep ~3 months buffer), sell surpluses above 6 months.
        const want = Math.max(0, (demand[g] ?? 0) * 3 - stock - Math.max(0, net) * 2);
        if (want > 0.5 && nation.treasury > 0) {
          let qty = Math.min(want, nation.treasury / (price * 1.2));
          qty *= 1 - Math.min(0.9, accessPenalty);
          nation.stockpiles[g] += qty;
          nation.treasury -= qty * price;
          tariffIncome += qty * price * BAL.tariffRate;
          pressure[g] -= qty;
        }
        const excess = stock + net * 2 - Math.max(3, (demand[g] ?? 0) * 6);
        if (excess > 1) {
          const qty = Math.min(excess, (production[g] ?? 0) * 2 + 2);
          nation.stockpiles[g] -= qty;
          nation.treasury += qty * price * (1 + mods.tradeBonus);
          pressure[g] += qty;
        }
      }
    }
    nation.treasury += tariffIncome * 0.2; // sliver of tariffs on AI flows
  }

  // chokepoint tolls (R6)
  for (const nation of Object.values(state.nations)) {
    if (!nation.alive) continue;
    const straits = controlledRegions(state, nation).filter((r) => r.chokepoint);
    if (straits.length) nation.treasury += straits.length * 6;
  }

  for (const g of GOODS) {
    const drift = clamp(pressure[g] * BAL.marketPriceDrift * -0.02, -0.6, 0.6);
    const target = state.market.prices[g] * (1 + drift);
    state.market.prices[g] = clamp(target, BASE_PRICE[g] * BAL.marketPriceMin, BASE_PRICE[g] * BAL.marketPriceMax);
    state.market.pressure[g] = pressure[g];
  }
}

/** Player-facing market order (R4/R5/R6 access rules included). */
export function marketOrder(state: GameState, nation: NationState, good: Good, qty: number): string | null {
  const price = state.market.prices[good];
  if (qty > 0) {
    const access = 1 - (isBlockaded(state, nation) ? BAL.blockadeImportCut : 0) - (straitsClosedAgainst(state, nation) ? 0.35 : 0);
    const real = Math.min(qty, qty * Math.max(0.1, access));
    const cost = real * price;
    if (nation.treasury < cost) return 'The treasury cannot cover this order.';
    nation.treasury -= cost;
    nation.stockpiles[good] += real;
    state.market.pressure[good] -= real;
    if (real < qty) return `Blockade runners delivered only ${real.toFixed(0)} of ${qty}.`;
  } else {
    const sell = Math.min(-qty, nation.stockpiles[good]);
    if (sell <= 0) return 'Nothing in the stockpile to sell.';
    const mods = nationMods(nation);
    nation.stockpiles[good] -= sell;
    nation.treasury += sell * price * (1 + mods.tradeBonus);
    state.market.pressure[good] += sell;
  }
  return null;
}

function consume(state: GameState, nation: NationState): void {
  const demand = monthlyDemand(state, nation);
  const civilian: Good[] = ['grain', 'consumerGoods'];
  for (const g of Object.keys(demand) as Good[]) {
    const need = demand[g] ?? 0;
    const got = Math.min(need, nation.stockpiles[g]);
    nation.stockpiles[g] -= got;
    const shortfall = need > 0 ? 1 - got / need : 0;
    if (shortfall > 0.25) {
      if (civilian.includes(g)) {
        for (const rid of nation.regionIds) {
          const r = state.regions[rid];
          if (r) r.unrest = clamp(r.unrest + BAL.shortageUnrest * shortfall, 0, 100);
        }
        nation.flags[`short_${g}`] = state.turn;
      } else {
        // military shortage: organization bleeds (W5)
        for (const a of nation.military.armies) a.organization = clamp(a.organization - 8 * shortfall, 5, 100);
      }
    }
  }
}

function budget(state: GameState, nation: NationState, rng: Rng): void {
  const mods = nationMods(nation);
  const pop = controlledRegions(state, nation).reduce((s, r) => s + r.population * (1 + 0.05 * (r.development.education - 1)), 0);
  const tax = pop * BAL.taxPerMillionPop * nation.taxRate;
  const troops = nation.military.armies.reduce((s, a) => s + a.strength, 0);
  const upkeep = troops * 0.06 + nation.military.navy * 0.5 + nation.military.air * 0.4;
  const interest = nation.debts.reduce((s, d) => s + d.principal * d.rate, 0);

  nation.treasury += tax * (1 + mods.tradeBonus * 0.5) - upkeep - interest;

  // amortize debts slightly
  for (const d of nation.debts) d.principal = Math.max(0, d.principal - tax * 0.02);
  nation.debts = nation.debts.filter((d) => d.principal > 1);

  // distressed borrowing / default (R7)
  if (nation.treasury < 0) {
    const need = -nation.treasury + 20;
    const debtLoad = nation.debts.reduce((s, d) => s + d.principal, 0);
    if (debtLoad < pop * 12) {
      nation.debts.push({ holder: 'market', principal: need, rate: 0.02 });
      nation.treasury += need;
    } else if (rng.chance(0.3)) {
      // default
      nation.standing = clamp(nation.standing - BAL.debtCallPenalty, 0, 100);
      for (const d of nation.debts) {
        if (d.holder !== 'market') {
          const rel = getRelation(state, d.holder, nation.id);
          rel.trust = clamp(rel.trust - 20, 0, 100);
          rel.opinion = clamp(rel.opinion - 25, -100, 100);
          state.nations[d.holder]?.memory.push({ turn: state.turn, vs: nation.id, text: 'Defaulted on our loans.', weight: -3 });
        }
      }
      nation.debts = [];
      chronicle(state, `${nation.name} defaults on its sovereign debt`, { tags: ['economy'], nationId: nation.id });
    }
  }

  // development projects complete (I5)
  for (const p of nation.projects) {
    p.monthsLeft--;
    if (p.monthsLeft <= 0) {
      const r = state.regions[p.regionId];
      if (r && r.development[p.kind] < 5) r.development[p.kind]++;
    }
  }
  nation.projects = nation.projects.filter((p) => p.monthsLeft > 0);
}

export function runEconomy(state: GameState, rng: Rng): void {
  runContracts(state);
  for (const nation of Object.values(state.nations)) {
    if (!nation.alive) continue;
    const production = monthlyProduction(state, nation);
    for (const [g, qty] of Object.entries(production)) {
      nation.stockpiles[g as Good] += qty ?? 0;
    }
    runChains(nation, industryCapacity(state, nation));
    consume(state, nation);
    budget(state, nation, rng);
  }
  runMarket(state);
}
