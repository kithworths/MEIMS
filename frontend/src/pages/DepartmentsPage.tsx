import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import Alert from '@mui/material/Alert';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import useAuth from '../auth/useAuth';
import { useDepartments, useBulkDeleteDepartments, useExportDepartments } from '../hooks/useDepartments';
import { useNotification } from '../contexts/NotificationContext';

const PAGE_SIZE = 20;
const SORT_OPTIONS = [
  { label: 'Name ascending', value: 'department_name' },
  { label: 'Name descending', value: '-department_name' },
  { label: 'Code ascending', value: 'department_code' },
  { label: 'Code descending', value: '-department_code' },
  { label: 'Newest first', value: '-created_at' },
  { label: 'Oldest first', value: 'created_at' },
];

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [ordering, setOrdering] = useState('department_name');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const notify = useNotification();

  const departmentsQuery = useDepartments({ page, pageSize: PAGE_SIZE, search, status, ordering });
  const bulkDeleteMutation = useBulkDeleteDepartments();
  const exportMutation = useExportDepartments();

  const departments = useMemo(() => departmentsQuery.data?.results ?? [], [departmentsQuery.data]);
  const totalDepartments = departmentsQuery.data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalDepartments / PAGE_SIZE));

  const allSelected = departments.length > 0 && selectedIds.length === departments.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < departments.length;

  const onSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(departments.map((department) => department.id));
  };

  const onSelectOne = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  };

  const handleBulkDelete = async () => {
    setErrorMessage(null);
    // clear handled via notify

    try {
      await bulkDeleteMutation.mutateAsync(selectedIds);
      notify.notify({ message: `Deleted ${selectedIds.length} department${selectedIds.length === 1 ? '' : 's'} successfully.`, severity: 'success' });
      setSelectedIds([]);
    } catch {
      setErrorMessage('Unable to delete selected departments. Please try again.');
    } finally {
      setDeleteOpen(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: 'all' | 'active' | 'inactive') => {
    setStatus(value);
    setPage(1);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          Department management
        </Typography>
        <Typography variant="h4" component="h1">
          Departments
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Manage business departments, monitor active teams, and control contact details across the organization.
        </Typography>
      </Box>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Search departments"
                  value={search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'action.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="department-status-label">Status</InputLabel>
                  <Select
                    labelId="department-status-label"
                    value={status}
                    label="Status"
                    onChange={(event) => handleStatusChange(event.target.value as 'all' | 'active' | 'inactive')}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="department-sort-label">Sort by</InputLabel>
                  <Select
                    labelId="department-sort-label"
                    value={ordering}
                    label="Sort by"
                    onChange={(event) => setOrdering(event.target.value)}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Stack direction="row" spacing={1}>
                  <Button fullWidth variant="contained" onClick={() => departmentsQuery.refetch()}>
                    Refresh
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={async () => {
                      const blob = await exportMutation.mutateAsync({ page, pageSize: PAGE_SIZE, search, status, ordering });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', 'departments_export.csv');
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    }}
                    disabled={exportMutation.status === 'pending' || !auth.hasPermission('departments.Export')}
                  >
                    Export CSV
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
          {auth.hasPermission('departments.Create') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/departments/new')}>
              New Department
            </Button>
          )}
        </Grid>
      </Grid>

      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1">
              {totalDepartments} department{totalDepartments === 1 ? '' : 's'} found
            </Typography>
            {selectedIds.length > 0 && auth.hasPermission('departments.Delete') ? (
              <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)}>
                Delete {selectedIds.length} selected
              </Button>
            ) : null}
          </Stack>
        </Box>

        {departmentsQuery.isLoading ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Skeleton variant="rectangular" width={24} height={24} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="80%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="80%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="80%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="80%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="60%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="40%" />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell padding="checkbox">
                      <Skeleton variant="circular" width={24} height={24} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width="90%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton width="90%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton width="90%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton width="90%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton width="60%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton width="80%" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : departmentsQuery.isError ? (
          <Box sx={{ p: 4 }}>
            <Alert severity="error">Unable to load departments. Please try again or contact your administrator.</Alert>
          </Box>
        ) : departments.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No departments found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Use the filters or search bar to expand your results, or create a new department if you have access.
            </Typography>
            {auth.hasPermission('departments.Create') ? (
              <Button variant="contained" onClick={() => navigate('/departments/new')}>
                Create department
              </Button>
            ) : null}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={someSelected}
                      checked={allSelected}
                      onChange={onSelectAll}
                      inputProps={{ 'aria-label': 'select all departments' }}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Head</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(department.id)}
                        onChange={() => onSelectOne(department.id)}
                        inputProps={{ 'aria-label': `select department ${department.department_name}` }}
                      />
                    </TableCell>
                    <TableCell>{department.department_name}</TableCell>
                    <TableCell>{department.department_code}</TableCell>
                    <TableCell>{department.head_of_department || 'N/A'}</TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">{department.email || '—'}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {department.phone || '—'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={department.is_active ? 'Active' : 'Inactive'}
                        color={department.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton size="small" onClick={() => navigate(`/departments/${department.id}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        {auth.hasPermission('departments.Update') && (
                          <IconButton size="small" onClick={() => navigate(`/departments/${department.id}/edit`)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination count={pageCount} page={page} onChange={(_, nextPage) => setPage(nextPage)} />
      </Box>

      {deleteOpen && (
        <Paper sx={{ p: 3, mt: 2, backgroundColor: 'background.paper' }}>
          <Typography variant="h6">Confirm delete selected departments</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to delete {selectedIds.length} selected department{selectedIds.length === 1 ? '' : 's'}? This cannot be undone.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" color="error" onClick={handleBulkDelete} disabled={(bulkDeleteMutation as any).isLoading}>
              Delete {selectedIds.length}
            </Button>
            <Button variant="outlined" onClick={() => setDeleteOpen(false)} disabled={(bulkDeleteMutation as any).isLoading}>
              Cancel
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
