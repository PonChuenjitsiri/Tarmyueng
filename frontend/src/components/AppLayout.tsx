import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Container, Box, Button, Avatar, Chip, Drawer, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../services/api';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import logo from '../assets/logo.svg';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  if (!user) {
    return <Container maxWidth="sm"><Box sx={{ my: 8 }}>{children}</Box></Container>;
  }

  const isAdmin = user.role === 'Admin';

  const navLinks = isAdmin
    ? [
        { label: 'Dashboard', to: '/admin' },
        { label: 'Groups', to: '/subscriptions' },
        { label: 'Debt', to: '/debt-summary' },
        { label: 'Users', to: '/users' },
      ]
    : [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'History', to: '/bills' },
      ];

  return (
    <>
      <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid #E0E0E0', paddingTop: 'env(safe-area-inset-top)' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, minHeight: 'auto', py: 1 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img src={logo} alt="Tarmyueng" style={{ height: '40px', width: 'auto' }} />
            {!isMobile && (
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                Tarmyueng
              </Typography>
            )}
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5, flex: 1, justifyContent: 'center' }}>
              {navLinks.map(link => (
                <Button key={link.to} color="inherit" component={Link} to={link.to} size="small">
                  {link.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Desktop User Info */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                avatar={<Avatar sx={{ width: 28, height: 28 }}>{user.username[0].toUpperCase()}</Avatar>}
                label={user.username}
                variant="outlined"
                size="small"
                sx={{ color: 'inherit', borderColor: 'rgba(255,255,255,0.5)' }}
              />
              <Button color="inherit" variant="outlined" size="small" onClick={handleLogout} sx={{ borderRadius: 8 }}>
                Logout
              </Button>
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton color="inherit" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      {isMobile && (
        <Drawer
          anchor="top"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          sx={{ '& .MuiDrawer-paper': { mt: 7 } }}
        >
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {navLinks.map(link => (
              <Button
                key={link.to}
                fullWidth
                component={Link}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                sx={{ justifyContent: 'flex-start' }}
              >
                {link.label}
              </Button>
            ))}
            <Box sx={{ borderTop: '1px solid #e0e0e0', pt: 2, mt: 1 }}>
              <Chip
                avatar={<Avatar>{user.username[0].toUpperCase()}</Avatar>}
                label={`${user.username} (${user.role})`}
                variant="outlined"
                sx={{ mb: 2, width: '100%' }}
              />
              <Button
                fullWidth
                color="error"
                variant="outlined"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Drawer>
      )}

      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2, md: 3 }, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Box sx={{ my: { xs: 2, sm: 3, md: 4 } }}>
          {children}
        </Box>
      </Container>
    </>
  );
};

export default AppLayout;
