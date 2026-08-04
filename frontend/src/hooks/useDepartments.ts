import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as departmentsApi from '../api/departments';

export interface DepartmentsQueryOptions {
  page: number;
  pageSize: number;
  search: string;
  status: 'all' | 'active' | 'inactive';
  ordering: string;
}

export function useDepartments(options: DepartmentsQueryOptions) {
  const { page, pageSize, search, status, ordering } = options;

  return useQuery<departmentsApi.DepartmentListResponse, Error, departmentsApi.DepartmentListResponse>({
    queryKey: ['departments', page, pageSize, search, status, ordering],
    queryFn: () => departmentsApi.getDepartments({ page, pageSize, search, status, ordering }),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useDepartment(id?: string) {
  return useQuery<departmentsApi.Department, Error, departmentsApi.Department>({
    queryKey: ['department', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Department ID is required');
      }
      return departmentsApi.getDepartment(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation<departmentsApi.Department, Error, departmentsApi.DepartmentCreatePayload>({
    mutationFn: departmentsApi.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation<
    departmentsApi.Department,
    Error,
    { id: string; payload: departmentsApi.DepartmentUpdatePayload }
  >({
    mutationFn: ({ id, payload }) => departmentsApi.updateDepartment(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department', variables.id] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousData: unknown }>({
    mutationFn: departmentsApi.deleteDepartment,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['departments'], exact: false });

      const previousData = queryClient.getQueriesData({ queryKey: ['departments'], exact: false });

      queryClient.setQueriesData({ queryKey: ['departments'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) {
          return oldData;
        }

        const filteredResults = oldData.results.filter((item: departmentsApi.Department) => item.id !== id);
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - 1) : filteredResults.length;

        return {
          ...oldData,
          count,
          results: filteredResults,
        };
      });

      return { previousData };
    },
    onError: (_error, _id, context) => {
      if (context?.previousData) {
        try {
          const previous = context.previousData as any[];
          previous.forEach(([queryKey, data]: [unknown, unknown]) => {
            queryClient.setQueryData(queryKey as any, data);
          });
        } catch (_e) {
          // ignore restore errors
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useBulkDeleteDepartments() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[], { previousData: unknown }>({
    mutationFn: departmentsApi.bulkDeleteDepartments,
    onMutate: async (departmentIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: ['departments'], exact: false });

      const previousData = queryClient.getQueriesData({ queryKey: ['departments'], exact: false });

      queryClient.setQueriesData({ queryKey: ['departments'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) {
          return oldData;
        }

        const filteredResults = oldData.results.filter(
          (item: departmentsApi.Department) => !departmentIds.includes(item.id),
        );
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - departmentIds.length) : filteredResults.length;

        return {
          ...oldData,
          count,
          results: filteredResults,
        };
      });

      return { previousData };
    },
    onError: (_error, _departmentIds, context) => {
      if (context?.previousData) {
        try {
          const previous = context.previousData as any[];
          previous.forEach(([queryKey, data]: [unknown, unknown]) => {
            queryClient.setQueryData(queryKey as any, data);
          });
        } catch (_e) {
          // ignore restore errors
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}
