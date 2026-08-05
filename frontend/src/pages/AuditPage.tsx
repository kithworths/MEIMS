import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import useAuth from '../auth/useAuth';
import { useAudit, useAuditSummary, useExportAuditLogs } from '../hooks/useAudit';


export default function AuditPage() {
  const auth = useAuth();
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [role, setRole] = useState('');

  const { data, isLoading, refetch } = useAudit({ page: 1, pageSize: 50, search, start_date: startDate || undefined, end_date: endDate || undefined, role: role || undefined });
  const summary = useAuditSummary({ search, start_date: startDate || undefined, end_date: endDate || undefined, role: role || undefined });
  const exportMutation = useExportAuditLogs();

  const auditRecords = data?.results ?? [];
  const totalEvents = data?.count ?? 0;
  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    auditRecords.forEach((record: any) => record.user_roles?.forEach((roleName: string) => roles.add(roleName)));
    return Array.from(roles);
  }, [auditRecords]);

  const handleExport = async () => {
    const blob = await exportMutation.mutateAsync({ search, start_date: startDate || undefined, end_date: endDate || undefined, role: role || undefined });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'audit_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!auth.hasPermission('audit.Read')) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">You do not have permission to view audit logs.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="overline" color="text.secondary" gutterBottom>
        Audit
      </Typography>
      <Typography variant="h4" gutterBottom>
        Audit centre
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Filters
            </Typography>
            <TextField
              label="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Start date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End date"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              fullWidth
              margin="normal"
            >
              <MenuItem value="">All roles</MenuItem>
              {roleOptions.map((roleName) => (
                <MenuItem key={roleName} value={roleName}>
                  {roleName}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button variant="contained" onClick={() => refetch()} disabled={isLoading}>
                Apply
              </Button>
              <Button variant="outlined" onClick={handleExport} disabled={(exportMutation?.status === 'pending') || !auth.hasPermission('audit.Export')}>
                Export CSV
              </Button>
            </Box>
          </Card>

          <Card sx={{ p: 2, mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              KPI summary
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Total events: <strong>{totalEvents}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Filtered actions: <strong>{summary.data?.actions?.length ?? 0}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Timeline points: <strong>{summary.data?.daily_trend?.length ?? 0}</strong>
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Actions by type
                </Typography>
                {summary.data?.actions?.length ? (
                  summary.data.actions.map((entry: any) => (
                    <Box key={entry.action} sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {entry.action} ({entry.count})
                      </Typography>
                      <LinearProgress variant="determinate" value={Math.min(100, (entry.count / Math.max(totalEvents, 1)) * 100)} />
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">No action data available.</Typography>
                )}
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Timeline trend
                </Typography>
                {summary.data?.daily_trend?.length ? (
                  summary.data.daily_trend.map((entry: any) => (
                    <Box key={entry.date} sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {entry.date} — {entry.count} events
                      </Typography>
                      <LinearProgress variant="determinate" value={Math.min(100, (entry.count / Math.max(totalEvents, 1)) * 100)} />
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">No timeline data available.</Typography>
                )}
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ p: 2, mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Recent audit events
            </Typography>
            <List>
              {auditRecords.length === 0 ? (
                <Typography sx={{ p: 2 }}>No audit events found for the selected filters.</Typography>
              ) : (
                auditRecords.map((record: any) => (
                  <Box key={record.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={`${record.action} • ${record.module} • ${record.user_email || 'System'}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {new Date(record.timestamp).toLocaleString()} • {record.ip_address}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.secondary">
                              {record.object_type} {record.object_id} — {record.description}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </Box>
                ))
              )}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
