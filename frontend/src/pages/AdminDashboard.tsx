import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Grid, Card, CardContent, CircularProgress, Alert,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, Button, Avatar, IconButton, Collapse, Accordion, AccordionSummary, AccordionDetails,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, useMediaQuery, useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import { getAdminAllBills, getAdminHistory, getCurrentUser, deleteBill, getBillsBySubscription } from '../services/api';
import AddBillDialog from '../components/AddBillDialog';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
  <Card elevation={2} sx={{ borderRadius: 3, borderLeft: `4px solid ${color}` }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{label}</Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 0.5 }}>{value}</Typography>
        </Box>
        <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
      </Box>
    </CardContent>
  </Card>
);

// ── Expandable row for Payment History ──────────────────────────────────────
interface HistoryRowProps { row: any; isMobile?: boolean; }

const HistoryRow: React.FC<HistoryRowProps> = ({ row, isMobile }) => {
  const [open, setOpen] = useState(false);
  const hasSlip = Boolean(row.receiptImageUrl);

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: open ? 'unset' : undefined } }}>
        <TableCell padding="checkbox">
          <IconButton size="small" onClick={() => setOpen(o => !o)} disabled={!hasSlip} title={hasSlip ? 'View slip' : 'No slip available'}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: isMobile ? '0.85rem' : '1rem' }}>{row.userName}</Typography>
          {!isMobile && <Typography variant="caption" color="text.secondary">{row.userEmail}</Typography>}
        </TableCell>
        <TableCell sx={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>{row.billName}</TableCell>
        {!isMobile && <TableCell sx={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>{row.monthYear}</TableCell>}
        <TableCell sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.85rem' : '1rem' }}>฿{(row.verifiedAmount ?? 0).toFixed(2)}</TableCell>
        <TableCell>
          <Chip label={row.status} size={isMobile ? 'small' : 'medium'} color={row.status === 'Approved' ? 'success' : 'warning'} />
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
            <Typography variant="caption" color="text.secondary">{row.bankTransactionRef ?? '—'}</Typography>
          </TableCell>
        )}
      </TableRow>

      {/* Expandable slip preview */}
      <TableRow>
        <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                Payment Slip — {row.billName} ({row.monthYear})
              </Typography>
              {hasSlip ? (
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden', maxWidth: 320, bgcolor: 'white' }}>
                    <img
                      src={row.receiptImageUrl}
                      alt="Payment slip"
                      style={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2"><strong>User:</strong> {row.userName}</Typography>
                    <Typography variant="body2"><strong>Amount:</strong> ฿{(row.verifiedAmount ?? 0).toFixed(2)}</Typography>
                    <Typography variant="body2"><strong>Bank Ref:</strong> {row.bankTransactionRef ?? '—'}</Typography>
                    <Typography variant="body2"><strong>Verified:</strong> {row.verifiedAt ? new Date(row.verifiedAt).toLocaleString() : '—'}</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      href={row.receiptImageUrl}
                      target="_blank"
                      sx={{ mt: 1, borderRadius: 8, alignSelf: 'flex-start' }}
                    >
                      Open full image
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <ImageNotSupportedIcon fontSize="small" />
                  <Typography variant="body2">No slip image available.</Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// ── Expandable row for All Bills (shows slip when paid) ─────────────────────
interface BillRowProps { row: any; onDelete: (billId: number) => void; isMobile?: boolean; }

const BillRow: React.FC<BillRowProps> = ({ row, onDelete, isMobile }) => {
  const [open, setOpen] = useState(false);
  // Safely check if a slip exists using optional chaining
  const hasSlip = Boolean(row.payment?.receiptImageUrl);

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: open ? 'unset' : undefined } }}>
        <TableCell padding="checkbox">
          <IconButton size="small" onClick={() => setOpen(o => !o)} disabled={!hasSlip} title={hasSlip ? 'View slip' : 'No slip yet'}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.userName}</Typography>
          {!isMobile && <Typography variant="caption" color="text.secondary">{row.userEmail}</Typography>}
        </TableCell>
        <TableCell sx={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>{row.billName}</TableCell>
        {!isMobile && <TableCell>{row.monthYear}</TableCell>}
        <TableCell sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.85rem' : '1rem' }}>฿{row.amountOwed.toFixed(2)}</TableCell>
        <TableCell>
          <Chip
            label={row.status}
            size={isMobile ? 'small' : 'medium'}
            color={row.status === 'Paid' ? 'success' : 'warning'}
            variant="filled"
          />
        </TableCell>
        {!isMobile && (
          <TableCell>
            <Typography variant="caption" color="text.secondary">
              {row.payment?.verifiedAt ? new Date(row.payment.verifiedAt).toLocaleString() : '—'}
            </Typography>
          </TableCell>
        )}
        <TableCell align="right">
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <IconButton size="small" color="error" onClick={() => onDelete(row.id)} title="Delete bill">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      {/* Expandable slip preview */}
      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                Payment Slip — {row.billName} ({row.monthYear})
              </Typography>
              
              {/* Added Conditional Check Here */}
              {hasSlip && row.payment ? (
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden', maxWidth: 320, bgcolor: 'white' }}>
                    <img
                      src={row.payment.receiptImageUrl}
                      alt="Payment slip"
                      style={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2"><strong>User:</strong> {row.userName}</Typography>
                    <Typography variant="body2"><strong>Amount Verified:</strong> ฿{(row.payment.verifiedAmount ?? row.amountOwed).toFixed(2)}</Typography>
                    <Typography variant="body2"><strong>Bank Ref:</strong> {row.payment.bankTransactionRef ?? '—'}</Typography>
                    <Typography variant="body2"><strong>Verified:</strong> {row.payment.verifiedAt ? new Date(row.payment.verifiedAt).toLocaleString() : '—'}</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      href={row.payment.receiptImageUrl}
                      target="_blank"
                      sx={{ mt: 1, borderRadius: 8, alignSelf: 'flex-start' }}
                    >
                      Open full image
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                  <ImageNotSupportedIcon fontSize="small" />
                  <Typography variant="body2">No slip image available.</Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [groupedBills, setGroupedBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [addBillOpen, setAddBillOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; billId: number | null }>({ open: false, billId: null });
  const [deleting, setDeleting] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({ open: false, msg: '', severity: 'success' });

  const user = getCurrentUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => { fetchAll(); }, []);

  const handleDeleteBill = async (billId: number) => {
    setDeleting(true);
    try {
      await deleteBill(billId);
      setSnack({ open: true, msg: 'Bill deleted successfully!', severity: 'success' });
      fetchAll();
    } catch (err: any) {
      setSnack({ open: true, msg: err.response?.data?.message ?? 'Failed to delete bill.', severity: 'error' });
    } finally {
      setDeleting(false);
      setDeleteConfirm({ open: false, billId: null });
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [billsData, historyData, groupedData] = await Promise.all([
        getAdminAllBills(),
        getAdminHistory(),
        getBillsBySubscription()
      ]);
      setBills(billsData);
      setHistory(historyData);
      setGroupedBills(groupedData);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const paid = bills.filter(b => b.status === 'Paid').length;
  const unpaid = bills.filter(b => b.status !== 'Paid').length;
  const totalRevenue = history.reduce((sum: number, p: any) => sum + (p.verifiedAmount ?? 0), 0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>แดชบอร์ดผู้ดูแล</Typography>
          <Typography variant="body2" color="text.secondary">ยินดีต้อนรับกลับ {user?.username}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddBillOpen(true)} sx={{ borderRadius: 8, px: 3 }}>
          เพิ่มบิล
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="บิลทั้งหมด" value={bills.length} icon={<ReceiptIcon />} color="#3498db" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="ชำระแล้ว" value={paid} icon={<CheckCircleIcon />} color="#27ae60" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="ยังไม่ชำระ" value={unpaid} icon={<PendingIcon />} color="#e67e22" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="รวมเก็บได้" value={`฿${totalRevenue.toFixed(2)}`} icon={<PeopleIcon />} color="#9b59b6" />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
          sx={{ minHeight: 'auto' }}
        >
          <Tab label={`บิลทั้งหมด (${bills.length})`} sx={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
          <Tab label={`บิลตามสมาชิก (${groupedBills.length})`} sx={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
          <Tab label={`ประวัติการชำระ (${history.length})`} sx={{ fontSize: isMobile ? '0.75rem' : '1rem' }} />
        </Tabs>
      </Box>

      {/* All Bills */}
      {tab === 0 && (
        bills.length === 0
          ? <Alert severity="info">ยังไม่มีบิล คลิก "เพิ่มบิล" เพื่อเริ่มต้น</Alert>
          : (
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3, overflowX: 'auto' }}>
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.85rem' : '1rem' }}>ผู้ใช้</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.85rem' : '1rem' }}>บิล</TableCell>
                    {!isMobile && <TableCell sx={{ fontWeight: 'bold' }}>เดือน</TableCell>}
                    <TableCell sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.85rem' : '1rem' }}>จำนวนเงิน</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.85rem' : '1rem' }}>สถานะ</TableCell>
                    {!isMobile && <TableCell sx={{ fontWeight: 'bold' }}>วันที่ชำระ</TableCell>}
                    <TableCell sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.85rem' : '1rem' }}>การดำเนิน</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bills.map(bill => <BillRow key={bill.id} row={bill} onDelete={(billId) => setDeleteConfirm({ open: true, billId })} isMobile={isMobile} />)}
                </TableBody>
              </Table>
            </TableContainer>
          )
      )}

      {/* Bills by Subscription (Grouped) */}
      {tab === 1 && (
        groupedBills.length === 0
          ? <Alert severity="info">ยังไม่มีสมาชิก</Alert>
          : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {groupedBills.map(subscription => (
                <Accordion key={subscription.id} defaultExpanded={true}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {subscription.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Billing Day: {subscription.billingDayOfMonth} | Participants: {subscription.participantCount}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
                        <Chip
                          label={`Total Amount: ฿${subscription.totalAmount.toFixed(2)}`}
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={subscription.isActive ? 'Active' : 'Inactive'}
                          color={subscription.isActive ? 'success' : 'default'}
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {subscription.bills.length === 0 ? (
                        <Alert severity="info">No monthly bills yet.</Alert>
                      ) : (
                        subscription.bills.map((bill: any) => (
                          <Card key={bill.id} variant="outlined">
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    {bill.monthYear}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    Created: {new Date(bill.createdAt).toLocaleDateString()}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Chip
                                    label={`Paid: ${bill.totalPaid}/${subscription.participantCount}`}
                                    color={bill.totalPaid === subscription.participantCount ? 'success' : 'warning'}
                                    size="small"
                                  />
                                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    ฿{bill.totalAmount.toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Bill Shares Table */}
                              <TableContainer>
                                <Table size="small">
                                  <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        Amount Owed
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        Verified Amount
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {bill.shares.map((share: any) => (
                                      <TableRow key={share.id} hover>
                                        <TableCell>
                                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {share.userName}
                                          </Typography>
                                          <Typography variant="caption" color="textSecondary">
                                            {share.userEmail}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          ฿{share.amountOwed.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                          <Chip
                                            label={share.status}
                                            color={share.status === 'Paid' ? 'success' : 'warning'}
                                            size="small"
                                          />
                                        </TableCell>
                                        <TableCell align="right">
                                          {share.payment
                                            ? `฿${share.payment.verifiedAmount.toFixed(2)}`
                                            : '-'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )
      )}

      {/* Payment History */}
      {tab === 2 && (
        history.length === 0
          ? <Alert severity="info">ยังไม่มีการชำระเงิน</Alert>
          : (
            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Bill</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Month</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Verified At</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Bank Ref</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map(p => <HistoryRow key={p.id} row={p} isMobile={isMobile} />)}
                </TableBody>
              </Table>
            </TableContainer>
          )
      )}

      <AddBillDialog open={addBillOpen} onClose={() => setAddBillOpen(false)} onSuccess={() => { setAddBillOpen(false); fetchAll(); }} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, billId: null })}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Delete Bill?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Are you sure you want to delete this bill? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirm({ open: false, billId: null })} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteConfirm.billId && handleDeleteBill(deleteConfirm.billId)}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;
