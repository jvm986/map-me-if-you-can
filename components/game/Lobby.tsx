'use client';

import { Check, Copy, Users } from 'lucide-react';
import { useState } from 'react';
import { FloatingActionButton } from '@/components/game-ui/FloatingActionButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { startSubmissionPhase } from '@/lib/game-actions';
import { Game, Player } from '@/types/game';
import QuickJoinForm from '../landing/QuickJoinForm';
import PlayerAvatar from '../shared/PlayerAvatar';

interface LobbyProps {
  game: Game;
  players: Player[];
  currentPlayer?: Player;
  gameCode: string;
}

export default function Lobby({ players, currentPlayer, gameCode }: LobbyProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleStartSubmissions = async () => {
    setIsStarting(true);
    try {
      const result = await startSubmissionPhase(gameCode);
      if (result.success) {
        // Don't reset isStarting - let the component unmount when phase changes
        // This keeps the button disabled until the phase actually updates
      } else {
        setIsStarting(false); // Only reset on error
      }
    } catch (error) {
      console.error(error);
      setIsStarting(false); // Only reset on error
    }
  };

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // If player hasn't joined yet, show join form
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <CardHeader>
              <CardTitle>Join Game</CardTitle>
              <p className="text-sm text-gray-600">Game Code: {gameCode}</p>
            </CardHeader>
            <CardContent>
              <QuickJoinForm gameCode={gameCode} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isHost = currentPlayer.is_host;
  const hostPlayer = players.find((p) => p.is_host);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />

      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 pt-12 pb-20">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
              <Users className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-bold text-gray-900">
              Map Me If You Can
            </h1>
            <p className="text-xl text-muted-foreground">Waiting for players to join...</p>
          </div>

          {/* Game Code & Players Card */}
          <div className="bg-background rounded-lg shadow-xl p-8 space-y-6">
            {/* Game Code */}
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">Share this code with your friends</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-3xl font-mono font-bold bg-muted px-4 py-2 rounded-lg">
                  {gameCode}
                </code>
                <Button variant="outline" size="icon" onClick={copyGameCode} className="h-10 w-10">
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Players Grid */}
            <div>
              <h2 className="text-lg font-bold mb-3 text-center">Players ({players.length})</h2>
              <div className="grid grid-cols-3 gap-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-muted/50 rounded-lg aspect-square"
                  >
                    <PlayerAvatar displayName={player.display_name} size="sm" />
                    <div className="text-center w-full">
                      <p className="font-medium text-xs truncate">{player.display_name}</p>
                      <div className="flex gap-1 justify-center mt-1 flex-wrap">
                        {player.is_host && (
                          <Badge variant="secondary" className="text-xs">
                            Host
                          </Badge>
                        )}
                        {player.id === currentPlayer.id && <Badge className="text-xs">You</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info messages */}
            {!isHost && (
              <p className="text-sm text-muted-foreground text-center">
                Waiting for <span className="font-semibold">{hostPlayer?.display_name}</span> (host)
                to start the game...
              </p>
            )}
            {isHost && players.length < 2 && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  Need at least 2 players to start the game
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Host Controls FAB */}
      {isHost && (
        <FloatingActionButton
          label={isStarting ? 'Starting...' : 'Start Submission Phase'}
          onClick={handleStartSubmissions}
          disabled={isStarting || players.length < 2}
          position="bottom-center"
        />
      )}
    </div>
  );
}
