import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, vi } from 'vitest';

// Mock useAuth to control authentication state
vi.mock('../auth/useAuth', () => ({
  __esModule: true,
  default: vi.fn(),
}));

import useAuth from '../auth/useAuth';
import ProtectedRoute from '../routes/ProtectedRoute';

function PrivatePage() {
  return <div>Private</div>;
}

function LoginPage() {
  return <div>Login</div>;
}

function Unauthorized() {
  return <div>Unauthorized</div>;
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    (useAuth as unknown as vi.Mock).mockReturnValue({ loading: false, isAuthenticated: false, hasPermission: () => false });

    render(
      <MemoryRouter initialEntries={[ '/' ]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<ProtectedRoute><PrivatePage /></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login')).toBeDefined();
  });

  it('renders private page for authenticated users', () => {
    (useAuth as unknown as vi.Mock).mockReturnValue({ loading: false, isAuthenticated: true, hasPermission: () => true });

    render(
      <MemoryRouter initialEntries={[ '/' ]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><PrivatePage /></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Private')).toBeDefined();
  });

  it('redirects authenticated users without permission to /unauthorized', () => {
    (useAuth as unknown as vi.Mock).mockReturnValue({ loading: false, isAuthenticated: true, hasPermission: () => false });

    render(
      <MemoryRouter initialEntries={[ '/' ]}>
        <Routes>
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/" element={<ProtectedRoute requiredPermission="admin"><PrivatePage /></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Unauthorized')).toBeDefined();
  });
});
