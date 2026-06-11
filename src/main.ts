import { Application, Container } from 'pixi.js';
import { Camera } from './map/camera';
import { MapRenderer } from './map/mapRenderer';
import { project } from './map/projection';
import { GameState } from './game/state';
import { Hud } from './ui/hud';

const SEA_COLOR = 0xe7ddc4;

async function start(): Promise<void> {
  const app = new Application();
  await app.init({
    background: SEA_COLOR,
    resizeTo: window,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    autoDensity: true,
  });
  document.getElementById('map')!.appendChild(app.canvas);

  const world = new Container();
  app.stage.addChild(world);

  const state = new GameState();
  const camera = new Camera(world, app.canvas);
  const map = new MapRenderer(state, camera);
  const hud = new Hud(state);

  await map.load('data/world_1938.geojson');
  world.addChild(map.container);

  // Open on Europe, where the MVP's playable nations live.
  const [ex, ey] = project(14, 50);
  camera.lookAt(ex, ey, Math.max(2, Math.min(6, window.innerWidth / 480)));

  map.selectionChanged((id) => {
    if (id) hud.showNation(state.nations.get(id)!);
    else hud.hidePanel();
  });
  hud.onClosePanel = () => map.select(null);

  hud.bindEndTurn(() => {
    const digest = state.endTurn();
    hud.refreshDate();
    hud.showDigest(digest);
  });
  hud.refreshDate();
}

start();
