'use client';

import { Game, Player } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { startSubmissionPhase } from '@/lib/game-actions';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import JoinGameForm from '../landing/JoinGameForm';

interface LobbyProps {
  game: Game;
  players: Player[];
  currentPlayer?: Player;
  gameCode: string;
}

export default function Lobby({ game, players, currentPlayer, gameCode }: LobbyProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartSubmissions = async () => {
    setIsStarting(true);
    try {
      const result = await startSubmissionPhase(gameCode);
      if (result.success) {
        toast.success('Submission phase started!');
      } else {
        toast.error(result.error || 'Failed to start submissions');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsStarting(false);
    }
  };

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode);
    toast.success('Game code copied to clipboard!');
  };

  // If player hasn't joined yet, show join form
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <CardHeader>
              <CardTitle>Join Game: {gameCode}</CardTitle>
            </CardHeader>
            <CardContent>
              <JoinGameForm />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isHost = currentPlayer.is_host;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🗺️ Map Me If You Can
          </h1>
          <p className="text-lg text-gray-600">Waiting for players...</p>
        </div>

        {/* Game Code Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Game Code</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-3xl font-mono font-bold bg-gray-100 px-4 py-2 rounded">
                  {gameCode}
                </code>
                <Button variant="outline" size="sm" onClick={copyGameCode}>
                  Copy
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Share this code with your team to join the game
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Players ({players.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{player.avatar_emoji || '👤'}</span>
                    <span className="font-medium">{player.display_name}</span>
                  </div>
                  <div className="flex gap-2">
                    {player.is_host && (
                      <Badge variant="secondary">Host</Badge>
                    )}
                    {player.id === currentPlayer.id && (
                      <Badge>You</Badge>
                    )}
                  </div>
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
              <p className="text-sm text-gray-600">
                When everyone has joined, start the submission phase so players can upload their photos.
              </p>
              <Button
                onClick={handleStartSubmissions}
                disabled={isStarting || players.length < 2}
                className="w-full"
                size="lg"
              >
                {isStarting ? 'Starting...' : 'Start Submission Phase'}
              </Button>
              {players.length < 2 && (
                <p className="text-sm text-amber-600 text-center">
                  Need at least 2 players to start
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Non-host message */}
        {!isHost && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-600">
                Waiting for {players.find((p) => p.is_host)?.display_name} (host) to start the game...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
