import { useState, type FormEvent } from 'react';
import { useProfile } from '../hooks/useProfile';
import { changePassword } from '../api/auth';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useNotification } from '../contexts/NotificationContext';

export default function ProfilePage() {
  const { data: user, isLoading, error } = useProfile();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const notify = useNotification();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError('Please complete all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('New password and confirmation must match.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      notify.notify({ message: 'Your password has been updated successfully.', severity: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setFormError('Unable to update password. Please verify your current password and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%" py={10}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Unable to load profile information.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardHeader title="Account details" />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Email
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {user?.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Name
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {user?.first_name} {user?.last_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Employee number
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {user?.employee_number ?? 'Not available'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Role
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {String(user?.role ?? 'Not assigned')}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Change password" subheader="Protect your account with a strong password." />
        <CardContent>
          {formError ? <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert> : null}

          <Box component="form" onSubmit={handleChangePassword} noValidate>
            <TextField
              fullWidth
              label="Current password"
              type="password"
              margin="normal"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
            <TextField
              fullWidth
              label="New password"
              type="password"
              margin="normal"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Confirm new password"
              type="password"
              margin="normal"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            <Button type="submit" variant="contained" color="primary" disabled={submitting} sx={{ mt: 2 }}>
              {submitting ? 'Saving…' : 'Update password'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
