/**
 * Component interface types for game UI
 *
 * These define the props for presentational (dumb) components.
 * Components should be purely visual with no business logic.
 */

import type { Location } from '@/types/game';

/**
 * FullscreenImageViewer - Displays an image fullscreen with pan/zoom
 */
export interface FullscreenImageViewerProps {
  imageUrl: string;
  alt?: string;
  onZoomChange?: (scale: number) => void;
}

/**
 * MapOverlay - Bottom sheet/drawer containing map for location guessing
 */
export interface MapOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: Location) => void;
  onSubmit: (location: Location) => void;
  selectedLocation?: Location;
  submitDisabled?: boolean;
  submitLabel?: string;
}

/**
 * FloatingHeader - Top bar with game info
 */
export interface FloatingHeaderProps {
  round: number;
  totalRounds: number;
  gameCode: string;
  playerCount: number;
  onMenuClick?: () => void;
}

/**
 * FloatingActionButton - Primary action button (e.g., "Make Guess")
 */
export interface FloatingActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  position?: 'bottom-left' | 'bottom-right' | 'bottom-center';
}

/**
 * ResultsOverlay - Shows results after a round
 */
export interface ResultsOverlayProps {
  isOpen: boolean;
  results: GuessResult[];
  currentPhoto: {
    imageUrl: string;
    trueLocation: Location;
    locationText?: string;
  };
  onNext: () => void;
  nextLabel?: string;
}

export interface GuessResult {
  playerName: string;
  distanceKm: number;
  locationScore: number;
  ownerBonus: number;
  totalScore: number;
  guessedLocation: Location;
}

/**
 * WaitingMessage - Floating message for waiting states
 */
export interface WaitingMessageProps {
  message: string;
  submessage?: string;
  variant?: 'info' | 'waiting' | 'success';
  showSpinner?: boolean;
}

/**
 * LeaderboardPanel - Side drawer with player scores
 */
export interface LeaderboardPanelProps {
  isOpen: boolean;
  onClose: () => void;
  players: LeaderboardPlayer[];
  currentPlayerId?: string;
}

export interface LeaderboardPlayer {
  id: string;
  displayName: string;
  avatarEmoji?: string | null;
  score: number;
  isCurrentPlayer?: boolean;
}
