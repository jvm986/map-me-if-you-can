'use client';

import { parse as parseExif } from 'exifr';
import { ImagePlus, MapPin } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FloatingActionButton } from '@/components/game-ui/FloatingActionButton';
import { FloatingHeader } from '@/components/game-ui/FloatingHeader';
import { MapOverlay } from '@/components/game-ui/MapOverlay';
import { WaitingMessage } from '@/components/game-ui/WaitingMessage';
import { startPlaying, submitPhoto, uploadPhoto } from '@/lib/game-actions';
import { resampleImageWithFallback } from '@/lib/image-utils';
import { Game, Location, PhotoSubmission, Player } from '@/types/game';
import PlayerAvatar from '../shared/PlayerAvatar';

interface SubmissionPhaseProps {
  game: Game;
  players: Player[];
  submissions: PhotoSubmission[];
  currentPlayer?: Player;
  gameCode: string;
}

export default function SubmissionPhase({
  game,
  players,
  submissions,
  currentPlayer,
  gameCode,
}: SubmissionPhaseProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | undefined>(undefined);
  const [exifLocation, setExifLocation] = useState<Location | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const hasSubmitted = submissions.some((s) => s.player_id === currentPlayer?.id);
  const isHost = currentPlayer?.is_host;

  // File input ref for triggering from button
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Track mount status to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cleanup preview URL on unmount or when it changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous state
    setLocation(undefined);
    setExifLocation(undefined);
    setIsProcessing(true);

    // Revoke old preview URL if exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    try {
      // Try to extract GPS location from EXIF data before resampling
      try {
        const exif = await parseExif(file);

        if (exif?.latitude && exif?.longitude) {
          const extractedLocation = {
            lat: exif.latitude,
            lng: exif.longitude,
          };
          setExifLocation(extractedLocation);
          setLocation(extractedLocation);
        }
      } catch (exifError) {
        // EXIF extraction failed or no GPS data - user will need to select manually
        console.log('No GPS data in photo:', exifError);
      }

      // Resample image with fallback for mobile compatibility
      const resampledFile = await resampleImageWithFallback(file);

      setSelectedFile(resampledFile);
      // Create preview URL
      const url = URL.createObjectURL(resampledFile);
      setPreviewUrl(url);
      toast.success('Image processed successfully!');
    } catch (error) {
      console.error('Error processing image:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to process image. Please try a different photo.';
      toast.error(errorMessage);
      setSelectedFile(null);
      // Reset file input
      e.target.value = '';
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (location: Location) => {
    if (!selectedFile || !currentPlayer) {
      return;
    }

    setIsSubmitting(true);
    setShowMap(false);

    try {
      // Upload photo
      const uploadResult = await uploadPhoto(selectedFile, gameCode);
      if (!uploadResult.success || !uploadResult.url) {
        toast.error(uploadResult.error || 'Failed to upload photo. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Submit photo data
      const submitResult = await submitPhoto(
        game.id,
        currentPlayer.id,
        uploadResult.url,
        location.lat,
        location.lng
      );

      if (submitResult.success) {
        toast.success('Photo submitted successfully!');
        // Clear form
        setSelectedFile(null);
        setPreviewUrl(null);
        setLocation(undefined);
        setExifLocation(undefined);
      } else {
        toast.error(submitResult.error || 'Failed to submit photo. Please try again.');
      }
    } catch (error) {
      console.error(error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartPlaying = async () => {
    if (submissions.length < 2) {
      return;
    }

    setIsStarting(true);
    try {
      const result = await startPlaying(gameCode);
      if (result.success) {
        // Don't reset isStarting - let the component unmount when phase changes
        // This keeps the button disabled until the phase actually updates
      } else {
        setIsStarting(false); // Only reset on error
      }
    } catch (error) {
      console.error(error);
      setIsStarting(false); // Only reset on error
    }
  };

  const mySubmission = submissions.find((s) => s.player_id === currentPlayer?.id);

  const submittedCount = submissions.length;
  const totalPlayers = players.length;
  const allSubmitted = submittedCount === totalPlayers;

  // Show loading state during hydration to prevent mismatch
  if (!mounted) {
    return (
      <div className="relative h-screen w-screen overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
      </div>
    );
  }

  const waitingMessage = hasSubmitted
    ? {
        message: allSubmitted
          ? isHost
            ? 'All players submitted!'
            : 'All players submitted!'
          : `Waiting for ${totalPlayers - submittedCount} more ${totalPlayers - submittedCount === 1 ? 'player' : 'players'}...`,
        submessage: allSubmitted
          ? isHost
            ? 'Click Start Game when ready'
            : 'Waiting for host to start'
          : `${submittedCount}/${totalPlayers} photos submitted`,
        variant: allSubmitted ? ('success' as const) : ('waiting' as const),
      }
    : undefined;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Background - gradient or submitted photo */}
      {hasSubmitted && mySubmission?.image_url ? (
        <>
          <Image src={mySubmission.image_url} alt="Your submitted photo" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </>
      ) : previewUrl ? (
        <>
          <Image src={previewUrl} alt="Preview" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
      )}

      {/* Floating Header */}
      <FloatingHeader
        round={0}
        totalRounds={players.length}
        gameCode={gameCode}
        playerCount={players.length}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isProcessing || hasSubmitted}
        className="hidden"
      />

      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto pt-12 pb-20">
        {!hasSubmitted ? (
          <div className="bg-background rounded-lg shadow-xl p-8 max-w-md w-full text-center space-y-6">
            <div>
              <ImagePlus className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h1 className="text-3xl font-bold mb-2">Submit Your Photo</h1>
              <p className="text-muted-foreground">
                Upload a travel photo and mark where it was taken
              </p>
            </div>

            {!selectedFile ? (
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                size="lg"
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Choose Photo'}
              </Button>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex-1 text-left truncate">{selectedFile.name}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setLocation(undefined);
                        setExifLocation(undefined);
                      }}
                    >
                      Change
                    </Button>
                  </div>

                  {location && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <MapPin className="h-4 w-4" />
                      <span>Location marked</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => setShowMap(true)}
                    variant={location ? 'outline' : 'default'}
                    size="lg"
                    className="w-full"
                  >
                    <MapPin className="h-5 w-5 mr-2" />
                    {location ? 'Change Location' : 'Mark Location'}
                  </Button>

                  {location && (
                    <Button
                      onClick={() => handleSubmit(location)}
                      disabled={isSubmitting}
                      size="lg"
                      className="w-full"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Photo'}
                    </Button>
                  )}
                </div>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStatus(true)}
              className="w-full"
            >
              View Status ({submittedCount}/{totalPlayers})
            </Button>
          </div>
        ) : (
          waitingMessage && (
            <WaitingMessage
              message={waitingMessage.message}
              submessage={waitingMessage.submessage}
              variant={waitingMessage.variant}
              showSpinner={!allSubmitted}
            />
          )
        )}
      </div>

      {/* Floating Action Button for Status */}
      {!hasSubmitted && (
        <FloatingActionButton
          label={`Status (${submittedCount}/${totalPlayers})`}
          onClick={() => setShowStatus(true)}
          variant="secondary"
          position="bottom-left"
        />
      )}

      {/* Host Controls FAB */}
      {isHost && allSubmitted && (
        <FloatingActionButton
          label={isStarting ? 'Starting...' : 'Start Game'}
          onClick={handleStartPlaying}
          disabled={isStarting}
          position="bottom-center"
          className="bg-white hover:bg-white/90 text-gray-900"
        />
      )}

      {/* Map Overlay */}
      <MapOverlay
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelect={setLocation}
        onSubmit={handleSubmit}
        selectedLocation={location}
        submitLabel="Confirm Location"
        initialCenter={exifLocation || undefined}
        zoom={exifLocation ? 8 : 2}
      />

      {/* Status Drawer */}
      {showStatus && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Submission Status</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {submittedCount} of {totalPlayers} players have submitted
              </p>
            </div>
            <div className="p-6 space-y-2 max-h-96 overflow-y-auto">
              {players.map((player) => {
                const hasPlayerSubmitted = submissions.some((s) => s.player_id === player.id);
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <PlayerAvatar displayName={player.display_name} size="sm" />
                      <span className="text-sm font-medium">{player.display_name}</span>
                    </div>
                    {hasPlayerSubmitted ? (
                      <Badge>✓ Submitted</Badge>
                    ) : (
                      <Badge variant="outline">Waiting</Badge>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-6 border-t">
              <Button onClick={() => setShowStatus(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
