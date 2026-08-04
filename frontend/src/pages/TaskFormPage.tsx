import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useProjects } from '../hooks/useProjects';
import {
  useProjectTask,
  useEngineerTicket,
  useSiteVisit,
  useSiteInspection,
  useCreateProjectTask,
  useUpdateProjectTask,
  useCreateEngineerTicket,
  useUpdateEngineerTicket,
  useCreateSiteVisit,
  useUpdateSiteVisit,
  useCreateSiteInspection,
  useUpdateSiteInspection,
  useStands,
  useStandStages,
} from '../hooks/useTasks';

const typeConfig = {
  'project-tasks': {
    readPermission: 'project_tasks.Read',
    createPermission: 'project_tasks.Create',
    updatePermission: 'project_tasks.Update',
    name: 'Project Task',
  },
  'engineer-tickets': {
    readPermission: 'engineer_tickets.Read',
    createPermission: 'engineer_tickets.Create',
    updatePermission: 'engineer_tickets.Update',
    name: 'Engineer Ticket',
  },
  'site-visits': {
    readPermission: 'site_visits.Read',
    createPermission: 'site_visits.Create',
    updatePermission: 'site_visits.Update',
    name: 'Site Visit',
  },
  'site-inspections': {
    readPermission: 'site_inspections.Read',
    createPermission: 'site_inspections.Create',
    updatePermission: 'site_inspections.Update',
    name: 'Site Inspection',
  },
} as const;

type TaskType = 'project-tasks' | 'engineer-tickets' | 'site-visits' | 'site-inspections';

