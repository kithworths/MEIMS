import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../auth/useAuth', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../hooks/useDepartments', () => ({
  __esModule: true,
  useDepartments: vi.fn(),
  useBulkDeleteDepartments: vi.fn(),
}));

import useAuth from '../auth/useAuth';
import { useDepartments, useBulkDeleteDepartments } from '../hooks/useDepartments';
import DepartmentsPage from '../pages/DepartmentsPage';

const mockUseAuth = useAuth as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseDepartments = useDepartments as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseBulkDeleteDepartments = useBulkDeleteDepartments as unknown as { mockReturnValue: (value: unknown) => void };

describe('DepartmentsPage', () => {
  it('renders department table and action controls', () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuthenticated: true, hasPermission: () => true });
    mockUseDepartments.mockReturnValue({
      data: {
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: '1',
            department_name: 'Finance',
            department_code: 'FIN',
            description: 'Financial operations',
            head_of_department: 'Alice',
            email: 'finance@example.com',
            phone: '123-456-7890',
            office_location: 'Building A',
            is_active: true,
            created_at: '2026-01-01T12:00:00Z',
            updated_at: '2026-01-02T12:00:00Z',
          },
          {
            id: '2',
            department_name: 'IT',
            department_code: 'IT',
            description: 'Technology services',
            head_of_department: 'Bob',
            email: 'it@example.com',
            phone: '098-765-4321',
            office_location: 'Building B',
            is_active: false,
            created_at: '2026-01-05T12:00:00Z',
            updated_at: '2026-01-06T12:00:00Z',
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseBulkDeleteDepartments.mockReturnValue({ mutateAsync: vi.fn() });

    render(
      <MemoryRouter>
        <DepartmentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Departments' })).toBeDefined();
    expect(screen.getByRole('button', { name: /New Department/i })).toBeDefined();
    expect(screen.getByText('Finance')).toBeDefined();
    expect(screen.getAllByText('IT').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Inactive').length).toBeGreaterThanOrEqual(1);
  });
});
