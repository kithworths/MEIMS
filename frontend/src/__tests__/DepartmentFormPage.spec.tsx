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
  useCreateDepartment: vi.fn<unknown[], unknown>(),
  useUpdateDepartment: vi.fn<unknown[], unknown>(),
}));

import useAuth from '../auth/useAuth';
import { useDepartment, useCreateDepartment, useUpdateDepartment } from '../hooks/useDepartments';
import DepartmentFormPage from '../pages/DepartmentFormPage';

const mockUseAuth = useAuth as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseDepartment = useDepartment as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseCreateDepartment = useCreateDepartment as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseUpdateDepartment = useUpdateDepartment as unknown as { mockReturnValue: (value: unknown) => void };

describe('DepartmentFormPage', () => {
  it('renders create department form for new department', () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuthenticated: true, hasPermission: () => true });
    mockUseDepartment.mockReturnValue({ data: undefined, isLoading: false, isError: false });
    mockUseCreateDepartment.mockReturnValue({ mutateAsync: vi.fn<unknown[], unknown>(), isLoading: false });
    mockUseUpdateDepartment.mockReturnValue({ mutateAsync: vi.fn<unknown[], unknown>(), isLoading: false });

    render(
      <MemoryRouter initialEntries={['/departments/new']}>
        <Routes>
          <Route path="/departments/new" element={<DepartmentFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Create department' })).toBeDefined();
    expect(screen.getAllByRole('textbox').length).toBeGreaterThanOrEqual(6);
    expect(screen.getByRole('button', { name: 'Create department' })).toBeDefined();
  });

  it('renders edit form with department data when editing', () => {
    mockUseAuth.mockReturnValue({ loading: false, isAuthenticated: true, hasPermission: () => true });
    mockUseDepartment.mockReturnValue({
      data: {
        id: '1',
        department_name: 'Service',
        department_code: 'SRV',
        description: 'Service team',
        head_of_department: 'Cassandra',
        email: 'service@example.com',
        phone: '555-234-5678',
        office_location: 'Building C',
        is_active: false,
        created_at: '2026-03-01T12:00:00Z',
        updated_at: '2026-03-02T12:00:00Z',
      },
      isLoading: false,
      isError: false,
    });
    mockUseCreateDepartment.mockReturnValue({ mutateAsync: vi.fn<unknown[], unknown>(), isLoading: false });
    mockUseUpdateDepartment.mockReturnValue({ mutateAsync: vi.fn<unknown[], unknown>(), isLoading: false });

    render(
      <MemoryRouter initialEntries={['/departments/1/edit']}>
        <Routes>
          <Route path="/departments/:id/edit" element={<DepartmentFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Edit department' })).toBeDefined();
    expect(screen.getByDisplayValue('Service')).toBeDefined();
    expect(screen.getByDisplayValue('SRV')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDefined();
  });
});



