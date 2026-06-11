# Strategy Game — Content & Design Proposal

A cross-platform (mobile + desktop) grand strategy game blending:

- **Hearts of Iron IV** — military planning, production, focus trees
- **Suzerain** — character-driven political narrative, dialogue choices with consequences
- **Europa Universalis IV** — nation management, deep diplomacy, trade

## Core Fantasy

You are the leader of a nation in a volatile era. You win not only by conquest,
but by out-negotiating, out-trading, and out-maneuvering rivals — while keeping
your own government, party, and family from turning on you.

## Design Pillars

1. **Diplomacy is the main verb.** War is expensive and risky; most problems
   should have a diplomatic, economic, or covert solution.
2. **Characters, not just countries.** Every nation is fronted by named leaders,
   ministers, and rivals with personalities, memories, and grudges (Suzerain DNA).
3. **Playable in 5 minutes or 5 hours.** Turn-based ticks so a mobile player can
   take a meaningful turn on a commute; desktop players can chain turns.
4. **Readable depth.** Fewer, more meaningful numbers than Paradox games —
   every stat must be explainable in one tooltip sentence.

---

## 1. Setting & Map

- **Recommended setting:** an *alternate-history 1930s–50s world* with fictional
  nations (like Suzerain's Sordland). Fictional nations avoid licensing/historical
  sensitivity issues and free the narrative writing.
- **Map:** region-based (not 10,000 provinces). ~300–600 regions worldwide.
  Regions have terrain, resources, population, development, and unrest.
- Each playable nation gets a unique starting situation: constitution type,
  economy, rivals, internal factions, and a bespoke narrative arc.
- MVP scope: **one continent, 8–12 nations, 3 fully playable** with unique story
  content; the rest AI-only with generic content.

## 2. Internal Politics (the Suzerain layer)

- **Government system:** constitution defines what you can do (decrees vs.
  needing parliament votes). You can amend it — at a political cost.
- **Cabinet:** appoint ministers (economy, foreign affairs, defense, interior).
  Each is a character with competence, loyalty, ideology, and a personal agenda.
  A disloyal but brilliant minister is a classic dilemma.
- **Factions & parliament:** parties/blocs with approval ratings. Major actions
  (war declarations, treaties, budgets) need political capital or votes.
- **Narrative decisions:** Suzerain-style dialogue scenes at key moments —
  cabinet crises, foreign summits, scandals, assassination attempts. Choices
  shift ideology axes (e.g., authoritarian↔democratic, planned↔market,
  nationalist↔internationalist) which gate later options.
- **Elections / succession:** lose power and the campaign is over — or continue
  as the new leader with the old one's mess (great replayability hook).
- **Personal life subplot:** family, health, reputation — small but humanizing,
  one of Suzerain's most-loved features.

## 3. Diplomacy (the headline system)

- **Relationship model per nation-pair:** Trust (slow-moving, hard to rebuild),
  Opinion (fast-moving), and Fear. AI leaders remember betrayals across decades.
- **Treaty builder:** compose multi-clause deals — territory, trade access,
  military access, tribute, tech sharing, non-aggression, guarantees,
  demilitarized zones. Both sides' AI evaluates the package.
- **Alliances with depth:** defensive pacts, full alliances, federations/blocs
  with internal voting (think mini-UN or Comintern/NATO analogues).
- **Congresses & summits:** multi-party negotiation events after wars or crises;
  played as narrative scenes with mechanical stakes (the HOI4 peace conference,
  but interactive and mid-game too).
- **International incidents:** border clashes, spy captures, trade disputes —
  each a small crisis mini-event with escalate/negotiate/back-down choices.
- **Reputation system:** "Standing" replaces EU4's aggressive expansion —
  treaty-breaking and atrocities make others refuse deals and form coalitions.
- **Espionage:** spy networks per country — intel (reveal armies/plans),
  influence (sway elections, fund factions), sabotage, counter-intelligence.
  Caught spies trigger incidents.

## 4. Economy & Trade

- **Resources:** ~10–14 goods (grain, oil, steel, coal, rare metals, consumer
  goods, arms, luxury goods…). Regions produce; industry converts; population
  and military consume.
- **Trade routes:** negotiated bilateral agreements *and* an open market with
  prices driven by supply/demand. Embargoes and blockades are diplomatic
  weapons that actually hurt.
- **Budget:** taxes, tariffs, debt, and bonds. Deficit spending works until the
  creditors (possibly foreign powers — leverage!) come calling.
- **Development:** invest in regions — infrastructure, factories, schools.
  Internal development is a viable alternative to expansion ("tall play").
- **Corporations/state industries:** a few named economic actors per nation
  that lobby you, can be nationalized or privatized (Suzerain-style dilemma).

## 5. Military (HOI4-lite)

- **Production:** factories build equipment over time; templates kept simple
  (infantry/armor/artillery mix sliders, not 25-slot designers).
- **Fronts & plans:** draw a front line and an objective; armies execute with
  efficiency based on generals, supply, and doctrine. Manual control optional
  on desktop, plan-based by default on mobile.
- **Supply & attrition:** armies need food, fuel, arms from the economy —
  the economy and war layers must feed each other.
- **Navy & air simplified:** mission-based (patrol zone, blockade, escort,
  strategic bombing) rather than unit micromanagement.
- **War goals & war support:** wars need justification; public war support
  drains over time and forces negotiated peaces — most wars should end at the
  table, looping back into the diplomacy/congress system.

## 6. Research & National Paths

- **Tech tree:** compact, era-gated (industry, military, statecraft branches).
- **National focus tree (HOI4-style):** but driven by *narrative state* — your
  ideology drift and story choices unlock/lock branches, so the focus tree and
  the Suzerain layer are one system, not two.

## 7. Events & Replayability

- **Scripted arcs:** each playable nation has a 3-act story (crisis → choice of
  paths → consequences) with multiple endings.
- **Systemic events:** generated from world state (famines from grain shortage,
  coups from low loyalty + high unrest, market crashes).
- **World tension / era clock:** a global escalation meter (HOI4 world tension)
  that paces the game toward a great-power confrontation — or, if diplomats
  prevail, a long cold war you can win economically.
- **Victory:** multiple win conditions — hegemony (military), prosperity
  (economic), prestige/legacy (diplomatic & narrative score), plus per-nation
  story endings.

## 8. Platform & UX (mobile + desktop)

- **Turn-based** (e.g., 1 turn = 1 month) rather than real-time-with-pause —
  this is the single most important call for mobile parity and battery life.
- **One codebase:** web-first (TypeScript + PixiJS/WebGL map, PWA install on
  mobile, Electron/Tauri wrapper for desktop) — or Godot 4 if a store-native
  feel matters more. Web-first is recommended for iteration speed and zero
  install friction.
- **Touch-first UI:** bottom-sheet panels, large tap targets, map gestures;
  desktop adds hotkeys, tooltips-on-hover, multi-panel layouts.
- **Cloud saves** to hop between phone and desktop mid-campaign.
- **Sessions:** an "advisor digest" each turn (what happened, what needs you)
  so a 5-minute mobile session is always productive.
- **Later: async multiplayer** — simultaneous turn resolution, 24h turn timers,
  works naturally with the turn-based core.

## 9. Suggested MVP Cut

| Phase | Content |
|-------|---------|
| MVP | 1 continent, 3 playable nations, map + turns, basic economy/trade, treaty builder, 1 story arc each, simple war (fronts + production) |
| v2 | Espionage, congresses, parliament/factions, focus trees, more nations |
| v3 | Full world map, async multiplayer, mod/scenario support |

## Decisions (locked 2026-06-11)

1. **Setting:** real countries, 1936 start, historical borders — but every
   leader, minister, and rival is a **fictional character**, freeing the
   narrative writing from real-figure constraints.
2. **Single-player only.** No multiplayer planned.
3. **Art direction:** stylized paper/parchment map — muted fills, sepia
   borders, serif small-caps labels.
4. **Engine:** web stack — TypeScript + Vite + PixiJS (WebGL), PWA for mobile,
   wrappable in Tauri/Electron for desktop later.
5. **Working title:** *Accord 1936* (placeholder, easy to change).
6. **Map data:** 1938 world borders from the open
   [historical-basemaps](https://github.com/aourednik/historical-basemaps)
   dataset (closest available year to 1936; border precision is approximate).
7. **MVP playable nations:** Czechoslovakia, Sweden, Turkey — mid-powers whose
   survival depends on diplomacy and trade rather than conquest, which is the
   game's thesis.
