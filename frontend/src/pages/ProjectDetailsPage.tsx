import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../auth/useAuth';
import { useProject, useDeleteProject } from '../hooks/useProjects';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const { data: project, isLoading } = useProject(id);
  const deleteMutation = useDeleteProject();

  if (isLoading) return <CircularProgress />;

  if (!project) return <Typography>Project not found.</Typography>;

  const handleDelete = async () => {
    if (!auth.hasPermission('projects.Delete')) return;
    await deleteMutation.mutateAsync(project.id);
    navigate('/projects');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5">{project.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {project.code}
            </Typography>
          </Box>
          <Box>
            {auth.hasPermission('projects.Update') && (
              <Button sx={{ mr: 1 }} onClick={() => navigate(`/projects/${project.id}/edit`)}>
                Edit
              </Button>
            )}
            {auth.hasPermission('projects.Delete') && (
              <Button color="error" onClick={handleDelete}>
                Delete
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Status</Typography>
          <Typography>{project.status}</Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Timeline</Typography>
          <Typography>
            Start: {project.start_date ?? '—'} — Planned end: {project.planned_end_date ?? '—'} — Actual end:{' '}
            {project.actual_end_date ?? '—'}
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Budget</Typography>
          <Typography>{project.budget_total != null ? `${project.currency ?? 'USD'} ${project.budget_total}` : '—'}</Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Assigned department</Typography>
          <Typography>{project.metadata?.assigned_department_name ?? project.metadata?.assigned_department ?? '—'}</Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Description</Typography>
          <Typography>{project.description ?? '—'}</Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Metadata</Typography>
          <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(project.metadata ?? {}, null, 2)}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
