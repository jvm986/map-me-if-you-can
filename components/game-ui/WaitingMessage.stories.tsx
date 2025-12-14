import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { WaitingMessage } from './WaitingMessage';

const meta = {
  title: 'Game UI/WaitingMessage',
  component: WaitingMessage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'waiting', 'success'],
    },
  },
} satisfies Meta<typeof WaitingMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WaitingForPlayers: Story = {
  args: {
    message: 'Waiting for other players...',
    submessage: '2 of 4 players have submitted guesses',
    variant: 'waiting',
    showSpinner: true,
  },
};

export const Info: Story = {
  args: {
    message: 'Round 2 starting soon',
    submessage: 'Get ready to guess the next location',
    variant: 'info',
    showSpinner: false,
  },
};

export const Success: Story = {
  args: {
    message: 'Guess submitted!',
    submessage: 'Waiting for other players to finish',
    variant: 'success',
    showSpinner: false,
  },
};

export const SimpleWaiting: Story = {
  args: {
    message: 'Loading game...',
    variant: 'waiting',
  },
};

export const LongMessage: Story = {
  args: {
    message: 'Please wait while we calculate the final scores',
    submessage: 'This may take a moment as we process all player guesses and distances',
    variant: 'waiting',
    showSpinner: true,
  },
};

export const NoSpinner: Story = {
  args: {
    message: 'All players have guessed!',
    submessage: 'The host will reveal results shortly',
    variant: 'info',
    showSpinner: false,
  },
};
