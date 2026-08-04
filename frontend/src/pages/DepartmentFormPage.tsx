import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import useAuth from '../auth/useAuth';
import { useCreateDepartment, useDepartment, useUpdateDepartment } from '../hooks/useDepartments';
import type { DepartmentCreatePayload } from '../api/departments';

interface DepartmentFormValues extends DepartmentCreatePayload {
  is_active: boolean;
}

const initialValues: DepartmentFormValues = {
  department_name: '',
  department_code: '',
  description: '',
  head_of_department: '',
  email: '',
  phone: '',
  office_location: '',
  is_active: true,
};

function validate(values: DepartmentFormValues) {
  const errors: Record<string, string> = {};

  if (!values.department_name.trim()) {
    errors.department_name = 'Department name is required.';
  }

  if (!values.department_code.trim()) {
    errors.department_code = 'Department code is required.';
  }

  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }

  return errors;
}

export default function DepartmentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const isEdit = Boolean(id);
  const departmentQuery = useDepartment(id);
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const [values, setValues] = useState<DepartmentFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (departmentQuery.data) {
      setValues({
        department_name: departmentQuery.data.department_name,
        department_code: departmentQuery.data.department_code,
        description: departmentQuery.data.description ?? '',
        head_of_department: departmentQuery.data.head_of_department ?? '',
        email: departmentQuery.data.email ?? '',
        phone: departmentQuery.data.phone ?? '',
        office_location: departmentQuery.data.office_location ?? '',
        is_active: departmentQuery.data.is_active,
      });
    }
  }, [departmentQuery.data]);

  const pageTitle = isEdit ? 'Edit department' : 'Create department';
  const submitLabel = isEdit ? 'Save changes' : 'Create department';

  const isLoading = departmentQuery.isLoading || (createMutation as any).isLoading || (updateMutation as any).isLoading;

  const handleFieldChange = (field: keyof DepartmentFormValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const isAuthorized = isEdit ? auth.hasPermission('departments.Update') : auth.hasPermission('departments.Create');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, payload: values });
        navigate(`/departments/${id}`);
      } else {
        const result = await createMutation.mutateAsync(values);
        navigate(`/departments/${result.id}`);
      }
    } catch (error) {
      setFeedback('Unable to save the department. Please verify the data and try again.');
    }
  };

  const submitDisabled = !isAuthorized || isLoading;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          {isEdit ? 'Department update' : 'New department'}
        </Typography>
        <Typography variant="h4" component="h1">
          {pageTitle}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {isEdit
            ? 'Adjust department details and save changes to keep records current.'
            : 'Create a new department and include contact and status details for your organization.'}
        </Typography>
      </Box>

      {departmentQuery.isError ? (
        <Alert severity="error">Unable to load department details. Please refresh the page.</Alert>
      ) : (
        <Card>
          <CardContent>
            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {feedback && <Alert severity="error">{feedback}</Alert>}

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Department name"
                    name="department_name"
                    value={values.department_name}
                    onChange={(event) => handleFieldChange('department_name', event.target.value)}
                    error={Boolean(errors.department_name)}
                    helperText={errors.department_name}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Department code"
                    name="department_code"
                    value={values.department_code}
                    onChange={(event) => handleFieldChange('department_code', event.target.value)}
                    error={Boolean(errors.department_code)}
                    helperText={errors.department_code}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    name="description"
                    value={values.description}
                    onChange={(event) => handleFieldChange('description', event.target.value)}
                    multiline
                    rows={4}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Head of department"
                    name="head_of_department"
                    value={values.head_of_department}
                    onChange={(event) => handleFieldChange('head_of_department', event.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Office location"
                    name="office_location"
                    value={values.office_location}
                    onChange={(event) => handleFieldChange('office_location', event.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Contact email"
                    name="email"
                    value={values.email}
                    onChange={(event) => handleFieldChange('email', event.target.value)}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Phone number"
                    name="phone"
                    value={values.phone}
                    onChange={(event) => handleFieldChange('phone', event.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="department-status-label">Status</InputLabel>
                    <Select
                      labelId="department-status-label"
                      label="Status"
                      value={values.is_active ? 'active' : 'inactive'}
                      onChange={(event) => handleFieldChange('is_active', event.target.value === 'active')}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                    <FormHelperText>Set whether the department is active for assignment and reporting.</FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => navigate('/departments')}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={submitDisabled}>
                  {isLoading ? <CircularProgress size={20} /> : submitLabel}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
