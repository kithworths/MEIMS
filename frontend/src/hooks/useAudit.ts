import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as auditApi from '../api/audit';

export interface AuditQueryOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  start_date?: string;
  end_date?: string;
  role?: string;
  enabled?: boolean;
}

export function useAudit(options: AuditQueryOptions = {}) {
  const { page = 1, pageSize = 20, search, ordering, start_date, end_date, role, enabled = true } = options;

  return useQuery<any, Error>({
    queryKey: ['audit', page, pageSize, search, ordering, start_date, end_date, role],
    queryFn: () => auditApi.listAuditLogs({ page, pageSize, search, ordering, start_date, end_date, role }),
    staleTime: 1000 * 60,
    retry: 1,
    enabled,
  });
}

export function useAuditSummary(options: AuditQueryOptions = {}) {
  const { start_date, end_date, search, role, enabled = true } = options;

  return useQuery<any, Error>({
    queryKey: ['audit-summary', start_date, end_date, search, role],
    queryFn: () => auditApi.getAuditSummary({ start_date, end_date, search, role }),
    staleTime: 1000 * 60,
    retry: 1,
    enabled,
  });
}

export function useExportAuditLogs() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (params: AuditQueryOptions) => auditApi.exportAuditLogs(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit'] }),
  });
}
