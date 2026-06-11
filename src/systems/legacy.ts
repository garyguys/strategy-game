/** E3/N10 — legacy scoring, endings, the whole-cast epilogue. */
import type { GameState } from '../engine/types';
import { dateLabel } from '../engine/util';
import { controlledRegions } from './economy';

export function computeLegacy(state: GameState): Record<string, number> {
  const nation = state.nations[state.playerId];
  const regions = controlledRegions(state, nation);
  const development = regions.reduce(
    (s, r) => s + r.development.infra + r.development.industry + r.development.education,
    0,
  );
  const warsWon = state.chronicle.filter((c) => c.tags.includes('war') && c.nationId === nation.id).length;
  return {
    prestige: Math.round(nation.standing + warsWon * 2),
    prosperity: Math.round(Math.max(0, nation.treasury / 10) + development * 2),
    liberty: Math.round(50 - nation.ideology.auth / 2 + (nation.press === 'free' ? 15 : nation.press === 'pressured' ? 0 : -15)),
    territory: regions.length * 10,
    stability: Math.round(nation.stability),
  };
}

function characterEpilogue(state: GameState, charId: string): string | null {
  const c = state.characters[charId];
  if (!c) return null;
  const last = c.log[c.log.length - 1];
  if (!c.alive) {
    return `${c.name} — ${last?.text ?? 'Did not live to see the end of the decade.'}`;
  }
  if (c.role === 'leader') return `${c.name} — ${c.title}; history will argue about the rest.`;
  if (c.loyalty > 75) return `${c.name} — stayed loyal to the end. ${last ? `Last noted: ${last.text}` : ''}`;
  if (c.loyalty < 30) return `${c.name} — parted ways with the government, and said so in print. ${last ? `Last noted: ${last.text}` : ''}`;
  return `${c.name} — served, survived, and kept their own counsel. ${last ? `Last noted: ${last.text}` : ''}`;
}

/** Build the end-of-campaign epilogue (reads the Chronicle back, E1/E3). */
export function buildEpilogue(state: GameState, reason: string): string[] {
  const nation = state.nations[state.playerId];
  const legacy = computeLegacy(state);
  const lines: string[] = [];

  lines.push(`${dateLabel(state.turn)} — ${reason}`);

  const ending = (nation.flags['csk_ending'] ?? nation.flags['swe_ending'] ?? nation.flags['tur_ending']) as string | undefined;
  if (ending) lines.push(`The histories will file these years under: "${ending}".`);

  const total = Object.values(legacy).reduce((s, v) => s + v, 0);
  lines.push(
    `Legacy — Prestige ${legacy.prestige}, Prosperity ${legacy.prosperity}, Liberty ${legacy.liberty}, Territory ${legacy.territory}, Stability ${legacy.stability}. In sum: ${total}.`,
  );

  // the record itself (E1)
  const decisions = state.chronicle.filter((c) => c.tags.includes('decision')).length;
  const treaties = state.chronicle.filter((c) => c.tags.includes('treaty')).length;
  lines.push(`The Chronicle records ${decisions} decisions of state and ${treaties} treaty matters under your government.`);

  for (const former of state.formerLeaders) {
    const line = characterEpilogue(state, former);
    if (line) lines.push(line);
  }
  const cast = Object.values(state.characters)
    .filter((c) => c.nationId === nation.id && c.log.length > 0)
    .slice(0, 14);
  lines.push('— The Cast —');
  for (const c of cast) {
    const line = characterEpilogue(state, c.id);
    if (line) lines.push(line);
  }
  return lines;
}

/** Campaign end conditions: dated end, national death, or conceded election. */
export function checkGameOver(state: GameState): void {
  if (state.gameOver) return;
  const nation = state.nations[state.playerId];
  if (!nation.alive) {
    state.gameOver = {
      reason: `${nation.name} has been extinguished as an independent state.`,
      epilogue: buildEpilogue(state, `${nation.name} is partitioned among its conquerors.`),
      legacy: computeLegacy(state),
    };
    return;
  }
  if (state.flags['endCampaign'] === 'electionLoss') {
    state.gameOver = {
      reason: 'You handed over the seals of office after electoral defeat.',
      epilogue: buildEpilogue(state, 'The government changes hands at the ballot box.'),
      legacy: computeLegacy(state),
    };
    return;
  }
  if (state.turn >= 168) {
    // December 1949
    state.gameOver = {
      reason: 'The campaign reaches the end of the decade.',
      epilogue: buildEpilogue(state, 'The nineteen-forties close; the reckoning begins.'),
      legacy: computeLegacy(state),
    };
  }
}
