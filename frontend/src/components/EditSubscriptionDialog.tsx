import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Typography, Box, Divider, Chip, Alert, CircularProgress
} from '@mui/material';
import { updateSubscription } from '../services/api';

interface Props {
  open: boolean;
  subscription: any;
  onClose: () => void;
  onSuccess: () => void;
}

const EditSubscriptionDialog: React.FC<Props> = ({ open, subscription, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [billingDay, setBillingDay] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subscription) {
      setTitle(subscription.title || '');
      setTotalAmount(subscription.totalAmount?.toString() || '');
      setBillingDay(subscription.billingDayOfMonth?.toString() || '1');
      setIsActive(subscription.isActive !== false);
      setError('');
    }
  }, [subscription, open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      setError('Valid amount is required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateSubscription(subscription.id, {
        title: title.trim(),
        totalAmount: parseFloat(totalAmount),
        billingDayOfMonth: parseInt(billingDay, 10),
        isActive,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to update subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>Edit Subscription</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <TextField
            label="Title"
            fullWidth
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Netflix, Spotify, Internet"
            disabled={loading}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Total amount (฿)"
              type="number"
              sx={{ flex: 1 }}
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              disabled={loading}
            />
            <TextField
              label="Billing day"
              type="number"
              sx={{ width: 130 }}
              value={billingDay}
              onChange={(e) => setBillingDay(e.target.value)}
              slotProps={{ htmlInput: { min: 1, max: 31 } }}
              helperText="Day of month"
              disabled={loading}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2">Status:</Typography>
            <Chip
              label={isActive ? '✓ Active' : '✗ Inactive'}
              color={isActive ? 'success' : 'default'}
              onClick={() => setIsActive(!isActive)}
              sx={{ cursor: 'pointer' }}
              disabled={loading}
            />
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !title || !totalAmount}
        >
          {loading ? <CircularProgress size={20} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSubscriptionDialog;
