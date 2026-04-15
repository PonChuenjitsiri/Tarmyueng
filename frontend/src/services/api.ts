import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5041/api';

const api = axios.create({
  baseURL: API_BASE_URL, // C# Backend local URL
  withCredentials: true, // Needed if you use cookies later
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth ---
export const loginUser = async (credentials: any) => {
  const response = await api.post('/Auth/login', credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// --- Users ---
export const getAllUsers = async () => {
  const response = await api.get('/Users');
  return response.data;
};

export const createUser = async (userData: any) => {
  const response = await api.post('/Users', userData);
  return response.data;
};

export const updateUser = async (userId: number, userData: any) => {
  const response = await api.put(`/Users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId: number) => {
  const response = await api.delete(`/Users/${userId}`);
  return response.data;
};
// --- Admin Features ---
export const assignBillToUser = async (billData: { userId: number, title: string, amount: number, monthYear: string, dueDate?: string }) => {
  const response = await api.post('/Bills/admin/assign', billData);
  return response.data;
};

// --- Bills & Payments ---
export const getPendingBills = async (userId: number) => {
  const response = await api.get(`/Bills/user/${userId}`);
  return response.data;
};

export const uploadPaymentSlip = async (billShareId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/Payments/upload-slip/${billShareId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000 // Add a timeout just in case it hangs!
  });
  return response.data;
};

export const testEasySlip = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/VerifyDebug/test-easyslip`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 30000
  });
  return response.data;
};

// --- Subscriptions ---
export const getSubscriptions = async () => {
  const response = await api.get('/Subscriptions');
  return response.data;
};

export const createSubscription = async (data: any) => {
  const response = await api.post('/Subscriptions', data);
  return response.data;
};

export const updateSubscription = async (subscriptionId: number, data: any) => {
  const response = await api.put(`/Subscriptions/${subscriptionId}`, data);
  return response.data;
};

export const deleteSubscription = async (subscriptionId: number) => {
  const response = await api.delete(`/Subscriptions/${subscriptionId}`);
  return response.data;
};

// --- History ---
export const getPaymentHistory = async (userId: number) => {
  const response = await api.get(`/History/user/${userId}`);
  return response.data;
};

export const getAdminHistory = async () => {
  const response = await api.get('/History/admin/all');
  return response.data;
};

export const getAdminAllBills = async () => {
  const response = await api.get('/Bills/admin/all');
  return response.data;
};

export const updateBill = async (billShareId: number, data: any) => {
  const response = await api.put(`/Bills/${billShareId}`, data);
  return response.data;
};

export const deleteBill = async (billShareId: number) => {
  const response = await api.delete(`/Bills/${billShareId}`);
  return response.data;
};

// --- Password Reset ---
export const requestPasswordReset = async (email: string) => {
  const response = await api.post('/PasswordReset/request', { email });
  return response.data;
};

export const validateResetToken = async (token: string) => {
  const response = await api.post('/PasswordReset/validate-token', { token });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const response = await api.post('/PasswordReset/reset', { token, newPassword });
  return response.data;
};

// --- Reports ---
export const getBillsBySubscription = async () => {
  const response = await api.get('/reports/bills-by-subscription');
  return response.data;
};

export default api;