import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  elevation?: 'flat' | 'raised' | 'floating';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  accent?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  elevation = 'raised',
  padding = 'md',
  interactive = false,
  accent = false,
  className,
  children,
  onClick,
}) => {
  return (
    <article
      className={`${styles.card} ${styles[`card--${elevation}`]} ${padding !== 'none' ? styles[`card--padding-${padding}`] : ''} ${interactive ? styles['card--interactive'] : ''} ${accent ? styles['card--accent'] : ''} ${className || ''}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      {children}
    </article>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={`${styles.card__header} ${className || ''}`}>{children}</div>
);

export const CardBody: React.FC<CardBodyProps> = ({ children, className }) => (
  <div className={`${styles.card__body} ${className || ''}`}>{children}</div>
);

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={`${styles.card__footer} ${className || ''}`}>{children}</div>
);
