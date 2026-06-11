import { Application, Container } from 'pixi.js';
import { Camera } from './map/camera';
import { MapRenderer } from './map/mapRenderer';
import { project } from './map/projection';
import { initialState } from './engine/state';
import type { GameState } from './engine/types';
import { endTurn } from './engine/turn';
import { autosave, loadAutosave } from './engine/serialize';
import { evaluateEvents } from './systems/events';
import { MAJOR_NATIONS } from './data/nations';
import { buildShell, showPanel, updateHud, type App, type PanelId } from './ui/app';
import { renderPanel } from './ui/panels';
import { playScenes, showNewspaper, showBriefing, showOffers, showGameOver } from './ui/overlays';
import { h, clear, colorHex } from './ui/dom';

async function start(): Promise<void> {
  const pixi = new Application();
  await pixi.init({
    background: 0xe7ddc4,
    resizeTo: window,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    autoDensity: true,
  });
  document.getElementById('map')!.appendChild(pixi.canvas);

  const world = new Container();
  pixi.stage.addChild(world);
  const camera = new Camera(world, pixi.canvas);
  const map = new MapRenderer(camera);
  await map.load('data/world_1938.geojson');
  world.addChild(map.container);

  const [ex, ey] = project(14, 50);
  camera.lookAt(ex, ey, Math.max(2, Math.min(6, window.innerWidth / 480)));

  const saved = loadAutosave();
  if (saved) {
    boot(saved, map, camera);
  } else {
    nationSelect((nationId) => {
      const state = initialState(map.countryRefs, nationId, (Date.now() % 2147483647) | 1);
      boot(state, map, camera);
    });
  }
}

function nationSelect(onPick: (id: string) => void): void {
  const host = document.getElementById('modal')!;
  clear(host);
  host.classList.remove('hidden');
  const card = h('div', { class: 'scene start' },
    h('h2', { text: 'ACCORD 1936' }),
    h('p', { class: 'scene-text', text: 'January 1936. The peace is eighteen years old and showing its age. Choose the nation whose decade this will be — every leader you meet is fictional; every border is real enough.' }),
  );
  for (const [id, def] of Object.entries(MAJOR_NATIONS)) {
    if (!def.playable) continue;
    card.append(
      h('button', { class: 'btn scene-opt', onclick: () => { host.classList.add('hidden'); onPick(id); } },
        h('span', { class: 'swatch', style: `background:${colorHex(def.color)}` }),
        h('b', { text: ` ${def.name} — ` }),
        h('span', { class: 'sub', text: def.note }),
      ),
    );
  }
  card.append(h('p', { class: 'sub', text: 'The other great powers are run by the machine — and they remember everything.' }));
  host.append(h('div', { class: 'modal-card' }, card));
}

function boot(state: GameState, map: MapRenderer, camera: Camera): void {
  const app: App = {
    state,
    map,
    camera,
    selectedNation: null,
    activePanel: null,
    refresh() {
      map.refresh(app.state);
      updateHud(app);
      showPanel(app, renderPanel);
      autosave(app.state);
    },
    open(panel: PanelId | null) {
      app.activePanel = panel;
      showPanel(app, renderPanel);
      updateHud(app);
    },
    openModal(content: HTMLElement) {
      const host = document.getElementById('modal')!;
      clear(host);
      host.classList.remove('hidden');
      host.append(h('div', { class: 'modal-card' }, content));
    },
    closeModal() {
      const host = document.getElementById('modal')!;
      host.classList.add('hidden');
      clear(host);
    },
    toast(msg: string) {
      const t = document.getElementById('toast')!;
      t.textContent = msg;
      t.classList.remove('hidden');
      window.setTimeout(() => t.classList.add('hidden'), 3200);
    },
    endTurn() {
      if (app.state.gameOver) return showGameOver(app);
      endTurn(app.state);
      app.refresh();
      showNewspaper(app, () =>
        showBriefing(app, () =>
          showOffers(app, () =>
            playScenes(app, () => {
              if (app.state.gameOver) showGameOver(app);
            }),
          ),
        ),
      );
    },
    newGame() {
      location.reload();
    },
  };

  map.selectionChanged((id) => {
    app.selectedNation = id;
    if (id) app.open('nation');
    else if (app.activePanel === 'nation') app.open(null);
  });

  buildShell(app);
  map.refresh(state);
  updateHud(app);

  // opening beats (intro scene on turn 0)
  evaluateEvents(state);
  playScenes(app, () => {});
}

start();
