import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import * as tasksApi from '../api/tasks';

export function useProjectTasks(options: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  priority?: string;
  project?: string;
  assignee?: string;
  ordering?: string;
}) {
  const { page, pageSize, search, status, priority, project, assignee, ordering } = options;

  return useQuery<tasksApi.PagedResponse<tasksApi.ProjectTask>, Error, tasksApi.PagedResponse<tasksApi.ProjectTask>>({
    queryKey: ['projectTasks', page, pageSize, search, status, priority, project, assignee, ordering],
    queryFn: () => tasksApi.getProjectTasks({ page, pageSize, search, status, priority, project, assignee, ordering }),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useProjectTask(id?: string) {
  return useQuery<tasksApi.ProjectTask, Error, tasksApi.ProjectTask>({
    queryKey: ['projectTask', id],
    queryFn: async () => {
      if (!id) throw new Error('Project task ID is required');
      return tasksApi.getProjectTask(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useCreateProjectTask() {
  const queryClient = useQueryClient();

  return useMutation<tasksApi.ProjectTask, Error, tasksApi.ProjectTaskCreatePayload>({
    mutationFn: tasksApi.createProjectTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
    },
  });
}

export function useUpdateProjectTask() {
  const queryClient = useQueryClient();

  return useMutation<
    tasksApi.ProjectTask,
    Error,
    { id: string; payload: tasksApi.ProjectTaskUpdatePayload }
  >({
    mutationFn: ({ id, payload }) => tasksApi.updateProjectTask(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
      queryClient.invalidateQueries({ queryKey: ['projectTask', variables.id] });
    },
  });
}

export function useDeleteProjectTask() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousData: unknown }>({
    mutationFn: tasksApi.deleteProjectTask,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['projectTasks'], exact: false });

      const previousData = queryClient.getQueriesData({ queryKey: ['projectTasks'], exact: false });

      queryClient.setQueriesData({ queryKey: ['projectTasks'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) return oldData;
        const filteredResults = oldData.results.filter((item: tasksApi.ProjectTask) => item.id !== id);
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - 1) : filteredResults.length;
        return { ...oldData, count, results: filteredResults };
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
          // ignore
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
    },
  });
}

export function useBulkDeleteProjectTasks() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[], { previousData: unknown }>({
    mutationFn: tasksApi.bulkDeleteProjectTasks,
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: ['projectTasks'], exact: false });
      const previousData = queryClient.getQueriesData({ queryKey: ['projectTasks'], exact: false });
      queryClient.setQueriesData({ queryKey: ['projectTasks'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) return oldData;
        const filteredResults = oldData.results.filter((item: tasksApi.ProjectTask) => !ids.includes(item.id));
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - ids.length) : filteredResults.length;
        return { ...oldData, count, results: filteredResults };
      });
      return { previousData };
    },
    onError: (_error, _ids, context) => {
      if (context?.previousData) {
        try {
          const previous = context.previousData as any[];
          previous.forEach(([queryKey, data]: [unknown, unknown]) => {
            queryClient.setQueryData(queryKey as any, data);
          });
        } catch (_e) {
          // ignore
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
    },
  });
}

export function useEngineerTickets(options: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  priority?: string;
  project?: string;
  assignee?: string;
  ordering?: string;
}) {
  const { page, pageSize, search, status, priority, project, assignee, ordering } = options;

  return useQuery<tasksApi.PagedResponse<tasksApi.EngineerTicket>, Error, tasksApi.PagedResponse<tasksApi.EngineerTicket>>({
    queryKey: ['engineerTickets', page, pageSize, search, status, priority, project, assignee, ordering],
    queryFn: () => tasksApi.getEngineerTickets({ page, pageSize, search, status, priority, project, assignee, ordering }),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useEngineerTicket(id?: string) {
  return useQuery<tasksApi.EngineerTicket, Error, tasksApi.EngineerTicket>({
    queryKey: ['engineerTicket', id],
    queryFn: async () => {
      if (!id) throw new Error('Engineer ticket ID is required');
      return tasksApi.getEngineerTicket(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useCreateEngineerTicket() {
  const queryClient = useQueryClient();

  return useMutation<tasksApi.EngineerTicket, Error, tasksApi.EngineerTicketCreatePayload>({
    mutationFn: tasksApi.createEngineerTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engineerTickets'] });
    },
  });
}

export function useUpdateEngineerTicket() {
  const queryClient = useQueryClient();

  return useMutation<
    tasksApi.EngineerTicket,
    Error,
    { id: string; payload: tasksApi.EngineerTicketUpdatePayload }
  >({
    mutationFn: ({ id, payload }) => tasksApi.updateEngineerTicket(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['engineerTickets'] });
      queryClient.invalidateQueries({ queryKey: ['engineerTicket', variables.id] });
    },
  });
}

export function useDeleteEngineerTicket() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousData: unknown }>({
    mutationFn: tasksApi.deleteEngineerTicket,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['engineerTickets'], exact: false });
      const previousData = queryClient.getQueriesData({ queryKey: ['engineerTickets'], exact: false });
      queryClient.setQueriesData({ queryKey: ['engineerTickets'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) return oldData;
        const filteredResults = oldData.results.filter((item: tasksApi.EngineerTicket) => item.id !== id);
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - 1) : filteredResults.length;
        return { ...oldData, count, results: filteredResults };
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
          // ignore
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['engineerTickets'] });
    },
  });
}

