/** N2/N5/N6/N8 — the event & scene engine. */
import type { EffectCtx, GameState, QueuedScene, SceneDef } from '../engine/types';
import { chronicle } from '../engine/chronicle';
import { applyEffects } from '../engine/effects';

import * as sys from '../data/events/system_scenes';
import * as csk from '../data/events/arc_czechoslovakia';
import * as swe from '../data/events/arc_sweden';
import * as tur from '../data/events/arc_turkey';
import * as world from '../data/events/world';
import * as systemic from '../data/events/systemic';
import * as personal from '../data/events/personal';

const MODULES = [sys, csk, swe, tur, world, systemic, personal];

export const ALL_SCENES = new Map<string, SceneDef>();
export const ALL_EVENTS = MODULES.flatMap((m) => m.EVENTS);
for (const m of MODULES) for (const s of m.SCENES) ALL_SCENES.set(s.id, s);

/** Evaluate event conditions for the player and queue any that fire. */
export function evaluateEvents(state: GameState): void {
  const player = state.nations[state.playerId];
  if (!player?.alive) return;

  for (const ev of ALL_EVENTS) {
    if (ev.nationId !== 'any' && ev.nationId !== state.playerId) continue;
    const fired = state.fired[ev.id];
    if (ev.once && fired !== undefined) continue;
    if (ev.cooldown && fired !== undefined && state.turn - fired < ev.cooldown) continue;
    if (state.sceneQueue.some((q) => q.sceneId === ev.sceneId)) continue;
    let ok = false;
    try {
      ok = ev.condition(state, player);
    } catch {
      ok = false;
    }
    if (!ok) continue;
    state.fired[ev.id] = state.turn;
    state.sceneQueue.push({ sceneId: ev.sceneId, nationId: state.playerId, turn: state.turn });
  }
}

/** Scenes due to be shown right now, in queue order. */
export function dueScenes(state: GameState): QueuedScene[] {
  return state.sceneQueue.filter((q) => q.turn <= state.turn && q.nationId === state.playerId);
}

/** Player picked an option: apply it, log it to the Chronicle, dequeue (E1). */
export function resolveScene(state: GameState, queued: QueuedScene, optionId: string): void {
  const scene = ALL_SCENES.get(queued.sceneId);
  state.sceneQueue = state.sceneQueue.filter((q) => q !== queued);
  if (!scene) return;
  const option = scene.options.find((o) => o.id === optionId) ?? scene.options[0];
  const nation = state.nations[queued.nationId];
  const causeId = chronicle(state, `${scene.title}: "${option.text}"`, {
    tags: ['decision'],
    nationId: nation.id,
    causeId: queued.causeId,
    quiet: true,
  });
  const ctx: EffectCtx = { state, nation, causeId };
  applyEffects(option.effects, ctx);
}
