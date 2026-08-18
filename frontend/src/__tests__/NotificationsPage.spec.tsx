import { render, screen, waitFor } from '@testing-library/react';
import NotificationsPage from '../pages/NotificationsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const queryClient = new QueryClient();

const mockUseNotifications = vi.fn<unknown[], unknown>();
const mockUseMarkNotificationRead = vi.fn<unknown[], unknown>();
const mockUseArchiveNotification = vi.fn<unknown[], unknown>();
const mockUseMarkAllNotificationsRead = vi.fn<unknown[], unknown>();
const mockUseArchiveAllNotifications = vi.fn<unknown[], unknown>();

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: () => mockUseNotifications(),
  useMarkNotificationRead: () => mockUseMarkNotificationRead(),
  useArchiveNotification: () => mockUseArchiveNotification(),
  useMarkAllNotificationsRead: () => mockUseMarkAllNotificationsRead(),
  useArchiveAllNotifications: () => mockUseArchiveAllNotifications(),
}));

vi.mock('../auth/useAuth', () => ({
  __esModule: true,
  default: () => ({ hasPermission: (_perm: string) => true, user: { first_name: 'Test', email: 'test@example.com' } }),
}));

describe('NotificationsPage', () => {
  beforeEach(() => {
    queryClient.clear();
    mockUseNotifications.mockReturnValue({
      data: {
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: '1',
            title: 'Task pending approval',
            message: 'Please review the pending task.',
            category: 'Task',
            priority: 'High',
            is_read: false,
            is_archived: false,
            created_at: '2026-01-01T12:00:00Z',
          },
          {
            id: '2',
            title: 'Invoice submitted',
            message: 'A new invoice is waiting for approval.',
            category: 'Finance',
            priority: 'Medium',
            is_read: true,
            is_archived: false,
            created_at: '2026-01-02T12:00:00Z',
          },
        ],
      },
      isLoading: false,
      refetch: vi.fn<unknown[], unknown>(),
    });
    mockUseMarkNotificationRead.mockReturnValue({ mutateAsync: vi.fn<unknown[], unknown>(), status: 'idle' });
    mockUseArchiveNotification.mockReturnValue({ mutateAsync: vi.fn<unknown[], unknown>(), status: 'idle' });
    mockUseMarkAllNotificationsRead.mockReturnValue({ mutateAsync: vi.fn<unknown[], unknown>(), status: 'idle' });
    mockUseArchiveAllNotifications.mockReturnValue({ mutateAsync: vi.fn<unknown[], unknown>(), status: 'idle' });
  });

  it('renders the notification center and shows unread count', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Notification centre')).toBeDefined());
    expect(screen.getByText('Unread notifications: 1')).toBeDefined();
    expect(screen.getByText('Task pending approval')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Mark all read' })).toBeTruthy();
  });
});



