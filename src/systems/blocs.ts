/** D4 — bloc creation, invitations, departures. */
import type { GameState, NationState } from '../engine/types';
import { uid, clamp } from '../engine/util';
import { chronicle } from '../engine/chronicle';
import { getRelation } from '../engine/state';
import { regard } from './diplomacy';

export function createBloc(state: GameState, leader: NationState, name: string, kind: 'alliance' | 'trade'): string | null {
  if (leader.blocId) return 'Already in a bloc.';
  if (leader.politicalCapital < 10) return 'Not enough political capital (10).';
  leader.politicalCapital -= 10;
  const bloc = { id: uid('bloc'), name, kind, leaderId: leader.id, members: [leader.id] };
  state.blocs.push(bloc);
  leader.blocId = bloc.id;
  chronicle(state, `${leader.name} founds ${name}`, { tags: ['diplomacy'], nationId: leader.id });
  return null;
}

/** Invite a nation; the AI weighs regard, fear of third parties, and ideology. */
export function inviteToBloc(state: GameState, inviter: NationState, targetId: string): string {
  const bloc = state.blocs.find((b) => b.id === inviter.blocId);
  if (!bloc) return 'You lead no bloc.';
  if (bloc.leaderId !== inviter.id) return 'Only the bloc leader extends invitations.';
  const target = state.nations[targetId];
  if (!target?.alive) return 'No government answers.';
  if (target.blocId) return `${target.name} already belongs to a bloc.`;

  const fearOfOthers = Math.max(
    0,
    ...Object.entries(target.relations)
      .filter(([id]) => !bloc.members.includes(id))
      .map(([, r]) => r.fear),
  );
  const score = regard(state, targetId, inviter.id) + fearOfOthers * 0.5 - 20;
  if (score > 0) {
    bloc.members.push(targetId);
    target.blocId = bloc.id;
    const rel = getRelation(state, targetId, inviter.id);
    rel.trust = clamp(rel.trust + 8, 0, 100);
    chronicle(state, `${target.name} joins ${bloc.name}`, { tags: ['diplomacy'] });
    return `${target.name} accepts a seat in ${bloc.name}.`;
  }
  return `${target.name} declines, politely.`;
}

export function leaveBloc(state: GameState, nation: NationState): void {
  const bloc = state.blocs.find((b) => b.id === nation.blocId);
  if (!bloc) return;
  bloc.members = bloc.members.filter((m) => m !== nation.id);
  nation.blocId = null;
  for (const m of bloc.members) {
    const rel = getRelation(state, m, nation.id);
    rel.trust = clamp(rel.trust - 15, 0, 100);
    rel.opinion = clamp(rel.opinion - 15, -100, 100);
  }
  if (bloc.leaderId === nation.id || bloc.members.length < 2) {
    for (const m of bloc.members) state.nations[m].blocId = null;
    state.blocs = state.blocs.filter((b) => b.id !== bloc.id);
    chronicle(state, `${bloc.name} dissolves`, { tags: ['diplomacy'] });
  } else {
    chronicle(state, `${nation.name} walks out of ${bloc.name}`, { tags: ['diplomacy'], nationId: nation.id });
  }
}
