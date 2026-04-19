import React, { useState } from 'react';
import styles from './FloatingInput.module.css';

interface FloatingInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  isLoading?: boolean;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  error,
  hint,
  leftAddon,
  rightAddon,
  isLoading = false,
  type = 'text',
  id,
  className,
  ...props
}) => {
  const [hasValue, setHasValue] = useState(false);
  const inputDir = (type === 'number' || type === 'tel') ? 'ltr' : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    props.onChange?.(e);
  };

  const fieldId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={`${styles.field} ${error ? styles['field--error'] : ''} ${hasValue ? styles['field--has-value'] : ''} ${className || ''}`}>
      <div className={`${styles.inputWrap} ${leftAddon ? styles['has-left-addon'] : ''} ${rightAddon ? styles['has-right-addon'] : ''}`}>
        {leftAddon && <div className={`${styles.addon} ${styles['addon--left']}`}>{leftAddon}</div>}
        <input
          id={fieldId}
          type={type}
          dir={inputDir}
          placeholder=" "
          className={styles.input}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          onChange={handleChange}
          {...props}
        />
        {rightAddon && <div className={`${styles.addon} ${styles['addon--right']}`}>{isLoading ? <span className={styles.spinner} aria-hidden="true" /> : rightAddon}</div>}
        <label htmlFor={fieldId} className={styles.label}>{label}</label>
      </div>
      {error && (
        <span className={styles.errorMsg} id={`${fieldId}-error`} role="alert">
          {error}
        </span>
      )}
      {hint && !error && (
        <span className={styles.hint} id={`${fieldId}-hint`}>{hint}</span>
      )}
    </div>
  );
};
