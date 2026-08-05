import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArchiveIcon from '@mui/icons-material/Archive';
import DoneIcon from '@mui/icons-material/Done';
import SearchIcon from '@mui/icons-material/Search';
import LabelIcon from '@mui/icons-material/Label';
import useAuth from '../auth/useAuth';
import { useNotifications, useMarkNotificationRead, useArchiveNotification, useMarkAllNotificationsRead, useArchiveAllNotifications } from '../hooks/useNotifications';
import type { Notification } from '../api/notifications';

const priorityColors: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  Low: 'default',
  Medium: 'success',
  High: 'warning',
  Critical: 'error',
};

const categoryLabels: Record<string, string> = {
  Task: 'Task',
  Finance: 'Finance',
  Approval: 'Approval',
  System: 'System',
};

function NotificationRow({ notification, onMarkRead, onArchive }: { notification: Notification; onMarkRead: (id: string) => void; onArchive: (id: string) => void }) {
  const createdAt = notification.created_at ? new Date(notification.created_at).toLocaleString() : '';

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: notification.is_read ? 'background.paper' : 'action.hover' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: notification.is_read ? 600 : 700 }}>
              {notification.title}
            </Typography>
            <Chip label={categoryLabels[notification.category] ?? notification.category} size="small" />
            <Chip label={notification.priority} color={priorityColors[notification.priority] || 'default'} size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
            {notification.message}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {createdAt}
          </Typography>
        </Box>
        <ListItemSecondaryAction sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0 }}>
          {!notification.is_read && (
            <IconButton size="small" aria-label="Mark read" onClick={() => onMarkRead(notification.id)}>
              <DoneIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" aria-label="Archive" onClick={() => onArchive(notification.id)}>
            <ArchiveIcon fontSize="small" />
          </IconButton>
        </ListItemSecondaryAction>
      </Box>
    </Paper>
  );
}

export default function NotificationsPage() {
  const auth = useAuth();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { data, isLoading, refetch } = useNotifications({
    page: 1,
    pageSize: 50,
    search,
    unread: showUnreadOnly ? true : undefined,
    archived: showArchived ? true : undefined,
    ordering: '-created_at',
  });

  const markReadMutation = useMarkNotificationRead();
  const archiveMutation = useArchiveNotification();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const archiveAllMutation = useArchiveAllNotifications();

  const notifications = data?.results ?? [];
  const unreadCount = notifications.filter((item: Notification) => !item.is_read).length;

  const handleMarkRead = async (id: string) => {
    await markReadMutation.mutateAsync(id);
  };

  const handleArchive = async (id: string) => {
    await archiveMutation.mutateAsync(id);
  };

  const handleMarkAllRead = async () => {
    await markAllReadMutation.mutateAsync();
  };

  const handleArchiveAll = async () => {
    await archiveAllMutation.mutateAsync();
  };

  const handleRefresh = async () => {
    await refetch();
  };

  if (!auth.hasPermission('notifications.Read')) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">You do not have permission to view notifications.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="overline" color="text.secondary" gutterBottom>
        Notifications
      </Typography>
      <Typography variant="h4" gutterBottom>
        Notification centre
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Track approval, task, and finance alerts in real time with unread counts, badges, and archive controls.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Filters
            </Typography>
            <TextField
              label="Search notifications"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              fullWidth
              margin="dense"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              <Button
                variant={showUnreadOnly ? 'contained' : 'outlined'}
                onClick={() => setShowUnreadOnly((prev) => !prev)}
                fullWidth
              >
                {showUnreadOnly ? 'Showing unread' : 'Show unread only'}
              </Button>
              <Button
                variant={showArchived ? 'contained' : 'outlined'}
                onClick={() => setShowArchived((prev) => !prev)}
                fullWidth
              >
                {showArchived ? 'Showing archived' : 'Show archived'}
              </Button>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Unread notifications: {unreadCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total notifications: {data?.count ?? 0}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              <Button onClick={handleMarkAllRead} disabled={markAllReadMutation.status === 'pending' || unreadCount === 0}>
                Mark all read
              </Button>
              <Button onClick={handleArchiveAll} disabled={archiveAllMutation.status === 'pending' || notifications.length === 0}>
                Archive all
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle1">Recent notifications</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                <Button size="small" onClick={handleRefresh} disabled={isLoading}>
                  Refresh
                </Button>
                <Chip icon={<LabelIcon />} label="Latest notifications" />
              </Box>
            </Box>
            {isLoading ? (
              <Typography>Loading notifications…</Typography>
            ) : notifications.length === 0 ? (
              <Typography>No notifications found.</Typography>
            ) : (
              <List>
                {notifications.map((notification: Notification) => (
                  <ListItem key={notification.id} disableGutters>
                    <NotificationRow notification={notification} onMarkRead={handleMarkRead} onArchive={handleArchive} />
                  </ListItem>
                ))}
              </List>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
