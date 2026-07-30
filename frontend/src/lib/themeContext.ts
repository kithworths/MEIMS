import { createContext, useContext } from 'react';

export interface ThemeContextValue {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeModeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }

  return context;
}

export default ThemeModeContext;
