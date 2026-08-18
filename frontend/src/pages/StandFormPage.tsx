import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import useAuth from '../auth/useAuth';
import { useProjects } from '../hooks/useProjects';
import { useStand, useStandStages, useCreateStand, useUpdateStand } from '../hooks/useTasks';

const statusOptions = ['Planned', 'Active', 'Completed', 'On Hold', 'Cancelled'];

export default function StandFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const editing = Boolean(id);

  const standQuery = useStand(id);
  const projectsQuery = useProjects({ page: 1, pageSize: 100, search: '', status: 'all', ordering: 'name' });
  const stageQuery = useStandStages({ page: 1, pageSize: 100 });
  const createStandMutation = useCreateStand();
  const updateStandMutation = useUpdateStand();

  const [project, setProject] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [standType, setStandType] = useState('');
  const [currentStage, setCurrentStage] = useState('');
  const [gisLocationId, setGisLocationId] = useState('');
  const [address, setAddress] = useState('');
  const [areaSqM, setAreaSqM] = useState<string>('');
  const [status, setStatus] = useState('Planned');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!standQuery.data) return;
    setProject(standQuery.data.project);
    setCode(standQuery.data.code);
    setName(standQuery.data.name);
    setDescription(standQuery.data.description ?? '');
    setStandType(standQuery.data.stand_type ?? '');
    setCurrentStage(standQuery.data.current_stage ?? '');
    setGisLocationId(standQuery.data.gis_location_id ?? '');
    setAddress(standQuery.data.address ?? '');
    setAreaSqM(standQuery.data.area_sq_m ? String(standQuery.data.area_sq_m) : '');
    setStatus(standQuery.data.status ?? 'Planned');
    setIsActive(standQuery.data.is_active ?? true);
  }, [standQuery.data]);

  const projects = projectsQuery.data?.results ?? [];
  const stages = stageQuery.data?.results ?? [];

  const isLoading = editing && !standQuery.data && standQuery.isLoading;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const payload = {
      project,
      code: code.trim(),
      name: name.trim(),
      description: description.trim(),
      stand_type: standType.trim() || undefined,
      current_stage: currentStage || null,
      gis_location_id: gisLocationId || null,
      address: address.trim(),
      area_sq_m: areaSqM ? Number(areaSqM) : null,
      status,
      is_active: isActive,
    };

    try {
      if (editing && id) {
        await updateStandMutation.mutateAsync({ id, payload });
      } else {
        const created = await createStandMutation.mutateAsync(payload);
        navigate(`/stands/${created.id}`);
        return;
      }
      if (id) {
        navigate(`/stands/${id}`);
      } else {
        navigate('/stands');
      }
    } catch {
      setFormError('Unable to save stand. Please check the form and try again.');
    }
  };

  if (editing && !auth.hasPermission('stands.Update')) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">You do not have permission to edit stands.</Alert>
      </Box>
    );
  }

  if (!editing && !auth.hasPermission('stands.Create')) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">You do not have permission to create stands.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="overline" color="text.secondary" gutterBottom>
        {editing ? 'Edit stand' : 'Create stand'}
      </Typography>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        {editing ? 'Stand details' : 'New stand'}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Create or update stand metadata and workflow assignment for the selected project.
      </Typography>

      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="project-label">Project</InputLabel>
                    <Select
                      labelId="project-label"
                      value={project}
                      label="Project"
                      onChange={(event) => setProject(event.target.value)}
                    >
                      <MenuItem value="">Select a project</MenuItem>
                      {projects.map((proj) => (
                        <MenuItem key={proj.id} value={proj.id}>
                          {proj.code} — {proj.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Stand code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Stand name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Stand type"
                    value={standType}
                    onChange={(event) => setStandType(event.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="current-stage-label">Current stage</InputLabel>
                    <Select
                      labelId="current-stage-label"
                      value={currentStage}
                      label="Current stage"
                      onChange={(event) => setCurrentStage(event.target.value)}
                    >
                      <MenuItem value="">Not assigned</MenuItem>
                      {stages.map((stage) => (
                        <MenuItem key={stage.id} value={stage.id}>
                          {stage.code} — {stage.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      value={status}
                      label="Status"
                      onChange={(event) => setStatus(event.target.value)}
                    >
                      {statusOptions.map((statusOption) => (
                        <MenuItem key={statusOption} value={statusOption}>
                          {statusOption}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Area (sq. m)"
                    value={areaSqM}
                    type="number"
                    onChange={(event) => setAreaSqM(event.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    fullWidth
                    multiline
                    minRows={4}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Checkbox checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />}
                    label="Active"
                  />
                </Grid>
              </Grid>

              {formError ? <Alert severity="error">{formError}</Alert> : null}

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" onClick={() => navigate('/stands')}>
                  Cancel
                </Button>
                <Button variant="contained" type="submit">
                  Save Stand
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
