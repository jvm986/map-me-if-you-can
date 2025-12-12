/**
 * Resample/resize an image file to ensure mobile compatibility
 * Processes ALL images to reduce file size and prevent memory issues
 * @param file Original image file
 * @param maxWidth Maximum width in pixels (default 1600)
 * @param maxHeight Maximum height in pixels (default 1600)
 * @param quality JPEG quality 0-1 (default 0.85)
 * @returns Resampled file
 */
export async function resampleImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<File> {
  // Create object URL for cleanup later
  let objectUrl: string | null = null;

  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        reject(new Error('Canvas not supported in this browser'));
        return;
      }

      img.onload = () => {
        try {
          // Clean up object URL immediately after load
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
          }

          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;

          // Always resize if larger than max dimensions
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image with high quality settings
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create image blob - may be out of memory'));
                return;
              }

              // Create new file from blob
              const resampledFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              resolve(resampledFile);
            },
            'image/jpeg',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        // Clean up on error
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
        reject(new Error('Failed to load image - file may be corrupted'));
      };

      // Load the image
      objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    });
  } catch (error) {
    // Clean up object URL if we created one
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    throw error;
  }
}

/**
 * Resample with fallback - tries progressively smaller sizes/quality if initial attempt fails
 * This is crucial for memory-constrained mobile devices
 */
export async function resampleImageWithFallback(file: File): Promise<File> {
  const attempts = [
    { maxWidth: 1600, maxHeight: 1600, quality: 0.85 },
    { maxWidth: 1200, maxHeight: 1200, quality: 0.8 },
    { maxWidth: 800, maxHeight: 800, quality: 0.75 },
    { maxWidth: 600, maxHeight: 600, quality: 0.7 },
  ];

  let lastError: Error | null = null;

  for (const attempt of attempts) {
    try {
      return await resampleImage(file, attempt.maxWidth, attempt.maxHeight, attempt.quality);
    } catch (error) {
      console.warn(
        `Resampling failed with ${attempt.maxWidth}x${attempt.maxHeight}@${attempt.quality}`,
        error
      );
      lastError = error as Error;
      // Continue to next attempt
    }
  }

  // All attempts failed
  throw new Error(
    lastError?.message ||
      'Failed to process image - file may be too large or corrupted. Please try a smaller image.'
  );
}
