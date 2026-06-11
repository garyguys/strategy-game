# Accord 1936 — Approved 1.0 Feature Specification

All features below were approved on 2026-06-11. IDs are referenced in code and
commits. Status legend: each feature ships in 1.0 unless marked otherwise.

## System 1 — Treaties

- **T1 Treaty Builder.** Two-column give/get negotiation screen; AI computes a
  value score per clause from needs, fears, and trust; accepts when net value
  is positive.
- **T2 Launch clause set.** Non-aggression, defensive pact, trade agreement,
  resource contract, military access, guarantee of independence, war
  reparations, territorial cession, demilitarized zone, technology sharing.
- **T3 Durations & expiry.** Terms of 1y / 5y / permanent; expiry creates
  renegotiation moments and briefing alerts.
- **T4 Breaking & Standing.** Breaking is always possible; permanently scars
  victim Trust and dents global Standing. Escape clauses purchasable upfront.
- **T5 Ratification.** Parliamentary nations need legislature votes for major
  treaties; political capital whips votes.
- **T6 Secret clauses.** Hidden until exposed by espionage; exposure triggers a
  scandal incident.
- **T7 AI counter-offers.** AI returns modified packages instead of flat
  rejections; negotiation runs 2–3 rounds.
- **T8 Third-party guarantors.** Guarantor nations underwrite treaties;
  violation triggers their obligations.

## System 2 — Trade & Resources

- **R1 Goods set.** Grain, coal, iron ore, oil, rare metals; steel, machinery,
  consumer goods; arms, luxury goods. Chains: ore+coal→steel,
  steel+machinery→arms.
- **R2 Geographic production.** Regions produce per real geography (Swedish
  iron, Romanian oil, Turkish chromite, Ukrainian grain).
- **R3 Stockpiles & consumption.** Population eats grain/consumer goods,
  military burns arms/oil, industry consumes inputs; shortages raise unrest.
- **R4 World market + contracts.** Floating supply/demand prices; bilateral
  contracts lock volume/price and survive market spikes.
- **R5 Embargoes & blockades.** Embargo cuts mutual trade; wartime naval
  blockade cuts sea imports.
- **R6 Chokepoints & tolls.** Bosphorus, Suez, Gibraltar, Danish straits:
  holders toll, close, or extract diplomatic rent.
- **R7 Budget & sovereign debt.** Taxes/tariffs in; military/development/intel
  out; loans from market or great powers; creditors gain leverage; default
  wrecks Standing.
- **R8 Economic shock events.** Harvest failures, strikes, discoveries,
  crashes generated from world state.

## System 3 — War Actions

- **W1 War justification.** Casus belli fabricated over months or earned via
  events; unjustified war craters Standing and triggers coalitions.
- **W2 Production & composition.** Factories produce equipment monthly; armies
  use a 3-slider mix (infantry/artillery/armor); quality from equipment +
  doctrine.
- **W3 Fronts & plans.** Plan-based warfare: allocate armies to fronts with
  stances; monthly resolution from combat power (equipment, doctrine, general,
  terrain, supply).
- **W4 Generals & doctrine.** Named fictional generals with traits and
  politics; one compact doctrine track per nation.
- **W5 Supply & attrition.** Armies consume grain/arms/oil per turn; cut
  supply melts armies without battles.
- **W6 Navy & air missions.** Mission-based: blockade, convoy escort, patrol,
  strategic bombing, port strike.
- **W7 War support & exhaustion.** Public support drains with casualties,
  shortages, time; low support forces the table.
- **W8 Peace via treaty builder.** Armistice opens a clause-based peace
  negotiation; bargaining power from exhaustion and occupation; multi-party
  wars escalate to congress.
- **W9 Limited conflicts.** Border clashes, naval incidents, civil-war
  intervention (arms, volunteers, advisors) with escalation risk.
- **W10 Occupation & resistance.** Occupied regions produce reduced output and
  breed partisans; suppression trades Standing for speed.

## System 4 — Diplomacy

- **D1 Three-track relationships.** Trust (slow, scarring), Opinion (fast),
  Fear (military/proximity); all price the treaty AI.
- **D2 Leader personality & memory.** Traits (vengeful, pragmatic, ideologue,
  opportunist) shape negotiation; grudges persist until regime change.
- **D3 Standing.** Global reputation: drained by betrayals/aggression, built
  by honored guarantees and mediation; prices all deals, drives coalitions.
- **D4 Blocs.** Formal blocs with admission votes, joint embargoes, war entry,
  leader agendas, and poachable members.
