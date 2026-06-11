/**
 * Effect factory helpers — the vocabulary data files (arcs, events) use.
 * Keeping all state mutation behind these makes content safe to write
 * and keeps GameState JSON-serializable (E8).
 */
import type { Effect, EffectCtx, Ideology, NationId, Relation } from './types';
import { clamp } from './util';
import { chronicle } from './chronicle';
import type { Good } from '../data/goods';

export const fx = {
  ideology(axis: keyof Ideology, delta: number): Effect {
    return ({ nation }) => {
      nation.ideology[axis] = clamp(nation.ideology[axis] + delta, -100, 100);
    };
  },

  stability(delta: number): Effect {
    return ({ nation }) => {
      nation.stability = clamp(nation.stability + delta, 0, 100);
    };
  },

  capital(delta: number): Effect {
    return ({ nation }) => {
      nation.politicalCapital = Math.max(0, nation.politicalCapital + delta);
    };
  },

  treasury(delta: number): Effect {
    return ({ nation }) => {
      nation.treasury += delta;
    };
  },

  standing(delta: number): Effect {
    return ({ nation }) => {
      nation.standing = clamp(nation.standing + delta, 0, 100);
    };
  },

  warSupport(delta: number): Effect {
    return ({ nation }) => {
      nation.warSupport = clamp(nation.warSupport + delta, 0, 100);
    };
  },

  stockpile(good: Good, delta: number): Effect {
    return ({ nation }) => {
      nation.stockpiles[good] = Math.max(0, (nation.stockpiles[good] ?? 0) + delta);
    };
  },

  /** Adjust how `target` feels about the affected nation. */
  relation(target: NationId, delta: Partial<Relation>): Effect {
    return ({ state, nation }) => {
      const rel = state.nations[target]?.relations[nation.id];
      if (!rel) return;
      if (delta.trust) rel.trust = clamp(rel.trust + delta.trust, 0, 100);
      if (delta.opinion) rel.opinion = clamp(rel.opinion + delta.opinion, -100, 100);
      if (delta.fear) rel.fear = clamp(rel.fear + delta.fear, 0, 100);
    };
  },

  /** D2 — plant a memory in `who` about the affected nation. */
  memory(who: NationId, text: string, weight: number): Effect {
    return ({ state, nation }) => {
      state.nations[who]?.memory.push({ turn: state.turn, vs: nation.id, text, weight });
    };
  },

  flag(key: string, value: number | boolean | string): Effect {
    return ({ nation }) => {
      nation.flags[key] = value;
    };
  },

  worldFlag(key: string, value: number | boolean | string): Effect {
    return ({ state }) => {
      state.flags[key] = value;
    };
  },

  addFlag(key: string, delta: number): Effect {
    return ({ nation }) => {
      nation.flags[key] = ((nation.flags[key] as number) ?? 0) + delta;
    };
  },

  tension(delta: number): Effect {
    return ({ state }) => {
      state.worldTension = clamp(state.worldTension + delta, 0, 100);
    };
  },

  league(delta: number): Effect {
    return ({ state }) => {
      state.leagueAuthority = clamp(state.leagueAuthority + delta, 0, 100);
    };
  },

  unrest(delta: number, regionId?: string): Effect {
    return ({ state, nation }) => {
      const ids = regionId ? [regionId] : nation.regionIds;
      for (const id of ids) {
        const r = state.regions[id];
        if (r) r.unrest = clamp(r.unrest + delta, 0, 100);
      }
    };
  },

  charLoyalty(charId: string, delta: number): Effect {
    return ({ state }) => {
      const c = state.characters[charId];
      if (c) c.loyalty = clamp(c.loyalty + delta, 0, 100);
    };
  },

  /** E2 — append to a character's dossier history. */
  charLog(charId: string, text: string): Effect {
    return ({ state }) => {
      state.characters[charId]?.log.push({ turn: state.turn, text });
    };
  },

  charDies(charId: string): Effect {
    return ({ state }) => {
      const c = state.characters[charId];
      if (c) {
        c.alive = false;
        c.post = null;
        c.log.push({ turn: state.turn, text: 'Died.' });
      }
    };
  },

  /** N6 — queue a follow-up scene `delay` months out. */
  queueScene(sceneId: string, delay: number, nationId?: NationId): Effect {
    return ({ state, nation, causeId }) => {
      state.sceneQueue.push({
        sceneId,
        nationId: nationId ?? nation.id,
        turn: state.turn + delay,
        causeId,
      });
    };
  },

  chronicle(headline: string, tags: string[] = []): Effect {
    return ({ state, nation, causeId }) => {
      chronicle(state, headline, { tags, nationId: nation.id, causeId });
    };
  },

  casusBelli(vs: NationId, type: string, months: number): Effect {
    return ({ state, nation }) => {
      nation.casusBelli.push({ vs, type, expires: state.turn + months });
    };
  },

  /** Escape hatch for bespoke arc logic. */
  custom(run: (ctx: EffectCtx) => void): Effect {
    return run;
  },
};

export function applyEffects(effects: Effect[], ctx: EffectCtx): void {
  for (const e of effects) e(ctx);
}
