import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { type ReactNode, useCallback, useMemo, useState } from 'react';

import ThemeModeContext from './themeContext';

export default function ThemeProvider({ children }: { children: ReactNode }) {  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    try {
      const stored = window.localStorage.getItem('meims_theme_mode');
      return stored === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const toggleTheme = useCallback(() => {
    setMode((currentMode) => {
      const nextMode = currentMode === 'light' ? 'dark' : 'light';
      try {
        window.localStorage.setItem('meims_theme_mode', nextMode);
      } catch {
        // Ignore storage failures.
      }
      return nextMode;
    });
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1565c0',
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeModeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}
