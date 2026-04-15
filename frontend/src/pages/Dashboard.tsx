import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Button, Grid, CircularProgress,
  Alert, Box, Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import generatePayload from 'promptpay-qr';
import { QRCodeSVG } from 'qrcode.react';
import { getPendingBills, uploadPaymentSlip, getCurrentUser } from '../services/api';

const Dashboard: React.FC = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedFiles, setSelectedFiles] = useState<{ [key: number]: File | null }>({});
  const [previewUrls, setPreviewUrls] = useState<{ [key: number]: string }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: number]: { type: 'info' | 'success' | 'error'; text: string } | null }>({});
  const [isVerifying, setIsVerifying] = useState<{ [key: number]: boolean }>({});

  const user = getCurrentUser();

  useEffect(() => {
    if (user?.id) {
      fetchBills();
    } else {
      setLoading(false);
      setError('Please login to see your dashboard.');
    }
  }, []);

  useEffect(() => {
    return () => { Object.values(previewUrls).forEach(url => URL.revokeObjectURL(url)); };
  }, [previewUrls]);

  const fetchBills = async () => {
    try {
      const data = await getPendingBills(user.id);
      setBills(data);
    } catch {
      setError('Failed to load bills.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, billShareId: number) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    if (previewUrls[billShareId]) URL.revokeObjectURL(previewUrls[billShareId]);
    setSelectedFiles(prev => ({ ...prev, [billShareId]: file }));
    setPreviewUrls(prev => ({ ...prev, [billShareId]: URL.createObjectURL(file) }));
    setUploadStatus(prev => ({ ...prev, [billShareId]: null }));
  };

  const handleVerify = async (billShareId: number) => {
    const file = selectedFiles[billShareId];
    if (!file) return;

    setIsVerifying(prev => ({ ...prev, [billShareId]: true }));
    setUploadStatus(prev => ({ ...prev, [billShareId]: { type: 'info', text: 'Uploading slip for bank verification...' } }));

    try {
      const response = await uploadPaymentSlip(billShareId, file);
      setUploadStatus(prev => ({
        ...prev,
        [billShareId]: {
          type: 'success',
          text: `Payment confirmed! Verified ฿${response.payment.verifiedAmount?.toFixed(2) ?? '0.00'} — Ref: ${response.payment.bankTransactionRef}`,
        },
      }));
      setTimeout(() => setBills(prev => prev.filter(b => b.id !== billShareId)), 3000);
    } catch (err: any) {
      const apiError = err.response?.data;
      const msg = apiError?.details ?? apiError?.error ?? 'Verification failed. Please check your slip and try again.';
      setUploadStatus(prev => ({ ...prev, [billShareId]: { type: 'error', text: msg } }));
    } finally {
      setIsVerifying(prev => ({ ...prev, [billShareId]: false }));
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        ยินดีต้อนรับกลับ {user?.username}!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        คุณมี {bills.length} บิลรอชำระ
      </Typography>

      {bills.length === 0 ? (
        <Alert severity="success" sx={{ mt: 2, borderRadius: 3 }}>
          คุณไม่มีบิลรอชำระ! คุณสบายใจได้
        </Alert>
      ) : (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {bills.map((bill) => {
            const promptPayId = bill.monthlyBill.template.admin.promptPayId ?? '0000000000';
            const amount = bill.amountOwed;
            const qrPayload = generatePayload(promptPayId, { amount });

            const selectedFile = selectedFiles[bill.id];
            const previewUrl = previewUrls[bill.id];
            const status = uploadStatus[bill.id];
            const verifying = isVerifying[bill.id];
            const isPaid = status?.type === 'success';

            return (
              <Grid size={{ xs: 12, md: 6 }} key={bill.id}>
                <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', border: isPaid ? '2px solid #27ae60' : undefined }}>
                  <CardContent sx={{ p: 4 }}>

                    {/* Bill header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                          {bill.monthlyBill.template.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {bill.monthlyBill.monthYear} • Owed to {bill.monthlyBill.template.admin.username}
                        </Typography>
                      </Box>
                      <Chip label={bill.status} size="small" color="warning" />
                    </Box>

                    {/* Amount */}
                    <Typography variant="h3" sx={{ my: 2, fontWeight: 800, color: '#2c3e50', textAlign: 'center' }}>
                      ฿{amount.toFixed(2)}
                    </Typography>

                    {/* PromptPay QR */}
                    <Box sx={{ textAlign: 'center', my: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                        <QRCodeSVG value={qrPayload} size={140} />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        PromptPay: {promptPayId}
                      </Typography>
                    </Box>

                    {/* Upload section */}
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 2 }}>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id={`upload-${bill.id}`}
                          type="file"
                          onChange={e => handleFileSelect(e, bill.id)}
                          disabled={verifying || isPaid}
                        />
                        <label htmlFor={`upload-${bill.id}`}>
                          <Button variant="outlined" component="span" disabled={verifying || isPaid} sx={{ borderRadius: 8, fontSize: { xs: '0.875rem', sm: '1rem' } }} size="small">
                            {selectedFile ? 'Change' : 'Upload'}
                          </Button>
                        </label>

                        <Button
                          variant="contained"
                          color="success"
                          disabled={!selectedFile || verifying || isPaid}
                          onClick={() => handleVerify(bill.id)}
                          sx={{ borderRadius: 8, px: { xs: 2, sm: 4 }, fontSize: { xs: '0.875rem', sm: '1rem' } }}
                          size="small"
                        >
                          {verifying ? 'Verifying...' : 'Pay Now'}
                        </Button>
                      </Box>

                      {/* Slip preview */}
                      {previewUrl && (
                        <Box sx={{
                          mt: 2, borderRadius: 2, overflow: 'hidden',
                          border: isPaid ? '2px solid #27ae60' : '1px solid #e0e0e0',
                          position: 'relative',
                        }}>
                          {isPaid && (
                            <Box sx={{
                              position: 'absolute', top: 8, right: 8,
                              bgcolor: '#27ae60', borderRadius: '50%',
                              width: 32, height: 32,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <CheckCircleIcon sx={{ color: 'white', fontSize: 20 }} />
                            </Box>
                          )}
                          <img
                            src={previewUrl}
                            alt="Slip preview"
                            style={{ width: '100%', maxHeight: 280, objectFit: 'contain', display: 'block', background: '#fafafa' }}
                          />
                          <Box sx={{ p: 1, bgcolor: '#f8f9fa' }}>
                            <Typography variant="caption" color="text.secondary">{selectedFile?.name}</Typography>
                          </Box>
                        </Box>
                      )}

                      {/* Status message */}
                      {status && (
                        <Alert severity={status.type} sx={{ mt: 2, borderRadius: 2 }}>
                          {status.text}
                        </Alert>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </div>
  );
};

export default Dashboard;
