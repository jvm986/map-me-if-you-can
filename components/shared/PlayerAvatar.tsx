import { getPlayerColor, getPlayerInitials } from '@/lib/player-utils';

interface PlayerAvatarProps {
  displayName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PlayerAvatar({
  displayName,
  size = 'md',
  className = '',
}: PlayerAvatarProps) {
  const initials = getPlayerInitials(displayName);
  const colorClass = getPlayerColor(displayName);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center text-white font-bold ${className}`}
      title={displayName}
    >
      {initials}
    </div>
  );
}
