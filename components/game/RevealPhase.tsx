'use client';

import { AdvancedMarker, APIProvider, Map as GoogleMap } from '@vis.gl/react-google-maps';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { nextPhoto } from '@/lib/game-actions';
import { Game, Guess, PhotoSubmission, Player } from '@/types/game';
import PlayerAvatar from '../shared/PlayerAvatar';

interface RevealPhaseProps {
  game: Game;
  players: Player[];
  currentPhoto: PhotoSubmission;
  guesses: Guess[];
  isHost: boolean;
  gameCode: string;
  onContinue: () => void;
  submissions: PhotoSubmission[];
}

export default function RevealPhase({
  game,
  players,
  currentPhoto,
  guesses,
  isHost,
  gameCode,
  submissions,
}: RevealPhaseProps) {
  const [isAdvancing, setIsAdvancing] = useState(false);

  const photoOwner = players.find((p) => p.id === currentPhoto.player_id);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const handleNextPhoto = async () => {
    setIsAdvancing(true);
    try {
      const result = await nextPhoto(gameCode);
      if (result.success) {
        // Don't reset isAdvancing - let component unmount when phase/photo changes
        // This keeps the button disabled until the state actually updates
      } else {
        setIsAdvancing(false); // Only reset on error
      }
    } catch (error) {
      console.error(error);
      setIsAdvancing(false); // Only reset on error
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
            Results - Round {game.current_photo_index + 1}
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
              <div
                className="rounded-lg overflow-hidden border mb-4 bg-gray-100 flex items-center justify-center relative"
                style={{ minHeight: '256px', height: '256px' }}
              >
                <Image
                  src={currentPhoto.image_url}
                  alt="Revealed location"
                  fill
                  className="object-contain"
                />
              </div>
              {currentPhoto.caption && (
                <p className="text-center italic text-gray-700 mb-4">`&quot;`{currentPhoto.caption}`&quot;`</p>
              )}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Actual Location</p>
                <p className="text-sm text-gray-600">
                  {currentPhoto.true_lat.toFixed(4)}, {currentPhoto.true_lng.toFixed(4)}
                  {currentPhoto.true_location_text && ` (${currentPhoto.true_location_text})`}
                </p>
                <p className="text-sm font-medium text-gray-700 mt-3 mb-1">Taken by</p>
                <div className="flex items-center gap-2">
                  {photoOwner && <PlayerAvatar displayName={photoOwner.display_name} size="sm" />}
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
                  <GoogleMap
                    mapId="reveal-map"
                    defaultCenter={{
                      lat: currentPhoto.true_lat,
                      lng: currentPhoto.true_lng,
                    }}
                    defaultZoom={3}
                    gestureHandling="greedy"
                    style={{ width: '100%', height: '100%' }}
                  >
                    {/* Actual location marker (red pin) */}
                    <AdvancedMarker
                      position={{
                        lat: currentPhoto.true_lat,
                        lng: currentPhoto.true_lng,
                      }}
                    >
                      <svg
                        width="32"
                        height="48"
                        viewBox="0 0 32 48"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="drop-shadow-lg"
                      >
                        <path
                          d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 32 16 32s16-23.163 16-32c0-8.837-7.163-16-16-16z"
                          fill="#DC2626"
                        />
                        <circle cx="16" cy="16" r="8" fill="white" />
                        <text
                          x="16"
                          y="20"
                          fontSize="12"
                          fontWeight="bold"
                          textAnchor="middle"
                          fill="#DC2626"
                        >
                          ★
                        </text>
                      </svg>
                    </AdvancedMarker>

                    {/* Guess markers (blue pins) */}
                    {guesses.map((guess) => {
                      const guesser = players.find((p) => p.id === guess.player_id);
                      const initial = guesser?.display_name?.charAt(0).toUpperCase() || '?';
                      return (
                        <AdvancedMarker
                          key={guess.id}
                          position={{
                            lat: guess.guessed_lat,
                            lng: guess.guessed_lng,
                          }}
                        >
                          <svg
                            width="28"
                            height="42"
                            viewBox="0 0 32 48"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="drop-shadow-lg"
                          >
                            <path
                              d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 32 16 32s16-23.163 16-32c0-8.837-7.163-16-16-16z"
                              fill="#3B82F6"
                            />
                            <circle cx="16" cy="16" r="8" fill="white" />
                            <text
                              x="16"
                              y="21"
                              fontSize="10"
                              fontWeight="bold"
                              textAnchor="middle"
                              fill="#3B82F6"
                            >
                              {initial}
                            </text>
                          </svg>
                        </AdvancedMarker>
                      );
                    })}
                  </GoogleMap>
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

                return (
                  <div
                    key={guess.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-xl text-gray-500 w-8">#{index + 1}</span>
                      <div className="flex items-center gap-2">
                        {guesser && <PlayerAvatar displayName={guesser.display_name} size="md" />}
                        <div>
                          <p className="font-medium">{guesser?.display_name}</p>
                          <p className="text-xs text-gray-600">
                            {Math.round(guess.distance_km)}km away
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">+{guess.total_score}</p>
                      <p className="text-xs text-gray-500">{guess.location_score} pts</p>
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
              <Button onClick={handleNextPhoto} disabled={isAdvancing} className="w-full" size="lg">
                {isAdvancing
                  ? 'Loading...'
                  : game.current_photo_index + 1 >= submissions.length
                    ? 'View Final Results'
                    : 'Next Photo'}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isHost && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">Waiting for host to continue...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
