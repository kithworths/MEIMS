import { type FormEvent, useState } from 'react';
import PasswordInput from './PasswordInput';
import ValidationMessages from './ValidationMessages';
import LoadingButton from './LoadingButton';

interface LoginFormProps {
  onSubmit: (credentials: { email: string; password: string }) => void;
  loading?: boolean;
  errors?: string | string[] | Record<string, string | string[]>;
  message?: string;
}

export default function LoginForm({
  onSubmit,
  loading = false,
  errors,
  message,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localErrors, setLocalErrors] = useState<string[]>([]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors: string[] = [];

    if (!email.trim()) {
      validationErrors.push('Please enter your email address.');
    }

    if (!password.trim()) {
      validationErrors.push('Please enter your password.');
    }

    if (validationErrors.length) {
      setLocalErrors(validationErrors);
      return;
    }

    setLocalErrors([]);
    onSubmit({ email: email.trim(), password });
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {message ? <div className="success-box">{message}</div> : null}
      <ValidationMessages errors={localErrors.length ? localErrors : errors} />

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

      <PasswordInput
        label="Password"
        name="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <LoadingButton className="primary-button" isLoading={loading}>
        Sign in
      </LoadingButton>
    </form>
  );
}
