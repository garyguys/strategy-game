/** All tuning constants in one place. */
export const BAL = {
  // economy (R-series)
  popGrainPerMillion: 0.5, // grain consumed per million pop per month
  popConsumerPerMillion: 0.25,
  shortageUnrest: 4, // unrest per month while a civilian good is short
  factoryOutputPerIndustry: 1.0, // chain runs per industry level per region
  marketPriceDrift: 0.06, // price elasticity per unit of pressure
  marketPriceMin: 0.4, // floor as multiple of base
  marketPriceMax: 3.0,
  tariffRate: 0.15, // share of import value collected by treasury
  taxPerMillionPop: 1.6, // base tax income scaler at taxRate=1
  debtCallPenalty: 12, // standing lost on default

  // military (W-series)
  armyUpkeepArms: 0.4, // arms per 10k troops per month
  armyUpkeepOil: 0.25,
  armyUpkeepGrain: 0.3,
  recruitCostArms: 2, // per 10k troops
  recruitCostCash: 20,
  frontBaseProgress: 6, // monthly progress at 2:1 power
  occupationOutput: 0.5, // W10 production multiplier
  resistanceGrowth: 5,
  warSupportDecay: 1.2, // monthly during war
  exhaustionPerCasualty: 0.4, // per 10k casualties
  blockadeImportCut: 0.7, // share of sea imports lost under blockade

  // diplomacy (D-series)
  trustBreakHit: 35,
  standingBreakHit: 15,
  standingUnjustWar: 20,
  opinionDecay: 1, // drift toward 0 monthly
  fearPerArmyPower: 0.01,
  tensionWarStart: 12,
  tensionCrisisStep: 4,
  tensionDecay: 0.4,

  // internal (I-series)
  capitalIncomeBase: 3, // political capital per month
  unrestFromIdeologyGap: 0.5,
  minoritySuppressUnrest: 2,
  developmentCost: 80, // cash per level
  developmentMonths: 6,
  electionPeriod: 48, // months between elections
  researchPerEducation: 1, // research points per avg education level

  // espionage (D7)
  networkGrowth: 6, // per month while building
  opBaseRisk: 0.25,

  // legacy (E3)
  version: 1,
} as const;
