import { Location } from '@/types/game';

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the location score based on distance
 * Closer guesses get more points (max 5000 points)
 * Score decreases linearly with distance
 */
export function calculateLocationScore(distanceKm: number): number {
  const maxScore = 5000;
  const maxDistance = 5000; // After 5000km, score is 0

  if (distanceKm >= maxDistance) return 0;

  const score = Math.max(0, maxScore - distanceKm);
  return Math.round(score);
}

/**
 * Calculate bonus points for guessing the correct photo owner
 * @deprecated No longer used - owner guessing removed from game
 */
export function calculateOwnerBonus(_guessedOwnerId: string, _actualOwnerId: string): number {
  return 0; // Owner bonus disabled
}

/**
 * Calculate total score for a guess
 */
export function calculateTotalScore(
  distanceKm: number,
  _guessedOwnerId: string,
  _actualOwnerId: string
): {
  locationScore: number;
  ownerBonus: number;
  totalScore: number;
} {
  const locationScore = calculateLocationScore(distanceKm);
  const ownerBonus = 0; // Owner bonus disabled
  const totalScore = locationScore;

  return {
    locationScore,
    ownerBonus,
    totalScore,
  };
}
