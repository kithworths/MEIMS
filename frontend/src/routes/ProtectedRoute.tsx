import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../auth/useAuth';
import logger from '../lib/logger';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Optional permission required to access this route */
  requiredPermission?: string;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) {
    return (
      <main className="page-shell">
        <div className="page-card">
          <p>Verifying secure session…</p>
        </div>
      </main>
    );
  }

  // Not authenticated -> redirect to login
  if (!auth.isAuthenticated) {
    logger.debug('Redirecting to /login - user not authenticated');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a permission is required but the user lacks it, send to unauthorized
  if (requiredPermission && !auth.hasPermission(requiredPermission)) {
    logger.warn('User lacks required permission', { permission: requiredPermission });
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
