import { useMemo, useState, useRef } from 'react';
import useAuth from '../auth/useAuth';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from '@mui/material/Pagination';
import { useDocuments, useCreateDocument, useUploadDocumentVersion, useDeleteDocument } from '../hooks/useDocuments';
import type { Document, DocumentListResponse } from '../api/documents';

const PAGE_SIZE = 20;

export default function DocumentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [uploads, setUploads] = useState<
    { id: string; fileName: string; progress: number; status: 'uploading' | 'done' | 'error' }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const createDoc = useCreateDocument();
  const uploadMut = useUploadDocumentVersion();
  const deleteMut = useDeleteDocument();
  const auth = useAuth();

  const docsQuery = useDocuments({ page, pageSize: PAGE_SIZE, search });
  const docs = useMemo(() => (docsQuery.data as DocumentListResponse | undefined)?.results ?? [], [docsQuery.data]);
  const pageCount = Math.max(1, Math.ceil(((docsQuery.data as DocumentListResponse | undefined)?.count ?? 0) / PAGE_SIZE));

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Create a minimal document then upload version with progress tracking
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setUploads((s) => [...s, { id: uploadId, fileName: file.name, progress: 0, status: 'uploading' }]);
    createDoc.mutate({ title: file.name, description: 'Uploaded file' }, {
      onSuccess: (doc: Document) => {
        uploadMut.mutate({ documentId: doc.id, file, version_notes: 'Initial upload', onUploadProgress: (ev: any) => {
          const pct = ev?.loaded && ev?.total ? Math.round((ev.loaded / ev.total) * 100) : 0;
          setUploads((s) => s.map(u => u.id === uploadId ? { ...u, progress: pct } : u));
        } }, {
          onSuccess: () => {
            setUploads((s) => s.map(u => u.id === uploadId ? { ...u, progress: 100, status: 'done' } : u));
            docsQuery.refetch();
          },
          onError: () => setUploads((s) => s.map(u => u.id === uploadId ? { ...u, status: 'error' } : u)),
        });
      },
    });
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const items = e.dataTransfer.files;
    if (!items || items.length === 0) return;
    const file = items[0];
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setUploads((s) => [...s, { id: uploadId, fileName: file.name, progress: 0, status: 'uploading' }]);
    createDoc.mutate({ title: file.name, description: 'Uploaded via drag' }, {
      onSuccess: (doc: Document) => {
        uploadMut.mutate({ documentId: doc.id, file, version_notes: 'Drag upload', onUploadProgress: (ev: any) => {
          const pct = ev?.loaded && ev?.total ? Math.round((ev.loaded / ev.total) * 100) : 0;
          setUploads((s) => s.map(u => u.id === uploadId ? { ...u, progress: pct } : u));
        } }, {
          onSuccess: () => {
            setUploads((s) => s.map(u => u.id === uploadId ? { ...u, progress: 100, status: 'done' } : u));
            docsQuery.refetch();
          },
          onError: () => setUploads((s) => s.map(u => u.id === uploadId ? { ...u, status: 'error' } : u)),
        });
      },
    });
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="text.secondary" gutterBottom>
          Documents
        </Typography>
        <Typography variant="h4" component="h1" gutterBottom>
          Document library
        </Typography>
        <Typography color="text.secondary">Upload, preview and manage enterprise documents.</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            {auth.hasPermission('documents.Create') && (
              <>
                <Button variant="contained" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()}>
                  Upload document
                </Button>
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
                <Box
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  sx={{ mt: 2, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}
                >
                  <Typography>Or drag & drop files here to upload</Typography>
                </Box>
              </>
            )}
            {/* upload progress shown per-item via the mutation progress callback in future iterations */}
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Search documents"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />
              <Button variant="outlined" onClick={() => docsQuery.refetch()}>
                Refresh
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Locked</TableCell>
                    <TableCell>Current version</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {docsQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : docs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No documents found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    docs.map((doc: Document) => (
                      <TableRow key={doc.id} hover>
                        <TableCell>{doc.title}</TableCell>
                        <TableCell>{doc.description}</TableCell>
                        <TableCell>{doc.is_locked ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{doc.current_version ?? '—'}</TableCell>
                        <TableCell>
                          {auth.hasPermission('documents.Delete') && !doc.is_deleted && (
                            <Button size="small" color="error" onClick={() => {
                              if (!window.confirm('Delete this document?')) return;
                              deleteMut.mutate(doc.id);
                            }}>
                              Delete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {uploads.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">Uploads</Typography>
                {uploads.map((u) => (
                  <Box key={u.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Box sx={{ flex: 1 }}>{u.fileName}</Box>
                    <Box sx={{ width: 200 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Box sx={{ height: 8, bgcolor: 'divider', borderRadius: 1 }}>
                          <Box sx={{ width: `${u.progress}%`, height: 8, bgcolor: u.status === 'error' ? 'error.main' : 'primary.main', borderRadius: 1 }} />
                        </Box>
                        <Typography variant="caption" sx={{ position: 'absolute', right: 4, top: -18 }}>{u.progress}%</Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination page={page} count={pageCount} onChange={(_e, value) => setPage(value)} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
