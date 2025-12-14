import type { Meta, StoryObj } from '@storybook/react';
import { ResultsOverlay } from './ResultsOverlay';

const meta = {
  title: 'Game UI/ResultsOverlay',
  component: ResultsOverlay,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ResultsOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreePlayers: Story = {
  args: {
    isOpen: true,
    results: [
      {
        playerName: 'Alice',
        distanceKm: 2.5,
        locationScore: 950,
        ownerBonus: 100,
        totalScore: 1050,
        guessedLocation: { lat: 40.7128, lng: -74.006 },
      },
      {
        playerName: 'Bob',
        distanceKm: 15.3,
        locationScore: 650,
        ownerBonus: 0,
        totalScore: 650,
        guessedLocation: { lat: 40.73, lng: -73.99 },
      },
      {
        playerName: 'Charlie',
        distanceKm: 45.8,
        locationScore: 200,
        ownerBonus: 100,
        totalScore: 300,
        guessedLocation: { lat: 40.8, lng: -73.95 },
      },
    ],
    currentPhoto: {
      imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b',
      trueLocation: { lat: 40.7128, lng: -74.006 },
      locationText: 'New York City, USA',
    },
    onNext: () => console.log('Next round'),
    nextLabel: 'Next Round',
  },
};

export const TwoPlayers: Story = {
  args: {
    isOpen: true,
    results: [
      {
        playerName: 'Player 1',
        distanceKm: 0.5,
        locationScore: 1000,
        ownerBonus: 0,
        totalScore: 1000,
        guessedLocation: { lat: 51.5074, lng: -0.1278 },
      },
      {
        playerName: 'Player 2',
        distanceKm: 125.7,
        locationScore: 50,
        ownerBonus: 0,
        totalScore: 50,
        guessedLocation: { lat: 51.6, lng: -0.2 },
      },
    ],
    currentPhoto: {
      imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
      trueLocation: { lat: 51.5074, lng: -0.1278 },
      locationText: 'London, United Kingdom',
    },
    onNext: () => console.log('Next round'),
  },
};

export const FinalRound: Story = {
  args: {
    isOpen: true,
    results: [
      {
        playerName: 'Winner',
        distanceKm: 1.2,
        locationScore: 980,
        ownerBonus: 100,
        totalScore: 1080,
        guessedLocation: { lat: 48.8566, lng: 2.3522 },
      },
      {
        playerName: 'Second Place',
        distanceKm: 8.5,
        locationScore: 720,
        ownerBonus: 100,
        totalScore: 820,
        guessedLocation: { lat: 48.86, lng: 2.34 },
      },
      {
        playerName: 'Third Place',
        distanceKm: 25.3,
        locationScore: 400,
        ownerBonus: 0,
        totalScore: 400,
        guessedLocation: { lat: 48.9, lng: 2.4 },
      },
    ],
    currentPhoto: {
      imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
      trueLocation: { lat: 48.8566, lng: 2.3522 },
      locationText: 'Paris, France',
    },
    onNext: () => console.log('View final results'),
    nextLabel: 'View Final Results',
  },
};

export const NoLocationText: Story = {
  args: {
    isOpen: true,
    results: [
      {
        playerName: 'Alice',
        distanceKm: 3.2,
        locationScore: 890,
        ownerBonus: 0,
        totalScore: 890,
        guessedLocation: { lat: 35.6762, lng: 139.6503 },
      },
    ],
    currentPhoto: {
      imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
      trueLocation: { lat: 35.6762, lng: 139.6503 },
    },
    onNext: () => console.log('Next'),
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    results: [],
    currentPhoto: {
      imageUrl: '',
      trueLocation: { lat: 0, lng: 0 },
    },
    onNext: () => {},
  },
};
