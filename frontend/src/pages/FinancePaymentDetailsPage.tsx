import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useAuth from '../auth/useAuth';
import { usePayment } from '../hooks/useFinance';

export default function FinancePaymentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const paymentQuery = usePayment(id);
  const payment = paymentQuery.data;

  const amountLabel = useMemo(() => {
    if (!payment) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.currency }).format(payment.amount);
  }, [payment]);

  if (paymentQuery.isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (paymentQuery.isError) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">Unable to load payment details.</Typography>
      </Box>
    );
  }

  if (!payment) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">Payment not found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          Payment details
        </Typography>
        <Typography variant="h4" component="h1" gutterBottom>
          {payment.reference}
        </Typography>
        <Typography color="text.secondary">
          Review the selected payment, verify its allocation source, and export records by returning to the finance dashboard.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography>{payment.payment_type}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography>{amountLabel}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Base amount
                  </Typography>
                  <Typography>{payment.base_amount}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip label={payment.status} color={payment.status === 'Posted' ? 'success' : 'default'} />
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Project / Stand / Service
                  </Typography>
                  <Typography>{payment.project ?? payment.stand ?? payment.service_type ?? '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Payment date
                  </Typography>
                  <Typography>{new Date(payment.payment_date).toLocaleDateString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    External reference
                  </Typography>
                  <Typography>{payment.external_reference ?? '—'}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography>{payment.notes || 'No notes available'}</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/finance')}>
              Back to finance
            </Button>
            {auth.hasPermission('payments.Update') && (
              <Button variant="contained" onClick={() => navigate(`/finance/payments/${payment.id}/edit`)}>
                Edit payment
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
