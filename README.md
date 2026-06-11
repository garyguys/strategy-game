# Accord 1936 *(working title)*

A single-player grand strategy game for **mobile and desktop**: lead a real
nation through an alternate 1936 where every leader and minister is a fictional
character. Diplomacy, trade, and internal politics are the main verbs — war is
the expensive last resort.

Design pillars and full content plan: [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md).

## Status

Early prototype:

- Paper-map world rendering (PixiJS/WebGL) with historical 1938 borders
- Pan, wheel-zoom, pinch-zoom, tap-to-select — touch and mouse
- 15 major nations with fictional leaders, governments, and starting stats
- Monthly turn loop with a placeholder economy tick

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
