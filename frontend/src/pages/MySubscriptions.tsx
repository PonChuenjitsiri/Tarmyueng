import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Grid, CircularProgress, Alert, Card, CardContent,
  Chip
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import { getUserSubscriptions, getCurrentUser } from '../services/api';

const MySubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = getCurrentUser();

  useEffect(() => {
    if (user?.id) {
      fetchSubscriptions();
    } else {
      setLoading(false);
      setError('Please login.');
    }
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const data = await getUserSubscriptions();
      setSubscriptions(data);
    } catch {
      setError('Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 2.5, sm: 4 } }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          My Subscriptions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
          Groups you're part of
        </Typography>
      </Box>

      {subscriptions.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          You're not in any groups yet.
        </Alert>
      ) : (
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {subscriptions.map(sub => {
            const hasNextBill = sub.nextBill && sub.nextBill.amountOwed > 0;

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={sub.id}>
                <Card sx={{ borderRadius: 3, height: '100%', borderLeft: `4px solid #5865f2` }}>
                  <CardContent sx={{ p: 3 }}>
                    {/* Title */}
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {sub.title}
                    </Typography>

                    {/* Admin */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                      <PersonIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                      <Typography variant="caption" color="text.secondary">
                        {sub.adminUsername}
                      </Typography>
                    </Box>

                    {/* Divider */}
                    <Box sx={{ borderTop: '1px solid #e5e7eb', my: 2 }} />

                    {/* Stats */}
                    <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                      <Grid size={{ xs: 6 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Billing Day
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {sub.billingDayOfMonth}th
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            Members
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {sub.participantCount}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Amount */}
                    <Box sx={{ bgcolor: '#f8f9fa', p: 1.5, borderRadius: 1.5, mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Monthly Amount
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#5865f2' }}>
                        ฿{sub.totalAmount.toFixed(2)}
                      </Typography>
                    </Box>

                    {/* Next Bill */}
                    {hasNextBill ? (
                      <Box sx={{ bgcolor: '#fef3c7', p: 1.5, borderRadius: 1.5, borderLeft: '3px solid #f59e0b' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <CalendarTodayIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                          <Typography variant="caption" color="text.secondary">
                            Due Date
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#92400e' }}>
                          {(() => {
                            const [month, year] = sub.nextBill.monthYear.split('-');
                            return `${sub.billingDayOfMonth}/${month}/${year}`;
                          })()}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <AttachMoneyIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#92400e' }}>
                            ฿{sub.nextBill.amountOwed.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ bgcolor: '#d1fae5', p: 1.5, borderRadius: 1.5, borderLeft: '3px solid #10b981' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ color: '#065f46' }}>
                          ✓ All paid up!
                        </Typography>
                      </Box>
                    )}

                    {/* Status */}
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label={sub.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={sub.isActive ? 'success' : 'default'}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default MySubscriptions;
