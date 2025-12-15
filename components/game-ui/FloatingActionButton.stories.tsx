import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FloatingActionButton } from './FloatingActionButton';

const meta = {
  title: 'Game UI/FloatingActionButton',
  component: FloatingActionButton,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['bottom-left', 'bottom-right', 'bottom-center'],
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
} satisfies Meta<typeof FloatingActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MakeGuess: Story = {
  args: {
    label: 'Make a Guess',
    onClick: () => alert('Opening map overlay...'),
    position: 'bottom-center',
    variant: 'primary',
  },
};

export const BottomLeft: Story = {
  args: {
    label: 'Bottom Left',
    onClick: () => console.log('Clicked'),
    position: 'bottom-left',
  },
};

export const BottomRight: Story = {
  args: {
    label: 'Bottom Right',
    onClick: () => console.log('Clicked'),
    position: 'bottom-right',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Secondary Action',
    onClick: () => console.log('Clicked'),
    variant: 'secondary',
    position: 'bottom-center',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Waiting for others...',
    onClick: () => console.log('Should not fire'),
    disabled: true,
    position: 'bottom-center',
  },
};

export const LongLabel: Story = {
  args: {
    label: 'This is a very long button label',
    onClick: () => console.log('Clicked'),
    position: 'bottom-center',
  },
};
