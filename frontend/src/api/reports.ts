import api from './axios';

export interface ReportCreatePayload {
  report_name: string;
  report_type: 'project' | 'department' | 'finance' | 'task' | 'gis' | 'audit';
  format?: 'csv' | 'xlsx' | 'pdf';
  start_date?: string | null;
  end_date?: string | null;
  department_id?: string | null;
  extra?: Record<string, any> | null;
}

export const createReport = async (payload: ReportCreatePayload) => {
  const response = await api.post('/reports/', payload);
  return response.data;
};

export const listReports = async (params?: any) => {
  const response = await api.get('/reports/', { params });
  return response.data;
};

export const getReport = async (id: string) => {
  const response = await api.get(`/reports/${id}/`);
  return response.data;
};

export default { createReport, listReports, getReport };
