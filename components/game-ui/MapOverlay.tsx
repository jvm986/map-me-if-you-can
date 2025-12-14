'use client';

import { X } from 'lucide-react';
import { Drawer } from 'vaul';
import MapPicker from '@/components/shared/MapPicker';
import { Button } from '@/components/ui/button';
import type { MapOverlayProps } from './types';

/**
 * MapOverlay
 *
 * Bottom sheet/drawer containing map for location guessing.
 * Mobile-first design with full-height on mobile, fixed height on desktop.
 */
export function MapOverlay({
  isOpen,
  onClose,
  onLocationSelect,
  onSubmit,
  selectedLocation,
  submitDisabled = false,
  submitLabel = 'Lock in Guess',
}: MapOverlayProps) {
  const handleSubmit = () => {
    if (selectedLocation && !submitDisabled) {
      onSubmit(selectedLocation);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-background rounded-t-[10px] h-[95vh] sm:h-[600px] max-h-[95vh]">
          {/* Handle */}
          <div className="flex-shrink-0 mx-auto w-12 h-1.5 bg-muted rounded-full mt-4 mb-4" />

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 pb-4">
            <Drawer.Title className="text-lg font-semibold">
              Where was this photo taken?
            </Drawer.Title>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Map */}
          <div className="flex-1 px-4 min-h-0">
            <div className="h-full rounded-lg overflow-hidden border">
              <MapPicker
                onLocationSelect={onLocationSelect}
                selectedLocation={selectedLocation || null}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={!selectedLocation || submitDisabled}
              size="lg"
              className="w-full"
            >
              {submitLabel}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
