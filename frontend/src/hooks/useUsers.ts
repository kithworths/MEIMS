import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export interface RoleSummary {
  id: string | number;
  name: string;
  description?: string;
  permissions?: Array<string | number>;
  users?: Array<string | number>;
}

export interface PermissionSummary {
  id: string | number;
  module: string;
  action: string;
  description?: string;
  is_active?: boolean;
}

interface RolesResponse {
  count?: number;
  results?: RoleSummary[];
  data?: RoleSummary[];
}

interface PermissionsResponse {
  count?: number;
  results?: PermissionSummary[];
  data?: PermissionSummary[];
}

function getRoleList(payload: RolesResponse): RoleSummary[] {
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export function useUsers(page: number, pageSize: number, search: string) {
  return useQuery<RolesResponse, Error, RolesResponse>({
    queryKey: ['roles', page, pageSize, search],
    queryFn: async () => {
      const response = await api.get<RolesResponse>('roles/', {
        params: {
          page,
          page_size: pageSize,
          search,
        },
      });
      return response.data;
    },
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function usePermissions(page = 1, pageSize = 100, search = '') {
  return useQuery<PermissionsResponse, Error, PermissionsResponse>({
    queryKey: ['permissions', page, pageSize, search],
    queryFn: async () => {
      const response = await api.get<PermissionsResponse>('permissions/', {
        params: {
          page,
          page_size: pageSize,
          search,
        },
      });
      return response.data;
    },
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function parseRoles(response: RolesResponse) {
  return getRoleList(response);
}
