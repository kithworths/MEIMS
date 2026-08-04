import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import TasksPage from '../pages/TasksPage';
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

describe('TasksPage', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders task counts and can switch tabs', async () => {
    vi.spyOn(tasksApi, 'getProjectTasks').mockResolvedValue({ count: 1, next: null, previous: null, results: [{ id: 'task-1', project: 'proj-1', title: 'Task One', status: 'Open', priority: 'Medium', estimated_hours: 10, spent_hours: 2, planned_end_date: '2026-09-01', row_version: 1, is_active: true, is_deleted: false, created_at: '2026-08-01T00:00:00Z', updated_at: '2026-08-01T00:00:00Z' }] });
    vi.spyOn(tasksApi, 'getEngineerTickets').mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    vi.spyOn(tasksApi, 'getSiteVisits').mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    vi.spyOn(tasksApi, 'getSiteInspections').mockResolvedValue({ count: 0, next: null, previous: null, results: [] });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TasksPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(tasksApi.getProjectTasks).toHaveBeenCalled());
    await screen.findByText('Task One');

    const engineerTab = screen.getByRole('tab', { name: 'Engineer Tickets' });
    fireEvent.click(engineerTab);

    await screen.findByText('No records found.');
  });
});
