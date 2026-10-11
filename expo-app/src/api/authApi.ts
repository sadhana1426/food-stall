import { apiClient } from './client';

export const authApi = {
  signupStart: (data: any) => apiClient('/auth/signup/start', { method: 'POST', body: JSON.stringify(data) }),
  signupVerifyOtp: (data: any) => apiClient('/auth/signup/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  signupComplete: (data: any) => apiClient('/auth/signup/complete', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => apiClient('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data: any) => apiClient('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  verifyResetOtp: (data: any) => apiClient('/auth/verify-reset-otp', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data: any) => apiClient('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  refresh: (refreshToken: string) => apiClient('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  logout: (refreshToken: string) => apiClient('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  getMe: () => apiClient('/auth/me', { method: 'GET' }),
};
