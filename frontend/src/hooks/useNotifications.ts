import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import * as notificationsApi from '../api/notifications';

export interface NotificationQueryOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  unread?: boolean;
  archived?: boolean;
  ordering?: string;
}

export function useNotifications(options: NotificationQueryOptions = {}): UseQueryResult<notificationsApi.NotificationListResponse, Error> {
  const { page = 1, pageSize = 20, search, unread, archived, ordering } = options;
  return useQuery<notificationsApi.NotificationListResponse, Error>({
    queryKey: ['notifications', page, pageSize, search, unread, archived, ordering],
    queryFn: () => notificationsApi.getNotifications({ page, pageSize, search, unread, archived, ordering }),
    staleTime: 1000 * 60,
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useNotification(id?: string): UseQueryResult<notificationsApi.Notification, Error> {
  return useQuery<notificationsApi.Notification, Error>({
    queryKey: ['notification', id],
    queryFn: async () => {
      if (!id) throw new Error('Notification ID is required');
      return notificationsApi.getNotification(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useMarkNotificationRead(): UseMutationResult<notificationsApi.Notification, Error, string, unknown> {
  const queryClient = useQueryClient();
  return useMutation<notificationsApi.Notification, Error, string, unknown>({
    mutationFn: (id) => notificationsApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useArchiveNotification(): UseMutationResult<notificationsApi.Notification, Error, string, unknown> {
  const queryClient = useQueryClient();
  return useMutation<notificationsApi.Notification, Error, string, unknown>({
    mutationFn: (id) => notificationsApi.archiveNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead(): UseMutationResult<{ updated: number }, Error, void, unknown> {
  const queryClient = useQueryClient();
  return useMutation<{ updated: number }, Error, void, unknown>({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useArchiveAllNotifications(): UseMutationResult<{ updated: number }, Error, void, unknown> {
  const queryClient = useQueryClient();
  return useMutation<{ updated: number }, Error, void, unknown>({
    mutationFn: () => notificationsApi.archiveAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUnreadNotificationCount(): UseQueryResult<number, Error> {
  return useQuery<number, Error>({
    queryKey: ['notifications', 'count', 'unread'],
    queryFn: async (): Promise<number> => {
      const response = await notificationsApi.getNotifications({ page: 1, pageSize: 1, unread: true, archived: false });
      return response.count;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useRecentNotifications(): UseQueryResult<notificationsApi.NotificationListResponse, Error> {
  return useQuery<notificationsApi.NotificationListResponse, Error>({
    queryKey: ['notifications', 'recent'],
    queryFn: async (): Promise<notificationsApi.NotificationListResponse> => {
      return notificationsApi.getNotifications({ page: 1, pageSize: 5, archived: false, ordering: '-created_at' });
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}
