import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import { type ReactNode, useCallback, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import AppBreadcrumbs from './AppBreadcrumbs';

const drawerWidth = 250;

export default function Layout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const toggleDrawer = useCallback(() => setMobileOpen((previous) => !previous), []);
  const closeDrawer = useCallback(() => setMobileOpen(false), []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Topbar onToggleDrawer={toggleDrawer} />
      <Sidebar open={isDesktop || mobileOpen} onClose={closeDrawer} mobile={!isDesktop} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Container maxWidth="xl" disableGutters>
          <AppBreadcrumbs />
          {children}
        </Container>
      </Box>
    </Box>
  );
}
