import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import useAuth from '../auth/useAuth';
import { useProjects } from '../hooks/useProjects';
import {
  useStand,
  useStandStages,
  useStandStageTransitions,
  useStageHistories,
  useCreateStageHistory,
} from '../hooks/useTasks';

export default function StandDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [transitionId, setTransitionId] = useState('');
  const [isOverride, setIsOverride] = useState(false);
  const [reason, setReason] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const standQuery = useStand(id);
  const projectsQuery = useProjects({ page: 1, pageSize: 100, search: '', status: 'all', ordering: 'name' });
  const stagesQuery = useStandStages({ page: 1, pageSize: 100 });
  const transitionsQuery = useStandStageTransitions({ page: 1, pageSize: 100 });
  const stageHistoriesQuery = useStageHistories(id);
  const createStageHistoryMutation = useCreateStageHistory();

  const stand = standQuery.data;
  const stages = stagesQuery.data?.results ?? [];
  const transitions = transitionsQuery.data?.results ?? [];
  const stageHistories = stageHistoriesQuery.data?.results ?? [];

  const project = useMemo(
    () => projectsQuery.data?.results.find((proj) => proj.id === stand?.project),
    [projectsQuery.data, stand],
  );

  const stageMap = useMemo(
    () => new Map(stages.map((stage) => [stage.id, stage])),
    [stages],
  );

  const currentStage = stand?.current_stage ? stageMap.get(stand.current_stage) : null;
  const availableTransitions = transitions.filter((transition) => transition.from_stage === stand?.current_stage);

  const sortedStages = [...stages].sort((a, b) => a.ordinal - b.ordinal);

  const handleAdvanceStage = async () => {
    if (!id || !stand) {
      return;
    }

    if (!transitionId) {
      setErrorMessage('Please choose a transition to advance the stand.');
      return;
    }

    setErrorMessage(null);

    try {
      const transition = transitions.find((item) => item.id === transitionId);
      if (!transition) {
        setErrorMessage('Selected transition is not valid.');
        return;
      }

      await createStageHistoryMutation.mutateAsync({
        stand: id,
        from_stage: stand.current_stage ?? transition.from_stage,
        to_stage: transition.to_stage,
        is_override: isOverride,
        reason: isOverride ? reason.trim() : undefined,
      });
      setNotification('Stand advanced to the next stage.');
      setTransitionId('');
      setIsOverride(false);
      setReason('');
    } catch (_error) {
      setErrorMessage('Unable to advance the stand stage. Please try again.');
    }
  };

  if (!id) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Stand ID is missing from the route.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          Stand details
        </Typography>
        <Typography variant="h4" component="h1">
          {stand?.name ?? 'Stand details'}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Review stand workflow state, history, and project assignment in one place.
        </Typography>
      </Box>

      {standQuery.isLoading ? (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : standQuery.isError ? (
        <Alert severity="error">Unable to load stand details. Please refresh and try again.</Alert>
      ) : stand ? (
        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Stand code
                    </Typography>
                    <Typography>{stand.code}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Project
                    </Typography>
                    <Typography>{project ? `${project.code} — ${project.name}` : stand.project}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Current stage
                    </Typography>
                    <Typography>{currentStage ? `${currentStage.code} — ${currentStage.name}` : 'Unassigned'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip label={stand.status} color={stand.status === 'Active' ? 'success' : 'default'} />
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Activity
                    </Typography>
                    <Typography>{stand.description || 'No description provided.'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography>{stand.address || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Area
                    </Typography>
                    <Typography>{stand.area_sq_m ? `${stand.area_sq_m} sq. m` : 'N/A'}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6">Workflow visualization</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {sortedStages.length > 0 ? (
                    sortedStages.map((stage) => (
                      <Paper
                        key={stage.id}
                        sx={{
                          p: 2,
                          minWidth: 180,
                          border: stage.id === stand.current_stage ? '2px solid' : '1px solid',
                          borderColor: stage.id === stand.current_stage ? 'primary.main' : 'divider',
                          backgroundColor: stage.id === stand.current_stage ? 'action.selected' : 'background.paper',
                        }}
                      >
                        <Typography variant="subtitle2">{stage.code}</Typography>
                        <Typography variant="body2">{stage.name}</Typography>
                      </Paper>
                    ))
                  ) : (
                    <Typography>No stages defined yet.</Typography>
                  )}
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2">Available transitions</Typography>
                  {availableTransitions.length > 0 ? (
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {availableTransitions.map((transition) => (
                        <Paper key={transition.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography>{`${stageMap.get(transition.from_stage)?.name ?? transition.from_stage} → ${stageMap.get(transition.to_stage)?.name ?? transition.to_stage}`}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Requires approval: {transition.requires_approval ? 'Yes' : 'No'}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setTransitionId(transition.id)}
                          >
                            Choose
                          </Button>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography sx={{ mt: 1 }}>No configured transitions from the current stage.</Typography>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6">Advance stage</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }} alignItems="center">
                  <Grid item xs={12} md={5}>
                    <FormControl fullWidth>
                      <InputLabel id="next-transition-label">Transition</InputLabel>
                      <Select
                        labelId="next-transition-label"
                        value={transitionId}
                        label="Transition"
                        onChange={(event: SelectChangeEvent<string>) => setTransitionId(event.target.value)}
                      >
                        <MenuItem value="">Select a transition</MenuItem>
                        {availableTransitions.map((transition) => (
                          <MenuItem key={transition.id} value={transition.id}>
                            {`${stageMap.get(transition.from_stage)?.name ?? transition.from_stage} → ${stageMap.get(transition.to_stage)?.name ?? transition.to_stage}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <FormControlLabel
                      control={<Checkbox checked={isOverride} onChange={(event) => setIsOverride(event.target.checked)} />}
                      label="Override workflow restrictions"
                    />
                  </Grid>
                  {isOverride && (
                    <Grid item xs={12}>
                      <TextField
                        label="Override reason"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        fullWidth
                        multiline
                        minRows={2}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <Button variant="contained" onClick={handleAdvanceStage}>
                      Advance stage
                    </Button>
                  </Grid>
                </Grid>
                {errorMessage ? <Alert severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert> : null}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <HistoryIcon color="action" />
                  <Typography variant="h6">Stage history</Typography>
                </Box>
                {stageHistoriesQuery.isLoading ? (
                  <CircularProgress />
                ) : stageHistories.length > 0 ? (
                  <Stack spacing={2}>
                    {stageHistories.map((entry) => (
                      <Paper key={entry.id} sx={{ p: 2 }}>
                        <Stack spacing={1}>
                          <Typography variant="subtitle2">
                            {stageMap.get(entry.from_stage)?.name ?? entry.from_stage} → {stageMap.get(entry.to_stage)?.name ?? entry.to_stage}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(entry.changed_at).toLocaleString()} by {entry.changed_by ?? 'System'}
                          </Typography>
                          {entry.reason ? <Typography>{entry.reason}</Typography> : null}
                          {entry.is_override ? <Chip label="Override" size="small" /> : null}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography>No stage history records found.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Project summary
                    </Typography>
                    <Typography>{project ? project.name : 'Unknown project'}</Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Stage count
                    </Typography>
                    <Typography>{stages.length} configured stages</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Transition count
                    </Typography>
                    <Typography>{transitions.length} configured transitions</Typography>
                  </Box>
                  <Divider />
                  <Stack direction="row" spacing={1}>
                    {auth.hasPermission('stands.Update') && (
                      <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/stands/${stand.id}/edit`)}>
                        Edit Stand
                      </Button>
                    )}
                    <Button variant="outlined" component={Link} href="/stands">
                      Back to list
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}

      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        message={notification}
      />
    </Box>
  );
}
