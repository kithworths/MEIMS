import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectsPage from '../pages/ProjectsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as projectsApi from '../api/projects';
import { MemoryRouter } from 'react-router-dom';

const queryClient = new QueryClient();

vi.mock('../auth/useAuth', () => ({
  default: () => ({ hasPermission: (_p: string) => true }),
}));

describe('ProjectsPage', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders list and can search', async () => {
    const fake = {
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: '1',
          code: 'PRJ001',
          name: 'Test Project',
          status: 'Active',
          start_date: '2024-01-01',
        },
      ],
    } as unknown as projectsApi.ProjectListResponse;

    vi.spyOn(projectsApi, 'getProjects').mockResolvedValue(fake);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getAllByText('Test Project').length).toBeGreaterThan(0));

    const input = screen.getByPlaceholderText('Search projects');
    fireEvent.change(input, { target: { value: 'Test' } });

    await waitFor(() => expect(projectsApi.getProjects).toHaveBeenCalled());
  });
});
