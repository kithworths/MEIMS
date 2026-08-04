import api from './axios';

export interface Department {
  id: string;
  department_name: string;
  department_code: string;
  description: string;
  head_of_department: string;
  email: string;
  phone: string;
  office_location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Department[];
}

export interface DepartmentCreatePayload {
  department_name: string;
  department_code: string;
  description?: string;
  head_of_department?: string;
  email?: string;
  phone?: string;
  office_location?: string;
  is_active?: boolean;
}

export interface DepartmentUpdatePayload {
  department_name?: string;
  department_code?: string;
  description?: string;
  head_of_department?: string;
  email?: string;
  phone?: string;
  office_location?: string;
  is_active?: boolean;
}

export async function getDepartments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  ordering?: string;
}) {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.pageSize) {
    queryParams.page_size = params.pageSize;
  }

  if (params.page && params.page > 1) {
    queryParams.offset = (params.page - 1) * (params.pageSize ?? 20);
  }

  if (params.search) {
    queryParams.search = params.search;
  }

  if (params.status === 'active') {
    queryParams.is_active = true;
  }

  if (params.status === 'inactive') {
    queryParams.is_active = false;
  }

  if (params.ordering) {
    queryParams.ordering = params.ordering;
  }

  const response = await api.get<DepartmentListResponse>('departments/', {
    params: queryParams,
  });

  return response.data;
}

export async function getDepartment(id: string) {
  const response = await api.get<Department>(`departments/${id}/`);
  return response.data;
}

export async function createDepartment(payload: DepartmentCreatePayload) {
  const response = await api.post<Department>('departments/', payload);
  return response.data;
}

export async function updateDepartment(id: string, payload: DepartmentUpdatePayload) {
  const response = await api.patch<Department>(`departments/${id}/`, payload);
  return response.data;
}

export async function deleteDepartment(id: string) {
  await api.delete(`departments/${id}/`);
}

export async function bulkDeleteDepartments(ids: string[]) {
  await Promise.all(ids.map((id) => api.delete(`departments/${id}/`)));
}
