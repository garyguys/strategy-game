import type { Good } from '../data/goods';

export type NationId = string;
export type CharId = string;
export type RegionId = string;

/** N3 — three ideology axes, each -100..100. */
export interface Ideology {
  /** authoritarian (+) vs democratic (-) */
  auth: number;
  /** planned (+) vs market (-) */
  planned: number;
  /** nationalist (+) vs internationalist (-) */
  natl: number;
}

/** D1 — per-pair relationship tracks. */
export interface Relation {
  /** 0..100, slow-moving, scars permanently */
  trust: number;
  /** -100..100, fast-moving */
  opinion: number;
  /** 0..100, driven by military and proximity */
  fear: number;
}

export type Personality = 'vengeful' | 'pragmatic' | 'ideologue' | 'opportunist';

export type CharRole =
  | 'leader'
  | 'minister'
  | 'general'
  | 'opposition'
  | 'journalist'
  | 'diplomat'
  | 'magnate'
  | 'union'
  | 'family';

export type MinisterPost = 'foreign' | 'economy' | 'defense' | 'interior';

/** E2 — one entry in a character's personal history. */
export interface DossierEntry {
  turn: number;
  text: string;
}

export interface Character {
  id: CharId;
  nationId: NationId;
  name: string;
  role: CharRole;
  title: string;
  bio: string;
  traits: string[];
  competence: number; // 0..100
  loyalty: number; // 0..100
  ideology: Ideology;
  alive: boolean;
  post: MinisterPost | null;
  log: DossierEntry[]; // E2 running history
}

export interface Faction {
  id: string;
  name: string;
  ideology: Ideology;
  seats: number; // share of legislature, sums ~100 per nation
}

export type MinorityPolicy = 'integrate' | 'autonomy' | 'suppress';

export interface Region {
  id: RegionId;
  name: string;
  ownerId: NationId;
  /** differs from owner under occupation (W10) */
  controllerId: NationId;
  production: Partial<Record<Good, number>>;
  development: { infra: number; industry: number; education: number }; // 1..5
  population: number; // millions
  unrest: number; // 0..100 (I4)
  minority?: { name: string; tiedTo?: NationId; share: number; policy: MinorityPolicy }; // I8
  chokepoint?: string; // R6 — name of the strait this region commands
  resistance?: number; // W10 partisan pressure 0..100
}

export interface Army {
  id: string;
  name: string;
  generalId: CharId | null;
  strength: number; // thousands of troops
  composition: { inf: number; art: number; arm: number }; // shares summing to 100
  organization: number; // 0..100
  frontId: string | null;
}

export type NavalMission = 'patrol' | 'blockade' | 'escort' | 'bombing' | 'portStrike' | null;

export interface Military {
  armies: Army[];
  doctrine: string | null;
  navy: number; // abstract naval power
  air: number; // abstract air power
  navalMission: NavalMission;
  navalTarget: NationId | null;
  manpower: number; // thousands available to recruit
}

export interface DebtInstrument {
  holder: NationId | 'market';
  principal: number;
  rate: number; // monthly interest fraction
}

export type ClauseType =
  | 'nonAggression'
  | 'defensivePact'
  | 'tradeAgreement'
  | 'resourceContract'
  | 'militaryAccess'
  | 'guarantee'
  | 'reparations'
  | 'cession'
  | 'demilitarized'
  | 'techSharing'
  | 'cash'
  | 'loan';

export interface Clause {
  type: ClauseType;
  /** nation providing the obligation */
  from: NationId;
  /** nation receiving the benefit */
  to: NationId;
  good?: Good;
  qty?: number; // units per month (resourceContract) or lump (cash/reparations)
  amount?: number; // cash amounts
  regionId?: RegionId; // cession / demilitarized
  secret?: boolean; // T6
}

