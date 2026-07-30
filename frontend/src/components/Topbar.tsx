import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useEffect, useState, type MouseEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useThemeMode } from '../lib/theme';
import useAuth from '../auth/useAuth';

interface TopbarProps {
  onToggleDrawer?: () => void;
}

export default function Topbar({ onToggleDrawer }: TopbarProps) {
  const { mode, toggleTheme } = useThemeMode();
  const auth = useAuth();
  const navigate = useNavigate();
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    document.title = 'MEIMS — Management Portal';
  }, []);

  const openNotifications = (event: MouseEvent<HTMLElement>) => setNotificationsAnchor(event.currentTarget);
  const closeNotifications = () => setNotificationsAnchor(null);
  const openProfileMenu = (event: MouseEvent<HTMLElement>) => setProfileAnchor(event.currentTarget);
  const closeProfileMenu = () => setProfileAnchor(null);

  const handleLogout = async () => {
    closeProfileMenu();
    await auth.logout();
    navigate('/login', { replace: true });
  };

  const notificationItems = [
    'System health is stable.',
    'New role assignments are available.',
    'Your password expires in 30 days.',
  ];

  return (
    <AppBar position="sticky" color="primary" elevation={2}>
      <Toolbar sx={{ minHeight: 64 }}>
        <IconButton edge="start" color="inherit" aria-label="menu" onClick={onToggleDrawer} sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }} noWrap>
          MEIMS
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={toggleTheme} aria-label="toggle theme">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <IconButton color="inherit" onClick={openNotifications} aria-label="notifications">
            <Badge badgeContent={notificationItems.length} color="secondary">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>
          <IconButton color="inherit" onClick={openProfileMenu} aria-label="account">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
              {auth.user?.first_name?.charAt(0) ?? auth.user?.email?.charAt(0) ?? 'U'}
            </Avatar>
          </IconButton>
        </Box>

        <Menu anchorEl={notificationsAnchor} open={Boolean(notificationsAnchor)} onClose={closeNotifications}>
          {notificationItems.map((item) => (
            <MenuItem key={item} onClick={closeNotifications}>
              <Typography variant="body2">{item}</Typography>
            </MenuItem>
          ))}
        </Menu>

        <Menu anchorEl={profileAnchor} open={Boolean(profileAnchor)} onClose={closeProfileMenu}>
          <MenuItem component={RouterLink} to="/profile" onClick={closeProfileMenu}>
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
