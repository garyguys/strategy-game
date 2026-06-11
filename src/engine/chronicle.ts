import type { ChronicleEntry, GameState } from './types';
import { uid } from './util';

/** E1 — append a Chronicle entry; returns its id for cause->effect linking. */
export function chronicle(
  state: GameState,
  headline: string,
  opts: { body?: string; tags?: string[]; nationId?: string; causeId?: string; quiet?: boolean } = {},
): string {
  const entry: ChronicleEntry = {
    id: uid('chr'),
    turn: state.turn,
    headline,
    body: opts.body,
    tags: opts.tags ?? [],
    nationId: opts.nationId,
    causeId: opts.causeId,
  };
  state.chronicle.push(entry);
  if (!opts.quiet) state.digest.push(headline);
  return entry.id;
}

/** Entries caused (directly) by the given entry. */
export function effectsOf(state: GameState, id: string): ChronicleEntry[] {
  return state.chronicle.filter((e) => e.causeId === id);
}
