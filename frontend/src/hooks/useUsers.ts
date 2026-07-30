import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export interface RoleSummary {
  id: number;
  name: string;
  description?: string;
  permissions?: number[];
  users?: number[];
}

interface RolesResponse {
  count?: number;
  results?: RoleSummary[];
  data?: RoleSummary[];
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

export function parseRoles(response: RolesResponse) {
  return getRoleList(response);
}
