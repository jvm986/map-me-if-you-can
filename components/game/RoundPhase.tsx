'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateGameScores, getGuesses, revealResults, submitGuess } from '@/lib/game-actions';
import { Game, Guess, Location, PhotoSubmission, Player } from '@/types/game';
import MapPicker from '../shared/MapPicker';
import PlayerAvatar from '../shared/PlayerAvatar';
import RevealPhase from './RevealPhase';

interface RoundPhaseProps {
  game: Game;
  players: Player[];
  submissions: PhotoSubmission[];
  currentPlayer?: Player;
  gameCode: string;
}

export default function RoundPhase({
  game,
  players,
  submissions,
  currentPlayer,
  gameCode,
}: RoundPhaseProps) {
  const [guessedLocation, setGuessedLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [showReveal, setShowReveal] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const isRevealingRef = useRef(false); // Track if reveal is in progress to prevent concurrent calls
  const [playerScores, setPlayerScores] = useState<Map<string, number>>(new Map());

  const currentPhoto = submissions[game.current_photo_index];
  const hasGuessed = guesses.some((g) => g.player_id === currentPlayer?.id);
  const isHost = currentPlayer?.is_host;

  // Calculate eligible guessers (all players except the photo owner)
  const eligibleGuessers = currentPhoto
    ? players.filter((p) => p.id !== currentPhoto.player_id)
    : [];
  const allEligibleGuessersHaveGuessed =
    eligibleGuessers.length > 0 &&
    guesses.length > 0 &&
    eligibleGuessers.every((p) => guesses.some((g) => g.player_id === p.id));

  // Reset reveal state and guesses when photo changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: We want to reset when photo changes
  useEffect(() => {
    setShowReveal(false);
    setGuesses([]);
    isRevealingRef.current = false; // Reset the revealing flag
  }, [currentPhoto?.id]);

  // Fetch and subscribe to guesses for current photo
  useEffect(() => {
    if (currentPhoto) {
      const fetchGuesses = async () => {
        const fetchedGuesses = await getGuesses(currentPhoto.id);
        setGuesses(fetchedGuesses);
      };

      // Initial fetch
      fetchGuesses();

      // Subscribe to realtime updates
      const supabase = require('@/lib/supabase/client').createClient();
      const channel = supabase
        .channel(`guesses-${currentPhoto.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'guesses',
            filter: `photo_submission_id=eq.${currentPhoto.id}`,
          },
          () => {
            fetchGuesses();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentPhoto]);

  // Fetch and update player scores (calculated from score_applied guesses)
  useEffect(() => {
    const fetchScores = async () => {
      const scores = await calculateGameScores(game.id);
      setPlayerScores(scores);
    };

    fetchScores();

    // Subscribe to realtime updates on guesses table to recalculate scores
    const supabase = require('@/lib/supabase/client').createClient();
    const channel = supabase
      .channel('game-scores')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guesses',
        },
        () => {
          fetchScores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game.id]);

  // Auto-reveal when all eligible players have guessed
  useEffect(() => {
    if (allEligibleGuessersHaveGuessed && !showReveal && !isRevealingRef.current && currentPhoto) {
      // Use a ref to prevent concurrent calls to revealResults
      isRevealingRef.current = true;
      const doReveal = async () => {
        try {
          await revealResults(gameCode, currentPhoto.id);
          setShowReveal(true);
        } catch (error) {
          console.error('Error auto-revealing results:', error);
          isRevealingRef.current = false; // Reset on error so it can be retried
        }
      };
      doReveal();
    }
  }, [allEligibleGuessersHaveGuessed, showReveal, currentPhoto, gameCode]);

  const handleSubmitGuess = async () => {
    if (!guessedLocation || !currentPlayer || !currentPhoto) {
      return;
    }

    // Don't allow guessing your own photo
    if (currentPhoto.player_id === currentPlayer.id) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitGuess(
        currentPhoto.id,
        currentPlayer.id,
        guessedLocation.lat,
        guessedLocation.lng,
        currentPhoto.player_id, // Pass photo owner as guessed owner (not used in scoring anymore)
        currentPhoto.true_lat,
        currentPhoto.true_lng,
        currentPhoto.player_id
      );

      if (result.success) {
        setGuessedLocation(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReveal = async () => {
    if (!currentPhoto) return;

    setIsRevealing(true);
    try {
      await revealResults(gameCode, currentPhoto.id);
      setShowReveal(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRevealing(false);
    }
  };

  // If all players who can guess have guessed, or host wants to reveal
  if (showReveal || (hasGuessed && isHost)) {
    return (
      <RevealPhase
        game={game}
        players={players}
        currentPhoto={currentPhoto}
        guesses={guesses}
        isHost={isHost || false}
        gameCode={gameCode}
        onContinue={() => setShowReveal(false)}
        submissions={submissions}
      />
    );
  }

  // Check if it's the player's own photo
  const isOwnPhoto = currentPhoto?.player_id === currentPlayer?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Round {game.current_photo_index + 1} of {submissions.length}
          </h1>
          <p className="text-lg text-gray-600">
            {isOwnPhoto
              ? 'This is your photo! Waiting for others to guess...'
              : hasGuessed
                ? 'Guess submitted! Waiting for other players...'
                : 'Guess where this photo was taken!'}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Photo Display */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div
                  className="rounded-lg overflow-hidden border mb-4 bg-gray-100 flex items-center justify-center relative"
                  style={{ minHeight: '384px', height: '384px' }}
                >
                  <Image
                    src={currentPhoto.image_url}
                    alt="Mystery location"
                    fill
                    className="object-contain"
                  />
                </div>
              </CardContent>
            </Card>

            {!isOwnPhoto && !hasGuessed && (
              <Card>
                <CardHeader>
                  <CardTitle>Make Your Guess</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Map for guessing location */}
                    <div className="space-y-2">
                      <div className="h-96 rounded-lg overflow-hidden border">
                        <MapPicker
                          onLocationSelect={setGuessedLocation}
                          selectedLocation={guessedLocation}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmitGuess}
                      disabled={isSubmitting || !guessedLocation}
                      className="w-full"
                      size="lg"
                    >
                      {isSubmitting ? 'Submitting...' : 'Lock in My Guess'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...players]
                    .sort((a, b) => (playerScores.get(b.id) || 0) - (playerScores.get(a.id) || 0))
                    .map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-bold text-gray-500 w-6 flex-shrink-0">
                            #{index + 1}
                          </span>
                          <PlayerAvatar displayName={player.display_name} size="sm" />
                          <span className="text-sm truncate">{player.display_name}</span>
                        </div>
                        <span className="font-bold text-sm">{playerScores.get(player.id) || 0}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Host Controls */}
            {isHost && (
              <Card>
                <CardHeader>
                  <CardTitle>Host Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleReveal}
                    disabled={isRevealing || guesses.length < 1}
                    className="w-full"
                  >
                    {isRevealing ? 'Revealing...' : 'Reveal Results'}
                  </Button>
                  <p className="text-xs text-center text-gray-500">
                    {guesses.length}/{eligibleGuessers.length} guesses submitted
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
