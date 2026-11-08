import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from './icons';
import { Pagination, type PaginationProps } from './Pagination';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Set to make the column sortable; passed to onSortChange. */
  sortKey?: string;
  className?: string;
}

export interface TableSort {
  by: string;
  order: 'asc' | 'desc';
}

export interface TableProps<T> {
  /** Names the table for screen readers. */
  caption: string;
  captionHidden?: boolean;
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  sort?: TableSort;
  onSortChange?: (sortKey: string) => void;
  isLoading?: boolean;
  /** True while new data loads but old rows are still shown. */
  isFetching?: boolean;
  emptyMessage?: ReactNode;
  pagination?: PaginationProps;
}

export function Table<T>({
  caption,
  captionHidden,
  columns,
  rows,
  getRowId,
  sort,
  onSortChange,
  isLoading,
  isFetching,
  emptyMessage = 'No results.',
  pagination,
}: TableProps<T>) {
  return (
    <div className="flex flex-col gap-4">
      {/* Wide tables scroll inside this region on small screens; tabIndex lets keyboard users scroll it. */}
      <div
        className="overflow-x-auto rounded-lg border border-slate-200 bg-white"
        role="region"
        aria-label={caption}
        tabIndex={0}
      >
        <table
          className={cn('w-full text-left text-sm', isFetching && 'opacity-60')}
          aria-busy={isLoading || isFetching || undefined}
        >
          <caption className={captionHidden ? 'sr-only' : 'px-4 py-3 text-left font-semibold'}>
            {caption}
          </caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
            <tr>
              {columns.map((column) => {
                const active = column.sortKey !== undefined && sort?.by === column.sortKey;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn('px-4 py-3 font-semibold whitespace-nowrap', column.className)}
                    // aria-sort only on the column the table is sorted by.
                    aria-sort={
                      active ? (sort?.order === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                  >
                    {column.sortKey && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => onSortChange(column.sortKey!)}
                        className="-mx-2 inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none"
                      >
                        {column.header}
                        {active && sort?.order === 'asc' && <ArrowUpIcon className="h-4 w-4" />}
                        {active && sort?.order === 'desc' && <ArrowDownIcon className="h-4 w-4" />}
                        {!active && <ChevronsUpDownIcon className="h-4 w-4 text-slate-500" />}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading &&
              Array.from({ length: 5 }, (_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-full max-w-40" />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-700">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((row) => (
                <tr key={getRowId(row)} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td key={column.key} className={cn('px-4 py-3', column.className)}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {pagination && !isLoading && rows.length > 0 && <Pagination {...pagination} />}
    </div>
  );
}
