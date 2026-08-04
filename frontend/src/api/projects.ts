import api from './axios';

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string | null;
  planned_end_date?: string | null;
  actual_end_date?: string | null;
  primary_service_type_id?: string | null;
  budget_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  is_active?: boolean;
  is_deleted?: boolean;
}

export interface ProjectListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Project[];
}

export interface ProjectCreatePayload {
  code: string;
  name: string;
  description?: string;
  status?: string;
  start_date?: string | null;
  planned_end_date?: string | null;
  budget_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, any>;
}

export interface ProjectUpdatePayload {
  code?: string;
  name?: string;
  description?: string;
  status?: string;
  start_date?: string | null;
  planned_end_date?: string | null;
  actual_end_date?: string | null;
  budget_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, any>;
}

export async function getProjects(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string; // exact match
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

  if (params.status) {
    queryParams.status = params.status;
  }

  if (params.ordering) {
    queryParams.ordering = params.ordering;
  }

  const response = await api.get<ProjectListResponse>('projects/', {
    params: queryParams,
  });

  return response.data;
}

export async function getProject(id: string) {
  const response = await api.get<Project>(`projects/${id}/`);
  return response.data;
}

export async function createProject(payload: ProjectCreatePayload) {
  const response = await api.post<Project>('projects/', payload);
  return response.data;
}

export async function updateProject(id: string, payload: ProjectUpdatePayload) {
  const response = await api.patch<Project>(`projects/${id}/`, payload);
  return response.data;
}

export async function deleteProject(id: string) {
  await api.delete(`projects/${id}/`);
}

export async function bulkDeleteProjects(ids: string[]) {
  await Promise.all(ids.map((id) => api.delete(`projects/${id}/`)));
}
