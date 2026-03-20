/**
 * src/components/ui/DataTable.tsx
 * Oracle Document sections consumed: 7, 9, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import type { ReactNode } from 'react';

export interface Column<T = unknown> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T = unknown> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T = unknown>({ columns, data, emptyMessage = 'No records found.' }: DataTableProps<T>) {
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="muted" style={{ padding: '1.25rem' }}>{emptyMessage}</td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
