'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FloatingActionButtonProps } from './types';

/**
 * FloatingActionButton
 *
 * Primary action button that floats over the image.
 * Positioned at bottom of screen (configurable).
 */
export function FloatingActionButton({
  label,
  onClick,
  disabled = false,
  variant = 'primary',
  position = 'bottom-center',
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={cn('absolute z-30', positionClasses[position])}>
      <Button
        onClick={onClick}
        disabled={disabled}
        size="lg"
        variant={variant === 'secondary' ? 'secondary' : 'default'}
        className="shadow-lg min-w-[160px] font-semibold"
      >
        {label}
      </Button>
    </div>
  );
}
