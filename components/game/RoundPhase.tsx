'use client';

import { useState, useEffect } from 'react';
import { Game, Player, PhotoSubmission, Location, Guess } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { submitGuess, getGuesses, nextPhoto } from '@/lib/game-actions';
import { toast } from 'sonner';
import MapPicker from '../shared/MapPicker';
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
  const [guessedOwnerId, setGuessedOwnerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [showReveal, setShowReveal] = useState(false);

  const currentPhoto = submissions[game.current_photo_index];
  const hasGuessed = guesses.some((g) => g.player_id === currentPlayer?.id);
  const isHost = currentPlayer?.is_host;

  // Fetch guesses for current photo
  useEffect(() => {
    if (currentPhoto) {
      const fetchGuesses = async () => {
        const fetchedGuesses = await getGuesses(currentPhoto.id);
        setGuesses(fetchedGuesses);
      };
      fetchGuesses();

      const interval = setInterval(fetchGuesses, 3000);
      return () => clearInterval(interval);
    }
  }, [currentPhoto?.id]);

  const handleSubmitGuess = async () => {
    if (!guessedLocation || !guessedOwnerId || !currentPlayer || !currentPhoto) {
      toast.error('Please select both a location and a player');
      return;
    }

    // Don't allow guessing your own photo
    if (currentPhoto.player_id === currentPlayer.id) {
      toast.error("You can't guess your own photo!");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitGuess(
        currentPhoto.id,
        currentPlayer.id,
        guessedLocation.lat,
        guessedLocation.lng,
        guessedOwnerId,
        currentPhoto.true_lat,
        currentPhoto.true_lng,
        currentPhoto.player_id
      );

      if (result.success) {
        toast.success('Guess submitted!');
        setGuessedLocation(null);
        setGuessedOwnerId(null);
      } else {
        toast.error(result.error || 'Failed to submit guess');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter players who didn't submit the current photo (for guessing)
  const guessablePlayers = players.filter((p) => p.id !== currentPhoto?.player_id);

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
            🎯 Round {game.current_photo_index + 1} of {submissions.length}
          </h1>
          <p className="text-lg text-gray-600">
            Guess where this photo was taken and who took it!
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Photo Display */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-lg overflow-hidden border mb-4">
                  <img
                    src={currentPhoto.image_url}
                    alt="Mystery location"
                    className="w-full h-96 object-cover"
                  />
                </div>
                {currentPhoto.caption && (
                  <p className="text-center text-lg italic text-gray-700">
                    "{currentPhoto.caption}"
                  </p>
                )}
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
                      <label className="font-medium">Where was this photo taken?</label>
                      <div className="h-96 rounded-lg overflow-hidden border">
                        <MapPicker
                          onLocationSelect={setGuessedLocation}
                          selectedLocation={guessedLocation}
                        />
                      </div>
                      {guessedLocation && (
                        <p className="text-sm text-gray-600">
                          Your guess: {guessedLocation.lat.toFixed(4)}, {guessedLocation.lng.toFixed(4)}
                        </p>
                      )}
                    </div>

                    {/* Player selection */}
                    <div className="space-y-2">
                      <label className="font-medium">Who took this photo?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {guessablePlayers.map((player) => (
                          <button
                            key={player.id}
                            onClick={() => setGuessedOwnerId(player.id)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              guessedOwnerId === player.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{player.avatar_emoji || '👤'}</span>
                              <span className="font-medium">{player.display_name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmitGuess}
                      disabled={isSubmitting || !guessedLocation || !guessedOwnerId}
                      className="w-full"
                      size="lg"
                    >
                      {isSubmitting ? 'Submitting...' : 'Lock in My Guess'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isOwnPhoto && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-lg text-gray-600">
                      This is your photo! Waiting for others to guess...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasGuessed && !isOwnPhoto && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold mb-2">Guess Submitted!</h3>
                    <p className="text-gray-600">
                      Waiting for other players...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Guess Status */}
            <Card>
              <CardHeader>
                <CardTitle>Guess Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players
                    .filter((p) => p.id !== currentPhoto?.player_id)
                    .map((player) => {
                      const hasPlayerGuessed = guesses.some((g) => g.player_id === player.id);
                      return (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <span>{player.avatar_emoji || '👤'}</span>
                            <span className="text-sm">{player.display_name}</span>
                          </div>
                          {hasPlayerGuessed ? (
                            <Badge variant="default">✓</Badge>
                          ) : (
                            <Badge variant="outline">Guessing</Badge>
                          )}
                        </div>
                      );
                    })}
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
                  <p className="text-sm text-gray-600">
                    Reveal results when ready (at least 2 guesses recommended).
                  </p>
                  <Button
                    onClick={() => setShowReveal(true)}
                    disabled={guesses.length < 1}
                    className="w-full"
                  >
                    Reveal Results
                  </Button>
                  <p className="text-xs text-center text-gray-500">
                    {guesses.length} guess{guesses.length !== 1 ? 'es' : ''} so far
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...players]
                    .sort((a, b) => b.total_score - a.total_score)
                    .map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-500 w-6">#{index + 1}</span>
                          <span>{player.avatar_emoji || '👤'}</span>
                          <span className="text-sm">{player.display_name}</span>
                        </div>
                        <span className="font-bold">{player.total_score}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
