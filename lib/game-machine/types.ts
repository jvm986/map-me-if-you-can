/**
 * Type definitions for the game state machine
 */

import type { Game, Guess, PhotoSubmission, Player } from '@/types/game';

/**
 * Events that can be sent to the game machine
 */
export type GameEvent =
  | { type: 'START_SUBMISSION' }
  | { type: 'START_PLAYING' }
  | { type: 'SUBMIT_GUESS'; guess: Guess }
  | { type: 'REVEAL_RESULTS' }
  | { type: 'NEXT_ROUND' }
  | { type: 'FINISH_GAME' }
  | { type: 'RESTART_GAME' }
  | { type: 'UPDATE_GAME'; game: Game }
  | { type: 'UPDATE_PLAYERS'; players: Player[] }
  | { type: 'UPDATE_SUBMISSIONS'; submissions: PhotoSubmission[] }
  | { type: 'UPDATE_GUESSES'; guesses: Guess[] };

/**
 * Context data stored in the state machine
 */
export interface GameContext {
  game: Game | null;
  players: Player[];
  submissions: PhotoSubmission[];
  currentGuesses: Guess[];
  error: string | null;
}

/**
 * Type-safe state values
 */
export type GameStateValue =
  | 'lobby'
  | 'submission'
  | { playing: 'guessing' | 'revealing' }
  | 'finished';

/**
 * Helper to check if we're in a specific state
 */
export function isInState(state: GameStateValue, checkState: string): boolean {
  if (typeof state === 'string') {
    return state === checkState;
  }
  if (typeof state === 'object' && 'playing' in state) {
    if (checkState === 'playing') return true;
    return state.playing === checkState;
  }
  return false;
}
