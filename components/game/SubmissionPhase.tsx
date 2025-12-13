'use client';

import { parse as parseExif } from 'exifr';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { startPlaying, submitPhoto, uploadPhoto } from '@/lib/game-actions';
import { resampleImageWithFallback } from '@/lib/image-utils';
import { Game, Location, PhotoSubmission, Player } from '@/types/game';
import MapPicker from '../shared/MapPicker';
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
  const [location, setLocation] = useState<Location | null>(null);
  const [exifLocation, setExifLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasSubmitted = submissions.some((s) => s.player_id === currentPlayer?.id);
  const isHost = currentPlayer?.is_host;

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
    setLocation(null);
    setExifLocation(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !location || !currentPlayer) {
      return;
    }

    setIsSubmitting(true);
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
        setLocation(null);
        setExifLocation(null);
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

  // Show loading state during hydration to prevent mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center mb-8">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mx-auto mb-2" />
            <div className="h-6 w-96 bg-gray-200 rounded animate-pulse mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Submit Your Photo</h1>
          <p className="text-lg text-gray-600">Upload a travel photo and mark where it was taken</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Submission Form */}
          <div className="lg:col-span-2">
            {!hasSubmitted ? (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Your Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File Input */}
                    <div className="space-y-2">
                      <Label htmlFor="photo">Photo</Label>
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isProcessing}
                        required
                      />
                    </div>

                    {/* Map Picker */}
                    <div className="space-y-2">
                      <Label>Where was this photo taken? *</Label>
                      <div className="h-96 rounded-lg overflow-hidden border">
                        <MapPicker
                          onLocationSelect={setLocation}
                          selectedLocation={location}
                          initialCenter={exifLocation || undefined}
                          zoom={exifLocation ? 8 : 2}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || isProcessing || !selectedFile || !location}
                      className="w-full"
                      size="lg"
                    >
                      {isSubmitting
                        ? 'Submitting...'
                        : isProcessing
                          ? 'Processing...'
                          : 'Submit Photo'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
                {/* Background Image - fills frame completely */}
                {mySubmission?.image_url && (
                  <>
                    <Image
                      src={mySubmission.image_url}
                      alt="Your submitted location"
                      fill
                      className="object-cover"
                    />
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-black/50" />
                  </>
                )}

                {/* Text Content Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-8 shadow-xl max-w-md">
                    <h3 className="text-3xl font-bold mb-3 text-gray-900">Photo Submitted! ✓</h3>
                    <p className="text-gray-600">
                      {submissions.length === players.length
                        ? isHost
                          ? 'All players have submitted! Click Start Game to start playing.'
                          : 'All players have submitted their photos. Please wait for the host to start the game.'
                        : 'Waiting for other players to submit their photos...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Photo Preview - only show during upload, not after submission */}
            {previewUrl && !hasSubmitted && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center relative"
                    style={{ minHeight: '256px', height: '256px' }}
                  >
                    <Image
                      src={previewUrl}
                      alt="Submission preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submission Status */}
            {/* Submission Status */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.map((player) => {
                    const hasPlayerSubmitted = submissions.some((s) => s.player_id === player.id);
                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <PlayerAvatar displayName={player.display_name} size="sm" />
                          <span className="text-sm">{player.display_name}</span>
                        </div>
                        {hasPlayerSubmitted ? (
                          <Badge variant="default">✓</Badge>
                        ) : (
                          <Badge variant="outline">Waiting</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Host Controls */}
            {isHost && (
              <Card>
                <CardHeader>
                  <CardTitle>Host Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleStartPlaying}
                    disabled={isStarting || submissions.length < 2}
                    className="w-full"
                  >
                    {isStarting ? 'Starting...' : 'Start Game'}
                  </Button>
                  <p className="text-xs text-center text-gray-500">
                    {submissions.length} of {players.length} submitted
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
