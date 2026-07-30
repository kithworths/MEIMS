import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../services/users';

export function useUsers(page = 1, pageSize = 20, search = '') {
  return useQuery(['users', page, pageSize, search], () => fetchUsers(page, pageSize, search), {
    keepPreviousData: true,
  });
}
