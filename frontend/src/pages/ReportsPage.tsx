import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Link from '@mui/material/Link';
import useAuth from '../auth/useAuth';
import { useReports, useCreateReport } from '../hooks/useReports';

export default function ReportsPage() {
  const auth = useAuth();
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState<'project' | 'department' | 'finance' | 'task' | 'gis' | 'audit'>('project');

  const { data, refetch } = useReports({ page: 1, pageSize: 50 });
  const createMutation = useCreateReport();

  const reports = data?.results ?? [];

  const handleCreate = async () => {
    await createMutation.mutateAsync({ report_name: reportName || `Report ${new Date().toISOString()}`, report_type: reportType, format: 'csv' });
    setReportName('');
    refetch();
  };

  if (!auth.hasPermission('reports.Read')) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">You do not have permission to view reports.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="overline" color="text.secondary" gutterBottom>
        Reporting
      </Typography>
      <Typography variant="h4" gutterBottom>
        Reporting centre
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1">Generate report</Typography>
            <TextField label="Report name" value={reportName} onChange={(e) => setReportName(e.target.value)} fullWidth margin="normal" />
            <TextField select label="Report type" value={reportType} onChange={(e) => setReportType(e.target.value as any)} fullWidth margin="normal">
              <MenuItem value="project">Project report</MenuItem>
              <MenuItem value="department">Department report</MenuItem>
              <MenuItem value="finance">Finance report</MenuItem>
              <MenuItem value="task">Task report</MenuItem>
              <MenuItem value="gis">GIS report</MenuItem>
              <MenuItem value="audit">Audit report</MenuItem>
            </TextField>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button variant="contained" onClick={handleCreate} disabled={(createMutation as any).status === 'pending' || !auth.hasPermission('reports.Create')}>
                Generate
              </Button>
              <Button onClick={() => refetch()}>Refresh</Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1">Recent reports</Typography>
            <List>
              {reports.length === 0 ? (
                <Typography sx={{ p: 2 }}>No reports found.</Typography>
              ) : (
                reports.map((r: any) => (
                  <ListItem key={r.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography sx={{ fontWeight: 600 }}>{r.report_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.report_type} • {r.format} • {r.status}
                      </Typography>
                      {r.file_url && (
                        <Link href={r.file_url} target="_blank" rel="noopener noreferrer" sx={{ mt: 1 }}>
                          Download
                        </Link>
                      )}
                    </Box>
                  </ListItem>
                ))
              )}
            </List>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
