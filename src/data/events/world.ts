/**
 * N8 — conditional, history-shaped world events.
 * These fire from state, not from a script: dates drift, outcomes drift,
 * and the player's reaction is the point.
 */
import type { EventDef, SceneDef } from '../../engine/types';
import { fx } from '../../engine/effects';

/** Raise how much the European powers fear Germany. */
const fearOfGermany = (amount: number) =>
  fx.custom(({ state }) => {
    const watchers = [
      'France',
      'Czechoslovakia',
      'Poland',
      'Sweden',
      'United Kingdom',
      'USSR',
      'Yugoslavia',
      'Romania',
    ];
    for (const id of watchers) {
      const rel = state.nations[id]?.relations['Germany'];
      if (rel) rel.fear = Math.min(100, rel.fear + amount);
    }
  });

/** The war begins: set the world flags and remember the date. */
const spanishWarBegins = fx.custom(({ state }) => {
  state.flags['spanishCivilWar'] = true;
  state.flags['spanishCivilWarStart'] = state.turn;
  state.worldTension = Math.min(100, state.worldTension + 6);
  const spain = state.nations['Spain'];
  if (spain) spain.stability = Math.min(spain.stability, 20);
});

/** Settle the Spanish war according to the temperature of the world. */
const resolveSpanishWar = fx.custom(({ state }) => {
  const winner = state.worldTension >= 55 ? 'nationalists' : 'republic';
  state.flags['spanishCivilWar'] = false;
  state.flags['spanishWarWinner'] = winner;
  const spain = state.nations['Spain'];
  if (spain) {
    spain.stability = 45;
    if (winner === 'nationalists') {
      spain.ideology.auth = Math.min(100, 70);
      spain.ideology.natl = Math.min(100, 60);
      spain.government = 'Nationalist Directory';
    } else {
      spain.ideology.auth = -30;
      spain.ideology.planned = Math.min(100, spain.ideology.planned + 20);
    }
  }
});

