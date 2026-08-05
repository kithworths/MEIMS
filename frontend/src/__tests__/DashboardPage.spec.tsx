import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../pages/DashboardPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const queryClient = new QueryClient();

const mockUseDashboardStats = vi.fn();
const mockUseFinanceDashboard = vi.fn();
const mockUseProjectDashboard = vi.fn();
const mockUseTasksDashboard = vi.fn();
const mockUsePendingStandApprovals = vi.fn();
const mockUseRecentNotifications = vi.fn();
const mockUseGISLocations = vi.fn();
const mockUseDocuments = vi.fn();
const mockUseDepartments = vi.fn();
const mockUseAuditSummary = vi.fn();

vi.mock('../hooks/useDashboardStats', () => ({
  useDashboardStats: () => mockUseDashboardStats(),
}));

vi.mock('../hooks/useFinance', () => ({
  useFinanceDashboard: () => mockUseFinanceDashboard(),
}));

vi.mock('../hooks/useProjects', () => ({
  useProjectDashboard: () => mockUseProjectDashboard(),
}));

vi.mock('../hooks/useTasks', () => ({
  useTasksDashboard: () => mockUseTasksDashboard(),
  usePendingStandApprovals: () => mockUsePendingStandApprovals(),
}));

vi.mock('../hooks/useNotifications', () => ({
  useRecentNotifications: () => mockUseRecentNotifications(),
}));

vi.mock('../hooks/useGIS', () => ({
  useGISLocations: () => mockUseGISLocations(),
}));

vi.mock('../hooks/useDocuments', () => ({
  useDocuments: () => mockUseDocuments(),
}));

vi.mock('../hooks/useDepartments', () => ({
  useDepartments: () => mockUseDepartments(),
}));

vi.mock('../hooks/useAudit', () => ({
  useAuditSummary: () => mockUseAuditSummary(),
}));

vi.mock('../auth/useAuth', () => ({
  __esModule: true,
  default: () => ({
    hasPermission: () => true,
    user: { first_name: 'Executive', last_name: 'Leader', email: 'leader@example.com' },
  }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    queryClient.clear();

    mockUseDashboardStats.mockReturnValue({ data: { healthMessage: 'All systems operational', departments: 6, projects: 24, documents: 18, payments: 120, gisLocations: 12, roles: 5, tasks: 48 }, isLoading: false, error: null });
    mockUseFinanceDashboard.mockReturnValue({ data: { total_revenue: '1200000', payment_count: 132, refund_count: 4, reversal_count: 2, daily_revenue: [ { date: '2026-01-01', amount: '120000', count: 12 }, { date: '2026-01-02', amount: '150000', count: 14 } ] }, isLoading: false, error: null });
    mockUseProjectDashboard.mockReturnValue({ data: { count: 4, next: null, previous: null, results: [ { id: 'p1', code: 'P-100', name: 'Water Supply Upgrade', status: 'Active', budget_total: 500000, planned_end_date: '2026-08-01', updated_at: '2026-03-01T12:00:00Z' }, { id: 'p2', code: 'P-101', name: 'Road Rehabilitation', status: 'Completed', budget_total: 750000, planned_end_date: '2026-05-15', updated_at: '2026-03-02T12:00:00Z' } ] }, isLoading: false, error: null });
    mockUseTasksDashboard.mockReturnValue({ data: { projectTaskCount: 18, engineerTicketCount: 7, siteVisitCount: 9, siteInspectionCount: 5 }, isLoading: false, error: null });
    mockUsePendingStandApprovals.mockReturnValue({ data: { count: 3, next: null, previous: null, results: [ { id: 'a1', from_stage: 'Planning', to_stage: 'Execution', requires_approval: true, is_active: true, created_at: '2026-03-04T09:00:00Z' } ] }, isLoading: false, error: null });
    mockUseRecentNotifications.mockReturnValue({ data: { count: 2, next: null, previous: null, results: [ { id: 'n1', title: 'Budget approval required', category: 'Finance', priority: 'High', is_read: false, is_archived: false, created_at: '2026-03-02T10:00:00Z' }, { id: 'n2', title: 'New GIS asset added', category: 'GIS', priority: 'Medium', is_read: true, is_archived: false, created_at: '2026-03-01T09:30:00Z' } ] }, isLoading: false, error: null });
    mockUseGISLocations.mockReturnValue({ data: { count: 2, next: null, previous: null, results: [ { id: 'g1', name: 'District 1', geometry_type: 'Polygon' }, { id: 'g2', name: 'District 2', geometry_type: 'Point' } ] }, isLoading: false, error: null });
    mockUseDocuments.mockReturnValue({ data: { count: 3, next: null, previous: null, results: [ { id: 'd1', title: 'Budget Plan 2026', created_at: '2026-03-01T08:00:00Z' }, { id: 'd2', title: 'Audit Findings', created_at: '2026-02-28T14:30:00Z' } ] }, isLoading: false, error: null });
    mockUseDepartments.mockReturnValue({ data: { count: 3, next: null, previous: null, results: [ { id: 'dep1', name: 'Finance', description: 'Revenue and allocations' }, { id: 'dep2', name: 'Engineering', description: 'Capital projects' } ] }, isLoading: false, error: null });
    mockUseAuditSummary.mockReturnValue({ data: { actions: [ { action: 'CREATE', count: 8 }, { action: 'UPDATE', count: 5 } ], daily_trend: [ { date: '2026-03-01', count: 5 }, { date: '2026-03-02', count: 8 } ] }, isLoading: false, error: null });
  });

  it('renders the executive dashboard with live backend data', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Executive municipal dashboard')).toBeDefined());
    expect(screen.getByText('All systems operational')).toBeDefined();
    expect(screen.getByText('Project KPIs')).toBeDefined();
    expect(screen.getByText('Finance summary')).toBeDefined();
    expect(screen.getAllByText('Departments').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Notifications')).toBeDefined();
    expect(screen.getByText('Audit activity')).toBeDefined();
    expect(screen.getByText('Recent documents')).toBeDefined();
    expect(screen.getByText('Upcoming deadlines')).toBeDefined();
  });
});
