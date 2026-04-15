import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Grid, CircularProgress, Alert, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, MenuItem, Select, FormControl, InputLabel,
  IconButton, Avatar, Tabs, Tab, InputAdornment,
  Snackbar, Divider, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import EmailIcon from '@mui/icons-material/Email';
import CloseIcon from '@mui/icons-material/Close';
import { getAllUsers, createUser, updateUser, deleteUser, getCurrentUser } from '../services/api';

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Admin: { bg: '#f3e8ff', text: '#7c3aed', border: '#c4b5fd' },
  User:  { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
};

const avatarColor = (name: string) => {
  const palette = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'];
  return palette[name.charCodeAt(0) % palette.length];
};

// ── User Card ────────────────────────────────────────────────────────────────
interface UserCardProps {
  user: any;
  currentUserId: number;
  onEdit: (u: any) => void;
  onDelete: (u: any) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, currentUserId, onEdit, onDelete }) => {
  const roleStyle = ROLE_COLORS[user.role] ?? ROLE_COLORS.User;
  const isSelf = user.id === currentUserId;

  return (
    <Box sx={{
      borderRadius: 3, border: '1px solid #e5e7eb', bgcolor: 'white',
      p: 3, display: 'flex', flexDirection: 'column', gap: 2,
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
    }}>
      {/* Top row: avatar + name + role chip */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: avatarColor(user.username), width: 48, height: 48, fontSize: '1.2rem', fontWeight: 'bold' }}>
          {user.username[0].toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>
              {user.username}
            </Typography>
            {isSelf && (
              <Chip label="You" size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }} />
            )}
          </Box>
          <Chip
            size="small"
            icon={user.role === 'Admin' ? <AdminPanelSettingsIcon sx={{ fontSize: '0.85rem !important' }} /> : <PersonIcon sx={{ fontSize: '0.85rem !important' }} />}
            label={user.role}
            sx={{ mt: 0.5, height: 22, fontSize: '0.72rem', fontWeight: 600,
              bgcolor: roleStyle.bg, color: roleStyle.text, border: `1px solid ${roleStyle.border}` }}
          />
        </Box>
        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
          <Tooltip title="Edit user">
            <IconButton size="small" onClick={() => onEdit(user)} sx={{ color: '#6b7280', '&:hover': { bgcolor: '#f3f4f6', color: '#111827' } }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isSelf ? "You can't delete yourself" : "Delete user"}>
            <span>
              <IconButton size="small" disabled={isSelf} onClick={() => onDelete(user)}
                sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' }, '&.Mui-disabled': { color: '#d1d5db' } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Divider />

      {/* Info rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon sx={{ fontSize: '0.9rem', color: '#9ca3af' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneAndroidIcon sx={{ fontSize: '0.9rem', color: '#9ca3af' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
            {user.promptPayId
              ? <><strong style={{ color: '#111827' }}>PromptPay:</strong> {user.promptPayId}</>
              : <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>No PromptPay set</span>}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
const UsersAdmin: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [search, setSearch] = useState('');
  const [roleTab, setRoleTab] = useState(0); // 0=All, 1=Admin, 2=User

  // Form dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'User', promptPayId: '' });
  const [formError, setFormError] = useState('');

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({ open: false, msg: '', severity: 'success' });

  const currentUser = getCurrentUser();

  useEffect(() => {
    if (currentUser?.role === 'Admin') fetchUsers();
    else { setLoading(false); setPageError('Access denied.'); }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try { setUsers(await getAllUsers()); }
    catch { setPageError('Failed to load users.'); }
    finally { setLoading(false); }
  };

  const toast = (msg: string, severity: 'success' | 'error' = 'success') =>
    setSnack({ open: true, msg, severity });

  // ── Filtering ──────────────────────────────────────────────────────────────
  const roleFilter = ['All', 'Admin', 'User'][roleTab];
  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  // ── Dialog helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setFormData({ username: '', email: '', password: '', role: 'User', promptPayId: '' });
    setFormError('');
    setDialogOpen(true);
  };

  const openEdit = (u: any) => {
    setIsEditing(true);
    setEditingUserId(u.id);
    setFormData({ username: u.username, email: u.email, password: '', role: u.role, promptPayId: u.promptPayId ?? '' });
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.username.trim()) { setFormError('Username is required.'); return; }
    if (!formData.email.trim()) { setFormError('Email is required.'); return; }
    if (!isEditing && !formData.password) { setFormError('Password is required.'); return; }

    setSaving(true);
    setFormError('');
    try {
      if (isEditing && editingUserId) {
        await updateUser(editingUserId, formData);
        toast('User updated successfully.');
      } else {
        await createUser(formData);
        toast('User created successfully.');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      toast(`${deleteTarget.username} has been deleted.`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: any) {
      toast(err.response?.data?.message ?? 'Failed to delete user.', 'error');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (pageError) return <Alert severity="error">{pageError}</Alert>;

  const adminCount = users.filter(u => u.role === 'Admin').length;
  const userCount  = users.filter(u => u.role === 'User').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Manage Users</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong style={{ color: '#111827' }}>{users.length}</strong> total
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong style={{ color: '#7c3aed' }}>{adminCount}</strong> admins
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong style={{ color: '#2563eb' }}>{userCount}</strong> users
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 8, px: 3 }}>
          Add User
        </Button>
      </Box>

      {/* Search + Role filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9ca3af', fontSize: '1.1rem' }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}><CloseIcon sx={{ fontSize: '0.9rem' }} /></IconButton>
                </InputAdornment>
              ) : null,
            }
          }}
        />
        <Tabs value={roleTab} onChange={(_, v) => setRoleTab(v)} sx={{ minHeight: 36,
          '& .MuiTab-root': { minHeight: 36, py: 0, px: 2, fontSize: '0.82rem' } }}>
          <Tab label={`All (${users.length})`} />
          <Tab label={`Admins (${adminCount})`} />
          <Tab label={`Users (${userCount})`} />
        </Tabs>
      </Box>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <PersonIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
          <Typography variant="body1">
            {search ? `No users match "${search}"` : 'No users found.'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(u => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={u.id}>
              <UserCard user={u} currentUserId={currentUser.id} onEdit={openEdit} onDelete={setDeleteTarget} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          {isEditing ? 'Edit Account' : 'Create New Account'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Username" fullWidth autoFocus
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
            />
            <TextField
              label="Email Address" type="email" fullWidth
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label={isEditing ? 'New Password (leave blank to keep)' : 'Password'}
              type="password" fullWidth
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
            <TextField
              label="PromptPay ID (optional)" fullWidth
              value={formData.promptPayId}
              onChange={e => setFormData({ ...formData, promptPayId: e.target.value })}
              placeholder="e.g. 0812345678"
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={formData.role} label="Role" onChange={e => setFormData({ ...formData, role: e.target.value })}>
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
            {formError && <Alert severity="error" sx={{ borderRadius: 2 }}>{formError}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={{ borderRadius: 8 }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleSave} disabled={saving} sx={{ borderRadius: 8, px: 3 }}
          >
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Delete User?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You are about to permanently delete{' '}
            <strong style={{ color: '#111827' }}>{deleteTarget?.username}</strong>
            {' '}({deleteTarget?.email}). This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ borderRadius: 8 }}>Cancel</Button>
          <Button
            variant="contained" color="error" onClick={handleDeleteConfirm}
            disabled={deleting} sx={{ borderRadius: 8, px: 3 }}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          sx={{ borderRadius: 2, minWidth: 280 }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersAdmin;
