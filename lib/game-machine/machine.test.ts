/**
 * Tests for game state machine
 * Focused on testing state transitions and core behavior
 */

import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';
import type { Game, PhotoSubmission } from '@/types/game';
import { gameMachine } from './machine';

// Minimal mock helpers
const mockGame = (index = 0): Game => ({
  id: 'game-1',
  code: 'ABC12',
  status: 'lobby',
  current_photo_index: index,
  host_player_id: 'player-1',
  created_at: new Date().toISOString(),
});

const mockSubmission = (id: string): PhotoSubmission => ({
  id,
  game_id: 'game-1',
  player_id: `player-${id}`,
  image_url: `https://example.com/${id}.jpg`,
  true_lat: 40.7,
  true_lng: -74.0,
  true_location_text: 'NYC',
  created_at: new Date().toISOString(),
});

describe('Game State Machine', () => {
  it('starts in lobby state', () => {
    const actor = createActor(gameMachine);
    actor.start();
    expect(actor.getSnapshot().value).toBe('lobby');
  });

  it('transitions: lobby → submission → playing → finished', () => {
    const actor = createActor(gameMachine);
    actor.start();

    expect(actor.getSnapshot().value).toBe('lobby');

    actor.send({ type: 'START_SUBMISSION' });
    expect(actor.getSnapshot().value).toBe('submission');

    actor.send({ type: 'START_PLAYING' });
    expect(actor.getSnapshot().value).toEqual({ playing: 'guessing' });

    actor.send({ type: 'FINISH_GAME' });
    expect(actor.getSnapshot().value).toBe('finished');
  });

  it('transitions within playing: guessing ⇄ revealing', () => {
    const actor = createActor(gameMachine);
    actor.start();

    actor.send({ type: 'START_SUBMISSION' });
    actor.send({ type: 'START_PLAYING' });
    expect(actor.getSnapshot().value).toEqual({ playing: 'guessing' });

    actor.send({ type: 'REVEAL_RESULTS' });
    expect(actor.getSnapshot().value).toEqual({ playing: 'revealing' });
  });

  it('goes to next round when more photos exist', () => {
    const actor = createActor(gameMachine);
    actor.start();

    const submissions = [mockSubmission('1'), mockSubmission('2')];

    actor.send({ type: 'START_SUBMISSION' });
    actor.send({ type: 'UPDATE_SUBMISSIONS', submissions });
    actor.send({ type: 'UPDATE_GAME', game: mockGame(0) });
    actor.send({ type: 'START_PLAYING' });
    actor.send({ type: 'REVEAL_RESULTS' });
    actor.send({ type: 'NEXT_ROUND' });

    expect(actor.getSnapshot().value).toEqual({ playing: 'guessing' });
  });

  it('finishes game after last photo', () => {
    const actor = createActor(gameMachine);
    actor.start();

    const submissions = [mockSubmission('1'), mockSubmission('2')];

    actor.send({ type: 'START_SUBMISSION' });
    actor.send({ type: 'UPDATE_SUBMISSIONS', submissions });
    actor.send({ type: 'UPDATE_GAME', game: mockGame(1) }); // Last photo
    actor.send({ type: 'START_PLAYING' });
    actor.send({ type: 'REVEAL_RESULTS' });
    actor.send({ type: 'NEXT_ROUND' });

    expect(actor.getSnapshot().value).toBe('finished');
  });

  it('can restart game from finished', () => {
    const actor = createActor(gameMachine);
    actor.start();

    actor.send({ type: 'START_SUBMISSION' });
    actor.send({ type: 'START_PLAYING' });
    actor.send({ type: 'FINISH_GAME' });
    expect(actor.getSnapshot().value).toBe('finished');

    actor.send({ type: 'RESTART_GAME' });
    expect(actor.getSnapshot().value).toBe('submission');
  });
});
