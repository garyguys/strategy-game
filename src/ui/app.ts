/** UI shell: nav, panel host, refresh plumbing. */
import type { GameState } from '../engine/types';
import type { MapRenderer, MapMode } from '../map/mapRenderer';
import type { Camera } from '../map/camera';
import { clear, h } from './dom';
import { dateLabel } from '../engine/util';

export type PanelId =
  | 'government'
  | 'economy'
  | 'military'
  | 'agenda'
  | 'chronicle'
  | 'dossiers'
  | 'crises'
  | 'menu'
  | 'nation';

export interface App {
  state: GameState;
  map: MapRenderer;
  camera: Camera;
  selectedNation: string | null;
  activePanel: PanelId | null;
  /** re-render HUD, map, and the open panel */
  refresh(): void;
  open(panel: PanelId | null): void;
  openModal(content: HTMLElement, onClose?: () => void): void;
  closeModal(): void;
  toast(msg: string): void;
  endTurn(): void;
  newGame(nationId: string): void;
}

const PANEL_TABS: { id: PanelId; label: string; chip: string }[] = [
  { id: 'government', label: 'Government', chip: '⚖' },
  { id: 'economy', label: 'Economy', chip: '⛁' },
  { id: 'military', label: 'Military', chip: '✠' },
  { id: 'agenda', label: 'Agenda', chip: '✎' },
  { id: 'crises', label: 'Crises', chip: '⚠' },
  { id: 'chronicle', label: 'Chronicle', chip: '☰' },
  { id: 'dossiers', label: 'Dossiers', chip: '✉' },
  { id: 'menu', label: 'Menu', chip: '≡' },
];

export function buildShell(app: App): void {
  const nav = document.getElementById('nav')!;
  clear(nav);
  for (const tab of PANEL_TABS) {
    nav.append(
      h(
        'button',
        {
          class: 'nav-btn',
          'data-panel': tab.id,
          title: tab.label,
          onclick: () => app.open(app.activePanel === tab.id ? null : tab.id),
        },
        h('span', { class: 'nav-chip', text: tab.chip }),
        h('span', { class: 'nav-label', text: tab.label }),
      ),
    );
  }

  const modes: { id: MapMode; label: string }[] = [
    { id: 'political', label: 'Political' },
    { id: 'diplomatic', label: 'Diplomatic' },
    { id: 'trade', label: 'Trade' },
    { id: 'unrest', label: 'Unrest' },
  ];
  const modeBar = document.getElementById('map-modes')!;
  clear(modeBar);
  for (const m of modes) {
    modeBar.append(
      h('button', {
        class: 'mode-btn',
        'data-mode': m.id,
        text: m.label,
        onclick: () => {
          app.map.setMode(m.id);
          updateModeBar(app);
        },
      }),
    );
  }
  updateModeBar(app);

  document.getElementById('end-turn')!.addEventListener('click', () => app.endTurn());
}

export function updateModeBar(app: App): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>('.mode-btn')) {
    btn.classList.toggle('active', btn.dataset.mode === app.map.mode);
  }
}

export function updateHud(app: App): void {
  const s = app.state;
  const player = s.nations[s.playerId];
  document.getElementById('date')!.textContent = dateLabel(s.turn);
  document.getElementById('hud-nation')!.textContent = player.name;
  document.getElementById('hud-treasury')!.textContent = `⛁ ${Math.round(player.treasury)}`;
  document.getElementById('hud-capital')!.textContent = `⚖ ${Math.floor(player.politicalCapital)}`;
  document.getElementById('hud-stability')!.textContent = `♦ ${Math.round(player.stability)}%`;
  document.getElementById('hud-standing')!.textContent = `★ ${Math.round(player.standing)}`;
  document.getElementById('hud-tension')!.textContent = `🜂 ${Math.round(s.worldTension)}`;
  const offers = document.getElementById('hud-offers')!;
  const pending = s.offers.length + s.crises.filter((c) => c.a === s.playerId || c.b === s.playerId).length;
  offers.textContent = pending ? `✉ ${pending}` : '';
  for (const btn of document.querySelectorAll<HTMLButtonElement>('.nav-btn')) {
    btn.classList.toggle('active', btn.dataset.panel === app.activePanel);
  }
}

export function showPanel(app: App, render: (app: App, panel: PanelId) => HTMLElement): void {
  const host = document.getElementById('panel')!;
  if (!app.activePanel) {
    host.classList.add('hidden');
    return;
  }
  clear(host);
  host.classList.remove('hidden');
  host.append(
    h('button', { class: 'panel-close', 'aria-label': 'Close', text: '×', onclick: () => app.open(null) }),
    render(app, app.activePanel),
  );
  host.scrollTop = 0;
}
