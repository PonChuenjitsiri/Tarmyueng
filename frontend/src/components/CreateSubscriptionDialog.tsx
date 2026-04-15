import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, IconButton, Typography, Box, MenuItem, Select,
  InputLabel, FormControl, Alert, Divider, Avatar, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { createSubscription, getAllUsers, getCurrentUser } from '../services/api';

interface ParticipantForm { userId: string; defaultAmountOwed: string; }

interface Props { open: boolean; onClose: () => void; onSuccess: () => void; }

const avatarColor = (name: string) => {
  const p = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'];
  return p[name.charCodeAt(0) % p.length];
};

const CreateSubscriptionDialog: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const [title, setTitle]                   = useState('');
  const [totalAmount, setTotalAmount]       = useState('');
  const [billingDay, setBillingDay]         = useState('1');
  const [participants, setParticipants]     = useState<ParticipantForm[]>([{ userId: '', defaultAmountOwed: '' }]);
  const [allUsers, setAllUsers]             = useState<any[]>([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

  const currentUser = getCurrentUser();

  useEffect(() => {
    if (open) {
      setTitle(''); setTotalAmount(''); setBillingDay('1');
      setParticipants([{ userId: '', defaultAmountOwed: '' }]);
      setError('');
      getAllUsers()
        .then(u => setAllUsers(u.filter((x: any) => x.id !== currentUser.id)))
        .catch(() => {});
    }
  }, [open]);

  const participantTotal = participants.reduce((s, p) => s + (parseFloat(p.defaultAmountOwed) || 0), 0);
  const totalNum         = parseFloat(totalAmount) || 0;
  const diff             = Math.abs(participantTotal - totalNum);
  const splitMismatch    = totalNum > 0 && diff > 0.01;

  const handleChange = (i: number, field: keyof ParticipantForm, value: string) => {
    const list = [...participants];
    list[i][field] = value;
    setParticipants(list);
  };

  const handleSubmit = async () => {
    if (!title.trim())         { setError('Bill title is required.'); return; }
    if (!totalAmount)          { setError('Total amount is required.'); return; }
    if (splitMismatch)         { setError(`Participant amounts (฿${participantTotal.toFixed(2)}) must equal the total (฿${totalNum.toFixed(2)}).`); return; }
    const filled = participants.filter(p => p.userId && p.defaultAmountOwed);
    if (filled.length === 0)   { setError('Add at least one participant.'); return; }

    setLoading(true); setError('');
    try {
      await createSubscription({
        adminId: currentUser.id,
        title: title.trim(),
        totalAmount: totalNum,
        billingDayOfMonth: parseInt(billingDay, 10),
        isActive: true,
        participants: filled.map(p => ({ userId: parseInt(p.userId, 10), defaultAmountOwed: parseFloat(p.defaultAmountOwed) })),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to create subscription.');
    } finally {
      setLoading(false);
    }
  };

  const usedIds = new Set(participants.map(p => p.userId).filter(Boolean));

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>New Subscription Group</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          {/* Basic info */}
          <TextField label="Bill title" fullWidth autoFocus value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} placeholder="e.g. Netflix, Spotify, Internet" />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Total cost (฿)" type="number" sx={{ flex: 1 }}
              value={totalAmount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTotalAmount(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
            />
            <TextField
              label="Billing day" type="number" sx={{ width: 130 }}
              value={billingDay} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBillingDay(e.target.value)}
              slotProps={{ htmlInput: { min: 1, max: 31 } }}
              helperText="Day of month"
            />
          </Box>

          <Divider />

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Participants</Typography>
              {totalNum > 0 && (
                <Chip
                  size="small"
                  label={splitMismatch ? `฿${participantTotal.toFixed(2)} / ฿${totalNum.toFixed(2)} — mismatch` : `฿${participantTotal.toFixed(2)} allocated`}
                  color={splitMismatch ? 'error' : 'success'}
                  variant="outlined"
                  sx={{ fontSize: '0.72rem' }}
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {participants.map((p, i) => {
                const selectedUser = allUsers.find(u => u.id.toString() === p.userId);
                return (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    {selectedUser && (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: avatarColor(selectedUser.username), fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                        {selectedUser.username[0].toUpperCase()}
                      </Avatar>
                    )}
                    <FormControl sx={{ flex: 1 }} size="small">
                      <InputLabel>Select user</InputLabel>
                      <Select value={p.userId} label="Select user" onChange={(e: { target: { value: string } }) => handleChange(i, 'userId', e.target.value)}>
                        {allUsers
                          .filter(u => !usedIds.has(u.id.toString()) || u.id.toString() === p.userId)
                          .map(u => (
                            <MenuItem key={u.id} value={u.id.toString()}>{u.username}</MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Amount (฿)" type="number" size="small" sx={{ width: 120 }}
                      value={p.defaultAmountOwed} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(i, 'defaultAmountOwed', e.target.value)}
                      slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
                    />
                    <IconButton
                      size="small" color="error"
                      onClick={() => setParticipants(prev => prev.filter((_, idx) => idx !== i))}
                      disabled={participants.length === 1}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>

            <Button
              startIcon={<AddIcon />} size="small"
              onClick={() => setParticipants(prev => [...prev, { userId: '', defaultAmountOwed: '' }])}
              disabled={participants.length >= allUsers.length}
              sx={{ mt: 1.5, borderRadius: 8 }}
            >
              Add participant
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 8 }}>Cancel</Button>
        <Button
          variant="contained" onClick={handleSubmit}
          disabled={loading || !title || !totalAmount}
          sx={{ borderRadius: 8, px: 3 }}
        >
          {loading ? 'Creating…' : 'Create subscription'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateSubscriptionDialog;
