import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  args: { label: 'Name' },
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'search'] },
  },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = { args: { type: 'text', placeholder: 'Ada Lovelace' } };
export const Email: Story = { args: { label: 'Email', type: 'email', autoComplete: 'email' } };
export const Password: Story = {
  args: { label: 'Password', type: 'password', hint: 'At least 8 characters.' },
};
export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    defaultValue: 'not-an-email',
    error: 'Invalid email address',
  },
};
export const Required: Story = { args: { required: true } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Read only' } };
