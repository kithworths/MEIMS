import { render, screen, waitFor } from '@testing-library/react';
import AuditPage from '../pages/AuditPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const queryClient = new QueryClient();

const mockUseAudit = vi.fn<unknown[], unknown>();
const mockUseAuditSummary = vi.fn<unknown[], unknown>();
const mockUseExportAuditLogs = vi.fn<unknown[], unknown>();

vi.mock('../hooks/useAudit', () => ({
  useAudit: () => mockUseAudit(),
  useAuditSummary: () => mockUseAuditSummary(),
  useExportAuditLogs: () => mockUseExportAuditLogs(),
}));

vi.mock('../auth/useAuth', () => ({
  __esModule: true,
  default: () => ({ hasPermission: (_perm: string) => true, user: { first_name: 'Test', email: 'test@example.com' } }),
}));

describe('AuditPage', () => {
  beforeEach(() => {
    queryClient.clear();
    mockUseAudit.mockReturnValue({
      data: { results: [], count: 0 },
      isLoading: false,
      refetch: vi.fn<unknown[], unknown>(),
    });
    mockUseAuditSummary.mockReturnValue({
      data: { actions: [], daily_trend: [], roles: [] },
      isLoading: false,
    });
    mockUseExportAuditLogs.mockReturnValue({ mutateAsync: vi.fn<unknown[], unknown>(), isLoading: false });
  });

  it('renders audit centre and filters', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AuditPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Audit centre')).toBeDefined());
    expect(screen.getByText('Filters')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeTruthy();
  });
});



