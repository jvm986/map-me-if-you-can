'use client';

import { useEffect, useState } from 'react';
import { Game, Player, PhotoSubmission } from '@/types/game';
import Lobby from './Lobby';
import SubmissionPhase from './SubmissionPhase';
import RoundPhase from './RoundPhase';
import FinalResults from './FinalResults';
import { getGame, getPhotoSubmissions } from '@/lib/game-actions';

interface GameClientProps {
  initialGame: Game;
  initialPlayers: Player[];
  initialSubmissions: PhotoSubmission[];
  gameCode: string;
}

export default function GameClient({
  initialGame,
  initialPlayers,
  initialSubmissions,
  gameCode,
}: GameClientProps) {
  const [game, setGame] = useState<Game>(initialGame);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [submissions, setSubmissions] = useState<PhotoSubmission[]>(initialSubmissions);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  // Get player ID from localStorage on mount
  useEffect(() => {
    const playerId = localStorage.getItem(`player_${gameCode}`);
    setCurrentPlayerId(playerId);
  }, [gameCode]);

  // Poll for game updates every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const { game: updatedGame, players: updatedPlayers } = await getGame(gameCode);
      if (updatedGame) {
        setGame(updatedGame);
        setPlayers(updatedPlayers);

        // Fetch submissions if we're past lobby
        if (updatedGame.status !== 'lobby') {
          const updatedSubmissions = await getPhotoSubmissions(updatedGame.id);
          setSubmissions(updatedSubmissions);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [gameCode]);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  // Render appropriate phase
  if (game.status === 'lobby') {
    return (
      <Lobby
        game={game}
        players={players}
        currentPlayer={currentPlayer}
        gameCode={gameCode}
      />
    );
  }

  if (game.status === 'submission') {
    return (
      <SubmissionPhase
        game={game}
        players={players}
        submissions={submissions}
        currentPlayer={currentPlayer}
        gameCode={gameCode}
      />
    );
  }

  if (game.status === 'playing') {
    return (
      <RoundPhase
        game={game}
        players={players}
        submissions={submissions}
        currentPlayer={currentPlayer}
        gameCode={gameCode}
      />
    );
  }

  if (game.status === 'finished') {
    return (
      <FinalResults
        game={game}
        players={players}
        submissions={submissions}
        gameCode={gameCode}
      />
    );
  }

  return null;
}
