import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import StandsPage from '../pages/StandsPage';
import * as tasksApi from '../api/tasks';

const queryClient = new QueryClient();

vi.mock('../auth/useAuth', () => ({
  default: () => ({
    hasPermission: (_permission: string) => true,
    loading: false,
    isAuthenticated: true,
    user: { email: 'test@example.com' },
  }),
}));

vi.mock('../contexts/NotificationContext', () => ({
  __esModule: true,
  useNotification: vi.fn<unknown[], unknown>(() => ({ notify: () => {} })),
}));

describe('StandsPage', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders stands, stages, and transitions tabs', async () => {
    vi.spyOn(tasksApi, 'getStands').mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 'stand-1',
          project: 'project-1',
          code: 'STAND-001',
          name: 'Stand One',
          description: 'A sample stand',
          stand_type: 'Retail',
          current_stage: 'stage-1',
          gis_location_id: null,
          address: '123 Main St',
          area_sq_m: '100.00',
          status: 'Active',
          is_active: true,
          is_deleted: false,
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
        },
      ],
    });

    vi.spyOn(tasksApi, 'getStandStages').mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 'stage-1',
          code: 'START',
          name: 'Start',
          description: 'Initial stage',
          ordinal: 1,
          is_active: true,
          is_deleted: false,
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
        },
      ],
    });

    vi.spyOn(tasksApi, 'getStandStageTransitions').mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 'transition-1',
          from_stage: 'stage-1',
          to_stage: 'stage-2',
          requires_approval: false,
          is_active: true,
          is_deleted: false,
          created_at: '2026-08-01T00:00:00Z',
          updated_at: '2026-08-01T00:00:00Z',
        },
      ],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <StandsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(tasksApi.getStands).toHaveBeenCalled());
    expect(await screen.findByText('STAND-001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new stand/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /stages/i }));
    expect(await screen.findByText('New Stage')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /transitions/i }));
    expect(await screen.findByText('New Transition')).toBeInTheDocument();
  });
});


