import React from 'react';

/* ================================================================
   ACCESSIBILITY UTILITIES - PHASE 4B-4
   Focus trap, keyboard navigation, ARIA helpers
   ================================================================ */

/**
 * Trap focus within a container element (for modals, drawers, etc.)
 */
export const trapFocus = (container: HTMLElement) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  container.addEventListener('keydown', handleTab);
  firstElement?.focus();

  return () => {
    container.removeEventListener('keydown', handleTab);
  };
};

/**
 * Handle Escape key to close modals/drawers
 */
export const useEscapeKey = (callback: () => void, isActive = true) => {
  React.useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [callback, isActive]);
};

/**
 * Announce screen reader messages
 */
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Get ARIA label for action types
 */
export const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    CREATE: 'Created',
    UPDATE: 'Updated',
    DELETE: 'Deleted',
    VIEW: 'Viewed',
    EXPORT: 'Exported',
  };
  return labels[action] || action.toLowerCase();
};
