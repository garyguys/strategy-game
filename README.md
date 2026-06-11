# Accord 1936 *(working title)*

A single-player grand strategy game for **mobile and desktop**: lead a real
nation through an alternate 1936 where every leader and minister is a fictional
character. Diplomacy, trade, and internal politics are the main verbs — war is
the expensive last resort.

Design pillars and full content plan: [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md).

## Status

**1.0 release candidate** — all seven approved systems and 65 features from
[docs/SPEC.md](docs/SPEC.md) are implemented:

- **Treaties (T1-T8):** clause-based treaty builder, AI valuation and
  counter-offers, durations, breaking costs, ratification votes, secret
  clauses, guarantors
- **Trade & resources (R1-R8):** 10 goods, regional production, world market,
  contracts, embargoes/blockades, chokepoint tolls, budget and sovereign debt
- **War (W1-W10):** justifications, production, front-based plans, generals
  and doctrine, supply, naval/air missions, war support, peace via the treaty
  table, occupation and resistance
- **Diplomacy (D1-D10):** trust/opinion/fear, leader personalities and memory,
  Standing, blocs, congresses, crisis ladders, espionage, election meddling
  and coups, the League of Nations, world tension
- **Narrative (N1-N10):** three-act arcs for Czechoslovakia, Sweden, and
  Turkey (~40 scenes), 12 conditional world events, 12 systemic crisis
  templates, 6 personal-life scenes, ideology axes, the newspaper digest,
  endings and epilogues
- **Internal (I1-I11):** cabinet, political capital and legislature,
  constitutional acts, unrest, development, agenda trees, 60-tech research,
  minorities, corporations-flavored content, losable elections with
  succession, press posture
- **Memory & QoL (E1-E8):** the Chronicle with cause-to-effect links,
  character dossiers with full personal histories, legacy scoring, the
  Morning Briefing, autosave + save export/import, Ledger Mode, four map
  modes, data-driven content

Headless soak-tested: 9 campaigns x 60 turns and 3 full 14-year campaigns
(1936-1950) run without errors (`npx tsx scripts/simulate.ts`).

## Run it

```sh
npm install
npm run dev      # dev server (open the printed URL; works on phones via LAN)
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

## Stack

TypeScript + [Vite](https://vitejs.dev) + [PixiJS](https://pixijs.com) (WebGL).
UI chrome is plain DOM/CSS for easy responsive layout; the map is a single
canvas. No backend — designed to ship as a static site / PWA, wrappable in
Tauri or Electron for desktop.

## Data attribution

World borders (`public/data/world_1938.geojson`) come from
[aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps)
(open data; borders are approximate and intended for small-scale historical
visualization). All characters in the game are fictional.
