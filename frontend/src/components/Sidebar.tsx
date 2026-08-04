import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import HomeIcon from '@mui/icons-material/Home';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import useAuth from '../auth/useAuth';
import { type ReactNode } from 'react';

interface SidebarProps {
  open: boolean;
  onClose?: () => void;
  mobile?: boolean;
}

interface NavItem {
  label: string;
  icon: ReactNode;
  to: string;
  permission?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <HomeIcon />, to: '/' },
  { label: 'Departments', icon: <ApartmentIcon />, to: '/departments', permission: 'departments.Read' },
  { label: 'Users', icon: <PersonIcon />, to: '/users', permission: 'authorization.view_role' },
  { label: 'Profile', icon: <SettingsIcon />, to: '/profile' },
];

export default function Sidebar({ open, onClose, mobile }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const handleNavigation = (to: string) => {
    navigate(to);
    if (mobile && onClose) {
      onClose();
    }
  };

  return (
    <Drawer
      variant={mobile ? 'temporary' : 'permanent'}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: 250,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 250,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ fontWeight: 700, fontSize: 18 }}>MEIMS</Box>
        <Box sx={{ mt: 1, color: 'text.secondary' }}>Enterprise operations</Box>
      </Box>
      <Divider />
      <List>
        {navItems
          .filter((item) => !item.permission || auth.hasPermission(item.permission))
          .map((item) => (
            <ListItemButton
              key={item.label}
              selected={location.pathname === item.to}
              onClick={() => handleNavigation(item.to)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
      </List>
    </Drawer>
  );
}
