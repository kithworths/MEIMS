import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import * as auditApi from '../api/audit';

export interface AuditQueryOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  start_date?: string;
  end_date?: string;
  role?: string;
}

export function useAudit(options: AuditQueryOptions = {}): UseQueryResult<any, Error> {
  const { page = 1, pageSize = 20, search, ordering, start_date, end_date, role } = options;
  return useQuery<any, Error>(
    ['audit', page, pageSize, search, ordering, start_date, end_date, role],
    () => auditApi.listAuditLogs({ page, pageSize, search, ordering, start_date, end_date, role }),
    {
      staleTime: 1000 * 60,
      retry: 1,
    }
  );
}

export function useAuditSummary(options: AuditQueryOptions = {}): UseQueryResult<any, Error> {
  const { start_date, end_date, search, role } = options;
  return useQuery<any, Error>(
    ['audit-summary', start_date, end_date, search, role],
    () => auditApi.getAuditSummary({ start_date, end_date, search, role }),
    {
      staleTime: 1000 * 60,
      retry: 1,
    }
  );
}

export function useExportAuditLogs(): UseMutationResult<any, Error, AuditQueryOptions, unknown> {
  const qc = useQueryClient();

  return useMutation<any, Error, AuditQueryOptions, unknown>({
    mutationFn: (params) => auditApi.exportAuditLogs(params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audit'] }),
  });
}
