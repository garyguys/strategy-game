import { Container, Graphics, Text } from 'pixi.js';
import { outerRings, type CountryCollection, type CountryFeature } from './geojson';
import { project } from './projection';
import { MAJOR_NATIONS } from '../game/nations';
import type { GameState } from '../game/state';
import type { Camera } from './camera';

const PAPER = { r: 0xef, g: 0xe6, b: 0xcf };
const BORDER_COLOR = 0x5d4f3b;
const LABEL_COLOR = 0x4a3f2e;
const TAP_TOLERANCE_PX = 8;

/** Mix a color toward the paper background, for colonies and dependencies. */
function fade(color: number, amount: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const mix = (c: number, p: number) => Math.round(c + (p - c) * amount);
  return (mix(r, PAPER.r) << 16) | (mix(g, PAPER.g) << 8) | mix(b, PAPER.b);
}

interface CountryShape {
  id: string;
  rings: number[][]; // projected, flattened [x0,y0,x1,y1,...] per ring
}

export class MapRenderer {
  readonly container = new Container();

  private shapes = new Map<string, CountryShape>();
  private highlight = new Graphics();
  private onSelect: (id: string | null) => void = () => {};

  constructor(
    private state: GameState,
    private camera: Camera,
  ) {}

  selectionChanged(handler: (id: string | null) => void): void {
    this.onSelect = handler;
  }

  async load(url: string): Promise<void> {
    const data: CountryCollection = await (await fetch(url)).json();

    const countries = new Container();
    const labels = new Container();
    this.container.addChild(countries, this.highlight, labels);

    for (const feature of data.features) {
      const id = feature.properties.NAME;
      if (!id) continue;

      const nation = this.state.registerCountry(id);
      const fill = this.fillColor(feature, nation.color);
      const rings = outerRings(feature).map((ring) => {
        const flat: number[] = [];
        for (const [lon, lat] of ring) flat.push(...project(lon, lat));
        return flat;
      });

      const shape: CountryShape = { id, rings };
      this.shapes.set(id, shape);

      const g = new Graphics();
      for (const flat of rings) {
        g.poly(flat)
          .fill(fill)
          .stroke({ width: 0.45, color: BORDER_COLOR, alpha: 0.8, join: 'round' });
      }
      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointertap', () => {
        if (this.camera.dragDistance < TAP_TOLERANCE_PX) this.select(id);
      });
      countries.addChild(g);

      if (nation.major) labels.addChild(this.makeLabel(nation.name, shape));
    }
  }

  select(id: string | null): void {
    this.highlight.clear();
    const shape = id ? this.shapes.get(id) : undefined;
    if (shape) {
      for (const flat of shape.rings) {
        this.highlight
          .poly(flat)
          .fill({ color: 0x8a2e2e, alpha: 0.07 })
          .stroke({ width: 1.1, color: 0x8a2e2e, alpha: 0.95, join: 'round' });
      }
    }
    this.onSelect(id);
  }

  /** World-space bounding-box center of a country's largest ring. */
  center(id: string): [number, number] | null {
    const shape = this.shapes.get(id);
    if (!shape) return null;
    const { bounds } = this.largestRing(shape);
    return [(bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2];
  }

  private fillColor(feature: CountryFeature, ownColor: number): number {
    const id = feature.properties.NAME!;
    const overlordName = feature.properties.SUBJECTO;
    if (overlordName && overlordName !== id) {
      const overlord = MAJOR_NATIONS[overlordName];
      if (overlord) return fade(overlord.color, 0.45);
    }
    return this.state.registerCountry(id).major ? ownColor : fade(ownColor, 0.25);
  }

  private makeLabel(name: string, shape: CountryShape): Text {
    const { bounds } = this.largestRing(shape);
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const size = Math.max(4, Math.min(22, Math.sqrt(width * height) * 0.12));

    const label = new Text({
      text: name.toUpperCase(),
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: size,
        letterSpacing: size * 0.25,
        fill: LABEL_COLOR,
      },
    });
    label.alpha = 0.8;
    label.anchor.set(0.5);
    label.position.set((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2);
    label.eventMode = 'none';
    return label;
  }

  private largestRing(shape: CountryShape): {
    bounds: { minX: number; minY: number; maxX: number; maxY: number };
  } {
    let best = { area: -1, bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };
    for (const flat of shape.rings) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
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