export interface Treaty {
  id: string;
  parties: NationId[];
  clauses: Clause[];
  startTurn: number;
  /** months, or 0 = permanent (T3) */
  duration: number;
  guarantorId?: NationId; // T8
  escape?: boolean; // T4 escape clause purchased
  exposedSecrets?: boolean;
}

export type SpyOpKind = 'intel' | 'influence' | 'sabotage' | 'counterintel' | 'rig' | 'coup';

export interface SpyNetwork {
  network: number; // 0..100
  op: SpyOpKind | null;
}

export interface CasusBelli {
  vs: NationId;
  type: string;
  expires: number; // turn
}

export interface NationState {
  id: NationId;
  name: string;
  color: number;
  major: boolean;
  playable: boolean;
  alive: boolean; // false once annexed
  leaderId: CharId;
  ministers: Partial<Record<MinisterPost, CharId>>;
  government: string;
  note?: string; // one-line situation blurb for panels/intro
  ideology: Ideology;
  personality: Personality; // D2
  politicalCapital: number; // I2
  stability: number; // 0..100
  warSupport: number; // 0..100 (W7)
  warExhaustion: number; // 0..100
  standing: number; // 0..100 (D3)
  treasury: number;
  taxRate: number; // 0..1-ish lever
  debts: DebtInstrument[]; // R7
  stockpiles: Record<Good, number>;
  regionIds: RegionId[];
  military: Military;
  techs: string[];
  research: { current: string | null; progress: number }; // I7
  agenda: { completed: string[]; current: string | null; progress: number }; // I6
  relations: Record<NationId, Relation>;
  /** D2 — remembered slights/favors: positive weight = gratitude */
  memory: { turn: number; vs: NationId; text: string; weight: number }[];
  press: 'free' | 'pressured' | 'state'; // I11
  factions: Faction[]; // empty for autocracies
  electionDue: number | null; // turn of next election (I10)
  embargoes: NationId[]; // R5
  intel: Record<NationId, SpyNetwork>; // D7
  casusBelli: CasusBelli[]; // W1
  fabricating: { vs: NationId; progress: number } | null;
  blocId: string | null; // D4
  /** I5 — running development projects */
  projects: { regionId: RegionId; kind: 'infra' | 'industry' | 'education'; monthsLeft: number }[];
  justArmistice: NationId[]; // truce partners
  flags: Record<string, number | boolean | string>;
  /** Nations whose ruler this nation installed / controls informally */
  overlordOf: NationId[];
}

export interface Front {
  id: string;
  attackerId: NationId;
  defenderId: NationId;
  /** -100 (attacker crushed) .. +100 (defender crushed -> occupation) */
  progress: number;
  name: string;
}

export interface War {
  id: string;
  name: string;
  attackers: NationId[];
  defenders: NationId[];
  goal: string;
  fronts: Front[];
  startTurn: number;
  casualties: Record<NationId, number>;
  /** set when one side sues for peace; opens W8 negotiation */
  armistice?: boolean;
}

/** D6 — incident escalation ladder. */
export interface Crisis {
  id: string;
  kind: string;
  title: string;
  a: NationId; // initiator / accuser
  b: NationId; // other party
  stage: number; // 0..4, 4 = war brink
  turnsAtStage: number;
  lastMove?: string;
}

export interface Bloc {
  id: string;
  name: string;
  kind: 'alliance' | 'trade';
  leaderId: NationId;
  members: NationId[];
}

export interface Market {
  prices: Record<Good, number>;
  /** net world surplus(+)/deficit(-) last turn, drives price drift */
  pressure: Record<Good, number>;
}

/** E1 — one Chronicle entry; effects[] makes cause->consequence browsable. */
export interface ChronicleEntry {
  id: string;
  turn: number;
  headline: string;
  body?: string;
  tags: string[];
  nationId?: NationId;
  causeId?: string; // links back to the entry that caused this one
}

// ---------- Narrative / event DSL (N2, N5, E8) ----------