export default function TaskFormPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const taskType = (type ?? 'project-tasks') as TaskType;
  const isProjectTask = taskType === 'project-tasks';
  const isEngineerTicket = taskType === 'engineer-tickets';
  const isSiteVisit = taskType === 'site-visits';
  const isSiteInspection = taskType === 'site-inspections';
  const config = typeConfig[taskType];
  const editing = Boolean(id);

  const projectTaskQuery = useProjectTask(taskType === 'project-tasks' ? id : undefined);
  const engineerTicketQuery = useEngineerTicket(taskType === 'engineer-tickets' ? id : undefined);
  const siteVisitQuery = useSiteVisit(taskType === 'site-visits' ? id : undefined);
  const siteInspectionQuery = useSiteInspection(taskType === 'site-inspections' ? id : undefined);

  const createProjectTask = useCreateProjectTask();
  const updateProjectTask = useUpdateProjectTask();
  const createEngineerTicket = useCreateEngineerTicket();
  const updateEngineerTicket = useUpdateEngineerTicket();
  const createSiteVisit = useCreateSiteVisit();
  const updateSiteVisit = useUpdateSiteVisit();
  const createSiteInspection = useCreateSiteInspection();
  const updateSiteInspection = useUpdateSiteInspection();

  const projectsQuery = useProjects({ page: 1, pageSize: 100, search: '', status: 'all', ordering: 'name' });
  const standsQuery = useStands({ page: 1, pageSize: 100 });
  const standStagesQuery = useStandStages({ page: 1, pageSize: 100 });

  const entity = projectTaskQuery.data ?? engineerTicketQuery.data ?? siteVisitQuery.data ?? siteInspectionQuery.data;

  const [project, setProject] = useState('');
  const [stand, setStand] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [assignee, setAssignee] = useState('');
  const [reporter, setReporter] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Open');
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('');
  const [spentHours, setSpentHours] = useState<number | ''>('');
  const [plannedStartDate, setPlannedStartDate] = useState<string>('');
  const [plannedEndDate, setPlannedEndDate] = useState<string>('');
  const [actualStartDate, setActualStartDate] = useState<string>('');
  const [actualEndDate, setActualEndDate] = useState<string>('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [result, setResult] = useState('Pass');
  const [comments, setComments] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(60);
  const [checklistJson, setChecklistJson] = useState('{}');
  const [targetStage, setTargetStage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [rowVersion, setRowVersion] = useState<number>(1);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!entity) return;

    setProject('project' in entity ? entity.project ?? '' : '');
    setStand('stand' in entity ? entity.stand ?? '' : '');
    setServiceType('service_type' in entity ? entity.service_type ?? '' : '');
    setAssignee('assignee' in entity ? entity.assignee ?? '' : '');
    setReporter('reporter' in entity ? entity.reporter ?? '' : '');
    setTitle('title' in entity ? entity.title ?? '' : '');
    setDescription('description' in entity ? entity.description ?? '' : '');
    setPriority('priority' in entity ? entity.priority ?? 'Medium' : 'Medium');
    setStatus('status' in entity ? entity.status ?? 'Open' : 'Open');
    setEstimatedHours('estimated_hours' in entity ? entity.estimated_hours ?? '' : '');
    setSpentHours('spent_hours' in entity ? entity.spent_hours ?? '' : '');
    setPlannedStartDate('planned_start_date' in entity ? entity.planned_start_date ?? '' : '');
    setPlannedEndDate('planned_end_date' in entity ? entity.planned_end_date ?? '' : '');
    setActualStartDate('actual_start_date' in entity ? entity.actual_start_date ?? '' : '');
    setActualEndDate('actual_end_date' in entity ? entity.actual_end_date ?? '' : '');
    setScheduledStart('scheduled_start' in entity ? entity.scheduled_start ?? '' : '');
    setScheduledEnd('scheduled_end' in entity ? entity.scheduled_end ?? '' : '');
    setInspectionDate('inspection_date' in entity ? entity.inspection_date ?? '' : '');
    setResult('result' in entity ? entity.result ?? 'Pass' : 'Pass');
    setComments('comments' in entity ? entity.comments ?? '' : '');
    setNotes('notes' in entity ? entity.notes ?? '' : '');
    setReminderMinutes('reminder_minutes' in entity ? entity.reminder_minutes ?? 60 : 60);
    setChecklistJson('checklist' in entity ? JSON.stringify(entity.checklist ?? {}, null, 2) : '{}');
    setTargetStage('target_stage' in entity ? entity.target_stage ?? '' : '');
    setIsActive('is_active' in entity ? entity.is_active ?? true : true);
    setRowVersion('row_version' in entity ? entity.row_version ?? 1 : 1);
  }, [entity]);

  const isLoading = editing && !entity && (projectTaskQuery.isLoading || engineerTicketQuery.isLoading || siteVisitQuery.isLoading || siteInspectionQuery.isLoading);

  const projects = projectsQuery.data?.results ?? [];
  const stands = standsQuery.data?.results ?? [];
  const standStages = standStagesQuery.data?.results ?? [];

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    try {
      if (isProjectTask) {
        const payload: any = {
          project,
          stand: stand || null,
          service_type: serviceType || null,
          assignee: assignee || null,
          title: title.trim(),
          description: description.trim(),
          priority,
          status,
          estimated_hours: estimatedHours === '' ? null : Number(estimatedHours),
          spent_hours: spentHours === '' ? null : Number(spentHours),
          planned_start_date: plannedStartDate || null,
          planned_end_date: plannedEndDate || null,
          actual_start_date: actualStartDate || null,
          actual_end_date: actualEndDate || null,
          is_active: isActive,
        };
        if (editing && id) {
          await updateProjectTask.mutateAsync({ id, payload: { ...payload, row_version: rowVersion } });
        } else {
          const created = await createProjectTask.mutateAsync(payload);
          navigate(`/tasks/${taskType}/${created.id}`);
          return;
        }
      }
      if (isEngineerTicket) {
        const payload: any = {
          project,
          stand: stand || null,
          service_type: serviceType || null,
          reporter: reporter || null,
          assignee: assignee || null,
          title: title.trim(),
          description: description.trim(),
          priority,
          status,
          is_active: isActive,
        };
        if (editing && id) {
          await updateEngineerTicket.mutateAsync({ id, payload });
        } else {
          const created = await createEngineerTicket.mutateAsync(payload);
          navigate(`/tasks/${taskType}/${created.id}`);
          return;
        }
      }
      if (isSiteVisit) {
        const payload: any = {
          stand,
          engineer: assignee || null,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          status,
          reminder_minutes: reminderMinutes,
          notes: notes || null,
          is_active: isActive,
        };
        if (editing && id) {
          await updateSiteVisit.mutateAsync({ id, payload });
        } else {
          const created = await createSiteVisit.mutateAsync(payload);
          navigate(`/tasks/${taskType}/${created.id}`);
          return;
        }
      }
      if (isSiteInspection) {
        let checklist = {};
        try {
          checklist = JSON.parse(checklistJson || '{}');
        } catch (error) {
          setFormError('Checklist must be valid JSON.');
          return;
        }
        const payload: any = {
          stand,
          inspector: assignee || null,
          inspection_date: inspectionDate,
          checklist,
          result,
          comments,
          target_stage: targetStage || null,
          is_active: isActive,
        };
        if (editing && id) {
          await updateSiteInspection.mutateAsync({ id, payload });
        } else {
          const created = await createSiteInspection.mutateAsync(payload);
          navigate(`/tasks/${taskType}/${created.id}`);
          return;
        }
      }
      if (id) {
        navigate(`/tasks/${taskType}/${id}`);
      } else {
        navigate('/tasks');
      }
    } catch (error: unknown) {
      setFormError('Unable to save task. Please review the form and try again.');
      void error;
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (editing && !entity) {
    return <Typography>Task not found.</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {editing ? `Edit ${config.name}` : `New ${config.name}`}
      </Typography>
      <Paper sx={{ p: 3 }} component="form" onSubmit={onSubmit}>
        {taskType === 'project-tasks' || taskType === 'engineer-tickets' ? (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
            <TextField
              select
              label="Project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              required
            >
              {projects.map((projectOption) => (
                <MenuItem key={projectOption.id} value={projectOption.id}>
                  {projectOption.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Stand" value={stand} onChange={(e) => setStand(e.target.value)}>
              <MenuItem value="">None</MenuItem>
              {stands.map((standOption) => (
                <MenuItem key={standOption.id} value={standOption.id}>
                  {standOption.code} {standOption.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              sx={{ gridColumn: 'span 2' }}
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              sx={{ gridColumn: 'span 2' }}
            />
            <TextField
              label="Priority"
              select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {['Low', 'Medium', 'High', 'Critical'].map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </TextField>
            <TextField label="Status" select value={status} onChange={(e) => setStatus(e.target.value)}>
              {taskType === 'project-tasks'
                ? ['Open', 'In Progress', 'Blocked', 'Completed', 'Cancelled'].map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))
                : ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'].map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
            </TextField>
            <TextField label="Assignee ID" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
            {isEngineerTicket && (
              <TextField label="Reporter ID" value={reporter} onChange={(e) => setReporter(e.target.value)} />
            )}
            {isProjectTask && (
              <>
                <TextField label="Estimated hours" type="number" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value ? Number(e.target.value) : '')} />
                <TextField label="Spent hours" type="number" value={spentHours} onChange={(e) => setSpentHours(e.target.value ? Number(e.target.value) : '')} />
                <TextField label="Planned start" type="date" value={plannedStartDate} onChange={(e) => setPlannedStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField label="Planned end" type="date" value={plannedEndDate} onChange={(e) => setPlannedEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField label="Actual start" type="date" value={actualStartDate} onChange={(e) => setActualStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField label="Actual end" type="date" value={actualEndDate} onChange={(e) => setActualEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              </>
            )}
            {isSiteVisit && (
              <>
                <TextField
                  label="Engineer ID"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                />
                <TextField
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  sx={{ gridColumn: 'span 2' }}
                />
                <TextField
                  type="datetime-local"
                  label="Start"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="datetime-local"
                  label="End"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField label="Reminder minutes" type="number" value={reminderMinutes} onChange={(e) => setReminderMinutes(Number(e.target.value))} />
              </>
            )}
            {isSiteInspection && (
              <>
                <TextField
                  label="Inspector ID"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                />
                <TextField
                  type="datetime-local"
                  label="Inspection date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField label="Result" select value={result} onChange={(e) => setResult(e.target.value)}>
                  {['Pass', 'Fail', 'Conditional Pass'].map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Target stage"
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {standStages.map((stage) => (
                    <MenuItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Checklist JSON"
                  value={checklistJson}
                  onChange={(e) => setChecklistJson(e.target.value)}
                  fullWidth
                  multiline
                  minRows={4}
                  sx={{ gridColumn: 'span 2' }}
                />
              </>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="body2">No form is available for this task type.</Typography>
          </Box>
        )}

        {formError && <Typography color="error" sx={{ mt: 2 }}>{formError}</Typography>}

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <FormControlLabel control={<Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />} label="Active" />
          <Button type="submit" variant="contained">Save</Button>
          <Button onClick={() => navigate('/tasks')}>Cancel</Button>
        </Box>
      </Paper>
    </Box>
  );
}
