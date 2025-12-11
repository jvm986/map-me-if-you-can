import CreateGameForm from '@/components/landing/CreateGameForm';
import JoinGameForm from '@/components/landing/JoinGameForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🗺️ Map Me If You Can
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A fun party game for remote teams! Guess photo locations and who took them.
            Perfect for 10–15 minute energizers.
          </p>
        </div>

        {/* Forms */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Game */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Game</CardTitle>
              <CardDescription>
                Start a new game and invite your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateGameForm />
            </CardContent>
          </Card>

          {/* Join Game */}
          <Card>
            <CardHeader>
              <CardTitle>Join Game</CardTitle>
              <CardDescription>
                Enter a game code to join an existing game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JoinGameForm />
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Create a game or join with a code</li>
              <li>Everyone uploads a travel photo with its location</li>
              <li>For each photo, guess where it was taken and who took it</li>
              <li>Earn points for accurate location guesses and correct owner picks</li>
              <li>Winner has the highest score after all photos!</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
