import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Alert } from './Alert';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'warning', 'error'] },
  },
  decorators: [(Story) => <div className="max-w-lg">{Story()}</div>],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: { variant: 'info', title: 'Scheduled maintenance', children: 'Sunday 02:00–03:00 UTC.' },
};
export const Success: Story = {
  args: { variant: 'success', title: 'User created', children: 'Ada Lovelace was added.' },
};
export const Warning: Story = {
  args: { variant: 'warning', title: 'Unusual sign-in activity', children: '5 failed attempts.' },
};
// Not named `Error`, which would shadow the global Error constructor in this module.
export const ErrorVariant: Story = {
  name: 'Error',
  args: { variant: 'error', title: 'Could not load users', children: 'Server unavailable.' },
};
export const Dismissible: Story = {
  args: { variant: 'info', title: 'Tip', children: 'You can sort any column.', onDismiss: fn() },
};
