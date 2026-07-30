import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import LoginForm from '../components/LoginForm';
import useAuth from '../auth/useAuth';

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | string[]>();

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      setFormError(undefined);
      await auth.login(credentials.email, credentials.password);
      navigate('/', { replace: true });
    } catch (_error) {
      void _error;
      setFormError('Unable to sign in. Please check your credentials and try again.');
    }
  };

  return (
    <main className="page-shell">
      <div className="page-card">
        <header className="page-header">
          <div>
            <p className="eyebrow">Secure access</p>
            <h1>Sign in to MEIMS</h1>
            <p className="page-description">
              Use your government credentials to access the enterprise command center.
            </p>
          </div>
        </header>

        <LoginForm onSubmit={handleLogin} loading={auth.loading} errors={formError} />

        <div className="page-actions">
          <Link to="/forgot-password" className="secondary-button">
            Forgot password?
          </Link>
          <Link to="/unauthorized" className="secondary-button">
            Why am I here?
          </Link>
        </div>
      </div>
    </main>
  );
}
