import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  options: ToastOptions;
}

interface ToastContextValue {
  showToast: (type: Toast['type'], message: string, options?: ToastOptions) => void;
  dismissToast: (id: string) => void;
  dismissAll: () => void;
}

type ToastAction =
  | { type: 'ADD'; toast: Toast }
  | { type: 'DISMISS'; id: string }
  | { type: 'DISMISS_ALL' };

interface ToastState {
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const MAX_TOASTS = 5;

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD':
      const newToasts = [action.toast, ...state.toasts];
      if (newToasts.length > MAX_TOASTS) {
        newToasts.pop();
      }
      return { toasts: newToasts };
    case 'DISMISS':
      return { toasts: state.toasts.filter(t => t.id !== action.id) };
    case 'DISMISS_ALL':
      return { toasts: [] };
    default:
      return state;
  }
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const showToast = (type: Toast['type'], message: string, options: ToastOptions = {}) => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, type, message, options };
    dispatch({ type: 'ADD', toast });

    if (options.duration !== 0) {
      setTimeout(() => {
        dispatch({ type: 'DISMISS', id });
      }, options.duration ?? 4000);
    }
  };

  const dismissToast = (id: string) => {
    dispatch({ type: 'DISMISS', id });
  };

  const dismissAll = () => {
    dispatch({ type: 'DISMISS_ALL' });
  };

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, showToast, dismissToast, dismissAll }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
