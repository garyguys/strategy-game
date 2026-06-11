import { MAJOR_NATIONS, MINOR_PALETTE, type NationDef } from './nations';

export interface Nation extends NationDef {
  /** Feature NAME from the basemap, used as a stable id. */
  id: string;
  major: boolean;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export class GameState {
  readonly nations = new Map<string, Nation>();
  /** Months since January 1936. */
  turn = 0;

  registerCountry(id: string): Nation {
    let nation = this.nations.get(id);
    if (nation) return nation;

    const major = MAJOR_NATIONS[id];
    if (major) {
      nation = { ...major, id, major: true };
    } else {
      const h = hash(id);
      nation = {
        id,
        name: id,
        color: MINOR_PALETTE[h % MINOR_PALETTE.length],
        leader: 'Unknown',
        government: 'Unknown',
        treasury: 20 + (h % 60),
        stability: 40 + (h % 40),
        industry: 5 + (h % 20),
        playable: false,
        major: false,
        note: 'Detailed intelligence on this nation is not yet available.',
      };
    }
    this.nations.set(id, nation);
    return nation;
  }

  get dateLabel(): string {
    const year = 1936 + Math.floor(this.turn / 12);
    return `${MONTHS[this.turn % 12]} ${year}`;
  }

  /** Advance one month and return a short digest of what happened. */
  endTurn(): string[] {
    this.turn++;
    const digest: string[] = [`The world turns. It is now ${this.dateLabel}.`];

    for (const nation of this.nations.values()) {
      // Placeholder economy: industry earns, instability bleeds money.
      const income = Math.round(nation.industry * 0.5 - (100 - nation.stability) * 0.1);
      nation.treasury = Math.max(0, nation.treasury + income);
    }

    return digest;
  }
}
