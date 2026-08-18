import { describe, it, expect, beforeEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api, { setAccessToken, getStoredRefreshToken } from '../api/axios';
import axios from 'axios';

describe('axios interceptors', () => {
  let mock: MockAdapter;
  let mockGlobal: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
    mockGlobal = new MockAdapter(axios);
    // clear tokens
    setAccessToken(null);
    window.localStorage.removeItem('meims_refresh_token');
  });

  function expectAuthHeader(value: any) {
    expect(value).toBeTruthy();
    expect(typeof value === 'string').toBe(true);
    expect(value === '******' || /^Bearer\s+/.test(value)).toBe(true);
  }

  it('attaches Authorization header when access token is set', async () => {
    setAccessToken('token-123');

    mock.onGet('/test').reply((config) => {
      expectAuthHeader(config.headers?.Authorization);
      return [200, { data: { ok: true } }];
    });

    const resp = await api.get('/test');
    expect(resp.status).toBe(200);
  });

  it('normalizes local request URLs before sending', async () => {
    mock.onPost('/auth/login/').reply((config) => {
      expect(config.url).toBe('/auth/login/');
      return [200, { data: { ok: true } }];
    });

    const resp = await api.post('auth/login/', { email: 'test@example.com', password: 'password' });
    expect(resp.status).toBe(200);
  });

  it('refreshes token on 401 and retries original request', async () => {
    // No access token, but refresh token exists
    window.localStorage.setItem('meims_refresh_token', 'refresh-1');

    // First call to /protected returns 401
    mock.onGet('/protected').replyOnce(401, {});

    // Refresh endpoint returns new access and new refresh token.
    // Match refresh path with a regex to allow baseURL differences.
    mockGlobal.onPost(/auth\/refresh/).reply(() => [200, { data: { access: 'new-access', refresh: 'new-refresh' } }]);

    // After refresh, the retried /protected returns 200; validate Authorization header used on retry.
    mock.onGet('/protected').reply((config) => {
      expectAuthHeader(config.headers?.Authorization);
      return [200, { data: { ok: true } }];
    });

    const resp = await api.get('/protected');
    expect(resp.status).toBe(200);
    // ensure refresh token is updated when the backend rotates it.
    expect(getStoredRefreshToken()).toBe('new-refresh');
  });
});
