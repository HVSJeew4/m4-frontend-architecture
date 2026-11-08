import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axeViolations } from '@/test/axe';
import { Table, type Column } from './Table';

interface Row {
  id: string;
  name: string;
  age: number;
}

const ROWS: Row[] = [
  { id: '1', name: 'Ada', age: 36 },
  { id: '2', name: 'Grace', age: 45 },
];
const COLUMNS: Column<Row>[] = [
  { key: 'name', header: 'Name', sortKey: 'name', render: (r) => r.name },
  { key: 'age', header: 'Age', sortKey: 'age', render: (r) => r.age },
  { key: 'note', header: 'Note', render: () => '—' },
];

describe('Table', () => {
  it('renders a captioned table with a header row and one row per item', () => {
    render(<Table caption="People" columns={COLUMNS} rows={ROWS} getRowId={(r) => r.id} />);
    const table = screen.getByRole('table', { name: 'People' });
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Name', 'Age', 'Note']);
  });

  it('marks the sorted column with aria-sort and sorts on header click', async () => {
    const onSortChange = vi.fn();
    render(
      <Table
        caption="People"
        columns={COLUMNS}
        rows={ROWS}
        getRowId={(r) => r.id}
        sort={{ by: 'age', order: 'desc' }}
        onSortChange={onSortChange}
      />,
    );
    expect(screen.getByRole('columnheader', { name: 'Age' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(screen.getByRole('columnheader', { name: 'Name' })).not.toHaveAttribute('aria-sort');
    // Only sortable columns get a button.
    expect(
      within(screen.getByRole('columnheader', { name: 'Note' })).queryByRole('button'),
    ).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(onSortChange).toHaveBeenCalledWith('name');
  });

  it('paginates', async () => {
    const onPageChange = vi.fn();
    render(
      <Table
        caption="People"
        columns={COLUMNS}
        rows={ROWS}
        getRowId={(r) => r.id}
        pagination={{ page: 1, totalPages: 3, total: 6, pageSize: 2, onPageChange }}
      />,
    );
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(within(nav).getByText('Showing 1–2 of 6')).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await userEvent.click(within(nav).getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('shows skeleton rows while loading and a message when empty', () => {
    const { rerender } = render(
      <Table caption="People" columns={COLUMNS} rows={[]} getRowId={(r) => r.id} isLoading />,
    );
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByRole('row')).toHaveLength(6); // header + 5 skeleton rows

    rerender(
      <Table
        caption="People"
        columns={COLUMNS}
        rows={[]}
        getRowId={(r) => r.id}
        emptyMessage="Nobody here"
      />,
    );
    expect(screen.getByText('Nobody here')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Table
        caption="People"
        columns={COLUMNS}
        rows={ROWS}
        getRowId={(r) => r.id}
        onSortChange={() => {}}
      />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
