import api from '../api/axios';

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  roles?: string[];
}

export async function fetchUsers(page = 1, pageSize = 20, search = '') {
  const params: Record<string, any> = { page, page_size: pageSize };
  if (search) params.search = search;

  const resp = await api.get('/users/', { params });
  // backend returns { results: [], count: N }
  return {
    items: resp.data?.results ?? [],
    total: resp.data?.count ?? 0,
  } as { items: User[]; total: number };
}
