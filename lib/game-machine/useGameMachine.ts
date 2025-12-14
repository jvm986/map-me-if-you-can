/**
 * React hook for using the game state machine
 *
 * This hook provides a clean interface to the game machine,
 * handling subscriptions and providing typed state/context.
 */

import { useMachine } from '@xstate/react';
import { useEffect } from 'react';
import { gameMachine } from './machine';
import type { GameContext, GameEvent, GameStateValue } from './types';
import { isInState } from './types';

export interface UseGameMachineReturn {
  /**
   * Current state value (e.g., 'lobby', { playing: 'guessing' })
   */
  state: GameStateValue;

  /**
   * Full context containing game data
   */
  context: GameContext;

  /**
   * Send an event to the machine
   */
  send: (event: GameEvent) => void;

  /**
   * Check if the machine can handle an event
   */
  can: (event: GameEvent) => boolean;

  /**
   * Check if in a specific state
   */
  isState: (state: string) => boolean;

  /**
   * Helper getters for common checks
   */
  isLobby: boolean;
  isSubmission: boolean;
  isPlaying: boolean;
  isGuessing: boolean;
  isRevealing: boolean;
  isFinished: boolean;

  /**
   * Error state
   */
  error: string | null;
}

/**
 * Hook to use the game state machine
 *
 * @example
 * ```tsx
 * function GameComponent() {
 *   const machine = useGameMachine();
 *
 *   if (machine.isLobby) {
 *     return <LobbyView onStart={() => machine.send({ type: 'START_SUBMISSION' })} />;
 *   }
 *
 *   if (machine.isGuessing) {
 *     return <GuessingView onReveal={() => machine.send({ type: 'REVEAL_RESULTS' })} />;
 *   }
 *
 *   // ... other phases
 * }
 * ```
 */
export function useGameMachine(): UseGameMachineReturn {
  const [state, send] = useMachine(gameMachine);

  // Get state value (normalized to our type)
  const stateValue = state.value as GameStateValue;

  // Helper to check if in a specific state
  const isState = (checkState: string): boolean => {
    return isInState(stateValue, checkState);
  };

  // Common state checks
  const isLobby = isState('lobby');
  const isSubmission = isState('submission');
  const isPlaying = isState('playing');
  const isGuessing = isState('guessing');
  const isRevealing = isState('revealing');
  const isFinished = isState('finished');

  // Check if machine can handle an event
  const can = (event: GameEvent): boolean => {
    return state.can(event);
  };

  return {
    state: stateValue,
    context: state.context,
    send,
    can,
    isState,
    isLobby,
    isSubmission,
    isPlaying,
    isGuessing,
    isRevealing,
    isFinished,
    error: state.context.error,
  };
}

/**
 * Hook to sync realtime game data with the state machine
 *
 * This hook should be used alongside useGameMachine to keep
 * the machine's context in sync with the database.
 *
 * @example
 * ```tsx
 * function GameContainer({ game, players, submissions, guesses }) {
 *   const machine = useGameMachine();
 *
 *   // Sync data with machine
 *   useSyncGameData(machine, { game, players, submissions, guesses });
 *
 *   // Now machine.context has the latest data
 * }
 * ```
 */
export function useSyncGameData(
  machine: UseGameMachineReturn,
  data: {
    game?: typeof machine.context.game;
    players?: typeof machine.context.players;
    submissions?: typeof machine.context.submissions;
    guesses?: typeof machine.context.currentGuesses;
  }
) {
  const { send } = machine;

  // Sync game data
  useEffect(() => {
    if (data.game) {
      send({ type: 'UPDATE_GAME', game: data.game });
    }
  }, [data.game, send]);

  // Sync players
  useEffect(() => {
    if (data.players) {
      send({ type: 'UPDATE_PLAYERS', players: data.players });
    }
  }, [data.players, send]);

  // Sync submissions
  useEffect(() => {
    if (data.submissions) {
      send({ type: 'UPDATE_SUBMISSIONS', submissions: data.submissions });
    }
  }, [data.submissions, send]);

  // Sync guesses
  useEffect(() => {
    if (data.guesses) {
      send({ type: 'UPDATE_GUESSES', guesses: data.guesses });
    }
  }, [data.guesses, send]);
}
