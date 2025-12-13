'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Game, Guess, PhotoSubmission, Player } from '@/types/game';
import { calculateDistance, calculateTotalScore } from './scoring';

/**
 * Generate a simple 5-character alphanumeric game code like "A7K2M"
 * Uses uppercase letters and numbers for easy sharing over video calls
 */
function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new game and return the game code
 */
export async function createGame(): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const code = generateGameCode();

    const { error } = await supabase
      .from('games')
      .insert({
        code,
        status: 'lobby',
        current_photo_index: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, code };
  } catch (error) {
    console.error('Error creating game:', error);
    return { success: false, error: 'Failed to create game' };
  }
}

/**
 * Join a game by code and create a player
 */
export async function joinGame(
  gameCode: string,
  displayName: string
): Promise<{ success: boolean; gameId?: string; playerId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Find the game by code
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', gameCode)
      .single();

    if (gameError || !game) {
      return { success: false, error: 'Game not found' };
    }

    // Check if this is the first player (they become host)
    const { data: existingPlayers } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', game.id);

    const isHost = !existingPlayers || existingPlayers.length === 0;

    // Create the player (avatar_emoji is now always null)
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        display_name: displayName,
        avatar_emoji: null,
        is_host: isHost,
      })
      .select()
      .single();

    if (playerError) throw playerError;

    // If this is the host, update the game
    if (isHost) {
      await supabase.from('games').update({ host_player_id: player.id }).eq('id', game.id);
    }

    revalidatePath(`/game/${gameCode}`);

    return {
      success: true,
      gameId: game.id,
      playerId: player.id,
    };
  } catch (error) {
    console.error('Error joining game:', error);
    return { success: false, error: 'Failed to join game' };
  }
}

/**
 * Get game data with players
 */
export async function getGame(gameCode: string): Promise<{
  game: Game | null;
  players: Player[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('code', gameCode)
      .single();

    if (gameError || !game) {
      return { game: null, players: [], error: 'Game not found' };
    }

    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', game.id)
      .order('created_at', { ascending: true });

    if (playersError) throw playersError;

    return { game, players: players || [] };
  } catch (error) {
    console.error('Error fetching game:', error);
    return { game: null, players: [], error: 'Failed to fetch game' };
  }
}

/**
 * Start the submission phase (host only)
 */
export async function startSubmissionPhase(
  gameCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('games')
      .update({ status: 'submission' })
      .eq('code', gameCode);

    if (error) throw error;

    revalidatePath(`/game/${gameCode}`);
    return { success: true };
  } catch (error) {
    console.error('Error starting submission phase:', error);
    return { success: false, error: 'Failed to start submission phase' };
  }
}

/**
 * Upload a photo to Supabase storage
 */
export async function uploadPhoto(
  file: File,
  gameCode: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${gameCode}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage.from('game-photos').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('game-photos').getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { success: false, error: 'Failed to upload photo' };
  }
}

/**
 * Submit a photo with location data
 */
export async function submitPhoto(
  gameId: string,
  playerId: string,
  imageUrl: string,
  lat: number,
  lng: number,
  locationText?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('photo_submissions').insert({
      game_id: gameId,
      player_id: playerId,
      image_url: imageUrl,
      true_lat: lat,
      true_lng: lng,
      true_location_text: locationText || null,
    });

    if (error) throw error;

    revalidatePath(`/game/*`);
    return { success: true };
  } catch (error) {
    console.error('Error submitting photo:', error);
    return { success: false, error: 'Failed to submit photo' };
  }
}

/**
 * Get photo submissions for a game
 */
export async function getPhotoSubmissions(gameId: string): Promise<PhotoSubmission[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('photo_submissions')
      .select('*, player:players(*)')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching photo submissions:', error);
    return [];
  }
}

/**
 * Start playing with current submissions (host only)
 */
export async function startPlaying(
  gameCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('games')
      .update({
        status: 'playing',
        current_photo_index: 0,
      })
      .eq('code', gameCode);

    if (error) throw error;

    revalidatePath(`/game/${gameCode}`);
    return { success: true };
  } catch (error) {
    console.error('Error starting game:', error);
    return { success: false, error: 'Failed to start game' };
  }
}

/**
 * Submit a guess for the current photo
 */
export async function submitGuess(
  photoSubmissionId: string,
  playerId: string,
  guessedLat: number,
  guessedLng: number,
  guessedOwnerId: string,
  actualLat: number,
  actualLng: number,
  actualOwnerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Calculate distance and scores
    const distanceKm = calculateDistance(
      { lat: guessedLat, lng: guessedLng },
      { lat: actualLat, lng: actualLng }
    );

    const { locationScore, ownerBonus, totalScore } = calculateTotalScore(
      distanceKm,
      guessedOwnerId,
      actualOwnerId
    );

    // Insert guess
    const { error: guessError } = await supabase.from('guesses').insert({
      photo_submission_id: photoSubmissionId,
      player_id: playerId,
      guessed_lat: guessedLat,
      guessed_lng: guessedLng,
      guessed_owner_id: guessedOwnerId,
      distance_km: distanceKm,
      location_score: locationScore,
      owner_bonus: ownerBonus,
      total_score: totalScore,
    });

    if (guessError) throw guessError;

    revalidatePath(`/game/*`);
    return { success: true };
  } catch (error) {
    console.error('Error submitting guess:', error);
    return { success: false, error: 'Failed to submit guess' };
  }
}

