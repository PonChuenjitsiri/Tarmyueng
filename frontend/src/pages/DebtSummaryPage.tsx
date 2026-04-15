import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { API_BASE_URL } from '../services/api';

interface UserDebt {
  id: number;
  username: string;
  email: string;
  promptPayId: string | null;
  totalDebt: number;
  totalPaid: number;
  unpaidBillCount: number;
  paidBillCount: number;
}

interface BillDetail {
  id: number;
  userId: number;
  amountOwed: number;
  status: string;
  monthYear: string;
  billName: string;
  createdAt: string;
  payment: {
    status: string;
    verifiedAmount: number;
    verifiedAt: string;
  } | null;
}

const DebtSummaryPage: React.FC = () => {
  const [users, setUsers] = useState<UserDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<BillDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchUserDebtSummary();
  }, []);

  const fetchUserDebtSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports/user-debt-summary`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching debt summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: number) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/user/${userId}/debt-detail`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setUserDetails(data);
      setSelectedUserId(userId);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 2 } }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
        📊 User Debt Summary
      </Typography>

      {/* Summary Stats */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }, gap: { xs: 1, sm: 2 } }}>
          <Box>
            <Typography color="textSecondary" variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
              Total Users
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.5rem' } }}>
              {users.length}
            </Typography>
          </Box>
          <Box>
            <Typography color="textSecondary" variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
              Total Outstanding Debt
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#d32f2f', fontSize: { xs: '0.9rem', sm: '1.5rem' } }}>
              {formatCurrency(users.reduce((sum, u) => sum + u.totalDebt, 0))}
            </Typography>
          </Box>
          <Box>
            <Typography color="textSecondary" variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
              Total Paid
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#388e3c', fontSize: { xs: '0.9rem', sm: '1.5rem' } }}>
              {formatCurrency(users.reduce((sum, u) => sum + u.totalPaid, 0))}
            </Typography>
          </Box>
          <Box>
            <Typography color="textSecondary" variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
              Users with Debt
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.5rem' } }}>
              {users.filter(u => u.totalDebt > 0).length} / {users.length}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Main Table */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size={isMobile ? 'small' : 'medium'}>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '1rem' }}>User</TableCell>
              {!isMobile && <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>}
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '1rem' }}>
                Unpaid Debt
              </TableCell>
              {!isMobile && (
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Total Paid
                </TableCell>
              )}
              {!isMobile && (
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Unpaid Bills
                </TableCell>
              )}
              {!isMobile && (
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Paid Bills
                </TableCell>
              )}
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.8rem' : '1rem' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id} hover>
                <TableCell sx={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>
                  <strong>{user.username}</strong>
                </TableCell>
                {!isMobile && <TableCell sx={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>{user.email}</TableCell>}
                <TableCell align="right" sx={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>
                  <Typography
                    sx={{
                      fontWeight: 'bold',
                      color: user.totalDebt > 0 ? '#d32f2f' : '#388e3c',
                      fontSize: isMobile ? '0.85rem' : '1rem'
                    }}
                  >
                    {formatCurrency(user.totalDebt)}
                  </Typography>
                </TableCell>
                {!isMobile && (
                  <TableCell align="right">
                    <Typography sx={{ fontWeight: 'bold', color: '#388e3c' }}>
                      {formatCurrency(user.totalPaid)}
                    </Typography>
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell align="center">
                    <Chip
                      label={user.unpaidBillCount}
                      color={user.unpaidBillCount > 0 ? 'warning' : 'success'}
                      size="small"
                    />
                  </TableCell>
                )}
                {!isMobile && (
                  <TableCell align="center">
                    <Chip label={user.paidBillCount} color="success" size="small" />
                  </TableCell>
                )}
                <TableCell align="center">
                  <Button
                    size={isMobile ? 'small' : 'medium'}
                    variant="outlined"
                    onClick={() => fetchUserDetails(user.id)}
                    sx={{ fontSize: isMobile ? '0.75rem' : '1rem' }}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* User Details Dialog */}
      <Dialog
        open={selectedUserId !== null}
        onClose={() => setSelectedUserId(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Bill Details - {selectedUser?.username} ({selectedUser?.email})
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Bill</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Month</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Amount Owed
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Paid Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userDetails.map(detail => (
                    <TableRow key={detail.id}>
                      <TableCell>{detail.billName}</TableCell>
                      <TableCell>{detail.monthYear}</TableCell>
                      <TableCell align="right">{formatCurrency(detail.amountOwed)}</TableCell>
                      <TableCell>
                        <Chip
                          label={detail.status}
                          color={detail.status === 'Paid' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {detail.payment ? formatCurrency(detail.payment.verifiedAmount) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default DebtSummaryPage;
