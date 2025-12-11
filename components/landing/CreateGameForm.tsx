'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createGame, joinGame } from '@/lib/game-actions';

export default function CreateGameForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');

  // Load saved name from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('player_name');
    if (savedName) {
      setDisplayName(savedName);
    }
  }, []);

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      // Create the game
      const gameResult = await createGame();

      if (!gameResult.success || !gameResult.code) {
        setIsLoading(false);
        return;
      }

      // Join the game as the host
      const joinResult = await joinGame(gameResult.code, displayName.trim());

      if (!joinResult.success || !joinResult.playerId || !joinResult.gameId) {
        setIsLoading(false);
        return;
      }

      // Save player name and ID to localStorage
      localStorage.setItem('player_name', displayName.trim());
      localStorage.setItem(`player_${gameResult.code}`, joinResult.playerId);

      // Redirect to the game page
      router.push(`/game/${gameResult.code}`);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreateGame} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="create-name">Your Name</Label>
        <Input
          id="create-name"
          type="text"
          placeholder="Enter your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={isLoading}
          maxLength={50}
        />
      </div>
      <Button
        type="submit"
        disabled={isLoading || !displayName.trim()}
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Creating...' : 'Create Game'}
      </Button>
    </form>
  );
}
