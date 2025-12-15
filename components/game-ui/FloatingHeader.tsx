'use client';

import { Menu, Users } from 'lucide-react';
import type { FloatingHeaderProps } from './types';

/**
 * FloatingHeader
 *
 * Top bar with game info, floating over the image.
 * Shows round number, game code, and player count.
 */
export function FloatingHeader({
  round,
  totalRounds,
  gameCode,
  playerCount,
  onMenuClick,
}: FloatingHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 p-4 pointer-events-none">
      <div className="flex items-center justify-between bg-background/90 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 border pointer-events-auto">
        {/* Left: Menu button */}
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Center: Round info */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="text-sm font-medium">
            {round === 0 ? 'Photo Submission' : `Round ${round} of ${totalRounds}`}
          </div>
          <div className="text-xs text-muted-foreground font-mono">{gameCode}</div>
        </div>

        {/* Right: Player count */}
        <div className="flex items-center gap-2 px-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{playerCount}</span>
        </div>
      </div>
    </div>
  );
}
