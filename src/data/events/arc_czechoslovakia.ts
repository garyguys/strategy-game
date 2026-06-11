/**
 * N1 — Czechoslovakia story arc: "The Mountain Frontier".
 * Three acts, January 1936 to the Regensburg crisis. The player is
 * President Dvorský's government. Munich-shaped, but conditional (N8).
 */
import type { EventDef, SceneDef } from '../../engine/types';
import { fx } from '../../engine/effects';

/** Shared Act 3 effect: the Sudetenland passes to Germany. */
const cedeSudetenland = fx.custom(({ state, nation }) => {
  const region = state.regions['csk_sudetenland'];
  if (region) {
    region.ownerId = 'Germany';
    region.controllerId = 'Germany';
  }
  nation.regionIds = nation.regionIds.filter((id) => id !== 'csk_sudetenland');
  const germany = state.nations['Germany'];
  if (germany && !germany.regionIds.includes('csk_sudetenland')) {
    germany.regionIds.push('csk_sudetenland');
  }
});

export const SCENES: SceneDef[] = [
  // ---------------------------------------------------------------- ACT 1
  {
    id: 'csk_a1_cheb_programme',
    title: 'The Cheb Programme',
    speaker: 'csk_simek',
    text: () =>
      `Ernst Faltys chose a beer hall in Cheb to read his eight points: German districts under German administration, German schools under German inspectors, redress for what he calls eighteen years of wrong. The hall sang afterwards. Šimek lays the transcript on your desk before breakfast, underlined in red pencil — he has names, he says, and the warrants want only a signature. Křižan telephones within the hour: the programme was written for foreign ears, and should be answered where foreigners listen, at Geneva. Below your window the Castle guard is changing, unhurried. Both ministers are waiting, Mr. President, and the morning editions are already set in type.`,
    options: [
      {
        id: 'crackdown',
        text: 'Sign Šimek’s warrants; arrest the Bloc stewards',
        effects: [
          fx.flag('csk_act', 1),
          fx.ideology('auth', 6),
          fx.stability(3),
          fx.unrest(10, 'csk_sudetenland'),
          fx.relation('Germany', { opinion: -10 }),
          fx.tension(2),
          fx.charLoyalty('csk_simek', 10),
          fx.charLoyalty('csk_krizan', -5),
          fx.charLog('csk_simek', 'Got his warrants after Cheb; filled three cells with Bloc stewards and called it prudence.'),
          fx.charLog('csk_faltys', 'Watched his stewards arrested and thanked the government publicly for the gift.'),
          fx.chronicle('Prague orders arrests after the Cheb programme', ['csk', 'sudeten']),
        ],
      },
      {
        id: 'geneva',
        text: 'Refer the petition to the League at Geneva',
        effects: [
          fx.flag('csk_act', 1),
          fx.league(4),
          fx.standing(5),
          fx.capital(-10),
          fx.relation('France', { opinion: 8 }),
          fx.relation('United Kingdom', { opinion: 6 }),
          fx.charLoyalty('csk_simek', -8),
          fx.charLog('csk_krizan', 'Carried the Cheb petition to Geneva and answered it clause by clause before the Council.'),
          fx.charLog('csk_faltys', 'Followed the government to Geneva and found the stage there suited him almost as well.'),
        ],
      },
      {
        id: 'concede',
        text: 'Receive Faltys quietly; offer cultural concessions',
        effects: [
          fx.flag('csk_act', 1),
          fx.flag('csk_concession', 1),
          fx.unrest(-6, 'csk_sudetenland'),
          fx.ideology('natl', -5),
          fx.capital(-5),
          fx.relation('Germany', { opinion: 6 }),
          fx.charLoyalty('csk_simek', -10),
          fx.charLog('csk_faltys', 'Took tea at the Castle, pocketed the school concessions, and reported to his people that pressure pays.'),
        ],
      },
    ],
  },
  {
    id: 'csk_a1_double_ledger',
    title: 'The Double Ledger',
    speaker: 'csk_holubova',
    text: () =>
      `Marta Holubová does not sit down. She lays two export licences on your desk, identical but for the destination: a gun-carriage patent of the Moravia Works, certified once for Berlin, once for Moscow. Šimek’s photographs complete the arithmetic — Emil Zbraslav has been selling the same artillery designs to both, dining with the military attachés of each in alternate weeks. The Works employ forty thousand men and arm your own divisions. Prosecute, and the foundries stutter while half of Europe takes note of what they were sold. Stay silent, and the state owns a share of his commerce. Holubová waits with her hands folded, the way she does when the figures will not be argued with.`,
    options: [
      {
        id: 'prosecute',
        text: 'Charge Zbraslav before an open court',
        effects: [
          fx.flag('csk_zbraslav', 'prosecuted'),
          fx.standing(6),
          fx.stability(-4),
          fx.stockpile('arms', -12),
          fx.relation('Germany', { opinion: -6 }),
          fx.relation('USSR', { opinion: -6 }),
          fx.charLoyalty('csk_zbraslav', -30),
          fx.charLog('csk_zbraslav', 'Indicted for selling the same gun twice. Arrived at court in his best car and waved to the photographers.'),
          fx.charLog('csk_holubova', 'Brought the double ledger to the President herself and testified without notes.'),
          fx.chronicle('Arms magnate Zbraslav indicted for double-dealing', ['csk', 'scandal']),
          fx.queueScene('csk_a2_reckoning', 12),
        ],
      },
      {
        id: 'coverup',
        text: 'Bury the file; bind him to the state in private',
        effects: [
          fx.flag('csk_zbraslav', 'coverup'),
          fx.treasury(180),
          fx.ideology('auth', 4),
          fx.charLoyalty('csk_zbraslav', 10),
          fx.charLog('csk_zbraslav', 'Bought his way out of a treason file with a donation to the defense budget and a handshake nobody witnessed.'),
          fx.charLog('csk_simek', 'Locked the Zbraslav photographs in his personal safe — one more debt the Castle owes him.'),
          fx.queueScene('csk_a2_reckoning', 12),
        ],
      },
      {
        id: 'ignore',
        text: 'Let him sell — and read his correspondence',
        effects: [
          fx.flag('csk_zbraslav', 'ignored'),
          fx.treasury(100),
          fx.capital(-5),
          fx.custom(({ nation }) => {
            const net = nation.intel['Germany'];
            if (net) net.network = Math.min(100, net.network + 6);
          }),
          fx.charLog('csk_zbraslav', 'Kept both contracts, unaware that every letter to Berlin now passed through a room in the Interior Ministry.'),
          fx.charLog('csk_simek', 'Set his cipher clerks on the Zbraslav correspondence and began learning what Berlin pays for.'),
          fx.queueScene('csk_a2_reckoning', 12),
        ],
      },
    ],
  },
  {
    id: 'csk_a1_fortress_line',
    title: 'Concrete and Arithmetic',
    speaker: 'csk_stehlik',
    text: () =>
      `General Stehlík unrolls his maps across the cabinet table without asking leave. The fortress line, Ostrava to the Šumava: blockhouses in depth, artillery casemates, two hundred new works a year. “A small country cannot afford a long war,” he says, “so it must make every war short and expensive.” Beran backs him with a soldier’s brevity. Holubová has pencilled the cost in the margin, and it ends in more zeroes than the budget cares to print. The General does not plead. He simply leaves his finger on the stretch of frontier nearest Dresden and waits for you to look at it.`,
    options: [
      {
        id: 'full',
        text: 'Fund the full programme',
        effects: [
          fx.flag('csk_forts', 2),
          fx.treasury(-400),
          fx.stockpile('steel', -20),
          fx.warSupport(5),
          fx.relation('Germany', { fear: 6 }),
          fx.charLoyalty('csk_stehlik', 15),
          fx.charLog('csk_stehlik', 'Won the full fortification budget and slept in a staff car for a month, inspecting wet concrete.'),
          fx.charLog('csk_beran', 'Stood behind Stehlík’s programme in cabinet and signed away half his other procurement to pay for it.'),
        ],
      },
      {
        id: 'partial',
        text: 'A reduced tranche; the strongest sectors first',
        effects: [
          fx.flag('csk_forts', 1),
          fx.treasury(-160),
          fx.stability(2),
          fx.charLoyalty('csk_stehlik', 5),
          fx.charLog('csk_stehlik', 'Took half the money he asked for and poured all of it into the Silesian sector, the shortest road to Prague.'),
        ],
      },
      {
        id: 'defer',
        text: 'Defer; the budget cannot bear it',
        effects: [
          fx.flag('csk_forts', 0),
          fx.stability(3),
          fx.capital(5),
          fx.charLoyalty('csk_stehlik', -15),
          fx.charLoyalty('csk_beran', -10),
          fx.charLoyalty('csk_holubova', 8),
          fx.charLog('csk_stehlik', 'Rolled up his maps in silence when the programme was deferred, and had them recopied on better paper.'),
          fx.charLog('csk_holubova', 'Balanced the budget over the army’s objections and was not thanked for it by anyone in uniform.'),
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- ACT 2
  {
    id: 'csk_a2_protection_note',
    title: 'A Question of Protection',
    speaker: 'ger_seydel',
    text: () =>
      `The note from Berlin is courteous to the point of insolence. Chancellor Vossler, it explains, can no longer remain indifferent to the condition of three million Germans beyond his frontier; the Reich therefore proposes “protective consultation” — liaison officers in the border districts, a voice in their policing, a veto dressed as a courtesy. Seydel delivered it personally, polished as an invitation. In cabinet, Šimek calls it occupation by stationery. Křižan observes that the answer matters less than who stands behind the answer, and lists the capitals where friends might be found: Paris, London, Moscow. Faltys has already endorsed the note in print. Europe is watching to see what size of country you intend to be.`,
    options: [
      {
        id: 'west',
        text: 'Refuse, and court Paris and London',
        effects: [
          fx.flag('csk_act', 2),
          fx.flag('csk_alignment', 'west'),
          fx.relation('France', { opinion: 10, trust: 5 }),
          fx.relation('United Kingdom', { opinion: 8 }),
          fx.relation('Germany', { opinion: -8 }),
          fx.capital(-8),
          fx.charLoyalty('csk_krizan', 12),
          fx.charLog('csk_krizan', 'Refused Berlin’s “protection” in one paragraph and spent the next month on night trains to Paris and London.'),
          fx.chronicle('Prague rejects Berlin’s protection note, turns to the West', ['csk', 'diplomacy']),
          fx.queueScene('csk_a2_answer', 3),
        ],
      },
      {
        id: 'soviet',
        text: 'Refuse, and sound out Moscow',
        effects: [
          fx.flag('csk_act', 2),
          fx.flag('csk_alignment', 'soviet'),
          fx.relation('USSR', { opinion: 12, trust: 5 }),
          fx.relation('Poland', { opinion: -10, fear: 4 }),
          fx.relation('France', { opinion: -5 }),
          fx.ideology('planned', 4),
          fx.charLoyalty('csk_krizan', -8),
          fx.charLog('csk_krizan', 'Carried the government’s overture to Moscow with a francophile’s misgivings and a professional’s thoroughness.'),
          fx.chronicle('Prague rejects Berlin’s note and opens talks with Moscow', ['csk', 'diplomacy']),
          fx.queueScene('csk_a2_answer', 3),
        ],
      },
      {
        id: 'appease',
        text: 'Accept supervised protections in the border districts',
        effects: [
          fx.flag('csk_act', 2),
          fx.flag('csk_alignment', 'appease'),
          fx.relation('Germany', { opinion: 10, trust: 6 }),
          fx.standing(-8),
          fx.stability(-5),
          fx.unrest(-8, 'csk_sudetenland'),
          fx.charLoyalty('csk_simek', -12),
          fx.charLog('csk_faltys', 'Greeted the first German liaison officers at the Cheb station with a band and a speech about homecomings.'),
          fx.charLog('csk_krizan', 'Drafted the acceptance of Berlin’s note and asked that his objection be entered in the minutes.'),
          fx.queueScene('csk_a2_answer', 3),
        ],
      },
      {
        id: 'alone',
        text: 'Refuse everything; we stand on our own frontier',
        effects: [
          fx.flag('csk_act', 2),
          fx.flag('csk_alignment', 'alone'),
          fx.warSupport(8),
          fx.ideology('natl', 8),
          fx.tension(4),
          fx.relation('Germany', { opinion: -10, fear: 5 }),
          fx.charLoyalty('csk_stehlik', 10),
          fx.charLog('csk_stehlik', 'Heard that the republic would answer Berlin without patrons, and ordered the frontier garrisons doubled that night.'),
          fx.queueScene('csk_a2_answer', 3),
        ],
      },
    ],
  },
  {
    id: 'csk_a2_answer',
    title: 'The Answers Arrive',
    speaker: 'csk_krizan',
    text: ({ nation }) => {
      const a = nation.flags['csk_alignment'];
      if (a === 'west')
        return `Křižan returns from Paris with a portfolio and a cold. France will honor the treaty of alliance — provided Britain concurs; Britain counsels realism — provided France is not provoked. Between the two conditions there is, nonetheless, an offer: staff conversations, quiet and deniable, between Stehlík’s planners and the French General Staff. “It is less than a promise,” Křižan says, laying the protocol before you, “and more than we had in the spring. The question is whether we sign what they dare to give, or wait for what they do not.” Outside, the first snow is settling on the Castle roofs, indifferent to coalitions.`;
      if (a === 'soviet')
        return `Moscow’s answer arrives in Rykova’s own elegant French. The Soviet Union will bind itself to defend the republic — once France moves first, and once the Red Army can reach you, which means transit across Poland or Romania, which means permission neither Warsaw nor Bucharest intends to give. Křižan sets the draft pact on your desk beside a railway map and lets the geography speak. “It is a real signature attached to a hypothetical road,” he says. “But Berlin cannot read the clauses from outside, only the headline.” Šimek, for once, says nothing at all; he is reading the annex on military missions twice.`;
      if (a === 'appease')
        return `Berlin acknowledges your concession in a note of studied warmth and, in the same diplomatic pouch, submits a supplementary memorandum. The liaison officers will require offices; the offices, staff; the staff, a schedule of consultation embracing the gendarmerie, the schools inspectorate, and the frontier customs. Křižan reads it aloud in cabinet without inflection, which is his way of shouting. “Each clause is small,” he says. “That is the design. We are being asked to dismantle the border one courtesy at a time.” Faltys, the papers report, has begun referring to the border districts as “the Protectorate” — affectionately, his editors insist.`;
      return `The chancelleries answer your defiance with courtesy and nothing else. Paris praises your composure and asks for patience; London regrets the season; Moscow inquires, through a third party, what France intends. Křižan assembles the replies in a single thin folder and brings it to you at dusk. “We are admired,” he says, “the way a man on a ledge is admired.” In the courtyard the guard is changing again. Stehlík has stopped attending diplomatic briefings altogether; he sends instead a weekly note on concrete poured, rifles issued, and the depth of the autumn mud on the roads from Saxony.`;
    },
    options: [
      {
        id: 'sign_france',
        text: 'Sign the staff protocols with France',
        enabled: ({ nation }) => nation.flags['csk_alignment'] === 'west',
        effects: [
          fx.flag('csk_pact', 'france'),
          fx.relation('France', { trust: 10, opinion: 8 }),
          fx.relation('Germany', { opinion: -8, fear: 4 }),
          fx.tension(2),
          fx.charLog('csk_krizan', 'Signed the secret staff protocols with France in an unheated room and called it the best day of his tenure.'),
          fx.charLog('csk_stehlik', 'Began exchanging war plans with the French General Staff and found their timetables slower than their promises.'),
        ],
      },
      {
        id: 'sign_moscow',
        text: 'Initial Moscow’s draft despite the transit clause',
        enabled: ({ nation }) => nation.flags['csk_alignment'] === 'soviet',
        effects: [
          fx.flag('csk_pact', 'ussr'),
          fx.relation('USSR', { trust: 10, opinion: 10 }),
          fx.relation('Poland', { opinion: -12 }),
          fx.relation('United Kingdom', { opinion: -6 }),
          fx.charLog('csk_krizan', 'Initialled the Moscow pact, hypothetical road and all, and defended it in parliament with a map and a pointer.'),
        ],
      },
      {
        id: 'swallow',
        text: 'Accept the supplementary memorandum',
        enabled: ({ nation }) => nation.flags['csk_alignment'] === 'appease',
        effects: [
          fx.flag('csk_appeased', 2),
          fx.relation('Germany', { opinion: 8, trust: 4 }),
          fx.standing(-5),
          fx.stability(-3),
          fx.charLog('csk_faltys', 'Drafted the seating plan for the new consultation committees himself, and chaired three of them.'),
        ],
      },
      {
        id: 'rearm',
        text: 'Commit nothing; rearm instead',
        effects: [
          fx.treasury(-150),
          fx.stockpile('arms', 15),
          fx.warSupport(4),
          fx.charLog('csk_zbraslav', 'Ran the Moravia Works on night shifts for the state’s account and complained about the margins to anyone who would listen.'),
          fx.charLog('csk_stehlik', 'Took the new deliveries straight to the frontier depots and signed for each crate personally.'),
        ],
      },
    ],
  },
  {
    id: 'csk_a2_liberec_incident',
    title: 'The Incident at Liberec',
    speaker: 'csk_simek',
    text: () =>
      `It begins, as these things are made to begin, with a march that was forbidden and held anyway. Bloc stewards in matching raincoats press against the gendarmerie post at Liberec; stones, then a shot nobody will own; two stewards dead on the cobbles by morning. Berlin’s newspapers have the photographs before your ministers have the facts, under headlines about massacre. Šimek reports that the march was rehearsed twice in a quarry outside town — Faltys wanted his martyrs and has them now. The Bloc declares mourning in every German district. Vossler is to speak on the wireless tonight. Whatever you do next will be done in front of all of Europe.`,
    options: [
      {
        id: 'martial',
        text: 'Proclaim martial law in the border districts',
        effects: [
          fx.stability(4),
          fx.unrest(10, 'csk_sudetenland'),
          fx.relation('Germany', { opinion: -12 }),
          fx.tension(4),
          fx.charLoyalty('csk_simek', 10),
          fx.charLog('csk_simek', 'Administered martial law in the border districts from a requisitioned hotel in Liberec, and enjoyed it.'),
          fx.charLog('csk_faltys', 'Counted the martial-law decrees as victories and had them read aloud at his rallies, slowly.'),
          fx.chronicle('Martial law declared in the Sudeten districts after Liberec', ['csk', 'sudeten']),
        ],
      },
      {
        id: 'press',
        text: 'Restraint — and bring the foreign press to Liberec',
        effects: [
          fx.standing(7),
          fx.league(3),
          fx.unrest(3, 'csk_sudetenland'),
          fx.relation('United Kingdom', { opinion: 6 }),
          fx.relation('France', { opinion: 5 }),
          fx.charLoyalty('csk_vranova', 12),
          fx.charLog('csk_vranova', 'Shepherded the London and Paris correspondents through Liberec, quarry and all, and let the rehearsal speak for itself.'),
        ],
      },
      {
        id: 'indict',
        text: 'Indict Faltys himself for incitement',
        effects: [
          fx.flag('csk_faltys_tried', 1),
          fx.stability(-5),
          fx.unrest(14, 'csk_sudetenland'),
          fx.relation('Germany', { opinion: -14 }),
          fx.tension(5),
          fx.capital(-10),
          fx.charLog('csk_faltys', 'Stood trial for incitement and conducted his own defense as an audition, with Berlin for an audience.'),
          fx.charLog('csk_simek', 'Built the incitement case against Faltys out of quarry rehearsals and intercepted telegrams.'),
          fx.chronicle('Faltys indicted; Berlin recalls its minister for consultations', ['csk', 'sudeten']),
        ],
      },
    ],
  },
  {
    id: 'csk_a2_reckoning',
    title: 'The Bill for the Blueprints',
    text: ({ nation }) => {
      const z = nation.flags['csk_zbraslav'];
      if (z === 'coverup')
        return `Milena Vranová asks for ten minutes and uses three. On your desk she places galley proofs, still smelling of ink: the double ledger, the duplicate licences, the donation that closed the file — all of it, sourced and dated. Someone in Šimek’s ministry talks in his sleep. “Národní Hlas prints Thursday,” she says. “I am not asking permission. I am giving the President of my republic three days, which is more than his ministers gave the truth.” She buttons her coat and waits. Through the window you can hear the trams running down toward the river, full of people who still believe the file never existed.`;
      if (z === 'prosecuted')
        return `The verdict against Zbraslav arrives in the same week as the consequences. The Moravia Works, headless, has missed two delivery dates; a French consortium circles the receivership; Stehlík reports gun barrels rusting on flatcars for want of signatures. And yet — the trial played abroad as proof that the republic prosecutes its own millionaires, a thing Paris finds admirable and Berlin finds incomprehensible. Holubová brings you the options bound in grey board. “We can own the Works, or we can own the man,” she says. “The state’s arithmetic supports either. Its conscience I leave to you.”`;
      return `Stehlík arrives unannounced, carrying photographs of a German proving ground obtained at some cost. The howitzer in the third frame is a Moravia Works pattern, improved. Zbraslav’s correspondence, dutifully intercepted these many months, shows he sold Berlin the flaws as faithfully as the virtues — but the guns exist, and one day they will be registered on his own country’s roads. “We armed the man across the river because the cheque cleared,” the General says, without raising his voice. Šimek, for his part, sees an opportunity: the channel is open, trusted, and ours to poison. The two of them wait on opposite sides of your desk.`;
    },
    options: [
      {
        id: 'print',
        text: 'Let Vranová print every word',
        enabled: ({ nation }) => nation.flags['csk_zbraslav'] === 'coverup',
        effects: [
          fx.standing(6),
          fx.stability(-7),
          fx.capital(-8),
          fx.charLoyalty('csk_vranova', 15),
          fx.charLoyalty('csk_zbraslav', -20),
          fx.charLog('csk_vranova', 'Published the Zbraslav exposé in full, naming the ministry that buried it, and doubled her circulation in a week.'),
          fx.charLog('csk_zbraslav', 'Read his own ledgers in Národní Hlas over breakfast and began transferring assets to Zurich before lunch.'),
          fx.chronicle('Národní Hlas exposes the Zbraslav double ledger', ['csk', 'scandal']),
        ],
      },
      {
        id: 'seize',
        text: 'Seize the edition before dawn',
        enabled: ({ nation }) => nation.flags['csk_zbraslav'] === 'coverup',
        effects: [
          fx.flag('csk_muzzled', 1),
          fx.custom(({ nation }) => {
            if (nation.press === 'free') nation.press = 'pressured';
          }),
          fx.ideology('auth', 8),
          fx.standing(-5),
          fx.stability(2),
          fx.charLoyalty('csk_vranova', -25),
          fx.charLog('csk_vranova', 'Stood in her pressroom at four in the morning while gendarmes pulped the Thursday edition, and memorized their faces.'),
          fx.charLog('csk_simek', 'Organized the seizure of Národní Hlas with a thoroughness that disturbed even his admirers.'),
        ],
      },
      {
        id: 'nationalize',
        text: 'Take the Works into state receivership',
        enabled: ({ nation }) => nation.flags['csk_zbraslav'] === 'prosecuted',
        effects: [
          fx.ideology('planned', 10),
          fx.treasury(-200),
          fx.stockpile('arms', 10),
          fx.charLoyalty('csk_holubova', 8),
          fx.charLog('csk_holubova', 'Reorganized the Moravia Works under state receivership and had the delivery schedule back on its feet by spring.'),
          fx.charLog('csk_zbraslav', 'Watched the state assume his foundries from a courtroom holding cell, and offered, unprompted, to consult.'),
        ],
      },
      {
        id: 'pardon',
        text: 'Pardon him, chained to war contracts',
        enabled: ({ nation }) => nation.flags['csk_zbraslav'] === 'prosecuted',
        effects: [
          fx.charLoyalty('csk_zbraslav', 20),
          fx.standing(-4),
          fx.capital(-5),
          fx.stockpile('arms', 15),
          fx.charLog('csk_zbraslav', 'Accepted a pardon priced in exclusive war contracts, and fulfilled every clause with a convert’s zeal.'),
        ],
      },
      {
        id: 'cutoff',
        text: 'Close the German channel at last',
        enabled: ({ nation }) => nation.flags['csk_zbraslav'] === 'ignored',
        effects: [
          fx.treasury(-80),
          fx.relation('Germany', { opinion: -5 }),
          fx.charLoyalty('csk_stehlik', 8),
          fx.charLog('csk_zbraslav', 'Lost his Berlin contracts by government order and submitted an invoice for the inconvenience.'),
          fx.charLog('csk_stehlik', 'Saw the German channel closed and filed the proving-ground photographs where future budgets would find them.'),
        ],
      },
      {
        id: 'poison',
        text: 'Keep it open; feed Berlin flawed drawings',
        enabled: ({ nation }) => nation.flags['csk_zbraslav'] === 'ignored',
        effects: [
          fx.flag('csk_false_designs', 1),
          fx.capital(-6),
          fx.custom(({ nation }) => {
            const net = nation.intel['Germany'];
            if (net) net.network = Math.min(100, net.network + 8);
          }),
          fx.charLog('csk_zbraslav', 'Began selling Berlin artillery designs amended by men he was never permitted to meet, for fees he was permitted to keep.'),
          fx.charLog('csk_simek', 'Ran the false-designs channel through the Moravia Works and read Berlin’s thank-you letters with satisfaction.'),
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- ACT 3
  {
    id: 'csk_a3_summons',
    title: 'A Conference Without a Chair',
    speaker: 'csk_krizan',
    text: () =>
      `Vossler speaks at Dresden for two hours and needs one sentence: the Sudetenland will come home to the Reich, by agreement or otherwise, before the leaves fall. By midnight the wires confirm the rest. Germany, Italy, Britain, and France will confer at Regensburg on the future of your border districts; the country whose border it is will be informed of the result. Křižan reads the invitation list twice, as if a name might appear on the second reading. “They are meeting about us without us,” he says. “The only question we are permitted to answer is what they will find when they look up from the table.”`,
    options: [
      {
        id: 'attend',
        text: 'Send Křižan to wait upon the conference',
        effects: [
          fx.flag('csk_act', 3),
          fx.capital(-6),
          fx.standing(-3),
          fx.charLog('csk_krizan', 'Waited at Regensburg in a hotel corridor while four powers disposed of his frontier, taking notes nobody requested.'),
          fx.queueScene('csk_a3_terms', 1),
        ],
      },
      {
        id: 'mobilize',
        text: 'Order mobilization while they talk',
        effects: [
          fx.flag('csk_act', 3),
          fx.flag('csk_mobilized', 1),
          fx.treasury(-220),
          fx.warSupport(10),
          fx.tension(6),
          fx.stability(-4),
          fx.relation('Germany', { fear: 8 }),
          fx.charLog('csk_stehlik', 'Mobilized the reserves in thirty-six hours and reported the fortress line manned to its last casemate.'),
          fx.charLog('csk_mottl', 'Pushed his armored brigades to the frontier ahead of schedule and made certain the newspapers knew it.'),
          fx.chronicle('Czechoslovakia mobilizes as the powers convene at Regensburg', ['csk', 'crisis']),
          fx.queueScene('csk_a3_terms', 1),
        ],
      },
    ],
  },
  {
    id: 'csk_a3_terms',
    title: 'The Regensburg Terms',
    text: ({ nation }) => {
      const a = nation.flags['csk_alignment'];
      const tail =
        a === 'west'
          ? 'Paris attaches a private note: the staff protocols stand, if Prague refuses — but France will not march alone, and asks, almost humbly, what you intend.'
          : a === 'soviet'
            ? 'Moscow wires that its obligations hold the moment a French soldier moves, and that the Red Army awaits only a road. The road, as ever, runs through Warsaw.'
            : a === 'appease'
              ? 'Berlin’s covering letter is warm. After so much constructive cooperation, it says, this final settlement should present no difficulty between friends.'
              : 'No covering letters accompany the terms. The powers assume your signature; none has asked for your opinion.';
      return `The terms arrive by courier at six in the morning: cession of the Sudetenland in its entirety, evacuation of the fortress line intact, completion within thirty days. In exchange, a guarantee of the rump frontier, signed by the same hands that disposed of the old one. ${tail} The cabinet convenes at eight. Stehlík states the military arithmetic; Holubová the economic; neither concludes. At the end of the table the chair reserved for the Foreign Minister of a sovereign republic sits waiting, and the clock above it strikes the quarter hour as if nothing in particular were happening.`;
    },
    options: [
      {
        id: 'accept',
        text: 'Accept the cession',
        effects: [
          fx.stability(-8),
          fx.standing(-6),
          fx.charLog('csk_dvorsky', 'Accepted the Regensburg terms rather than fight Europe alone, and aged a decade in the signing.'),
          fx.queueScene('csk_a3_end_cession', 1),
        ],
      },
      {
        id: 'refuse_allies',
        text: 'Refuse — our allies have given their word',
        enabled: ({ state, nation }) => {
          const a = nation.flags['csk_alignment'];
          if (a === 'west') {
            const rel = state.nations['France']?.relations[nation.id];
            return !!rel && (rel.trust >= 45 || rel.opinion >= 25);
          }
          if (a === 'soviet') {
            const rel = state.nations['USSR']?.relations[nation.id];
            return !!rel && (rel.trust >= 40 || rel.opinion >= 25);
          }
          return false;
        },
        effects: [
          fx.tension(8),
          fx.warSupport(8),
          fx.charLog('csk_krizan', 'Delivered the refusal of the Regensburg terms and invoked the alliance, clause by clause, before the assembled press.'),
          fx.queueScene('csk_a3_end_defiance_allies', 1),
        ],
      },
      {
        id: 'refuse_alone',
        text: 'Refuse, alone if we must',
        effects: [
          fx.tension(8),
          fx.warSupport(10),
          fx.stability(-5),
          fx.charLog('csk_stehlik', 'Received the order to hold the frontier without allies, and answered only that the line was ready.'),
          fx.queueScene('csk_a3_end_defiance_alone', 1),
        ],
      },
      {
        id: 'counter',
        text: 'Counter-offer: autonomy under four-power guarantee',
        enabled: ({ nation }) => nation.flags['csk_alignment'] === 'appease' || nation.standing >= 55,
        effects: [
          fx.capital(-10),
          fx.standing(4),
          fx.charLog('csk_krizan', 'Drafted the autonomy counter-offer overnight and sold it to four skeptical delegations before the deadline lapsed.'),
          fx.queueScene('csk_a3_end_compromise', 1),
        ],
      },
    ],
  },
  {
    id: 'csk_a3_end_cession',
    title: 'The Frontier Moves in the Night',
    speaker: 'csk_eliska',
    text: () =>
      `The evacuation is orderly, which is somehow the worst of it. Trains south from Cheb and Liberec carry gendarmes, schoolteachers, the contents of the land registries; the casemates Stehlík built are handed over swept, their guns withdrawn on schedule. Faltys crosses the old line behind the first German column, standing in an open car. In Prague the crowds outside the Castle do not shout; they stand in the rain and look up at the windows. Eliška finds you in the study after midnight. “You have kept them alive,” she says, in the voice she uses for patients. “Now you must give them a reason to stay that way.”`,
    options: [
      {
        id: 'candor',
        text: 'Speak to the nation with candor',
        effects: [
          cedeSudetenland,
          fx.flag('csk_ending', 'capitulation'),
          fx.relation('Germany', { opinion: 8 }),
          fx.tension(-5),
          fx.stability(4),
          fx.standing(3),
          fx.charLog('csk_dvorsky', 'Told the nation the truth about Regensburg on the wireless, without ornament, and was heard in silence.'),
          fx.charLog('csk_eliska', 'Sat beside the President through the cession broadcast and kept her clinic open through the mourning that followed.'),
          fx.charLog('csk_faltys', 'Entered the ceded districts as Berlin’s man of the hour, and discovered within a month how little the Reich needed him.'),
          fx.chronicle('Czechoslovakia cedes the Sudetenland under the Regensburg terms', ['csk', 'crisis', 'cession']),
        ],
      },
      {
        id: 'fortify',
        text: 'Pour everything into the inner defense line',
        effects: [
          cedeSudetenland,
          fx.flag('csk_ending', 'capitulation'),
          fx.relation('Germany', { opinion: 8 }),
          fx.tension(-5),
          fx.treasury(-250),
          fx.stockpile('steel', -10),
          fx.warSupport(5),
          fx.charLoyalty('csk_stehlik', 10),
          fx.charLog('csk_stehlik', 'Began a second fortress line on the new frontier the week after the cession, refusing all interviews on the subject of the first.'),
          fx.charLog('csk_faltys', 'Paraded through the ceded districts under German flags, already petitioning Berlin for offices it had not offered.'),
          fx.chronicle('Czechoslovakia cedes the Sudetenland under the Regensburg terms', ['csk', 'crisis', 'cession']),
        ],
      },
    ],
  },
  {
    id: 'csk_a3_end_defiance_alone',
    title: 'The Republic Stands Alone',
    speaker: 'csk_stehlik',
    text: () =>
      `Your refusal is one sentence long, and by evening it has been read aloud in every chancellery in Europe. No ally answers for you; none was asked. The reservists go up to the frontier through villages where women hand bread into the carriages without speaking. Stehlík establishes his headquarters in a schoolhouse behind the Silesian sector and reports the line manned, provisioned, and quiet. “They expected a signature,” he says on the telephone, the guns of a German exercise audible somewhere behind his voice. “Now they must decide if they want the alternative. So must we, Mr. President. The autumn is long, and we are inside it.”`,
    options: [
      {
        id: 'hold',
        text: 'Man the fortress line and wait',
        effects: [
          fx.flag('csk_ending', 'defiance_alone'),
          fx.casusBelli('Germany', 'sudeten_ultimatum', 12),
          fx.tension(10),
          fx.warSupport(8),
          fx.stability(3),
          fx.stockpile('arms', -8),
          fx.relation('Germany', { fear: 6 }),
          fx.charLoyalty('csk_stehlik', 12),
          fx.charLog('csk_stehlik', 'Held the fortress line through the crisis autumn with the whole army forward and no ally behind him.'),
          fx.charLog('csk_beran', 'Slept at the Defense Ministry for six weeks and rationed the artillery shells like a man counting his own heartbeats.'),
          fx.chronicle('Czechoslovakia rejects the Regensburg terms and stands alone', ['csk', 'crisis', 'defiance']),
        ],
      },
      {
        id: 'appeal',
        text: 'Broadcast an appeal to the democracies',
        effects: [
          fx.flag('csk_ending', 'defiance_alone'),
          fx.casusBelli('Germany', 'sudeten_ultimatum', 12),
          fx.tension(10),
          fx.standing(6),
          fx.league(3),
          fx.relation('France', { opinion: 8 }),
          fx.relation('United Kingdom', { opinion: 8 }),
          fx.relation('USSR', { opinion: 5 }),
          fx.charLog('csk_krizan', 'Broadcast the republic’s case to the democracies in four languages, and received sympathy in five.'),
          fx.charLog('csk_vranova', 'Carried the appeal into print across the foreign press, calling shame by its first name.'),
          fx.chronicle('Czechoslovakia rejects the Regensburg terms and stands alone', ['csk', 'crisis', 'defiance']),
        ],
      },
    ],
  },
  {
    id: 'csk_a3_end_defiance_allies',
    title: 'The Line Is Drawn',
    speaker: 'csk_krizan',
    text: ({ nation }) => {
      const ally = nation.flags['csk_alignment'] === 'soviet' ? 'Moscow' : 'Paris';
      return `Your refusal goes out at noon; the answer from ${ally} comes before the evening papers. The alliance holds. Partial mobilization is announced abroad in words chosen to be heard in Berlin, and for the first time since Dresden the Reich’s communiqués mention negotiation without quotation marks around it. Křižan stands at your window watching the lamps come on across the river. “We are no longer alone in the room,” he says, “which is not the same as being safe in it. Vossler has retreated once. Men of his sort retreat the way rivers do — to gather.” On the frontier, Stehlík’s garrisons stand to their guns and wait for spring.`;
    },
    options: [
      {
        id: 'staffs',
        text: 'Coordinate the general staffs at once',
        effects: [
          fx.flag('csk_ending', 'defiance_allies'),
          fx.casusBelli('Germany', 'sudeten_ultimatum', 12),
          fx.tension(12),
          fx.warSupport(8),
          fx.custom(({ state, nation }) => {
            const ally = nation.flags['csk_alignment'] === 'soviet' ? 'USSR' : 'France';
            const rel = state.nations[ally]?.relations[nation.id];
            if (rel) {
              rel.trust = Math.min(100, rel.trust + 10);
              rel.opinion = Math.min(100, rel.opinion + 10);
            }
          }),
          fx.charLog('csk_stehlik', 'Merged his war plans with the allied general staff and kept a separate set, locked, in case the alliance proved mortal.'),
          fx.charLog('csk_krizan', 'Held the alliance together through the crisis autumn by telephone, telegram, and two unrecorded journeys.'),
          fx.chronicle('The Regensburg terms collapse; Czechoslovakia stands with its allies', ['csk', 'crisis', 'defiance']),
        ],
      },
      {
        id: 'guarantee',
        text: 'Demand a public guarantee before the world',
        effects: [
          fx.flag('csk_ending', 'defiance_allies'),
          fx.casusBelli('Germany', 'sudeten_ultimatum', 12),
          fx.tension(12),
          fx.standing(8),
          fx.league(4),
          fx.relation('Germany', { fear: 5 }),
          fx.charLog('csk_krizan', 'Extracted a public guarantee of the frontier from the alliance and had it read into the League record at Geneva.'),
          fx.chronicle('The Regensburg terms collapse; Czechoslovakia stands with its allies', ['csk', 'crisis', 'defiance']),
        ],
      },
    ],
  },
  {
    id: 'csk_a3_end_compromise',
    title: 'The Statute of the Borderlands',
    speaker: 'csk_faltys',
    text: () =>
      `The powers, offered a settlement that spares them a war, take it with visible relief. The Statute of the Borderlands is signed in the same Regensburg hall that was to have dismembered you: German districts under elected German administration, within the republic and under a four-power guarantee of the frontier. It is less than sovereignty and more than anyone in Berlin expected you to keep. Faltys takes the presidency of the new Borderland Diet with the expression of a man handed a smaller prize than promised in front of witnesses. “The republic and I are condemned to each other, it appears,” he tells the foreign press. The leaves fall. The frontier holds.`,
    options: [
      {
        id: 'goodfaith',
        text: 'Make the statute work in good faith',
        effects: [
          fx.flag('csk_ending', 'compromise'),
          fx.custom(({ state }) => {
            const region = state.regions['csk_sudetenland'];
            if (region?.minority) region.minority.policy = 'autonomy';
          }),
          fx.tension(-4),
          fx.standing(5),
          fx.unrest(-12, 'csk_sudetenland'),
          fx.relation('Germany', { opinion: 5 }),
          fx.charLoyalty('csk_faltys', 15),
          fx.charLog('csk_faltys', 'Took the presidency of the Borderland Diet and discovered, to his evident irritation, a talent for governing.'),
          fx.charLog('csk_krizan', 'Counted the Statute of the Borderlands the vindication of a career spent believing in conference tables.'),
          fx.charLog('csk_krsko', 'Demanded an identical statute for Slovakia within a week of the signing, and brought a draft.'),
          fx.chronicle('The Statute of the Borderlands averts the Sudeten war', ['csk', 'crisis', 'compromise']),
        ],
      },
      {
        id: 'hedge',
        text: 'Honor the letter, fortify behind it',
        effects: [
          fx.flag('csk_ending', 'compromise'),
          fx.custom(({ state }) => {
            const region = state.regions['csk_sudetenland'];
            if (region?.minority) region.minority.policy = 'autonomy';
          }),
          fx.tension(-4),
          fx.standing(3),
          fx.unrest(-6, 'csk_sudetenland'),
          fx.treasury(-180),
          fx.addFlag('csk_forts', 1),
          fx.relation('Germany', { opinion: -4 }),
          fx.charLoyalty('csk_stehlik', 8),
          fx.charLog('csk_stehlik', 'Honored the statute to the letter and quietly extended the fortress line behind it, on the principle that paper burns.'),
          fx.charLog('csk_faltys', 'Presided over the Borderland Diet while counting the new concrete going in behind him, and said nothing to Berlin.'),
          fx.chronicle('The Statute of the Borderlands averts the Sudeten war', ['csk', 'crisis', 'compromise']),
        ],
      },
    ],
  },
];

export const EVENTS: EventDef[] = [
  {
    id: 'csk_e_a1_cheb',
    nationId: 'Czechoslovakia',
    condition: (state) => state.turn >= 2,
    sceneId: 'csk_a1_cheb_programme',
    once: true,
  },
  {
    id: 'csk_e_a1_ledger',
    nationId: 'Czechoslovakia',
    condition: (state, nation) => state.turn >= 5 && nation.flags['csk_act'] === 1,
    sceneId: 'csk_a1_double_ledger',
    once: true,
  },
  {
    id: 'csk_e_a1_fortress',
    nationId: 'Czechoslovakia',
    condition: (state, nation) => state.turn >= 8 && nation.flags['csk_act'] === 1,
    sceneId: 'csk_a1_fortress_line',
    once: true,
  },
  {
    id: 'csk_e_a2_protection',
    nationId: 'Czechoslovakia',
    condition: (state, nation) => state.turn >= 16 && nation.flags['csk_act'] === 1,
    sceneId: 'csk_a2_protection_note',
    once: true,
  },
  {
    id: 'csk_e_a2_incident',
    nationId: 'Czechoslovakia',
    condition: (state, nation) => state.turn >= 20 && nation.flags['csk_act'] === 2,
    sceneId: 'csk_a2_liberec_incident',
    once: true,
  },
  {
    id: 'csk_e_a3_summons',
    nationId: 'Czechoslovakia',
    condition: (state, nation) => state.turn >= 30 && nation.flags['csk_act'] === 2,
    sceneId: 'csk_a3_summons',
    once: true,
  },
];
