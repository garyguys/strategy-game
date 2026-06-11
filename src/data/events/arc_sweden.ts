/**
 * N1 — Sweden story arc: "The Iron Ledger".
 * Armed neutrality while every bloc demands your iron, 1936–1939.
 * Act 1 (turns 2–12): establishment. Act 2 (14–26): the squeeze.
 * Act 3 (30–46): the storm, ending by alignment.
 */
import type { EventDef, SceneDef } from '../../engine/types';
import { fx } from '../../engine/effects';

export const SCENES: SceneDef[] = [
  // ---------------------------------------------------------------- ACT 1
  {
    id: 'swe_a1_ore_deal',
    title: 'The Gällivare Contract',
    speaker: 'swe_ahlmark',
    text: () =>
      'Casimir Ahlmark does not request meetings; he announces them. He lays a memorandum on your desk like a man returning a borrowed book: ten years of Norrland ore to a Düsseldorf consortium, prices fixed, tonnage guaranteed, signed over dinner in Hamburg. “I have sold iron through three governments,” he says. “I find it simpler not to ask first.” Wikman observes that the kronor are real. Söderberg observes that the customer is Germany. Outside, snow falls on a country that would prefer never to be discussed in other capitals at all.',
    options: [
      {
        id: 'honor',
        text: 'Honor the contract. Ore is only ore.',
        effects: [
          fx.flag('swe_act', 1),
          fx.flag('swe_ore_deal', 'honored'),
          fx.treasury(150),
          fx.ideology('planned', -6),
          fx.relation('Germany', { opinion: 10, trust: 5 }),
          fx.relation('United Kingdom', { opinion: -6 }),
          fx.charLoyalty('swe_ahlmark', 10),
          fx.charLog('swe_ahlmark', 'His Hamburg contract was honored without amendment. He did not say thank you; he said “naturally.”'),
          fx.queueScene('swe_a2_leak', 12),
          fx.chronicle('Stockholm confirms long-term ore deliveries to German buyers', ['economy', 'sweden']),
        ],
      },
      {
        id: 'renegotiate',
        text: 'Renegotiate: shorter term, market prices, no guarantees.',
        effects: [
          fx.flag('swe_act', 1),
          fx.flag('swe_ore_deal', 'renegotiated'),
          fx.treasury(60),
          fx.capital(-5),
          fx.relation('Germany', { opinion: -5 }),
          fx.charLoyalty('swe_ahlmark', -8),
          fx.charLog('swe_ahlmark', 'Made to reopen his German ore contract before the cabinet. He called it “a tax on initiative.”'),
          fx.charLog('swe_wikman', 'Redrafted the Ahlmark contract clause by clause, at market prices, with visible satisfaction.'),
          fx.queueScene('swe_a2_leak', 12),
        ],
      },
      {
        id: 'nationalize',
        text: 'Nationalize the Norrland Ore Trust.',
        effects: [
          fx.flag('swe_act', 1),
          fx.flag('swe_ore_deal', 'nationalized'),
          fx.ideology('planned', 12),
          fx.treasury(-200),
          fx.charLoyalty('swe_ahlmark', -30),
          fx.charLog('swe_ahlmark', 'His Ore Trust was taken into state hands. He kept the chairmanship of nothing, and his composure.'),
          fx.charLoyalty('swe_sjogren', 10),
          fx.charLog('swe_sjogren', 'Called the nationalization of the mines “the first honest balance sheet in Norrland.”'),
          fx.relation('Germany', { opinion: -12 }),
          fx.relation('USSR', { opinion: 8 }),
          fx.unrest(-4, 'swe_norrland'),
          fx.queueScene('swe_a2_leak', 12),
          fx.chronicle('Sweden nationalizes the Norrland Ore Trust', ['economy', 'sweden']),
        ],
      },
    ],
  },
  {
    id: 'swe_a1_rearmament',
    title: 'Guns and Ledgers',
    speaker: 'swe_thulin',
    text: () =>
      'Thulin arrives with photographs of German airfields and a request that reads like a demand: aircraft, coastal artillery, a conscription reform, all of it now. Wikman follows him into the room as though escorting a fire hazard. “The budget balances,” the Finance Minister says, “for the first time since the Crash. A balanced budget is a moral document.” Thulin sets a photograph on the table. “So is an obituary.” Both men look at you. Somewhere south of the Baltic, engines are being counted by other governments.',
    options: [
      {
        id: 'fund',
        text: 'Fund the full program. The storm is coming.',
        effects: [
          fx.treasury(-180),
          fx.warSupport(8),
          fx.custom(({ nation }) => {
            nation.military.air += 4;
            nation.military.navy += 2;
          }),
          fx.charLoyalty('swe_thulin', 12),
          fx.charLog('swe_thulin', 'Won the full rearmament estimate. Pinned the airfield photographs above his desk as a reminder.'),
          fx.charLoyalty('swe_wikman', -8),
          fx.charLog('swe_wikman', 'Watched his balanced budget die in committee. Recorded the deficit in red ink, personally.'),
        ],
      },
      {
        id: 'balance',
        text: 'Back Wikman. Solvency is also a defense.',
        effects: [
          fx.stability(4),
          fx.treasury(40),
          fx.warSupport(-4),
          fx.charLoyalty('swe_wikman', 10),
          fx.charLog('swe_wikman', 'Defended the balanced budget against the Defense Ministry and won. Allowed himself one glass of port.'),
          fx.charLoyalty('swe_thulin', -10),
          fx.charLog('swe_thulin', 'His rearmament estimate was returned marked “premature.” He underlined the word and kept the page.'),
        ],
      },
      {
        id: 'split',
        text: 'Half the program, spread across three budgets.',
        effects: [
          fx.treasury(-90),
          fx.capital(-8),
          fx.warSupport(3),
          fx.custom(({ nation }) => {
            nation.military.air += 2;
          }),
          fx.charLog('swe_thulin', 'Granted half a rearmament program. Said half an air force intercepts half a raid.'),
          fx.charLog('swe_wikman', 'Conceded a phased defense estimate, paid for, he noted, by everyone’s next three budgets.'),
        ],
      },
    ],
  },
  {
    id: 'swe_a1_naval_visit',
    title: 'An Uninvited Courtesy',
    speaker: 'swe_brandt',
    text: () =>
      'A German squadron anchors off Gotland at dawn — three cruisers and an aviso, flags correct, paperwork an hour behind the ships. The wireless calls it a courtesy visit. Admiral Brandt calls you from Fårösund with the wind in the line. “They are photographing the approaches and timing our response. The courtesy is incidental.” He has two destroyers raising steam and a question he is too old-fashioned to ask directly: whether the Baltic is still a Swedish lake, or merely water.',
    options: [
      {
        id: 'shadow',
        text: 'Shadow them at close station. Log everything.',
        effects: [
          fx.flag('swe_brandt_charts', true),
          fx.relation('Germany', { opinion: -4, fear: 4 }),
          fx.charLoyalty('swe_brandt', 8),
          fx.charLog('swe_brandt', 'Shadowed a German squadron through the Gotland approaches for two days. His track charts went into the safe.'),
          fx.warSupport(3),
        ],
      },
      {
        id: 'protest',
        text: 'A quiet protest through Söderberg. Nothing in print.',
        effects: [
          fx.standing(3),
          fx.relation('Germany', { opinion: -2 }),
          fx.charLog('swe_soderberg', 'Delivered a protest over the Gotland visit so polite the German minister apologized before reading it.'),
          fx.charLog('swe_brandt', 'Ordered to hold his destroyers at anchor during the German “courtesy visit.” Complied, slowly.'),
        ],
      },
      {
        id: 'host',
        text: 'Host them. Champagne is cheaper than destroyers.',
        effects: [
          fx.relation('Germany', { opinion: 8, trust: 3 }),
          fx.relation('United Kingdom', { opinion: -5 }),
          fx.warSupport(-3),
          fx.charLog('swe_brandt', 'Made to toast the visiting German squadron. Raised his glass exactly as far as protocol required.'),
        ],
      },
    ],
  },
  {
    id: 'swe_a1_union_hours',
    title: 'Sixty Hours',
    speaker: 'swe_sjogren',
    text: () =>
      'Botvid Sjögren has never needed to make the phone call, and he reminds you of this by not mentioning it. The arms works at Eskilstuna and Karlskoga are running sixty-hour weeks against the defense schedule; the men are running shorter. “We voted for this government,” he says, turning his hat in his hands. “We will keep voting for it. But a man who falls asleep at a shell lathe does not wake up a patriot.” He wants the eight-hour line restored. The factories want their deliveries. Both are yours.',
    options: [
      {
        id: 'concede',
        text: 'Restore the eight-hour line. The movement comes first.',
        effects: [
          fx.charLoyalty('swe_sjogren', 12),
          fx.charLog('swe_sjogren', 'Won back the eight-hour day at the arms works without a single stoppage. Hung up the phone unused.'),
          fx.stability(5),
          fx.ideology('planned', 4),
          fx.stockpile('arms', -6),
          fx.unrest(-5, 'swe_svealand'),
        ],
      },
      {
        id: 'hold',
        text: 'Hold the defense schedule. The lathes keep turning.',
        effects: [
          fx.stockpile('arms', 6),
          fx.stability(-4),
          fx.unrest(8, 'swe_svealand'),
          fx.charLoyalty('swe_sjogren', -12),
          fx.charLog('swe_sjogren', 'Sent home from the Chancellery with nothing. Began, for the first time, to draft the phone call.'),
        ],
      },
      {
        id: 'overtime',
        text: 'Overtime pay at time and a half. Buy the hours.',
        effects: [
          fx.treasury(-80),
          fx.stability(2),
          fx.charLoyalty('swe_sjogren', 5),
          fx.charLog('swe_sjogren', 'Settled the arms-works dispute for overtime money. Told his locals it was a down payment, not a deed.'),
          fx.stockpile('arms', 3),
        ],
      },
    ],
  },

  // ------------------------------------------------- ACT 2 (leak is queued)
  {
    id: 'swe_a2_leak',
    title: 'Print and Be Damned',
    speaker: 'swe_lund',
    text: ({ nation }) => {
      const deal = nation.flags['swe_ore_deal'];
      const lead =
        'A year to the month, Dagens Röst runs four pages of cabinet minutes nobody outside the cabinet should possess. ';
      if (deal === 'honored')
        return (
          lead +
          'Worse, an annex to the Ahlmark contract you were never shown: prices pegged below market for the full ten years, and a German option on rail priority through Norrland. Lund prints the arithmetic of what the discount has cost. “I publish what ministries deny,” he writes. “The denials arrive faster than the documents.” The German legation expresses regret that private commerce has been politicized. The opposition expresses nothing yet, which is worse.'
        );
      if (deal === 'nationalized')
        return (
          lead +
          'The minutes show the cabinet split over the Ore Trust seizure, with your own ministers calling the compensation terms “confiscation in evening dress.” Lund prints every hesitation, every retreat. “The state took the mines,” he writes, “but cannot decide whether it is proud of itself.” Ahlmark, asked for comment, supplies only a smile that photographs extremely well.'
        );
      return (
        lead +
        'They show the Ahlmark renegotiation in unflattering close-up — and an annex Ahlmark never surrendered: a side letter promising his German buyers “best efforts” on tonnage, signed after your new terms. Lund prints the side letter beside the cabinet’s self-congratulation. “Stockholm renegotiated the contract,” he writes. “Hamburg renegotiated Stockholm.”'
      );
    },
    options: [
      {
        id: 'confirm',
        text: 'Confirm everything. Publish the full annex yourself.',
        effects: [
          fx.standing(6),
          fx.capital(-8),
          fx.relation('Germany', { opinion: -8, trust: -5 }),
          fx.charLoyalty('swe_lund', 10),
          fx.charLog('swe_lund', 'The government confirmed his ore-annex story within the week. He found honesty professionally disorienting.'),
          fx.chronicle('Swedish government publishes secret terms of the German ore contract', ['scandal', 'sweden']),
        ],
      },
      {
        id: 'hunt',
        text: 'Deny it. Let Almgren hunt the leak.',
        effects: [
          fx.stability(3),
          fx.standing(-4),
          fx.custom(({ nation }) => {
            nation.press = 'pressured';
          }),
          fx.charLog('swe_almgren', 'Set quietly to finding which suit in the Chancellery talks to Verner Lund. Started a new file.'),
          fx.charLoyalty('swe_lund', -10),
          fx.charLog('swe_lund', 'His sources went silent for a season after the leak inquiry. He noted who had been frightened, and by whom.'),
        ],
      },
      {
        id: 'weather',
        text: 'Say nothing. Weather it.',
        effects: [
          fx.stability(-3),
          fx.capital(-4),
          fx.charLog('swe_lund', 'Printed the cabinet minutes and received, in reply, a silence he described as “the loudest confirmation available.”'),
        ],
      },
    ],
  },
  {
    id: 'swe_a2_squeeze',
    title: 'Two Buyers, One Mine',
    speaker: 'swe_soderberg',
    text: () =>
      'They arrive in the same week, which Söderberg does not believe is coincidence. London offers a trade protocol: guaranteed purchases, sterling credits, most-favored terms — provided German ore allocations are “rationalized downward.” Berlin offers a shorter document. It notes Sweden’s exposed coasts, recalls the fates of small countries that chose their customers politically, and requests exclusive wartime supply “against eventualities.” Söderberg lays both on your desk, edges parallel. “Each side believes the iron decides the next war,” she says. “The inconvenience is that both are right.”',
    options: [
      {
        id: 'london',
        text: 'Tilt toward London. Sign the trade protocol.',
        effects: [
          fx.flag('swe_act', 2),
          fx.flag('swe_alignment', 'london'),
          fx.treasury(120),
          fx.relation('United Kingdom', { opinion: 15, trust: 8 }),
          fx.relation('Germany', { opinion: -12 }),
          fx.charLog('swe_soderberg', 'Negotiated the London ore protocol line by line, conceding nothing that was not already lost.'),
          fx.chronicle('Sweden signs Anglo-Swedish trade protocol; Berlin takes note', ['diplomacy', 'sweden']),
        ],
      },
      {
        id: 'berlin',
        text: 'Accommodate Berlin. Guarantee the tonnage.',
        effects: [
          fx.flag('swe_act', 2),
          fx.flag('swe_alignment', 'berlin'),
          fx.treasury(100),
          fx.relation('Germany', { opinion: 12, trust: 6 }),
          fx.relation('United Kingdom', { opinion: -10, trust: -5 }),
          fx.charLog('swe_soderberg', 'Instructed to guarantee ore tonnage to Berlin. Drafted the note in her flattest prose and signed it anyway.'),
          fx.charLog('swe_ahlmark', 'Found himself, to his amusement, an instrument of national policy. Raised his prices accordingly.'),
          fx.chronicle('Sweden guarantees iron ore deliveries to Germany', ['diplomacy', 'sweden']),
        ],
      },
      {
        id: 'strict',
        text: 'Refuse exclusivity. Market terms, all flags, no promises.',
        effects: [
          fx.flag('swe_act', 2),
          fx.flag('swe_alignment', 'strict'),
          fx.standing(8),
          fx.relation('Germany', { opinion: -5 }),
          fx.relation('United Kingdom', { opinion: -5 }),
          fx.charLog('swe_soderberg', 'Returned identical refusals to London and Berlin on the same afternoon, and slept soundly.'),
          fx.chronicle('Stockholm rejects exclusive ore arrangements with any power', ['diplomacy', 'sweden']),
        ],
      },
    ],
  },
  {
    id: 'swe_a2_confidence',
    title: 'The Count in the Riksdag',
    speaker: 'swe_ehrenkrona',
    text: () =>
      'Gustaf Ehrenkrona rises in the Riksdag with the unhurried air of a man who has already counted the votes. The government, he says, confuses caution with cowardice; it shelters behind neutrality while neglecting the only thing that makes neutrality respectable — the means to defend it. He moves a confidence motion on the pace of rearmament. The galleries are full. Thulin, awkwardly, agrees with half of what the Count is saying, and the Count knows it, and pauses precisely long enough for everyone to watch Thulin not applauding.',
    options: [
      {
        id: 'adopt',
        text: 'Adopt half his program. Deny him the issue.',
        effects: [
          fx.treasury(-150),
          fx.warSupport(6),
          fx.capital(-10),
          fx.charLoyalty('swe_ehrenkrona', 5),
          fx.charLog('swe_ehrenkrona', 'Watched the government legislate his rearmament program without crediting him. Called it “plagiarism, gratefully received.”'),
          fx.charLog('swe_thulin', 'Received by opposition motion the budget he could not win in cabinet. Declined to examine the gift horse.'),
        ],
      },
      {
        id: 'stake',
        text: 'Stake the government on the vote. Break him.',
        enabled: ({ nation }) => nation.politicalCapital >= 20,
        effects: [
          fx.capital(-20),
          fx.stability(6),
          fx.warSupport(-2),
          fx.charLoyalty('swe_ehrenkrona', -10),
          fx.charLog('swe_ehrenkrona', 'His confidence motion failed by eleven votes. He bowed to the chamber and began preparing the next one.'),
          fx.chronicle('Lindqvist government survives confidence vote on rearmament', ['politics', 'sweden']),
        ],
      },
      {
        id: 'commission',
        text: 'Concede an inquiry commission. Bury it in procedure.',
        effects: [
          fx.capital(-5),
          fx.stability(-2),
          fx.charLoyalty('swe_ehrenkrona', -5),
          fx.charLog('swe_ehrenkrona', 'Offered a defense commission instead of a vote. Accepted it the way one accepts an umbrella from a thief.'),
        ],
      },
    ],
  },
  {
    id: 'swe_a2_refugees',
    title: 'The Quiet Harbor',
    speaker: 'swe_almgren',
    text: () =>
      'Sigrid Almgren’s files are usually about Swedes. This one is not. It is a ledger of applications at the southern ports and the German frontier — academics, physicians, families with one suitcase apiece, people for whom Germany has become arithmetic with their names in it. The legal quota was written for quieter years. “Every door in Europe is closing in alphabetical order,” Almgren says, methodical as ever. “The question on my desk is whether ours is a door or a wall. I can administer either. I would prefer to know which.”',
    options: [
      {
        id: 'open',
        text: 'Open the quota, and say so plainly.',
        effects: [
          fx.standing(8),
          fx.ideology('natl', -8),
          fx.relation('Germany', { opinion: -8 }),
          fx.relation('United States', { opinion: 6 }),
          fx.charLog('swe_almgren', 'Tripled the refugee quota and published the circular over her own signature. Filed the German protest unread.'),
          fx.queueScene('swe_payoff_refuge', 8),
          fx.chronicle('Sweden widens its doors to refugees from Germany', ['humanitarian', 'sweden']),
        ],
      },
      {
        id: 'quiet',
        text: 'Admit them quietly. No announcements.',
        effects: [
          fx.standing(3),
          fx.ideology('natl', -3),
          fx.relation('Germany', { opinion: -2 }),
          fx.charLog('swe_almgren', 'Instructed her border inspectors to read the refugee quota “generously.” Generosity, unrecorded, flowed.'),
          fx.charLog('swe_soderberg', 'Answered German inquiries about Swedish admissions with statistics so dull no one checked them.'),
          fx.queueScene('swe_payoff_refuge', 8),
        ],
      },
      {
        id: 'close',
        text: 'The rules stay as written. We are a small country.',
        effects: [
          fx.ideology('natl', 6),
          fx.standing(-6),
          fx.stability(2),
          fx.relation('Germany', { opinion: 3 }),
          fx.charLog('swe_almgren', 'Ordered to apply the old quota without generosity. Applied it exactly, and kept the refusal ledger in her own hand.'),
        ],
      },
    ],
  },
  {
    id: 'swe_payoff_refuge',
    title: 'What the Harbor Returned',
    speaker: 'swe_ingrid',
    text: () =>
      'Ingrid mentions it over supper, the way she delivers all intelligence: as gossip from her classroom. Three new pupils this term who arrived speaking no Swedish and now correct her grammar. Their fathers — an optics engineer at the instrument works, a metallurgist out at Sandviken, a doctor covering the night clinic no Swede wanted. “The parents say we took them in when nobody would,” she says, clearing the plates. “They intend to repay it. I told them that was unnecessary.” She pauses. “They are repaying it anyway.”',
    options: [
      {
        id: 'silent',
        text: 'Note it in no speech. Let it speak.',
        effects: [
          fx.stability(3),
          fx.custom(({ nation }) => {
            nation.research.progress += 10;
          }),
          fx.charLog('swe_ingrid', 'Reported, via the supper table, that the refugee families were quietly becoming the country’s good luck.'),
        ],
      },
      {
        id: 'cite',
        text: 'Cite them in the budget debate.',
        effects: [
          fx.capital(8),
          fx.standing(3),
          fx.relation('Germany', { opinion: -3 }),
          fx.charLog('swe_ingrid', 'Her classroom anecdote appeared, lightly disguised, in the Prime Minister’s budget speech. She graded it: adequate.'),
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- ACT 3
  {
    id: 'swe_a3_winter',
    title: 'Snow on the Border',
    speaker: 'swe_cederwall',
    text: () =>
      'It begins as Cederwall’s briefings always begin — gloomily — except this time the map justifies him. Soviet divisions are massing on the Finnish frontier; Moscow’s note to Helsinki reads like a verdict awaiting a crime. Finland asks Stockholm for what it has always half-expected to ask: men, guns, and the word “solidarity” said out loud. Cederwall traces the Torne river with one finger. “If Finland falls, this is the border. I have planned for invasions from every direction. I had hoped to retire before being right about one.”',
    options: [
      {
        id: 'volunteers',
        text: 'Volunteers and arms — everything short of war.',
        effects: [
          fx.flag('swe_act', 3),
          fx.flag('swe_winter', 'volunteers'),
          fx.relation('Finland', { opinion: 25, trust: 15 }),
          fx.relation('USSR', { opinion: -15, trust: -8 }),
          fx.stockpile('arms', -12),
          fx.warSupport(8),
          fx.tension(4),
          fx.charLog('swe_cederwall', 'Organized the volunteer corps for Finland and released guns from his own depots, gloomily and fast.'),
          fx.charLog('swe_thulin', 'Stripped the air-defense reserve to equip the Finland volunteers. Said the planes were finally pointed the right way.'),
          fx.chronicle('Swedish volunteers and arms stream to Finland', ['war', 'sweden']),
        ],
      },
      {
        id: 'arms',
        text: 'Arms quietly. No men, no speeches.',
        effects: [
          fx.flag('swe_act', 3),
          fx.flag('swe_winter', 'arms'),
          fx.relation('Finland', { opinion: 12, trust: 8 }),
          fx.relation('USSR', { opinion: -6 }),
          fx.stockpile('arms', -8),
          fx.charLog('swe_cederwall', 'Shipped crated rifles to Finland under bills of lading describing agricultural machinery. Did not smile.'),
          fx.charLog('swe_soderberg', 'Assured Moscow that Sweden remained a non-belligerent. Chose the word with a jeweler’s care.'),
        ],
      },
      {
        id: 'neutral',
        text: 'Strict neutrality. The border stays a border.',
        effects: [
          fx.flag('swe_act', 3),
          fx.flag('swe_winter', 'neutral'),
          fx.relation('Finland', { opinion: -15, trust: -10 }),
          fx.relation('USSR', { opinion: 6 }),
          fx.standing(-5),
          fx.warSupport(-5),
          fx.stability(3),
          fx.charLog('swe_soderberg', 'Delivered the refusal to Helsinki herself, in person, in Finnish. It was not forgiven faster for that.'),
          fx.chronicle('Sweden declares strict neutrality in the Finnish crisis', ['diplomacy', 'sweden']),
        ],
      },
    ],
  },
  {
    id: 'swe_a3_transit',
    title: 'Sealed Wagons',
    speaker: 'swe_soderberg',
    text: () =>
      'The German note is short and arrives by hand. Berlin requests transit rights across Swedish rail — material and personnel, northbound, “of a non-belligerent character,” a phrase Söderberg reads aloud twice to let the room hear it not mean anything. Refusal, the note observes, would be viewed in the gravest light. Cederwall has already measured the bridges that would have to carry the traffic, and the charges that would have to drop them. “They are asking,” Söderberg says, “which is itself information. The next note will not ask.”',
    options: [
      {
        id: 'refuse',
        text: 'Refuse outright. Neutrality is not a timetable.',
        effects: [
          fx.flag('swe_transit', 'refused'),
          fx.relation('Germany', { opinion: -15, fear: 4 }),
          fx.relation('United Kingdom', { opinion: 10, trust: 5 }),
          fx.relation('Norway', { opinion: 12, trust: 8 }),
          fx.standing(6),
          fx.warSupport(5),
          fx.tension(4),
          fx.charLog('swe_soderberg', 'Refused German transit in a note of two sentences. Kept the draft with seven sentences for her memoirs.'),
          fx.charLog('swe_cederwall', 'Wired the bridge garrisons the night the transit refusal went to Berlin. Slept at the ministry.'),
          fx.chronicle('Sweden refuses German transit demands', ['diplomacy', 'sweden']),
        ],
      },
      {
        id: 'sealed',
        text: 'Permit sealed wagons only: medical and leave traffic.',
        effects: [
          fx.flag('swe_transit', 'sealed'),
          fx.relation('Germany', { opinion: 5 }),
          fx.relation('United Kingdom', { opinion: -8, trust: -5 }),
          fx.standing(-4),
          fx.charLog('swe_soderberg', 'Conceded sealed humanitarian transit and wrote the inspection regime herself, lock by lock.'),
          fx.charLog('swe_almgren', 'Put her own inspectors on the sealed German wagons. The seals, she reported, were occasionally honest.'),
        ],
      },
      {
        id: 'grant',
        text: 'Grant the transit. Spare the cities.',
        effects: [
          fx.flag('swe_transit', 'granted'),
          fx.relation('Germany', { opinion: 12, trust: 5 }),
          fx.relation('United Kingdom', { opinion: -15, trust: -10 }),
          fx.relation('Norway', { opinion: -20, trust: -15 }),
          fx.standing(-10),
          fx.stability(-4),
          fx.charLog('swe_soderberg', 'Signed the transit concession and tendered her resignation in the same envelope. The resignation was refused.'),
          fx.chronicle('Sweden grants Germany rail transit rights', ['diplomacy', 'sweden']),
        ],
      },
    ],
  },
  {
    id: 'swe_a3_mining',
    title: 'Iron in the Water',
    speaker: 'swe_brandt',
    text: () =>
      'Brandt spreads the chart across your table and weights its corners with shell fragments he keeps for the purpose. Foreign warships — several flags, none invited — have begun using Swedish territorial waters as a sheltered corridor for the ore traffic and for hunting it. “A neutral who cannot close his own door is a hallway,” the Admiral says. He proposes mine barrages across the leads, declared and charted, with the navy patrolling the gaps. It will offend every belligerent equally, which he considers the definition of neutrality with a navy.',
    options: [
      {
        id: 'mine',
        text: 'Lay the fields. Publish the charts to all flags.',
        effects: [
          fx.treasury(-100),
          fx.relation('Germany', { opinion: -6, fear: 6 }),
          fx.relation('United Kingdom', { opinion: 4, fear: 3 }),
          fx.warSupport(4),
          fx.charLoyalty('swe_brandt', 10),
          fx.charLog('swe_brandt', 'Laid the declared barrages across the leads and mailed the minefield charts to every legation in Stockholm.'),
          fx.queueScene('swe_a3_ending', 3),
          fx.chronicle('Sweden mines its territorial waters', ['war', 'sweden']),
        ],
      },
      {
        id: 'patrol',
        text: 'No mines. Standing patrols and warning shots instead.',
        effects: [
          fx.treasury(-40),
          fx.custom(({ nation }) => {
            nation.military.navy += 3;
          }),
          fx.charLog('swe_brandt', 'Denied his minefields, given patrol authority instead. Interpreted “warning shot” with old-school latitude.'),
          fx.queueScene('swe_a3_ending', 3),
        ],
      },
      {
        id: 'open',
        text: 'Leave the leads open. Mines sink neutrals too.',
        effects: [
          fx.relation('Germany', { opinion: 4 }),
          fx.relation('United Kingdom', { opinion: -4 }),
          fx.charLoyalty('swe_brandt', -8),
          fx.charLog('swe_brandt', 'His mining proposal was shelved. Returned the shell fragments to his pocket and the chart to its tube.'),
          fx.queueScene('swe_a3_ending', 3),
        ],
      },
    ],
  },
  {
    id: 'swe_a3_ending',
    title: 'The Long Winter’s Account',
    speaker: 'swe_lindqvist',
    text: ({ nation }) => {
      const a = nation.flags['swe_alignment'];
      const opening =
        'The lamps burn late in the Chancellery, and for once nobody pretends otherwise. Europe is at the edge of itself; the question of Sweden has been asked in three capitals and answered, so far, only in Stockholm. ';
      if (a === 'london')
        return (
          opening +
          'The sterling protocol has held. London calls Sweden “a friend who keeps her own counsel,” and Berlin calls her something shorter. The ore trains still run in both directions, but everyone has read the schedule. What remains is to decide what this government will be when the shooting starts: a friend, or merely a customer.'
        );
      if (a === 'berlin')
        return (
          opening +
          'The tonnage guarantees have bought quiet from Berlin and silence from nearly everyone else. The ore goes south; the misgivings stay home. Wikman says the books balance. Ingrid says her pupils ask questions she cannot answer in front of the class. What remains is to decide what the guarantees have actually purchased, and for whom.'
        );
      return (
        opening +
        'No protocol, no guarantee, no exclusive friend — only the iron, the navy, and a phrase the foreign papers have started printing without irony: armed neutrality. It has cost more than alignment would have, in money and in invitations. What remains is to decide whether the country can afford to keep affording it.'
      );
    },
    options: [
      {
        id: 'strict_hold',
        text: 'Stand alone: armed, unaligned, awake.',
        enabled: ({ nation }) => nation.flags['swe_alignment'] === 'strict',
        effects: [
          fx.flag('swe_ending', 'armed_neutral'),
          fx.stability(5),
          fx.standing(5),
          fx.warSupport(3),
          fx.charLog('swe_lindqvist', 'Closed the decade as he began it: neutral by craft, armed by conviction, owed by everyone and owned by no one.'),
          fx.chronicle('Sweden holds to armed neutrality as Europe darkens', ['epilogue', 'sweden']),
        ],
      },
      {
        id: 'london_bind',
        text: 'Bind the western tie tighter.',
        enabled: ({ nation }) => nation.flags['swe_alignment'] === 'london',
        effects: [
          fx.flag('swe_ending', 'london'),
          fx.relation('United Kingdom', { opinion: 10, trust: 10 }),
          fx.relation('Germany', { opinion: -10 }),
          fx.warSupport(4),
          fx.charLog('swe_lindqvist', 'Chose the western tie and said so in the Riksdag, plainly, once. Neutrality, he noted, was a craft — not a faith.'),
          fx.chronicle('Sweden aligns its trade and sympathies with the West', ['epilogue', 'sweden']),
        ],
      },
      {
        id: 'berlin_feed',
        text: 'Keep Berlin fed and the army growing.',
        enabled: ({ nation }) => nation.flags['swe_alignment'] === 'berlin',
        effects: [
          fx.flag('swe_ending', 'berlin'),
          fx.relation('Germany', { trust: 8, opinion: 6 }),
          fx.standing(-5),
          fx.treasury(80),
          fx.charLog('swe_lindqvist', 'Kept the ore moving south and the conscript classes growing, and stopped explaining the arithmetic aloud.'),
          fx.chronicle('Sweden settles into accommodation with Berlin', ['epilogue', 'sweden']),
        ],
      },
      {
        id: 'fortress',
        text: 'Quiet rearmament. All promises revocable.',
        effects: [
          fx.flag('swe_ending', 'fortress'),
          fx.treasury(-120),
          fx.warSupport(5),
          fx.custom(({ nation }) => {
            nation.military.air += 3;
            nation.military.navy += 2;
          }),
          fx.charLog('swe_lindqvist', 'Signed the winter rearmament estimate without a speech. Told Ingrid the country’s best promise was a runway.'),
          fx.chronicle('Stockholm rearms in silence, promising nothing', ['epilogue', 'sweden']),
        ],
      },
    ],
  },
];

export const EVENTS: EventDef[] = [
  // Act 1
  {
    id: 'swe_evt_ore_deal',
    nationId: 'Sweden',
    condition: (state) => state.turn >= 2,
    sceneId: 'swe_a1_ore_deal',
    once: true,
  },
  {
    id: 'swe_evt_rearmament',
    nationId: 'Sweden',
    condition: (state) => state.turn >= 5,
    sceneId: 'swe_a1_rearmament',
    once: true,
  },
  {
    id: 'swe_evt_naval_visit',
    nationId: 'Sweden',
    condition: (state) => state.turn >= 8,
    sceneId: 'swe_a1_naval_visit',
    once: true,
  },
  {
    id: 'swe_evt_union_hours',
    nationId: 'Sweden',
    condition: (state) => state.turn >= 11,
    sceneId: 'swe_a1_union_hours',
    once: true,
  },
  // Act 2 (the leak scene is queued from the ore deal; no event entry)
  {
    id: 'swe_evt_squeeze',
    nationId: 'Sweden',
    condition: (state, nation) => state.turn >= 14 && nation.flags['swe_act'] === 1,
    sceneId: 'swe_a2_squeeze',
    once: true,
  },
  {
    id: 'swe_evt_confidence',
    nationId: 'Sweden',
    condition: (state, nation) => state.turn >= 20 && nation.flags['swe_act'] === 2,
    sceneId: 'swe_a2_confidence',
    once: true,
  },
  {
    id: 'swe_evt_refugees',
    nationId: 'Sweden',
    condition: (state, nation) => state.turn >= 24 && nation.flags['swe_act'] === 2,
    sceneId: 'swe_a2_refugees',
    once: true,
  },
  // Act 3 (the ending scene is queued from the mining scene; no event entry)
  {
    id: 'swe_evt_winter',
    nationId: 'Sweden',
    condition: (state, nation) =>
      state.turn >= 37 &&
      nation.flags['swe_act'] === 2 &&
      (state.worldTension >= 20 || state.turn >= 40),
    sceneId: 'swe_a3_winter',
    once: true,
  },
  {
    id: 'swe_evt_transit',
    nationId: 'Sweden',
    condition: (state, nation) => state.turn >= 41 && nation.flags['swe_act'] === 3,
    sceneId: 'swe_a3_transit',
    once: true,
  },
  {
    id: 'swe_evt_mining',
    nationId: 'Sweden',
    condition: (state, nation) =>
      state.turn >= 43 && nation.flags['swe_act'] === 3 && nation.flags['swe_transit'] !== undefined,
    sceneId: 'swe_a3_mining',
    once: true,
  },
];
