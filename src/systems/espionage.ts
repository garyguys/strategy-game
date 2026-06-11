/** D7/D8/T6 — spy networks, operations, exposure, meddling, coups. */
import type { GameState, NationState, SpyOpKind } from '../engine/types';
import { BAL } from '../engine/balance';
import { clamp, uid } from '../engine/util';
import { chronicle } from '../engine/chronicle';
import { getRelation } from '../engine/state';
import { nationMods } from './mods';
import type { Rng } from '../engine/rng';

export const OP_LABEL: Record<SpyOpKind, string> = {
  intel: 'Intelligence Gathering',
  influence: 'Influence Operation',
  sabotage: 'Industrial Sabotage',
  counterintel: 'Counter-Intelligence',
  rig: 'Election Interference',
  coup: 'Back a Coup',
};

export function setOperation(nation: NationState, targetId: string, op: SpyOpKind | null): void {
  nation.intel[targetId] ??= { network: 0, op: null };
  nation.intel[targetId].op = op;
}

function counterintelOf(state: GameState, target: NationState): number {
  let v = 10;
  for (const [, net] of Object.entries(target.intel)) {
    if (net.op === 'counterintel') v += net.network * 0.3;
  }
  const interior = target.ministers.interior ? state.characters[target.ministers.interior] : null;
  if (interior) v += interior.competence * 0.2;
  return v;
}

export function runEspionage(state: GameState, rng: Rng): void {
  for (const nation of Object.values(state.nations)) {
    if (!nation.alive) continue;
    const mods = nationMods(nation);

    for (const [targetId, net] of Object.entries(nation.intel)) {
      const target = state.nations[targetId];
      if (!target?.alive) continue;

      net.network = clamp(net.network + BAL.networkGrowth * 0.5 + mods.intelBonus, 0, 100);
      if (!net.op || net.op === 'counterintel') continue;
      if (net.network < 25) continue;

      const ci = counterintelOf(state, target);
      const caught = rng.chance(BAL.opBaseRisk * (ci / 60) * (net.op === 'coup' || net.op === 'rig' ? 1.6 : 1));
      if (caught) {
        net.network = Math.max(0, net.network - 45);
        const rel = getRelation(state, targetId, nation.id);
        rel.trust = clamp(rel.trust - 12, 0, 100);
        rel.opinion = clamp(rel.opinion - 20, -100, 100);
        target.memory.push({ turn: state.turn, vs: nation.id, text: 'Their spies were caught in our capital.', weight: -2 });
        state.crises.push({
          id: uid('cr'),
          kind: 'spyIncident',
          title: `Spy scandal: ${nation.name} agents seized in ${target.name}`,
          a: targetId,
          b: nation.id,
          stage: 1,
          turnsAtStage: 0,
        });
        state.worldTension = clamp(state.worldTension + 2, 0, 100);
        chronicle(state, `${target.name} unmasks a ${nation.name} spy ring`, { tags: ['espionage'] });
        if (net.op === 'coup' || net.op === 'rig') {
          nation.standing = clamp(nation.standing - 14, 0, 100);
          net.op = null;
        }
        continue;
      }

      if (!rng.chance(net.network / 140)) continue; // op ticks over without result

      switch (net.op) {
        case 'intel': {
          nation.flags[`intel_${targetId}`] = state.turn;
          // T6 — expose secret clauses
          const secretTreaty = state.treaties.find(
            (t) => !t.exposedSecrets && t.parties.includes(targetId) && t.clauses.some((c) => c.secret),
          );
          if (secretTreaty) {
            secretTreaty.exposedSecrets = true;
            for (const p of secretTreaty.parties) {
              state.nations[p].standing = clamp(state.nations[p].standing - 8, 0, 100);
            }
            state.worldTension = clamp(state.worldTension + 3, 0, 100);
            chronicle(state, `Secret annexes of a ${secretTreaty.parties.map((p) => state.nations[p].name).join('–')} accord exposed`, {
              tags: ['espionage', 'treaty'],
            });
          }
          break;
        }
        case 'influence': {
          const rel = getRelation(state, targetId, nation.id);
          rel.opinion = clamp(rel.opinion + 4, -100, 100);
          if (target.factions.length) {
            // nudge the friendliest faction
            const friend = [...target.factions].sort(
              (x, y) =>
                Math.abs(x.ideology.auth - nation.ideology.auth) - Math.abs(y.ideology.auth - nation.ideology.auth),
            )[0];
            friend.seats = Math.min(70, friend.seats + 1);
            const other = target.factions.find((f) => f !== friend && f.seats > 5);
            if (other) other.seats -= 1;
          }
          break;
        }
        case 'sabotage': {
          target.stockpiles.arms = Math.max(0, target.stockpiles.arms - 6);
          target.stockpiles.steel = Math.max(0, target.stockpiles.steel - 6);
          const region = state.regions[target.regionIds[0]];
          if (region) region.unrest = clamp(region.unrest + 4, 0, 100);
          break;
        }
        case 'rig': {
          target.flags[`rigged_by`] = nation.id; // consumed at election (I10)
          break;
        }
        case 'coup': {
          if (target.stability < 35 && rng.chance(0.35)) {
            // success: government lurches toward the sponsor's ideology
            target.ideology.auth = clamp(target.ideology.auth + Math.sign(nation.ideology.auth - target.ideology.auth) * 40, -100, 100);
            target.ideology.planned = clamp(target.ideology.planned + Math.sign(nation.ideology.planned - target.ideology.planned) * 30, -100, 100);
            target.stability = 30;
            target.government = 'Military Government';
            nation.overlordOf.push(targetId);
            const rel = getRelation(state, targetId, nation.id);
            rel.opinion = clamp(rel.opinion + 50, -100, 100);
            rel.trust = clamp(rel.trust + 20, 0, 100);
            const leader = state.characters[target.leaderId];
            if (leader) {
              leader.log.push({ turn: state.turn, text: 'Deposed in a coup backed by a foreign power.' });
              leader.alive = false;
            }
            chronicle(state, `Officers seize power in ${target.name}; foreign hands suspected`, { tags: ['espionage', 'politics'] });
            state.worldTension = clamp(state.worldTension + 5, 0, 100);
            net.op = null;
          }
          break;
        }
      }
    }
  }
}