export function useBulkDeleteEngineerTickets() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[], { previousData: unknown }>({
    mutationFn: tasksApi.bulkDeleteEngineerTickets,
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: ['engineerTickets'], exact: false });
      const previousData = queryClient.getQueriesData({ queryKey: ['engineerTickets'], exact: false });
      queryClient.setQueriesData({ queryKey: ['engineerTickets'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) return oldData;
        const filteredResults = oldData.results.filter((item: tasksApi.EngineerTicket) => !ids.includes(item.id));
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - ids.length) : filteredResults.length;
        return { ...oldData, count, results: filteredResults };
      });
      return { previousData };
    },
    onError: (_error, _ids, context) => {
      if (context?.previousData) {
        try {
          const previous = context.previousData as any[];
          previous.forEach(([queryKey, data]: [unknown, unknown]) => {
            queryClient.setQueryData(queryKey as any, data);
          });
        } catch (_e) {
          // ignore
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['engineerTickets'] });
    },
  });
}

export function useSiteVisits(options: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  engineer?: string;
  stand?: string;
  ordering?: string;
}) {
  const { page, pageSize, search, status, engineer, stand, ordering } = options;

  return useQuery<tasksApi.PagedResponse<tasksApi.SiteVisit>, Error, tasksApi.PagedResponse<tasksApi.SiteVisit>>({
    queryKey: ['siteVisits', page, pageSize, search, status, engineer, stand, ordering],
    queryFn: () => tasksApi.getSiteVisits({ page, pageSize, search, status, engineer, stand, ordering }),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useSiteVisit(id?: string) {
  return useQuery<tasksApi.SiteVisit, Error, tasksApi.SiteVisit>({
    queryKey: ['siteVisit', id],
    queryFn: async () => {
      if (!id) throw new Error('Site visit ID is required');
      return tasksApi.getSiteVisit(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useCreateSiteVisit() {
  const queryClient = useQueryClient();

  return useMutation<tasksApi.SiteVisit, Error, tasksApi.SiteVisitCreatePayload>({
    mutationFn: tasksApi.createSiteVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteVisits'] });
    },
  });
}

export function useUpdateSiteVisit() {
  const queryClient = useQueryClient();

  return useMutation<
    tasksApi.SiteVisit,
    Error,
    { id: string; payload: tasksApi.SiteVisitUpdatePayload }
  >({
    mutationFn: ({ id, payload }) => tasksApi.updateSiteVisit(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siteVisits'] });
      queryClient.invalidateQueries({ queryKey: ['siteVisit', variables.id] });
    },
  });
}

export function useDeleteSiteVisit() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousData: unknown }>({
    mutationFn: tasksApi.deleteSiteVisit,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['siteVisits'], exact: false });
      const previousData = queryClient.getQueriesData({ queryKey: ['siteVisits'], exact: false });
      queryClient.setQueriesData({ queryKey: ['siteVisits'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) return oldData;
        const filteredResults = oldData.results.filter((item: tasksApi.SiteVisit) => item.id !== id);
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - 1) : filteredResults.length;
        return { ...oldData, count, results: filteredResults };
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
          // ignore
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['siteVisits'] });
    },
  });
}

export function useBulkDeleteSiteVisits() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[], { previousData: unknown }>({
    mutationFn: tasksApi.bulkDeleteSiteVisits,
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: ['siteVisits'], exact: false });
      const previousData = queryClient.getQueriesData({ queryKey: ['siteVisits'], exact: false });
      queryClient.setQueriesData({ queryKey: ['siteVisits'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) return oldData;
        const filteredResults = oldData.results.filter((item: tasksApi.SiteVisit) => !ids.includes(item.id));
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - ids.length) : filteredResults.length;
        return { ...oldData, count, results: filteredResults };
      });
      return { previousData };
    },
    onError: (_error, _ids, context) => {
      if (context?.previousData) {
        try {
          const previous = context.previousData as any[];
          previous.forEach(([queryKey, data]: [unknown, unknown]) => {
            queryClient.setQueryData(queryKey as any, data);
          });
        } catch (_e) {
          // ignore
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['siteVisits'] });
    },
  });
}

