import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../auth/useAuth', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('../hooks/useDocuments', () => ({
  __esModule: true,
  useDocument: vi.fn(),
  useDocumentVersions: vi.fn(),
  useLockDocument: vi.fn(),
  useUnlockDocument: vi.fn(),
  useUpdateDocument: vi.fn(),
  useDeleteDocument: vi.fn(),
  useRestoreDocument: vi.fn(),
}));

import useAuth from '../auth/useAuth';
import { useDocument, useDocumentVersions, useUpdateDocument, useDeleteDocument, useRestoreDocument } from '../hooks/useDocuments';
import DocumentDetailsPage from '../pages/DocumentDetailsPage';

const mockUseAuth = useAuth as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseDocument = useDocument as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseDocumentVersions = useDocumentVersions as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseUpdateDocument = useUpdateDocument as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseDeleteDocument = useDeleteDocument as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseRestoreDocument = useRestoreDocument as unknown as { mockReturnValue: (value: unknown) => void };

describe('DocumentDetailsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.confirm = vi.fn(() => true);
  });

  it('renders document details and allows restore when deleted', () => {
    mockUseAuth.mockReturnValue({ hasPermission: (_p: string) => true });
    mockUseDocument.mockReturnValue({
      data: {
        id: 'doc-1',
        title: 'Invoice.pdf',
        description: 'Monthly invoice',
        metadata: { category: 'Finance' },
        is_locked: false,
        is_deleted: true,
      },
      isLoading: false,
      refetch: vi.fn(),
    });
    mockUseDocumentVersions.mockReturnValue({ data: { results: [] }, isLoading: false });
    mockUseUpdateDocument.mockReturnValue({ mutate: vi.fn(), isLoading: false });
    mockUseDeleteDocument.mockReturnValue({ mutate: vi.fn(), isLoading: false });
    const restoreMutate = vi.fn();
    mockUseRestoreDocument.mockReturnValue({ mutate: restoreMutate, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/documents/doc-1']}>
        <Routes>
          <Route path="/documents/:id" element={<DocumentDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Document details' })).toBeDefined();
    expect(screen.getByDisplayValue('Invoice.pdf')).toBeDefined();
    expect(screen.getByDisplayValue('Finance')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Restore' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));

    expect(global.confirm).toHaveBeenCalledWith('Restore this document?');
    expect(restoreMutate).toHaveBeenCalledWith('doc-1', { onSuccess: expect.any(Function) });
  });
});
