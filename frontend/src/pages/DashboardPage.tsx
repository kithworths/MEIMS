import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import useAuth from '../auth/useAuth';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useFinanceDashboard } from '../hooks/useFinance';
import { useProjectDashboard } from '../hooks/useProjects';
import { useTasksDashboard, usePendingStandApprovals } from '../hooks/useTasks';
import { useRecentNotifications } from '../hooks/useNotifications';
import { useGISLocations } from '../hooks/useGIS';
import { useDocuments } from '../hooks/useDocuments';
import { useDepartments } from '../hooks/useDepartments';
import { useAuditSummary } from '../hooks/useAudit';

const HEALTH_ENDPOINT = `${(import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '')}/health/`;

function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxValue = Math.max(1, ...data.map((item) => item.value));
  return (
    <svg width="100%" height={140} viewBox="0 0 400 140" preserveAspectRatio="none">
      {data.map((item, index) => {
        const barWidth = 320 / Math.max(1, data.length);
        const barHeight = (item.value / maxValue) * 90;
        const x = 40 + index * barWidth;
        const y = 110 - barHeight;

        return (
          <g key={item.label}>
            <rect x={x} y={y} width={barWidth - 12} height={barHeight} fill="#1976d2" rx={4} />
            <text x={x + (barWidth - 12) / 2} y={126} fontSize={10} textAnchor="middle" fill="#000">
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SimpleLineChart({ data }: { data: { label: string; value: number }[] }) {
  const maxValue = Math.max(1, ...data.map((item) => item.value));
  const points = data.map((item, index) => {
    const x = 40 + (index * 320) / Math.max(1, data.length - 1);
    const y = 110 - (item.value / maxValue) * 90;
    return `${x},${y}`;
  });

  return (
    <svg width="100%" height={140} viewBox="0 0 400 140" preserveAspectRatio="none">
      <polyline points={points.join(' ')} fill="none" stroke="#1976d2" strokeWidth={3} />
      {data.map((item, index) => {
        const x = 40 + (index * 320) / Math.max(1, data.length - 1);
        const y = 110 - (item.value / maxValue) * 90;
        return (
          <g key={item.label}>
            <circle cx={x} cy={y} r={4} fill="#1976d2" />
            <text x={x} y={130} fontSize={10} textAnchor="middle" fill="#000">
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function DashboardPage() {
  const auth = useAuth();
  const canViewFinance = auth.hasPermission('payments.Read');
  const canViewDepartments = auth.hasPermission('departments.Read');
  const canViewNotifications = auth.hasPermission('notifications.Read');
  const canViewGIS = auth.hasPermission('gis.Read');
  const canViewAudit = auth.hasPermission('audit.Read');
  const canViewApprovals = auth.hasPermission('stands.Read');

  const statsQuery = useDashboardStats();
  const financeQuery = useFinanceDashboard({ enabled: canViewFinance });
  const projectsQuery = useProjectDashboard();
  const tasksQuery = useTasksDashboard();
  const approvalsQuery = usePendingStandApprovals({ enabled: canViewApprovals });
  const notificationsQuery = useRecentNotifications(canViewNotifications);
  const gisQuery = useGISLocations({ page: 1, pageSize: 5, enabled: canViewGIS });
  const documentsQuery = useDocuments({ page: 1, pageSize: 5, ordering: '-created_at' });
  const departmentsQuery = useDepartments({ page: 1, pageSize: 5, search: '', status: 'all', ordering: 'name', enabled: canViewDepartments });
  const auditSummaryQuery = useAuditSummary({ enabled: canViewAudit });

  const isLoading = [
    statsQuery.isLoading,
    projectsQuery.isLoading,
    tasksQuery.isLoading,
    canViewFinance ? financeQuery.isLoading : false,
    canViewApprovals ? approvalsQuery.isLoading : false,
    canViewNotifications ? notificationsQuery.isLoading : false,
    canViewGIS ? gisQuery.isLoading : false,
    documentsQuery.isLoading,
    canViewDepartments ? departmentsQuery.isLoading : false,
    canViewAudit ? auditSummaryQuery.isLoading : false,
  ].some(Boolean);

  const hasError = [
    statsQuery.error,
    projectsQuery.error,
    tasksQuery.error,
    canViewFinance ? financeQuery.error : null,
    canViewApprovals ? approvalsQuery.error : null,
    canViewNotifications ? notificationsQuery.error : null,
    canViewGIS ? gisQuery.error : null,
    documentsQuery.error,
    canViewDepartments ? departmentsQuery.error : null,
    canViewAudit ? auditSummaryQuery.error : null,
  ].some(Boolean);

  const welcomeName = useMemo(() => {
    if (!auth.user) return 'MEIMS user';
    return auth.user.first_name ? `${auth.user.first_name} ${auth.user.last_name}` : auth.user.email;
  }, [auth.user]);

  const projects = useMemo(() => projectsQuery.data?.results ?? [], [projectsQuery.data?.results]);
  const totalProjects = projectsQuery.data?.count ?? 0;
  const projectStatusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => counts.set(project.status, (counts.get(project.status) ?? 0) + 1));
    return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
  }, [projects]);

  const completedProjects = projectStatusCounts.find((item) => item.label.toLowerCase() === 'completed')?.value ?? 0;
  const completionRate = totalProjects ? Math.round((completedProjects / totalProjects) * 100) : 0;
  const totalBudget = projects.reduce((acc, project) => acc + (project.budget_total ?? 0), 0);
  const budgetCoverage = totalProjects ? Math.round((projects.filter((project) => typeof project.budget_total === 'number' && project.budget_total > 0).length / totalProjects) * 100) : 0;
  const upcomingDeadlines = useMemo(() => {
    return projects
      .filter((project) => project.planned_end_date)
      .map((project) => ({
        ...project,
        planned_end_date_ts: new Date(project.planned_end_date!).getTime(),
      }))
      .filter((project) => !Number.isNaN(project.planned_end_date_ts))
      .sort((a, b) => a.planned_end_date_ts - b.planned_end_date_ts)
      .slice(0, 5);
  }, [projects]);

  const recentActivity = useMemo(() => {
    const events: Array<{ id: string; label: string; subtitle: string; date: string }> = [];
    notificationsQuery.data?.results?.forEach((notification) => {
      if (notification.created_at) {
        events.push({
          id: `notification-${notification.id}`,
          label: notification.title,
          subtitle: notification.category,
          date: notification.created_at,
        });
      }
    });
    projects.forEach((project) => {
      if (project.updated_at) {
        events.push({
          id: `project-${project.id}`,
          label: project.name,
          subtitle: project.status,
          date: project.updated_at,
        });
      }
    });

    return events.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [notificationsQuery.data?.results, projects]);

  const auditActions = auditSummaryQuery.data?.actions ?? [];
  const auditTrend = auditSummaryQuery.data?.daily_trend ?? [];

  if (statsQuery.isLoading && !statsQuery.data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%" py={10}>
        <Typography>Loading dashboard…</Typography>
      </Box>
    );
  }

  if (hasError) {
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
          Executive municipal dashboard
        </Typography>
        <Typography variant="h4" component="h1" gutterBottom>
          {welcomeName}
        </Typography>
        <Typography color="text.secondary">
          Live enterprise reporting across projects, finance, operations, GIS, approvals, and audit activity.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                System health
              </Typography>
              <Typography variant="h5" gutterBottom>
                {statsQuery.data?.healthMessage ?? 'Healthy'}
              </Typography>
              <Typography color="text.secondary">Live backend health and availability summary.</Typography>
            </Box>
            <Button variant="contained" href={HEALTH_ENDPOINT} target="_blank" rel="noreferrer noopener">
              View health endpoint
            </Button>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {[
              { label: 'Departments', value: statsQuery.data?.departments ?? 0 },
              { label: 'Projects', value: statsQuery.data?.projects ?? 0 },
              { label: 'Documents', value: statsQuery.data?.documents ?? 0 },
              { label: 'Payments', value: statsQuery.data?.payments ?? 0 },
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

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, minHeight: 260 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Project KPIs
            </Typography>
            <Typography variant="h6">Completion rate</Typography>
            <Typography sx={{ mb: 1 }}>{completionRate}% of projects completed</Typography>
            <LinearProgress variant="determinate" value={completionRate} sx={{ mb: 3 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Status distribution
            </Typography>
            {projectStatusCounts.length > 0 ? <SimpleBarChart data={projectStatusCounts} /> : <Typography>No project status data.</Typography>}
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, minHeight: 260 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Finance summary
            </Typography>
            <Typography variant="h5" gutterBottom>
              {financeQuery.data ? `₦${Number(financeQuery.data.total_revenue).toLocaleString()}` : '—'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Total revenue from live finance records.
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Payments</Typography>
                <Typography>{financeQuery.data?.payment_count ?? '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Refunds</Typography>
                <Typography>{financeQuery.data?.refund_count ?? '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">Reversals</Typography>
                <Typography>{financeQuery.data?.reversal_count ?? '—'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  Recent payments
                </Typography>
                {financeQuery.data?.daily_revenue?.length ? (
                  <SimpleLineChart data={financeQuery.data.daily_revenue.map((entry) => ({ label: entry.date, value: Number(entry.amount) }))} />
                ) : (
                  <Typography color="text.secondary">No recent payment activity.</Typography>
                )}
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {auth.hasPermission('departments.Read') && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, minHeight: 260 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Departments
              </Typography>
              <Typography variant="h5" gutterBottom>
                {statsQuery.data?.departments ?? 0}
              </Typography>
              <Typography color="text.secondary">Active departments across the organisation.</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Recent departments
              </Typography>
              <List dense>
                {departmentsQuery.data?.results?.slice(0, 3).map((department: any) => (
                  <ListItem key={department.id} disablePadding>
                                    <ListItemText primary={department.department_name} secondary={department.description ?? undefined} />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, minHeight: 260 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Tasks & Approvals
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Project task count
                </Typography>
                <Typography variant="h5">{tasksQuery.data?.projectTaskCount ?? '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Engineer tickets
                </Typography>
                <Typography variant="h5">{tasksQuery.data?.engineerTicketCount ?? '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Site visits
                </Typography>
                <Typography variant="h5">{tasksQuery.data?.siteVisitCount ?? '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Site inspections
                </Typography>
                <Typography variant="h5">{tasksQuery.data?.siteInspectionCount ?? '—'}</Typography>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Pending approvals
            </Typography>
            <Typography variant="h6">{approvalsQuery.data?.count ?? 0}</Typography>
            <Typography color="text.secondary">Stand stage changes requiring managerial review.</Typography>
          </Card>
        </Grid>

        {auth.hasPermission('notifications.Read') && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, minHeight: 260 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Notifications
              </Typography>
              <Typography variant="h5">{notificationsQuery.data?.count ?? 0} total</Typography>
              <Typography color="text.secondary" gutterBottom>
                Unread: {notificationsQuery.data?.results?.filter((item) => !item.is_read).length ?? 0}
              </Typography>
              <List dense>
                {notificationsQuery.data?.results?.slice(0, 4).map((notification) => (
                  <ListItem key={notification.id} disablePadding>
                    <ListItemText
                      primary={notification.title}
                      secondary={`${notification.category} • ${notification.created_at ?? ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
        )}

        {auth.hasPermission('gis.Read') && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, minHeight: 260 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                GIS locations
              </Typography>
              <Typography variant="h5">{statsQuery.data?.gisLocations ?? 0}</Typography>
              <Typography color="text.secondary">Live geographic assets and spatial records.</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Latest GIS entries
              </Typography>
              <List dense>
                {gisQuery.data?.results?.slice(0, 4).map((location) => (
                  <ListItem key={location.id} disablePadding>
                    <ListItemText primary={location.name} secondary={location.geometry_type} />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, minHeight: 260 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Budget utilisation
            </Typography>
            <Typography variant="h5">{totalBudget ? `₦${totalBudget.toLocaleString()}` : 'No budgets defined'}</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {budgetCoverage}% of active projects have a budget assigned.
            </Typography>
            <LinearProgress variant="determinate" value={budgetCoverage} sx={{ mb: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Project progress
            </Typography>
            <Typography>{completionRate}% completed</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, minHeight: 260 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Audit activity
            </Typography>
            <Typography variant="h6" gutterBottom>
              {auditActions.length} action categories
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              Actions and trends from the audit log.
            </Typography>
            {auditActions.length ? <SimpleBarChart data={auditActions.slice(0, 5).map((action: any) => ({ label: action.action, value: action.count }))} /> : <Typography>No audit activity data.</Typography>}
            <Divider sx={{ my: 2 }} />
            {auditTrend.length ? <SimpleLineChart data={auditTrend.map((item: any) => ({ label: item.date, value: item.count }))} /> : <Typography color="text.secondary">No audit trend data.</Typography>}
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, minHeight: 260 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Recent documents
            </Typography>
            <Typography variant="h5">{documentsQuery.data?.count ?? 0}</Typography>
            <Divider sx={{ my: 2 }} />
            <List dense>
              {documentsQuery.data?.results?.slice(0, 4).map((document) => (
                <ListItem key={document.id} disablePadding>
                  <ListItemText
                    primary={document.title}
                    secondary={document.created_at ? new Date(document.created_at).toLocaleDateString() : undefined}
                  />
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, minHeight: 260 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Upcoming deadlines
            </Typography>
            {upcomingDeadlines.length > 0 ? (
              <List dense>
                {upcomingDeadlines.map((deadline) => (
                  <ListItem key={deadline.id} disablePadding>
                    <ListItemText
                      primary={deadline.name}
                      secondary={new Date(deadline.planned_end_date!).toLocaleDateString()}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">No upcoming deadlines available.</Typography>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, minHeight: 260 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Recent activity
            </Typography>
            <List dense>
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <ListItem key={activity.id} disablePadding>
                    <ListItemText primary={activity.label} secondary={`${activity.subtitle} • ${new Date(activity.date).toLocaleString()}`} />
                  </ListItem>
                ))
              ) : (
                <Typography color="text.secondary">No recent activity found.</Typography>
              )}
            </List>
          </Card>
        </Grid>
      </Grid>

      {isLoading && (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          <CircularProgress size={40} />
        </Box>
      )}
    </Box>
  );
}
