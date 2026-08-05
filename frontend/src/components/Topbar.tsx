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
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useEffect, useState, type MouseEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useThemeMode } from '../lib/themeContext';
import useAuth from '../auth/useAuth';
import { useRecentNotifications, useUnreadNotificationCount } from '../hooks/useNotifications';

interface TopbarProps {
  onToggleDrawer?: () => void;
}

export default function Topbar({ onToggleDrawer }: TopbarProps) {
  const { mode, toggleTheme } = useThemeMode();
  const auth = useAuth();
  const navigate = useNavigate();
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const { data: unreadCountData } = useUnreadNotificationCount();
  const { data: latestNotificationsData } = useRecentNotifications();

  const unreadCount = unreadCountData ?? 0;
  const latestNotifications = latestNotificationsData?.results ?? [];

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

  const notificationItems: Array<{
    id: string;
    title: string;
    message?: string | null;
  }> = latestNotifications.length
    ? latestNotifications.map((item) => ({ id: item.id, title: item.title, message: item.message }))
    : [
        { id: 'empty', title: 'No notifications yet', message: 'You are all caught up.' },
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
          {auth.hasPermission('notifications.Read') && (
            <IconButton color="inherit" onClick={openNotifications} aria-label={`notifications (${unreadCount} unread)`}>
              <Badge badgeContent={unreadCount} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          )}
          <IconButton color="inherit" onClick={openProfileMenu} aria-label="account">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
              {auth.user?.first_name?.charAt(0) ?? auth.user?.email?.charAt(0) ?? 'U'}
            </Avatar>
          </IconButton>
        </Box>

        <Menu anchorEl={notificationsAnchor} open={Boolean(notificationsAnchor)} onClose={closeNotifications}>
          {notificationItems.map((item) => (
            <MenuItem
              key={item.id ?? item.title}
              onClick={() => {
                closeNotifications();
                navigate('/notifications');
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: item.id !== 'empty' ? 700 : 600 }}>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.message ?? 'Open notification center to manage alerts.'}
                </Typography>
              </Box>
            </MenuItem>
          ))}
          {auth.hasPermission('notifications.Read') && (
            <MenuItem component={RouterLink} to="/notifications" onClick={closeNotifications}>
              View all notifications
            </MenuItem>
          )}
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
