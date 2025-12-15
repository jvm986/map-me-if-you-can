'use client';

import { AdvancedMarker, APIProvider, Map as GoogleMap } from '@vis.gl/react-google-maps';
import { Award, MapPin, Trophy } from 'lucide-react';
import { useState } from 'react';
import { FloatingHeader } from '@/components/game-ui/FloatingHeader';
import { FullscreenImageViewer } from '@/components/game-ui/FullscreenImageViewer';
import { Button } from '@/components/ui/button';
import { nextPhoto } from '@/lib/game-actions';
import { cn } from '@/lib/utils';
import { Game, Guess, PhotoSubmission, Player } from '@/types/game';
import PlayerAvatar from '../shared/PlayerAvatar';

interface RevealPhaseProps {
  game: Game;
  players: Player[];
  currentPhoto: PhotoSubmission;
  guesses: Guess[];
  isHost: boolean;
  gameCode: string;
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

  const nextButtonLabel = isAdvancing
    ? 'Loading...'
    : game.current_photo_index + 1 >= submissions.length
      ? 'View Final Results'
      : 'Next Photo';

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Fullscreen Image Background */}
      <FullscreenImageViewer imageUrl={currentPhoto.image_url} alt="Revealed location" />

      {/* Floating Header */}
      <FloatingHeader
        round={game.current_photo_index + 1}
        totalRounds={submissions.length}
        gameCode={gameCode}
        playerCount={players.length}
      />

      {/* Results Overlay - Only shown for host or all players */}
      <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Round {game.current_photo_index + 1} Results
            </h2>
            {currentPhoto.true_location_text && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {currentPhoto.true_location_text}
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Map with guesses */}
            <div className="h-64 sm:h-80 rounded-lg overflow-hidden border">
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

            {/* Results List */}
            <div className="space-y-3">
              {sortedGuesses.map((guess, index) => {
                const guesser = players.find((p) => p.id === guess.player_id);
                return (
                  <div
                    key={guess.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border transition-all',
                      index === 0 &&
                        'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
                      index > 0 && 'bg-muted/50'
                    )}
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>

                    {/* Player Avatar & Info */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <PlayerAvatar displayName={guesser?.display_name || ''} size="sm" />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{guesser?.display_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {guess.distance_km.toFixed(1)} km away
                        </div>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="flex-shrink-0 text-right">
                      <div className="font-bold text-lg">{guess.total_score}</div>
                      <div className="text-xs text-muted-foreground">
                        {guess.location_score}
                        {guess.owner_bonus > 0 && ` +${guess.owner_bonus}`}
                      </div>
                    </div>

                    {/* Winner Badge */}
                    {index === 0 && <Award className="flex-shrink-0 h-6 w-6 text-yellow-500" />}
                  </div>
                );
              })}
              {guesses.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">
                  No guesses this round
                </p>
              )}
            </div>
          </div>

          {/* Footer with Host Controls */}
          <div className="p-6 border-t">
            {isHost ? (
              <Button onClick={handleNextPhoto} disabled={isAdvancing} size="lg" className="w-full">
                {nextButtonLabel}
              </Button>
            ) : (
              <p className="text-center text-muted-foreground text-sm">
                Waiting for host to continue...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
