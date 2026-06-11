/** The monthly turn pipeline. */
import type { GameState } from './types';
import { Rng } from './rng';
import { runEconomy } from '../systems/economy';
import { runDiplomacy } from '../systems/diplomacy';
import { runWars, runFabrication } from '../systems/war';
import { runEspionage } from '../systems/espionage';
import { runInternal } from '../systems/internal';
import { runCrises } from '../systems/crisis';
import { runAi } from '../systems/ai';
import { expireTreaties } from '../systems/treaty';
import { evaluateEvents } from '../systems/events';
import { checkGameOver } from '../systems/legacy';

export function endTurn(state: GameState): void {
  if (state.gameOver) return;
  state.digest = [];
  state.turn += 1;
  const rng = new Rng(state.rngState ^ (state.turn * 2654435761));

  runFabrication(state);
  runEconomy(state, rng);
  runWars(state, rng);
  runDiplomacy(state);
  runEspionage(state, rng);
  runInternal(state, rng);
  runCrises(state, rng);
  runAi(state, rng);
  expireTreaties(state);
  evaluateEvents(state);
  checkGameOver(state);

  state.rngState = rng.state;
}
