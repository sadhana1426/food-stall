import { apiClient } from './client';

export const salesApi = {
  getTodaySales: () => apiClient('/sales/today'),
};
