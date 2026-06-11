/** R1 — the ten goods, in three tiers. */
export const GOODS = [
  'grain',
  'coal',
  'ironOre',
  'oil',
  'rareMetals',
  'steel',
  'machinery',
  'consumerGoods',
  'arms',
  'luxuryGoods',
] as const;

export type Good = (typeof GOODS)[number];

export const GOOD_LABEL: Record<Good, string> = {
  grain: 'Grain',
  coal: 'Coal',
  ironOre: 'Iron Ore',
  oil: 'Oil',
  rareMetals: 'Rare Metals',
  steel: 'Steel',
  machinery: 'Machinery',
  consumerGoods: 'Consumer Goods',
  arms: 'Arms',
  luxuryGoods: 'Luxury Goods',
};

/** Base market price per unit (R4). Prices float around these. */
export const BASE_PRICE: Record<Good, number> = {
  grain: 2,
  coal: 3,
  ironOre: 4,
  oil: 8,
  rareMetals: 12,
  steel: 7,
  machinery: 10,
  consumerGoods: 5,
  arms: 14,
  luxuryGoods: 9,
};

/** Industrial conversion chains (R1): inputs consumed -> outputs per factory point. */
export const CHAINS: { inputs: Partial<Record<Good, number>>; output: Good; qty: number }[] = [
  { inputs: { ironOre: 2, coal: 1 }, output: 'steel', qty: 2 },
  { inputs: { steel: 1, coal: 1 }, output: 'machinery', qty: 1 },
  { inputs: { steel: 2, machinery: 1 }, output: 'arms', qty: 2 },
  { inputs: { coal: 1 }, output: 'consumerGoods', qty: 2 },
];
