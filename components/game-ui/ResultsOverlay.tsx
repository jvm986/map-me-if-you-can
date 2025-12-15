'use client';

import { Award, MapPin, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ResultsOverlayProps } from './types';

/**
 * ResultsOverlay
 *
 * Shows round results in an overlay format.
 * Displays player rankings, distances, and scores.
 */
export function ResultsOverlay({
  isOpen,
  results,
  currentPhoto,
  onNext,
  nextLabel = 'Next Round',
}: ResultsOverlayProps) {
  if (!isOpen) return null;

  // Sort by total score descending
  const sortedResults = [...results].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Round Results
          </h2>
          {currentPhoto.locationText && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {currentPhoto.locationText}
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {sortedResults.map((result, index) => (
              <div
                key={result.playerName}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border transition-all',
                  index === 0 &&
                    'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
                  index > 0 && 'bg-muted/50'
                )}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>

                {/* Player Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{result.playerName}</div>
                  <div className="text-sm text-muted-foreground">
                    {result.distanceKm.toFixed(1)} km away
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="flex-shrink-0 text-right">
                  <div className="font-bold text-lg">{result.totalScore}</div>
                  <div className="text-xs text-muted-foreground">
                    {result.locationScore}
                    {result.ownerBonus > 0 && ` +${result.ownerBonus}`}
                  </div>
                </div>

                {/* Winner Badge */}
                {index === 0 && <Award className="flex-shrink-0 h-6 w-6 text-yellow-500" />}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <Button onClick={onNext} size="lg" className="w-full">
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
