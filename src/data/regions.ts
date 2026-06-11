/** R2/I8/R6 — regional geography for major nations (E8 data file). */
import type { Good } from './goods';
import type { MinorityPolicy } from '../engine/types';

export interface RegionDef {
  id: string;
  name: string;
  production: Partial<Record<Good, number>>;
  development: { infra: number; industry: number; education: number };
  population: number; // millions
  minority?: { name: string; tiedTo?: string; share: number; policy: MinorityPolicy };
  chokepoint?: string;
}

export const REGIONS: Record<string, RegionDef[]> = {
  Czechoslovakia: [
    {
      id: 'csk_bohemia',
      name: 'Bohemia',
      production: { coal: 14, machinery: 4 },
      development: { infra: 3, industry: 4, education: 4 },
      population: 5.2,
    },
    {
      id: 'csk_sudetenland',
      name: 'Sudetenland',
      production: { coal: 10, consumerGoods: 6 },
      development: { infra: 3, industry: 4, education: 3 },
      population: 3.2,
      minority: { name: 'Germans', tiedTo: 'Germany', share: 65, policy: 'integrate' },
    },
    {
      id: 'csk_moravia',
      name: 'Moravia',
      production: { steel: 6, arms: 4 },
      development: { infra: 3, industry: 4, education: 3 },
      population: 3.5,
    },
    {
      id: 'csk_slovakia',
      name: 'Slovakia',
      production: { grain: 12, ironOre: 4 },
      development: { infra: 2, industry: 2, education: 2 },
      population: 3.3,
      minority: { name: 'Hungarians', tiedTo: 'Hungary', share: 17, policy: 'integrate' },
    },
  ],
  Sweden: [
    {
      id: 'swe_svealand',
      name: 'Svealand',
      production: { machinery: 5, steel: 5 },
      development: { infra: 4, industry: 4, education: 5 },
      population: 2.6,
    },
    {
      id: 'swe_norrland',
      name: 'Norrland',
      production: { ironOre: 34 },
      development: { infra: 2, industry: 2, education: 3 },
      population: 1.1,
    },
    {
      id: 'swe_gotaland',
      name: 'Götaland',
      production: { grain: 10, consumerGoods: 6 },
      development: { infra: 4, industry: 3, education: 4 },
      population: 2.6,
    },
  ],
  Turkey: [
    {
      id: 'tur_marmara',
      name: 'Marmara & the Straits',
      production: { consumerGoods: 5, luxuryGoods: 3 },
      development: { infra: 3, industry: 3, education: 3 },
      population: 4.0,
      chokepoint: 'The Bosphorus',
    },
    {
      id: 'tur_anatolia',
      name: 'Central Anatolia',
      production: { grain: 18 },
      development: { infra: 2, industry: 1, education: 2 },
      population: 6.0,
    },
    {
      id: 'tur_east',
      name: 'Eastern Anatolia',
      production: { rareMetals: 14 },
      development: { infra: 1, industry: 1, education: 1 },
      population: 3.5,
      minority: { name: 'Kurds', share: 45, policy: 'suppress' },
    },
    {
      id: 'tur_blacksea',
      name: 'Black Sea Coast',
      production: { coal: 12, grain: 5 },
      development: { infra: 2, industry: 2, education: 2 },
      population: 2.7,
    },
  ],
  Germany: [
    {
      id: 'ger_ruhr',
      name: 'Rhineland-Ruhr',
      production: { coal: 40, steel: 16 },
      development: { infra: 5, industry: 5, education: 4 },
      population: 16,
    },
    {
      id: 'ger_prussia',
      name: 'Prussia & Berlin',
      production: { grain: 14, machinery: 6 },
      development: { infra: 4, industry: 4, education: 4 },
      population: 20,
    },
    {
      id: 'ger_saxony',
      name: 'Saxony & Silesia',
      production: { coal: 18, arms: 6 },
      development: { infra: 4, industry: 4, education: 4 },
      population: 15,
    },
    {
      id: 'ger_bavaria',
      name: 'Bavaria',
      production: { grain: 10, consumerGoods: 8 },
      development: { infra: 3, industry: 3, education: 3 },
      population: 14,
    },
    {
      id: 'ger_austria',
      name: 'Austria',
      production: { steel: 4, ironOre: 6 },
      development: { infra: 3, industry: 3, education: 4 },
      population: 7,
      minority: { name: 'Austrians', share: 95, policy: 'integrate' },
    },
  ],
  France: [
    {
      id: 'fra_north',
      name: 'Paris & the North',
      production: { machinery: 8, consumerGoods: 10 },
      development: { infra: 4, industry: 4, education: 4 },
      population: 18,
    },
    {
      id: 'fra_lorraine',
      name: 'Lorraine',
      production: { ironOre: 22, steel: 10, coal: 8 },
      development: { infra: 4, industry: 4, education: 3 },
      population: 6,
    },
    {
      id: 'fra_south',
      name: 'The Midi',
      production: { grain: 16, luxuryGoods: 6 },
      development: { infra: 3, industry: 2, education: 3 },
      population: 18,
    },
    {
      id: 'fra_colonies',
      name: 'Overseas Empire',
      production: { grain: 8, rareMetals: 6, luxuryGoods: 6 },
      development: { infra: 1, industry: 1, education: 1 },
      population: 25,
      minority: { name: 'Colonial subjects', share: 95, policy: 'suppress' },
    },
  ],
  'United Kingdom': [
    {
      id: 'gbr_england',
      name: 'England',
      production: { machinery: 10, consumerGoods: 12, steel: 8 },
      development: { infra: 5, industry: 5, education: 4 },
      population: 38,
    },
    {
      id: 'gbr_wales_scotland',
      name: 'Scotland & Wales',
      production: { coal: 30, steel: 6 },
      development: { infra: 4, industry: 4, education: 4 },
      population: 8,
    },
    {
      id: 'gbr_empire',
      name: 'The Empire',
      production: { oil: 16, luxuryGoods: 12, grain: 14, rareMetals: 8 },
      development: { infra: 2, industry: 1, education: 1 },
      population: 60,
      minority: { name: 'Colonial subjects', share: 95, policy: 'suppress' },
      chokepoint: 'Suez & Gibraltar',
    },
  ],
  USSR: [
    {
      id: 'sov_moscow',
      name: 'Moscow Industrial Region',
      production: { machinery: 10, arms: 8, consumerGoods: 6 },
      development: { infra: 3, industry: 4, education: 3 },
      population: 40,
    },
    {
      id: 'sov_ukraine',
      name: 'Ukraine',
      production: { grain: 40, coal: 18, steel: 10 },
      development: { infra: 2, industry: 3, education: 2 },
      population: 30,
      minority: { name: 'Ukrainians', share: 80, policy: 'suppress' },
    },
    {
      id: 'sov_caucasus',
      name: 'The Caucasus',
      production: { oil: 40 },
      development: { infra: 2, industry: 2, education: 2 },
      population: 12,
      minority: { name: 'Caucasian peoples', share: 70, policy: 'suppress' },
    },
    {
      id: 'sov_urals',
      name: 'The Urals',
      production: { ironOre: 24, coal: 14, steel: 8 },
      development: { infra: 2, industry: 3, education: 2 },
      population: 15,
    },
    {
      id: 'sov_siberia',
      name: 'Siberia',
      production: { rareMetals: 16, grain: 8 },
      development: { infra: 1, industry: 1, education: 1 },
      population: 20,
    },
  ],
  Italy: [
    {
      id: 'ita_north',
      name: 'The Industrial North',
      production: { machinery: 6, steel: 4, consumerGoods: 8 },
      development: { infra: 4, industry: 4, education: 3 },
      population: 20,
    },
    {
      id: 'ita_south',
      name: 'The Mezzogiorno',
      production: { grain: 14, luxuryGoods: 4 },
      development: { infra: 2, industry: 1, education: 2 },
      population: 18,
    },
    {
      id: 'ita_africa',
      name: 'Italian Africa',
      production: { grain: 4 },
      development: { infra: 1, industry: 1, education: 1 },
      population: 8,
      minority: { name: 'Colonial subjects', share: 95, policy: 'suppress' },
    },
  ],
  Poland: [
    {
      id: 'pol_warsaw',
      name: 'Warsaw & the Center',
      production: { grain: 12, consumerGoods: 5 },
      development: { infra: 2, industry: 2, education: 2 },
      population: 14,
    },
    {
      id: 'pol_silesia',
      name: 'Polish Silesia',
      production: { coal: 26, steel: 6 },
      development: { infra: 3, industry: 3, education: 2 },
      population: 5,
      minority: { name: 'Germans', tiedTo: 'Germany', share: 20, policy: 'integrate' },
    },
    {
      id: 'pol_kresy',
      name: 'The Kresy',
      production: { grain: 16 },
      development: { infra: 1, industry: 1, education: 1 },
      population: 13,
      minority: { name: 'Ukrainians & Belarusians', tiedTo: 'USSR', share: 60, policy: 'suppress' },
    },
  ],
  Spain: [
    {
      id: 'esp_castile',
      name: 'Castile',
      production: { grain: 12 },
      development: { infra: 2, industry: 2, education: 2 },
      population: 10,
    },
    {
      id: 'esp_catalonia',
      name: 'Catalonia & the Basque Country',
      production: { consumerGoods: 6, steel: 4, ironOre: 6 },
      development: { infra: 3, industry: 3, education: 3 },
      population: 8,
      minority: { name: 'Catalans & Basques', share: 80, policy: 'autonomy' },
    },
    {
      id: 'esp_andalusia',
      name: 'Andalusia',
      production: { grain: 8, rareMetals: 10 },
      development: { infra: 2, industry: 1, education: 1 },
      population: 7,
    },
  ],
  Romania: [
    {
      id: 'rom_wallachia',
      name: 'Wallachia & Ploiești',
      production: { oil: 30, grain: 12 },
      development: { infra: 2, industry: 2, education: 2 },
      population: 10,
    },
    {
      id: 'rom_transylvania',
      name: 'Transylvania',
      production: { grain: 10, rareMetals: 5 },
      development: { infra: 2, industry: 2, education: 2 },
      population: 9,
      minority: { name: 'Hungarians', tiedTo: 'Hungary', share: 30, policy: 'integrate' },
    },
  ],
  Yugoslavia: [
    {
      id: 'yug_serbia',
      name: 'Serbia',
      production: { grain: 12, rareMetals: 8 },
      development: { infra: 2, industry: 2, education: 2 },
      population: 8,
    },
    {
      id: 'yug_croatia',
      name: 'Croatia & Slovenia',
      production: { grain: 8, coal: 6, consumerGoods: 4 },
      development: { infra: 2, industry: 2, education: 2 },
      population: 7,
      minority: { name: 'Croats & Slovenes', share: 85, policy: 'integrate' },
    },
  ],
  Hungary: [
    {
      id: 'hun_pannonia',
      name: 'The Hungarian Plain',
      production: { grain: 20, machinery: 2 },
      development: { infra: 2, industry: 2, education: 3 },
      population: 9,
    },
  ],
  'United States': [
    {
      id: 'usa_northeast',
      name: 'The Northeast',
      production: { machinery: 16, steel: 14, consumerGoods: 16 },
      development: { infra: 5, industry: 5, education: 4 },
      population: 40,
    },
    {
      id: 'usa_midwest',
      name: 'The Midwest',
      production: { grain: 40, coal: 20 },
      development: { infra: 4, industry: 4, education: 3 },
      population: 40,
    },
    {
      id: 'usa_south',
      name: 'The South',
      production: { oil: 40, grain: 10 },
      development: { infra: 3, industry: 2, education: 2 },
      population: 30,
    },
    {
      id: 'usa_west',
      name: 'The West',
      production: { rareMetals: 14, oil: 10 },
      development: { infra: 3, industry: 2, education: 3 },
      population: 18,
    },
  ],
  'Empire of Japan': [
    {
      id: 'jap_honshu',
      name: 'The Home Islands',
      production: { machinery: 8, steel: 6, consumerGoods: 10, arms: 6 },
      development: { infra: 4, industry: 4, education: 4 },
      population: 70,
    },
    {
      id: 'jap_korea',
      name: 'Korea',
      production: { grain: 14, coal: 8 },
      development: { infra: 2, industry: 2, education: 1 },
      population: 22,
      minority: { name: 'Koreans', share: 97, policy: 'suppress' },
    },
  ],
};

/** Denmark holds the Danish Straits even as a minor (R6). */
export const MINOR_CHOKEPOINTS: Record<string, string> = {
  Denmark: 'The Danish Straits',
};
