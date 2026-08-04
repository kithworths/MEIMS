import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import useAuth from '../auth/useAuth';
import {
  useProjectTasks,
  useEngineerTickets,
  useSiteVisits,
  useSiteInspections,
  useDeleteProjectTask,
  useBulkDeleteProjectTasks,
  useDeleteEngineerTicket,
  useBulkDeleteEngineerTickets,
  useDeleteSiteVisit,
  useBulkDeleteSiteVisits,
  useDeleteSiteInspection,
  useBulkDeleteSiteInspections,
  useTasksDashboard,
} from '../hooks/useTasks';
import { type ProjectTask, type EngineerTicket, type SiteVisit, type SiteInspection } from '../api/tasks';

const taskTypeConfig = {
  'project-tasks': {
    label: 'Project Tasks',
    readPermission: 'project_tasks.Read',
    createPermission: 'project_tasks.Create',
    updatePermission: 'project_tasks.Update',
    deletePermission: 'project_tasks.Delete',
    statusOptions: ['Open', 'In Progress', 'Blocked', 'Completed', 'Cancelled'],
    priorityOptions: ['Low', 'Medium', 'High', 'Critical'],
    orderingOptions: [
      { label: 'Start date', value: '-planned_start_date' },
      { label: 'End date', value: '-planned_end_date' },
      { label: 'Priority', value: 'priority' },
    ],
  },
  'engineer-tickets': {
    label: 'Engineer Tickets',
    readPermission: 'engineer_tickets.Read',
    createPermission: 'engineer_tickets.Create',
    updatePermission: 'engineer_tickets.Update',
    deletePermission: 'engineer_tickets.Delete',
    statusOptions: ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
    priorityOptions: ['Low', 'Medium', 'High', 'Critical'],
    orderingOptions: [
      { label: 'Opened date', value: '-opened_at' },
      { label: 'Priority', value: 'priority' },
    ],
  },
  'site-visits': {
    label: 'Site Visits',
    readPermission: 'site_visits.Read',
    createPermission: 'site_visits.Create',
    updatePermission: 'site_visits.Update',
    deletePermission: 'site_visits.Delete',
    statusOptions: ['Scheduled', 'Completed', 'Cancelled', 'No Show'],
    priorityOptions: [],
    orderingOptions: [
      { label: 'Scheduled start', value: 'scheduled_start' },
      { label: 'Scheduled end', value: 'scheduled_end' },
    ],
  },
  'site-inspections': {
    label: 'Site Inspections',
    readPermission: 'site_inspections.Read',
    createPermission: 'site_inspections.Create',
    updatePermission: 'site_inspections.Update',
    deletePermission: 'site_inspections.Delete',
    statusOptions: ['Pass', 'Fail', 'Conditional Pass'],
    priorityOptions: [],
    orderingOptions: [
      { label: 'Inspection date', value: '-inspection_date' },
      { label: 'Result', value: 'result' },
    ],
  },
} as const;

const tabOrder = ['project-tasks', 'engineer-tickets', 'site-visits', 'site-inspections'] as const;

type TaskType = (typeof tabOrder)[number];

function renderProgress(task: ProjectTask) {
  if (task.estimated_hours && task.spent_hours != null) {
    const percent = Math.min(100, (Number(task.spent_hours) / Number(task.estimated_hours)) * 100);
    return <LinearProgress variant="determinate" value={percent} />;
  }
  return <Typography variant="caption" color="text.secondary">No estimate</Typography>;
}

