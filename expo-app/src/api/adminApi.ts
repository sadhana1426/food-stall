import { apiClient } from './client';

export const adminApi = {
  verifyPassword: (password: string) => apiClient('/settings/verify-password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
};
