import api from './axios';

export interface PagedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Stand {
  id: string;
  code: string;
  name: string;
}

export interface StandStage {
  id: string;
  code: string;
  name: string;
}

export interface ProjectTask {
  id: string;
  project: string;
  stand?: string | null;
  parent_task?: string | null;
  service_type?: string | null;
  assignee?: string | null;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Blocked' | 'Completed' | 'Cancelled';
  estimated_hours?: number | null;
  spent_hours?: number | null;
  planned_start_date?: string | null;
  planned_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  row_version: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectTaskCreatePayload {
  project: string;
  stand?: string | null;
  parent_task?: string | null;
  service_type?: string | null;
  assignee?: string | null;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  estimated_hours?: number | null;
  spent_hours?: number | null;
  planned_start_date?: string | null;
  planned_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  is_active?: boolean;
}

export interface ProjectTaskUpdatePayload {
  project?: string;
  stand?: string | null;
  parent_task?: string | null;
  service_type?: string | null;
  assignee?: string | null;
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  estimated_hours?: number | null;
  spent_hours?: number | null;
  planned_start_date?: string | null;
  planned_end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  row_version: number;
  is_active?: boolean;
}

export interface EngineerTicket {
  id: string;
  project: string;
  stand?: string | null;
  service_type?: string | null;
  reporter?: string | null;
  assignee?: string | null;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed' | 'Rejected';
  opened_at: string;
  resolved_at?: string | null;
  closed_at?: string | null;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface EngineerTicketCreatePayload {
  project: string;
  stand?: string | null;
  service_type?: string | null;
  reporter?: string | null;
  assignee?: string | null;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  is_active?: boolean;
}

export interface EngineerTicketUpdatePayload {
  project?: string;
  stand?: string | null;
  service_type?: string | null;
  reporter?: string | null;
  assignee?: string | null;
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  is_active?: boolean;
}

export interface SiteVisit {
  id: string;
  stand: string;
  engineer?: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
  reminder_minutes: number;
  reminder_sent: boolean;
  notes?: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteVisitCreatePayload {
  stand: string;
  engineer?: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status?: string;
  reminder_minutes?: number;
  reminder_sent?: boolean;
  notes?: string;
  is_active?: boolean;
}

export interface SiteVisitUpdatePayload {
  stand?: string;
  engineer?: string | null;
  scheduled_start?: string;
  scheduled_end?: string;
  status?: string;
  reminder_minutes?: number;
  reminder_sent?: boolean;
  notes?: string;
  is_active?: boolean;
}

export interface SiteInspection {
  id: string;
  stand: string;
  inspector?: string | null;
  inspection_date: string;
  checklist?: Record<string, any> | null;
  result: 'Pass' | 'Fail' | 'Conditional Pass';
  comments?: string;
  target_stage?: string | null;
  follow_up_ticket?: string | null;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteInspectionCreatePayload {
  stand: string;
  inspector?: string | null;
  inspection_date?: string;
  checklist?: Record<string, any> | null;
  result: string;
  comments?: string;
  target_stage?: string | null;
  is_active?: boolean;
}

export interface SiteInspectionUpdatePayload {
  stand?: string;
  inspector?: string | null;
  inspection_date?: string;
  checklist?: Record<string, any> | null;
  result?: string;
  comments?: string;
  target_stage?: string | null;
  is_active?: boolean;
}

export interface TaskHistory {
  id: string;
  task: string;
  changed_by?: string | null;
  changed_at: string;
  previous_status?: string;
  new_status?: string;
  previous_assignee?: string | null;
  new_assignee?: string | null;
  previous_priority?: string;
  new_priority?: string;
  previous_estimated_hours?: number | null;
  new_estimated_hours?: number | null;
  previous_spent_hours?: number | null;
  new_spent_hours?: number | null;
  notes?: string;
}

export interface EngineerTicketHistory {
  id: string;
  ticket: string;
  changed_by?: string | null;
  changed_at: string;
  previous_status?: string;
  new_status?: string;
  previous_assignee?: string | null;
  new_assignee?: string | null;
  previous_priority?: string;
  new_priority?: string;
  notes?: string;
}

export async function getProjectTasks(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  priority?: string;
  project?: string;
  assignee?: string;
  ordering?: string;
}) {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.pageSize) queryParams.page_size = params.pageSize;
  if (params.page && params.page > 1) queryParams.offset = (params.page - 1) * (params.pageSize ?? 20);
  if (params.search) queryParams.search = params.search;
  if (params.status) queryParams.status = params.status;
  if (params.priority) queryParams.priority = params.priority;
  if (params.project) queryParams.project = params.project;
  if (params.assignee) queryParams.assignee = params.assignee;
  if (params.ordering) queryParams.ordering = params.ordering;

