import { Container, Graphics, Text } from 'pixi.js';
import { outerRings, type CountryCollection, type CountryFeature } from './geojson';
import { project } from './projection';
import type { GameState } from '../engine/types';
import { resolveController } from '../engine/state';
import { atWarWith } from '../systems/diplomacy';
import type { Camera } from './camera';

const PAPER = { r: 0xef, g: 0xe6, b: 0xcf };
const BORDER_COLOR = 0x5d4f3b;
const LABEL_COLOR = 0x4a3f2e;
const TAP_TOLERANCE_PX = 8;

export type MapMode = 'political' | 'diplomatic' | 'trade' | 'unrest';

function fade(color: number, amount: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const mix = (c: number, p: number) => Math.round(c + (p - c) * amount);
  return (mix(r, PAPER.r) << 16) | (mix(g, PAPER.g) << 8) | mix(b, PAPER.b);
}

interface CountryShape {
  id: string; // basemap NAME
  nationId: string; // owning nation after SUBJECTO resolution
  colony: boolean;
  rings: number[][];
  graphics: Graphics;
}

export class MapRenderer {
  readonly container = new Container();
  mode: MapMode = 'political';

  private shapes = new Map<string, CountryShape>();
  private byNation = new Map<string, CountryShape[]>();
  private highlight = new Graphics();
  private labels = new Container();
  private onSelect: (nationId: string | null) => void = () => {};
  private state: GameState | null = null;

  constructor(private camera: Camera) {}

  selectionChanged(handler: (id: string | null) => void): void {
    this.onSelect = handler;
  }

  /** Countries present in the map data, for state init. */
  countryRefs: { id: string; subjecto?: string | null }[] = [];

  async load(url: string): Promise<void> {
    const data: CountryCollection = await (await fetch(url)).json();
    const countries = new Container();
    this.container.addChild(countries, this.highlight, this.labels);

    for (const feature of data.features) {
      const id = feature.properties.NAME;
      if (!id || this.shapes.has(id)) continue;
      this.countryRefs.push({ id, subjecto: feature.properties.SUBJECTO });

      const nationId = resolveController(id, feature.properties.SUBJECTO);
      const rings = outerRings(feature as CountryFeature).map((ring) => {
        const flat: number[] = [];
        for (const [lon, lat] of ring) flat.push(...project(lon, lat));
        return flat;
      });

      const g = new Graphics();
      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointertap', () => {
        if (this.camera.dragDistance < TAP_TOLERANCE_PX) this.select(nationId);
      });
      countries.addChild(g);

