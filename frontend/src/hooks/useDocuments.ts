import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as docsApi from '../api/documents';

export function useDocuments(options: { page?: number; pageSize?: number; search?: string; ordering?: string } = {}) {
  const { page = 1, pageSize = 20, search, ordering } = options;
  return useQuery<docsApi.DocumentListResponse, Error>({
    queryKey: ['documents', page, pageSize, search, ordering],
    queryFn: () => docsApi.getDocuments({ page, pageSize, search, ordering }),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useDocument(id?: string) {
  return useQuery<docsApi.Document, Error>({
    queryKey: ['document', id],
    queryFn: async () => {
      if (!id) throw new Error('Document id is required');
      return docsApi.getDocument(id);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useDocumentVersions(documentId?: string, options: { page?: number; pageSize?: number } = {}) {
  const { page = 1, pageSize = 20 } = options;
  return useQuery<docsApi.DocumentVersionListResponse, Error>({
    queryKey: ['document-versions', documentId, page, pageSize],
    queryFn: () => docsApi.getDocumentVersions({ document: documentId, page, pageSize }),
    enabled: Boolean(documentId),
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; description?: string }) => docsApi.createDocument(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useUploadDocumentVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, file, onUploadProgress, version_notes }: any) =>
      docsApi.uploadDocumentVersion(documentId, file, { onUploadProgress, version_notes }),
    onSuccess: (_data, variables: any) => {
      qc.invalidateQueries({ queryKey: ['document-versions', variables.documentId] });
      qc.invalidateQueries({ queryKey: ['document', variables.documentId] });
    },
  });
}

export function useLockDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => docsApi.lockDocument(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }) });
}

export function useUnlockDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => docsApi.unlockDocument(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }) });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => docsApi.updateDocument(id, { is_deleted: true, is_active: false }), onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }) });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation<docsApi.Document, Error, { id: string; payload: Partial<docsApi.Document> }>(
    {
      mutationFn: ({ id, payload }) => docsApi.updateDocument(id, payload),
      onSuccess: (_data, variables) => {
        qc.invalidateQueries({ queryKey: ['documents'] });
        qc.invalidateQueries({ queryKey: ['document', variables.id] });
      },
    },
  );
}

export function useRestoreDocument() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => docsApi.updateDocument(id, { is_deleted: false, is_active: true }), onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }) });
}
