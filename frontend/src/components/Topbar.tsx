import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Button from '@mui/material/Button';
import { useEffect } from 'react';

interface TopbarProps {
  onToggleDrawer?: () => void;
  onToggleTheme?: () => void;
  themeMode?: 'light' | 'dark';
}

export default function Topbar({ onToggleDrawer, onToggleTheme, themeMode }: TopbarProps) {
  useEffect(() => {
    // accessible app title for screen readers
    document.title = 'MEIMS — Management Portal';
  }, []);

  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="menu" onClick={onToggleDrawer} sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} noWrap>
          MEIMS
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit" onClick={onToggleTheme} aria-label="toggle theme">
            {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <Button color="inherit" href="/profile">Profile</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