/**
 * Get guesses for a photo submission
 */
export async function getGuesses(photoSubmissionId: string): Promise<Guess[]> {
  try {
    const supabase = await createClient();

    // Use explicit relationship name to avoid ambiguity between player_id and guessed_owner_id
    const { data, error } = await supabase
      .from('guesses')
      .select('*, player:players!guesses_player_id_fkey(*)')
      .eq('photo_submission_id', photoSubmissionId)
      .order('total_score', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching guesses:', error);
    return [];
  }
}

/**
 * Calculate a player's total score from all their applied guesses
 * This is the source of truth for leaderboards
 */
export async function calculatePlayerScore(playerId: string): Promise<number> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('guesses')
      .select('total_score')
      .eq('player_id', playerId)
      .eq('score_applied', true);

    if (error) throw error;

    return data?.reduce((sum, guess) => sum + guess.total_score, 0) || 0;
  } catch (error) {
    console.error('Error calculating player score:', error);
    return 0;
  }
}

/**
 * Calculate all players' scores for a game
 * Returns a map of player_id to total_score
 */
export async function calculateGameScores(gameId: string): Promise<Map<string, number>> {
  try {
    const supabase = await createClient();

    // Get all players in the game
    const { data: players } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', gameId);

    if (!players) return new Map();

    // Get all applied guesses for these players in one query
    const playerIds = players.map((p) => p.id);
    const { data: guesses } = await supabase
      .from('guesses')
      .select('player_id, total_score')
      .in('player_id', playerIds)
      .eq('score_applied', true);

    // Sum up scores by player
    const scores = new Map<string, number>();
    for (const player of players) {
      scores.set(player.id, 0);
    }
    for (const guess of guesses || []) {
      const current = scores.get(guess.player_id) || 0;
      scores.set(guess.player_id, current + guess.total_score);
    }

    return scores;
  } catch (error) {
    console.error('Error calculating game scores:', error);
    return new Map();
  }
}

/**
 * Reveal results for the current round
 * Simply marks guesses as score_applied so they appear in the leaderboard
 * This is idempotent and safe to call multiple times
 */
export async function revealResults(
  gameCode: string,
  currentPhotoId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Mark all guesses for this photo as score_applied
    // This operation is idempotent - running it multiple times is safe
    const { error: updateError } = await supabase
      .from('guesses')
      .update({ score_applied: true })
      .eq('photo_submission_id', currentPhotoId)
      .eq('score_applied', false);

    if (updateError) throw updateError;

    revalidatePath(`/game/${gameCode}`);
    return { success: true };
  } catch (error) {
    console.error('Error revealing results:', error);
    return { success: false, error: 'Failed to reveal results' };
  }
}

/**
 * Move to the next photo (host only)
 */
export async function nextPhoto(gameCode: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current game state
    const { data: game } = await supabase
      .from('games')
      .select('id, current_photo_index')
      .eq('code', gameCode)
      .single();

    if (!game) throw new Error('Game not found');

    // Get total submissions
    const { data: submissions } = await supabase
      .from('photo_submissions')
      .select('id')
      .eq('game_id', game.id);

    const nextIndex = game.current_photo_index + 1;

    // Check if we've finished all photos
    if (nextIndex >= (submissions?.length || 0)) {
      await supabase.from('games').update({ status: 'finished' }).eq('code', gameCode);
    } else {
      await supabase.from('games').update({ current_photo_index: nextIndex }).eq('code', gameCode);
    }

    revalidatePath(`/game/${gameCode}`);
    return { success: true };
  } catch (error) {
    console.error('Error moving to next photo:', error);
    return { success: false, error: 'Failed to move to next photo' };
  }
}

export async function restartGame(gameCode: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get game id
    const { data: game } = await supabase.from('games').select('id').eq('code', gameCode).single();

    if (!game) throw new Error('Game not found');

    // Delete all guesses for this game's photo submissions
    const { data: submissions } = await supabase
      .from('photo_submissions')
      .select('id')
      .eq('game_id', game.id);

    if (submissions) {
      const submissionIds = submissions.map((s) => s.id);
      await supabase.from('guesses').delete().in('photo_submission_id', submissionIds);
    }

    // Delete all photo submissions
    await supabase.from('photo_submissions').delete().eq('game_id', game.id);

    // Reset player scores
    await supabase.from('players').update({ total_score: 0 }).eq('game_id', game.id);

    // Reset game state to submission phase
    await supabase
      .from('games')
      .update({
        status: 'submission',
        current_photo_index: 0,
      })
      .eq('code', gameCode);

    revalidatePath(`/game/${gameCode}`);
    return { success: true };
  } catch (error) {
    console.error('Error restarting game:', error);
    return { success: false, error: 'Failed to restart game' };
  }
}
