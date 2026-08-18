import { createContext, useContext } from 'react';

type AppNotification = { message: string; severity?: 'success' | 'error' | 'info' | 'warning' };

export const NotificationContext = createContext<{ notify: (n: AppNotification) => void } | undefined>(undefined);

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}

export type { AppNotification };
