/**
 * Game State Machine
 *
 * Exports for the game state machine implementation
 */

export { gameMachine } from './machine';
export type { GameContext, GameEvent, GameStateValue } from './types';
export { isInState } from './types';
export { useGameMachine, useSyncGameData } from './useGameMachine';
