/**
 * N5/R8 — systemic crisis templates. Repeatable, condition-driven scenes
 * that read the player's ledgers back to them: famine, strikes, plots,
 * scandals, crashes, and the occasional good harvest.
 */
import type { EventDef, SceneDef } from '../../engine/types';
import { fx } from '../../engine/effects';

type GS = Parameters<EventDef['condition']>[0];
type NS = Parameters<EventDef['condition']>[1];

const avgUnrest = (state: GS, nation: NS): number => {
  if (nation.regionIds.length === 0) return 0;
  let total = 0;
  for (const id of nation.regionIds) total += state.regions[id]?.unrest ?? 0;
  return total / nation.regionIds.length;
};

const disloyalGeneral = (state: GS, nation: NS) =>
  Object.values(state.characters).find(
    (c) => c.nationId === nation.id && c.role === 'general' && c.alive && c.loyalty < 30,
  );

/** Deterministic pick so scene text and effects agree on the same minister. */
const pickMinister = (state: GS, nation: NS) => {
  const ids = Object.values(nation.ministers).filter((id): id is string => typeof id === 'string');
  if (ids.length === 0) return undefined;
  return state.characters[ids[state.turn % ids.length]];
};

const NEIGHBORS: Record<string, string[]> = {
  Czechoslovakia: ['Germany', 'Poland', 'Hungary'],
  Sweden: ['Germany', 'USSR'],
  Turkey: ['USSR', 'Italy'],
};

const neighborOf = (state: GS, nation: NS) => {
  const list = (NEIGHBORS[nation.id] ?? ['Germany']).filter(
    (id) => id !== nation.id && state.nations[id]?.alive,
  );
  return list.length > 0 ? list[state.turn % list.length] : undefined;
};

const funeralHost = (state: GS, nation: NS) => {
  const courts = ['France', 'United Kingdom', 'Italy', 'Poland', 'Romania', 'Yugoslavia'].filter(
    (id) => id !== nation.id && state.nations[id]?.alive,
  );
  return courts.length > 0 ? courts[state.turn % courts.length] : undefined;
};

