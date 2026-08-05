import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../auth/useAuth';
import { usePaymentReceipt } from '../hooks/useFinance';

export default function FinanceReceiptDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const receiptQuery = usePaymentReceipt(id);

  if (receiptQuery.isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (receiptQuery.isError) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">Unable to load receipt details.</Typography>
      </Box>
    );
  }

  const receipt = receiptQuery.data;

  if (!receipt) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">Receipt not found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          Receipt details
        </Typography>
        <Typography variant="h4" component="h1" gutterBottom>
          {receipt.receipt_number}
        </Typography>
        <Typography color="text.secondary">
          Review receipt status, verify issuance, and open the finance dashboard for exports.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Payment reference
                </Typography>
                <Typography>{receipt.payment}</Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip label={receipt.status} color={receipt.status === 'Verified' ? 'success' : 'default'} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Issued at
                </Typography>
                <Typography>{new Date(receipt.issued_at).toLocaleDateString()}</Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Verified at
                </Typography>
                <Typography>{receipt.verified_at ? new Date(receipt.verified_at).toLocaleDateString() : 'Not verified'}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Original receipt
                </Typography>
                <Typography>{receipt.original_receipt ?? 'None'}</Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Receipt hash
                </Typography>
                <Typography>{receipt.verification_hash}</Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Notes
                </Typography>
                <Typography>{JSON.stringify(receipt.pdf_ready_data ?? {}, null, 2)}</Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/finance/receipts')}>
              Back to receipts
            </Button>
            {auth.hasPermission('paymentreceipts.Update') && (
              <Button variant="contained" onClick={() => navigate(`/finance/receipts/${receipt.id}/edit`)}>
                Edit receipt
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
