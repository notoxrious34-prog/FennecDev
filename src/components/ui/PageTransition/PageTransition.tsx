import React from 'react';
import styles from './PageTransition.module.css';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <div className={styles.transition}>
      {children}
    </div>
  );
};
