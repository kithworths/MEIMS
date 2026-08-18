import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../auth/useAuth', () => ({
  __esModule: true,
  default: vi.fn<unknown[], unknown>(() => ({
    user: { email: 'admin@example.com', employee_number: '12345', roles: ['admin'] },
  })),
}));

vi.mock('../hooks/useUsers', () => ({
  __esModule: true,
  useUsers: vi.fn<unknown[], unknown>(),
  usePermissions: vi.fn<unknown[], unknown>(),
}));

import useAuth from '../auth/useAuth';
import { usePermissions, useUsers } from '../hooks/useUsers';
import UsersPage from '../pages/UsersPage';

const mockUseAuth = useAuth as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseUsers = useUsers as unknown as { mockReturnValue: (value: unknown) => void };
const mockUsePermissions = usePermissions as unknown as { mockReturnValue: (value: unknown) => void };

describe('UsersPage', () => {
  it('opens a role details dialog with permissions from the backend', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'admin@example.com', employee_number: '12345', roles: ['admin'] },
    });
    mockUseUsers.mockReturnValue({
      data: {
        count: 1,
        results: [
          {
            id: 1,
            name: 'Admin',
            description: 'System administrator',
            permissions: [101],
            users: [1],
          },
        ],
      },
      isLoading: false,
      error: null,
    });
    mockUsePermissions.mockReturnValue({
      data: {
        results: [
          { id: 101, module: 'authorization', action: 'Read', description: 'View roles' },
        ],
      },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'View roles' }));

    expect(screen.getByText('Role details')).toBeDefined();
    expect(screen.getByText('authorization.Read')).toBeDefined();
    expect(screen.getByText('View roles')).toBeDefined();
  });
});



