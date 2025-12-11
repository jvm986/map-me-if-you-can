'use client';

import { useState } from 'react';
import { Game, Player, PhotoSubmission, Guess } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { nextPhoto } from '@/lib/game-actions';
import { toast } from 'sonner';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

interface RevealPhaseProps {
  game: Game;
  players: Player[];
  currentPhoto: PhotoSubmission;
  guesses: Guess[];
  isHost: boolean;
  gameCode: string;
  onContinue: () => void;
}

export default function RevealPhase({
  game,
  players,
  currentPhoto,
  guesses,
  isHost,
  gameCode,
}: RevealPhaseProps) {
  const [isAdvancing, setIsAdvancing] = useState(false);

  const photoOwner = players.find((p) => p.id === currentPhoto.player_id);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const handleNextPhoto = async () => {
    setIsAdvancing(true);
    try {
      const result = await nextPhoto(gameCode);
      if (!result.success) {
        toast.error(result.error || 'Failed to advance');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsAdvancing(false);
    }
  };

  // Sort guesses by total score (highest first)
  const sortedGuesses = [...guesses].sort((a, b) => b.total_score - a.total_score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎊 Results - Round {game.current_photo_index + 1}
          </h1>
          <p className="text-lg text-gray-600">See how close everyone got!</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Photo Info */}
          <Card>
            <CardHeader>
              <CardTitle>The Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border mb-4">
                <img
                  src={currentPhoto.image_url}
                  alt="Revealed location"
                  className="w-full h-64 object-cover"
                />
              </div>
              {currentPhoto.caption && (
                <p className="text-center italic text-gray-700 mb-4">
                  "{currentPhoto.caption}"
                </p>
              )}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  📍 Actual Location
                </p>
                <p className="text-sm text-gray-600">
                  {currentPhoto.true_lat.toFixed(4)}, {currentPhoto.true_lng.toFixed(4)}
                  {currentPhoto.true_location_text && ` (${currentPhoto.true_location_text})`}
                </p>
                <p className="text-sm font-medium text-gray-700 mt-3 mb-1">
                  📸 Taken by
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{photoOwner?.avatar_emoji || '👤'}</span>
                  <span className="font-medium">{photoOwner?.display_name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map with actual location and guesses */}
          <Card>
            <CardHeader>
              <CardTitle>Guesses on Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg overflow-hidden border">
                <APIProvider apiKey={apiKey}>
                  <Map
                    mapId="reveal-map"
                    defaultCenter={{
                      lat: currentPhoto.true_lat,
                      lng: currentPhoto.true_lng,
                    }}
                    defaultZoom={3}
                    gestureHandling="greedy"
                    style={{ width: '100%', height: '100%' }}
                  >
                    {/* Actual location marker (red/special) */}
                    <AdvancedMarker
                      position={{
                        lat: currentPhoto.true_lat,
                        lng: currentPhoto.true_lng,
                      }}
                    >
                      <div className="bg-red-500 text-white px-2 py-1 rounded font-bold text-sm shadow-lg">
                        ⭐ Actual
                      </div>
                    </AdvancedMarker>

                    {/* Guess markers */}
                    {guesses.map((guess) => {
                      const guesser = players.find((p) => p.id === guess.player_id);
                      return (
                        <AdvancedMarker
                          key={guess.id}
                          position={{
                            lat: guess.guessed_lat,
                            lng: guess.guessed_lng,
                          }}
                        >
                          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs shadow-lg">
                            {guesser?.avatar_emoji || '📍'}
                          </div>
                        </AdvancedMarker>
                      );
                    })}
                  </Map>
                </APIProvider>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scores */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Round Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedGuesses.map((guess, index) => {
                const guesser = players.find((p) => p.id === guess.player_id);
                const guessedOwner = players.find((p) => p.id === guess.guessed_owner_id);
                const correctOwner = guess.guessed_owner_id === currentPhoto.player_id;

                return (
                  <div
                    key={guess.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-xl text-gray-500 w-8">
                        #{index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{guesser?.avatar_emoji || '👤'}</span>
                        <div>
                          <p className="font-medium">{guesser?.display_name}</p>
                          <div className="flex gap-2 text-xs text-gray-600">
                            <span>
                              📍 {Math.round(guess.distance_km)}km away
                            </span>
                            <span>•</span>
                            <span>
                              Guessed: {guessedOwner?.display_name}
                              {correctOwner ? ' ✓' : ' ✗'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        +{guess.total_score}
                      </p>
                      <p className="text-xs text-gray-500">
                        {guess.location_score} + {guess.owner_bonus}
                      </p>
                    </div>
                  </div>
                );
              })}
              {guesses.length === 0 && (
                <p className="text-center text-gray-500 py-4">No guesses for this round</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Host Controls */}
        {isHost && (
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleNextPhoto}
                disabled={isAdvancing}
                className="w-full"
                size="lg"
              >
                {isAdvancing
                  ? 'Loading...'
                  : game.current_photo_index + 1 >= guesses.length
                  ? 'View Final Results'
                  : 'Next Photo'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isHost && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">
                Waiting for host to continue...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
