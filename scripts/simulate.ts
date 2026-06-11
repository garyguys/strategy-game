/** Headless engine soak test: play N turns per playable nation, auto-resolving scenes. */
import { readFileSync } from 'node:fs';
import { initialState } from '../src/engine/state';
import { endTurn } from '../src/engine/turn';
import { dueScenes, resolveScene, ALL_SCENES } from '../src/systems/events';
import { dateLabel } from '../src/engine/util';
import { computeLegacy } from '../src/systems/legacy';

const geo = JSON.parse(readFileSync('public/data/world_1938.geojson', 'utf8'));
const refs = geo.features
  .filter((f: { properties: { NAME?: string } }) => f.properties.NAME)
  .map((f: { properties: { NAME: string; SUBJECTO?: string } }) => ({ id: f.properties.NAME, subjecto: f.properties.SUBJECTO }));

const turns = Number(process.argv[2] ?? 60);
let failures = 0;

for (const player of ['Czechoslovakia', 'Sweden', 'Turkey']) {
  for (const seed of [11, 23, 47]) {
    const state = initialState(refs, player, seed);
    let scenesSeen = 0;
    try {
      for (let t = 0; t < turns && !state.gameOver; t++) {
        endTurn(state);
        // auto-play scenes: rotate option pick by seed for coverage
        let guard = 0;
        while (dueScenes(state).length && guard++ < 20) {
          const q = dueScenes(state)[0];
          const scene = ALL_SCENES.get(q.sceneId);
          if (!scene) {
            state.sceneQueue = state.sceneQueue.filter((x) => x !== q);
            continue;
          }
          const enabled = scene.options.filter((o) => {
            try {
              return o.enabled ? o.enabled({ state, nation: state.nations[q.nationId] }) : true;
            } catch {
              return false;
            }
          });
          const pick = enabled.length ? enabled[(seed + scenesSeen) % enabled.length] : scene.options[0];
          resolveScene(state, q, pick.id);
          scenesSeen++;
        }
        // accept every other offer to exercise treaty machinery
        if (state.offers.length && t % 2 === 0) state.offers = [];
      }
      const n = state.nations[player];
      const legacy = computeLegacy(state);
      console.log(
        `${player} seed ${seed}: ${dateLabel(state.turn)} | scenes ${scenesSeen} | treasury ${Math.round(n.treasury)} | stab ${Math.round(n.stability)} | standing ${Math.round(n.standing)} | tension ${Math.round(state.worldTension)} | wars ${state.wars.length} | treaties ${state.treaties.length} | chronicle ${state.chronicle.length} | alive ${n.alive} | over ${state.gameOver ? state.gameOver.reason : 'no'} | legacy ${Object.values(legacy).reduce((a, b) => a + b, 0)}`,
      );
    } catch (err) {
      failures++;
      console.error(`FAILURE ${player} seed ${seed} at ${dateLabel(state.turn)}:`, err);
    }
  }
}
console.log(failures ? `\n${failures} runs failed` : '\nAll simulation runs completed.');
process.exit(failures ? 1 : 0);
