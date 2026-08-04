import api from './axios';
import { setStoredRefreshToken } from './axios';

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  username?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<ApiResponse<LoginResponse>>('auth/login/', {
   email,
   password,
  });

  return response.data.data;
}

export async function refreshSession(): Promise<string> {
  const refreshToken = window.localStorage.getItem('meims_refresh_token');

  if (!refreshToken) {
    throw new Error('Missing refresh token');
  }

  const response = await api.post<ApiResponse<{ access: string; refresh?: string }>>('auth/refresh/', {
    refresh: refreshToken,
  });

  const responseData = response.data.data;
  if (responseData.refresh) {
    setStoredRefreshToken(responseData.refresh);
  }

  return responseData.access;
}

export async function fetchProfile(): Promise<AuthUser> {
 const response = await api.get<ApiResponse<AuthUser>>('auth/profile/');
  return response.data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post<ApiResponse<null>>('auth/logout/', {
    refresh: refreshToken,
  });
}

export async function changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
  await api.post<ApiResponse<null>>('auth/change-password/', {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post<ApiResponse<null>>('auth/forgot-password/', {
    email,
  });
}

export async function resetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string,
): Promise<void> {
  await api.post<ApiResponse<null>>('auth/reset-password/', {
    token,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
}
