import { useEffect, useMemo, useState } from 'react';
import useAuth from '../auth/useAuth';
import { useParams } from 'react-router-dom';
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
import CircularProgress from '@mui/material/CircularProgress';
import { useDocument, useDocumentVersions, useLockDocument, useUnlockDocument, useUpdateDocument } from '../hooks/useDocuments';
import { useDeleteDocument, useRestoreDocument } from '../hooks/useDocuments';
import type { DocumentVersion, Document as DocumentType, DocumentVersionListResponse } from '../api/documents';

export default function DocumentDetailsPage() {
  const { id } = useParams();
  const docQuery = useDocument(id);
  const versionsQuery = useDocumentVersions(id);
  const lockMut = useLockDocument();
  const unlockMut = useUnlockDocument();
  const updateMut = useUpdateDocument();
  const auth = useAuth();
  const deleteMut = useDeleteDocument();
  const restoreMut = useRestoreDocument();
  const [preview, setPreview] = useState<{ url: string; kind: 'pdf' | 'image' | 'other' } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [metadataJson, setMetadataJson] = useState('');
  const [category, setCategory] = useState('');

  const versions = useMemo(() => (versionsQuery.data as DocumentVersionListResponse | undefined)?.results ?? [], [versionsQuery.data]);

  const doc = docQuery.data as DocumentType | undefined;

  useEffect(() => {
    if (!doc) return;
    setTitle(doc.title ?? '');
    setDescription(doc.description ?? '');
    setCategory(String(doc.metadata?.category ?? ''));
    const metadataCopy = { ...(doc.metadata ?? {}) };
    delete metadataCopy.category;
    setMetadataJson(JSON.stringify(metadataCopy, null, 2));
  }, [doc]);

  if (!id) return null;

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Document details</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            {docQuery.isLoading ? (
              <CircularProgress />
            ) : (
              <>
                <TextField
                  label="Title"
                  value={title}
                  fullWidth
                  margin="dense"
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!auth.hasPermission('documents.Update')}
                />
                <TextField
                  label="Description"
                  value={description}
                  fullWidth
                  margin="dense"
                  multiline
                  minRows={3}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!auth.hasPermission('documents.Update')}
                />
                <TextField
                  label="Category"
                  value={category}
                  fullWidth
                  margin="dense"
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={!auth.hasPermission('documents.Update')}
                />
                <TextField
                  label="Metadata JSON"
                  value={metadataJson}
                  fullWidth
                  margin="dense"
                  multiline
                  minRows={6}
                  onChange={(e) => setMetadataJson(e.target.value)}
                  disabled={!auth.hasPermission('documents.Update')}
                />
                <Button
                  sx={{ mt: 1 }}
                  variant="contained"
                  disabled={!auth.hasPermission('documents.Update') || (updateMut as any).isLoading}
                  onClick={() => {
                    if (!id) return;
                    let parsedMetadata: Record<string, unknown> = {};
                    try {
                      parsedMetadata = JSON.parse(metadataJson);
                    } catch {
                      window.alert('Metadata JSON is invalid.');
                      return;
                    }
                    if (category.trim()) {
                      parsedMetadata.category = category.trim();
                    }
                    updateMut.mutate({ id: id as string, payload: { title, description, metadata: parsedMetadata } });
                  }}
                >
                  Save changes
                </Button>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  {auth.hasPermission('documents.Update') && (
                    (docQuery.data as DocumentType | undefined)?.is_locked ? (
                      <Button variant="outlined" onClick={() => unlockMut.mutate(id as any)}>
                        Unlock
                      </Button>
                    ) : (
                      <Button variant="contained" onClick={() => lockMut.mutate(id as any)}>
                        Lock
                      </Button>
                    )
                  )}
                  {auth.hasPermission('documents.Delete') && !(docQuery.data as DocumentType | undefined)?.is_deleted && (
                    <Button variant="outlined" color="error" onClick={() => {
                      if (!window.confirm('Delete this document?')) return;
                      deleteMut.mutate(id as any, { onSuccess: () => docQuery.refetch() });
                    }}>
                      Delete
                    </Button>
                  )}
                  {auth.hasPermission('documents.Delete') && (docQuery.data as DocumentType | undefined)?.is_deleted && (
                    <Button variant="contained" onClick={() => {
                      if (!window.confirm('Restore this document?')) return;
                      restoreMut.mutate(id as any, { onSuccess: () => docQuery.refetch() });
                    }}>
                      Restore
                    </Button>
                  )}
                </Box>
              </>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Version history
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Version</TableCell>
                    <TableCell>File</TableCell>
                    <TableCell>Uploaded</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {versionsQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : versions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No versions.
                      </TableCell>
                    </TableRow>
                  ) : (
                    versions.map((v: DocumentVersion) => (
                      <TableRow key={v.id} hover>
                        <TableCell>{v.version_number}</TableCell>
                            <TableCell>
                              <a
                                href={v.file}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => {
                                  // show inline preview for common file types
                                  try {
                                    e.preventDefault();
                                    const url = v.file;
                                    const lower = url.toLowerCase();
                                    if (lower.endsWith('.pdf')) setPreview({ url, kind: 'pdf' });
                                    else if (lower.match(/\.(png|jpe?g|gif|bmp|webp)$/)) setPreview({ url, kind: 'image' });
                                    else setPreview({ url, kind: 'other' });
                                  } catch {
                                    // fallback to opening in new tab
                                  }
                                }}
                              >
                                Open
                              </a>
                            </TableCell>
                        <TableCell>{v.created_at}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {preview && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2">Preview</Typography>
                  <Button size="small" onClick={() => setPreview(null)}>
                    Close
                  </Button>
                </Box>
                <Box sx={{ mt: 1 }}>
                  {preview.kind === 'pdf' ? (
                    <iframe src={preview.url} title="pdf-preview" width="100%" height={600} />
                  ) : preview.kind === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview.url} alt="preview" style={{ maxWidth: '100%', maxHeight: 600 }} />
                  ) : (
                    <Box>
                      <a href={preview.url} target="_blank" rel="noreferrer">
                        Open file in new tab
                      </a>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
