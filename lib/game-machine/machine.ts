/**
 * Game State Machine
 *
 * Manages the game flow and transitions between phases:
 * lobby → submission → playing (guessing ⇄ revealing) → finished
 */

import { assign, setup } from 'xstate';
import type { GameContext, GameEvent } from './types';

/**
 * Initial context for the game machine
 */
const initialContext: GameContext = {
  game: null,
  players: [],
  submissions: [],
  currentGuesses: [],
  error: null,
};

/**
 * Game state machine
 */
export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  actions: {
    /**
     * Update game data in context
     */
    updateGame: assign({
      game: ({ event }) => {
        if (event.type === 'UPDATE_GAME') {
          return event.game;
        }
        return null;
      },
    }),

    /**
     * Update players list in context
     */
    updatePlayers: assign({
      players: ({ event }) => {
        if (event.type === 'UPDATE_PLAYERS') {
          return event.players;
        }
        return [];
      },
    }),

    /**
     * Update photo submissions in context
     */
    updateSubmissions: assign({
      submissions: ({ event }) => {
        if (event.type === 'UPDATE_SUBMISSIONS') {
          return event.submissions;
        }
        return [];
      },
    }),

    /**
     * Update current round guesses in context
     */
    updateGuesses: assign({
      currentGuesses: ({ event }) => {
        if (event.type === 'UPDATE_GUESSES') {
          return event.guesses;
        }
        return [];
      },
    }),

    /**
     * Clear guesses when moving to new round
     */
    clearGuesses: assign({
      currentGuesses: [],
    }),

    /**
     * Set error message
     */
    setError: assign({
      error: ({ event }) => {
        if ('error' in event) {
          return event.error as string;
        }
        return 'An error occurred';
      },
    }),

    /**
     * Clear error message
     */
    clearError: assign({
      error: null,
    }),

    /**
     * Reset context for new game
     */
    resetContext: assign({
      game: null,
      players: [],
      submissions: [],
      currentGuesses: [],
      error: null,
    }),
  },
  guards: {
    /**
     * Check if all players have submitted photos
     */
    allPlayersSubmitted: ({ context }) => {
      const { players, submissions } = context;
      if (players.length === 0) return false;
      return submissions.length >= players.length;
    },

    /**
     * Check if all eligible players have guessed
     */
    allPlayersGuessed: ({ context }) => {
      const { players, currentGuesses, game, submissions } = context;
      if (!game || submissions.length === 0) return false;

      const currentPhoto = submissions[game.current_photo_index];
      if (!currentPhoto) return false;

      // Players can't guess their own photo
      const eligiblePlayers = players.filter((p) => p.id !== currentPhoto.player_id);
      if (eligiblePlayers.length === 0) return false;

      return eligiblePlayers.every((player) =>
        currentGuesses.some((guess) => guess.player_id === player.id)
      );
    },

    /**
     * Check if there are more photos to show
     */
    hasMorePhotos: ({ context }) => {
      const { game, submissions } = context;
      if (!game) return false;
      return game.current_photo_index + 1 < submissions.length;
    },

    /**
     * Check if all photos have been shown
     */
    allPhotosShown: ({ context }) => {
      const { game, submissions } = context;
      if (!game) return false;
      return game.current_photo_index + 1 >= submissions.length;
    },
  },
}).createMachine({
  id: 'game',
  initial: 'lobby',
  context: initialContext,

  states: {
    /**
     * LOBBY - Players joining, waiting to start
     */
    lobby: {
      on: {
        START_SUBMISSION: {
          target: 'submission',
          actions: ['clearError'],
        },
        UPDATE_GAME: {
          actions: ['updateGame'],
        },
        UPDATE_PLAYERS: {
          actions: ['updatePlayers'],
        },
      },
    },

    /**
     * SUBMISSION - Players uploading photos
     */
    submission: {
      on: {
        START_PLAYING: {
          target: 'playing',
          actions: ['clearError'],
        },
        UPDATE_GAME: {
          actions: ['updateGame'],
        },
        UPDATE_PLAYERS: {
          actions: ['updatePlayers'],
        },
        UPDATE_SUBMISSIONS: {
          actions: ['updateSubmissions'],
        },
      },
    },

    /**
     * PLAYING - Main game loop (guessing and revealing)
     */
    playing: {
      initial: 'guessing',

      states: {
        /**
         * GUESSING - Players guess location
         */
        guessing: {
          entry: ['clearGuesses'],
          on: {
            SUBMIT_GUESS: {
              actions: ['updateGuesses'],
            },
            REVEAL_RESULTS: {
              target: 'revealing',
              actions: ['clearError'],
            },
            UPDATE_GUESSES: {
              actions: ['updateGuesses'],
            },
          },
        },

        /**
         * REVEALING - Show results
         */
        revealing: {
          on: {
            NEXT_ROUND: [
              {
                target: '#game.finished',
                guard: 'allPhotosShown',
                actions: ['clearError'],
              },
              {
                target: 'guessing',
                guard: 'hasMorePhotos',
                actions: ['clearError'],
              },
            ],
          },
        },
      },

      on: {
        UPDATE_GAME: {
          actions: ['updateGame'],
        },
        UPDATE_PLAYERS: {
          actions: ['updatePlayers'],
        },
        UPDATE_SUBMISSIONS: {
          actions: ['updateSubmissions'],
        },
        FINISH_GAME: {
          target: 'finished',
          actions: ['clearError'],
        },
      },
    },

    /**
     * FINISHED - Game over, show final results
     */
    finished: {
      on: {
        RESTART_GAME: {
          target: 'submission',
          actions: ['clearError', 'resetContext'],
        },
      },
    },
  },
});
