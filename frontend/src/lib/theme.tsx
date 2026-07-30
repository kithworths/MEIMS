import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode, useMemo, useState } from 'react';

export function usePreferredTheme(initialMode: 'light' | 'dark' = 'light') {
  const [mode, setMode] = useState<'light' | 'dark'>(initialMode);
  const toggle = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);
  return { theme, mode, toggle };
}

export default function ThemeProvider({ children, theme }: { children: ReactNode; theme: any }) {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
