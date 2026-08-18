import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { type PermissionSummary, type RoleSummary, usePermissions, useUsers } from '../hooks/useUsers';
import useAuth from '../auth/useAuth';

export default function UsersPage() {
  const auth = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleSummary | null>(null);
  const pageSize = 20;

  const { data, isLoading, error } = useUsers(page, pageSize, search);
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions(1, 100, '');
  const roles = (data?.results ?? data?.data ?? []) as RoleSummary[];
  const permissions = (permissionsData?.results ?? permissionsData?.data ?? []) as PermissionSummary[];
  const totalRoles = (data as { count?: number })?.count ?? roles.length;

  const permissionLookup = permissions.reduce<Record<string | number, PermissionSummary>>((accumulator, permission) => {
    accumulator[permission.id] = permission;
    return accumulator;
  }, {});

  const supportedPermissions = !selectedRole
    ? []
    : (selectedRole.permissions ?? []).map((permissionId) => permissionLookup[permissionId]).filter(Boolean);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          User access
        </Typography>
        <Typography variant="h4" component="h1">
          Roles and user summary
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          This module displays current authentication details and RBAC roles supported by the backend.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current user
              </Typography>
              <Typography variant="h6">{auth.user?.email ?? 'Not signed in'}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Employee number: {auth.user?.employee_number ?? 'Not available'}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(auth.user?.roles ?? []).map((role) => (
                  <Chip key={role} label={role} />
                ))}
                {!auth.user?.roles?.length && <Chip label="No assigned roles" />}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Search roles"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ flex: 1, minWidth: 240 }}
              />
              <Button variant="contained" onClick={() => setPage(1)}>
                Refresh
              </Button>
            </Box>
          </Paper>

          <Paper>
            {isLoading ? (
              <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Box sx={{ p: 4 }}>
                <Typography color="error">Unable to load roles from the backend.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Permissions</TableCell>
                      <TableCell>Users</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id} hover>
                        <TableCell>{role.name}</TableCell>
                        <TableCell>{role.description || 'No description'}</TableCell>
                        <TableCell>{role.permissions?.length ?? 0}</TableCell>
                        <TableCell>{role.users?.length ?? 0}</TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined" onClick={() => setSelectedRole(role)}>
                            View roles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!roles.length && (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                          No roles available. Check backend role management or try a different search term.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.max(1, Math.ceil(totalRoles / pageSize))}
              page={page}
              onChange={(_, nextPage) => setPage(nextPage)}
            />
          </Box>
        </Grid>
      </Grid>

      <Dialog open={Boolean(selectedRole)} onClose={() => setSelectedRole(null)} fullWidth maxWidth="md">
        <DialogTitle>Role details</DialogTitle>
        <DialogContent>
          {selectedRole ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Typography variant="h6">{selectedRole.name}</Typography>
              <Typography color="text.secondary">{selectedRole.description || 'No description provided.'}</Typography>
              <Typography variant="subtitle2">Assigned permissions</Typography>
              {permissionsLoading ? (
                <CircularProgress size={24} />
              ) : supportedPermissions.length ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {supportedPermissions.map((permission) => (
                    <Chip
                      key={permission.id}
                      label={permission ? `${permission.module}.${permission.action}` : 'Unknown permission'}
                      title={permission.description}
                    />
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">This role does not currently expose any backend permissions.</Typography>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRole(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
