/**
 * N1 — Turkey arc: "The Guardian of the Straits".
 * Three acts: the Straits conference (1936), the Hatay question and the
 * Mediterranean squeeze (1937–38), and the succession (1938–39).
 */
import type { EventDef, SceneDef } from '../../engine/types';
import { fx } from '../../engine/effects';

export const SCENES: SceneDef[] = [
  // ================================================================
  // ACT 1 — The Straits (turns 2–10)
  // ================================================================
  {
    id: 'tur_straits_gambit',
    title: 'The Straits Question',
    speaker: 'tur_arslanoglu',
    text: () =>
      'Arslanoğlu lays the Lausanne file on your desk, its margins dark with ' +
      'fifteen years of his handwriting. By treaty the Bosphorus is naked: no ' +
      'guns, no garrisons, an international commission counting the ships of ' +
      'other people’s empires through your own front door. "Abyssinia has shown ' +
      'every small nation what a guarantee is worth," he says. "The powers are ' +
      'embarrassed. Embarrassment is a currency, and it is briefly in our favor. ' +
      'We may ask the signatories to revise — politely, publicly, with the ' +
      'League watching. Or we may pour concrete and let them discover it." He ' +
      'waits. He has waited fifteen years; he can wait another minute.',
    options: [
      {
        id: 'conference',
        text: 'Convene the powers and ask politely',
        effects: [
          fx.flag('tur_act', 1),
          fx.flag('tur_straits', 'conference'),
          fx.standing(8),
          fx.league(5),
          fx.relation('United Kingdom', { trust: 6, opinion: 8 }),
          fx.relation('USSR', { opinion: 8 }),
          fx.relation('Greece', { opinion: 6 }),
          fx.charLog('tur_arslanoglu', 'Engineered an international conference to revise the Straits regime.'),
          fx.chronicle('Turkey invites Straits signatories to a revision conference', ['diplomacy', 'turkey']),
          fx.queueScene('tur_straits_outcome', 4),
        ],
      },
      {
        id: 'fortify',
        text: 'Fortify first; negotiate afterward',
        effects: [
          fx.flag('tur_act', 1),
          fx.flag('tur_straits', 'unilateral'),
          fx.tension(8),
          fx.standing(-5),
          fx.warSupport(5),
          fx.relation('United Kingdom', { opinion: -8, fear: 8 }),
          fx.relation('Greece', { fear: 10 }),
          fx.relation('Bulgaria', { fear: 8 }),
          fx.charLog('tur_demiralp', 'Got his wish: engineers and coastal guns moved to the Bosphorus without asking anyone.'),
          fx.chronicle('Turkish engineers begin fortifying the Straits unilaterally', ['crisis', 'turkey']),
          fx.queueScene('tur_straits_outcome', 4),
        ],
      },
      {
        id: 'moscow_first',
        text: 'Sound Moscow before any invitation goes out',
        effects: [
          fx.flag('tur_act', 1),
          fx.flag('tur_straits', 'conference'),
          fx.flag('tur_moscow_first', true),
          fx.capital(-1),
          fx.relation('USSR', { trust: 8, opinion: 6 }),
          fx.relation('United Kingdom', { opinion: -4 }),
          fx.charLog('tur_arslanoglu', 'Took the night train itinerary through Moscow before posting the conference invitations.'),
          fx.queueScene('tur_straits_outcome', 4),
        ],
      },
    ],
  },
  {
    id: 'tur_straits_outcome',
    title: 'What the Conference Yields',
    speaker: 'tur_arslanoglu',
    text: ({ nation }) =>
      nation.flags['tur_straits'] === 'unilateral'
        ? 'The batteries are poured and sighted, and the protests arrive in very ' +
          'fine prose. London regrets; Athens fears; the commission in Istanbul ' +
          'packs its files and asks for a farewell dinner, which Arslanoğlu, to ' +
          'his credit, hosts beautifully. No fleet comes. That is the lesson the ' +
          'attachés will carry home, and the lesson worries even your own ' +
          'ministers: what Turkey took quietly, others may now take loudly. The ' +
          'guns are yours. The precedent belongs to everyone.'
        : 'A lakeside hotel, fifteen delegations, and four weeks of Arslanoğlu ' +
          'declining to raise his voice. The signatories concede what patience ' +
          'asked for: the commission dissolved, the garrisons restored, the ' +
          'Straits yours again under your own signature and theirs. The Soviet ' +
          'delegate toasts an old friendship; the British delegate toasts the ' +
          'sanctity of treaties, glancing at no one in particular. Your foreign ' +
          'minister returns thinner, hoarse, and quietly triumphant, carrying a ' +
          'convention that cost not one soldier.',
    options: [
      {
        id: 'sign',
        text: 'Sign, and thank each delegation by name',
        enabled: ({ nation }) => nation.flags['tur_straits'] === 'conference',
        effects: [
          fx.standing(6),
          fx.league(4),
          fx.relation('United Kingdom', { trust: 5 }),
          fx.relation('USSR', { trust: 5 }),
          fx.charLog('tur_arslanoglu', 'Signed the Straits Convention — remilitarization by consent, his life’s argument vindicated.'),
          fx.chronicle('Straits Convention signed; Turkish garrisons return to the Bosphorus', ['diplomacy', 'turkey']),
        ],
      },
      {
        id: 'man_guns',
        text: 'Man the batteries; answer protests with courtesies',
        enabled: ({ nation }) => nation.flags['tur_straits'] === 'unilateral',
        effects: [
          fx.tension(4),
          fx.warSupport(4),
          fx.relation('Italy', { fear: 6 }),
          fx.relation('United Kingdom', { fear: 5 }),
          fx.charLog('tur_demiralp', 'Inspected the finished Bosphorus batteries and pronounced them adequate, which from him is rapture.'),
          fx.chronicle('Turkish guns command the Bosphorus; the powers confine themselves to notes', ['crisis', 'turkey']),
        ],
      },
      {
        id: 'front_page',
        text: 'Let Güney’s front page say it plainly',
        effects: [
          fx.ideology('natl', 5),
          fx.stability(3),
          fx.charLog('tur_guney', 'Ran the headline THE STRAITS ARE TURKISH AGAIN — the safest sentence he ever printed.'),
        ],
      },
    ],
  },
  {
    id: 'tur_plan_duel',
    title: 'Two Kinds of Smoke',
    speaker: 'tur_tekiner',
    text: () =>
      'Tekiner unrolls the plan across your map table: steel at Karabük, ' +
      'textiles at Kayseri, a railway stitching the plateau to the sea, every ' +
      'mill numbered and every number defended. "Five years," he says, "and the ' +
      'republic makes what it now begs for." But Sarıoğlu has been to see you ' +
      'first, smelling faintly of cologne and wet cement, offering to build ' +
      'three of the mills himself — on private credit, at private profit, with ' +
      'his name over the gates. Tekiner calls him a bazaar with a telephone. ' +
      'Sarıoğlu calls Tekiner a Soviet with better tailoring. The country needs ' +
      'the smoke of factories. It can choose whose.',
    options: [
      {
        id: 'state_plan',
        text: 'The state will build; Tekiner has his plan',
        effects: [
          fx.treasury(-150),
          fx.ideology('planned', 12),
          fx.flag('tur_economy', 'plan'),
          fx.charLog('tur_tekiner', 'Won the five-year plan entire: state mills, state rails, his numbers made law.'),
          fx.charLog('tur_sarioglu', 'Watched the mill contracts go to the state and began pricing his grievances.'),
          fx.charLoyalty('tur_sarioglu', -10),
          fx.chronicle('Ankara adopts a five-year plan of state industry', ['economy', 'turkey']),
        ],
      },
      {
        id: 'private',
        text: 'Sarıoğlu builds; the treasury breathes',
        effects: [
          fx.treasury(40),
          fx.ideology('planned', -10),
          fx.flag('tur_economy', 'private'),
          fx.charLog('tur_sarioglu', 'Took three mills on private credit and ordered his name cast in bronze for the gates.'),
          fx.charLog('tur_tekiner', 'Saw his plan carved up for a contractor and filed every clipping about it.'),
          fx.charLoyalty('tur_tekiner', -10),
          fx.relation('United Kingdom', { opinion: 4 }),
        ],
      },
      {
        id: 'harness',
        text: 'Bind them in one harness, under contract',
        effects: [
          fx.treasury(-60),
          fx.capital(-2),
          fx.flag('tur_economy', 'mixed'),
          fx.stability(2),
          fx.charLog('tur_tekiner', 'Accepted a mixed scheme: his plan, with a contractor yoked inside it.'),
          fx.charLog('tur_sarioglu', 'Signed state contracts at fixed margins and called it patriotism, loudly.'),
          fx.charLoyalty('tur_tekiner', 5),
          fx.charLoyalty('tur_sarioglu', 5),
        ],
      },
    ],
  },
  {
    id: 'tur_sertel_essays',
    title: 'Paper Crosses the Water',
    speaker: 'tur_bozkurt',
    text: () =>
      'Bozkurt sets a thin pamphlet on your desk as though it were evidence in ' +
      'a murder. Hand-copied, smuggled from Paris in a diplomat’s laundry: ' +
      'Halide Sertel’s newest essay, which names his prisons, his methods, and ' +
      '— this is the unforgivable part — his salary. The foreign papers have ' +
      'reprinted it. "She makes the republic ridiculous," he says. What she ' +
      'makes, you suspect, is the republic legible: every line accurate, every ' +
      'sentence a small mirror. Bozkurt wants the couriers found. The couriers ' +
      'are students, mostly, and one elderly bookseller who fought beside you ' +
      'at the Sakarya.',
    options: [
      {
        id: 'hunt',
        text: 'Let him hunt the couriers',
        effects: [
          fx.custom(({ nation }) => {
            nation.press = 'pressured';
          }),
          fx.ideology('auth', 6),
          fx.stability(2),
          fx.charLog('tur_bozkurt', 'Broke the Sertel courier ring in a month; the bookseller’s shop stands empty.'),
          fx.charLog('tur_sertel', 'Her couriers were taken; she answered with a longer essay, dedicated to them by name.'),
          fx.charLoyalty('tur_bozkurt', 6),
          fx.relation('France', { opinion: -4 }),
        ],
      },
      {
        id: 'ignore',
        text: 'A republic that fears an essay is not one',
        effects: [
          fx.standing(4),
          fx.league(2),
          fx.stability(-2),
          fx.charLog('tur_sertel', 'Ankara declined to chase her pamphlets — which, she wrote, was almost worse.'),
          fx.charLog('tur_bozkurt', 'Was told to leave the essayist alone, and entered the order in his private ledger.'),
          fx.charLoyalty('tur_bozkurt', -8),
        ],
      },
      {
        id: 'overture',
        text: 'Send someone to Paris with an open question',
        effects: [
          fx.capital(-2),
          fx.flag('tur_sertel_overture', true),
          fx.charLog('tur_arslanoglu', 'Carried a discreet message to an exiled writer in Paris: what would bring you home?'),
          fx.charLog('tur_sertel', 'Received a visitor from Ankara who asked, without threat, what her terms were.'),
          fx.queueScene('tur_sertel_return', 8),
        ],
      },
    ],
  },
  {
    id: 'tur_sertel_return',
    title: 'The Exile’s Answer',
    speaker: 'tur_sertel',
    text: () =>
      'Her reply arrives months later, in her own hand, without flattery. She ' +
      'will return — on conditions. No oath of contrition. Her books restored ' +
      'to the shops, including the banned ones, especially the banned ones. And ' +
      'a public lectureship, so that her homecoming is an argument and not a ' +
      'pardon. "I do not ask the republic to apologize," she writes. "I ask it ' +
      'to be the thing it claims on its coins." Bozkurt, shown the letter, says ' +
      'one word: theater. Perhaps. But the theater would be full, and the world ' +
      'is watching which plays Ankara dares to stage.',
    options: [
      {
        id: 'amnesty',
        text: 'Amnesty, and a lectureship in Istanbul',
        effects: [
          fx.flag('tur_sertel', 'returned'),
          fx.standing(5),
          fx.league(2),
          fx.charLog('tur_sertel', 'Came home on her own terms; her first lecture filled the hall and half the street.'),
          fx.charLoyalty('tur_sertel', 30),
          fx.charLog('tur_bozkurt', 'Stood at the back of her first lecture, counting the audience like a casualty list.'),
          fx.charLoyalty('tur_bozkurt', -10),
          fx.chronicle('Exiled writer Halide Sertel returns to Istanbul under amnesty', ['turkey']),
        ],
      },
      {
        id: 'refuse',
        text: 'Her terms are insolence; close the channel',
        effects: [
          fx.flag('tur_sertel', 'exiled'),
          fx.ideology('auth', 4),
          fx.charLog('tur_sertel', 'Ankara withdrew its hand; she sharpened her pen and stayed in Paris.'),
          fx.charLog('tur_bozkurt', 'Was vindicated on the Sertel affair and made certain everyone knew it.'),
          fx.charLoyalty('tur_bozkurt', 6),
          fx.relation('France', { opinion: -3 }),
        ],
      },
    ],
  },

  // ================================================================
  // ACT 2 — Hatay, the Mediterranean, the East (turns 12–26)
  // ================================================================
  {
    id: 'tur_hatay_question',
    title: 'The Sandjak',
    speaker: 'tur_arslanoglu',
    text: () =>
      'France is loosening its grip on Syria, and as the mandate slackens, one ' +
      'district slides into question: the Sandjak of Alexandretta, where Turks ' +
      'are the largest of seven peoples and the harbor faces your coast like a ' +
      'held breath. Arslanoğlu has the census figures, three drafts of a ' +
      'protocol, and an opinion he offers carefully: "Paris is frightened of ' +
      'Berlin and cannot afford a quarrel with us. That is leverage. Leverage ' +
      'spent loudly is gone by morning; spent quietly, it compounds." Demiralp ' +
      'has an opinion too, shorter, involving two divisions. The President asks ' +
      'what kind of country takes its neighbors’ provinces. The President also ' +
      'asks how soon.',
    options: [
      {
        id: 'negotiate',
        text: 'A register, a plebiscite, and patience',
        effects: [
          fx.flag('tur_act', 2),
          fx.flag('tur_hatay', 'negotiate'),
          fx.standing(5),
          fx.league(4),
          fx.relation('France', { trust: 6, opinion: 8 }),
          fx.charLog('tur_arslanoglu', 'Opened the Hatay negotiation with Paris: a register, a plebiscite, and no ultimatums.'),
          fx.chronicle('Turkey and France open talks on the Sandjak of Alexandretta', ['diplomacy', 'turkey']),
          fx.queueScene('tur_hatay_result', 5),
        ],
      },
      {
        id: 'agitate',
        text: 'Fund the committees; let the streets petition',
        effects: [
          fx.flag('tur_act', 2),
          fx.flag('tur_hatay', 'agitate'),
          fx.tension(4),
          fx.capital(-2),
          fx.relation('France', { opinion: -8, fear: 4 }),
          fx.charLog('tur_bozkurt', 'His quiet men crossed into the Sandjak with funds, flags, and printing presses.'),
          fx.chronicle('Demonstrations sweep Alexandretta; Paris suspects Ankara’s hand', ['crisis', 'turkey']),
          fx.queueScene('tur_hatay_result', 5),
        ],
      },
      {
        id: 'annex',
        text: 'Move two divisions to the frontier',
        effects: [
          fx.flag('tur_act', 2),
          fx.flag('tur_hatay', 'annex'),
          fx.tension(9),
          fx.warSupport(8),
          fx.casusBelli('France', 'hatay', 12),
          fx.relation('France', { opinion: -14, fear: 14 }),
          fx.relation('United Kingdom', { opinion: -6 }),
          fx.charLog('tur_demiralp', 'Moved two divisions to the Syrian frontier and slept better than he had in years.'),
          fx.chronicle('Turkish divisions mass on the Syrian frontier over Alexandretta', ['crisis', 'turkey']),
          fx.queueScene('tur_hatay_result', 5),
        ],
      },
    ],
  },
  {
    id: 'tur_hatay_result',
    title: 'Alexandretta Answers',
    speaker: 'tur_arslanoglu',
    text: ({ nation }) => {
      const path = nation.flags['tur_hatay'];
      if (path === 'annex')
        return (
          'Paris, with Berlin filling its windows, will not fight for a ' +
          'district it was leaving anyway. The notes grow shorter; the French ' +
          'garrison thins to a courtesy. Demiralp reports the frontier units ' +
          'ready and the roads dry. What remains is the order itself — and the ' +
          'knowledge that every chancellery in Europe will file this beside ' +
          'the Rhineland, proof that the patient men are out of fashion. ' +
          'Arslanoğlu, who spent two years building a reputation for asking, ' +
          'stands by the map saying nothing at all.'
        );
      if (path === 'agitate')
        return (
          'The committees have done their work almost too well. Alexandretta ' +
          'has a flag now, an assembly of sorts, and three dead in the market ' +
          'square that each side counts differently. Paris knows whose money ' +
          'printed the banners and says so privately; publicly it proposes a ' +
          'joint gendarmerie it cannot staff. The district is slipping toward ' +
          'you of its own engineered accord. One recognition — one sentence ' +
          'from Ankara — would finish it, and price it.'
        );
      return (
        'The protocol comes back from Paris with fewer amendments than anyone ' +
        'predicted. A joint register, a phased plebiscite, French honor ' +
        'preserved in the preamble and Turkish interests in every operative ' +
        'clause — Arslanoğlu’s particular art. Geneva calls it a model ' +
        'settlement, which means both capitals can sign it without flinching. ' +
        'It remains only to sign, and to decide how loudly to be gracious.'
      );
    },
    options: [
      {
        id: 'protocol',
        text: 'Sign the protocol; thank Paris publicly',
        enabled: ({ nation }) => nation.flags['tur_hatay'] === 'negotiate',
        effects: [
          fx.standing(7),
          fx.league(4),
          fx.relation('France', { trust: 6, opinion: 6 }),
          fx.charLog('tur_arslanoglu', 'Signed the Alexandretta protocol — a province half-gained without a single shot.'),
          fx.chronicle('Franco-Turkish protocol settles the Sandjak by register and plebiscite', ['diplomacy', 'turkey']),
        ],
      },
      {
        id: 'recognize',
        text: 'Recognize the assembly the committees built',
        enabled: ({ nation }) => nation.flags['tur_hatay'] === 'agitate',
        effects: [
          fx.tension(4),
          fx.flag('tur_hatay_state', true),
          fx.relation('France', { opinion: -6 }),
          fx.charLog('tur_bozkurt', 'His manufactured assembly in Alexandretta was recognized by Ankara within the week.'),
          fx.chronicle('Ankara recognizes the self-declared Hatay assembly', ['crisis', 'turkey']),
        ],
      },
      {
        id: 'march',
        text: 'The column marches at dawn; Aydemir leads it',
        enabled: ({ nation }) => nation.flags['tur_hatay'] === 'annex',
        effects: [
          fx.tension(8),
          fx.warSupport(6),
          fx.flag('tur_aydemir_hero', true),
          fx.relation('France', { opinion: -12, fear: 10 }),
          fx.memory('France', 'Seized Alexandretta under the shadow of our distraction', -3),
          fx.charLog('tur_aydemir', 'Led the column into Alexandretta; the crowds learned his name before Ankara wished them to.'),
          fx.charLoyalty('tur_aydemir', 8),
          fx.chronicle('Turkish troops enter Alexandretta; France protests and does no more', ['war', 'turkey']),
        ],
      },
    ],
  },
  {
    id: 'tur_mediterranean',
    title: 'A Sea With Owners',
    speaker: 'tur_demiralp',
    text: () =>
      'Italian squadrons exercise off the Dodecanese, close enough that your ' +
      'coastal watchers can read the hull numbers. Unmarked submarines have ' +
      'begun sinking neutral freighters bound for Spain; one went down within ' +
      'sight of your lighthouse keepers. Scarpa speaks from his balcony of a ' +
      'Roman sea. Demiralp spreads the chart: "Every power in that water is ' +
      'courting us this season. London offers assurances and the Mediterranean ' +
      'Fleet. Moscow offers credits and an old friendship with new conditions. ' +
      'Or we trust the shore batteries, which have never once changed sides." ' +
      'Arslanoğlu observes that neutrality is also an alignment — merely one ' +
      'with no allies in it.',
    options: [
      {
        id: 'london',
        text: 'Take London’s hand while it is offered',
        effects: [
          fx.flag('tur_alignment', 'london'),
          fx.standing(4),
          fx.relation('United Kingdom', { trust: 10, opinion: 10 }),
          fx.relation('Italy', { opinion: -10 }),
          fx.relation('Germany', { opinion: -4 }),
          fx.charLog('tur_arslanoglu', 'Aligned Turkey with Britain in the Mediterranean — assurances exchanged, patrol charts shared.'),
          fx.chronicle('Anglo-Turkish naval understanding announced in the Mediterranean', ['diplomacy', 'turkey']),
        ],
      },
      {
        id: 'moscow',
        text: 'The old friendship with Moscow, renewed in writing',
        effects: [
          fx.flag('tur_alignment', 'moscow'),
          fx.treasury(80),
          fx.relation('USSR', { trust: 10, opinion: 12 }),
          fx.relation('United Kingdom', { opinion: -6 }),
          fx.charLog('tur_arslanoglu', 'Renewed the Soviet friendship treaty with naval clauses he declined to publish.'),
          fx.charLog('tur_tekiner', 'Secured Soviet machinery credits as the price of friendship — his mills will not wait.'),
          fx.chronicle('Turkey and the USSR renew their friendship pact with new credits', ['diplomacy', 'turkey']),
        ],
      },
      {
        id: 'alone',
        text: 'Neither. Shore batteries do not change sides',
        effects: [
          fx.flag('tur_alignment', 'alone'),
          fx.treasury(-100),
          fx.ideology('natl', 8),
          fx.custom(({ nation }) => {
            nation.military.navy += 4;
          }),
          fx.relation('Italy', { fear: 6 }),
          fx.charLog('tur_demiralp', 'Won the argument for armed neutrality: new coastal works from Izmir to the Straits.'),
          fx.chronicle('Ankara declares armed neutrality and expands its coastal defenses', ['turkey']),
        ],
      },
    ],
  },
  {
    id: 'tur_aydemir_restless',
    title: 'The Young General',
    speaker: 'tur_karaca',
    text: () =>
      'Karaca requests ten minutes and uses seven. "Aydemir," he says, and lets ' +
      'the name sit. The youngest general in the army has been dining with ' +
      'deputies, lending books to colonels, publishing essays on national ' +
      'destiny under a pen name that fools no one. Nothing illegal. Nothing ' +
      'even improper, quite. But there is a current around him now, the kind ' +
      'Karaca has spent a career grounding. "He believes the civilians are too ' +
      'patient with the world. Some captains believe it with him. I do not ' +
      'bring you a conspiracy, Mr. President. I bring you the weather, before ' +
      'it becomes one."',
    options: [
      {
        id: 'east_command',
        text: 'Give him the eastern command, far from Ankara',
        effects: [
          fx.flag('tur_aydemir', 'east'),
          fx.stability(2),
          fx.capital(-1),
          fx.charLog('tur_aydemir', 'Posted to the eastern command — an honor, a distance, and an insult, in that order.'),
          fx.charLog('tur_karaca', 'Recommended distance for the young general and signed the posting himself.'),
          fx.charLoyalty('tur_aydemir', -5),
        ],
      },
      {
        id: 'inside',
        text: 'A chair on the defence council; bind him close',
        effects: [
          fx.flag('tur_aydemir', 'inside'),
          fx.ideology('natl', 4),
          fx.charLog('tur_aydemir', 'Given a seat on the defence council; his essays now circulate as memoranda.'),
          fx.charLog('tur_karaca', 'Watched the young general seated at the council table and recalculated his retirement.'),
          fx.charLoyalty('tur_aydemir', 15),
          fx.charLoyalty('tur_karaca', -6),
        ],
      },
      {
        id: 'watched',
        text: 'Let Bozkurt keep a file on him',
        effects: [
          fx.flag('tur_aydemir', 'watched'),
          fx.stability(1),
          fx.capital(-2),
          fx.charLog('tur_bozkurt', 'Opened a file on General Aydemir: dinners, colonels, pen names, all of it.'),
          fx.charLog('tur_aydemir', 'Noticed the new clerk in his outer office and began writing for a smaller audience.'),
          fx.charLoyalty('tur_aydemir', -15),
        ],
      },
    ],
  },
  {
    id: 'tur_kurdish_east',
    title: 'The Mountains Are Not Quiet',
    speaker: 'tur_bozkurt',
    text: () =>
      'The reports from Eastern Anatolia agree on facts and on nothing else. ' +
      'Tax collectors turned back from three valleys. A gendarme post burned; a ' +
      'village burned in reply, by whom the file does not say. Kurdish notables ' +
      'have sent a petition — schools in their own language, an end to the ' +
      'resettlement orders, a governor who has seen the mountains he governs. ' +
      'Bozkurt calls the petition sedition with good handwriting and asks for ' +
      'columns. Tekiner’s railway survey sits unfunded in the same valleys. ' +
      'Leyla, uninvited, has read the petition aloud at your table: "They are ' +
      'asking, father. The asking is the loyal part. Refuse, and what remains?"',
    options: [
      {
        id: 'invest',
        text: 'Roads, schools, and an honest governor',
        effects: [
          fx.treasury(-120),
          fx.unrest(-8, 'tur_east'),
          fx.standing(3),
          fx.custom(({ state }) => {
            const m = state.regions['tur_east']?.minority;
            if (m) m.policy = 'integrate';
          }),
          fx.charLog('tur_tekiner', 'Got his eastern railway funded at last — rails, he argues, pacify better than rifles.'),
          fx.charLog('tur_bozkurt', 'Overruled on the east; his columns stood down in favor of road crews.'),
          fx.charLoyalty('tur_bozkurt', -8),
          fx.chronicle('Ankara answers the eastern petitions with roads and schools', ['turkey']),
        ],
      },
      {
        id: 'columns',
        text: 'The columns go in; the valleys will be quiet',
        effects: [
          fx.unrest(12, 'tur_east'),
          fx.warSupport(3),
          fx.standing(-6),
          fx.league(-3),
          fx.tension(3),
          fx.charLog('tur_bozkurt', 'Sent the columns into the eastern valleys; his reports count villages, not names.'),
          fx.custom(({ state, nation }) => {
            if (nation.flags['tur_aydemir'] === 'east') {
              const c = state.characters['tur_aydemir'];
              if (c) {
                c.log.push({ turn: state.turn, text: 'Commanded the eastern operations; learned what orders cost, and gave them anyway.' });
                c.loyalty = Math.min(100, c.loyalty + 5);
              }
            }
          }),
          fx.chronicle('Military columns move into Eastern Anatolia; the foreign press counts the smoke', ['crisis', 'turkey']),
        ],
      },
      {
        id: 'devolve',
        text: 'Hear the notables; a measured devolution',
        effects: [
          fx.unrest(-12, 'tur_east'),
          fx.stability(-4),
          fx.standing(4),
          fx.ideology('natl', -6),
          fx.custom(({ state }) => {
            const m = state.regions['tur_east']?.minority;
            if (m) m.policy = 'autonomy';
          }),
          fx.charLog('tur_leyla', 'Argued the eastern petition at her father’s table and, for once, won.'),
          fx.charLoyalty('tur_leyla', 8),
          fx.charLog('tur_bozkurt', 'Called the eastern devolution a surrender on installment, in writing, for the record.'),
          fx.charLoyalty('tur_bozkurt', -12),
          fx.chronicle('Ankara grants measured local autonomy in the Kurdish east', ['turkey']),
        ],
      },
    ],
  },

  // ================================================================
  // ACT 3 — Succession and the gathering storm (turns 28–44)
  // ================================================================
  {
    id: 'tur_erkan_health',
    title: 'The President’s Hands',
    speaker: 'tur_leyla',
    text: () =>
      'Leyla comes to you — to the cabinet’s inner circle — with a folder she ' +
      'was never meant to find. The tremor in the President’s hands is not ' +
      'fatigue. The doctors’ reports, filed under a clerk’s name, use the word ' +
      'cirrhosis once and then retreat into Latin. He has forbidden discussion; ' +
      'he reviews parades; last week he stood ninety minutes in the rain ' +
      'because sitting would be seen. "My father is dying at the rate the ' +
      'republic can bear," Leyla says, "which he has decided is slowly. I am ' +
      'asking what you will do, because he will not ask anything at all." ' +
      'Outside, the capital he built goes on, unknowing.',
    options: [
      {
        id: 'conceal',
        text: 'The founder must be seen; conceal it',
        effects: [
          fx.flag('tur_leyla', 'critic'),
          fx.stability(3),
          fx.capital(-2),
          fx.charLog('tur_erkan', 'His illness was sealed behind a clerk’s filing name; he reviewed parades in the rain.'),
          fx.charLog('tur_leyla', 'Told that her father’s dying was a state secret, she became the state’s quietest critic.'),
          fx.charLoyalty('tur_leyla', -10),
          fx.queueScene('tur_succession', 4),
        ],
      },
      {
        id: 'cabinet',
        text: 'Tell the cabinet; let Leyla keep the door',
        effects: [
          fx.flag('tur_leyla', 'confidante'),
          fx.stability(-3),
          fx.standing(2),
          fx.charLog('tur_erkan', 'Allowed the cabinet the truth of his illness, on condition no one pitied him aloud.'),
          fx.charLog('tur_leyla', 'Became keeper of her father’s door and schedule — the republic’s last appointment book.'),
          fx.charLoyalty('tur_leyla', 12),
          fx.queueScene('tur_succession', 4),
        ],
      },
      {
        id: 'vienna',
        text: 'A specialist from Vienna, travelling under another name',
        effects: [
          fx.treasury(-40),
          fx.stability(1),
          fx.flag('tur_leyla', 'confidante'),
          fx.charLog('tur_erkan', 'Received a Viennese specialist travelling as a carpet buyer; the prognosis did not change.'),
          fx.charLog('tur_leyla', 'Arranged the foreign doctor’s false papers herself and kept the second set of records.'),
          fx.queueScene('tur_succession', 4),
        ],
      },
    ],
  },
  {
    id: 'tur_succession',
    title: 'The Chair Is Empty',
    speaker: 'tur_us',
    text: ({ nation }) =>
      'It ends on a grey morning, between one breath and the one that does not ' +
      'come. The flags go to half-mast before the radio speaks; the country ' +
      'learns it from the silence. ' +
      (nation.flags['tur_leyla'] === 'confidante'
        ? 'Leyla was at his bedside, holding the hands the crowds were never shown. '
        : 'Leyla learns it by telephone, third, and will not forget the order of the calls. ') +
      'Within the hour, Us is in your anteroom with the party’s condolences and ' +
      'the party’s arithmetic. Aydemir’s officers have sent a wreath and, less ' +
      'publicly, a question. Arslanoğlu has sent nothing; he is at the ' +
      'Assembly, reading the constitution as though it were a will. The founder ' +
      'is dead. The republic he built must now prove it is a republic.',
    options: [
      {
        id: 'constitution',
        text: 'The constitution speaks: the Assembly elects Arslanoğlu',
        effects: [
          fx.flag('tur_act', 3),
          fx.flag('tur_succession', 'constitution'),
          fx.charDies('tur_erkan'),
          fx.custom(({ state, nation }) => {
            nation.leaderId = 'tur_arslanoglu';
            const c = state.characters['tur_arslanoglu'];
            if (c) c.post = null;
            delete nation.ministers.foreign;
          }),
          fx.stability(4),
          fx.standing(5),
          fx.league(3),
          fx.charLog('tur_arslanoglu', 'Elected President by the Assembly, by the book he had carried for twenty years.'),
          fx.charLog('tur_aydemir', 'Watched the diplomats inherit the republic and resumed writing under his pen name.'),
          fx.charLoyalty('tur_aydemir', -10),
          fx.chronicle('President Erkan is dead; the Assembly elects Arslanoğlu in lawful succession', ['turkey']),
          fx.queueScene('tur_ending', 6),
        ],
      },
      {
        id: 'officers',
        text: 'The officers escort the Assembly to its choice',
        enabled: ({ nation }) => nation.flags['tur_aydemir'] !== 'watched',
        effects: [
          fx.flag('tur_act', 3),
          fx.flag('tur_succession', 'officers'),
          fx.charDies('tur_erkan'),
          fx.custom(({ nation }) => {
            nation.leaderId = 'tur_aydemir';
          }),
          fx.ideology('auth', 15),
          fx.ideology('natl', 10),
          fx.stability(-6),
          fx.tension(5),
          fx.relation('United Kingdom', { opinion: -10 }),
          fx.relation('Germany', { opinion: 6 }),
          fx.charLog('tur_aydemir', 'Acclaimed President with the Assembly voting under the eyes of his captains.'),
          fx.charLog('tur_karaca', 'Refused to attend the acclamation and tendered a resignation no one dared accept.'),
          fx.charLoyalty('tur_karaca', -15),
          fx.chronicle('President Erkan is dead; General Aydemir assumes the presidency with the army at his back', ['crisis', 'turkey']),
          fx.queueScene('tur_ending', 6),
        ],
      },
      {
        id: 'party',
        text: 'Us delivers the party’s unanimous acclamation',
        effects: [
          fx.flag('tur_act', 3),
          fx.flag('tur_succession', 'party'),
          fx.charDies('tur_erkan'),
          fx.custom(({ nation }) => {
            nation.leaderId = 'tur_us';
            nation.press = 'state';
          }),
          fx.ideology('auth', 8),
          fx.ideology('planned', 4),
          fx.stability(2),
          fx.standing(-4),
          fx.charLog('tur_us', 'Delivered the party’s unanimous vote and took the presidency as a clerk takes minutes: completely.'),
          fx.chronicle('President Erkan is dead; party secretary Us is acclaimed his successor', ['turkey']),
          fx.queueScene('tur_ending', 6),
        ],
      },
    ],
  },
  {
    id: 'tur_ending',
    title: 'What the Republic Keeps',
    text: ({ nation }) => {
      const align = nation.flags['tur_alignment'];
      const succ = nation.flags['tur_succession'];
      const alignLine =
        align === 'london'
          ? 'The British understanding holds: their fleet exercises off your coast, and their ambassador no longer asks twice.'
          : align === 'moscow'
            ? 'The Moscow friendship holds, with its credits and its conditions, each renewal read more carefully than the last.'
            : 'You stand alone by choice, behind shore batteries and a neutrality that must be re-armed every season.';
      const succLine =
        succ === 'officers'
          ? 'A general governs from the founder’s desk, and the captains who put him there have not gone home.'
          : succ === 'party'
            ? 'The party governs as a machine governs: smoothly, completely, and without once asking the road.'
            : 'The constitution survived its author — which, Arslanoğlu observes, is the only test a constitution has.';
      return (
        'Spring, 1939. Europe is arming in earnest now; the chancelleries that ' +
        'once courted you have begun, simply, to count you. ' +
        alignLine +
        ' ' +
        succLine +
        ' At the founder’s tomb the honor guard changes in silence. The Straits ' +
        'are yours; the storm is everyone’s. What remains is to decide what ' +
        'this republic is for, while the deciding is still yours to do.'
      );
    },
    options: [
      {
        id: 'sentinel',
        text: 'The sentinel: guard the Straits, join no one’s war',
        effects: [
          fx.flag('tur_ending', 'sentinel'),
          fx.tension(-3),
          fx.stability(5),
          fx.standing(4),
          fx.custom(({ state, nation }) => {
            state.characters[nation.leaderId]?.log.push({
              turn: state.turn,
              text: 'Set the republic’s course as armed sentinel of the Straits, belonging to no bloc.',
            });
          }),
          fx.chronicle('Ankara proclaims itself sentinel of the Straits, pledged to no bloc', ['turkey']),
        ],
      },
      {
        id: 'committed',
        text: 'Stand with the friends we chose',
        enabled: ({ nation }) => nation.flags['tur_alignment'] === 'london' || nation.flags['tur_alignment'] === 'moscow',
        effects: [
          fx.flag('tur_ending', 'committed'),
          fx.tension(2),
          fx.custom(({ state, nation }) => {
            const friend = nation.flags['tur_alignment'] === 'moscow' ? 'USSR' : 'United Kingdom';
            const rel = state.nations[friend]?.relations[nation.id];
            if (rel) {
              rel.trust = Math.min(100, rel.trust + 10);
              rel.opinion = Math.min(100, rel.opinion + 10);
            }
          }),
          fx.custom(({ state, nation }) => {
            state.characters[nation.leaderId]?.log.push({
              turn: state.turn,
              text: 'Committed the republic openly to its chosen partner before the gathering war.',
            });
          }),
          fx.chronicle('Turkey converts its understanding into open commitment', ['diplomacy', 'turkey']),
        ],
      },
      {
        id: 'hearth',
        text: 'Turn inward: steel, schools, and silence',
        effects: [
          fx.flag('tur_ending', 'hearth'),
          fx.treasury(-80),
          fx.ideology('planned', 6),
          fx.stability(3),
          fx.charLog('tur_tekiner', 'Given the storm years to build in: every lira to mills and schools, none to wars.'),
          fx.custom(({ state, nation }) => {
            state.characters[nation.leaderId]?.log.push({
              turn: state.turn,
              text: 'Turned the republic inward — to build, and to be overlooked, until the storm passed.',
            });
          }),
          fx.chronicle('Ankara turns inward, betting that builders outlast soldiers', ['economy', 'turkey']),
        ],
      },
    ],
  },
];

