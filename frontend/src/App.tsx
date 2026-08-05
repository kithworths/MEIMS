import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import DashboardPage from './pages/DashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './routes/ProtectedRoute';
import './App.css';
import Layout from './components/Layout';
import DepartmentsPage from './pages/DepartmentsPage';
import DepartmentDetailsPage from './pages/DepartmentDetailsPage';
import DepartmentFormPage from './pages/DepartmentFormPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import ProjectFormPage from './pages/ProjectFormPage';
import FinancePage from './pages/FinancePage';
import FinanceReceiptsPage from './pages/FinanceReceiptsPage';
import FinancePaymentDetailsPage from './pages/FinancePaymentDetailsPage';
import FinanceReceiptDetailsPage from './pages/FinanceReceiptDetailsPage';
import FinanceAllocationsPage from './pages/FinanceAllocationsPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentDetailsPage from './pages/DocumentDetailsPage';
import GISPage from './pages/GISPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import AuditPage from './pages/AuditPage';
import TasksPage from './pages/TasksPage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import TaskFormPage from './pages/TaskFormPage';
import StandsPage from './pages/StandsPage';
import StandFormPage from './pages/StandFormPage';
import StandDetailsPage from './pages/StandDetailsPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import ServerErrorPage from './pages/ServerErrorPage';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
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
                <ProtectedRoute requiredPermission="authorization.view_role">
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
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
