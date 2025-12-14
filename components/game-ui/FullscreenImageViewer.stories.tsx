import type { Meta, StoryObj } from '@storybook/react';
import { FullscreenImageViewer } from './FullscreenImageViewer';

const meta = {
  title: 'Game UI/FullscreenImageViewer',
  component: FullscreenImageViewer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FullscreenImageViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
    alt: 'Mountain landscape',
  },
};

export const CityPhoto: Story = {
  args: {
    imageUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b',
    alt: 'City street',
  },
};

export const PortraitOrientation: Story = {
  args: {
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
    alt: 'Portrait mountain view',
  },
};

export const WithZoomCallback: Story = {
  args: {
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
    alt: 'Mountain landscape',
    onZoomChange: (scale: number) => {
      console.log('Zoom level:', scale);
    },
  },
};
