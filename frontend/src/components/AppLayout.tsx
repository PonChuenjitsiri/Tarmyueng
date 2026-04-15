import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box, Button, Avatar, Chip } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../services/api';
import logo from '../assets/logo.svg';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  if (!user) {
    return <Container maxWidth="sm"><Box sx={{ my: 8 }}>{children}</Box></Container>;
  }

  const isAdmin = user.role === 'Admin';

  return (
    <>
      <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid #E0E0E0' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <img src={logo} alt="Tarmyueng" style={{ height: '40px', width: 'auto' }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Tarmyueng
            </Typography>
          </Box>

          {isAdmin ? (
            <>
              <Button color="inherit" component={Link} to="/admin">Dashboard</Button>
              <Button color="inherit" component={Link} to="/subscriptions">Subscriptions</Button>
              <Button color="inherit" component={Link} to="/debt-summary">Debt Summary</Button>
              <Button color="inherit" component={Link} to="/users">Manage Users</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
              <Button color="inherit" component={Link} to="/bills">My History</Button>
            </>
          )}

          <Box sx={{ ml: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              avatar={<Avatar>{user.username[0].toUpperCase()}</Avatar>}
              label={`${user.username} (${user.role})`}
              variant="outlined"
              color={isAdmin ? 'secondary' : 'default'}
              sx={{ color: 'secondary', borderColor: 'rgba(255,255,255,0.5)' }}
            />
            <Button color="inherit" variant="outlined" size="small" onClick={handleLogout} sx={{ borderRadius: 8 }}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          {children}
        </Box>
      </Container>
    </>
  );
};

export default AppLayout;
