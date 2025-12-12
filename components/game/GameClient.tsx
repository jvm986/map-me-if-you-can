'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [isConnected, setIsConnected] = useState(true);
  const [mounted, setMounted] = useState(false);
  const channelsRef = useRef<any[]>([]);
  const supabaseRef = useRef<any>(null);

  // Track mount status to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get player ID from localStorage on mount
  useEffect(() => {
    const playerId = localStorage.getItem(`player_${gameCode}`);
    setCurrentPlayerId(playerId);
  }, [gameCode]);

  // Refresh all data from server
  const refreshData = useCallback(async () => {
    try {
      const [gameData, submissionsData] = await Promise.all([
        getGame(gameCode),
        getPhotoSubmissions(initialGame.id),
      ]);

      if (gameData.game) {
        setGame(gameData.game);
        setPlayers(gameData.players);
      }
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, [gameCode, initialGame.id]);

  // Subscribe to realtime updates
  const subscribe = useCallback(() => {
    // Clean up existing subscriptions first
    if (channelsRef.current.length > 0) {
      channelsRef.current.forEach((channel) => {
        supabaseRef.current?.removeChannel(channel);
      });
      channelsRef.current = [];
    }

    const supabase = createClient();
    supabaseRef.current = supabase;

    // Subscribe to game changes
    const gameChannel = supabase
      .channel(`game-${gameCode}-${Date.now()}`)
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    // Subscribe to player changes
    const playerChannel = supabase
      .channel(`players-${gameCode}-${Date.now()}`)
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
      .channel(`submissions-${gameCode}-${Date.now()}`)
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

    channelsRef.current = [gameChannel, playerChannel, submissionChannel];
  }, [gameCode, initialGame.id]);

  // Unsubscribe from all channels
  const unsubscribe = useCallback(() => {
    if (channelsRef.current.length > 0 && supabaseRef.current) {
      channelsRef.current.forEach((channel) => {
        supabaseRef.current.removeChannel(channel);
      });
      channelsRef.current = [];
    }
  }, []);

  // Handle page visibility changes (mobile app backgrounding/foregrounding)
  useEffect(() => {
    // Only set up visibility handler on client
    if (!mounted) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Page is hidden (app backgrounded) - unsubscribe to free resources
        console.log('App backgrounded - unsubscribing from realtime');
        unsubscribe();
        setIsConnected(false);
      } else {
        // Page is visible again (app foregrounded) - resubscribe and refresh
        console.log('App foregrounded - resubscribing and refreshing data');
        setIsConnected(true);
        await refreshData();
        subscribe();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mounted, subscribe, unsubscribe, refreshData]);

  // Initial subscription (only on client after mount)
  useEffect(() => {
    if (!mounted) return;

    subscribe();

    return () => {
      unsubscribe();
    };
  }, [mounted, subscribe, unsubscribe]);

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

  // Connection status banner (only render on client to prevent hydration errors)
  const ConnectionBanner = () => {
    if (!mounted || isConnected) return null;

    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
        Connection lost. Updates paused. The game will reconnect when you return to this tab.
      </div>
    );
  };

  // Render appropriate phase
  return (
    <>
      <ConnectionBanner />
      {game.status === 'lobby' && (
        <Lobby game={game} players={players} currentPlayer={currentPlayer} gameCode={gameCode} />
      )}
      {game.status === 'submission' && (
        <SubmissionPhase
          game={game}
          players={players}
          submissions={submissions}
          currentPlayer={currentPlayer}
          gameCode={gameCode}
        />
      )}
      {game.status === 'playing' && (
        <RoundPhase
          game={game}
          players={players}
          submissions={submissions}
          currentPlayer={currentPlayer}
          gameCode={gameCode}
        />
      )}
      {game.status === 'finished' && (
        <FinalResults
          game={game}
          players={players}
          submissions={submissions}
          gameCode={gameCode}
          currentPlayer={currentPlayer}
        />
      )}
    </>
  );
}