- **D5 Congresses.** Multi-party tables with public proposals, private side
  deals, and walkouts; triggered by big crises and wars.
- **D6 Incident escalation ladder.** Structured escalate/hold/back-down
  crises with world tension and domestic pressure stakes.
- **D7 Espionage.** Per-country networks; intelligence, influence, sabotage,
  counter-intelligence ops; captures feed the incident ladder.
- **D8 Election meddling & coups.** Influence escalates to rigging and coup
  backing; exposure is catastrophic.
- **D9 League of Nations.** Bring disputes, vote sanctions, build or undermine
  it; making it work is a victory path.
- **D10 World tension clock.** Global escalation meter pacing the era; panics
  markets, accelerates rearmament, unlocks emergency options.

## System 5 — Narrative Crises

- **N1 Three-act arcs.** Czechoslovakia (borderlands), Sweden (armed
  neutrality), Turkey (the Straits); Act 1 establish, Act 2 alignment, Act 3
  consequences; multiple endings.
- **N2 Dialogue scenes.** Portrait scenes with 2–4 choices carrying mechanical
  consequences.
- **N3 Ideology axes.** authoritarian↔democratic, planned↔market,
  nationalist↔internationalist; gate options everywhere.
- **N4 The cast.** 8–12 persistent named characters per playable nation with
  agendas and memory.
- **N5 Systemic crisis generator.** Template events fired from world state:
  famine, coup, scandal, succession.
- **N6 Delayed consequences.** Choices plant flags that pay off months or
  years later.
- **N7 Personal life subplot.** Family, health, private reputation scenes.
- **N8 Simulation, not rails.** Historical-shaped world events are conditional
  on AI state and tension; they can fire differently, late, or never.
- **N9 Newspaper turn digest.** End-turn digest as a period front page;
  doubles as tutorial voice.
- **N10 Endings & legacy epilogue.** Distinct endings per arc outcome plus a
  whole-cast epilogue and comparable legacy score.

## System 6 — In-Nation Development & Internal Systems

- **I1 Cabinet.** Ministers with competence, loyalty, ideology, agendas;
  passive bonuses; firing has consequences.
- **I2 Political capital & legislature.** Monthly capital spent on bold acts;
  parliamentary votes whipped with capital, favors, concessions; autocracies
  pay in loyalty and patronage.
- **I3 Constitutional change.** Amendments (emergency powers, terms, suffrage)
  as mini-crises that move ideology hard.
- **I4 Stability & unrest.** Per-region unrest from shortages, ideology gaps,
  minorities, exhaustion; strikes → riots → insurgency/secession.
- **I5 Regional development.** Infrastructure, factories, mines, schools,
  hospitals; tall play is viable.
- **I6 National agenda tree.** Focus tree merged with narrative; branches
  gated by ideology and story; bespoke trees for playables.
- **I7 Research.** Compact era-gated tree: industry, military, statecraft;
  ~60 techs, one-sentence tooltips.
- **I8 Minorities & demographics.** Regional ethnic makeup; minorities tied to
  neighbors create unrest, pretexts, and policy dilemmas
  (integrate/autonomy/suppress).
- **I9 Corporations & unions.** Named economic actors that lobby, fund
  factions, and can be nationalized/privatized/favored.
- **I10 Elections & succession.** Losable elections with campaign decisions;
  on defeat/coup/death: end with epilogue or continue as successor.
- **I11 Press & propaganda.** Free/pressured/state press posture; control
  boosts war support but blinds you and breeds opposition.

## System 7 — Memory, Legacy & Quality of Life

- **E1 The Chronicle.** Browsable dated timeline of every major action written
  as newspaper-archive headlines; entries link cause to effect.
- **E2 Character dossiers.** Per-character biography plus a running log of
  their actions and outcomes; attitudes always show receipts.
- **E3 Legacy score & dynasty epilogue.** Multi-axis legacy across the whole
  reign (including successors); epilogue reads the Chronicle back.
- **E4 The Morning Briefing.** Prioritized per-turn brief: decisions needed,
  expiries, brewing trouble.
- **E5 Saves.** Autosave per turn + manual export/import; versioned format.
- **E6 Ledger Mode.** Optional single rolling save; choices permanent.
- **E7 Map modes.** Political, diplomatic, trade, unrest views.
- **E8 Data-driven content.** Nations, characters, events, arcs, clauses in
  data files; scenario packs and modding stay possible.

## Player-mandated emphases

1. Player history/legacy is a *featured* system (E1/E3), not a footnote.
2. Every NPC carries a visible history of their actions and outcomes (E2).
