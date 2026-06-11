export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

let counter = 0;

/** Monotonic unique id; counter is re-seeded on load from state size. */
export function uid(prefix: string): string {
  return `${prefix}_${++counter}_${Date.now().toString(36)}`;
}

export function reseedUid(n: number): void {
  counter = Math.max(counter, n);
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function dateLabel(turn: number): string {
  return `${MONTHS[turn % 12]} ${1936 + Math.floor(turn / 12)}`;
}

export function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
