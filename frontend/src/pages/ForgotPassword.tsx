import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
              ✅ Check Your Email
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
              If an account exists with <strong>{email}</strong>, you'll receive a password reset link.
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              The link expires in 24 hours. Please check your spam folder if you don't see the email.
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/login')}
            sx={{ borderRadius: 2, mb: 2 }}
          >
            Back to Login
          </Button>

          <Typography variant="body2" color="textSecondary">
            Didn't receive it?{' '}
            <MuiLink
              component={Link}
              to="/forgot-password"
              onClick={() => { setSuccess(false); setEmail(''); }}
              sx={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              Try again with a different email
            </MuiLink>
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Forgot Password?
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Enter your email and we'll send you a link to reset your password.
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={loading}
            sx={{ mb: 3 }}
            autoFocus
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading || !email.trim()}
            sx={{ borderRadius: 2, py: 1.5, mb: 2 }}
          >
            {loading ? <CircularProgress size={20} /> : 'Send Reset Link'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Remember your password?{' '}
              <MuiLink
                component={Link}
                to="/login"
                sx={{ fontWeight: 'bold', textDecoration: 'none' }}
              >
                Back to Login
              </MuiLink>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ForgotPassword;
