import type {
  Character,
  GameState,
  NationId,
  NationState,
  Region,
  Relation,
} from './types';
import { GOODS, type Good } from '../data/goods';
import { BASE_PRICE } from '../data/goods';
import { MAJOR_NATIONS, MINOR_PALETTE, NAME_ALIASES } from '../data/nations';
import { REGIONS, MINOR_CHOKEPOINTS } from '../data/regions';
import { CHARACTERS } from '../data/characters';
import { BAL } from './balance';
import { Rng } from './rng';
import { uid } from './util';

export interface CountryRef {
  id: string;
  subjecto?: string | null;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function emptyStockpiles(): Record<Good, number> {
  const s = {} as Record<Good, number>;
  for (const g of GOODS) s[g] = 0;
  return s;
}

const SYL_A = ['Al', 'Bo', 'Ca', 'Da', 'Es', 'Fa', 'Go', 'Ha', 'Is', 'Jo', 'Ka', 'Lu', 'Ma', 'Ni', 'Or'];
const SYL_B = ['ren', 'mir', 'lan', 'dor', 'vez', 'rik', 'sun', 'tan', 'bel', 'mon', 'das', 'ler', 'vin', 'rao', 'gul'];
const MINOR_GOV = ['Republic', 'Kingdom', 'Military Government', 'Dominion'];
const MINOR_TITLE: Record<string, string> = {
  Republic: 'President',
  Kingdom: 'King',
  'Military Government': 'General',
  Dominion: 'Premier',
};

/** Resolve a basemap SUBJECTO string to a nation key if it names a major. */
export function resolveController(id: string, subjecto?: string | null): string {
  if (!subjecto || subjecto === id) return id;
  const alias = NAME_ALIASES[subjecto] ?? subjecto;
  return MAJOR_NATIONS[alias] ? alias : id;
}

function initRelation(): Relation {
  return { trust: 50, opinion: 0, fear: 10 };
}

export function getRelation(state: GameState, owner: NationId, about: NationId): Relation {
  const n = state.nations[owner];
  return (n.relations[about] ??= initRelation());
}

function makeMinorLeader(nationId: string, government: string, h: number): Character {
  const name = `${SYL_A[h % SYL_A.length]}${SYL_B[(h >> 3) % SYL_B.length]} ${SYL_A[(h >> 6) % SYL_A.length]}${SYL_B[(h >> 9) % SYL_B.length]}`;
  return {
    id: `ldr_${nationId.replace(/\W+/g, '_').toLowerCase()}`,
    nationId,
    name,
    role: 'leader',
    title: MINOR_TITLE[government],
    bio: 'Holds power in a nation the great chancelleries rarely discuss — which suits everyone involved.',
    traits: ['provincial'],
    competence: 40 + (h % 40),
    loyalty: 100,
    ideology: { auth: (h % 120) - 50, planned: ((h >> 2) % 100) - 50, natl: ((h >> 4) % 100) - 40 },
    alive: true,
    post: null,
    log: [],
  };
}

export function initialState(countries: CountryRef[], playerId: NationId, seed: number): GameState {
  const rng = new Rng(seed);
  const state: GameState = {
    version: BAL.version,
    seed,
    rngState: seed,
    turn: 0,
    playerId,
    formerLeaders: [],
    nations: {},
    characters: {},
    regions: {},
    market: { prices: { ...BASE_PRICE }, pressure: Object.fromEntries(GOODS.map((g) => [g, 0])) as Record<Good, number> },
    treaties: [],
    offers: [],
    wars: [],
    crises: [],
    blocs: [],
    worldTension: 18,
    leagueAuthority: 45,
    chronicle: [],
    sceneQueue: [],
    fired: {},
    flags: {},
    digest: [],
    ledgerMode: false,
    gameOver: null,
  };

  for (const c of CHARACTERS) state.characters[c.id] = structuredClone(c);

  // Major + minor nations from the map's feature list.
  const seen = new Set<string>();
  for (const ref of countries) {
    const controller = resolveController(ref.id, ref.subjecto);
    if (controller !== ref.id) continue; // colonies/SSRs fold into their overlord
    if (seen.has(ref.id)) continue;
    seen.add(ref.id);

    const def = MAJOR_NATIONS[ref.id];
    const h = hash(ref.id);
    if (def) {
      const cast = CHARACTERS.filter((c) => c.nationId === ref.id);
      const leader = cast.find((c) => c.role === 'leader')!;
      const ministers: NationState['ministers'] = {};
      for (const c of cast) if (c.post) ministers[c.post] = c.id;

      const generals = cast.filter((c) => c.role === 'general');
      const armies = [];
      const nArmies = Math.max(1, Math.min(4, Math.round(def.military.troops / 150)));
      for (let i = 0; i < nArmies; i++) {
        armies.push({
          id: uid('army'),
          name: `${i + 1}. Army`,
          generalId: generals[i % Math.max(1, generals.length)]?.id ?? null,
          strength: Math.round(def.military.troops / nArmies),
          composition: { inf: 70, art: 20, arm: 10 },
          organization: 60,
          frontId: null,
        });
      }

      state.nations[ref.id] = {
        id: ref.id,
        name: def.name,
        color: def.color,
        major: true,
        playable: def.playable,
        alive: true,
        leaderId: leader.id,
        ministers,
        government: def.government,
        note: def.note,
        ideology: { ...def.ideology },
        personality: def.personality,
        politicalCapital: 10,
        stability: def.stability,
        warSupport: def.warSupport,
        warExhaustion: 0,
        standing: def.standing,
        treasury: def.treasury,
        taxRate: 0.5,
        debts: [],
        stockpiles: { ...emptyStockpiles(), ...def.stockpiles },
        regionIds: [],
        military: {
          armies,
          doctrine: null,
          navy: def.military.navy,
          air: def.military.air,
          navalMission: null,
          navalTarget: null,
          manpower: Math.round(def.military.troops * 0.8),
        },
        techs: [],
        research: { current: null, progress: 0 },
        agenda: { completed: [], current: null, progress: 0 },
        relations: {},
        memory: [],
        press: def.press,
        factions: (def.factions ?? []).map((f, i) => ({ ...f, id: `${ref.id}_f${i}` })),
        electionDue: def.electionIn ?? null,
        embargoes: [],
        intel: {},
        casusBelli: [],
        fabricating: null,
        blocId: null,
        projects: [],
        justArmistice: [],
        flags: {},
        overlordOf: [],
      };

      for (const rd of REGIONS[ref.id] ?? []) {
        const region: Region = {
          id: rd.id,
          name: rd.name,
          ownerId: ref.id,
          controllerId: ref.id,
          production: { ...rd.production },
          development: { ...rd.development },
          population: rd.population,
          unrest: 8,
          minority: rd.minority ? { ...rd.minority } : undefined,
          chokepoint: rd.chokepoint,
        };
        state.regions[region.id] = region;
        state.nations[ref.id].regionIds.push(region.id);
      }
    } else {
      // Minor nation: generated single region + leader.
      const government = MINOR_GOV[h % MINOR_GOV.length];
      const leader = makeMinorLeader(ref.id, government, h);
      state.characters[leader.id] = leader;
      const pop = 1 + (h % 9);
      const goodsPool: Good[] = ['grain', 'grain', 'coal', 'ironOre', 'oil', 'rareMetals', 'luxuryGoods'];
      const regionId = `min_${ref.id.replace(/\W+/g, '_').toLowerCase()}`;
      const production: Partial<Record<Good, number>> = { grain: 2 + (h % 6) };
      const extra = goodsPool[(h >> 5) % goodsPool.length];
      production[extra] = (production[extra] ?? 0) + 2 + ((h >> 8) % 5);

      state.regions[regionId] = {
        id: regionId,
        name: ref.id,
        ownerId: ref.id,
        controllerId: ref.id,
        production,
        development: { infra: 1 + (h % 3), industry: 1 + ((h >> 2) % 2), education: 1 + ((h >> 4) % 3) },
        population: pop,
        unrest: 10,
        chokepoint: MINOR_CHOKEPOINTS[ref.id],
      };

      state.nations[ref.id] = {
        id: ref.id,
        name: ref.id,
        color: MINOR_PALETTE[h % MINOR_PALETTE.length],
        major: false,
        playable: false,
        alive: true,
        leaderId: leader.id,
        ministers: {},
        government,
        ideology: { ...leader.ideology },
        personality: rng.pick(['pragmatic', 'opportunist', 'vengeful', 'ideologue'] as const),
        politicalCapital: 5,
        stability: 45 + (h % 30),
        warSupport: 25,
        warExhaustion: 0,
        standing: 45 + (h % 20),
        treasury: 40 + (h % 80),
        taxRate: 0.5,
        debts: [],
        stockpiles: emptyStockpiles(),
        regionIds: [regionId],
        military: {
          armies: [
            {
              id: uid('army'),
              name: '1. Army',
              generalId: null,
              strength: 10 + pop * 4,
              composition: { inf: 85, art: 12, arm: 3 },
              organization: 50,
              frontId: null,
            },
          ],
          doctrine: null,
          navy: 0,
          air: 0,
          navalMission: null,
          navalTarget: null,
          manpower: pop * 10,
        },
        techs: [],
        research: { current: null, progress: 0 },
        agenda: { completed: [], current: null, progress: 0 },
        relations: {},
        memory: [],
        press: 'pressured',
        factions: [],
        electionDue: null,
        embargoes: [],
        intel: {},
        casusBelli: [],
        fabricating: null,
        blocId: null,
        projects: [],
        justArmistice: [],
        flags: {},
        overlordOf: [],
      };
    }
  }

  // Starting relationships with period texture (D1).
  const set = (a: string, b: string, rel: Partial<Relation>, mirror?: Partial<Relation>) => {
    if (!state.nations[a] || !state.nations[b]) return;
    Object.assign(getRelation(state, a, b), rel);
    Object.assign(getRelation(state, b, a), mirror ?? rel);
  };
  set('Germany', 'Czechoslovakia', { trust: 25, opinion: -40, fear: 5 }, { trust: 30, opinion: -45, fear: 55 });
  set('Germany', 'France', { trust: 25, opinion: -50, fear: 35 }, { trust: 20, opinion: -45, fear: 50 });
  set('Germany', 'Poland', { trust: 30, opinion: -25, fear: 15 }, { trust: 25, opinion: -35, fear: 50 });
  set('Germany', 'USSR', { trust: 15, opinion: -60, fear: 40 }, { trust: 15, opinion: -60, fear: 35 });
  set('France', 'United Kingdom', { trust: 70, opinion: 45, fear: 5 });
  set('France', 'Czechoslovakia', { trust: 72, opinion: 50, fear: 0 }, { trust: 75, opinion: 55, fear: 0 });
  set('Czechoslovakia', 'Romania', { trust: 68, opinion: 40, fear: 0 });
  set('Czechoslovakia', 'Yugoslavia', { trust: 66, opinion: 38, fear: 0 });
  set('Hungary', 'Czechoslovakia', { trust: 30, opinion: -45, fear: 20 }, { trust: 35, opinion: -35, fear: 15 });
  set('Italy', 'Yugoslavia', { trust: 30, opinion: -30, fear: 15 }, { trust: 30, opinion: -35, fear: 40 });
  set('Sweden', 'Denmark', { trust: 75, opinion: 50, fear: 0 });
  set('Sweden', 'Norway', { trust: 78, opinion: 55, fear: 0 });
  set('Sweden', 'Finland', { trust: 70, opinion: 45, fear: 0 });
  set('Turkey', 'Greece', { trust: 55, opinion: 15, fear: 15 });
  set('Turkey', 'USSR', { trust: 48, opinion: 10, fear: 25 }, { trust: 45, opinion: 5, fear: 10 });
  set('Turkey', 'United Kingdom', { trust: 50, opinion: 15, fear: 10 }, { trust: 52, opinion: 10, fear: 0 });
  set('United Kingdom', 'United States', { trust: 65, opinion: 30, fear: 0 });
  set('Empire of Japan', 'United States', { trust: 30, opinion: -30, fear: 25 }, { trust: 32, opinion: -25, fear: 20 });
  set('Empire of Japan', 'USSR', { trust: 22, opinion: -35, fear: 30 });

  // The Little Entente starts as a live bloc (D4).
  if (state.nations['Czechoslovakia'] && state.nations['Romania'] && state.nations['Yugoslavia']) {
    state.blocs.push({
      id: 'bloc_little_entente',
      name: 'The Little Entente',
      kind: 'alliance',
      leaderId: 'Czechoslovakia',
      members: ['Czechoslovakia', 'Romania', 'Yugoslavia'],
    });
    for (const m of ['Czechoslovakia', 'Romania', 'Yugoslavia']) state.nations[m].blocId = 'bloc_little_entente';
  }

  state.rngState = rng.state;
  return state;
}
