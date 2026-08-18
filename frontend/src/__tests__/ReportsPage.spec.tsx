import { render, screen, waitFor } from '@testing-library/react';
import ReportsPage from '../pages/ReportsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const queryClient = new QueryClient();

const mockUseReports = vi.fn<unknown[], unknown>();
const mockUseCreateReport = vi.fn<unknown[], unknown>();

vi.mock('../hooks/useReports', () => ({
  useReports: () => mockUseReports(),
  useCreateReport: () => mockUseCreateReport(),
}));

vi.mock('../auth/useAuth', () => ({
  __esModule: true,
  default: () => ({ hasPermission: (_perm: string) => true, user: { first_name: 'Test', email: 'test@example.com' } }),
}));

describe('ReportsPage', () => {
  beforeEach(() => {
    queryClient.clear();
    mockUseReports.mockReturnValue({
      results: [],
      count: 0,
      isLoading: false,
      refetch: vi.fn<unknown[], unknown>(),
    });
    mockUseCreateReport.mockReturnValue({ mutateAsync: vi.fn<unknown[], unknown>(), status: 'idle' });
  });

  it('renders reporting centre and generate form', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ReportsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Reporting centre')).toBeDefined());
    expect(screen.getByText('Generate report')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Generate' })).toBeTruthy();
  });
});



