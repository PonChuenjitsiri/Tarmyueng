import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Grid, CircularProgress, Alert, Button, Chip,
  Divider, Snackbar, Avatar, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { getSubscriptions, getCurrentUser, assignBillToUser, getAllUsers } from '../services/api';
import CreateSubscriptionDialog from '../components/CreateSubscriptionDialog';

const avatarColor = (name: string) => {
  const p = ['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899'];
  return p[name.charCodeAt(0) % p.length];
};

const Subscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [users, setUsers]                 = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [pushing, setPushing]             = useState<number | null>(null);
  const [snack, setSnack]                 = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({ open: false, msg: '', severity: 'success' });

  const user = getCurrentUser();

  useEffect(() => {
    if (user?.id) fetchAll();
    else { setLoading(false); setError('Please log in.'); }
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [subs, usersData] = await Promise.all([getSubscriptions(), getAllUsers()]);
      setSubscriptions(subs);
      setUsers(usersData);
    } catch {
      setError('Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: number) => users.find(u => u.id === userId)?.username ?? `User #${userId}`;

  const handlePushBill = async (sub: any, participantUserId: number, amount: number, participantIndex: number) => {
    const key = sub.id * 1000 + participantIndex;
    setPushing(key);
    const now = new Date();
    const monthYear = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    try {
      await assignBillToUser({ userId: participantUserId, title: sub.title, amount, monthYear });
      setSnack({ open: true, msg: `Bill pushed to ${getUserName(participantUserId)}!`, severity: 'success' });
    } catch (err: any) {
      setSnack({ open: true, msg: err.response?.data?.message ?? 'Failed to push bill.', severity: 'error' });
    } finally {
      setPushing(null);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error)   return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Subscriptions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Recurring bill groups — bills are auto-generated each month
          </Typography>
        </Box>
        {user?.role === 'Admin' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} sx={{ borderRadius: 8, px: 3 }}>
            New Subscription
          </Button>
        )}
      </Box>

      {user?.role !== 'Admin' && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
          You can view subscription templates here. Only admins can create or manage them.
        </Alert>
      )}

      {subscriptions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          <AutorenewIcon sx={{ fontSize: 52, opacity: 0.18, mb: 1 }} />
          <Typography variant="body1">No subscriptions yet.</Typography>
          {user?.role === 'Admin' && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} sx={{ mt: 2, borderRadius: 8 }}>
              Create first subscription
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {subscriptions.map(sub => (
            <Grid size={{ xs: 12, md: 6 }} key={sub.id}>
              <Box sx={{
                bgcolor: 'white', borderRadius: 3, border: '1px solid #e5e7eb', overflow: 'hidden',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
              }}>
                {/* Card header */}
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #f3f4f6' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{sub.title}</Typography>
                      <Chip
                        size="small"
                        icon={<AutorenewIcon sx={{ fontSize: '0.8rem !important' }} />}
                        label="Recurring"
                        sx={{ mt: 0.5, height: 20, fontSize: '0.7rem', bgcolor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
                      />
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#2c3e50' }}>
                        ฿{sub.totalAmount.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">total / month</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Meta info */}
                <Box sx={{ px: 3, py: 2, display: 'flex', gap: 3, bgcolor: '#f9fafb' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <CalendarTodayIcon sx={{ fontSize: '0.85rem', color: '#9ca3af' }} />
                    <Typography variant="caption" color="text.secondary">
                      Bills on day <strong style={{ color: '#374151' }}>{sub.billingDayOfMonth}</strong>
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <PeopleIcon sx={{ fontSize: '0.85rem', color: '#9ca3af' }} />
                    <Typography variant="caption" color="text.secondary">
                      <strong style={{ color: '#374151' }}>{sub.participants.length}</strong> participant{sub.participants.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <AttachMoneyIcon sx={{ fontSize: '0.85rem', color: '#9ca3af' }} />
                    <Typography variant="caption" color="text.secondary">
                      ฿{sub.participants.length > 0 ? (sub.totalAmount / sub.participants.length).toFixed(2) : '0'} avg / person
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Participants */}
                <Box sx={{ p: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Participants
                  </Typography>
                  <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {sub.participants.map((p: any, i: number) => {
                      const name = getUserName(p.userId);
                      const pushKey = sub.id * 1000 + i;
                      return (
                        <Box key={p.id} sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          p: 1.5, bgcolor: '#f9fafb', borderRadius: 2, border: '1px solid #f3f4f6',
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: avatarColor(name), fontSize: '0.85rem', fontWeight: 700 }}>
                              {name[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{name}</Typography>
                              <Typography variant="caption" color="text.secondary">฿{p.defaultAmountOwed.toFixed(2)}</Typography>
                            </Box>
                          </Box>
                          {user?.role === 'Admin' && (
                            <Tooltip title={`Push this month's bill to ${name}`}>
                              <Button
                                size="small" variant="outlined"
                                disabled={pushing === pushKey}
                                onClick={() => handlePushBill(sub, p.userId, p.defaultAmountOwed, i)}
                                sx={{ borderRadius: 8, fontSize: '0.72rem', minWidth: 0, px: 1.5 }}
                              >
                                {pushing === pushKey ? 'Sending…' : 'Push now'}
                              </Button>
                            </Tooltip>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {dialogOpen && (
        <CreateSubscriptionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={() => { setDialogOpen(false); fetchAll(); }} />
      )}

      <Snackbar
        open={snack.open} autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2, minWidth: 280 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Subscriptions;
