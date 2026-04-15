import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, IconButton,
  MenuItem, Select, FormControl, InputLabel, Divider,
  Chip, Alert, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { getAllUsers, assignBillToUser } from '../services/api';

interface BillUser {
  userId: number;
  username: string;
  amount: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddBillDialog: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [monthYear, setMonthYear] = useState(() => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  });

  const [billUsers, setBillUsers] = useState<BillUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); 
    return date.toISOString().split('T')[0];
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      getAllUsers().then(setUsers).catch(() => {});
      setTitle('');
      setBillUsers([]);
      setSelectedUserId('');
      setSelectedAmount('');
      const date = new Date();
      date.setDate(date.getDate() + 7);
      setDueDate(date.toISOString().split('T')[0]);
      setError('');
    }
  }, [open]);

  const availableUsers = users.filter(u => !billUsers.find(b => b.userId === u.id));

  const handleAddUser = () => {
    if (!selectedUserId || !selectedAmount || isNaN(Number(selectedAmount)) || Number(selectedAmount) <= 0) return;
    const u = users.find(u => u.id === selectedUserId);
    if (!u) return;
    setBillUsers(prev => [...prev, { userId: u.id, username: u.username, amount: selectedAmount }]);
    setSelectedUserId('');
    setSelectedAmount('');
  };

  const handleRemoveUser = (userId: number) => {
    setBillUsers(prev => prev.filter(b => b.userId !== userId));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Bill title is required.'); return; }
    if (!monthYear.match(/^\d{2}-\d{4}$/)) { setError('Month must be in MM-YYYY format.'); return; }
    if (billUsers.length === 0) { setError('Add at least one user to this bill.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await Promise.all(
        billUsers.map(b =>
          assignBillToUser({
            userId: b.userId,
            title: title.trim(),
            amount: Number(b.amount),
            monthYear,
            dueDate,
          })
        )
      );
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create bill. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = billUsers.reduce((sum, b) => sum + Number(b.amount), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>Add New Bill</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <TextField
            label="Bill Title"
            fullWidth
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Netflix, Internet, Electricity"
          />
          <TextField
            label="Month (MM-YYYY)"
            fullWidth
            value={monthYear}
            onChange={e => setMonthYear(e.target.value)}
            placeholder="04-2026"
          />
          <TextField
            label="Due Date"
            type="date"
            fullWidth
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            helperText="When payment is due"
          />

          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} color="text.secondary">
            ASSIGN TO USERS
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Select User</InputLabel>
              <Select
                value={selectedUserId}
                label="Select User"
                onChange={e => setSelectedUserId(e.target.value as number)}
              >
                {availableUsers.map(u => (
                  <MenuItem key={u.id} value={u.id}>{u.username}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Amount (฿)"
              type="number"
              value={selectedAmount}
              onChange={e => setSelectedAmount(e.target.value)}
              sx={{ width: 130 }}
            />
            <Button
              variant="contained"
              onClick={handleAddUser}
              disabled={!selectedUserId || !selectedAmount}
              sx={{ height: 56, borderRadius: 2, minWidth: 48, px: 2 }}
            >
              <AddIcon />
            </Button>
          </Box>

          {billUsers.length > 0 && (
            <Box>
              {billUsers.map(b => (
                <Box
                  key={b.userId}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1.5,
                    mb: 1,
                    bgcolor: '#f8f9fa',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={b.username} size="small" color="primary" variant="outlined" />
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>฿{Number(b.amount).toFixed(2)}</Typography>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => handleRemoveUser(b.userId)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Total: <span style={{ fontWeight: 'bold' }}>฿{totalAmount.toFixed(2)}</span> across {billUsers.length} user{billUsers.length > 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ borderRadius: 8 }} disabled={submitting}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !title || billUsers.length === 0}
          sx={{ borderRadius: 8, px: 3 }}
        >
          {submitting ? <CircularProgress size={20} /> : `Create Bill (${billUsers.length} user${billUsers.length !== 1 ? 's' : ''})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBillDialog;
