import api from './axios';

export type NotificationCategory = 'Task' | 'Finance' | 'Approval' | 'System';
export type NotificationPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Notification {
  id: string;
  title: string;
  message?: string | null;
  category: NotificationCategory;
  priority: NotificationPriority;
  source_module?: string;
  source_action?: string;
  source_url?: string;
  is_read: boolean;
  is_archived: boolean;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

export async function getNotifications(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  unread?: boolean;
  archived?: boolean;
  ordering?: string;
} = {}) {
  const response = await api.get<NotificationListResponse>('notifications/', {
    params: {
      page: params.page,
      page_size: params.pageSize,
      search: params.search,
      unread: params.unread,
      archived: params.archived,
      ordering: params.ordering,
    },
  });
  return response.data;
}

export async function getNotification(id: string) {
  const response = await api.get<Notification>(`notifications/${id}/`);
  return response.data;
}

export async function markNotificationRead(id: string) {
  const response = await api.post<{ data: Notification }>(`notifications/${id}/mark_read/`);
  return response.data.data ?? response.data;
}

export async function archiveNotification(id: string) {
  const response = await api.post<{ data: Notification }>(`notifications/${id}/archive/`);
  return response.data.data ?? response.data;
}

export async function markAllRead() {
  const response = await api.post<{ data: { updated: number } }>('notifications/mark_all_read/');
  return response.data.data;
}

export async function archiveAllNotifications() {
  const response = await api.post<{ data: { updated: number } }>('notifications/archive_all/');
  return response.data.data;
}