export const SCENES: SceneDef[] = [
  // 1 ── Famine risk ───────────────────────────────────────────────────
  {
    id: 'sc_sys_famine',
    title: 'The Empty Granaries',
    speaker: 'Economy Ministry',
    text: () =>
      `The granaries are empty. Not low — empty: the last reserve barges were unloaded a month ago, and the millers now grind what the army would not take. Bread queues form before dawn in the industrial quarters, and the price chalked on the bakery boards changes by afternoon. The Economy Ministry puts the arithmetic before you without comment. Hunger, the covering note observes, is the one shortage that never stays in its own column of the ledger.`,
    options: [
      {
        id: 'buy',
        text: 'Buy abroad at any price. Bread first, budgets after.',
        enabled: ({ nation }) => nation.treasury >= 80,
        effects: [fx.treasury(-80), fx.stockpile('grain', 30), fx.stability(2)],
      },
      {
        id: 'requisition',
        text: 'Requisition from the countryside under emergency powers.',
        effects: [
          fx.stockpile('grain', 15),
          fx.unrest(8),
          fx.ideology('planned', 3),
          fx.ideology('auth', 2),
        ],
      },
      {
        id: 'ration_by_price',
        text: 'Let prices ration the loaves. The market clears, eventually.',
        effects: [fx.stability(-8), fx.unrest(6), fx.standing(-2), fx.ideology('planned', -3)],
      },
    ],
  },

  // 2 ── General strike ───────────────────────────────────────────────
  {
    id: 'sc_sys_strike',
    title: 'The Trams Stand Still',
    speaker: 'Interior Ministry',
    text: () =>
      `It begins in the railway yards and is general by Thursday. The trams stand where the morning left them; the ports work to rule, which is to say barely. The union federation's demands are written in the reasonable tone of men who know the trains do not run without them. Your industrialists demand troops. Your interior ministry counts banners and reports, so far, discipline on both sides. The country waits to see who blinks at whom.`,
    options: [
      {
        id: 'negotiate',
        text: 'Open negotiations. Wages now, gratitude later.',
        effects: [
          fx.treasury(-60),
          fx.unrest(-10),
          fx.stability(3),
          fx.ideology('planned', 4),
          fx.chronicle('Settled the general strike at the bargaining table.', ['labor']),
        ],
      },
      {
        id: 'break',
        text: 'Break it. Volunteers on the trams, gendarmes at the depots.',
        effects: [
          fx.unrest(-6),
          fx.stability(-6),
          fx.ideology('auth', 5),
          fx.ideology('planned', -4),
          fx.standing(-2),
        ],
      },
      {
        id: 'wait',
        text: 'Wait. Strikes are paid for by the day, on both sides.',
        effects: [fx.treasury(-40), fx.stability(-3), fx.capital(2)],
      },
    ],
  },

  // 3 ── Coup plot ────────────────────────────────────────────────────
  {
    id: 'sc_sys_coup_plot',
    title: 'A Seating Plan',
    speaker: 'Interior Ministry',
    text: ({ state, nation }) => {
      const g = disloyalGeneral(state, nation);
      const who = g ? `Officers — one of them ${g.name}` : 'Officers — some of them decorated';
      return `It arrives as such things do: a transcript, a seating plan, a list of names that should not dine together and did. ${who} — speaking of "a government of national recovery" over the brandy. Nothing illegal has occurred yet except the future. Your interior minister waits with the file open and a pen uncapped. Whatever you order will teach the army what the state believes itself to be.`;
    },
    options: [
      {
        id: 'arrest',
        text: 'Arrests at dawn. Conspiracy ends where it is named.',
        effects: [
          fx.stability(5),
          fx.ideology('auth', 5),
          fx.unrest(4),
          fx.custom(({ state, nation }) => {
            const g = disloyalGeneral(state, nation);
            if (g) {
              g.loyalty = Math.max(0, g.loyalty - 20);
              g.log.push({ turn: state.turn, text: 'Detained on suspicion of conspiracy; released without charge, watched without pause.' });
            }
          }),
          fx.chronicle('Officers detained over an alleged plot.', ['security']),
        ],
      },
      {
        id: 'confront',
        text: 'Summon the ringleader alone. Offer a command far from the capital.',
        effects: [
          fx.capital(-8),
          fx.custom(({ state, nation }) => {
            const g = disloyalGeneral(state, nation);
            if (g) {
              g.loyalty = Math.min(100, g.loyalty + 18);
              g.log.push({ turn: state.turn, text: 'Confronted privately over the dinner-table plot; chose, for now, the offered command.' });
            }
          }),
          fx.stability(2),
        ],
      },
      {
        id: 'ignore',
        text: 'File it. Dinner talk is not yet treason.',
        effects: [fx.stability(-5), fx.flag('coupPlotIgnored', true), fx.capital(2)],
      },
    ],
  },

  // 4 ── Minister corruption scandal ──────────────────────────────────
  {
    id: 'sc_sys_scandal',
    title: 'A Villa No Salary Explains',
    speaker: 'Press Digest',
    text: ({ state, nation }) => {
      const m = pickMinister(state, nation);
      const name = m ? m.name : 'A senior minister';
      return `A procurement contract, a brother-in-law, a villa that no salary explains. The newspapers have most of it; by Friday they will have the rest. ${name} denies everything in a voice the lobby correspondents describe as "steady." The opposition has tabled questions. Your coalition partners are calculating, audibly. Scandals, your predecessor liked to say, are like fires: the damage depends less on the spark than on what the householder does in the first hour.`;
    },
    options: [
      {
        id: 'sack',
        text: 'Dismiss the minister today. The government is not a shelter.',
        effects: [
          fx.custom(({ state, nation }) => {
            const m = pickMinister(state, nation);
            if (!m || !m.post) return;
            delete nation.ministers[m.post];
            m.post = null;
            m.loyalty = Math.max(0, m.loyalty - 30);
            m.log.push({ turn: state.turn, text: 'Dismissed from the cabinet over the procurement scandal.' });
          }),
          fx.stability(3),
          fx.standing(2),
          fx.capital(-5),
          fx.chronicle('A minister falls to the procurement scandal.', ['politics']),
        ],
      },
      {
        id: 'shield',
        text: 'Stand by your colleague. Loyalty must run downhill too.',
        effects: [
          fx.custom(({ state, nation }) => {
            const m = pickMinister(state, nation);
            if (m) {
              m.loyalty = Math.min(100, m.loyalty + 12);
              m.log.push({ turn: state.turn, text: 'Shielded by the head of government through the scandal. Owes a debt, and knows it.' });
            }
          }),
          fx.stability(-5),
          fx.standing(-3),
        ],
      },
      {
        id: 'inquiry',
        text: 'A judicial inquiry — slow, formal, and conveniently long.',
        effects: [
          fx.capital(-4),
          fx.stability(-2),
          fx.custom(({ state, nation }) => {
            const m = pickMinister(state, nation);
            if (m) {
              m.loyalty = Math.max(0, m.loyalty - 8);
              m.log.push({ turn: state.turn, text: 'Placed under a judicial inquiry that everyone understands to be a sentence of waiting.' });
            }
          }),
        ],
      },
    ],
  },

  // 5 ── Market crash ─────────────────────────────────────────────────
  {
    id: 'sc_sys_crash',
    title: 'The Bourse Closes at Noon',
    speaker: 'Central Bank',
    text: () =>
      `It starts in New York or Paris — by the time the cables agree, it hardly matters. Selling becomes sliding becomes panic; the bourse suspends trading at noon and reopens to learn that suspension is also information. Two provincial banks have closed their doors "temporarily." Outside them stand depositors in their work clothes, very quiet. Your central bank governor asks for instructions and, ideally, for money.`,
    options: [
      {
        id: 'prop_up',
        text: 'Guarantee the deposits. Print confidence if you must.',
        effects: [fx.treasury(-120), fx.stability(4), fx.unrest(-3)],
      },
      {
        id: 'let_burn',
        text: 'Let the weak banks fail. Fire clears the deadwood.',
        effects: [fx.stability(-10), fx.unrest(8), fx.ideology('planned', -4), fx.standing(-2)],
      },
      {
        id: 'controls',
        text: 'Exchange controls and a closed bourse until further notice.',
        effects: [fx.treasury(-40), fx.ideology('planned', 8), fx.ideology('auth', 3), fx.stability(-2)],
      },
    ],
  },

  // 6 ── Bumper harvest ───────────────────────────────────────────────
  {
    id: 'sc_sys_harvest',
    title: 'A Heavy Harvest',
    speaker: 'Agriculture Ministry',
    text: () =>
      `The reports agree, which is itself unusual: rain when it was wanted, sun when it mattered, and now the heaviest harvest in a decade coming in on every line. The elevators are full; the railways beg for wagons. Grain merchants from three countries are already in the lobby of the agriculture ministry, hats in hand, offering prices that will not survive the month. Plenty, for once, is your problem.`,
    options: [
      {
        id: 'sell',
        text: 'Sell the surplus abroad while the prices hold.',
        effects: [fx.treasury(80), fx.stockpile('grain', 10)],
      },
      {
        id: 'store',
        text: 'Store it. Good years are loans from the bad ones.',
        effects: [fx.stockpile('grain', 40), fx.treasury(-10)],
      },
      {
        id: 'distribute',
        text: 'Cheap bread in every town this winter.',
        effects: [fx.stockpile('grain', 15), fx.stability(4), fx.unrest(-5)],
      },
    ],
  },

  // 7 ── Border incident ──────────────────────────────────────────────
  {
    id: 'sc_sys_border',
    title: 'Fog on the Frontier',
    speaker: 'General Staff',
    text: ({ state, nation }) => {
      const n = neighborOf(state, nation) ?? 'the neighboring power';
      return `A patrol, a fogged frontier, a dead corporal — yours or theirs, the first reports disagree, which is the worst of all versions. ${n} lodged a protest before your own commanders had finished their telegram. The local officers have, sensibly, stopped shooting and started writing. In the capital's evening papers the incident is already a quarter-column taller than the facts. Frontiers keep their own ledgers, and they are never quite closed.`;
    },
    options: [
      {
        id: 'apologize',
        text: 'Express regret and offer a joint commission.',
        effects: [
          fx.standing(-1),
          fx.custom(({ state, nation }) => {
            const n = neighborOf(state, nation);
            if (!n) return;
            const rel = state.nations[n]?.relations[nation.id];
            if (rel) {
              rel.opinion = Math.min(100, rel.opinion + 5);
              rel.trust = Math.min(100, rel.trust + 2);
            }
          }),
          fx.tension(-2),
        ],
      },
      {
        id: 'demand',
        text: 'Demand their apology first. The corporal was ours.',
        effects: [
          fx.tension(3),
          fx.ideology('natl', 3),
          fx.stability(1),
          fx.custom(({ state, nation }) => {
            const n = neighborOf(state, nation);
            if (!n) return;
            const rel = state.nations[n]?.relations[nation.id];
            if (rel) rel.opinion = Math.max(-100, rel.opinion - 10);
          }),
        ],
      },
      {
        id: 'bury',
        text: 'Bury it in procedure. Commissions outlive headlines.',
        effects: [
          fx.capital(-3),
          fx.custom(({ state, nation }) => {
            const n = neighborOf(state, nation);
            if (!n) return;
            const rel = state.nations[n]?.relations[nation.id];
            if (rel) rel.opinion = Math.max(-100, rel.opinion - 4);
          }),
        ],
      },
    ],
  },

  // 8 ── Spy scare at home ────────────────────────────────────────────
  {
    id: 'sc_sys_spy_scare',
    title: 'A Taste for Fishing',
    speaker: 'Counter-Intelligence',
    text: () =>
      `The cipher clerks found it first: a query repeated where no query belonged, then a junior attaché's sudden taste for fishing near the naval yards. Counter-intelligence now believes a network has operated in the capital for a year, perhaps two — feeding someone your tonnages, your timetables, possibly your minutes. Whose, they cannot yet say. The arrests, if you order them, will be loud. The alternative is to keep feeding it, carefully.`,
    options: [
      {
        id: 'sweep',
        text: 'Sweep them up tonight. Loud is also a message.',
        effects: [
          fx.ideology('auth', 4),
          fx.unrest(3),
          fx.stability(2),
          fx.tension(2),
          fx.chronicle('A foreign spy ring rolled up in the capital.', ['security']),
        ],
      },
      {
        id: 'feed',
        text: 'Leave the network in place and feed it fictions.',
        effects: [
          fx.capital(-5),
          fx.flag('doubleCrossGame', true),
          fx.custom(({ state, nation }) => {
            const interior = nation.ministers.interior;
            if (interior) {
              state.characters[interior]?.log.push({
                turn: state.turn,
                text: 'Entrusted with running the double-cross game against the foreign network.',
              });
            }
          }),
        ],
      },
      {
        id: 'publicize',
        text: 'Publish the affair and let the press do the expelling.',
        effects: [fx.standing(2), fx.tension(3), fx.stability(-2), fx.ideology('natl', 2)],
      },
    ],
  },

  // 9 ── Press crackdown backlash ─────────────────────────────────────
  {
    id: 'sc_sys_press_backlash',
    title: 'Silence Is Also a Headline',
    speaker: 'Press Digest',
    text: () =>
      `The censor's office works late, and it shows. Foreign correspondents file from across the border what your own papers cannot print at home; the gap between the two editions has become the story itself. An editors' delegation requests an audience — respectful, but they have brought a list, and three printers' unions have signed it. Silence, the oldest of them observes, is also a headline, and it is running on every kiosk in Europe.`,
    options: [
      {
        id: 'loosen',
        text: 'Loosen the censorship. A state afraid of print looks afraid.',
        effects: [
          fx.custom(({ nation }) => {
            nation.press = nation.press === 'state' ? 'pressured' : 'free';
          }),
          fx.standing(3),
          fx.ideology('auth', -4),
          fx.stability(-2),
        ],
      },
      {
        id: 'double_down',
        text: 'Tighten it further. Order is not negotiated with typesetters.',
        effects: [fx.ideology('auth', 5), fx.unrest(5), fx.stability(2), fx.standing(-3)],
      },
      {
        id: 'coopt',
        text: 'Buy the loudest papers quietly. Ownership censors best.',
        effects: [fx.treasury(-50), fx.stability(1), fx.ideology('auth', 2)],
      },
    ],
  },

  // 10 ── Debt crisis ─────────────────────────────────────────────────
  {
    id: 'sc_sys_debt',
    title: 'Letters That Begin "Reluctantly"',
    speaker: 'Finance Ministry',
    text: () =>
      `The treasury's red ink has reached the page where it can no longer be ruled off. Short-term notes fall due next month; the banks roll them over at rates that are themselves a commentary. Your finance ministry presents three doors, none marked exit: cut, borrow, or tax. Abroad, the bondholders' committees have begun writing letters of the sort that start with "reluctantly" and end with conditions.`,
    options: [
      {
        id: 'austerity',
        text: 'Cut. Pensions, works, subsidies — everything but the interest.',
        effects: [fx.treasury(70), fx.stability(-5), fx.unrest(5), fx.standing(1)],
      },
      {
        id: 'borrow',
        text: 'A new loan on the market, at the market’s terms.',
        effects: [
          fx.custom(({ nation }) => {
            nation.treasury += 200;
            nation.debts.push({ holder: 'market', principal: 200, rate: 0.006 });
          }),
          fx.standing(-2),
        ],
      },
      {
        id: 'tax',
        text: 'Raise taxes and say so plainly.',
        effects: [
          fx.custom(({ nation }) => {
            nation.taxRate = Math.min(0.6, nation.taxRate + 0.05);
          }),
          fx.treasury(40),
          fx.stability(-3),
          fx.capital(-3),
        ],
      },
    ],
  },

  // 11 ── Veterans' march ─────────────────────────────────────────────
  {
    id: 'sc_sys_veterans',
    title: 'Medals Over Mended Coats',
    speaker: 'Interior Ministry',
    text: () =>
      `They march in good order — they would, having learned it the hard way — down the boulevard to the war memorial: men in their forties wearing their medals over mended coats. Their petition asks for the pension adjustment promised in two budgets and delivered in neither. The police line watches; the crowd on the pavements is with the marchers, and everyone can hear it. Old soldiers are arithmetic too, of a kind governments misplace.`,
    options: [
      {
        id: 'pensions',
        text: 'Pay the adjustment. The debt is older than the budget.',
        effects: [fx.treasury(-60), fx.stability(4), fx.warSupport(3), fx.unrest(-3)],
      },
      {
        id: 'receive',
        text: 'Receive their delegation yourself, with full honors and half promises.',
        effects: [fx.capital(-4), fx.stability(2), fx.ideology('natl', 2)],
      },
      {
        id: 'disperse',
        text: 'Disperse the march. Memorials are not parade grounds.',
        effects: [fx.unrest(6), fx.stability(-4), fx.ideology('auth', 3), fx.warSupport(-3)],
      },
    ],
  },

  // 12 ── State funeral diplomacy ─────────────────────────────────────
  {
    id: 'sc_sys_funeral',
    title: 'The Season’s True Congress',
    speaker: 'Protocol Office',
    text: ({ state, nation }) => {
      const host = funeralHost(state, nation) ?? 'a neighboring capital';
      return `Word from ${host}: a statesman of the old generation has died — one of the men who signed the treaties everyone now disputes. The funeral will be the season's true congress: every chancery sends someone, and the order of precedence in the procession will be read like a communiqué. Your invitation has arrived, edged in black. The mourning is the easiest part of the costume to choose.`;
    },
    options: [
      {
        id: 'attend',
        text: 'Attend in person. Graves are where Europe still talks.',
        effects: [
          fx.capital(-4),
          fx.custom(({ state, nation }) => {
            const host = funeralHost(state, nation);
            if (!host) return;
            const rel = state.nations[host]?.relations[nation.id];
            if (rel) {
              rel.opinion = Math.min(100, rel.opinion + 10);
              rel.trust = Math.min(100, rel.trust + 3);
            }
          }),
          fx.standing(2),
        ],
      },
      {
        id: 'send_minister',
        text: 'Send the foreign minister with a handsome wreath.',
        effects: [
          fx.custom(({ state, nation }) => {
            const host = funeralHost(state, nation);
            if (!host) return;
            const rel = state.nations[host]?.relations[nation.id];
            if (rel) rel.opinion = Math.min(100, rel.opinion + 4);
          }),
        ],
      },
      {
        id: 'regrets',
        text: 'Send regrets. The calendar at home is unforgiving.',
        effects: [
          fx.capital(2),
          fx.custom(({ state, nation }) => {
            const host = funeralHost(state, nation);
            if (!host) return;
            const rel = state.nations[host]?.relations[nation.id];
            if (rel) rel.opinion = Math.max(-100, rel.opinion - 6);
          }),
        ],
      },
    ],
  },
];

