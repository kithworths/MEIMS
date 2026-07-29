import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock the auth API module
vi.mock('../api/auth', () => ({
  refreshSession: vi.fn(),
  fetchProfile: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

import { refreshSession, fetchProfile } from '../api/auth';
import { AuthProvider, useAuthContext } from '../auth/AuthProvider';

function ProfileConsumer() {
  const auth = useAuthContext();
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="email">{auth.user?.email ?? ''}</span>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    window.localStorage.removeItem('meims_refresh_token');
    vi.clearAllMocks();
  });

  it('initializes unauthenticated when no refresh token', async () => {
    render(
      <AuthProvider>
        <ProfileConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('restores session when refresh token exists', async () => {
    (refreshSession as unknown as vi.Mock).mockResolvedValue('access-1');
    (fetchProfile as unknown as vi.Mock).mockResolvedValue({ email: 'test@example.com' });

    window.localStorage.setItem('meims_refresh_token', 'refresh-1');

    render(
      <AuthProvider>
        <ProfileConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('email').textContent).toBe('test@example.com');
  });
});
