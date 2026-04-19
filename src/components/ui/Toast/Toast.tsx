import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import styles from './Toast.module.css';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  options: { duration?: number; action?: { label: string; onClick: () => void } };
  onDismiss: (id: string) => void;
  index: number;
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const Toast: React.FC<ToastProps> = ({ id, type, message, options, onDismiss, index }) => {
  const Icon = ICONS[type];

  return (
    <div
      className={`${styles.toast} ${styles[`toast--${type}`]}`}
      style={{ '--toast-duration': `${options.duration ?? 4000}ms` } as React.CSSProperties}
    >
      <div className={styles.toast__icon} aria-hidden="true">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className={styles.toast__body}>
        <p className={styles.toast__message}>{message}</p>
        {options.action && (
          <button
            className={styles.toast__actionBtn}
            onClick={() => {
              options.action.onClick();
              onDismiss(id);
            }}
          >
            {options.action.label}
          </button>
        )}
      </div>
      <button
        className={styles.toast__close}
        onClick={() => onDismiss(id)}
        aria-label="Close notification"
      >
        <X size={16} strokeWidth={2} aria-hidden="true" />
      </button>
      {options.duration !== 0 && <div className={styles.toast__progress} />}
    </div>
  );
};