export const EVENTS: EventDef[] = [
  // ---- Act 1 ----
  {
    id: 'tur_e_straits',
    nationId: 'Turkey',
    condition: (state) => state.turn >= 2,
    sceneId: 'tur_straits_gambit',
    once: true,
  },
  {
    id: 'tur_e_plan',
    nationId: 'Turkey',
    condition: (state, nation) => state.turn >= 4 && nation.flags['tur_act'] === 1,
    sceneId: 'tur_plan_duel',
    once: true,
  },
  {
    id: 'tur_e_sertel',
    nationId: 'Turkey',
    condition: (state, nation) => state.turn >= 6 && nation.flags['tur_act'] === 1,
    sceneId: 'tur_sertel_essays',
    once: true,
  },
  // ---- Act 2 ----
  {
    id: 'tur_e_hatay',
    nationId: 'Turkey',
    condition: (state, nation) => state.turn >= 12 && nation.flags['tur_act'] === 1,
    sceneId: 'tur_hatay_question',
    once: true,
  },
  {
    id: 'tur_e_med',
    nationId: 'Turkey',
    condition: (state, nation) => state.turn >= 16 && nation.flags['tur_act'] === 2,
    sceneId: 'tur_mediterranean',
    once: true,
  },
  {
    id: 'tur_e_aydemir',
    nationId: 'Turkey',
    condition: (state, nation) => state.turn >= 18 && nation.flags['tur_act'] === 2,
    sceneId: 'tur_aydemir_restless',
    once: true,
  },
  {
    id: 'tur_e_east',
    nationId: 'Turkey',
    condition: (state, nation) => state.turn >= 20 && nation.flags['tur_act'] === 2,
    sceneId: 'tur_kurdish_east',
    once: true,
  },
  // ---- Act 3 ----
  {
    id: 'tur_e_health',
    nationId: 'Turkey',
    condition: (state, nation) => state.turn >= 28 && nation.flags['tur_act'] === 2,
    sceneId: 'tur_erkan_health',
    once: true,
  },
];
