import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as projectsApi from '../api/projects';

export interface ProjectsQueryOptions {
  page: number;
  pageSize: number;
  search?: string;
  status?: string; // exact status value or undefined
  ordering?: string;
}

export function useProjects(options: ProjectsQueryOptions) {
  const { page, pageSize, search, status, ordering } = options;

  return useQuery<projectsApi.ProjectListResponse, Error, projectsApi.ProjectListResponse>({
    queryKey: ['projects', page, pageSize, search, status, ordering],
    queryFn: () => projectsApi.getProjects({ page, pageSize, search, status, ordering }),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useProject(id?: string) {
  return useQuery<projectsApi.Project, Error, projectsApi.Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');
      return projectsApi.getProject(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<projectsApi.Project, Error, projectsApi.ProjectCreatePayload>({
    mutationFn: projectsApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<
    projectsApi.Project,
    Error,
    { id: string; payload: projectsApi.ProjectUpdatePayload }
  >({
    mutationFn: ({ id, payload }) => projectsApi.updateProject(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousData: unknown }>({
    mutationFn: projectsApi.deleteProject,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['projects'], exact: false });

      const previousData = queryClient.getQueriesData({ queryKey: ['projects'], exact: false });

      queryClient.setQueriesData({ queryKey: ['projects'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) return oldData;

        const filteredResults = oldData.results.filter((item: projectsApi.Project) => item.id !== id);
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - 1) : filteredResults.length;

        return {
          ...oldData,
          count,
          results: filteredResults,
        };
      });

      return { previousData };
    },
    onError: (_error, _id, onMutateResult, _context) => {
      if (onMutateResult?.previousData) {
        try {
          const previous = onMutateResult.previousData as any[];
          previous.forEach(([queryKey, data]: [unknown, unknown]) => {
            queryClient.setQueryData(queryKey as any, data);
          });
        } catch {
          // ignore
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useBulkDeleteProjects() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[], { previousData: unknown }>({
    mutationFn: projectsApi.bulkDeleteProjects,
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: ['projects'], exact: false });

      const previousData = queryClient.getQueriesData({ queryKey: ['projects'], exact: false });

      queryClient.setQueriesData({ queryKey: ['projects'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) return oldData;

        const filteredResults = oldData.results.filter((item: projectsApi.Project) => !ids.includes(item.id));
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - ids.length) : filteredResults.length;

        return {
          ...oldData,
          count,
          results: filteredResults,
        };
      });

      return { previousData };
    },
    onError: (_error, _ids, onMutateResult, _context) => {
      if (onMutateResult?.previousData) {
        try {
          const previous = onMutateResult.previousData as any[];
          previous.forEach(([queryKey, data]: [unknown, unknown]) => {
            queryClient.setQueryData(queryKey as any, data);
          });
        } catch {
          // ignore
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Dashboard hook: fetch a large page of projects and compute aggregates client-side
export function useProjectDashboard() {
  // reuse getProjects; fetch a reasonably large page (e.g., 1000) for dashboard aggregates
  return useQuery<projectsApi.ProjectListResponse, Error>({
    queryKey: ['projects', 'dashboard'],
    queryFn: () => projectsApi.getProjects({ page: 1, pageSize: 1000 }),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}



