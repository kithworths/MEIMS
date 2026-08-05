import api from './axios';

export interface Document {
  id: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown> | null;
  is_locked: boolean;
  is_active?: boolean;
  is_deleted?: boolean;
  locked_by?: string | null;
  locked_at?: string | null;
  current_version?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Document[];
}

export interface DocumentVersion {
  id: string;
  document: string;
  version_number: number;
  file: string;
  file_checksum: string;
  mime_type: string;
  size_bytes: number;
  metadata?: Record<string, unknown> | null;
  version_notes?: string;
  storage_backend?: string;
  created_at?: string;
}

export interface DocumentVersionListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DocumentVersion[];
}

export async function getDocuments(params: { page?: number; pageSize?: number; search?: string; ordering?: string } = {}) {
  const response = await api.get<DocumentListResponse>('documents/', { params });
  return response.data;
}

export async function getDocument(id: string) {
  const response = await api.get<Document>(`documents/${id}/`);
  return response.data;
}

export async function createDocument(payload: { title: string; description?: string; metadata?: Record<string, unknown> }) {
  const response = await api.post<Document>('documents/', payload);
  return response.data;
}

export async function updateDocument(id: string, payload: Partial<Document>) {
  const response = await api.patch<Document>(`documents/${id}/`, payload);
  return response.data;
}

export async function lockDocument(id: string) {
  const response = await api.post<{ data: Document }>(`documents/${id}/lock/`);
  return response.data.data ?? response.data;
}

export async function unlockDocument(id: string) {
  const response = await api.post<{ data: Document }>(`documents/${id}/unlock/`);
  return response.data.data ?? response.data;
}

export async function getDocumentVersions(params: { document?: string; page?: number; pageSize?: number } = {}) {
  const response = await api.get<DocumentVersionListResponse>('document-versions/', { params });
  return response.data;
}

export async function uploadDocumentVersion(
  documentId: string,
  file: File,
  options?: { version_notes?: string; metadata?: Record<string, unknown>; onUploadProgress?: (ev: any) => void },
) {
  const fd = new FormData();
  fd.append('document', documentId);
  fd.append('file', file);
  if (options?.version_notes) fd.append('version_notes', options.version_notes);
  if (options?.metadata) fd.append('metadata', JSON.stringify(options.metadata));

  const response = await api.post('document-versions/', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: options?.onUploadProgress,
  });

  return response.data;
}

export async function downloadFile(url: string, filename = 'file') {
  const response = await api.get(url, { responseType: 'blob' });
  const blob = response.data;
  const link = document.createElement('a');
  const objectUrl = window.URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}
