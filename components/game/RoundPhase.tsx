'use client';

import { useEffect, useRef, useState } from 'react';
import {
  FloatingActionButton,
  FloatingHeader,
  FullscreenImageViewer,
  MapOverlay,
  WaitingMessage,
} from '@/components/game-ui';
import { getGuesses, revealResults, submitGuess } from '@/lib/game-actions';
import type { Game, Guess, Location, PhotoSubmission, Player } from '@/types/game';
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
  const [guessedLocation, setGuessedLocation] = useState<Location | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [showReveal, setShowReveal] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const isRevealingRef = useRef(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

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
    isRevealingRef.current = false;
    setIsMapOpen(false);
    setGuessedLocation(undefined);
  }, [currentPhoto?.id]);

  // Fetch and subscribe to guesses for current photo
  useEffect(() => {
    if (currentPhoto) {
      const fetchGuesses = async () => {
        const fetchedGuesses = await getGuesses(currentPhoto.id);
        setGuesses(fetchedGuesses);
      };

      fetchGuesses();

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

  // Auto-reveal when all eligible players have guessed
  useEffect(() => {
    if (allEligibleGuessersHaveGuessed && !showReveal && !isRevealingRef.current && currentPhoto) {
      isRevealingRef.current = true;
      const doReveal = async () => {
        try {
          await revealResults(gameCode, currentPhoto.id);
          setShowReveal(true);
        } catch (error) {
          console.error('Error auto-revealing results:', error);
          isRevealingRef.current = false;
        }
      };
      doReveal();
    }
  }, [allEligibleGuessersHaveGuessed, showReveal, currentPhoto, gameCode]);

  const handleSubmitGuess = async () => {
    if (!guessedLocation || !currentPlayer || !currentPhoto) {
      return;
    }

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
        currentPhoto.player_id,
        currentPhoto.true_lat,
        currentPhoto.true_lng,
        currentPhoto.player_id
      );

      if (result.success) {
        setGuessedLocation(undefined);
        setIsMapOpen(false);
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

  // Show reveal phase
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

  const isOwnPhoto = currentPhoto?.player_id === currentPlayer?.id;

  // Determine waiting message
  let waitingMessage: {
    message: string;
    submessage?: string;
    variant: 'info' | 'waiting' | 'success';
  } | null = null;

  if (isOwnPhoto) {
    waitingMessage = {
      message: 'This is your photo!',
      submessage: `Waiting for ${eligibleGuessers.length} ${eligibleGuessers.length === 1 ? 'player' : 'players'} to guess...`,
      variant: 'info',
    };
  } else if (hasGuessed) {
    const remainingGuesses = eligibleGuessers.length - guesses.length;
    waitingMessage = {
      message: 'Guess submitted!',
      submessage:
        remainingGuesses > 0
          ? `Waiting for ${remainingGuesses} more ${remainingGuesses === 1 ? 'guess' : 'guesses'}...`
          : 'All guesses are in!',
      variant: 'success',
    };
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Fullscreen Image Background */}
      <FullscreenImageViewer imageUrl={currentPhoto.image_url} alt="Mystery location" />

      {/* Floating Header */}
      <FloatingHeader
        round={game.current_photo_index + 1}
        totalRounds={submissions.length}
        gameCode={gameCode}
        playerCount={players.length}
      />

      {/* Waiting Message Overlay */}
      {waitingMessage && (
        <WaitingMessage
          message={waitingMessage.message}
          submessage={waitingMessage.submessage}
          variant={waitingMessage.variant}
          showSpinner={waitingMessage.variant === 'waiting'}
        />
      )}

      {/* Action Button - Only show if player can guess and hasn't guessed yet */}
      {!isOwnPhoto && !hasGuessed && (
        <FloatingActionButton
          label="Make a Guess"
          onClick={() => setIsMapOpen(true)}
          position="bottom-center"
        />
      )}

      {/* Host Reveal Button - Show if host and at least one guess */}
      {isHost && !isOwnPhoto && guesses.length > 0 && !hasGuessed && (
        <FloatingActionButton
          label={isRevealing ? 'Revealing...' : 'Reveal Results (Host)'}
          onClick={handleReveal}
          disabled={isRevealing}
          variant="secondary"
          position="bottom-right"
        />
      )}

      {/* Map Overlay for Guessing */}
      <MapOverlay
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onLocationSelect={setGuessedLocation}
        onSubmit={handleSubmitGuess}
        selectedLocation={guessedLocation}
        submitDisabled={isSubmitting}
        submitLabel={isSubmitting ? 'Submitting...' : 'Lock in Guess'}
      />
    </div>
  );
}
