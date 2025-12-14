import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import type { Location } from '@/types/game';
import { MapOverlay } from './MapOverlay';

const meta = {
  title: 'Game UI/MapOverlay',
  component: MapOverlay,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Bottom sheet/drawer containing map for location guessing. Note: Requires Google Maps API key in environment to function properly.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MapOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive version with state
export const Interactive: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Close'),
    onLocationSelect: (location) => console.log('Location selected:', location),
    onSubmit: (location) => console.log('Location submitted:', location),
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(undefined);

    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Open Map Overlay
        </button>
        <MapOverlay
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          selectedLocation={selectedLocation}
          onLocationSelect={setSelectedLocation}
          onSubmit={(location) => {
            console.log('Submitted location:', location);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
};

export const Open: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Close'),
    onLocationSelect: (location) => console.log('Location selected:', location),
    onSubmit: (location) => console.log('Location submitted:', location),
    submitLabel: 'Lock in Guess',
  },
};

export const WithSelectedLocation: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Close'),
    onLocationSelect: (location) => console.log('Location selected:', location),
    onSubmit: (location) => console.log('Location submitted:', location),
    selectedLocation: { lat: 40.7128, lng: -74.006 },
    submitLabel: 'Lock in Guess',
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => console.log('Close'),
    onLocationSelect: (location) => console.log('Location selected:', location),
    onSubmit: (location) => console.log('Location submitted:', location),
  },
};

export const CustomSubmitLabel: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Close'),
    onLocationSelect: (location) => console.log('Location selected:', location),
    onSubmit: (location) => console.log('Location submitted:', location),
    submitLabel: 'Confirm Location',
  },
};

export const SubmitDisabled: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Close'),
    onLocationSelect: (location) => console.log('Location selected:', location),
    onSubmit: (location) => console.log('Location submitted:', location),
    selectedLocation: { lat: 40.7128, lng: -74.006 },
    submitDisabled: true,
    submitLabel: 'Submitting...',
  },
};
