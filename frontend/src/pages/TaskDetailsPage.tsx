import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import useAuth from '../auth/useAuth';
import {
  useProjectTask,
  useEngineerTicket,
  useSiteVisit,
  useSiteInspection,
  useTaskHistories,
  useEngineerTicketHistories,
  useDeleteProjectTask,
  useDeleteEngineerTicket,
  useDeleteSiteVisit,
  useDeleteSiteInspection,
} from '../hooks/useTasks';

const typeConfig = {
  'project-tasks': {
    readPermission: 'project_tasks.Read',
    updatePermission: 'project_tasks.Update',
    deletePermission: 'project_tasks.Delete',
    name: 'Project Task',
  },
  'engineer-tickets': {
    readPermission: 'engineer_tickets.Read',
    updatePermission: 'engineer_tickets.Update',
    deletePermission: 'engineer_tickets.Delete',
    name: 'Engineer Ticket',
  },
  'site-visits': {
    readPermission: 'site_visits.Read',
    updatePermission: 'site_visits.Update',
    deletePermission: 'site_visits.Delete',
    name: 'Site Visit',
  },
  'site-inspections': {
    readPermission: 'site_inspections.Read',
    updatePermission: 'site_inspections.Update',
    deletePermission: 'site_inspections.Delete',
    name: 'Site Inspection',
  },
} as const;

type TaskType = keyof typeof typeConfig;

export default function TaskDetailsPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const taskType = (type ?? 'project-tasks') as TaskType;
  const config = typeConfig[taskType];

  const projectTaskQuery = useProjectTask(taskType === 'project-tasks' ? id : undefined);
  const engineerTicketQuery = useEngineerTicket(taskType === 'engineer-tickets' ? id : undefined);
  const siteVisitQuery = useSiteVisit(taskType === 'site-visits' ? id : undefined);
  const siteInspectionQuery = useSiteInspection(taskType === 'site-inspections' ? id : undefined);
  const taskHistoriesQuery = useTaskHistories(taskType === 'project-tasks' ? id : undefined);
  const engineerTicketHistoriesQuery = useEngineerTicketHistories(taskType === 'engineer-tickets' ? id : undefined);
  const historyQuery = taskType === 'project-tasks' ? taskHistoriesQuery : engineerTicketHistoriesQuery;

  const projectTaskDelete = useDeleteProjectTask();
  const engineerTicketDelete = useDeleteEngineerTicket();
  const siteVisitDelete = useDeleteSiteVisit();
  const siteInspectionDelete = useDeleteSiteInspection();

  const isLoading = projectTaskQuery.isLoading || engineerTicketQuery.isLoading || siteVisitQuery.isLoading || siteInspectionQuery.isLoading;

  const entity = projectTaskQuery.data ?? engineerTicketQuery.data ?? siteVisitQuery.data ?? siteInspectionQuery.data;

  const handleEdit = () => {
    if (id) navigate(`/tasks/${taskType}/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!id) return;
    switch (taskType) {
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
    navigate('/tasks');
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (!entity) {
    return <Typography variant="h6">Task not found.</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4">{config.name}</Typography>
          <Typography color="text.secondary">{taskType.replace('-', ' ')}</Typography>
        </Box>
        <Box>
          {auth.hasPermission(config.updatePermission) && <Button onClick={handleEdit}>Edit</Button>}
          {auth.hasPermission(config.deletePermission) && <Button color="error" onClick={handleDelete}>Delete</Button>}
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Details</Typography>
        <List>
          {'title' in entity && <ListItem><ListItemText primary="Title" secondary={entity.title} /></ListItem>}
          {'description' in entity && <ListItem><ListItemText primary="Description" secondary={entity.description ?? '—'} /></ListItem>}
          {'project' in entity && <ListItem><ListItemText primary="Project" secondary={entity.project} /></ListItem>}
          {'stand' in entity && <ListItem><ListItemText primary="Stand" secondary={entity.stand ?? '—'} /></ListItem>}
          {'assignee' in entity && <ListItem><ListItemText primary="Assignee" secondary={entity.assignee ?? 'Unassigned'} /></ListItem>}
          {'reporter' in entity && (<ListItem><ListItemText primary="Reporter" secondary={entity.reporter ?? '—'} /></ListItem>)}
          {'status' in entity && <ListItem><ListItemText primary="Status" secondary={entity.status} /></ListItem>}
          {'priority' in entity && <ListItem><ListItemText primary="Priority" secondary={entity.priority} /></ListItem>}
          {'planned_start_date' in entity && <ListItem><ListItemText primary="Planned start" secondary={entity.planned_start_date ?? '—'} /></ListItem>}
          {'planned_end_date' in entity && <ListItem><ListItemText primary="Planned end" secondary={entity.planned_end_date ?? '—'} /></ListItem>}
          {'actual_start_date' in entity && <ListItem><ListItemText primary="Actual start" secondary={entity.actual_start_date ?? '—'} /></ListItem>}
          {'actual_end_date' in entity && <ListItem><ListItemText primary="Actual end" secondary={entity.actual_end_date ?? '—'} /></ListItem>}
          {'opened_at' in entity && <ListItem><ListItemText primary="Opened at" secondary={entity.opened_at} /></ListItem>}
          {'resolved_at' in entity && <ListItem><ListItemText primary="Resolved at" secondary={entity.resolved_at ?? '—'} /></ListItem>}
          {'closed_at' in entity && <ListItem><ListItemText primary="Closed at" secondary={entity.closed_at ?? '—'} /></ListItem>}
          {'scheduled_start' in entity && <ListItem><ListItemText primary="Scheduled start" secondary={entity.scheduled_start} /></ListItem>}
          {'scheduled_end' in entity && <ListItem><ListItemText primary="Scheduled end" secondary={entity.scheduled_end} /></ListItem>}
          {'inspection_date' in entity && <ListItem><ListItemText primary="Inspection date" secondary={entity.inspection_date} /></ListItem>}
          {'result' in entity && <ListItem><ListItemText primary="Result" secondary={entity.result} /></ListItem>}
          {'comments' in entity && <ListItem><ListItemText primary="Comments" secondary={entity.comments ?? '—'} /></ListItem>}
          {'checklist' in entity && <ListItem><ListItemText primary="Checklist" secondary={JSON.stringify(entity.checklist ?? {}, null, 2)} /></ListItem>}
          <ListItem><ListItemText primary="Created" secondary={entity.created_at} /></ListItem>
          <ListItem><ListItemText primary="Updated" secondary={entity.updated_at} /></ListItem>
        </List>
      </Paper>

      {(taskType === 'project-tasks' || taskType === 'engineer-tickets') && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>History</Typography>
          {historyQuery?.isLoading ? (
            <CircularProgress />
          ) : historyQuery?.data?.results.length ? (
            historyQuery.data.results.map((item) => (
              <Box key={item.id} sx={{ mb: 2 }}>
                <Typography variant="subtitle2">{item.changed_at}</Typography>
                <Typography variant="body2">{item.notes ?? 'Status update'}</Typography>
              </Box>
            ))
          ) : (
            <Typography>No history records found.</Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}
