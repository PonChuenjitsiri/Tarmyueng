import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
import Login from './pages/Login';
import UsersAdmin from './pages/UsersAdmin';
import Subscriptions from './pages/Subscriptions';
import ProjectStatusPage from './pages/ProjectStatusPage';
import DebtSummaryPage from './pages/DebtSummaryPage';
import AppLayout from './components/AppLayout';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { getCurrentUser } from './services/api';

const RootRedirect: React.FC = () => {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'Admin' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/users" element={<UsersAdmin />} />
            <Route path="/debt-summary" element={<DebtSummaryPage />} />
            <Route path="/status" element={<ProjectStatusPage />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </AppLayout>
        <PWAInstallPrompt />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