      const shape: CountryShape = { id, nationId, colony: nationId !== id, rings, graphics: g };
      this.shapes.set(id, shape);
      const list = this.byNation.get(nationId) ?? [];
      list.push(shape);
      this.byNation.set(nationId, list);
    }
  }

  /** Bind to game state and draw. Call again whenever state changes. */
  refresh(state: GameState): void {
    this.state = state;
    for (const shape of this.shapes.values()) {
      this.draw(shape);
    }
    this.drawLabels();
  }

  setMode(mode: MapMode): void {
    this.mode = mode;
    if (this.state) this.refresh(this.state);
  }

  private nationColor(nationId: string): number {
    const state = this.state!;
    let nation = state.nations[nationId];
    if (!nation) return 0xcfc4a8;
    if (!nation.alive) {
      // annexed: color by whoever owns its old heartland now
      const heir = Object.values(state.regions).find((r) => r.id.includes(nationId.replace(/\W+/g, '_').toLowerCase()) || r.ownerId === nationId);
      const heirOwner = heir ? state.regions[heir.id].ownerId : null;
      nation = heirOwner && state.nations[heirOwner]?.alive ? state.nations[heirOwner] : nation;
    }
    return nation.color;
  }

  private fillFor(shape: CountryShape): number {
    const state = this.state!;
    const player = state.nations[state.playerId];
    const base = this.nationColor(shape.nationId);
    const nation = state.nations[shape.nationId];

    switch (this.mode) {
      case 'political':
        return shape.colony ? fade(base, 0.45) : state.nations[shape.nationId]?.major ? base : fade(base, 0.25);
      case 'diplomatic': {
        if (!nation || !player) return fade(0xb0a890, 0.5);
        if (shape.nationId === state.playerId) return 0x7da99e;
        if (atWarWith(state, state.playerId, shape.nationId)) return 0xa84438;
        const treatied = state.treaties.some((t) => t.parties.includes(state.playerId) && t.parties.includes(shape.nationId));
        const sameBloc = player.blocId && player.blocId === nation.blocId;
        if (sameBloc) return 0x5f8f76;
        if (treatied) return 0x86a87c;
        if (nation.embargoes.includes(state.playerId) || player.embargoes.includes(shape.nationId)) return 0xbf8054;
        const rel = nation.relations[state.playerId];
        if (rel && rel.opinion < -30) return 0xb89274;
        return fade(0xb0a890, 0.35);
      }
      case 'trade': {
        if (!nation || !player) return fade(base, 0.6);
        if (shape.nationId === state.playerId) return 0x8a7e5c;
        const contract = state.treaties.some(
          (t) =>
            t.parties.includes(state.playerId) &&
            t.parties.includes(shape.nationId) &&
            t.clauses.some((c) => c.type === 'resourceContract' || c.type === 'tradeAgreement'),
        );
        if (contract) return 0x7d99b0;
        if (player.embargoes.includes(shape.nationId) || nation.embargoes.includes(state.playerId)) return 0xa84438;
        return fade(base, 0.55);
      }
      case 'unrest': {
        if (!nation) return fade(base, 0.6);
        const known = shape.nationId === state.playerId || player.flags[`intel_${shape.nationId}`] !== undefined;
        if (!known) return fade(0xb0a890, 0.6);
        const regions = nation.regionIds.map((r) => state.regions[r]).filter(Boolean);
        const avg = regions.length ? regions.reduce((s, r) => s + r.unrest, 0) / regions.length : 0;
        const heat = Math.min(1, avg / 70);
        const r = Math.round(0xb0 + heat * 0x30);
        const g = Math.round(0xa8 - heat * 0x55);
        const b = Math.round(0x90 - heat * 0x50);
        return (r << 16) | (g << 8) | b;
      }
    }
  }

  private draw(shape: CountryShape): void {
    const g = shape.graphics;
    g.clear();
    const fill = this.fillFor(shape);
    for (const flat of shape.rings) {
      g.poly(flat)
        .fill(fill)
        .stroke({ width: 0.45, color: BORDER_COLOR, alpha: 0.8, join: 'round' });
    }
  }

  select(nationId: string | null): void {
    this.highlight.clear();
    if (nationId) {
      for (const shape of this.byNation.get(nationId) ?? []) {
        for (const flat of shape.rings) {
          this.highlight
            .poly(flat)
            .fill({ color: 0x8a2e2e, alpha: 0.07 })
            .stroke({ width: 1.1, color: 0x8a2e2e, alpha: 0.95, join: 'round' });
        }
      }
    }
    this.onSelect(nationId);
  }

  /** World-space bbox center of a nation's largest shape (for camera jumps). */
  center(nationId: string): [number, number] | null {
    const shapes = this.byNation.get(nationId);
    if (!shapes?.length) return null;
    const { bounds } = this.largestRing(shapes.flatMap((s) => s.rings));
    return [(bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2];
  }

  private drawLabels(): void {
    const state = this.state!;
    this.labels.removeChildren();
    for (const [nationId, shapes] of this.byNation) {
      const nation = state.nations[nationId];
      if (!nation?.major || !nation.alive) continue;
      const home = shapes.filter((s) => !s.colony);
      const rings = (home.length ? home : shapes).flatMap((s) => s.rings);
      const { bounds } = this.largestRing(rings);
      const width = bounds.maxX - bounds.minX;
      const height = bounds.maxY - bounds.minY;
      const size = Math.max(4, Math.min(22, Math.sqrt(width * height) * 0.12));
      const label = new Text({
        text: nation.name.toUpperCase(),
        style: { fontFamily: 'Georgia, serif', fontSize: size, letterSpacing: size * 0.25, fill: LABEL_COLOR },
      });
      label.alpha = 0.8;
      label.anchor.set(0.5);
      label.position.set((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2);
      label.eventMode = 'none';
      this.labels.addChild(label);
    }
  }

  private largestRing(rings: number[][]): { bounds: { minX: number; minY: number; maxX: number; maxY: number } } {
    let best = { area: -1, bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };
    for (const flat of rings) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < flat.length; i += 2) {
        minX = Math.min(minX, flat[i]);
        maxX = Math.max(maxX, flat[i]);
        minY = Math.min(minY, flat[i + 1]);
        maxY = Math.max(maxY, flat[i + 1]);
      }
      const area = (maxX - minX) * (maxY - minY);
      if (area > best.area) best = { area, bounds: { minX, minY, maxX, maxY } };
    }
    return best;
  }
}
