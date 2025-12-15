import { Map as MapIcon } from 'lucide-react';
import { Suspense } from 'react';
import UnifiedGameForm from '@/components/landing/UnifiedGameForm';

export default function Home() {
  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />

      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 pt-12 pb-20">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
              <MapIcon className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-bold text-gray-900 whitespace-nowrap px-2">
              Map Me If You Can
            </h1>
            <p className="text-xl text-muted-foreground">
              A browser-based party game for remote teams
            </p>
          </div>

          {/* Unified Form */}
          <div className="bg-background rounded-lg shadow-xl p-8">
            <Suspense
              fallback={<div className="text-center text-muted-foreground">Loading...</div>}
            >
              <UnifiedGameForm />
            </Suspense>
          </div>

          {/* Footer hint */}
          <p className="text-center text-sm text-muted-foreground">
            Upload photos • Guess locations • Compete with friends
          </p>
        </div>
      </div>
    </div>
  );
}
