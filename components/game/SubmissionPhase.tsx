'use client';

import { parse as parseExif } from 'exifr';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { startPlaying, submitPhoto, uploadPhoto } from '@/lib/game-actions';
import { resampleImage } from '@/lib/image-utils';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [exifLocation, setExifLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const hasSubmitted = submissions.some((s) => s.player_id === currentPlayer?.id);
  const isHost = currentPlayer?.is_host;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset location state for new file
    setLocation(null);
    setExifLocation(null);

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
      } catch (error) {
        // EXIF extraction failed or no GPS data - user will need to select manually
        console.log('No GPS data in photo:', error);
      }

      // Resample image if it's too large (>1MB)
      const resampledFile = await resampleImage(file);

      setSelectedFile(resampledFile);
      // Create preview URL
      const url = URL.createObjectURL(resampledFile);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Error processing image:', error);
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
        setIsSubmitting(false);
        return;
      }

      // Submit photo data
      const submitResult = await submitPhoto(
        game.id,
        currentPlayer.id,
        uploadResult.url,
        location.lat,
        location.lng,
        caption || undefined
      );

      if (submitResult.success) {
        // Clear form
        setSelectedFile(null);
        setPreviewUrl(null);
        setCaption('');
        setLocation(null);
        setExifLocation(null);
      }
    } catch (error) {
      console.error(error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Submit Your Photo</h1>
          <p className="text-lg text-gray-600">Upload a travel photo and mark where it was taken</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Submission Form */}
          <div className="md:col-span-2">
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
                        required
                      />
                    </div>

                    {/* Caption */}
                    <div className="space-y-2">
                      <Label htmlFor="caption">Caption (Optional)</Label>
                      <Input
                        id="caption"
                        type="text"
                        placeholder="e.g., Breakfast somewhere sunny..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
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
                      {location && (
                        <p className="text-sm text-gray-600">
                          Selected: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !selectedFile || !location}
                      className="w-full"
                      size="lg"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Photo'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <h3 className="text-2xl font-bold mb-2">Photo Submitted!</h3>
                    <p className="text-gray-600 mb-6">
                      {submissions.length === players.length
                        ? isHost
                          ? 'All players have submitted! Click Start Game to start playing.'
                          : 'All players have submitted their photos. Please wait for the host to start the game.'
                        : 'Waiting for other players to submit their photos...'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Photo Preview */}
            {(previewUrl || mySubmission) && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center"
                    style={{ minHeight: '200px' }}
                  >
                    <img
                      src={previewUrl || mySubmission?.image_url}
                      alt="Your travel submission"
                      className="w-full max-h-64 object-contain"
                    />
                  </div>
                  {mySubmission?.caption && (
                    <p className="text-sm text-gray-600 mt-2 text-center italic">
                      `&quot;`{mySubmission.caption}`&quot;`
                    </p>
                  )}
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
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-center">
                    {submissions.length} of {players.length} submitted
                  </p>
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
                  <p className="text-sm text-gray-600">
                    Start the game when enough players have submitted photos (at least 2).
                  </p>
                  <Button
                    onClick={handleStartPlaying}
                    disabled={isStarting || submissions.length < 2}
                    className="w-full"
                  >
                    {isStarting ? 'Starting...' : 'Start Game'}
                  </Button>
                  {submissions.length < 2 && (
                    <p className="text-xs text-amber-600 text-center">
                      Need at least 2 submissions
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
