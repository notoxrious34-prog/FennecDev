import React from 'react';
import { LucideIcon } from 'lucide-react';
import styles from './KpiCard.module.css';
import { useCountUp } from '../../../hooks/useCountUp';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  icon: Icon,
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  trend,
  className,
}) => {
  const { count, isAnimating } = useCountUp(value, { duration: 1200 });

  return (
    <article className={`${styles.kpiCard} ${className || ''}`}>
      <div className={styles.kpiCard__iconWrap}>
        <Icon size={24} strokeWidth={2} className={styles.kpiCard__icon} aria-hidden="true" />
      </div>
      <div className={styles.kpiCard__content}>
        <div className={styles.kpiCard__value}>
          <span className={styles.kpiCard__valuePrefix}>{prefix}</span>
          <span className={isAnimating ? styles['kpiCard__value--animating'] : ''}>{count}</span>
          <span className={styles.kpiCard__valueSuffix}>{suffix}</span>
        </div>
        <p className={styles.kpiCard__label}>{label}</p>
        {trend && (
          <div className={`${styles.kpiCard__trend} ${styles[`kpiCard__trend--${trend.direction}`]}`}>
            <span className={styles.kpiCard__trendLabel}>{trend.label}</span>
            <span className={styles.kpiCard__trendValue}>
              {trend.direction === 'up' && '+'}
              {trend.value}%
            </span>
          </div>
        )}
      </div>
    </article>
  );
};
