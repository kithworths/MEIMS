import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { NotificationProvider } from './components/NotificationProvider';
import Layout from './components/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import './App.css';
import LoadingScreen from './components/LoadingScreen';
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage'));
const DepartmentDetailsPage = lazy(() => import('./pages/DepartmentDetailsPage'));
const DepartmentFormPage = lazy(() => import('./pages/DepartmentFormPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailsPage = lazy(() => import('./pages/ProjectDetailsPage'));
const ProjectFormPage = lazy(() => import('./pages/ProjectFormPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const FinanceReceiptsPage = lazy(() => import('./pages/FinanceReceiptsPage'));
const FinancePaymentDetailsPage = lazy(() => import('./pages/FinancePaymentDetailsPage'));
const FinanceReceiptDetailsPage = lazy(() => import('./pages/FinanceReceiptDetailsPage'));
const FinanceAllocationsPage = lazy(() => import('./pages/FinanceAllocationsPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const DocumentDetailsPage = lazy(() => import('./pages/DocumentDetailsPage'));
const GISPage = lazy(() => import('./pages/GISPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const TaskDetailsPage = lazy(() => import('./pages/TaskDetailsPage'));
const TaskFormPage = lazy(() => import('./pages/TaskFormPage'));
const StandsPage = lazy(() => import('./pages/StandsPage'));
const StandFormPage = lazy(() => import('./pages/StandFormPage'));
const StandDetailsPage = lazy(() => import('./pages/StandDetailsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage'));
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<LoadingScreen message="Loading page…" />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <DashboardPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredPermission="authorization.Read">
                  <Layout>
                    <UsersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRoute requiredPermission="departments.Read">
                  <Layout>
                    <DepartmentsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments/new"
              element={
                <ProtectedRoute requiredPermission="departments.Create">
                  <Layout>
                    <DepartmentFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments/:id/edit"
              element={
                <ProtectedRoute requiredPermission="departments.Update">
                  <Layout>
                    <DepartmentFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments/:id"
              element={
                <ProtectedRoute requiredPermission="departments.Read">
                  <Layout>
                    <DepartmentDetailsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Projects module routes */}
            <Route
              path="/finance"
              element={
                <ProtectedRoute requiredPermission="payments.Read">
                  <Layout>
                    <FinancePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/payments"
              element={
                <ProtectedRoute requiredPermission="payments.Read">
                  <Layout>
                    <FinancePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/receipts"
              element={
                <ProtectedRoute requiredPermission="paymentreceipts.Read">
                  <Layout>
                    <FinanceReceiptsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/receipts/:id"
              element={
                <ProtectedRoute requiredPermission="paymentreceipts.Read">
                  <Layout>
                    <FinanceReceiptDetailsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/payments/:id"
              element={
                <ProtectedRoute requiredPermission="payments.Read">
                  <Layout>
                    <FinancePaymentDetailsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/allocations"
              element={
                <ProtectedRoute requiredPermission="payments.Read">
                  <Layout>
                    <FinanceAllocationsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute requiredPermission="documents.Read">
                  <Layout>
                    <DocumentsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents/:id"
              element={
                <ProtectedRoute requiredPermission="documents.Read">
                  <Layout>
                    <DocumentDetailsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute requiredPermission="notifications.Read">
                  <Layout>
                    <NotificationsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredPermission="reports.Read">
                  <Layout>
                    <ReportsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute requiredPermission="audit.Read">
                  <Layout>
                    <AuditPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gis"
              element={
                <ProtectedRoute requiredPermission="gis.Read">
                  <Layout>
                    <GISPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute requiredPermission="projects.Read">
                  <Layout>
                    <ProjectsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/new"
              element={
                <ProtectedRoute requiredPermission="projects.Create">
                  <Layout>
                    <ProjectFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/edit"
              element={
                <ProtectedRoute requiredPermission="projects.Update">
                  <Layout>
                    <ProjectFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute requiredPermission="projects.Read">
                  <Layout>
                    <ProjectDetailsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stands"
              element={
                <ProtectedRoute requiredPermission="stands.Read">
                  <Layout>
                    <StandsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stands/new"
              element={
                <ProtectedRoute requiredPermission="stands.Create">
                  <Layout>
                    <StandFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stands/:id/edit"
              element={
                <ProtectedRoute requiredPermission="stands.Update">
                  <Layout>
                    <StandFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stands/:id"
              element={
                <ProtectedRoute requiredPermission="stands.Read">
                  <Layout>
                    <StandDetailsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TasksPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:type/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TaskFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:type/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TaskFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TaskFormPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:type/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TaskDetailsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TaskDetailsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="/500" element={<ServerErrorPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