  const response = await api.get<PagedResponse<ProjectTask>>('project-tasks/', { params: queryParams });
  return response.data;
}

export async function getProjectTask(id: string) {
  const response = await api.get<ProjectTask>(`project-tasks/${id}/`);
  return response.data;
}

export async function createProjectTask(payload: ProjectTaskCreatePayload) {
  const response = await api.post<ProjectTask>('project-tasks/', payload);
  return response.data;
}

export async function updateProjectTask(id: string, payload: ProjectTaskUpdatePayload) {
  const response = await api.patch<ProjectTask>(`project-tasks/${id}/`, payload);
  return response.data;
}

export async function deleteProjectTask(id: string) {
  await api.delete(`project-tasks/${id}/`);
}

export async function bulkDeleteProjectTasks(ids: string[]) {
  await Promise.all(ids.map((id) => api.delete(`project-tasks/${id}/`)));
}

export async function getEngineerTickets(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  priority?: string;
  project?: string;
  assignee?: string;
  ordering?: string;
}) {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.pageSize) queryParams.page_size = params.pageSize;
  if (params.page && params.page > 1) queryParams.offset = (params.page - 1) * (params.pageSize ?? 20);
  if (params.search) queryParams.search = params.search;
  if (params.status) queryParams.status = params.status;
  if (params.priority) queryParams.priority = params.priority;
  if (params.project) queryParams.project = params.project;
  if (params.assignee) queryParams.assignee = params.assignee;
  if (params.ordering) queryParams.ordering = params.ordering;

  const response = await api.get<PagedResponse<EngineerTicket>>('engineer-tickets/', { params: queryParams });
  return response.data;
}

export async function getEngineerTicket(id: string) {
  const response = await api.get<EngineerTicket>(`engineer-tickets/${id}/`);
  return response.data;
}

export async function createEngineerTicket(payload: EngineerTicketCreatePayload) {
  const response = await api.post<EngineerTicket>('engineer-tickets/', payload);
  return response.data;
}

export async function updateEngineerTicket(id: string, payload: EngineerTicketUpdatePayload) {
  const response = await api.patch<EngineerTicket>(`engineer-tickets/${id}/`, payload);
  return response.data;
}

export async function deleteEngineerTicket(id: string) {
  await api.delete(`engineer-tickets/${id}/`);
}

export async function bulkDeleteEngineerTickets(ids: string[]) {
  await Promise.all(ids.map((id) => api.delete(`engineer-tickets/${id}/`)));
}

export async function getSiteVisits(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  engineer?: string;
  stand?: string;
  ordering?: string;
}) {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.pageSize) queryParams.page_size = params.pageSize;
  if (params.page && params.page > 1) queryParams.offset = (params.page - 1) * (params.pageSize ?? 20);
  if (params.search) queryParams.search = params.search;
  if (params.status) queryParams.status = params.status;
  if (params.engineer) queryParams.engineer = params.engineer;
  if (params.stand) queryParams.stand = params.stand;
  if (params.ordering) queryParams.ordering = params.ordering;

  const response = await api.get<PagedResponse<SiteVisit>>('site-visits/', { params: queryParams });
  return response.data;
}

export async function getSiteVisit(id: string) {
  const response = await api.get<SiteVisit>(`site-visits/${id}/`);
  return response.data;
}

export async function createSiteVisit(payload: SiteVisitCreatePayload) {
  const response = await api.post<SiteVisit>('site-visits/', payload);
  return response.data;
}

export async function updateSiteVisit(id: string, payload: SiteVisitUpdatePayload) {
  const response = await api.patch<SiteVisit>(`site-visits/${id}/`, payload);
  return response.data;
}

