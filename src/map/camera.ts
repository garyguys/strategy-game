import type { Container } from 'pixi.js';

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 60;

/** Pan/zoom controller: drag + wheel on desktop, drag + pinch on touch. */
export class Camera {
  /** Screen-space distance moved since pointerdown; used to tell taps from drags. */
  dragDistance = 0;

  private pointers = new Map<number, { x: number; y: number }>();
  private pinchDistance = 0;

  constructor(
    private world: Container,
    private canvas: HTMLCanvasElement,
  ) {
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  /** Center the view on a world-space point at the given zoom. */
  lookAt(wx: number, wy: number, zoom: number): void {
    this.world.scale.set(zoom);
    this.world.position.set(
      window.innerWidth / 2 - wx * zoom,
      window.innerHeight / 2 - wy * zoom,
    );
  }

  private zoomAround(sx: number, sy: number, factor: number): void {
    const current = this.world.scale.x;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * factor));
    const applied = next / current;
    this.world.position.set(
      sx - (sx - this.world.x) * applied,
      sy - (sy - this.world.y) * applied,
    );
    this.world.scale.set(next);
  }

  private onDown = (e: PointerEvent): void => {
    this.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 1) this.dragDistance = 0;
    if (this.pointers.size === 2) this.pinchDistance = this.currentPinch();
  };

  private onMove = (e: PointerEvent): void => {
    const prev = this.pointers.get(e.pointerId);
    if (!prev) return;

    if (this.pointers.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      this.dragDistance += Math.hypot(dx, dy);
      this.world.position.set(this.world.x + dx, this.world.y + dy);
    }

    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size === 2) {
      const pinch = this.currentPinch();
      if (this.pinchDistance > 0) {
        const [a, b] = [...this.pointers.values()];
        this.zoomAround((a.x + b.x) / 2, (a.y + b.y) / 2, pinch / this.pinchDistance);
      }
      this.pinchDistance = pinch;
      this.dragDistance += 100; // a pinch is never a tap
    }
  };

  private onUp = (e: PointerEvent): void => {
    this.pointers.delete(e.pointerId);
    this.pinchDistance = 0;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.zoomAround(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015));
  };

  private currentPinch(): number {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
