import { type ReactNode, useCallback, useMemo, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { NotificationContext, type AppNotification } from '../contexts/NotificationContext';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<AppNotification>({ message: '', severity: 'info' });

  const notify = useCallback((n: AppNotification) => {
    setNote(n);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setOpen(false)} severity={note.severity} sx={{ width: '100%' }}>
          {note.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
