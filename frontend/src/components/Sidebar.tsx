import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import FolderIcon from '@mui/icons-material/Folder';
import ReceiptIcon from '@mui/icons-material/Receipt';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';

interface SidebarProps {
  open: boolean;
  onClose?: () => void;
}

const navItems = [
  { label: 'Dashboard', icon: <HomeIcon />, to: '/' },
  { label: 'Users', icon: <PersonIcon />, to: '/users' },
  { label: 'Departments', icon: <BusinessIcon />, to: '/departments' },
  { label: 'Projects', icon: <FolderIcon />, to: '/projects' },
  { label: 'Finance', icon: <ReceiptIcon />, to: '/finance' },
  { label: 'GIS', icon: <MapIcon />, to: '/gis' },
  { label: 'Settings', icon: <SettingsIcon />, to: '/settings' },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();

  return (
    <Drawer open={open} onClose={onClose} variant="temporary">
      <Box sx={{ width: 250 }} role="presentation" onClick={onClose} onKeyDown={onClose}>
        <List>
          {navItems.map((item) => (
            <ListItem button key={item.label} onClick={() => navigate(item.to)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
        <Divider />
      </Box>
    </Drawer>
  );
}
