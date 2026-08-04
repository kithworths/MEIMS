import api from '../api/axios';

interface ApiListResponse<T> {
  count?: number;
  results?: T[];
  data?: T[];
}

function getCount(response: unknown): number {
  if (!response || typeof response !== 'object') {
    return 0;
  }

  const payload = response as ApiListResponse<unknown>;
  if (typeof payload.count === 'number') {
    return payload.count;
  }

  if (Array.isArray(payload.results)) {
    return payload.results.length;
  }

  if (Array.isArray(payload.data)) {
    return payload.data.length;
  }

  if ('length' in payload && typeof (payload as { length?: number }).length === 'number') {
    return (payload as { length: number }).length;
  }

  return 0;
}

export interface DashboardStats {
  healthMessage: string;
  departments: number;
  projects: number;
  documents: number;
  payments: number;
  gisLocations: number;
  roles: number;
  tasks: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [healthRes, departmentsRes, projectsRes, documentsRes, paymentsRes, gisRes, rolesRes, tasksRes] =
    await Promise.all([
      api.get('health/'),
      api.get('departments/'),
      api.get('projects/'),
      api.get('documents/'),
      api.get('payments/'),
      api.get('gis-locations/'),
      api.get('roles/'),
      api.get('project-tasks/', { params: { page_size: 1 } }),
    ]);
  return {
    healthMessage: healthRes.data?.message ?? 'Healthy',
    departments: getCount(departmentsRes.data),
    projects: getCount(projectsRes.data),
    documents: getCount(documentsRes.data),
    payments: getCount(paymentsRes.data),
    gisLocations: getCount(gisRes.data),
    roles: getCount(rolesRes.data),
    tasks: getCount(tasksRes.data),
  };
}
