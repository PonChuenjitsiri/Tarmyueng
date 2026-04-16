import React, { useEffect, useState } from 'react';
import {
  Typography, Box, CircularProgress, Alert, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, Tabs, Tab, IconButton, Collapse, useMediaQuery, useTheme
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { getPaymentHistory, getCurrentUser } from '../services/api';

// ── Expandable history row ────────────────────────────────────────────────────
const HistoryRow: React.FC<{ row: any; isMobile?: boolean }> = ({ row, isMobile }) => {
  const [open, setOpen] = useState(false);
  const hasSlip = Boolean(row.receiptImageUrl);

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: open ? 'unset' : undefined } }}>
        <TableCell padding="checkbox">
          <IconButton
            size="small"
            onClick={() => setOpen(o => !o)}
            disabled={!hasSlip}
            title={hasSlip ? 'View slip' : 'No slip available'}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: isMobile ? '0.85rem' : '1rem' }}>{row.billName}</Typography>
          {!isMobile && <Typography variant="caption" color="text.secondary">Paid to {row.adminName}</Typography>}
        </TableCell>
        {!isMobile && <TableCell>{row.monthYear}</TableCell>}
        <TableCell sx={{ fontWeight: 700, fontSize: isMobile ? '0.85rem' : '1rem' }}>฿{(row.verifiedAmount ?? 0).toFixed(2)}</TableCell>
        <TableCell>
          <Chip
            label={row.status}
            size={isMobile ? 'small' : 'medium'}
            color={row.status === 'Approved' ? 'success' : 'warning'}
          />
        </TableCell>
        {!isMobile && (
          <TableCell>
            <Typography variant="caption" color="text.secondary">
              {row.verifiedAt ? new Date(row.verifiedAt).toLocaleString() : '—'}
            </Typography>
          </TableCell>
        )}
        {!isMobile && (
          <TableCell>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
              {row.bankTransactionRef ?? '—'}
            </Typography>
          </TableCell>
        )}
      </TableRow>

      {/* Slip preview */}
      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                Payment Slip — {row.billName} ({row.monthYear})
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden', maxWidth: 280, bgcolor: 'white' }}>
                  <img
                    src={row.receiptImageUrl}
                    alt="Payment slip"
                    style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Amount verified</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>฿{(row.verifiedAmount ?? 0).toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Bank reference</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.bankTransactionRef ?? '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Verified at</Typography>
                    <Typography variant="body2">{row.verifiedAt ? new Date(row.verifiedAt).toLocaleString() : '—'}</Typography>
                  </Box>
                  <Button
                    size="small" variant="outlined"
                    href={row.receiptImageUrl} target="_blank"
                    sx={{ borderRadius: 8, alignSelf: 'flex-start', mt: 0.5 }}
                  >
                    Open full image
                  </Button>
                </Box>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const Bills: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState(0);

  const user = getCurrentUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (user?.id) {
      getPaymentHistory(user.id).then(setHistory).catch(() => setError('Failed to load payment history.')).finally(() => setLoading(false));
    } else {
      setLoading(false);
      setError('Please log in.');
    }
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error)   return <Alert severity="error">{error}</Alert>;

  const tabFilter = ['All', 'Approved', 'Pending'][tab];
  const filtered  = tabFilter === 'All' ? history : history.filter(p => p.status === tabFilter);

  const totalVerified  = history.filter(p => p.status === 'Approved').reduce((s, p) => s + (p.verifiedAmount ?? 0), 0);
  const approvedCount  = history.filter(p => p.status === 'Approved').length;
  const pendingCount   = history.filter(p => p.status !== 'Approved').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 2.5, sm: 4 } }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>History</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
          Your payments
        </Typography>
      </Box>

      {/* Summary chips */}
      {history.length > 0 && (
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: 1, bgcolor: 'white', border: '1px solid #e5e7eb', borderRadius: 3, minWidth: 100 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Paid</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#27ae60', fontSize: { xs: '1rem', sm: '1.25rem' } }}>฿{totalVerified.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: 1, bgcolor: 'white', border: '1px solid #e5e7eb', borderRadius: 3, minWidth: 90 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Verified</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#27ae60', fontSize: { xs: '1rem', sm: '1.25rem' } }}>{approvedCount}</Typography>
          </Box>
          {pendingCount > 0 && (
            <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: 1, bgcolor: 'white', border: '1px solid #e5e7eb', borderRadius: 3, minWidth: 90 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Pending</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#e67e22', fontSize: { xs: '1rem', sm: '1.25rem' } }}>{pendingCount}</Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Filter tabs */}
      {history.length > 0 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
          >
            <Tab label={`All (${history.length})`} sx={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
            <Tab label={`Verified (${approvedCount})`} sx={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
            {pendingCount > 0 && <Tab label={`Pending (${pendingCount})`} sx={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />}
          </Tabs>
        </Box>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          <ReceiptLongIcon sx={{ fontSize: 52, opacity: 0.18, mb: 1 }} />
          <Typography variant="body1">
            {history.length === 0 ? "No payments yet." : 'None match filter.'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e5e7eb', overflowX: 'auto' }}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell sx={{ fontWeight: 700, fontSize: isMobile ? '0.85rem' : '1rem' }}>Bill</TableCell>
                {!isMobile && <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>}
                <TableCell sx={{ fontWeight: 700, fontSize: isMobile ? '0.85rem' : '1rem' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: isMobile ? '0.85rem' : '1rem' }}>Status</TableCell>
                {!isMobile && <TableCell sx={{ fontWeight: 700 }}>Verified at</TableCell>}
                {!isMobile && <TableCell sx={{ fontWeight: 700 }}>Bank ref</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(p => <HistoryRow key={p.id} row={p} isMobile={isMobile} />)}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Bills;
