import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from './Tabs';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity' },
  { value: 'settings', label: 'Settings' },
];

/** Controlled: the story owns the selected value and shows it below. */
function ControlledTabs({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <Tabs label="Account sections" tabs={TABS} value={value} onChange={setValue}>
        <p className="text-slate-700">
          Content for <strong>{TABS.find((t) => t.value === value)?.label}</strong>.
        </p>
      </Tabs>
      <p className="mt-6 text-sm text-slate-600">
        Parent state: <code>{value}</code> — use ← → Home End to move between tabs.
      </p>
    </>
  );
}

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  args: {
    label: 'Account sections',
    tabs: TABS,
    value: 'overview',
    onChange: () => {},
    children: null,
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Controlled: Story = { render: () => <ControlledTabs initial="overview" /> };
export const StartsOnSecondTab: Story = { render: () => <ControlledTabs initial="activity" /> };
