import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject, useCreateProject, useUpdateProject } from '../hooks/useProjects';
import useAuth from '../auth/useAuth';

export default function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const editing = Boolean(id);
  const { data: project, isLoading } = useProject(id);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Concept');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [plannedEndDate, setPlannedEndDate] = useState<string | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    if (project) {
      setCode(project.code ?? '');
      setName(project.name ?? '');
      setDescription(project.description ?? '');
      setStatus(project.status ?? 'Concept');
      setStartDate(project.start_date ?? null);
      setPlannedEndDate(project.planned_end_date ?? null);
      setBudget(project.budget_total ?? null);
      setCurrency(project.currency ?? 'USD');
    }
  }, [project]);

  if (isLoading && editing) return <CircularProgress />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim(),
      status,
      start_date: startDate,
      planned_end_date: plannedEndDate,
      budget_total: budget,
      currency,
    } as const;

    try {
      if (editing && id) {
        if (!auth.hasPermission('projects.Update')) return;
        await updateMutation.mutateAsync({ id, payload });
        navigate(`/projects/${id}`);
      } else {
        if (!auth.hasPermission('projects.Create')) return;
        const created = await createMutation.mutateAsync(payload as any);
        navigate(`/projects/${created.id}`);
      }
    } catch (err) {
      // for now rely on field-level errors from backend; could map them to UI
      void err;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2 }} component="form" onSubmit={handleSubmit}>
        <TextField required label="Code" value={code} onChange={(e) => setCode(e.target.value)} fullWidth sx={{ mb: 2 }} />
        <TextField required label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth sx={{ mb: 2 }} />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={4}
          sx={{ mb: 2 }}
        />

        <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ mb: 2 }}>
          <MenuItem value="Concept">Concept</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
          <MenuItem value="On Hold">On Hold</MenuItem>
        </TextField>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField label="Start date" type="date" value={startDate ?? ''} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Planned end" type="date" value={plannedEndDate ?? ''} onChange={(e) => setPlannedEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField label="Budget" type="number" value={budget ?? ''} onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : null)} />
          <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Button type="submit" variant="contained">
            {editing ? 'Save changes' : 'Create project'}
          </Button>
          <Button sx={{ ml: 2 }} onClick={() => navigate('/projects')}>
            Cancel
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
