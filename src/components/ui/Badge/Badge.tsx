import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent' | 'outline';
  size?: 'sm' | 'md';
  dot?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  children,
  className,
}) => {
  return (
    <span className={`${styles.badge} ${styles[`badge--${variant}`]} ${styles[`badge--${size}`]} ${className || ''}`}>
      {dot && <span className={styles.badge__dot} aria-hidden="true" />}
      {icon && <span className={styles.badge__icon} aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
};

// Action badge for audit log
const ACTION_BADGE_VARIANT = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'error',
} as const;

interface ActionBadgeProps {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  label: string;
}

export const ActionBadge: React.FC<ActionBadgeProps> = ({ action, label }) => {
  return (
    <Badge variant={ACTION_BADGE_VARIANT[action] as any} dot size="sm">
      {label}
    </Badge>
  );
};
