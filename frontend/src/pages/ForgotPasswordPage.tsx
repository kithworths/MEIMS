import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingButton from '../components/LoadingButton';
import ValidationMessages from '../components/ValidationMessages';
import { requestPasswordReset } from '../api/auth';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string | string[] | Record<string, string | string[]>>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors(undefined);
    setMessage('');

    if (!email.trim()) {
      setErrors('Please enter the email address associated with your account.');
      return;
    }

    setIsSubmitting(true);

    try {
      await requestPasswordReset(email.trim());
      setMessage(
        'If that address is known, password reset instructions will be sent to the email account. Please check your inbox.',
      );
    } catch (error) {
      setErrors('Unable to request password reset at this time. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="page-card">
        <header className="page-header">
          <p className="eyebrow">Password recovery</p>
          <h1>Request password reset</h1>
          <p className="page-description">
            Tell us the email address associated with your account and we will send instructions.
          </p>
        </header>

        {message ? <div className="success-box">{message}</div> : null}
        <ValidationMessages errors={errors} />

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="label" htmlFor="email">
              Email address
            </label>
            <input
              className="text-input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.gov"
            />
          </div>

          <LoadingButton className="primary-button" isLoading={isSubmitting}>
            Request reset link
          </LoadingButton>
        </form>

        <div className="page-actions">
          <button type="button" className="secondary-button" onClick={() => navigate(-1)}>
            Back to sign in
          </button>
          <Link to="/login" className="secondary-button">
            Sign in instead
          </Link>
        </div>
      </div>
    </main>
  );
}
