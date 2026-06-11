/**
 * N7 — the leader's private life. Six small rooms in a large house:
 * two scenes each for the Dvorský, Lindqvist and Erkan families.
 * Quiet stakes, kept deliberately small.
 */
import type { EventDef, SceneDef } from '../../engine/types';
import { fx } from '../../engine/effects';

export const SCENES: SceneDef[] = [
  // ── Czechoslovakia: Eliška's clinic ───────────────────────────────
  {
    id: 'sc_per_eliska_clinic',
    title: 'A Memorandum on the Subject of Your Wife',
    speaker: 'csk_eliska',
    text: () =>
      `The Castle's chief of protocol has submitted a memorandum, in triplicate, on the subject of your wife. Dr. Dvorská has kept her Tuesday and Friday clinic in Žižkov — workers' wives, mostly, and their children — and last week a French photographer found her there in a borrowed apron. Protocol finds this irregular. Eliška finds protocol irregular. She asks you, over breakfast, whether the republic is in such delicate health that it cannot survive a First Lady who works.`,
    options: [
      {
        id: 'keep_clinic',
        text: 'She keeps the clinic. The republic will manage.',
        effects: [
          fx.stability(2),
          fx.ideology('auth', -2),
          fx.charLoyalty('csk_eliska', 6),
          fx.charLog('csk_eliska', 'The President overruled the protocol office: the Žižkov clinic stays open.'),
          fx.charLog('csk_dvorsky', 'Sided with his wife against his own protocol office, and slept the better for it.'),
        ],
      },
      {
        id: 'ask_pause',
        text: 'Ask her to suspend it — just until the foreign press loses interest.',
        effects: [
          fx.capital(3),
          fx.charLoyalty('csk_eliska', -10),
          fx.charLog('csk_eliska', 'Asked to close her clinic "for the duration." Complied. Did not forgive the phrase.'),
        ],
      },
      {
        id: 'make_official',
        text: 'Make it official: a state patronage for public health, with her name on it.',
        effects: [
          fx.treasury(-25),
          fx.standing(2),
          fx.stability(1),
          fx.charLoyalty('csk_eliska', 3),
          fx.charLog('csk_eliska', 'Her clinic became the seed of a national public-health patronage. She suspects she has been managed, and approves anyway.'),
        ],
      },
    ],
  },

  // ── Czechoslovakia: the President's health ────────────────────────
  {
    id: 'sc_per_dvorsky_health',
    title: 'Her Own Stethoscope',
    speaker: 'csk_eliska',
    text: () =>
      `Eliška notices it before anyone: how you hold the banister, the grey at the edges of your lips after the budget speech. She sits you in her clinic chair on a Sunday and listens to your heart with her own stethoscope, and afterward she does not joke. Rest, she says — real rest, weeks of it — or she will not answer for the spring. The cabinet calendar on your desk says otherwise. She is waiting to learn which of them you believe.`,
    options: [
      {
        id: 'rest',
        text: 'Take the month. The republic has ministers; she has one husband.',
        effects: [
          fx.capital(-10),
          fx.charLoyalty('csk_eliska', 8),
          fx.charLog('csk_dvorsky', 'Withdrew to the country for a month on his wife\'s orders. Returned slower, and alive.'),
          fx.charLog('csk_eliska', 'Prescribed a month\'s rest for the President and, for once, was obeyed.'),
        ],
      },
      {
        id: 'conceal',
        text: 'Work on, and keep the diagnosis between the two of you.',
        effects: [
          fx.capital(4),
          fx.charLoyalty('csk_eliska', -8),
          fx.flag('dvorskyStrained', true),
          fx.charLog('csk_dvorsky', 'Ignored his physician — who is also his wife — and carried the spring schedule unaltered.'),
        ],
      },
      {
        id: 'announce',
        text: 'Tell the country plainly: reduced duties, no mystery.',
        effects: [
          fx.stability(-3),
          fx.standing(2),
          fx.charLoyalty('csk_eliska', 5),
          fx.charLog('csk_dvorsky', 'Announced his reduced schedule himself, before the rumors could. The candor was noted abroad.'),
        ],
      },
    ],
  },

  // ── Sweden: Ingrid's classroom letter ─────────────────────────────
  {
    id: 'sc_per_ingrid_letter',
    title: 'Corrected Gently, in the Margin',
    speaker: 'swe_ingrid',
    text: () =>
      `Ingrid grades compositions at the kitchen table, as she has every Sunday of your marriage. Tonight she slides one across to you. "My father has no work since the yard closed," a boy of eleven writes, "so we eat at my grandmother's, and my father does not come." She has corrected the spelling, gently, in the margin. She does not say what she wants; she has never needed to. She pours the coffee and waits for the Prime Minister to finish reading.`,
    options: [
      {
        id: 'relief_works',
        text: 'Relief works for the yards, in the next budget if not this one.',
        effects: [
          fx.treasury(-50),
          fx.stability(3),
          fx.ideology('planned', 3),
          fx.charLoyalty('swe_ingrid', 5),
          fx.charLog('swe_ingrid', 'A pupil\'s composition crossed the kitchen table and became a line in the budget.'),
        ],
      },
      {
        id: 'keep_separate',
        text: 'Ask her, kindly, not to bring the school into the house.',
        effects: [
          fx.capital(2),
          fx.charLoyalty('swe_ingrid', -8),
          fx.charLog('swe_ingrid', 'Told that the kitchen table was not a ministry. Set out the compositions there the following Sunday, unchanged.'),
        ],
      },
      {
        id: 'write_family',
        text: 'Write to the boy’s family yourself, as a neighbor, not a ministry.',
        effects: [
          fx.stability(1),
          fx.charLoyalty('swe_ingrid', 4),
          fx.charLog('swe_ingrid', 'Watched her husband answer a child\'s composition with a letter in his own hand.'),
          fx.charLog('swe_lindqvist', 'Wrote privately to an unemployed riveter\'s family. The letter was framed, he later heard, not cashed.'),
        ],
      },
    ],
  },

  // ── Sweden: the anonymous threat ──────────────────────────────────
  {
    id: 'sc_per_ingrid_threat',
    title: 'Pasted Capitals, No Stamp',
    speaker: 'swe_ingrid',
    text: () =>
      `The letter came to the school, not the residence — pasted capitals, no stamp, slipped into the staff-room post. It names your wife, names the children's cloakroom, names an hour. The detective inspector calls it the work of a crank; Sigrid Almgren declines, for the moment, to call it anything. Ingrid has read it twice, folded it, and announced that she will be in her classroom on Monday at eight, as always. What she asks of you is to decide nothing in anger.`,
    options: [
      {
        id: 'guard',
        text: 'A plainclothes officer by the school gate. Quietly.',
        effects: [
          fx.capital(-3),
          fx.ideology('auth', 1),
          fx.charLoyalty('swe_ingrid', 4),
          fx.charLog('swe_ingrid', 'Acquired a "new janitor" who reads the same newspaper at the gate each morning. Pretends not to know.'),
          fx.charLog('swe_almgren', 'Arranged discreet protection for the Prime Minister\'s wife without a single line in any register.'),
        ],
      },
      {
        id: 'respect',
        text: 'No guard. Her classroom, her terms.',
        effects: [
          fx.charLoyalty('swe_ingrid', 8),
          fx.stability(1),
          fx.flag('ingridUnguarded', true),
          fx.charLog('swe_ingrid', 'Taught on Monday at eight, as always. The letter went into the stove.'),
        ],
      },
      {
        id: 'sweep',
        text: 'Have Almgren turn over the extremist cells until a name falls out.',
        effects: [
          fx.capital(-5),
          fx.ideology('auth', 3),
          fx.unrest(2),
          fx.charLog('swe_almgren', 'Shook the extremist fringe over a letter to a schoolhouse. Found three other crimes and no author.'),
        ],
      },
    ],
  },

  // ── Turkey: Leyla and the bar ─────────────────────────────────────
  {
    id: 'sc_per_leyla_law',
    title: 'Article by Article',
    speaker: 'tur_leyla',
    text: () =>
      `Leyla has passed her examinations — Sorbonne law, now the Ankara bar — and the party has noticed. Kemalettin Us calls on you, all courtesy, to suggest that the President's daughter pleading political cases would be "open to misconstruction." That evening Leyla quotes the constitution at you from memory, article by article — the one you signed. "Either the republic means it," she says, "or it is a uniform we put on for photographs. Tell me which, and I will dress accordingly."`,
    options: [
      {
        id: 'back_her',
        text: 'She practices, fully. Let the party misconstrue what it likes.',
        effects: [
          fx.ideology('auth', -4),
          fx.stability(-2),
          fx.charLoyalty('tur_leyla', 10),
          fx.charLoyalty('tur_us', -8),
          fx.charLog('tur_leyla', 'Admitted to the Ankara bar with her father\'s public blessing and the party\'s private dismay.'),
          fx.charLog('tur_us', 'Overruled on the question of the President\'s daughter. Filed the defeat where he files everything.'),
        ],
      },
      {
        id: 'quiet_cases',
        text: 'Ask her to take only quiet cases — contracts, estates, no politics.',
        effects: [
          fx.capital(2),
          fx.charLoyalty('tur_leyla', -6),
          fx.charLog('tur_leyla', 'Agreed to a practice of "quiet cases." Within a year, three of them were quietly political.'),
        ],
      },
      {
        id: 'forbid',
        text: 'Not yet. The republic first; the precedent can wait a few years.',
        effects: [
          fx.capital(4),
          fx.ideology('auth', 2),
          fx.charLoyalty('tur_leyla', -14),
          fx.charLog('tur_leyla', 'Forbidden the bar "for now." Began, that week, translating foreign law journals — and circulating them.'),
        ],
      },
    ],
  },

  // ── Turkey: a proposal with strings ───────────────────────────────
  {
    id: 'sc_per_leyla_proposal',
    title: 'A Treaty With Her Name On It',
    speaker: 'tur_leyla',
    text: () =>
      `The proposal arrives correctly: through the Yugoslav legation, on behalf of a kinsman of the Prince Regent — a young diplomat Leyla met twice in Paris and once, decisively, disliked less than she expected. The dowry under discussion is not gold but geometry: Belgrade speaks warmly of Black Sea understandings and Balkan pacts. Arslanoğlu calls the match "usefully unsentimental." Leyla calls it "a treaty with my name on it" — and has not, you notice, said no.`,
    options: [
      {
        id: 'encourage',
        text: 'Encourage the match. Republics also marry well.',
        effects: [
          fx.relation('Yugoslavia', { opinion: 12, trust: 4 }),
          fx.memory('Yugoslavia', 'Entertained the marriage proposal with warmth.', 3),
          fx.charLoyalty('tur_leyla', -8),
          fx.charLog('tur_leyla', 'Watched her father weigh her hand alongside the Balkan pacts, and take notes on both.'),
        ],
      },
      {
        id: 'her_choice',
        text: 'Tell Belgrade, and Leyla, that the decision is hers alone.',
        effects: [
          fx.standing(2),
          fx.relation('Yugoslavia', { opinion: -3 }),
          fx.charLoyalty('tur_leyla', 10),
          fx.charLog('tur_leyla', 'Told that her marriage was no instrument of state. Took a year to answer the young diplomat, on her own paper.'),
          fx.charLog('tur_erkan', 'Declined to trade his daughter\'s hand for a Balkan understanding. Privately relieved by his own answer.'),
        ],
      },
      {
        id: 'decline',
        text: 'Decline politely. The republic does not deal in dowries.',
        effects: [
          fx.relation('Yugoslavia', { opinion: -7 }),
          fx.ideology('natl', 2),
          fx.charLoyalty('tur_leyla', 2),
          fx.charLog('tur_leyla', 'The proposal was declined on her behalf, courteously. She noted the words "on her behalf."'),
        ],
      },
    ],
  },
];