export async function deleteSiteVisit(id: string) {
  await api.delete(`site-visits/${id}/`);
}

export async function bulkDeleteSiteVisits(ids: string[]) {
  await Promise.all(ids.map((id) => api.delete(`site-visits/${id}/`)));
}

export async function getSiteInspections(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  result?: string;
  inspector?: string;
  stand?: string;
  ordering?: string;
}) {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params.pageSize) queryParams.page_size = params.pageSize;
  if (params.page && params.page > 1) queryParams.offset = (params.page - 1) * (params.pageSize ?? 20);
  if (params.search) queryParams.search = params.search;
  if (params.result) queryParams.result = params.result;
  if (params.inspector) queryParams.inspector = params.inspector;
  if (params.stand) queryParams.stand = params.stand;
  if (params.ordering) queryParams.ordering = params.ordering;

  const response = await api.get<PagedResponse<SiteInspection>>('site-inspections/', { params: queryParams });
  return response.data;
}

export async function getSiteInspection(id: string) {
  const response = await api.get<SiteInspection>(`site-inspections/${id}/`);
  return response.data;
}

export async function createSiteInspection(payload: SiteInspectionCreatePayload) {
  const response = await api.post<SiteInspection>('site-inspections/', payload);
  return response.data;
}

export async function updateSiteInspection(id: string, payload: SiteInspectionUpdatePayload) {
  const response = await api.patch<SiteInspection>(`site-inspections/${id}/`, payload);
  return response.data;
}

export async function deleteSiteInspection(id: string) {
  await api.delete(`site-inspections/${id}/`);
}

export async function bulkDeleteSiteInspections(ids: string[]) {
  await Promise.all(ids.map((id) => api.delete(`site-inspections/${id}/`)));
}

export async function getTaskHistories(params: { page?: number; pageSize?: number; search?: string; task?: string; ordering?: string }) {
  const queryParams: Record<string, string | number | boolean> = {};
  if (params.pageSize) queryParams.page_size = params.pageSize;
  if (params.page && params.page > 1) queryParams.offset = (params.page - 1) * (params.pageSize ?? 20);
  if (params.search) queryParams.search = params.search;
  if (params.task) queryParams.task = params.task;
  if (params.ordering) queryParams.ordering = params.ordering;
  const response = await api.get<PagedResponse<TaskHistory>>('task-histories/', { params: queryParams });
  return response.data;
}

export async function getEngineerTicketHistories(params: { page?: number; pageSize?: number; search?: string; ticket?: string; ordering?: string }) {
  const queryParams: Record<string, string | number | boolean> = {};
  if (params.pageSize) queryParams.page_size = params.pageSize;
  if (params.page && params.page > 1) queryParams.offset = (params.page - 1) * (params.pageSize ?? 20);
  if (params.search) queryParams.search = params.search;
  if (params.ticket) queryParams.ticket = params.ticket;
  if (params.ordering) queryParams.ordering = params.ordering;
  const response = await api.get<PagedResponse<EngineerTicketHistory>>('engineer-ticket-histories/', { params: queryParams });
  return response.data;
}

export async function getStands(params: { page?: number; pageSize?: number; search?: string } = {}) {
  const queryParams: Record<string, string | number | boolean> = {};
  if (params.pageSize) queryParams.page_size = params.pageSize;
  if (params.page && params.page > 1) queryParams.offset = (params.page - 1) * (params.pageSize ?? 20);
  if (params.search) queryParams.search = params.search;
  const response = await api.get<PagedResponse<Stand>>('stands/', { params: queryParams });
  return response.data;
}

export async function getStandStages(params: { page?: number; pageSize?: number; search?: string } = {}) {
  const queryParams: Record<string, string | number | boolean> = {};
  if (params.pageSize) queryParams.page_size = params.pageSize;
  if (params.page && params.page > 1) queryParams.offset = (params.page - 1) * (params.pageSize ?? 20);
  if (params.search) queryParams.search = params.search;
  const response = await api.get<PagedResponse<StandStage>>('stand-stages/', { params: queryParams });
  return response.data;
}
