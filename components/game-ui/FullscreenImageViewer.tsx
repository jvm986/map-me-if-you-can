'use client';

import Image from 'next/image';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type { FullscreenImageViewerProps } from './types';

/**
 * FullscreenImageViewer
 *
 * Displays an image fullscreen with pan and zoom capabilities.
 * Mobile-friendly with touch gestures.
 */
export function FullscreenImageViewer({
  imageUrl,
  alt = 'Game photo',
  onZoomChange,
}: FullscreenImageViewerProps) {
  return (
    <div className="absolute inset-0 bg-black">
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={4}
        centerOnInit
        wheel={{ step: 0.1 }}
        pinch={{ step: 5 }}
        onZoom={(ref) => {
          if (onZoomChange) {
            onZoomChange(ref.state.scale);
          }
        }}
      >
        <TransformComponent
          wrapperClass="!w-full !h-full"
          contentClass="!w-full !h-full flex items-center justify-center"
        >
          <div className="relative w-full h-full">
            <Image src={imageUrl} alt={alt} fill className="object-cover" priority sizes="100vw" />
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
