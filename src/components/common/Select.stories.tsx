import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './Select';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'user', label: 'User' },
];

const meta = {
  title: 'Components/Select',
  component: Select,
  args: { label: 'Role', options: ROLE_OPTIONS },
  decorators: [(Story) => <div className="max-w-sm">{Story()}</div>],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = { args: { placeholder: 'All roles' } };
export const MultiSelect: Story = {
  args: { label: 'Roles', multiple: true, defaultValue: ['admin', 'editor'] },
};
export const WithError: Story = { args: { placeholder: 'Choose…', error: 'Choose a role' } };