export interface EffectCtx {
  state: GameState;
  nation: NationState; // the nation experiencing the effect (usually player)
  causeId?: string; // chronicle threading
}

/** Effects are functions in data files; state stays JSON-serializable. */
export type Effect = (ctx: EffectCtx) => void;

export interface SceneOption {
  id: string;
  text: string;
  /** shown but disabled when false */
  enabled?: (ctx: EffectCtx) => boolean;
  effects: Effect[];
}

export interface SceneDef {
  id: string;
  title: string;
  /** character id, or plain display name for one-offs */
  speaker?: string;
  text: (ctx: EffectCtx) => string;
  options: SceneOption[];
}

export interface EventDef {
  id: string;
  /** which nation's player sees it; 'any' = playable owner matched by condition */
  nationId: NationId | 'any';
  condition: (state: GameState, nation: NationState) => boolean;
  /** scene to queue when fired */
  sceneId: string;
  once?: boolean;
  cooldown?: number; // months before refire
  weight?: number; // for random pick among eligible
}

export interface QueuedScene {
  sceneId: string;
  nationId: NationId;
  turn: number; // earliest turn it may show (N6 delayed consequences)
  causeId?: string;
}

export interface GameOver {
  reason: string;
  epilogue: string[];
  legacy: Record<string, number>; // E3 axes
}

// ---------- Research & agenda data shapes (I6, I7) ----------

/** Passive modifiers granted by completed techs/agenda nodes. */
export interface Mods {
  prodMult?: Partial<Record<Good, number>>; // +0.1 = +10% output of that good
  armyPower?: number; // fractional bonus, e.g. 0.1
  navyPower?: number;
  airPower?: number;
  intelBonus?: number; // network growth bonus
  capitalBonus?: number; // political capital per month
  researchBonus?: number; // research points per month
  tradeBonus?: number; // tariff/trade income multiplier bonus
  stabilityBonus?: number; // monthly stability drift bonus
}

export interface TechDef {
  id: string;
  branch: 'industry' | 'military' | 'statecraft';
  year: number; // not researchable before Jan 1 of this year
  cost: number; // research points
  label: string;
  blurb: string; // one sentence (I7)
  mods: Mods;
}

export interface AgendaNode {
  id: string;
  tree: NationId | 'generic';
  title: string;
  blurb: string;
  months: number; // time to complete
  requires?: string[]; // node ids
  condition?: (state: GameState, nation: NationState) => boolean; // ideology/story gates
  effects: Effect[]; // applied on completion
  mods?: Mods;
}

/** T7 — an AI-proposed (or counter-) offer awaiting the player's answer. */
export interface TreatyOffer {
  id: string;
  from: NationId;
  clauses: Clause[];
  duration: number;
  guarantorId?: NationId;
  message: string;
  expires: number; // turn
  /** set when this offer is a counter to a player proposal */
  counter?: boolean;
  /** peace negotiation context (W8) */
  warId?: string;
}

export interface GameState {
  version: number;
  seed: number;
  rngState: number;
  turn: number; // months since Jan 1936
  playerId: NationId;
  /** ids of leaders the player has already played as (I10 succession) */
  formerLeaders: CharId[];
  nations: Record<NationId, NationState>;
  characters: Record<CharId, Character>;
  regions: Record<RegionId, Region>;
  market: Market;
  treaties: Treaty[];
  offers: TreatyOffer[];
  wars: War[];
  crises: Crisis[];
  blocs: Bloc[];
  worldTension: number; // 0..100 (D10)
  leagueAuthority: number; // 0..100 (D9)
  chronicle: ChronicleEntry[];
  sceneQueue: QueuedScene[];
  fired: Record<string, number>; // eventId -> turn fired (once/cooldown)
  flags: Record<string, number | boolean | string>;
  digest: string[]; // headlines accumulated during current turn (N9)
  ledgerMode: boolean; // E6
  gameOver: GameOver | null;
}
