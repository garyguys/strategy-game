/**
 * Real countries, fictional people. Names below are keyed to the NAME
 * property in the 1938 basemap; every leader is an invented character.
 */

export interface NationDef {
  name: string;
  color: number;
  leader: string;
  government: string;
  treasury: number;
  stability: number;
  industry: number;
  /** Fully playable in the MVP (has bespoke story content planned). */
  playable: boolean;
  note: string;
}

export const MAJOR_NATIONS: Record<string, NationDef> = {
  Czechoslovakia: {
    name: 'Czechoslovakia',
    color: 0x7da99e,
    leader: 'President Tomáš Dvorský',
    government: 'Parliamentary Republic',
    treasury: 120,
    stability: 62,
    industry: 38,
    playable: true,
    note: 'A young democracy with world-class arms factories — and three great powers eyeing its borders.',
  },
  Sweden: {
    name: 'Sweden',
    color: 0x92aec2,
    leader: 'Prime Minister Axel Lindqvist',
    government: 'Constitutional Monarchy',
    treasury: 160,
    stability: 78,
    industry: 30,
    playable: true,
    note: 'Neutral, prosperous, and rich in iron ore that every rearming power desperately wants.',
  },
  Turkey: {
    name: 'Turkey',
    color: 0xbd8a62,
    leader: 'President Davut Erkan',
    government: 'One-Party Republic',
    treasury: 90,
    stability: 58,
    industry: 22,
    playable: true,
    note: 'Guardian of the Straits, courted by every bloc, rebuilding a nation between two continents.',
  },
  Germany: {
    name: 'Germany',
    color: 0x8f9779,
    leader: 'Chancellor Konrad Vossler',
    government: 'Authoritarian State',
    treasury: 200,
    stability: 70,
    industry: 85,
    playable: false,
    note: 'Rearming in defiance of the postwar settlement. Its neighbors are starting to notice.',
  },
  France: {
    name: 'France',
    color: 0x7e94ab,
    leader: 'Premier Lucien Travert',
    government: 'Parliamentary Republic',
    treasury: 240,
    stability: 48,
    industry: 70,
    playable: false,
    note: 'A great power paralyzed by cabinet crises and a deeply divided parliament.',
  },
  'United Kingdom': {
    name: 'United Kingdom',
    color: 0xcf9a8c,
    leader: 'Prime Minister Edmund Harrow',
    government: 'Constitutional Monarchy',
    treasury: 320,
    stability: 72,
    industry: 80,
    playable: false,
    note: 'An empire stretched thin, betting that patient diplomacy can hold the world together.',
  },
  USSR: {
    name: 'Soviet Union',
    color: 0xa85e54,
    leader: 'General Secretary Pyotr Malenov',
    government: 'One-Party State',
    treasury: 180,
    stability: 55,
    industry: 90,
    playable: false,
    note: 'Industrializing at breakneck speed behind closed borders and closed trials.',
  },
  Italy: {
    name: 'Italy',
    color: 0x9bb088,
    leader: 'Prime Minister Benedetto Scarpa',
    government: 'Authoritarian State',
    treasury: 110,
    stability: 64,
    industry: 45,
    playable: false,
    note: 'Hungry for empire and prestige, and willing to gamble for both.',
  },
  Poland: {
    name: 'Poland',
    color: 0xab8aa0,
    leader: 'Marshal Antoni Wirski',
    government: 'Military-Led Republic',
    treasury: 95,
    stability: 60,
    industry: 32,
    playable: false,
    note: 'Reborn twenty years ago, wedged between two giants who both remember the old maps.',
  },
  Spain: {
    name: 'Spain',
    color: 0xc2a45f,
    leader: 'President Álvaro Cendoya',
    government: 'Fractured Republic',
    treasury: 70,
    stability: 30,
    industry: 26,
    playable: false,
    note: 'A republic coming apart at the seams. Everyone expects the explosion; no one knows the hour.',
  },
  Romania: {
    name: 'Romania',
    color: 0xc9b97a,
    leader: 'King Aurel II',
    government: 'Royal Dictatorship',
    treasury: 85,
    stability: 52,
    industry: 24,
    playable: false,
    note: 'Oil fields that could fuel a war machine — whose, is the question.',
  },
  Yugoslavia: {
    name: 'Yugoslavia',
    color: 0xa3a065,
    leader: 'Prince Regent Stevan Vukov',
    government: 'Royal Dictatorship',
    treasury: 75,
    stability: 44,
    industry: 20,
    playable: false,
    note: 'One king, three peoples, and a balancing act that gets harder every year.',
  },
  Hungary: {
    name: 'Hungary',
    color: 0xb59a87,
    leader: 'Regent Bálint Szarvas',
    government: 'Authoritarian Regency',
    treasury: 65,
    stability: 56,
    industry: 22,
    playable: false,
    note: 'A kingdom without a king, dreaming of borders it lost a war ago.',
  },
  'United States': {
    name: 'United States',
    color: 0x8ea3b8,
    leader: 'President Harlan Whitcomb',
    government: 'Federal Republic',
    treasury: 400,
    stability: 66,
    industry: 100,
    playable: false,
    note: 'An industrial colossus that wants nothing to do with the Old World’s quarrels. For now.',
  },
  Japan: {
    name: 'Japan',
    color: 0xc79793,
    leader: 'Prime Minister Keisuke Morioka',
    government: 'Imperial Oligarchy',
    treasury: 150,
    stability: 62,
    industry: 60,
    playable: false,
    note: 'Generals and admirals set the agenda now; the cabinet merely signs it.',
  },
};

/** Muted paper-map palette for nations without bespoke data. */
export const MINOR_PALETTE = [
  0xc4ab84, 0xa9b294, 0xb79f92, 0x9fa9ad, 0xbfb089, 0xa49a9d, 0xb3ab7f,
  0x9caf9c,
];
