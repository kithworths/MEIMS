import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useFinanceDashboard, usePayments } from '../hooks/useFinance';

const PAGE_SIZE = 20;

function ChartBar({ amount, max }: { amount: number; max: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
      <Box sx={{ width: 16, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
      <Box sx={{ width: '100%', bgcolor: 'action.hover', borderRadius: 1, height: 10 }}>
        <Box sx={{ width: `${Math.min(100, (amount / Math.max(1, max)) * 100)}%`, bgcolor: 'primary.main', height: '100%', borderRadius: 1 }} />
      </Box>
      <Typography variant="caption" color="text.secondary">{amount.toLocaleString()}</Typography>
    </Box>
  );
}

export default function FinancePage() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('');
  const [ordering, setOrdering] = useState('-payment_date');

  const dashboard = useFinanceDashboard();
  const paymentsQuery = usePayments({ page, pageSize: PAGE_SIZE, search, status, payment_type: paymentType, ordering });

  const payments = useMemo(() => paymentsQuery.data?.results ?? [], [paymentsQuery.data]);
  const totalCount = paymentsQuery.data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const maxDailyRevenue = useMemo(
    () => Math.max(1, ...(dashboard.data?.daily_revenue.map((item) => Number(item.amount)) ?? [0])),
    [dashboard.data],
  );

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          Finance overview
        </Typography>
        <Typography variant="h4" component="h1" gutterBottom>
          Payments and receipts
        </Typography>
        <Typography color="text.secondary">
          View revenue performance, manage receipts, and export finance records securely from the central finance dashboard.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, minHeight: 160 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total revenue
            </Typography>
            <Typography variant="h5">{dashboard.data ? `₦${Number(dashboard.data.total_revenue).toLocaleString()}` : '—'}</Typography>
            <Typography color="text.secondary">Revenue from project, stand, and service payments.</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, minHeight: 160 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Payments
            </Typography>
            <Typography variant="h5">{dashboard.data?.payment_count ?? '—'}</Typography>
            <Typography color="text.secondary">Payments posted to the system.</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, minHeight: 160 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Refunds
            </Typography>
            <Typography variant="h5">{dashboard.data?.refund_count ?? '—'}</Typography>
            <Typography color="text.secondary">Confirmed refund transactions.</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, minHeight: 160 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Reversals
            </Typography>
            <Typography variant="h5">{dashboard.data?.reversal_count ?? '—'}</Typography>
            <Typography color="text.secondary">Payments corrected or reversed.</Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Revenue history
            </Typography>
            {dashboard.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              dashboard.data?.daily_revenue.map((entry) => (
                <Box key={entry.date} sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {new Date(entry.date).toLocaleDateString()} • ₦{Number(entry.amount).toLocaleString()} • {entry.count} payments
                  </Typography>
                  <ChartBar amount={Number(entry.amount)} max={maxDailyRevenue} />
                </Box>
              ))
            )}
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Quick actions
            </Typography>
            <Button
              variant="contained"
              fullWidth
              startIcon={<ReceiptLongIcon />}
              sx={{ mb: 2 }}
              onClick={() => navigate('/finance/receipts')}
            >
              View receipts
            </Button>
            <Button variant="outlined" fullWidth startIcon={<DownloadIcon />} onClick={() => navigate('/finance/payments')}>
              Export payments
            </Button>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            label="Search payments"
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
          <TextField
            select
            label="Type"
            value={paymentType}
            onChange={(event) => setPaymentType(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All types</MenuItem>
            <MenuItem value="Project">Project</MenuItem>
            <MenuItem value="Stand">Stand</MenuItem>
            <MenuItem value="Service">Service</MenuItem>
            <MenuItem value="Refund">Refund</MenuItem>
            <MenuItem value="Reversal">Reversal</MenuItem>
          </TextField>
          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="Posted">Posted</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Failed">Failed</MenuItem>
          </TextField>
          <TextField
            select
            label="Sort"
            value={ordering}
            onChange={(event) => setOrdering(event.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="-payment_date">Newest</MenuItem>
            <MenuItem value="payment_date">Oldest</MenuItem>
            <MenuItem value="-amount">Highest amount</MenuItem>
            <MenuItem value="amount">Lowest amount</MenuItem>
          </TextField>
          <Button variant="outlined" onClick={() => paymentsQuery.refetch()}>
            Refresh
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={() => {
              import('../api/finance').then((mod) => mod.exportPaymentsCsv({ search, status, payment_type: paymentType, ordering }));
            }}
          >
            Export CSV
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ref</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Project / Stand</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment date</TableCell>
                <TableCell>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No payments found.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} hover onClick={() => navigate(`/finance/payments/${payment.id}`)} sx={{ cursor: 'pointer' }}>
                    <TableCell>{payment.reference}</TableCell>
                    <TableCell>{payment.payment_type}</TableCell>
                    <TableCell>{payment.project ?? payment.stand ?? '—'}</TableCell>
                    <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.currency }).format(payment.amount)}</TableCell>
                    <TableCell>
                      <Chip label={payment.status} size="small" color={payment.status === 'Posted' ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.external_reference ?? '—'}</TableCell>
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
