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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        📊 User Debt Summary
      </Typography>

      {/* Summary Stats */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <Box>
            <Typography color="textSecondary" variant="body2">
              Total Users
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {users.length}
            </Typography>
          </Box>
          <Box>
            <Typography color="textSecondary" variant="body2">
              Total Outstanding Debt
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
              {formatCurrency(users.reduce((sum, u) => sum + u.totalDebt, 0))}
            </Typography>
          </Box>
          <Box>
            <Typography color="textSecondary" variant="body2">
              Total Paid
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#388e3c' }}>
              {formatCurrency(users.reduce((sum, u) => sum + u.totalPaid, 0))}
            </Typography>
          </Box>
          <Box>
            <Typography color="textSecondary" variant="body2">
              Users with Debt
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {users.filter(u => u.totalDebt > 0).length} / {users.length}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Main Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Unpaid Debt
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Total Paid
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                Unpaid Bills
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                Paid Bills
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <strong>{user.username}</strong>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell align="right">
                  <Typography
                    sx={{
                      fontWeight: 'bold',
                      color: user.totalDebt > 0 ? '#d32f2f' : '#388e3c',
                    }}
                  >
                    {formatCurrency(user.totalDebt)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography sx={{ fontWeight: 'bold', color: '#388e3c' }}>
                    {formatCurrency(user.totalPaid)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={user.unpaidBillCount}
                    color={user.unpaidBillCount > 0 ? 'warning' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip label={user.paidBillCount} color="success" size="small" />
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => fetchUserDetails(user.id)}
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
