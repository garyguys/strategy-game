/** E5/E6 — autosave, manual save, export/import; versioned format. */
import type { GameState } from './types';
import { BAL } from './balance';
import { reseedUid } from './util';

const KEY = 'accord1936_save';

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

export function deserialize(json: string): GameState | null {
  try {
    const state = JSON.parse(json) as GameState;
    if (typeof state.version !== 'number' || state.version > BAL.version) return null;
    if (!state.nations || !state.playerId) return null;
    reseedUid(state.chronicle.length + state.treaties.length + 1000);
    return state;
  } catch {
    return null;
  }
}

export function autosave(state: GameState): void {
  try {
    localStorage.setItem(KEY, serialize(state));
  } catch {
    // storage full or unavailable; the game must keep running
  }
}

export function loadAutosave(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? deserialize(raw) : null;
  } catch {
    return null;
  }
}

export function clearAutosave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** E5 — download the campaign as a file. */
export function exportSave(state: GameState): void {
  const blob = new Blob([serialize(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `accord1936_${state.playerId.replace(/\W+/g, '')}_turn${state.turn}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importSave(file: File): Promise<GameState | null> {
  return file.text().then(deserialize);
}
