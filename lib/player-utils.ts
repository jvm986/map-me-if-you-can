/**
 * Get player initials from display name
 * Returns up to 2 uppercase initials
 */
export function getPlayerInitials(displayName: string): string {
  if (!displayName) return '?';

  const words = displayName.trim().split(/\s+/);

  if (words.length === 1) {
    // Single word - take first 2 characters
    return words[0].substring(0, 2).toUpperCase();
  }

  // Multiple words - take first letter of first 2 words
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Get a consistent background color for a player based on their name
 */
export function getPlayerColor(displayName: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500',
  ];

  // Simple hash function to consistently assign a color
  let hash = 0;
  for (let i = 0; i < displayName.length; i++) {
    hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
