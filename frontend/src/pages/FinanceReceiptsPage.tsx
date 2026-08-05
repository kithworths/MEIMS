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
import DownloadIcon from '@mui/icons-material/Download';
import { usePaymentReceipts } from '../hooks/useFinance';
import type { PaymentReceipt } from '../api/finance';

const PAGE_SIZE = 20;

export default function FinanceReceiptsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [ordering, setOrdering] = useState('-issued_at');

  const receiptsQuery = usePaymentReceipts({ page, pageSize: PAGE_SIZE, search, status, ordering });
  const receipts = useMemo(() => receiptsQuery.data?.results ?? [], [receiptsQuery.data]);
  const pageCount = Math.max(1, Math.ceil((receiptsQuery.data?.count ?? 0) / PAGE_SIZE));

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          Receipt management
        </Typography>
        <Typography variant="h4" component="h1" gutterBottom>
          Payment receipts
        </Typography>
        <Typography color="text.secondary">
          Browse issued receipts, verify status, and export receipt records for financial review.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, minHeight: 140 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Issued receipts
            </Typography>
            <Typography variant="h5">{receiptsQuery.data?.count ?? '—'}</Typography>
            <Typography color="text.secondary">Receipts available for review and export.</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3, minHeight: 140 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Latest status
            </Typography>
            <Typography variant="h5">{status || 'All'}</Typography>
            <Typography color="text.secondary">Filtered receipt status.</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, minHeight: 140 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Actions
            </Typography>
            <Button sx={{ mr: 1 }} variant="contained" onClick={() => navigate('/finance')}>
              Back to finance
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {
                import('../api/finance').then((mod) => mod.exportReceiptsCsv({ search, status, ordering }));
              }}
            >
              Export CSV
            </Button>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            label="Search receipts"
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
          <TextField select label="Status" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="Issued">Issued</MenuItem>
            <MenuItem value="Reprinted">Reprinted</MenuItem>
            <MenuItem value="Verified">Verified</MenuItem>
            <MenuItem value="Void">Void</MenuItem>
          </TextField>
          <TextField select label="Sort" value={ordering} onChange={(event) => setOrdering(event.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="-issued_at">Newest</MenuItem>
            <MenuItem value="issued_at">Oldest</MenuItem>
            <MenuItem value="receipt_number">Receipt number</MenuItem>
          </TextField>
          <Button variant="outlined" onClick={() => receiptsQuery.refetch()}>
            Refresh
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Receipt</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Issued</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Verified at</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receiptsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : receipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No receipts found.
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((receipt: PaymentReceipt) => (
                  <TableRow key={receipt.id} hover onClick={() => navigate(`/finance/receipts/${receipt.id}`)} sx={{ cursor: 'pointer' }}>
                    <TableCell>{receipt.receipt_number}</TableCell>
                    <TableCell>{receipt.payment}</TableCell>
                    <TableCell>{new Date(receipt.issued_at).toLocaleDateString()}</TableCell>
                    <TableCell>{receipt.status}</TableCell>
                    <TableCell>{receipt.verified_at ? new Date(receipt.verified_at).toLocaleDateString() : '—'}</TableCell>
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
