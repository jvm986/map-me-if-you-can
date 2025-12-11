import { notFound } from 'next/navigation';
import GameClient from '@/components/game/GameClient';
import { getGame, getPhotoSubmissions } from '@/lib/game-actions';

export default async function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { game, players, error } = await getGame(code);

  if (error || !game) {
    notFound();
  }

  // Fetch photo submissions if we're past the lobby phase
  const submissions = game.status !== 'lobby' ? await getPhotoSubmissions(game.id) : [];

  return (
    <GameClient
      initialGame={game}
      initialPlayers={players}
      initialSubmissions={submissions}
      gameCode={code}
    />
  );
}
