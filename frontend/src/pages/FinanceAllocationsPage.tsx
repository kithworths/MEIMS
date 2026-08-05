import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { usePaymentAllocations } from '../hooks/useFinance';
import type { PaymentAllocation } from '../api/finance';

const PAGE_SIZE = 20;

export default function FinanceAllocationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-allocated_at');

  const allocationsQuery = usePaymentAllocations({ page, pageSize: PAGE_SIZE, search, ordering });
  const allocations = useMemo(() => allocationsQuery.data?.results ?? [], [allocationsQuery.data]);
  const pageCount = Math.max(1, Math.ceil((allocationsQuery.data?.count ?? 0) / PAGE_SIZE));

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          Allocation tracking
        </Typography>
        <Typography variant="h4" component="h1" gutterBottom>
          Payment allocations
        </Typography>
        <Typography color="text.secondary">
          Review allocated payment amounts and identify how funds are distributed across relevant targets.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, minHeight: 140 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Allocations recorded
            </Typography>
            <Typography variant="h5">{allocationsQuery.data?.count ?? '—'}</Typography>
            <Typography color="text.secondary">Allocations created against posted payments.</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Best practice
              </Typography>
              <Typography>
                Use allocations to track how funds are assigned to projects, stands, or service lines without modifying original payments.
              </Typography>
            </Box>
            <Button variant="outlined" onClick={() => navigate('/finance')}>
              Back to finance dashboard
            </Button>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            label="Search allocations"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField select label="Sort" value={ordering} onChange={(event) => setOrdering(event.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="-allocated_at">Newest</MenuItem>
            <MenuItem value="allocated_at">Oldest</MenuItem>
            <MenuItem value="amount">Amount</MenuItem>
          </TextField>
          <Button variant="outlined" onClick={() => allocationsQuery.refetch()}>
            Refresh
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payment</TableCell>
                <TableCell>Target type</TableCell>
                <TableCell>Target object</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Allocated at</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allocationsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : allocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No allocations found.
                  </TableCell>
                </TableRow>
              ) : (
                allocations.map((allocation: PaymentAllocation) => (
                  <TableRow key={allocation.id} hover>
                    <TableCell>{allocation.payment}</TableCell>
                    <TableCell>{allocation.target_content_type}</TableCell>
                    <TableCell>{allocation.target_object_id}</TableCell>
                    <TableCell>{allocation.amount}</TableCell>
                    <TableCell>{new Date(allocation.allocated_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Pagination page={page} count={pageCount} onChange={(_e, value) => setPage(value)} />
      </Box>
    </Box>
  );
}
