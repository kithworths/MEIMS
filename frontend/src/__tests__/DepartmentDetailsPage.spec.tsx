import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../auth/useAuth', () => ({
  __esModule: true,
  default: vi.fn<unknown[], unknown>(),
}));

vi.mock('../hooks/useDepartments', () => ({
  __esModule: true,
  useDepartment: vi.fn<unknown[], unknown>(),
  useDeleteDepartment: vi.fn<unknown[], unknown>(),
}));

import useAuth from '../auth/useAuth';
import { useDepartment, useDeleteDepartment } from '../hooks/useDepartments';
import DepartmentDetailsPage from '../pages/DepartmentDetailsPage';

const mockUseAuth = useAuth as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseDepartment = useDepartment as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseDeleteDepartment = useDeleteDepartment as unknown as { mockReturnValue: (value: unknown) => void };

describe('DepartmentDetailsPage', () => {
  it('renders department details and action buttons', () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuthenticated: true, hasPermission: () => true });
    mockUseDepartment.mockReturnValue({
      data: {
        id: '1',
        department_name: 'Legal',
        department_code: 'LEG',
        description: 'Legal and compliance',
        head_of_department: 'Dana',
        email: 'legal@example.com',
        phone: '555-987-6543',
        office_location: 'Building D',
        is_active: true,
        created_at: '2026-02-10T09:00:00Z',
        updated_at: '2026-02-11T09:00:00Z',
      },
      isLoading: false,
      isError: false,
    });
    mockUseDeleteDepartment.mockReturnValue({ mutateAsync: vi.fn<unknown[], unknown>(), isLoading: false });

    render(
      <MemoryRouter initialEntries={['/departments/1']}>
        <Routes>
          <Route path="/departments/:id" element={<DepartmentDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Legal' })).toBeDefined();
    expect(screen.getByText('Legal and compliance')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined();
  });
});



