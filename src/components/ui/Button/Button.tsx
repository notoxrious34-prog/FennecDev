import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { useI18n } from '../../../i18n/i18nContext';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent-ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const { direction } = useI18n();

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={`${styles.btn} ${styles[`btn--${variant}`]} ${styles[`btn--${size}`]} ${fullWidth ? styles['btn--full-width'] : ''} ${isLoading ? styles['btn--loading'] : ''} ${className || ''}`}
        {...props}
      >
        {isLoading && (
          <div className={styles.btn__spinnerWrap}>
            <span className={styles.btn__spinner} aria-hidden="true" />
          </div>
        )}
        <span className={isLoading ? styles.btn__contentHidden : ''}>
          {leftIcon && (
            <span className={`${styles.btn__icon} ${styles.btn__iconLeft}`} aria-hidden="true">
              {leftIcon}
            </span>
          )}
          {isLoading && loadingText ? loadingText : children}
          {rightIcon && (
            <span className={`${styles.btn__icon} ${styles.btn__iconRight}`} aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