export default function TasksPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TaskType>('project-tasks');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [selected, setSelected] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentRow, setCurrentRow] = useState<ProjectTask | EngineerTicket | SiteVisit | SiteInspection | null>(null);

  const dashboard = useTasksDashboard();
  const projectTasksQuery = useProjectTasks({ page, pageSize, search, status: statusFilter, priority: priorityFilter, ordering: '-planned_start_date' });
  const engineerTicketsQuery = useEngineerTickets({ page, pageSize, search, status: statusFilter, priority: priorityFilter, ordering: '-opened_at' });
  const siteVisitsQuery = useSiteVisits({ page, pageSize, search, status: statusFilter, ordering: 'scheduled_start' });
  const siteInspectionsQuery = useSiteInspections({ page, pageSize, search, result: statusFilter, ordering: '-inspection_date' });

  const projectTaskDelete = useDeleteProjectTask();
  const bulkProjectTaskDelete = useBulkDeleteProjectTasks();
  const engineerTicketDelete = useDeleteEngineerTicket();
  const bulkEngineerTicketDelete = useBulkDeleteEngineerTickets();
  const siteVisitDelete = useDeleteSiteVisit();
  const bulkSiteVisitDelete = useBulkDeleteSiteVisits();
  const siteInspectionDelete = useDeleteSiteInspection();
  const bulkSiteInspectionDelete = useBulkDeleteSiteInspections();

  const activeConfig = taskTypeConfig[activeTab];

  const activeQuery = useMemo(() => {
    switch (activeTab) {
      case 'engineer-tickets':
        return engineerTicketsQuery;
      case 'site-visits':
        return siteVisitsQuery;
      case 'site-inspections':
        return siteInspectionsQuery;
      default:
        return projectTasksQuery;
    }
  }, [activeTab, projectTasksQuery, engineerTicketsQuery, siteVisitsQuery, siteInspectionsQuery]);

  const data = activeQuery.data?.results ?? [];
  const isLoading = activeQuery.isLoading;

  const totalCount = activeQuery.data?.count ?? 0;
  const selectedCount = selected.length;

  const handleToggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(data.map((item) => item.id));
    } else {
      setSelected([]);
    }
  };

  const openRowMenu = (event: React.MouseEvent<HTMLElement>, row: ProjectTask | EngineerTicket | SiteVisit | SiteInspection) => {
    setAnchorEl(event.currentTarget);
    setCurrentRow(row);
  };

  const closeRowMenu = () => {
    setAnchorEl(null);
    setCurrentRow(null);
  };

  const handleDelete = async (id: string) => {
    if (!auth.hasPermission(activeConfig.deletePermission)) return;
    switch (activeTab) {
      case 'engineer-tickets':
        await engineerTicketDelete.mutateAsync(id);
        break;
      case 'site-visits':
        await siteVisitDelete.mutateAsync(id);
        break;
      case 'site-inspections':
        await siteInspectionDelete.mutateAsync(id);
        break;
      default:
        await projectTaskDelete.mutateAsync(id);
    }
  };

  const handleBulkDelete = async () => {
    if (!auth.hasPermission(activeConfig.deletePermission) || selectedCount === 0) return;
    switch (activeTab) {
      case 'engineer-tickets':
        await bulkEngineerTicketDelete.mutateAsync(selected);
        break;
      case 'site-visits':
        await bulkSiteVisitDelete.mutateAsync(selected);
        break;
      case 'site-inspections':
        await bulkSiteInspectionDelete.mutateAsync(selected);
        break;
      default:
        await bulkProjectTaskDelete.mutateAsync(selected);
    }
    setSelected([]);
  };

  const counts = useMemo(
    () => [
      { label: 'Project Tasks', value: dashboard.data?.projectTaskCount ?? 0 },
      { label: 'Engineer Tickets', value: dashboard.data?.engineerTicketCount ?? 0 },
      { label: 'Site Visits', value: dashboard.data?.siteVisitCount ?? 0 },
      { label: 'Site Inspections', value: dashboard.data?.siteInspectionCount ?? 0 },
    ],
    [dashboard.data],
  );

  const activeRows = data;
  const columnHeaders = useMemo(() => {
    switch (activeTab) {
      case 'engineer-tickets':
        return ['Title', 'Project', 'Status', 'Priority', 'Assignee', 'Opened at'];
      case 'site-visits':
        return ['Stand', 'Engineer', 'Start', 'End', 'Status'];
      case 'site-inspections':
        return ['Stand', 'Inspector', 'Date', 'Result'];
      default:
        return ['Title', 'Project', 'Status', 'Priority', 'Planned end', 'Progress'];
    }
  }, [activeTab]);

  const renderRow = (row: ProjectTask | EngineerTicket | SiteVisit | SiteInspection) => {
    switch (activeTab) {
      case 'engineer-tickets': {
        const ticket = row as EngineerTicket;
        return (
          <TableRow key={ticket.id} hover>
            <TableCell padding="checkbox">
              <Checkbox checked={selected.includes(ticket.id)} onChange={() => handleToggleSelect(ticket.id)} />
            </TableCell>
            <TableCell>{ticket.title}</TableCell>
            <TableCell>{ticket.project}</TableCell>
            <TableCell>{ticket.status}</TableCell>
            <TableCell>{ticket.priority}</TableCell>
            <TableCell>{ticket.assignee ?? 'Unassigned'}</TableCell>
            <TableCell>{ticket.opened_at}</TableCell>
            <TableCell align="right">
              <IconButton size="small" onClick={(event) => openRowMenu(event, ticket)}>
                <SearchIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        );
      }
      case 'site-visits': {
        const visit = row as SiteVisit;
        return (
          <TableRow key={visit.id} hover>
            <TableCell padding="checkbox">
              <Checkbox checked={selected.includes(visit.id)} onChange={() => handleToggleSelect(visit.id)} />
            </TableCell>
            <TableCell>{visit.stand}</TableCell>
            <TableCell>{visit.engineer ?? 'None'}</TableCell>
            <TableCell>{visit.scheduled_start}</TableCell>
            <TableCell>{visit.scheduled_end}</TableCell>
            <TableCell>{visit.status}</TableCell>
            <TableCell align="right">
              <IconButton size="small" onClick={(event) => openRowMenu(event, visit)}>
                <SearchIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        );
      }
      case 'site-inspections': {
        const inspection = row as SiteInspection;
        return (
          <TableRow key={inspection.id} hover>
            <TableCell padding="checkbox">
              <Checkbox checked={selected.includes(inspection.id)} onChange={() => handleToggleSelect(inspection.id)} />
            </TableCell>
            <TableCell>{inspection.stand}</TableCell>
            <TableCell>{inspection.inspector ?? 'None'}</TableCell>
            <TableCell>{inspection.inspection_date}</TableCell>
            <TableCell>{inspection.result}</TableCell>
            <TableCell align="right">
              <IconButton size="small" onClick={(event) => openRowMenu(event, inspection)}>
                <SearchIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        );
      }
      default: {
        const task = row as ProjectTask;
        return (
          <TableRow key={task.id} hover>
            <TableCell padding="checkbox">
              <Checkbox checked={selected.includes(task.id)} onChange={() => handleToggleSelect(task.id)} />
            </TableCell>
            <TableCell>{task.title}</TableCell>
            <TableCell>{task.project}</TableCell>
            <TableCell>{task.status}</TableCell>
            <TableCell>{task.priority}</TableCell>
            <TableCell>{task.planned_end_date ?? '—'}</TableCell>
            <TableCell>{renderProgress(task)}</TableCell>
            <TableCell align="right">
              <IconButton size="small" onClick={(event) => openRowMenu(event, task)}>
                <SearchIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        );
      }
    }
  };

  const handleTypeChange = (_event: React.SyntheticEvent, value: TaskType) => {
    setActiveTab(value);
    setSelected([]);
    setPage(1);
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  const handleView = () => {
    if (!currentRow) return;
    navigate(`/tasks/${activeTab}/${currentRow.id}`);
    closeRowMenu();
  };

  const handleEdit = () => {
    if (!currentRow) return;
    navigate(`/tasks/${activeTab}/${currentRow.id}/edit`);
    closeRowMenu();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tasks
      </Typography>
      <Tabs value={activeTab} onChange={handleTypeChange} aria-label="Task types" sx={{ mb: 3 }}>
        {tabOrder.map((type) => (
          <Tab key={type} label={taskTypeConfig[type].label} value={type} />
        ))}
      </Tabs>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {counts.map((metric) => (
          <Grid item xs={12} sm={6} md={3} key={metric.label}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {metric.label}
              </Typography>
              <Typography variant="h5">{metric.value}</Typography>
              <LinearProgress variant="determinate" value={Math.min(100, (metric.value / Math.max(1, metric.value + 20)) * 100)} sx={{ mt: 1 }} />
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeConfig.label}`}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All statuses</MenuItem>
              {activeConfig.statusOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {activeConfig.priorityOptions.length > 0 && (
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="">All priorities</MenuItem>
                {activeConfig.priorityOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
            {auth.hasPermission(activeConfig.createPermission) && (
              <Button variant="contained" onClick={() => navigate(`/tasks/${activeTab}/new`)}>
                New
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.length > 0 && selected.length === activeRows.length}
                    indeterminate={selected.length > 0 && selected.length < activeRows.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                {columnHeaders.map((header) => (
                  <TableCell key={header}>{header}</TableCell>
                ))}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columnHeaders.length + 2} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : activeRows.length > 0 ? (
                activeRows.map((row) => renderRow(row))
              ) : (
                <TableRow>
                  <TableCell colSpan={columnHeaders.length + 2} align="center">
                    <Box sx={{ py: 6 }}>
                      <Typography>No records found.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          {auth.hasPermission(activeConfig.deletePermission) && (
            <Button color="error" disabled={selectedCount === 0} onClick={handleBulkDelete}>
              Delete selected
            </Button>
          )}
        </Box>
        <Pagination count={Math.max(1, Math.ceil(totalCount / pageSize))} page={page} onChange={(_e, value) => setPage(value)} />
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeRowMenu}>
        <MenuItem onClick={handleView}>View</MenuItem>
        {auth.hasPermission(activeConfig.updatePermission) && <MenuItem onClick={handleEdit}>Edit</MenuItem>}
        {auth.hasPermission(activeConfig.deletePermission) && <MenuItem onClick={() => { if (currentRow) void handleDelete(currentRow.id); closeRowMenu(); }}>Delete</MenuItem>}
      </Menu>
    </Box>
  );
}
