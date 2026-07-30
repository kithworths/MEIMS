import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import LoadingButton from '../components/LoadingButton';
import PasswordInput from '../components/PasswordInput';
import ValidationMessages from '../components/ValidationMessages';
import { resetPassword } from '../api/auth';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<string | string[] | Record<string, string | string[]>>();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors(undefined);
    setMessage('');

    if (!token.trim()) {
      setErrors('Reset token is missing from the URL. Please follow the link from your email.');
      return;
    }

    if (!password.trim() || !confirmPassword.trim()) {
      setErrors('Both password fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrors('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(token, password, confirmPassword);
      setMessage('Your password was updated successfully. You can now sign in with the new password.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (_error) {
      void _error;
      setErrors('Unable to complete password reset. Please verify your reset token and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="page-card">
        <header className="page-header">
          <p className="eyebrow">Reset password</p>
          <h1>Create a new password</h1>
          <p className="page-description">
            Use the link from your email to choose a secure password for your account.
          </p>
        </header>

        {message ? <div className="success-box">{message}</div> : null}
        <ValidationMessages errors={errors} />

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <PasswordInput
            label="New password"
            name="newPassword"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <PasswordInput
            label="Confirm password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <LoadingButton className="primary-button" isLoading={isSubmitting}>
            Reset password
          </LoadingButton>
        </form>

        <div className="page-actions">
          <button type="button" className="secondary-button" onClick={() => navigate(-1)}>
            Back
          </button>
          <Link to="/login" className="secondary-button">
            Return to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