export const EVENTS: EventDef[] = [
  {
    id: 'sys_famine',
    nationId: 'any',
    condition: (_state, nation) => (nation.stockpiles.grain ?? 0) <= 0,
    sceneId: 'sc_sys_famine',
    cooldown: 12,
    weight: 3,
  },
  {
    id: 'sys_strike',
    nationId: 'any',
    condition: (state, nation) => avgUnrest(state, nation) > 50 && nation.ideology.planned < 0,
    sceneId: 'sc_sys_strike',
    cooldown: 18,
    weight: 2,
  },
  {
    id: 'sys_coup_plot',
    nationId: 'any',
    condition: (state, nation) =>
      (nation.stability < 30 && nation.ideology.auth > 20) ||
      disloyalGeneral(state, nation) !== undefined,
    sceneId: 'sc_sys_coup_plot',
    cooldown: 24,
    weight: 2,
  },
  {
    id: 'sys_scandal',
    nationId: 'any',
    condition: (state, nation) =>
      state.turn >= 3 && pickMinister(state, nation) !== undefined && nation.stability > 15,
    sceneId: 'sc_sys_scandal',
    cooldown: 24,
    weight: 1,
  },
  {
    id: 'sys_crash',
    nationId: 'any',
    condition: (state) => state.worldTension > 70,
    sceneId: 'sc_sys_crash',
    cooldown: 60,
    weight: 2,
  },
  {
    id: 'sys_harvest',
    nationId: 'any',
    condition: (state, nation) => {
      const month = state.turn % 12;
      return month >= 7 && month <= 9 && nation.stability > 30;
    },
    sceneId: 'sc_sys_harvest',
    cooldown: 24,
    weight: 1,
  },
  {
    id: 'sys_border',
    nationId: 'any',
    condition: (state, nation) =>
      state.worldTension > 20 && neighborOf(state, nation) !== undefined,
    sceneId: 'sc_sys_border',
    cooldown: 15,
    weight: 1,
  },
  {
    id: 'sys_spy_scare',
    nationId: 'any',
    condition: (state) => state.worldTension > 30 && state.turn >= 4,
    sceneId: 'sc_sys_spy_scare',
    cooldown: 20,
    weight: 1,
  },
  {
    id: 'sys_press_backlash',
    nationId: 'any',
    condition: (_state, nation) => nation.press !== 'free',
    sceneId: 'sc_sys_press_backlash',
    cooldown: 18,
    weight: 2,
  },
  {
    id: 'sys_debt',
    nationId: 'any',
    condition: (_state, nation) => nation.treasury < 0,
    sceneId: 'sc_sys_debt',
    cooldown: 18,
    weight: 3,
  },
  {
    id: 'sys_veterans',
    nationId: 'any',
    condition: (state, nation) => state.turn > 6 && nation.stability < 60,
    sceneId: 'sc_sys_veterans',
    cooldown: 24,
    weight: 1,
  },
  {
    id: 'sys_funeral',
    nationId: 'any',
    condition: (state, nation) => state.turn > 4 && funeralHost(state, nation) !== undefined,
    sceneId: 'sc_sys_funeral',
    cooldown: 36,
    weight: 1,
  },
];
