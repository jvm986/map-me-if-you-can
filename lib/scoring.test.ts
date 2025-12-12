import { describe, expect, it } from 'vitest';
import { calculateDistance, calculateLocationScore } from './scoring';

describe('calculateDistance', () => {
  it('should calculate correct distance between New York and London using Haversine formula', () => {
    const newYork = { lat: 40.7128, lng: -74.006 };
    const london = { lat: 51.5074, lng: -0.1278 };
    const distance = calculateDistance(newYork, london);

    // Expected distance is approximately 5570 km
    // Allow 1% margin of error due to Earth's shape simplification
    expect(distance).toBeGreaterThan(5500);
    expect(distance).toBeLessThan(5650);
  });
});

describe('calculateLocationScore', () => {
  it('should return correct scores based on distance with linear decay', () => {
    // Perfect guess = max score
    expect(calculateLocationScore(0)).toBe(5000);

    // Linear decay: 5000 - distance
    expect(calculateLocationScore(1000)).toBe(4000);
    expect(calculateLocationScore(2500)).toBe(2500);

    // At threshold, score is 0
    expect(calculateLocationScore(5000)).toBe(0);

    // Beyond threshold, score remains 0
    expect(calculateLocationScore(10000)).toBe(0);
  });
});
