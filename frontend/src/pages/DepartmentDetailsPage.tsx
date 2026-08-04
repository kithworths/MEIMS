import { useState } from 'react';
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
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useAuth from '../auth/useAuth';
import { useDepartment, useDeleteDepartment } from '../hooks/useDepartments';

export default function DepartmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const departmentQuery = useDepartment(id);
  const deleteMutation = useDeleteDepartment();

  const department = departmentQuery.data;

  const handleDelete = async () => {
    if (!id) {
      return;
    }

    setFeedback(null);

    try {
      await deleteMutation.mutateAsync(id);
      navigate('/departments');
    } catch (error) {
      setFeedback('Unable to delete the department. Please try again.');
    }
  };

  if (!id) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Department ID is missing from the route.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          Department details
        </Typography>
        <Typography variant="h4" component="h1">
          {department?.department_name ?? 'Department details'}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Review department metadata and make changes if you have permission.
        </Typography>
      </Box>

      {departmentQuery.isLoading ? (
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : departmentQuery.isError ? (
        <Box sx={{ p: 4 }}>
          <Alert severity="error">Unable to load the department. Please refresh the page or contact your administrator.</Alert>
        </Box>
      ) : department ? (
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Department code
                    </Typography>
                    <Typography variant="h6">{department.department_code}</Typography>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Head of department
                    </Typography>
                    <Typography>{department.head_of_department || 'Unassigned'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Contact email
                    </Typography>
                    <Typography>{department.email || 'Not provided'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Phone number
                    </Typography>
                    <Typography>{department.phone || 'Not provided'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Office location
                    </Typography>
                    <Typography>{department.office_location || 'Not provided'}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography>{department.description || 'No description added'}</Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={4}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip label={department.is_active ? 'Active' : 'Inactive'} color={department.is_active ? 'success' : 'default'} />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created at
                    </Typography>
                    <Typography>{new Date(department.created_at).toLocaleString()}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last updated
                    </Typography>
                    <Typography>{new Date(department.updated_at).toLocaleString()}</Typography>
                  </Box>

                  <Divider />

                  <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 1 }}>
                    {auth.hasPermission('departments.Update') && (
                      <Button variant="outlined" onClick={() => navigate(`/departments/${id}/edit`)}>
                        Edit
                      </Button>
                    )}
                    {auth.hasPermission('departments.Delete') && (
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => setConfirming(true)}
                      disabled={(deleteMutation as any).isLoading}
                      >
                        Delete
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Grid>
            </Grid>

            {feedback && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="error">{feedback}</Alert>
              </Box>
            )}

            {confirming && (
              <Box sx={{ mt: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Confirm deletion
                </Typography>
                <Typography sx={{ mb: 2 }}>
                  Are you sure you want to delete this department? This action cannot be undone.
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleDelete}
                  disabled={(deleteMutation as any).isLoading}
                  >
                    Confirm delete
                  </Button>
                  <Button variant="outlined" onClick={() => setConfirming(false)} disabled={(deleteMutation as any).isLoading}>
                    Cancel
                  </Button>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : null}
    </Box>
  );
}
