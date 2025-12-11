'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { joinGame } from '@/lib/game-actions';

interface QuickJoinFormProps {
  gameCode: string;
}

export default function QuickJoinForm({ gameCode }: QuickJoinFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load player name from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('player_name');
    if (savedName) {
      setDisplayName(savedName);
    }
  }, []);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await joinGame(gameCode, displayName.trim());

      if (result.success && result.playerId) {
        localStorage.setItem(`player_${gameCode}`, result.playerId);
        localStorage.setItem('player_name', displayName.trim());
        // Force full page reload to show the lobby with updated player
        window.location.reload();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleJoinGame} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Your Name</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="Enter your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          disabled={isLoading}
          autoFocus
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || !displayName.trim()}
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Joining...' : 'Join Game'}
      </Button>
    </form>
  );
}