export function useSiteInspections(options: {
  page: number;
  pageSize: number;
  search?: string;
  result?: string;
  inspector?: string;
  stand?: string;
  ordering?: string;
}) {
  const { page, pageSize, search, result, inspector, stand, ordering } = options;

  return useQuery<tasksApi.PagedResponse<tasksApi.SiteInspection>, Error, tasksApi.PagedResponse<tasksApi.SiteInspection>>({
    queryKey: ['siteInspections', page, pageSize, search, result, inspector, stand, ordering],
    queryFn: () => tasksApi.getSiteInspections({ page, pageSize, search, result, inspector, stand, ordering }),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useSiteInspection(id?: string) {
  return useQuery<tasksApi.SiteInspection, Error, tasksApi.SiteInspection>({
    queryKey: ['siteInspection', id],
    queryFn: async () => {
      if (!id) throw new Error('Site inspection ID is required');
      return tasksApi.getSiteInspection(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useCreateSiteInspection() {
  const queryClient = useQueryClient();

  return useMutation<tasksApi.SiteInspection, Error, tasksApi.SiteInspectionCreatePayload>({
    mutationFn: tasksApi.createSiteInspection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteInspections'] });
    },
  });
}

export function useUpdateSiteInspection() {
  const queryClient = useQueryClient();

  return useMutation<
    tasksApi.SiteInspection,
    Error,
    { id: string; payload: tasksApi.SiteInspectionUpdatePayload }
  >({
    mutationFn: ({ id, payload }) => tasksApi.updateSiteInspection(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siteInspections'] });
      queryClient.invalidateQueries({ queryKey: ['siteInspection', variables.id] });
    },
  });
}

export function useDeleteSiteInspection() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousData: unknown }>({
    mutationFn: tasksApi.deleteSiteInspection,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['siteInspections'], exact: false });
      const previousData = queryClient.getQueriesData({ queryKey: ['siteInspections'], exact: false });
      queryClient.setQueriesData({ queryKey: ['siteInspections'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) return oldData;
        const filteredResults = oldData.results.filter((item: tasksApi.SiteInspection) => item.id !== id);
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - 1) : filteredResults.length;
        return { ...oldData, count, results: filteredResults };
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
          // ignore
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['siteInspections'] });
    },
  });
}

export function useBulkDeleteSiteInspections() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[], { previousData: unknown }>({
    mutationFn: tasksApi.bulkDeleteSiteInspections,
    onMutate: async (ids: string[]) => {
      await queryClient.cancelQueries({ queryKey: ['siteInspections'], exact: false });
      const previousData = queryClient.getQueriesData({ queryKey: ['siteInspections'], exact: false });
      queryClient.setQueriesData({ queryKey: ['siteInspections'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) return oldData;
        const filteredResults = oldData.results.filter((item: tasksApi.SiteInspection) => !ids.includes(item.id));
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - ids.length) : filteredResults.length;
        return { ...oldData, count, results: filteredResults };
      });
      return { previousData };
    },
    onError: (_error, _ids, context) => {
      if (context?.previousData) {
        try {
          const previous = context.previousData as any[];
          previous.forEach(([queryKey, data]: [unknown, unknown]) => {
            queryClient.setQueryData(queryKey as any, data);
          });
        } catch (_e) {
          // ignore
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['siteInspections'] });
    },
  });
}

