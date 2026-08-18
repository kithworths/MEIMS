import { render, screen, fireEvent } from '@testing-library/react';
import DocumentsPage from '../pages/DocumentsPage';
import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('../auth/useAuth', () => ({
  __esModule: true,
  default: vi.fn<unknown[], unknown>(),
}));

vi.mock('../hooks/useDocuments', () => ({
  __esModule: true,
  useDocuments: vi.fn<unknown[], unknown>(),
  useCreateDocument: vi.fn<unknown[], unknown>(),
  useUploadDocumentVersion: vi.fn<unknown[], unknown>(),
  useDeleteDocument: vi.fn<unknown[], unknown>(),
}));

import useAuth from '../auth/useAuth';
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments';

const mockUseAuth = useAuth as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseDocuments = useDocuments as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseDeleteDocument = useDeleteDocument as unknown as { mockReturnValue: (value: unknown) => void };

describe('DocumentsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.confirm = vi.fn<[string?], boolean>(() => true);
  });

  it('renders documents and deletes a document when confirmed', () => {
    mockUseAuth.mockReturnValue({ hasPermission: (_p: string) => true });
    mockUseDocuments.mockReturnValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 'doc-1',
            title: 'Invoice.pdf',
            description: 'Monthly invoice',
            is_locked: false,
            current_version: 'v1',
            is_deleted: false,
          },
        ],
      },
      isLoading: false,
      refetch: vi.fn<unknown[], unknown>(),
    });

    const deleteMutate = vi.fn<unknown[], unknown>();
    mockUseDeleteDocument.mockReturnValue({ mutate: deleteMutate, isLoading: false });

    render(<DocumentsPage />);

    expect(screen.getByText('Document library')).toBeDefined();
    expect(screen.getByText('Invoice.pdf')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(global.confirm).toHaveBeenCalledWith('Delete this document?');
    expect(deleteMutate).toHaveBeenCalledWith('doc-1');
  });
});



