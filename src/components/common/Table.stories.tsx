import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, type Column, type TableSort } from './Table';

interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
}

const NAMES = [
  'Ada',
  'Grace',
  'Linus',
  'Margaret',
  'Alan',
  'Barbara',
  'Dennis',
  'Frances',
  'Ken',
  'Radia',
  'Tim',
  'Hedy',
];
const PEOPLE: Person[] = NAMES.map((name, i) => ({
  id: String(i + 1),
  name,
  email: `${name.toLowerCase()}@example.com`,
  role: ['admin', 'editor', 'user'][i % 3]!,
}));

const COLUMNS: Column<Person>[] = [
  { key: 'name', header: 'Name', sortKey: 'name', render: (p) => p.name },
  { key: 'email', header: 'Email', sortKey: 'email', render: (p) => p.email },
  {
    key: 'role',
    header: 'Role',
    sortKey: 'role',
    render: (p) => <span className="capitalize">{p.role}</span>,
  },
];

const PAGE_SIZE = 5;

/** Sorting and paging done locally here; in the app the server does it. */
function SortableTable() {
  const [sort, setSort] = useState<TableSort>({ by: 'name', order: 'asc' });
  const [page, setPage] = useState(1);
  const sorted = useMemo(() => {
    const key = sort.by as keyof Person;
    const direction = sort.order === 'asc' ? 1 : -1;
    return [...PEOPLE].sort((a, b) => a[key].localeCompare(b[key]) * direction);
  }, [sort]);

  return (
    <Table
      caption="Team members"
      columns={COLUMNS}
      rows={sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
      getRowId={(p) => p.id}
      sort={sort}
      onSortChange={(by) => {
        setSort((s) => ({ by, order: s.by === by && s.order === 'asc' ? 'desc' : 'asc' }));
        setPage(1);
      }}
      pagination={{
        page,
        totalPages: Math.ceil(PEOPLE.length / PAGE_SIZE),
        total: PEOPLE.length,
        pageSize: PAGE_SIZE,
        onPageChange: setPage,
      }}
    />
  );
}

const meta = {
  title: 'Components/Table',
  component: Table<Person>,
  args: {
    caption: 'Team members',
    columns: COLUMNS,
    rows: PEOPLE.slice(0, 5),
    getRowId: (p: Person) => p.id,
  },
} satisfies Meta<typeof Table<Person>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SortableWithPagination: Story = { render: () => <SortableTable /> };
export const Loading: Story = { args: { rows: [], isLoading: true } };
export const Empty: Story = { args: { rows: [], emptyMessage: 'No team members yet.' } };
