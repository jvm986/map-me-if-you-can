'use client';

import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { restartGame } from '@/lib/game-actions';
import { Game, PhotoSubmission, Player } from '@/types/game';
import PlayerAvatar from '../shared/PlayerAvatar';

interface FinalResultsProps {
  game: Game;
  players: Player[];
  submissions: PhotoSubmission[];
  gameCode: string;
  currentPlayer?: Player;
}

export default function FinalResults({
  players,
  submissions,
  gameCode,
  currentPlayer,
}: FinalResultsProps) {
  const router = useRouter();
  const [isRestarting, setIsRestarting] = useState(false);
  const isHost = currentPlayer?.is_host;

  // Sort players by total score
  const sortedPlayers = [...players].sort((a, b) => b.total_score - a.total_score);

  const handlePlayAgain = async () => {
    setIsRestarting(true);
    try {
      const result = await restartGame(gameCode);
      if (result.success) {
        // Don't reset isRestarting - let component unmount when game restarts
        // This keeps the button disabled until the phase actually updates
      } else {
        setIsRestarting(false); // Only reset on error
      }
    } catch (error) {
      console.error(error);
      setIsRestarting(false); // Only reset on error
    }
  };

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Game Complete!</h1>
          <p className="text-lg text-gray-600">Congratulations to all players!</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery & Map */}
            <Card>
              <CardHeader>
                <CardTitle>Photo Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <APIProvider apiKey={apiKey}>
                  <div className="h-96 rounded-lg overflow-hidden border mb-4">
                    <Map
                      defaultZoom={2}
                      defaultCenter={{ lat: 20, lng: 0 }}
                      mapId="final-results-map"
                      disableDefaultUI={true}
                      gestureHandling="greedy"
                    >
                      {submissions.map((submission) => (
                        <AdvancedMarker
                          key={submission.id}
                          position={{ lat: submission.true_lat, lng: submission.true_lng }}
                        />
                      ))}
                    </Map>
                  </div>
                </APIProvider>

                {/* Photo Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {submissions.map((submission) => {
                    const owner = players.find((p) => p.id === submission.player_id);
                    return (
                      <div key={submission.id} className="space-y-1">
                        <div className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100">
                          <img
                            src={submission.image_url}
                            alt="Photo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <PlayerAvatar displayName={owner?.display_name || ''} size="sm" />
                          <p className="text-xs text-gray-600 truncate">
                            {owner?.display_name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Back to Home
              </Button>
              {isHost && (
                <Button
                  onClick={handlePlayAgain}
                  disabled={isRestarting}
                  className="flex-1"
                  size="lg"
                >
                  {isRestarting ? 'Restarting...' : 'Play Again'}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>Final Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sortedPlayers.map((player, index) => (
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
                      <span className="font-bold text-sm">{player.total_score}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Thank You Message */}
        <div className="text-center mt-8 text-gray-600">
          <p>Thanks for playing Map Me If You Can!</p>
        </div>
      </div>
    </div>
  );
}
