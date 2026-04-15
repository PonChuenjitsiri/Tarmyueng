import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, Alert,
  IconButton, InputAdornment, Link
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { loginUser } from '../services/api';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      await loginUser({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: '#f8f9fa', px: { xs: 1.5, sm: 2 }, py: 2,
    }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px', color: '#2c3e50', fontSize: { xs: '2rem', sm: '3rem' } }}>
            💸 Tarmyueng
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
            ตัวติดตามค่าใช้จ่ายร่วมกัน
          </Typography>
        </Box>

        {/* Card */}
        <Box sx={{
          bgcolor: 'white', borderRadius: 4, p: { xs: 2.5, sm: 4 },
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          border: '1px solid #e5e7eb',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1rem', sm: '1.25rem' } }}>ยินดีต้อนรับกลับมา</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
            เข้าสู่บัญชีของคุณ
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: { xs: '0.85rem', sm: '1rem' } }}>{error}</Alert>
          )}

          <form onSubmit={handleLogin}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
              <TextField
                label="ที่อยู่อีเมล" type="email" fullWidth autoFocus
                value={email} onChange={e => setEmail(e.target.value)}
                size="small"
              />
              <TextField
                label="รหัสผ่าน" fullWidth
                type={showPw ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                size="small"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPw(v => !v)} edge="end">
                          {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Box sx={{ textAlign: 'right' }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  variant="body2"
                  sx={{ fontWeight: 600, textDecoration: 'none', fontSize: { xs: '0.8rem', sm: '1rem' } }}
                >
                  ลืมรหัสผ่าน?
                </Link>
              </Box>
              <Button
                type="submit" variant="contained" fullWidth
                disabled={loading}
                sx={{ borderRadius: 8, py: { xs: 1, sm: 1.4 }, fontWeight: 700, fontSize: { xs: '0.9rem', sm: '0.95rem' }, mt: 1 }}
              >
                {loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
