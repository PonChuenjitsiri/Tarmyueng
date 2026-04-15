import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, IconButton, Typography, Snackbar, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GetAppIcon from '@mui/icons-material/GetApp';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setSnackbarMessage('✓ App installed successfully!');
      setShowSnackbar(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setSnackbarMessage('✓ App installed! Check your home screen.');
    } else {
      setSnackbarMessage('Installation cancelled.');
    }

    setShowPrompt(false);
    setDeferredPrompt(null);
    setShowSnackbar(true);
  };

  if (!showPrompt) return null;

  return (
    <>
      <Card
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          maxWidth: 340,
          zIndex: 1000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          backgroundColor: '#ffffff',
          border: 'none',
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GetAppIcon sx={{ color: '#5865f2' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                📱 Install App
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setShowPrompt(false)}
              sx={{ mt: -1, mr: -1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Install Tarmyueng on your device for quick access and offline support.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleInstall}
              sx={{ flex: 1, borderRadius: 2 }}
            >
              Install
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowPrompt(false)}
              sx={{ flex: 1, borderRadius: 2 }}
            >
              Later
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSnackbar(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PWAInstallPrompt;
