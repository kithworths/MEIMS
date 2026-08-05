import api from './axios';

export interface AuditQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  start_date?: string;
  end_date?: string;
  role?: string;
}

export const listAuditLogs = async (params?: AuditQueryParams) => {
  const response = await api.get('/audit/', { params });
  return response.data;
};

export const exportAuditLogs = async (params?: AuditQueryParams) => {
  const response = await api.get('/audit/export/', {
    params: { ...params, export_format: 'csv' },
    responseType: 'blob',
  });
  return response.data;
};

export const getAuditSummary = async (params?: AuditQueryParams) => {
  const response = await api.get('/audit/summary/', { params });
  return response.data;
};

export default { listAuditLogs, exportAuditLogs, getAuditSummary };