'use client';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Game Complete!</h1>
          <p className="text-2xl text-gray-600 mb-2">Congratulations to the winner!</p>
        </div>
        {/* Full Leaderboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Final Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => {
                let bgColor = 'bg-gray-50';

                if (index === 0) {
                  bgColor = 'bg-yellow-50 border-2 border-yellow-300';
                } else if (index === 1) {
                  bgColor = 'bg-gray-100 border-2 border-gray-300';
                } else if (index === 2) {
                  bgColor = 'bg-orange-50 border-2 border-orange-300';
                }

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${bgColor}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-gray-500 w-12">#{index + 1}</span>
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          displayName={player.display_name}
                          size="lg"
                          className="w-16 h-16 text-2xl"
                        />
                        <span className="text-xl font-medium">{player.display_name}</span>
                      </div>
                    </div>
                    <span className="text-3xl font-bold text-blue-600">{player.total_score}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Game Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Game Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-blue-600">{players.length}</p>
                <p className="text-sm text-gray-600">Players</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{submissions.length}</p>
                <p className="text-sm text-gray-600">Photos</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.max(...sortedPlayers.map((p) => p.total_score))}
                </p>
                <p className="text-sm text-gray-600">High Score</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round(
                    sortedPlayers.reduce((sum, p) => sum + p.total_score, 0) / sortedPlayers.length
                  )}
                </p>
                <p className="text-sm text-gray-600">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => router.push('/')} variant="outline" className="flex-1" size="lg">
            Back to Home
          </Button>
          {isHost && (
            <Button onClick={handlePlayAgain} disabled={isRestarting} className="flex-1" size="lg">
              {isRestarting ? 'Restarting...' : 'Play Again'}
            </Button>
          )}
        </div>

        {/* Thank You Message */}
        <div className="text-center mt-8 text-gray-600">
          <p>Thanks for playing Map Me If You Can!</p>
        </div>
      </div>
    </div>
  );
}
