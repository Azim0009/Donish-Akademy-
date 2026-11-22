import type { ReactNode } from 'react';
import clsx from 'clsx';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  /** скрыть на маленьких экранах */
  hideOnMobile?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
}

export function Table<T>({ columns, rows, rowKey, onRowClick, emptyTitle = '—' }: Props<T>) {
  if (!rows.length) return <EmptyState title={emptyTitle} />;
  return (
    <div className="scroll-thin -mx-5 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-y border-line bg-sunken/60 text-left text-[12px] font-medium text-muted">
            {columns.map((c) => (
              <th key={c.key} className={clsx('px-5 py-2.5 font-medium', c.hideOnMobile && 'hidden md:table-cell', c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={clsx('border-b border-line last:border-0', onRowClick && 'cursor-pointer hover:bg-sunken/50')}
            >
              {columns.map((c) => (
                <td key={c.key} className={clsx('px-5 py-3 align-middle', c.hideOnMobile && 'hidden md:table-cell', c.className)}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
