import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { ReactNode, useState } from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  const toggleDrawer = () => setDrawerOpen((s) => !s);
  const toggleTheme = () => setThemeMode((m) => (m === 'light' ? 'dark' : 'light'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <Topbar onToggleDrawer={toggleDrawer} onToggleTheme={toggleTheme} themeMode={themeMode} />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
