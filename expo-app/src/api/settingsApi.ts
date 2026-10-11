import { apiClient } from './client';

export const settingsApi = {
  getBusinessSettings: () => apiClient('/settings/business'),
  updateBusinessSettings: (data: any) => apiClient('/settings/business', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getBillingSettings: () => apiClient('/settings/billing'),
  updateBillingSettings: (data: any) => apiClient('/settings/billing', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};
