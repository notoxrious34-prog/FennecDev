import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius,
  className,
  animate = true,
}) => {
  return (
    <div
      className={`${styles.skeleton} ${!animate ? styles['skeleton--static'] : ''} ${className || ''}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
};

// Compound components
Skeleton.Text = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height="14px" className={styles['text-line']} />
    ))}
  </div>
);

Skeleton.Avatar = ({ size = 40, className }: { size?: number; className?: string }) => (
  <Skeleton width={size} height={size} borderRadius="var(--radius-full)" className={`${styles.avatar} ${className || ''}`} />
);

Skeleton.Card = ({ className }: { className?: string }) => (
  <div className={className} style={{ padding: 'var(--space-6)' }}>
    <Skeleton.Avatar />
    <div style={{ marginTop: 'var(--space-4)' }}>
      <Skeleton height="24px" width="60%" style={{ marginBottom: 'var(--space-2)' }} />
      <Skeleton height="14px" width="40%" />
    </div>
    <div style={{ marginTop: 'var(--space-4)' }}>
      <Skeleton.Text lines={2} />
    </div>
  </div>
);

Skeleton.KpiCard = ({ className }: { className?: string }) => (
  <div className={className} style={{ padding: 'var(--space-6)' }}>
    <Skeleton height="36px" width="36px" borderRadius="var(--radius-sm)" style={{ marginBottom: 'var(--space-3)' }} />
    <Skeleton height="40px" width="120px" className={styles['kpi-value']} style={{ marginBottom: 'var(--space-2)' }} />
    <Skeleton height="12px" width="80px" className={styles['kpi-label']} />
  </div>
);

Skeleton.TableRow = ({ columns = ['40%', '20%', '15%', '15%', '10%'], className }: { columns?: string[]; className?: string }) => (
  <tr aria-hidden="true" className={className}>
    {columns.map((width, i) => (
      <td key={i} style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <Skeleton width={width} height="14px" />
      </td>
    ))}
  </tr>
);
