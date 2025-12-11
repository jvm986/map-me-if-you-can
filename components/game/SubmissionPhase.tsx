'use client';

import { useState } from 'react';
import { Game, Player, PhotoSubmission } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { uploadPhoto, submitPhoto, startPlaying } from '@/lib/game-actions';
import { toast } from 'sonner';
import MapPicker from '../shared/MapPicker';
import { Location } from '@/types/game';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const hasSubmitted = submissions.some((s) => s.player_id === currentPlayer?.id);
  const isHost = currentPlayer?.is_host;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !location || !currentPlayer) {
      toast.error('Please select a photo and mark its location on the map');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload photo
      const uploadResult = await uploadPhoto(selectedFile, gameCode);
      if (!uploadResult.success || !uploadResult.url) {
        toast.error(uploadResult.error || 'Failed to upload photo');
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
        toast.success('Photo submitted successfully!');
        // Clear form
        setSelectedFile(null);
        setPreviewUrl(null);
        setCaption('');
        setLocation(null);
      } else {
        toast.error(submitResult.error || 'Failed to submit photo');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartPlaying = async () => {
    if (submissions.length < 2) {
      toast.error('Need at least 2 photo submissions to start playing');
      return;
    }

    setIsStarting(true);
    try {
      const result = await startPlaying(gameCode);
      if (result.success) {
        toast.success('Starting game!');
      } else {
        toast.error(result.error || 'Failed to start game');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📸 Submit Your Photo
          </h1>
          <p className="text-lg text-gray-600">
            Upload a travel photo and mark where it was taken
          </p>
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

                    {/* Preview */}
                    {previewUrl && (
                      <div className="rounded-lg overflow-hidden border">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-64 object-cover"
                        />
                      </div>
                    )}

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
                      <div className="h-64 rounded-lg overflow-hidden border">
                        <MapPicker
                          onLocationSelect={setLocation}
                          selectedLocation={location}
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
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold mb-2">Photo Submitted!</h3>
                    <p className="text-gray-600">
                      Waiting for other players to submit their photos...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submission Status */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.map((player) => {
                    const hasPlayerSubmitted = submissions.some(
                      (s) => s.player_id === player.id
                    );
                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span>{player.avatar_emoji || '👤'}</span>
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
