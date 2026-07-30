import api from './axios';

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
  const response = await api.post<ApiResponse<LoginResponse>>('v1/auth/login/', {
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

  const response = await api.post<ApiResponse<{ access: string }>>('v1/auth/refresh/', {
    refresh: refreshToken,
  });

  return response.data.data.access;
}

export async function fetchProfile(): Promise<AuthUser> {
  const response = await api.get<ApiResponse<AuthUser>>('v1/auth/profile/');
  return response.data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await api.post<ApiResponse<null>>('v1/auth/logout/', {
    refresh: refreshToken,
  });
}

export async function changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
  await api.post<ApiResponse<null>>('v1/auth/change-password/', {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post<ApiResponse<null>>('v1/auth/forgot-password/', {
    email,
  });
}

export async function resetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string,
): Promise<void> {
  await api.post<ApiResponse<null>>('v1/auth/reset-password/', {
    token,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
}
