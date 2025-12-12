'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createGame, joinGame } from '@/lib/game-actions';

export default function UnifiedGameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load game code from URL and player name from localStorage on mount
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setGameCode(codeFromUrl.toUpperCase());
    }

    const savedName = localStorage.getItem('player_name');
    if (savedName) {
      setDisplayName(savedName);
    }

    setMounted(true);
  }, [searchParams]);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gameCode.trim() || !displayName.trim()) {
      return;
    }

    setIsJoining(true);
    try {
      const normalizedCode = gameCode.trim().toUpperCase();
      const result = await joinGame(normalizedCode, displayName.trim());

      if (result.success && result.playerId) {
        localStorage.setItem(`player_${normalizedCode}`, result.playerId);
        localStorage.setItem('player_name', displayName.trim());
        router.push(`/game/${normalizedCode}`);
      } else {
        setIsJoining(false);
      }
    } catch (error) {
      console.error(error);
      setIsJoining(false);
    }
  };

  const handleCreateGame = async () => {
    if (!displayName.trim()) {
      return;
    }

    setIsCreating(true);
    try {
      const gameResult = await createGame();

      if (!gameResult.success || !gameResult.code) {
        setIsCreating(false);
        return;
      }

      const joinResult = await joinGame(gameResult.code, displayName.trim());

      if (!joinResult.success || !joinResult.playerId || !joinResult.gameId) {
        setIsCreating(false);
        return;
      }

      localStorage.setItem('player_name', displayName.trim());
      localStorage.setItem(`player_${gameResult.code}`, joinResult.playerId);

      router.push(`/game/${gameResult.code}`);
    } catch (error) {
      console.error(error);
      setIsCreating(false);
    }
  };

  // Show loading skeleton during hydration to prevent mismatch
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="flex-1 h-10 bg-gray-100 rounded animate-pulse" />
              <div className="h-10 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">or</span>
          </div>
        </div>
        <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Name field - shared for both actions */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Your Name</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="Enter your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={isJoining || isCreating}
          maxLength={50}
        />
      </div>

      {/* Join game section */}
      <form onSubmit={handleJoinGame} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gameCode">Game Code</Label>
          <div className="flex gap-2">
            <Input
              id="gameCode"
              type="text"
              placeholder="e.g., A7K2M"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              maxLength={5}
              disabled={isJoining || isCreating}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isJoining || isCreating || !displayName.trim() || !gameCode.trim()}
              size="lg"
            >
              {isJoining ? 'Joining...' : 'Join'}
            </Button>
          </div>
        </div>
      </form>

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">or</span>
        </div>
      </div>

      {/* Create new game button */}
      <Button
        onClick={handleCreateGame}
        disabled={isJoining || isCreating || !displayName.trim()}
        className="w-full"
        size="lg"
        variant="outline"
      >
        {isCreating ? 'Creating...' : 'Create New Game'}
      </Button>
    </div>
  );
}
