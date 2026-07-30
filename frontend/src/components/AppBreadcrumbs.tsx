import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const labelMap: Record<string, string> = {
  '': 'Dashboard',
  users: 'Users',
  profile: 'Profile',
  departments: 'Departments',
  projects: 'Projects',
  finance: 'Finance',
  gis: 'GIS',
  settings: 'Settings',
};

export default function AppBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
      <Link component={RouterLink} underline="hover" color="inherit" to="/">
        Dashboard
      </Link>
      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join('/')}`;
        const label = labelMap[segment] ?? segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
        const isLast = index === segments.length - 1;

        return isLast ? (
          <Typography color="text.primary" key={path}>
            {label}
          </Typography>
        ) : (
          <Link component={RouterLink} underline="hover" color="inherit" to={path} key={path}>
            {label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
