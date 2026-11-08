import type { Meta, StoryObj } from '@storybook/react-vite';
import { VirtualList } from './VirtualList';

interface Person {
  id: string;
  name: string;
  email: string;
}

const people = (count: number): Person[] =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: `Person ${i + 1}`,
    email: `person${i + 1}@example.com`,
  }));

function Row({ person }: { person: Person }) {
  return (
    <div className="flex h-full flex-col justify-center px-4">
      <span className="font-medium text-slate-900">{person.name}</span>
      <span className="text-sm text-slate-600">{person.email}</span>
    </div>
  );
}

const meta = {
  title: 'Components/VirtualList',
  component: VirtualList<Person>,
  args: {
    label: 'People',
    items: people(10_000),
    height: 480,
    itemHeight: 64,
    getKey: (p: Person) => p.id,
    renderItem: (p: Person) => <Row person={p} />,
  },
  parameters: {
    docs: {
      description: {
        component:
          "The brief's VirtualList: only the visible rows are in the DOM. Each row still reports its real position (aria-posinset / aria-setsize), so screen readers say “item 1 of 10,000”.",
      },
    },
  },
} satisfies Meta<typeof VirtualList<Person>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 10,000 rows – scroll it: the DOM only ever holds about 15. */
export const TenThousandRows: Story = {};
export const Short: Story = { args: { items: people(5), height: 320 } };
