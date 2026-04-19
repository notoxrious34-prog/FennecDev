import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import styles from './DataTable.module.css';
import { Skeleton } from '../Skeleton/Skeleton';
import { TableEmptyState } from '../TableEmptyState/TableEmptyState';

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'start' | 'end' | 'center';
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  skeletonWidth?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  skeletonRows?: number;
  emptyState?: React.ReactNode;
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  selectedKey?: string | number;
  stickyHeader?: boolean;
  maxHeight?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  skeletonRows = 8,
  emptyState,
  keyExtractor,
  onRowClick,
  selectedKey,
  stickyHeader = false,
  maxHeight,
  className,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof T];
      const bVal = b[sortConfig.key as keyof T];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortConfig.dir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    if (sortConfig?.key === key) {
      if (sortConfig.dir === 'asc') {
        setSortConfig({ key, dir: 'desc' });
      } else {
        setSortConfig(null);
      }
    } else {
      setSortConfig({ key, dir: 'asc' });
    }
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, item: T) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick?.(item);
    }
  };

  return (
    <div className={`${styles.wrapper} ${maxHeight ? styles['wrapper--scrollable'] : ''} ${className || ''}`} style={maxHeight ? { '--table-max-height': maxHeight } as React.CSSProperties : undefined}>
      <table className={styles.table}>
        <thead className={`${styles.thead} ${stickyHeader ? styles['thead--sticky'] : ''}`}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${styles.th} ${col.align === 'end' ? styles['th--end'] : ''} ${col.align === 'center' ? styles['th--center'] : ''} ${col.sortable ? styles['th--sortable'] : ''} ${sortConfig?.key === col.key ? styles['th--sorted'] : ''} ${sortConfig?.key === col.key && sortConfig.dir === 'desc' ? styles['th--sorted-desc'] : ''}`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                {col.header}
                {col.sortable && (
                  <span className={styles.th__sortIcon}>
                    <ChevronUp size={12} aria-hidden="true" />
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <Skeleton.TableRow key={i} columns={columns.map(c => c.skeletonWidth || 'auto')} />
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                {emptyState || <TableEmptyState title="No data found" subtitle="There are no records to display" />}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={`${styles.tr} ${onRowClick ? styles['tr--clickable'] : ''} ${selectedKey === keyExtractor(row) ? styles['tr--selected'] : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (e) => handleRowKeyDown(e, row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${styles.td} ${col.align === 'end' ? styles['td--end'] : ''} ${col.align === 'center' ? styles['td--center'] : ''}`}
                  >
                    {col.render ? col.render(row[col.key as keyof T], row) : String(row[col.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
