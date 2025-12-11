'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { joinGame } from '@/lib/game-actions';
import { toast } from 'sonner';

const EMOJI_OPTIONS = ['🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🦉', '🦄', '🐙', '🦀', '🌟', '🎯', '🎨', '🎭'];

export default function JoinGameForm() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gameCode.trim() || !displayName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await joinGame(
        gameCode.trim().toLowerCase(),
        displayName.trim(),
        selectedEmoji
      );

      if (result.success && result.playerId) {
        // Store player ID in localStorage for this session
        localStorage.setItem(`player_${gameCode}`, result.playerId);
        toast.success('Joined game successfully!');
        router.push(`/game/${gameCode}`);
      } else {
        toast.error(result.error || 'Failed to join game');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleJoinGame} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="gameCode">Game Code</Label>
        <Input
          id="gameCode"
          type="text"
          placeholder="e.g., happy-fox-42"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Your Name</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="Enter your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Pick an Avatar (Optional)</Label>
        <div className="grid grid-cols-8 gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setSelectedEmoji(emoji)}
              className={`text-2xl p-2 rounded-lg border-2 hover:border-blue-500 transition-colors ${
                selectedEmoji === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full" size="lg">
        {isLoading ? 'Joining...' : 'Join Game'}
      </Button>
    </form>
  );
}
