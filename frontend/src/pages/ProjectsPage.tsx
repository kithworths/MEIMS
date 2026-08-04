import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import Menu from '@mui/material/Menu';
import MenuItemMui from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';
import useAuth from '../auth/useAuth';
import {
  useProjects,
  useDeleteProject,
  useBulkDeleteProjects,
  useProjectDashboard,
} from '../hooks/useProjects';
import type { Project } from '../api/projects';

function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <svg width="100%" height={120} viewBox={`0 0 400 120`} preserveAspectRatio="none">
      {data.map((d, i) => {
        const barWidth = 360 / data.length;
        const h = (d.value / max) * 80;
        const x = 20 + i * barWidth;
        const y = 100 - h;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barWidth - 8} height={h} fill="#1976d2" rx={4} />
            <text x={x + (barWidth - 8) / 2} y={115} fontSize={10} textAnchor="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [ordering, setOrdering] = useState('-start_date');

  const { data, isLoading } = useProjects({ page, pageSize, search, status: statusFilter, ordering });
  const deleteMutation = useDeleteProject();
  const bulkDeleteMutation = useBulkDeleteProjects();
  const dashboardQuery = useProjectDashboard();

  const [selected, setSelected] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentRow, setCurrentRow] = useState<Project | null>(null);

  const handleOpenRowMenu = (event: React.MouseEvent<HTMLElement>, row: Project) => {
    setAnchorEl(event.currentTarget);
    setCurrentRow(row);
  };

  const handleCloseRowMenu = () => {
    setAnchorEl(null);
    setCurrentRow(null);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDelete = async (id: string) => {
    if (!auth.hasPermission('projects.Delete')) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleBulkDelete = async () => {
    if (!auth.hasPermission('projects.Delete')) return;
    if (selected.length === 0) return;
    await bulkDeleteMutation.mutateAsync(selected);
    setSelected([]);
  };

  const statusCounts = useMemo(() => {
    const list = dashboardQuery.data?.results ?? [];
    const map = new Map<string, number>();
    list.forEach((p) => map.set(p.status, (map.get(p.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [dashboardQuery.data]);

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={6} md={4}>
          <Typography variant="h5">Projects</Typography>
        </Grid>
        <Grid item xs={6} md={8} sx={{ textAlign: 'right' }}>
          {auth.hasPermission('projects.Create') && (
            <Button variant="contained" onClick={() => navigate('/projects/new')}>
              New Project
            </Button>
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <Select
            fullWidth
            value={statusFilter ?? ''}
            displayEmpty
            onChange={(e) => setStatusFilter(e.target.value ? (e.target.value as string) : undefined)}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="Concept">Concept</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="On Hold">On Hold</MenuItem>
          </Select>
        </Grid>
        <Grid item xs={6} md={2}>
          <Select fullWidth value={ordering} onChange={(e) => setOrdering(e.target.value as string)}>
            <MenuItem value="-start_date">Newest start</MenuItem>
            <MenuItem value="start_date">Oldest start</MenuItem>
            <MenuItem value="name">Name A-Z</MenuItem>
            <MenuItem value="-name">Name Z-A</MenuItem>
          </Select>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Status distribution</Typography>
            {dashboardQuery.isLoading ? <CircularProgress size={24} /> : <SimpleBarChart data={statusCounts} />}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Recent activity</Typography>
            <Box>
              {(dashboardQuery.data?.results ?? [])
                .slice(0, 5)
                .sort((a, b) => (b.updated_at ?? '')!.localeCompare(a.updated_at ?? ''))
                .map((p) => (
                  <Box key={p.id} sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="body2">
                      <strong>{p.name}</strong> — {p.status} — {p.updated_at ? new Date(p.updated_at).toLocaleString() : ''}
                    </Typography>
                  </Box>
                ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={data?.results?.length ? selected.length === data.results.length : false}
                    onChange={(e) => {
                      if (e.target.checked && data?.results) setSelected(data.results.map((r) => r.id));
                      else setSelected([]);
                    }}
                  />
                </TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>Planned end</TableCell>
                <TableCell>Budget</TableCell>
                <TableCell>Assigned</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : data && data.results.length > 0 ? (
                data.results.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selected.includes(row.id)} onChange={() => toggleSelect(row.id)} />
                    </TableCell>
                    <TableCell>{row.code}</TableCell>
                    <TableCell>
                      <Button onClick={() => navigate(`/projects/${row.id}`)}>{row.name}</Button>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.status}</Typography>
                    </TableCell>
                    <TableCell>{row.start_date ?? '—'}</TableCell>
                    <TableCell>{row.planned_end_date ?? '—'}</TableCell>
                    <TableCell>{row.budget_total != null ? `${row.currency ?? 'USD'} ${row.budget_total}` : '—'}</TableCell>
                    <TableCell>{row.metadata?.assigned_department_name ?? row.metadata?.assigned_department ?? '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => handleOpenRowMenu(e, row)}>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Box sx={{ p: 4 }}>
                      <Typography>No projects found.</Typography>
                      {auth.hasPermission('projects.Create') && (
                        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/projects/new')}>
                          Create your first project
                        </Button>
                      )}
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
          {auth.hasPermission('projects.Delete') && (
            <Button color="error" onClick={handleBulkDelete} disabled={selected.length === 0}>
              Delete selected
            </Button>
          )}
        </Box>

        <Pagination
          count={Math.max(1, Math.ceil((data?.count ?? 0) / pageSize))}
          page={page}
          onChange={(_e, v) => setPage(v)}
        />
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseRowMenu}>
        <MenuItemMui
          onClick={() => {
            if (currentRow) navigate(`/projects/${currentRow.id}`);
            handleCloseRowMenu();
          }}
        >
          View
        </MenuItemMui>
        {auth.hasPermission('projects.Update') && (
          <MenuItemMui
            onClick={() => {
              if (currentRow) navigate(`/projects/${currentRow.id}/edit`);
              handleCloseRowMenu();
            }}
          >
            Edit
          </MenuItemMui>
        )}
        {auth.hasPermission('projects.Delete') && (
          <MenuItemMui
            onClick={async () => {
              if (currentRow) await handleDelete(currentRow.id);
              handleCloseRowMenu();
            }}
          >
            Delete
          </MenuItemMui>
        )}
      </Menu>
    </Box>
  );
}
