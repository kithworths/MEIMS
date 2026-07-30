import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// MUI Theme
import ThemeProvider, { usePreferredTheme } from './lib/theme';
import { useMemo } from 'react';

const queryClient = new QueryClient();

function Root() {
  const { theme } = usePreferredTheme('light');
  // pass theme into ThemeProvider
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
