import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import * as reportsApi from '../api/reports';

export interface ReportsQueryOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
}

export function useReports(options: ReportsQueryOptions = {}): UseQueryResult<any, Error> {
  const { page = 1, pageSize = 20, search, ordering } = options;
  return useQuery<any, Error>({
    queryKey: ['reports', page, pageSize, search, ordering],
    queryFn: () => reportsApi.listReports({ page, pageSize, search, ordering }),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useCreateReport(): UseMutationResult<any, Error, any, unknown> {
  const qc = useQueryClient();
  return useMutation<any, Error, any, unknown>({
    mutationFn: (payload: any) => reportsApi.createReport(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useGetReport(id?: string) {
  return useQuery<any, Error>({
    queryKey: ['report', id],
    queryFn: async () => {
      if (!id) throw new Error('Report id is required');
      return reportsApi.getReport(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
