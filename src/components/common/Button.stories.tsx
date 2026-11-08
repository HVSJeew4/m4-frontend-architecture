import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from './Button';
import { PlusIcon, TrashIcon } from './icons';

// Follows the brief's example: variant as a select control.
const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Click me', onClick: fn() },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'danger', 'ghost'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Delete user' } };
export const Loading: Story = { args: { isLoading: true, children: 'Saving…' } };
export const Disabled: Story = { args: { disabled: true } };
export const Small: Story = { args: { size: 'sm' } };

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <PlusIcon />
        Add user
      </>
    ),
  },
};

/** Icon-only: the accessible name comes from aria-label, as in the brief's delete button. */
export const IconOnly: Story = {
  args: {
    variant: 'ghost',
    'aria-label': 'Delete user John Doe',
    children: <TrashIcon />,
  },
};