export const EVENTS: EventDef[] = [
  {
    id: 'per_eliska_clinic',
    nationId: 'Czechoslovakia',
    condition: (state, nation) =>
      state.turn >= 2 &&
      state.turn <= 8 &&
      nation.leaderId === 'csk_dvorsky' &&
      state.characters['csk_eliska'].alive,
    sceneId: 'sc_per_eliska_clinic',
    once: true,
    weight: 2,
  },
  {
    id: 'per_dvorsky_health',
    nationId: 'Czechoslovakia',
    condition: (state, nation) =>
      state.turn >= 12 &&
      state.turn <= 30 &&
      nation.leaderId === 'csk_dvorsky' &&
      state.characters['csk_dvorsky'].alive &&
      state.characters['csk_eliska'].alive,
    sceneId: 'sc_per_dvorsky_health',
    once: true,
    weight: 2,
  },
  {
    id: 'per_ingrid_letter',
    nationId: 'Sweden',
    condition: (state, nation) =>
      state.turn >= 2 &&
      state.turn <= 8 &&
      nation.leaderId === 'swe_lindqvist' &&
      state.characters['swe_ingrid'].alive,
    sceneId: 'sc_per_ingrid_letter',
    once: true,
    weight: 2,
  },
  {
    id: 'per_ingrid_threat',
    nationId: 'Sweden',
    condition: (state, nation) =>
      state.turn >= 10 &&
      state.turn <= 30 &&
      nation.leaderId === 'swe_lindqvist' &&
      state.characters['swe_ingrid'].alive,
    sceneId: 'sc_per_ingrid_threat',
    once: true,
    weight: 2,
  },
  {
    id: 'per_leyla_law',
    nationId: 'Turkey',
    condition: (state, nation) =>
      state.turn >= 2 &&
      state.turn <= 10 &&
      nation.leaderId === 'tur_erkan' &&
      state.characters['tur_leyla'].alive,
    sceneId: 'sc_per_leyla_law',
    once: true,
    weight: 2,
  },
  {
    id: 'per_leyla_proposal',
    nationId: 'Turkey',
    condition: (state, nation) =>
      state.turn >= 12 &&
      state.turn <= 30 &&
      nation.leaderId === 'tur_erkan' &&
      state.characters['tur_leyla'].alive,
    sceneId: 'sc_per_leyla_proposal',
    once: true,
    weight: 2,
  },
];
