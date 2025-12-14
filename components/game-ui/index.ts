/**
 * Game UI Components
 *
 * Presentational (dumb) components for the immersive game UI.
 * These components are purely visual with no business logic.
 */

export { FloatingActionButton } from './FloatingActionButton';
export { FloatingHeader } from './FloatingHeader';
export { FullscreenImageViewer } from './FullscreenImageViewer';
export { MapOverlay } from './MapOverlay';
export { ResultsOverlay } from './ResultsOverlay';
export type {
  FloatingActionButtonProps,
  FloatingHeaderProps,
  FullscreenImageViewerProps,
  GuessResult,
  LeaderboardPanelProps,
  LeaderboardPlayer,
  MapOverlayProps,
  ResultsOverlayProps,
  WaitingMessageProps,
} from './types';
export { WaitingMessage } from './WaitingMessage';
