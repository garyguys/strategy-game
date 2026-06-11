/** Engine-driven scenes: campaign opening, election outcomes, succession (I10/N10). */
import type { EventDef, SceneDef } from '../../engine/types';
import { fx } from '../../engine/effects';
import { dateLabel } from '../../engine/util';

export const SCENES: SceneDef[] = [
  {
    id: 'sys_intro',
    title: 'The Year Opens',
    text: ({ state, nation }) => {
      const leader = state.characters[nation.leaderId];
      return (
        `${dateLabel(state.turn)}. The chancelleries of Europe exchange New Year courtesies that nobody drafting them believes. ` +
        `You are ${leader?.name ?? 'the head'} of ${nation.name}: ${nation.note ?? ''} ` +
        `Your ministers wait with the morning's first files. How you spend this year — the treaties, the ledgers, the quiet favors — will be remembered longer than you expect.`
      );
    },
    options: [
      {
        id: 'begin',
        text: 'Begin.',
        effects: [fx.chronicle('A new government year opens', ['politics'])],
      },
    ],
  },
  {
    id: 'sys_election_won',
    title: 'The Returns Come In',
    text: ({ nation }) =>
      `The count runs through the night. By morning it is clear: the government holds, with ${nation.flags['electionShare'] ?? 50}% of the vote. ` +
      `The opposition concedes with the particular grace of people who expect to win next time. Your mandate is renewed — and spent from the moment it is granted.`,
    options: [
      {
        id: 'continue',
        text: 'Back to work.',
        effects: [fx.capital(8), fx.stability(4), fx.chronicle('The government wins re-election', ['politics'])],
      },
      {
        id: 'magnanimous',
        text: 'Offer the opposition a seat at the table.',
        effects: [fx.capital(3), fx.stability(7), fx.ideology('auth', -8), fx.chronicle('A unity gesture follows the election', ['politics'])],
      },
    ],
  },
  {
    id: 'sys_election_lost',
    title: 'The Country Has Spoken',
    text: ({ nation }) =>
      `The numbers do not improve with rereading: ${nation.flags['electionShare'] ?? 45}%. The government has fallen. ` +
      `There is a constitutional way to do this, and you have perhaps one evening to decide whether to follow it — hand over the seals and let history judge the record, or stay on in the new government in a diminished role and keep your hands near the levers.`,
    options: [
      {
        id: 'concede',
        text: 'Concede. Let the record stand.',
        effects: [
          fx.standing(6),
          fx.chronicle('The government concedes defeat and transfers power', ['politics']),
          fx.custom(({ state, nation }) => {
            nation.flags['conceded'] = true;
            const leader = state.characters[nation.leaderId];
            leader?.log.push({ turn: state.turn, text: 'Conceded electoral defeat and left office with the constitution intact.' });
            state.flags['endCampaign'] = 'electionLoss';
          }),
        ],
      },
      {
        id: 'successor',
        text: 'Continue as the successor government.',
        effects: [
          fx.capital(-5),
          fx.stability(-5),
          fx.chronicle('A successor cabinet inherits the government', ['politics']),
          fx.custom(({ state, nation }) => {
            // I10 — play on as the new government: ideology shifts toward the winners
            const top = [...nation.factions].sort((a, b) => b.seats - a.seats)[0];
            if (top) {
              nation.ideology.auth = Math.round((nation.ideology.auth + top.ideology.auth) / 2);
              nation.ideology.planned = Math.round((nation.ideology.planned + top.ideology.planned) / 2);
            }
            const old = state.characters[nation.leaderId];
            if (old) {
              old.log.push({ turn: state.turn, text: 'Lost the election; remained in public life.' });
              state.formerLeaders.push(old.id);
              old.role = 'opposition';
            }
            // promote the most competent minister to the leadership
            const heirs = Object.values(state.characters)
              .filter((c) => c.nationId === nation.id && c.alive && c.id !== nation.leaderId && (c.role === 'minister' || c.role === 'opposition'))
              .sort((a, b) => b.competence - a.competence);
            if (heirs[0]) {
              nation.leaderId = heirs[0].id;
              heirs[0].role = 'leader';
              heirs[0].log.push({ turn: state.turn, text: 'Formed a government after the election.' });
            }
          }),
        ],
      },
    ],
  },
  {
    id: 'sys_leader_death',
    title: 'The Office Falls Vacant',
    text: ({ state, nation }) => {
      const dead = state.characters[(nation.flags['deadLeader'] as string) ?? ''];
      return (
        `${dead?.name ?? 'The head of government'} is dead. The flags come down to half-mast with practiced speed; the questions rise just as fast. ` +
        `The succession must be settled tonight, before the radio speculates it into a crisis.`
      );
    },
    options: [
      {
        id: 'constitutional',
        text: 'Follow the constitutional order.',
        effects: [
          fx.stability(3),
          fx.chronicle('An orderly succession follows the leader’s death', ['politics']),
          fx.custom(({ state, nation }) => {
            const heirs = Object.values(state.characters)
              .filter((c) => c.nationId === nation.id && c.alive && c.role === 'minister')
              .sort((a, b) => b.competence - a.competence);
            if (heirs[0]) {
              state.formerLeaders.push(nation.leaderId);
              nation.leaderId = heirs[0].id;
              heirs[0].role = 'leader';
              heirs[0].log.push({ turn: state.turn, text: 'Succeeded to the leadership on the predecessor’s death.' });
            }
          }),
        ],
      },
      {
        id: 'strongman',
        text: 'Let the strongest hand take the tiller.',
        effects: [
          fx.ideology('auth', 15),
          fx.stability(-4),
          fx.chronicle('A strongman succession follows the leader’s death', ['politics']),
          fx.custom(({ state, nation }) => {
            const heirs = Object.values(state.characters)
              .filter((c) => c.nationId === nation.id && c.alive && (c.role === 'general' || c.role === 'minister'))
              .sort((a, b) => b.loyalty + b.competence - (a.loyalty + a.competence));
            if (heirs[0]) {
              state.formerLeaders.push(nation.leaderId);
              nation.leaderId = heirs[0].id;
              heirs[0].role = 'leader';
              heirs[0].log.push({ turn: state.turn, text: 'Took power in the uncertain hours after the leader’s death.' });
            }
          }),
        ],
      },
    ],
  },
];

export const EVENTS: EventDef[] = [
  {
    id: 'ev_sys_intro',
    nationId: 'any',
    condition: (state) => state.turn === 0,
    sceneId: 'sys_intro',
    once: true,
  },
  {
    id: 'ev_sys_election_won',
    nationId: 'any',
    condition: (_s, nation) => nation.flags['electionResult'] === 'won',
    sceneId: 'sys_election_won',
    cooldown: 2,
  },
  {
    id: 'ev_sys_election_lost',
    nationId: 'any',
    condition: (_s, nation) => nation.flags['electionResult'] === 'lost',
    sceneId: 'sys_election_lost',
    cooldown: 2,
  },
  {
    id: 'ev_sys_leader_death',
    nationId: 'any',
    condition: (state, nation) => !state.characters[nation.leaderId]?.alive,
    sceneId: 'sys_leader_death',
    cooldown: 2,
  },
];
