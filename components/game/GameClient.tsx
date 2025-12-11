'use client';

import { useEffect, useState } from 'react';
import { getGame, getPhotoSubmissions } from '@/lib/game-actions';
import { createClient } from '@/lib/supabase/client';
import { Game, PhotoSubmission, Player } from '@/types/game';
import FinalResults from './FinalResults';
import Lobby from './Lobby';
import RoundPhase from './RoundPhase';
import SubmissionPhase from './SubmissionPhase';

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

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to game changes
    const gameChannel = supabase
      .channel(`game-${gameCode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `code=eq.${gameCode}` },
        async () => {
          const { game: updatedGame, players: updatedPlayers } = await getGame(gameCode);
          if (updatedGame) {
            setGame(updatedGame);
            setPlayers(updatedPlayers);
          }
        }
      )
      .subscribe();

    // Subscribe to player changes
    const playerChannel = supabase
      .channel(`players-${gameCode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${initialGame.id}` },
        async () => {
          const { players: updatedPlayers } = await getGame(gameCode);
          setPlayers(updatedPlayers);
        }
      )
      .subscribe();

    // Subscribe to submission changes
    const submissionChannel = supabase
      .channel(`submissions-${gameCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photo_submissions',
          filter: `game_id=eq.${initialGame.id}`,
        },
        async () => {
          const updatedSubmissions = await getPhotoSubmissions(initialGame.id);
          setSubmissions(updatedSubmissions);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(playerChannel);
      supabase.removeChannel(submissionChannel);
    };
  }, [gameCode, initialGame.id]);

  // Clear submissions when game restarts (goes back to submission phase)
  useEffect(() => {
    if (game.status === 'submission' && game.current_photo_index === 0) {
      // Fetch fresh submissions (should be empty after restart)
      const fetchSubmissions = async () => {
        const updatedSubmissions = await getPhotoSubmissions(game.id);
        setSubmissions(updatedSubmissions);
      };
      fetchSubmissions();
    }
  }, [game.status, game.current_photo_index, game.id]);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  // Render appropriate phase
  if (game.status === 'lobby') {
    return (
      <Lobby game={game} players={players} currentPlayer={currentPlayer} gameCode={gameCode} />
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
        currentPlayer={currentPlayer}
      />
    );
  }

  return null;
}
