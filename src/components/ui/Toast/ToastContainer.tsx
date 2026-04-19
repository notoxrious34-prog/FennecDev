import React from 'react';
import { createPortal } from 'react-dom';
import { useToast } from './ToastContext';
import { Toast } from './Toast';
import styles from './Toast.module.css';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className={styles.container}>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          {...toast}
          index={index}
          onDismiss={dismissToast}
        />
      ))}
    </div>,
    document.body
  );
};
