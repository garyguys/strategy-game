import type { GameState, Nation } from '../game/state';

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export class Hud {
  private dateEl = el<HTMLSpanElement>('date');
  private panel = el<HTMLElement>('panel');
  private digest = el<HTMLDivElement>('digest');
  private digestTimer = 0;

  constructor(private state: GameState) {
    el<HTMLButtonElement>('panel-close').addEventListener('click', () =>
      this.onClosePanel(),
    );
  }

  /** Set by main to clear the map highlight when the panel is dismissed. */
  onClosePanel: () => void = () => this.hidePanel();

  bindEndTurn(handler: () => void): void {
    el<HTMLButtonElement>('end-turn').addEventListener('click', handler);
  }

  refreshDate(): void {
    this.dateEl.textContent = this.state.dateLabel;
  }

  showNation(nation: Nation): void {
    el<HTMLSpanElement>('panel-swatch').style.background =
      '#' + nation.color.toString(16).padStart(6, '0');
    el<HTMLHeadingElement>('panel-name').textContent =
      nation.name + (nation.playable ? '  ★' : '');
    el<HTMLParagraphElement>('panel-leader').textContent =
      `${nation.leader} — ${nation.government}`;

    const stats: [string, string][] = [
      ['Treasury', `${nation.treasury}M`],
      ['Stability', `${nation.stability}%`],
      ['Industry', `${nation.industry}`],
    ];
    el<HTMLDivElement>('panel-stats').innerHTML = stats
      .map(([k, v]) => `<span class="stat"><b>${k}</b>${v}</span>`)
      .join('');

    el<HTMLParagraphElement>('panel-note').textContent = nation.note;
    this.panel.classList.remove('hidden');
  }

  hidePanel(): void {
    this.panel.classList.add('hidden');
  }

  showDigest(lines: string[]): void {
    this.digest.textContent = lines.join(' ');
    this.digest.classList.remove('hidden');
    clearTimeout(this.digestTimer);
    this.digestTimer = window.setTimeout(
      () => this.digest.classList.add('hidden'),
      3500,
    );
  }
}
