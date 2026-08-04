import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useAuth from '../auth/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';

const HEALTH_ENDPOINT = `${(import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')}/v1/health/`;

export default function DashboardPage() {
  const auth = useAuth();
  const { data, isLoading, error } = useDashboardStats();

  const welcomeName = useMemo(() => {
    if (!auth.user) return 'MEIMS user';
    return auth.user.first_name ? `${auth.user.first_name} ${auth.user.last_name}` : auth.user.email;
  }, [auth.user]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%" py={10}>
        <Typography>Loading dashboard…</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Unable to load dashboard data.
        </Typography>
        <Typography color="text.secondary">Please try again later or contact your administrator.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          Welcome back
        </Typography>
        <Typography variant="h4" component="h1" gutterBottom>
          {welcomeName}
        </Typography>
        <Typography color="text.secondary">
          Your MEIMS enterprise portal is connected and authenticated. Review the latest system metrics,
          activity, and important account information here.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                System status
              </Typography>
              <Typography variant="h5" gutterBottom>
                {data?.healthMessage ?? 'Healthy'}
              </Typography>
              <Typography color="text.secondary">
                Live backend health and availability summary.
              </Typography>
            </Box>
            <Button variant="contained" href={HEALTH_ENDPOINT} target="_blank" rel="noreferrer noopener">
              View health endpoint
            </Button>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {[
              { label: 'Departments', value: data?.departments ?? 0 },
              { label: 'Projects', value: data?.projects ?? 0 },
              { label: 'Documents', value: data?.documents ?? 0 },
              { label: 'Payments', value: data?.payments ?? 0 },
            ].map((metric) => (
              <Grid key={metric.label} item xs={12} sm={6} md={3}>
                <Card sx={{ p: 3, minHeight: 140 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {metric.label}
                  </Typography>
                  <Typography variant="h4">{metric.value}</Typography>
                  <LinearProgress variant="determinate" value={Math.min(100, (metric.value / 100) * 100)} sx={{ mt: 2 }} />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, minHeight: 220 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Quick actions
            </Typography>
            <Stack spacing={2}>
              <Button variant="contained" href="/profile">
                View profile
              </Button>
              <Button variant="outlined" href="/users">
                User administration
              </Button>
              <Button variant="outlined" href="/unauthorized">
                Access information
              </Button>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, minHeight: 220 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              User summary
            </Typography>
            <Typography variant="h6">Signed in as</Typography>
            <Typography>{auth.user?.email ?? 'Unknown user'}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Employee number: {auth.user?.employee_number ?? 'Not assigned'}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label={auth.user?.first_name ?? 'First name missing'} />
              <Chip label={auth.user?.last_name ?? 'Last name missing'} />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
