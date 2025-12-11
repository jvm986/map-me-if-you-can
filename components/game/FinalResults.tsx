'use client';

import { Game, Player, PhotoSubmission } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface FinalResultsProps {
  game: Game;
  players: Player[];
  submissions: PhotoSubmission[];
  gameCode: string;
}

export default function FinalResults({
  game,
  players,
  submissions,
  gameCode,
}: FinalResultsProps) {
  const router = useRouter();

  // Sort players by total score
  const sortedPlayers = [...players].sort((a, b) => b.total_score - a.total_score);
  const winner = sortedPlayers[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🏆 Game Complete!
          </h1>
          <p className="text-2xl text-gray-600 mb-2">Congratulations to the winner!</p>
        </div>

        {/* Winner Card */}
        <Card className="mb-8 border-4 border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="text-8xl mb-4">{winner.avatar_emoji || '👤'}</div>
              <h2 className="text-4xl font-bold mb-2">{winner.display_name}</h2>
              <div className="flex items-center justify-center gap-3 mb-4">
                <Badge className="text-2xl px-6 py-2 bg-yellow-500">
                  🥇 Champion
                </Badge>
              </div>
              <p className="text-5xl font-bold text-blue-600">
                {winner.total_score} points
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Full Leaderboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Final Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => {
                let medalEmoji = '';
                let bgColor = 'bg-gray-50';

                if (index === 0) {
                  medalEmoji = '🥇';
                  bgColor = 'bg-yellow-50 border-2 border-yellow-300';
                } else if (index === 1) {
                  medalEmoji = '🥈';
                  bgColor = 'bg-gray-100 border-2 border-gray-300';
                } else if (index === 2) {
                  medalEmoji = '🥉';
                  bgColor = 'bg-orange-50 border-2 border-orange-300';
                }

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${bgColor}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-gray-500 w-12">
                        #{index + 1}
                      </span>
                      {medalEmoji && (
                        <span className="text-3xl">{medalEmoji}</span>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{player.avatar_emoji || '👤'}</span>
                        <span className="text-xl font-medium">{player.display_name}</span>
                      </div>
                    </div>
                    <span className="text-3xl font-bold text-blue-600">
                      {player.total_score}
                    </span>
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
                    sortedPlayers.reduce((sum, p) => sum + p.total_score, 0) /
                      sortedPlayers.length
                  )}
                </p>
                <p className="text-sm text-gray-600">Avg Score</p>
              </div>
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
          <Button
            onClick={() => router.push('/')}
            className="flex-1"
            size="lg"
          >
            Play Again
          </Button>
        </div>

        {/* Thank You Message */}
        <div className="text-center mt-8 text-gray-600">
          <p>Thanks for playing Map Me If You Can! 🗺️</p>
        </div>
      </div>
    </div>
  );
}
