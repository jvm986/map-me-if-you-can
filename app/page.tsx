import { Suspense } from 'react';
import UnifiedGameForm from '@/components/landing/UnifiedGameForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Map Me If You Can</h1>
          <p className="text-2xl text-gray-600">A browser-based party game for remote teams</p>
        </div>

        {/* Unified Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Join an existing game or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <UnifiedGameForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