export const SCENES: SceneDef[] = [
  // 1 ── Rhineland-style remilitarization ─────────────────────────────
  {
    id: 'sc_world_rhineland',
    title: 'Soldiers on the Rhine',
    speaker: 'Morning Dispatches',
    text: () =>
      `Dawn telegrams from the west: German battalions have crossed the bridges into the demilitarized zone, bands playing, crowds throwing flowers. The garrison is small — observers count more flags than rifles — but the treaty it tramples was a keystone of the post-war order. Paris convenes its cabinet and waits for London; London consults its lawyers. In your own ministry the maps are already out, and someone has quietly measured the distance from the Rhine to your border.`,
    options: [
      {
        id: 'protest',
        text: 'Protest formally at Geneva.',
        effects: [
          fx.tension(8),
          fearOfGermany(8),
          fx.league(3),
          fx.standing(3),
          fx.relation('Germany', { opinion: -8 }),
          fx.chronicle('Lodged a formal protest over the Rhine remilitarization.', ['diplomacy']),
        ],
      },
      {
        id: 'urge_france',
        text: 'Urge Paris, privately, to march.',
        effects: [
          fx.tension(12),
          fearOfGermany(8),
          fx.relation('France', { opinion: 10, trust: 2 }),
          fx.relation('Germany', { opinion: -15 }),
          fx.memory('Germany', 'Pressed France to act against us over the Rhine.', -3),
        ],
      },
      {
        id: 'silence',
        text: 'Say nothing. It is, after all, their own garden.',
        effects: [
          fx.tension(8),
          fearOfGermany(10),
          fx.standing(-3),
          fx.capital(4),
          fx.relation('Germany', { opinion: 6 }),
        ],
      },
    ],
  },

  // 2 ── League humiliation over Abyssinia ────────────────────────────
  {
    id: 'sc_world_abyssinia',
    title: 'The Empty Hall at Geneva',
    speaker: 'Foreign Ministry Dispatch',
    text: () =>
      `The war in Abyssinia is over, and so, perhaps, is something larger. The Emperor pleads his case in Geneva to a hall of averted eyes; the sanctions that were meant to stop Rome merely inconvenienced it. Delegates file out early. The question on every chancery desk is whether collective security is a policy or a eulogy — and what your government will say when the vote on lifting sanctions is called.`,
    options: [
      {
        id: 'champion',
        text: 'Champion the sanctions. Someone must.',
        effects: [
          fx.league(8),
          fx.standing(5),
          fx.treasury(-40),
          fx.relation('Italy', { opinion: -15 }),
          fx.memory('Italy', 'Held the sanctions line against us after Abyssinia.', -3),
          fx.chronicle('Stood by the League sanctions to the last vote.', ['diplomacy', 'league']),
        ],
      },
      {
        id: 'abandon',
        text: 'Vote to lift them. The corpse should be buried decently.',
        effects: [
          fx.league(-6),
          fx.standing(-2),
          fx.relation('Italy', { opinion: 10 }),
          fx.memory('Italy', 'Helped bury the sanctions with dignity.', 2),
        ],
      },
      {
        id: 'abstain',
        text: 'Abstain, and keep your delegation in the corridor.',
        effects: [fx.league(-3), fx.capital(3)],
      },
    ],
  },

  // 3 ── Spain collapses into civil war (W9) ──────────────────────────
  {
    id: 'sc_world_spain_war',
    title: 'Two Spains',
    speaker: 'Foreign Ministry Dispatch',
    text: () =>
      `Spain has come apart. Garrisons rise in the south and in Morocco; the government arms the unions to hold the capital. Within a week there are two Spains, each with a government, an army, and a list. Volunteers and aeroplanes are already moving toward the frontier, not all of them invited. Every chancery in Europe is being asked, politely or otherwise, which Spain it intends to recognise — and what it will let across the border.`,
    options: [
      {
        id: 'arms_republic',
        text: 'Sell arms to the Republic, discreetly.',
        effects: [
          spanishWarBegins,
          fx.tension(4),
          fx.treasury(60),
          fx.standing(-2),
          fx.relation('Spain', { opinion: 15, trust: 3 }),
          fx.relation('Germany', { opinion: -10 }),
          fx.relation('Italy', { opinion: -10 }),
          fx.memory('Spain', 'Armed the Republic in its hour of need.', 4),
          fx.chronicle('Crates marked "agricultural machinery" reach Valencia.', ['spain', 'trade']),
        ],
      },
      {
        id: 'arms_generals',
        text: 'Sell to the generals. They will likely pay in gold, and win.',
        effects: [
          spanishWarBegins,
          fx.tension(4),
          fx.treasury(60),
          fx.standing(-3),
          fx.relation('Germany', { opinion: 8 }),
          fx.relation('Italy', { opinion: 8 }),
          fx.relation('France', { opinion: -8 }),
          fx.memory('Spain', 'Armed the rising against the Republic.', -4),
        ],
      },
      {
        id: 'volunteers',
        text: 'Let volunteers go. Passports are not policy.',
        effects: [
          spanishWarBegins,
          fx.tension(2),
          fx.ideology('natl', -3),
          fx.unrest(2),
          fx.relation('Spain', { opinion: 6 }),
          fx.chronicle('Volunteers entrain for Spain with one-way tickets.', ['spain']),
        ],
      },
      {
        id: 'non_intervention',
        text: 'Strict non-intervention: seal the border, sign the committee paper.',
        effects: [
          spanishWarBegins,
          fx.standing(3),
          fx.league(3),
          fx.tension(-2),
          fx.memory('Spain', 'Closed its doors to us when the war began.', -2),
        ],
      },
    ],
  },

  // 4 ── The Spanish war ends ─────────────────────────────────────────
  {
    id: 'sc_world_spain_ends',
    title: 'The Guns Fall Silent in Spain',
    speaker: 'Foreign Ministry Dispatch',
    text: ({ state }) => {
      const start = (state.flags['spanishCivilWarStart'] as number) ?? 0;
      const months = Math.max(1, state.turn - start);
      return state.worldTension >= 55
        ? `After ${months} months the Spanish war is over, and the generals have won it. The Republic's last ministers cross the Pyrenees in borrowed cars; behind them come the columns of the defeated, a quarter of a million people walking into France with what they can carry. A new Spain announces itself with parades and tribunals. Europe's dictators send congratulations. Europe's democracies send notes asking, carefully, about the prisoners.`
        : `After ${months} months the Spanish war is over, and — to the surprise of the chancelleries that wrote it off — the Republic has held. The rising's foreign patrons, distracted by a quieter Europe, let it starve. A battered government returns to Madrid promising amnesty and delivering some of it. The peace is thin, the country gutted, but the precedent stands: this time, the coup lost.`;
    },
    options: [
      {
        id: 'recognize',
        text: 'Recognize the victors at once. Spain is whoever holds Madrid.',
        effects: [
          resolveSpanishWar,
          fx.relation('Spain', { opinion: 12, trust: 2 }),
          fx.chronicle('Extended recognition to the victorious Spanish government.', ['spain', 'diplomacy']),
        ],
      },
      {
        id: 'withhold',
        text: 'Withhold recognition until the executions stop.',
        effects: [resolveSpanishWar, fx.standing(3), fx.relation('Spain', { opinion: -10 })],
      },
      {
        id: 'exiles',
        text: 'Open the consulates to the defeated. Visas, not communiqués.',
        effects: [
          resolveSpanishWar,
          fx.standing(5),
          fx.treasury(-30),
          fx.ideology('natl', -3),
          fx.memory('Spain', 'Sheltered the losers of our war.', -1),
          fx.chronicle('Issued visas to Spanish exiles by the thousand.', ['spain', 'humanitarian']),
        ],
      },
    ],
  },

  // 5 ── The Great Purge ──────────────────────────────────────────────
  {
    id: 'sc_world_purge',
    title: 'Confessions in Moscow',
    speaker: 'Embassy Wire, Moscow',
    text: () =>
      `Moscow publishes confessions. Old comrades of the revolution recite their treasons in a courtroom with the cadence of men reading from cards, and are gone by morning. The terror has reached the army: Marshal Gusarov's name has vanished from the May Day rostrum, his deep-battle school dispersed to the provinces or worse. Foreign attachés revise their estimates of Soviet divisions downward, and their estimates of the General Secretary's suspicion upward. Your ambassador asks how loudly, if at all, you wish to notice.`,
    options: [
      {
        id: 'condemn',
        text: 'Condemn the trials publicly.',
        effects: [
          fx.custom(({ state }) => {
            const ussr = state.nations['USSR'];
            if (ussr) ussr.stability = Math.max(0, ussr.stability - 10);
            const g = state.characters['sov_gusarov'];
            if (g) {
              g.competence = Math.max(0, g.competence - 20);
              g.loyalty = Math.max(0, g.loyalty - 20);
              g.log.push({
                turn: state.turn,
                text: 'Denounced in the purge press; his staff arrested. He survives, diminished and watched.',
              });
            }
          }),
          fx.standing(3),
          fx.relation('USSR', { opinion: -15 }),
          fx.memory('USSR', 'Lectured us on our own justice.', -2),
        ],
      },
      {
        id: 'silence',
        text: 'Say nothing. Their house, their fires.',
        effects: [
          fx.custom(({ state }) => {
            const ussr = state.nations['USSR'];
            if (ussr) ussr.stability = Math.max(0, ussr.stability - 10);
            const g = state.characters['sov_gusarov'];
            if (g) {
              g.competence = Math.max(0, g.competence - 20);
              g.loyalty = Math.max(0, g.loyalty - 20);
              g.log.push({
                turn: state.turn,
                text: 'Denounced in the purge press; his staff arrested. He survives, diminished and watched.',
              });
            }
          }),
          fx.capital(3),
        ],
      },
      {
        id: 'reassess',
        text: 'Quietly instruct the staff to reassess the Red Army.',
        effects: [
          fx.custom(({ state }) => {
            const ussr = state.nations['USSR'];
            if (ussr) ussr.stability = Math.max(0, ussr.stability - 10);
            const g = state.characters['sov_gusarov'];
            if (g) {
              g.competence = Math.max(0, g.competence - 20);
              g.loyalty = Math.max(0, g.loyalty - 20);
              g.log.push({
                turn: state.turn,
                text: 'Denounced in the purge press; his staff arrested. He survives, diminished and watched.',
              });
            }
            const rel = state.nations[state.playerId]?.relations['USSR'];
            if (rel) rel.fear = Math.max(0, rel.fear - 5);
          }),
          fx.capital(2),
          fx.chronicle('The general staff marks down the Red Army.', ['intelligence']),
        ],
      },
    ],
  },

  // 6 ── Japan plunges into open war in China ─────────────────────────
  {
    id: 'sc_world_china_war',
    title: 'War Without a Declaration',
    speaker: 'Foreign Ministry Dispatch',
    text: () =>
      `A skirmish at a bridge outside Peiping has become, in a month, a war without a declaration. Japanese columns move down the railways of north China; the bombing of open cities fills the world's front pages and newsreels. Washington talks of quarantine while its statutes stay neutral. The order books of your own exporters are not neutral at all, and Tokyo's purchasing agents pay promptly.`,
    options: [
      {
        id: 'condemn_league',
        text: 'Condemn the invasion before the League.',
        effects: [
          fx.tension(8),
          fx.custom(({ state }) => {
            const rel = state.nations['United States']?.relations['Empire of Japan'];
            if (rel) rel.opinion = Math.max(-100, rel.opinion - 25);
          }),
          fx.league(4),
          fx.standing(4),
          fx.relation('Empire of Japan', { opinion: -12 }),
          fx.relation('United States', { opinion: 5 }),
        ],
      },
      {
        id: 'trade_on',
        text: 'Keep trading. Distant wars pay near debts.',
        effects: [
          fx.tension(8),
          fx.custom(({ state }) => {
            const rel = state.nations['United States']?.relations['Empire of Japan'];
            if (rel) rel.opinion = Math.max(-100, rel.opinion - 25);
          }),
          fx.treasury(70),
          fx.standing(-3),
          fx.relation('United States', { opinion: -6 }),
        ],
      },
      {
        id: 'aid_china',
        text: 'Route medical aid to China through the relief societies.',
        effects: [
          fx.tension(8),
          fx.custom(({ state }) => {
            const rel = state.nations['United States']?.relations['Empire of Japan'];
            if (rel) rel.opinion = Math.max(-100, rel.opinion - 25);
          }),
          fx.treasury(-40),
          fx.standing(5),
          fx.relation('Empire of Japan', { opinion: -6 }),
          fx.chronicle('Red Cross crates leave for the China coast.', ['humanitarian']),
        ],
      },
    ],
  },

  // 7 ── A Sudeten-shaped crisis (non-Czechoslovak players) ───────────
  {
    id: 'sc_world_sudeten',
    title: 'Three Million Grievances',
    speaker: 'Foreign Ministry Dispatch',
    text: () =>
      `Berlin has discovered three million grievances in the mountains of Bohemia. The German Bloc in Prague drafts demands it does not expect to be met; the Chancellor's speeches supply the thunder. Czechoslovakia calls up reservists and waits to learn what its friendships are worth. Your ambassadors in Paris, London and Berlin all request instructions on the same evening, which has never happened before.`,
    options: [
      {
        id: 'back_prague',
        text: 'Declare for Prague. Small states must hang together.',
        effects: [
          fx.tension(12),
          fx.worldFlag('sudetenCrisis', true),
          fx.relation('Czechoslovakia', { opinion: 20, trust: 5 }),
          fx.relation('Germany', { opinion: -15 }),
          fx.memory('Czechoslovakia', 'Stood with us when Berlin raised its voice.', 4),
          fx.memory('Germany', 'Took the Czech side in the Sudeten quarrel.', -3),
          fx.chronicle('Declared support for Czechoslovak territorial integrity.', ['crisis', 'diplomacy']),
        ],
      },
      {
        id: 'back_berlin',
        text: 'Call the grievances legitimate. Borders drawn in 1919 are not scripture.',
        effects: [
          fx.tension(10),
          fx.worldFlag('sudetenCrisis', true),
          fx.relation('Germany', { opinion: 15, trust: 4 }),
          fx.relation('Czechoslovakia', { opinion: -25 }),
          fx.standing(-4),
          fx.memory('Czechoslovakia', 'Endorsed the dismemberment talk against us.', -4),
        ],
      },
      {
        id: 'abstain',
        text: 'Say nothing quotable. Instruct all three ambassadors to listen.',
        effects: [
          fx.tension(10),
          fx.worldFlag('sudetenCrisis', true),
          fx.standing(-2),
          fx.capital(3),
        ],
      },
    ],
  },

  // 8 ── The conference (Munich-shaped) ───────────────────────────────
  {
    id: 'sc_world_conference',
    title: 'A Conference About the Map',
    speaker: 'Foreign Ministry Dispatch',
    text: () =>
      `The great powers will meet — without the Czechs — to dispose of the Czech question. Invitations have gone out; the agenda is the map. Some call it the last chance for peace, some the politest ultimatum ever drafted. Your government's voice may be marginal or decisive depending on who else blinks, but silence will also be recorded, and remembered, by both sides of the table.`,
    options: [
      {
        id: 'appease',
        text: 'Urge concession. A province is cheaper than a continent.',
        effects: [
          fx.worldFlag('munichHeld', true),
          fx.worldFlag('sudetenOutcome', 'ceded'),
          fx.tension(-10),
          fx.league(-8),
          fearOfGermany(8),
          fx.relation('Germany', { opinion: 10 }),
          fx.relation('Czechoslovakia', { opinion: -30 }),
          fx.memory('Czechoslovakia', 'Counselled Europe to carve us at the conference table.', -5),
          fx.custom(({ state }) => {
            const csk = state.nations['Czechoslovakia'];
            if (csk) csk.stability = Math.max(0, csk.stability - 15);
          }),
          fx.chronicle('Counselled concession at the great-power conference.', ['crisis', 'diplomacy']),
        ],
      },
      {
        id: 'stand_firm',
        text: 'Urge firmness. Feed this appetite and it grows.',
        effects: [
          fx.worldFlag('munichHeld', true),
          fx.worldFlag('sudetenOutcome', 'standoff'),
          fx.tension(12),
          fx.standing(5),
          fx.relation('Czechoslovakia', { opinion: 15, trust: 8 }),
          fx.relation('Germany', { opinion: -18 }),
          fx.memory('Germany', 'Stiffened the conference against our claims.', -4),
          fx.memory('Czechoslovakia', 'Argued for us at the table we were not given.', 5),
          fx.chronicle('Urged the powers to hold the line at the conference.', ['crisis', 'diplomacy']),
        ],
      },
      {
        id: 'wash_hands',
        text: 'Decline to attend. Let the great powers own what they sign.',
        effects: [
          fx.worldFlag('munichHeld', true),
          fx.worldFlag('sudetenOutcome', 'ceded'),
          fx.tension(4),
          fx.standing(-4),
          fx.capital(3),
          fx.custom(({ state }) => {
            const csk = state.nations['Czechoslovakia'];
            if (csk) csk.stability = Math.max(0, csk.stability - 10);
          }),
        ],
      },
    ],
  },

  // 9 ── American neutrality legislation ──────────────────────────────
  {
    id: 'sc_world_neutrality',
    title: 'Cash and Carry',
    speaker: 'Trade Ministry Memorandum',
    text: () =>
      `The Congress of the United States has renewed and tightened its neutrality statutes: no arms to belligerents, cash-and-carry for the rest, no loans to those still in arrears from the last war. The Atlantic, Washington seems to say, is wide and ought to stay so. Your trade delegations read the schedules carefully. What cannot be bought openly will be bought somehow, by somebody — the only question is the markup.`,
    options: [
      {
        id: 'comply',
        text: 'Trade strictly within the statutes. Goodwill is also a commodity.',
        effects: [
          fx.treasury(-25),
          fx.relation('United States', { opinion: 8, trust: 3 }),
          fx.memory('United States', 'Respected our neutrality laws to the letter.', 2),
        ],
      },
      {
        id: 'intermediaries',
        text: 'Route the sensitive purchases through third flags.',
        effects: [
          fx.treasury(40),
          fx.standing(-3),
          fx.relation('United States', { opinion: -8 }),
        ],
      },
      {
        id: 'lobby',
        text: 'Hire lawyers in Washington and argue your exceptions.',
        effects: [fx.treasury(-20), fx.capital(-3), fx.relation('United States', { opinion: 4, trust: 2 })],
      },
    ],
  },

  // 10 ── Persecution intensifies inside Germany ──────────────────────
  {
    id: 'sc_world_refugees',
    title: 'The Queue at the Consulate',
    speaker: 'Consular Report',
    text: () =>
      `The reports from Germany no longer surprise, which is itself the news. New decrees strip citizenship, livelihoods and names from people whose families have been German for centuries. At your consulates the queues lengthen quietly: doctors, clerks, children with one suitcase each. The visa stamps in your officials' desks have become, without anyone deciding it, instruments of policy. Your interior ministry asks for a ruling it can file. The queue asks for less than that.`,
    options: [
      {
        id: 'open_border',
        text: 'Open the border. Publish the quota, then ignore it generously.',
        effects: [
          fx.standing(6),
          fx.treasury(-40),
          fx.ideology('natl', -5),
          fx.stability(-3),
          fx.relation('Germany', { opinion: -10 }),
          fx.chronicle('Opened the border to those Germany has cast out.', ['humanitarian']),
        ],
      },
      {
        id: 'quiet_visas',
        text: 'Quiet visas: no announcement, no refusals that can be helped.',
        effects: [
          fx.standing(2),
          fx.treasury(-15),
          fx.ideology('natl', -2),
          fx.relation('Germany', { opinion: -3 }),
          fx.flag('quietVisas', true),
        ],
      },
      {
        id: 'look_away',
        text: 'Tighten the rules. This is not your country’s burden.',
        effects: [
          fx.standing(-5),
          fx.capital(2),
          fx.ideology('natl', 3),
          fx.relation('Germany', { opinion: 4 }),
          fx.memory('United States', 'Closed its doors when the queues formed.', -1),
        ],
      },
    ],
  },

  // 11 ── Anatolian earthquake (humanitarian diplomacy) ───────────────
  {
    id: 'sc_world_quake',
    title: 'A Winter Night in Anatolia',
    speaker: 'Foreign Ministry Dispatch',
    text: () =>
      `An earthquake in eastern Anatolia: whole towns of stone and timber brought down in a single winter night, the toll climbing with each wire. Ankara — proud, and short of everything — has not asked for help. The question circulating in your ministry is the old one: whether mercy is a policy, and whether a gift to a wary republic will be remembered as kindness or as pity.`,
    options: [
      {
        id: 'aid_mission',
        text: 'Send a relief mission: doctors, blankets, engineers.',
        effects: [
          fx.treasury(-50),
          fx.standing(4),
          fx.relation('Turkey', { opinion: 15, trust: 3 }),
          fx.memory('Turkey', 'Sent help across the winter without being asked.', 3),
          fx.chronicle('Relief columns depart for the Anatolian earthquake zone.', ['humanitarian']),
        ],
      },
      {
        id: 'condolences',
        text: 'Condolences and a modest credit for reconstruction.',
        effects: [fx.treasury(-15), fx.relation('Turkey', { opinion: 5 })],
      },
      {
        id: 'nothing',
        text: 'A telegram of sympathy. Winters are expensive at home too.',
        effects: [fx.capital(1), fx.relation('Turkey', { opinion: -3 })],
      },
    ],
  },

  // 12 ── The abdication crisis in Britain ────────────────────────────
  {
    id: 'sc_world_abdication',
    title: 'A Crown in the Balance',
    speaker: 'Embassy Wire, London',
    text: () =>
      `London is consumed by a constitutional whisper grown into a crisis: the new King wishes to marry a twice-divorced foreigner, and the Cabinet would rather change kings than precedents. The Empire holds its breath over a wedding. It alters no frontier and moves no division, yet every chancery reads it closely — for what it reveals of British nerve, and of how modern monarchies end: not with a rising, but with a memorandum.`,
    options: [
      {
        id: 'discretion',
        text: 'Perfect discretion. Domestic griefs deserve drawn curtains.',
        effects: [
          fx.relation('United Kingdom', { opinion: 6, trust: 2 }),
          fx.memory('United Kingdom', 'Kept a decent silence during the abdication.', 2),
        ],
      },
      {
        id: 'press_feast',
        text: 'Let your papers feast. Circulation is also a national interest.',
        effects: [fx.stability(1), fx.capital(2), fx.relation('United Kingdom', { opinion: -8 })],
      },
      {
        id: 'lesson',
        text: 'Have the state press draw a sober lesson about duty.',
        effects: [fx.ideology('auth', 2), fx.stability(1), fx.relation('United Kingdom', { opinion: -2 })],
      },
    ],
  },
];