export function useTaskHistories(taskId?: string) {
  return useQuery<tasksApi.PagedResponse<tasksApi.TaskHistory>, Error, tasksApi.PagedResponse<tasksApi.TaskHistory>>({
    queryKey: ['taskHistories', taskId],
    queryFn: async () => {
      if (!taskId) throw new Error('Task ID is required');
      return tasksApi.getTaskHistories({ page: 1, pageSize: 20, task: taskId });
    },
    enabled: Boolean(taskId),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function usePendingStandApprovals() {
  return useQuery<tasksApi.PagedResponse<tasksApi.StandStageTransition>, Error>({
    queryKey: ['standStageTransitions', 'requiresApproval', true],
    queryFn: () => tasksApi.getStandStageTransitions({ page: 1, pageSize: 5, requiresApproval: true, ordering: '-created_at' }),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useEngineerTicketHistories(ticketId?: string) {
  return useQuery<tasksApi.PagedResponse<tasksApi.EngineerTicketHistory>, Error, tasksApi.PagedResponse<tasksApi.EngineerTicketHistory>>({
    queryKey: ['engineerTicketHistories', ticketId],
    queryFn: async () => {
      if (!ticketId) throw new Error('Engineer ticket ID is required');
      return tasksApi.getEngineerTicketHistories({ page: 1, pageSize: 20, ticket: ticketId });
    },
    enabled: Boolean(ticketId),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useTasksDashboard() {
  return useQuery<{
    projectTaskCount: number;
    engineerTicketCount: number;
    siteVisitCount: number;
    siteInspectionCount: number;
  }, Error>({
    queryKey: ['tasksDashboard'],
    queryFn: async () => {
      const [projectTasksRes, engineerTicketsRes, siteVisitsRes, siteInspectionsRes] = await Promise.all([
        tasksApi.getProjectTasks({ page: 1, pageSize: 1 }),
        tasksApi.getEngineerTickets({ page: 1, pageSize: 1 }),
        tasksApi.getSiteVisits({ page: 1, pageSize: 1 }),
        tasksApi.getSiteInspections({ page: 1, pageSize: 1 }),
      ]);
      return {
        projectTaskCount: projectTasksRes.count,
        engineerTicketCount: engineerTicketsRes.count,
        siteVisitCount: siteVisitsRes.count,
        siteInspectionCount: siteInspectionsRes.count,
      };
    },
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useStands(options: { page?: number; pageSize?: number; search?: string; status?: string; ordering?: string } = {}) {
  const { page = 1, pageSize = 20, search, status, ordering } = options;
  return useQuery<tasksApi.PagedResponse<tasksApi.Stand>, Error, tasksApi.PagedResponse<tasksApi.Stand>>({
    queryKey: ['stands', page, pageSize, search, status, ordering],
    queryFn: () => tasksApi.getStands({ page, pageSize, search, status, ordering }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useStandStages(options: { page?: number; pageSize?: number; search?: string } = {}) {
  const { page = 1, pageSize = 20, search } = options;
  return useQuery<tasksApi.PagedResponse<tasksApi.StandStage>, Error, tasksApi.PagedResponse<tasksApi.StandStage>>({
    queryKey: ['standStages', page, pageSize, search],
    queryFn: () => tasksApi.getStandStages({ page, pageSize, search }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useStand(id?: string) {
  return useQuery<tasksApi.Stand, Error, tasksApi.Stand>({
    queryKey: ['stand', id],
    queryFn: async () => {
      if (!id) throw new Error('Stand ID is required');
      return tasksApi.getStand(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useCreateStand() {
  const queryClient = useQueryClient();
  return useMutation<tasksApi.Stand, Error, tasksApi.StandCreatePayload>({
    mutationFn: tasksApi.createStand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stands'] });
    },
  });
}

export function useUpdateStand() {
  const queryClient = useQueryClient();
  return useMutation<tasksApi.Stand, Error, { id: string; payload: tasksApi.StandUpdatePayload }>({
    mutationFn: ({ id, payload }) => tasksApi.updateStand(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stands'] });
      queryClient.invalidateQueries({ queryKey: ['stand', variables.id] });
    },
  });
}

export function useDeleteStand() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, { previousData: unknown }>({
    mutationFn: tasksApi.deleteStand,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['stands'], exact: false });
      const previousData = queryClient.getQueriesData({ queryKey: ['stands'], exact: false });
      queryClient.setQueriesData({ queryKey: ['stands'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) return oldData;
        const filteredResults = oldData.results.filter((item: tasksApi.Stand) => item.id !== id);
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - 1) : filteredResults.length;
        return { ...oldData, count, results: filteredResults };
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
          // ignore
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['stands'] });
    },
  });
}

export function useStandStageTransitions(options: {
  page?: number;
  pageSize?: number;
  search?: string;
  fromStage?: string;
  toStage?: string;
  requiresApproval?: boolean;
  isActive?: boolean;
  ordering?: string;
} = {}) {
  const { page = 1, pageSize = 20, search, fromStage, toStage, requiresApproval, isActive, ordering } = options;
  return useQuery<tasksApi.PagedResponse<tasksApi.StandStageTransition>, Error, tasksApi.PagedResponse<tasksApi.StandStageTransition>>({
    queryKey: ['standStageTransitions', page, pageSize, search, fromStage, toStage, requiresApproval, isActive, ordering],
    queryFn: () => tasksApi.getStandStageTransitions({ page, pageSize, search, fromStage, toStage, requiresApproval, isActive, ordering }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useCreateStandStage() {
  const queryClient = useQueryClient();
  return useMutation<tasksApi.StandStage, Error, tasksApi.StandStageCreatePayload>({
    mutationFn: tasksApi.createStandStage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standStages'] });
    },
  });
}

export function useUpdateStandStage() {
  const queryClient = useQueryClient();
  return useMutation<tasksApi.StandStage, Error, { id: string; payload: tasksApi.StandStageUpdatePayload }>({
    mutationFn: ({ id, payload }) => tasksApi.updateStandStage(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standStages'] });
    },
  });
}

export function useDeleteStandStage() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, { previousData: unknown }>({
    mutationFn: tasksApi.deleteStandStage,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['standStages'], exact: false });
      const previousData = queryClient.getQueriesData({ queryKey: ['standStages'], exact: false });
      queryClient.setQueriesData({ queryKey: ['standStages'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) return oldData;
        const filteredResults = oldData.results.filter((item: tasksApi.StandStage) => item.id !== id);
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - 1) : filteredResults.length;
        return { ...oldData, count, results: filteredResults };
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
          // ignore
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['standStages'] });
    },
  });
}

export function useCreateStandStageTransition() {
  const queryClient = useQueryClient();
  return useMutation<tasksApi.StandStageTransition, Error, tasksApi.StandStageTransitionCreatePayload>({
    mutationFn: tasksApi.createStandStageTransition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standStageTransitions'] });
    },
  });
}

export function useUpdateStandStageTransition() {
  const queryClient = useQueryClient();
  return useMutation<tasksApi.StandStageTransition, Error, { id: string; payload: tasksApi.StandStageTransitionUpdatePayload }>({
    mutationFn: ({ id, payload }) => tasksApi.updateStandStageTransition(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standStageTransitions'] });
    },
  });
}

export function useDeleteStandStageTransition() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string, { previousData: unknown }>({
    mutationFn: tasksApi.deleteStandStageTransition,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['standStageTransitions'], exact: false });
      const previousData = queryClient.getQueriesData({ queryKey: ['standStageTransitions'], exact: false });
      queryClient.setQueriesData({ queryKey: ['standStageTransitions'], exact: false }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.results)) return oldData;
        const filteredResults = oldData.results.filter((item: tasksApi.StandStageTransition) => item.id !== id);
        const count = typeof oldData.count === 'number' ? Math.max(0, oldData.count - 1) : filteredResults.length;
        return { ...oldData, count, results: filteredResults };
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
          // ignore
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['standStageTransitions'] });
    },
  });
}

export function useStageHistories(standId?: string) {
  return useQuery<tasksApi.PagedResponse<tasksApi.StageHistory>, Error, tasksApi.PagedResponse<tasksApi.StageHistory>>({
    queryKey: ['stageHistories', standId],
    queryFn: async () => {
      if (!standId) throw new Error('Stand ID is required');
      return tasksApi.getStageHistories({ page: 1, pageSize: 20, stand: standId });
    },
    enabled: Boolean(standId),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useCreateStageHistory() {
  const queryClient = useQueryClient();
  return useMutation<tasksApi.StageHistory, Error, tasksApi.StageHistoryCreatePayload>({
    mutationFn: tasksApi.createStageHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stageHistories'] });
      queryClient.invalidateQueries({ queryKey: ['stands'] });
    },
  });
}
