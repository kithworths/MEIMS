import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <main className="page-shell">
      <div className="page-card">
        <header className="page-header">
          <p className="eyebrow">Access denied</p>
          <h1>Unauthorized</h1>
          <p className="page-description">
            You do not have permission to view this page. Please sign in with authorized credentials.
          </p>
        </header>

        <div className="content-block">
          <p>
            If you believe this is an error, contact your IT administrator or sign in with a different account.
          </p>
        </div>

        <div className="page-actions">
          <Link to="/login" className="primary-button">
            Sign in
          </Link>
          <Link to="/forgot-password" className="secondary-button">
            Recover password
          </Link>
        </div>
      </div>
    </main>
  );
}