export const EVENTS: EventDef[] = [
  {
    id: 'world_rhineland',
    nationId: 'any',
    condition: (state, nation) =>
      state.turn >= 2 &&
      state.turn <= 6 &&
      state.nations['Germany'].alive &&
      nation.id !== 'Germany',
    sceneId: 'sc_world_rhineland',
    once: true,
    weight: 3,
  },
  {
    id: 'world_abyssinia',
    nationId: 'any',
    condition: (state, nation) =>
      state.turn >= 3 &&
      state.turn <= 8 &&
      state.leagueAuthority > 10 &&
      state.nations['Italy'].alive &&
      nation.id !== 'Italy',
    sceneId: 'sc_world_abyssinia',
    once: true,
    weight: 2,
  },
  {
    id: 'world_spain_war',
    nationId: 'any',
    condition: (state, nation) =>
      state.turn >= 4 &&
      state.nations['Spain'].alive &&
      state.nations['Spain'].stability < 35 &&
      state.flags['spanishCivilWar'] !== true &&
      state.flags['spanishWarWinner'] === undefined &&
      nation.id !== 'Spain',
    sceneId: 'sc_world_spain_war',
    once: true,
    weight: 3,
  },
  {
    id: 'world_spain_ends',
    nationId: 'any',
    condition: (state, nation) =>
      state.flags['spanishCivilWar'] === true &&
      typeof state.flags['spanishCivilWarStart'] === 'number' &&
      state.turn >= (state.flags['spanishCivilWarStart'] as number) + 24 &&
      nation.id !== 'Spain',
    sceneId: 'sc_world_spain_ends',
    once: true,
    weight: 3,
  },
  {
    id: 'world_purge',
    nationId: 'any',
    condition: (state, nation) =>
      state.turn >= 7 &&
      state.turn <= 14 &&
      state.nations['USSR'].alive &&
      state.characters['sov_gusarov'].alive &&
      nation.id !== 'USSR',
    sceneId: 'sc_world_purge',
    once: true,
    weight: 2,
  },
  {
    id: 'world_china_war',
    nationId: 'any',
    condition: (state, nation) =>
      state.turn >= 17 &&
      state.turn <= 22 &&
      state.nations['Empire of Japan'].alive &&
      nation.id !== 'Empire of Japan',
    sceneId: 'sc_world_china_war',
    once: true,
    weight: 2,
  },
  {
    id: 'world_sudeten',
    nationId: 'any',
    condition: (state, nation) =>
      nation.id !== 'Czechoslovakia' &&
      state.turn >= 28 &&
      state.turn <= 34 &&
      state.nations['Germany'].alive &&
      state.nations['Czechoslovakia'].alive &&
      state.flags['sudetenCrisis'] !== true,
    sceneId: 'sc_world_sudeten',
    once: true,
    weight: 3,
  },
  {
    id: 'world_conference',
    nationId: 'any',
    condition: (state, nation) =>
      nation.id !== 'Czechoslovakia' &&
      state.flags['sudetenCrisis'] === true &&
      state.flags['munichHeld'] !== true &&
      state.nations['Germany'].alive &&
      state.nations['Czechoslovakia'].alive,
    sceneId: 'sc_world_conference',
    once: true,
    weight: 3,
  },
  {
    id: 'world_neutrality',
    nationId: 'any',
    condition: (state, nation) =>
      state.turn >= 1 &&
      state.turn <= 10 &&
      state.nations['United States'].alive &&
      nation.id !== 'United States',
    sceneId: 'sc_world_neutrality',
    once: true,
    weight: 1,
  },
  {
    id: 'world_refugees',
    nationId: 'any',
    condition: (state, nation) =>
      state.turn >= 10 &&
      state.turn <= 26 &&
      state.nations['Germany'].alive &&
      state.nations['Germany'].ideology.auth > 60 &&
      nation.id !== 'Germany',
    sceneId: 'sc_world_refugees',
    once: true,
    weight: 2,
  },
  {
    id: 'world_quake',
    nationId: 'any',
    condition: (state, nation) =>
      state.turn >= 3 && state.nations['Turkey'].alive && nation.id !== 'Turkey',
    sceneId: 'sc_world_quake',
    cooldown: 36,
    weight: 1,
  },
  {
    id: 'world_abdication',
    nationId: 'any',
    condition: (state, nation) =>
      state.turn >= 10 &&
      state.turn <= 13 &&
      state.nations['United Kingdom'].alive &&
      nation.id !== 'United Kingdom',
    sceneId: 'sc_world_abdication',
    once: true,
    weight: 1,
  },
];
