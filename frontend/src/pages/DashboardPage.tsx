import { useNavigate } from 'react-router-dom';
import useAuth from '../auth/useAuth';

export default function DashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await auth.logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="page-shell">
      <div className="page-card dashboard-card">
        <header className="page-header">
          <p className="eyebrow">Welcome back</p>
          <h1>MEIMS dashboard</h1>
          <p className="page-description">
            Manage records, review actions, and securely access government workflows.
          </p>
        </header>

        <div className="dashboard-summary">
          <div className="summary-item">
            <span className="summary-label">Signed in as</span>
            <strong>{auth.user?.email ?? 'Unknown user'}</strong>
          </div>
          <div className="summary-item">
            <span className="summary-label">Employee number</span>
            <strong>{auth.user?.employee_number ?? '—'}</strong>
          </div>
        </div>

        <div className="content-block">
          <p>
            This protected page confirms that your JSON Web Token is valid and that the application
            is connected to the MEIMS authentication backend.
          </p>
        </div>

        <div className="page-actions action-right">
          <button className="primary-button" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
