'use client';

import { AdvancedMarker, APIProvider, Map as GoogleMap, useMap } from '@vis.gl/react-google-maps';
import { Award, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { calculateGameScores, restartGame } from '@/lib/game-actions';
import { getPlayerColor } from '@/lib/player-utils';
import { cn } from '@/lib/utils';
import { Game, PhotoSubmission, Player } from '@/types/game';
import PlayerAvatar from '../shared/PlayerAvatar';

// Map Tailwind color classes to hex values for SVG
const colorMap: Record<string, string> = {
  'bg-blue-500': '#3B82F6',
  'bg-green-500': '#22C55E',
  'bg-purple-500': '#A855F7',
  'bg-pink-500': '#EC4899',
  'bg-yellow-500': '#EAB308',
  'bg-indigo-500': '#6366F1',
  'bg-red-500': '#EF4444',
  'bg-teal-500': '#14B8A6',
};

interface FinalResultsProps {
  game: Game;
  players: Player[];
  submissions: PhotoSubmission[];
  gameCode: string;
  currentPlayer?: Player;
}

interface MapContentProps {
  submissions: PhotoSubmission[];
  players: Player[];
  onMarkerClick: (index: number) => void;
}

function MapContent({ submissions, players, onMarkerClick }: MapContentProps) {
  const map = useMap();

  // Fit bounds to show all markers on mount
  useEffect(() => {
    if (!map || submissions.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    for (const submission of submissions) {
      bounds.extend({ lat: submission.true_lat, lng: submission.true_lng });
    }
    map.fitBounds(bounds);
  }, [map, submissions]);

  return (
    <>
      {submissions.map((submission, index) => {
        const owner = players.find((p) => p.id === submission.player_id);
        const initial = owner?.display_name?.charAt(0).toUpperCase() || '?';
        const colorClass = getPlayerColor(owner?.display_name || '');
        const hexColor = colorMap[colorClass] || '#3B82F6';
        return (
          <AdvancedMarker
            key={submission.id}
            position={{
              lat: submission.true_lat,
              lng: submission.true_lng,
            }}
            onClick={() => onMarkerClick(index)}
          >
            <svg
              width="28"
              height="42"
              viewBox="0 0 32 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg cursor-pointer hover:scale-110 transition-transform"
            >
              <path
                d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 32 16 32s16-23.163 16-32c0-8.837-7.163-16-16-16z"
                fill={hexColor}
                stroke="white"
                strokeWidth="1.5"
              />
              <text
                x="16"
                y="18"
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
                fontFamily="system-ui"
              >
                {initial}
              </text>
            </svg>
          </AdvancedMarker>
        );
      })}
    </>
  );
}

export default function FinalResults({
  game,
  players,
  submissions,
  gameCode,
  currentPlayer,
}: FinalResultsProps) {
  const router = useRouter();
  const [isRestarting, setIsRestarting] = useState(false);
  const [playerScores, setPlayerScores] = useState<Map<string, number>>(new Map());
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const isHost = currentPlayer?.is_host;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const carouselRef = useRef<HTMLDivElement>(null);

  // Fetch player scores on mount
  useEffect(() => {
    const fetchScores = async () => {
      const scores = await calculateGameScores(game.id);
      setPlayerScores(scores);
    };
    fetchScores();
  }, [game.id]);

  // Sort players by calculated score
  const sortedPlayers = [...players].sort(
    (a, b) => (playerScores.get(b.id) || 0) - (playerScores.get(a.id) || 0)
  );

  const winner = sortedPlayers[0];

  // Default center (will be overridden by fitBounds)
  const defaultCenter = useMemo(() => {
    if (submissions.length === 0) return { lat: 0, lng: 0 };
    const avgLat = submissions.reduce((sum, s) => sum + s.true_lat, 0) / submissions.length;
    const avgLng = submissions.reduce((sum, s) => sum + s.true_lng, 0) / submissions.length;
    return { lat: avgLat, lng: avgLng };
  }, [submissions]);

  const handlePlayAgain = async () => {
    setIsRestarting(true);
    try {
      const result = await restartGame(gameCode);
      if (result.success) {
        // Don't reset isRestarting - let component unmount when game restarts
        // This keeps the button disabled until the phase actually updates
      } else {
        setIsRestarting(false); // Only reset on error
      }
    } catch (error) {
      console.error(error);
      setIsRestarting(false); // Only reset on error
    }
  };

  const navigateToPhoto = (index: number) => {
    if (carouselRef.current) {
      const width = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth',
      });
    }
  };

  const navigatePrevious = () => {
    const newIndex = Math.max(0, currentPhotoIndex - 1);
    navigateToPhoto(newIndex);
  };

  const navigateNext = () => {
    const newIndex = Math.min(submissions.length - 1, currentPhotoIndex + 1);
    navigateToPhoto(newIndex);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Photo Carousel Background */}
      <div
        ref={carouselRef}
        className="absolute inset-0 overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex [&::-webkit-scrollbar]:hidden z-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={(e) => {
          const scrollLeft = e.currentTarget.scrollLeft;
          const width = e.currentTarget.offsetWidth;
          const index = Math.round(scrollLeft / width);
          setCurrentPhotoIndex(index);
        }}
      >
        {submissions.map((submission, index) => (
          <div
            key={submission.id}
            className="w-full h-full flex-shrink-0 snap-center relative"
          >
            <Image
              src={submission.image_url}
              alt={`Submission by ${players.find((p) => p.id === submission.player_id)?.display_name}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
            {/* Dark overlay for readability - inside each slide */}
            <div className="absolute inset-0 bg-black/60 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {submissions.length > 1 && (
        <>
          {currentPhotoIndex > 0 && (
            <button
              type="button"
              onClick={navigatePrevious}
              className="absolute left-8 sm:left-12 top-1/2 -translate-y-1/2 z-40 bg-white/60 hover:bg-white/80 text-gray-900 rounded-full p-2 shadow-md transition-all"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {currentPhotoIndex < submissions.length - 1 && (
            <button
              type="button"
              onClick={navigateNext}
              className="absolute right-8 sm:right-12 top-1/2 -translate-y-1/2 z-40 bg-white/60 hover:bg-white/80 text-gray-900 rounded-full p-2 shadow-md transition-all"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </>
      )}

      {/* Dots indicator - clickable */}
      {submissions.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-40">
          {submissions.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => navigateToPhoto(index)}
              className={cn(
                'h-2 rounded-full transition-all',
                index === currentPhotoIndex
                  ? 'bg-white w-6'
                  : 'bg-white/40 w-2 hover:bg-white/60'
              )}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Winner Celebration & Results */}
      <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto pointer-events-none">
        <div className="w-full max-w-2xl space-y-6 pt-12 pb-20 pointer-events-auto">
          {/* Winner Celebration */}
          <div className="text-center space-y-2 animate-in fade-in duration-500">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto drop-shadow-lg" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
              {winner?.display_name} Wins!
            </h1>
          </div>

          {/* Final Standings */}
          <div className="bg-background rounded-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b bg-muted/50">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Award className="h-6 w-6" />
                Final Standings
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
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

                  {/* Player Avatar & Name */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <PlayerAvatar displayName={player.display_name} size="sm" />
                    <span className="font-semibold truncate">{player.display_name}</span>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0 text-right">
                    <div className="font-bold text-lg">{playerScores.get(player.id) || 0}</div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>

                  {/* Winner Badge */}
                  {index === 0 && <Trophy className="flex-shrink-0 h-6 w-6 text-yellow-500" />}
                </div>
              ))}
            </div>
          </div>

          {/* Map showing all photo locations */}
          <div className="bg-background/90 backdrop-blur-sm rounded-lg overflow-hidden">
            <div className="h-64" onWheel={(e) => e.stopPropagation()}>
              <APIProvider apiKey={apiKey}>
                <GoogleMap
                  mapId="final-results-map"
                  defaultCenter={defaultCenter}
                  defaultZoom={2}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  zoomControl={true}
                  scrollwheel={true}
                >
                  <MapContent
                    submissions={submissions}
                    players={players}
                    onMarkerClick={navigateToPhoto}
                  />
                </GoogleMap>
              </APIProvider>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={() => router.push('/')} variant="outline" size="lg" className="flex-1 bg-background/90 backdrop-blur-sm hover:bg-background">
              Back to Home
            </Button>
            {isHost && (
              <Button onClick={handlePlayAgain} disabled={isRestarting} variant="outline" size="lg" className="flex-1 bg-background/90 backdrop-blur-sm hover:bg-background">
                {isRestarting ? 'Restarting...' : 'Play Again'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
