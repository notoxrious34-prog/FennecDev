import React from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './TableEmptyState.module.css';

interface TableEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  icon: Icon,
  title,
  subtitle,
  action,
}) => {
  return (
    <div className={styles.emptyState}>
      {Icon && (
        <div className={styles.emptyState__iconWrap}>
          <Icon size={32} strokeWidth={1.5} aria-hidden="true" />
        </div>
      )}
      <h3 className={styles.emptyState__title}>{title}</h3>
      {subtitle && <p className={styles.emptyState__subtitle}>{subtitle}</p>}
      {action && <div className={styles.emptyState__action}>{action}</div>}
    </div>
  );
};
