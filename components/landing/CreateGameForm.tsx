'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createGame } from '@/lib/game-actions';
import { toast } from 'sonner';

export default function CreateGameForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGame = async () => {
    setIsLoading(true);
    try {
      const result = await createGame();

      if (result.success && result.code) {
        toast.success(`Game created! Code: ${result.code}`);
        // Redirect to the game page - user will still need to join
        router.push(`/game/${result.code}`);
      } else {
        toast.error(result.error || 'Failed to create game');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Click the button below to generate a unique game code and start a new session.
      </p>
      <Button
        onClick={handleCreateGame}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Creating...' : 'Create Game'}
      </Button>
    </div>
  );
}
