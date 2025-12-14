'use client';

import { CheckCircle2, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WaitingMessageProps } from './types';

/**
 * WaitingMessage
 *
 * Floating message for waiting states and info messages.
 * Displays in center of screen with optional spinner.
 */
export function WaitingMessage({
  message,
  submessage,
  variant = 'waiting',
  showSpinner = variant === 'waiting',
}: WaitingMessageProps) {
  const variantStyles = {
    info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
    waiting:
      'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100',
    success:
      'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
  };

  const Icon = variant === 'success' ? CheckCircle2 : Info;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-none">
      <div
        className={cn(
          'bg-background/95 backdrop-blur-sm rounded-lg shadow-xl border-2 px-6 py-5 max-w-sm text-center pointer-events-auto',
          variantStyles[variant]
        )}
      >
        <div className="flex flex-col items-center gap-3">
          {/* Icon or Spinner */}
          {showSpinner ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Icon className="h-8 w-8" />
          )}

          {/* Message */}
          <div className="space-y-1">
            <div className="font-semibold text-lg">{message}</div>
            {submessage && <div className="text-sm opacity-80">{submessage}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
