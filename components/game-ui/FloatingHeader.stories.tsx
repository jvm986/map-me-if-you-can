import type { Meta, StoryObj } from '@storybook/react';
import { FloatingHeader } from './FloatingHeader';

const meta = {
  title: 'Game UI/FloatingHeader',
  component: FloatingHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FloatingHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstRound: Story = {
  args: {
    round: 1,
    totalRounds: 4,
    gameCode: 'ABC12',
    playerCount: 3,
  },
};

export const MidGame: Story = {
  args: {
    round: 2,
    totalRounds: 5,
    gameCode: 'XYZ89',
    playerCount: 6,
  },
};

export const FinalRound: Story = {
  args: {
    round: 4,
    totalRounds: 4,
    gameCode: 'FIN4L',
    playerCount: 4,
  },
};

export const WithMenu: Story = {
  args: {
    round: 1,
    totalRounds: 3,
    gameCode: 'MENU1',
    playerCount: 2,
    onMenuClick: () => alert('Menu clicked!'),
  },
};

export const ManyPlayers: Story = {
  args: {
    round: 3,
    totalRounds: 8,
    gameCode: 'BIG99',
    playerCount: 12,
  },
};
