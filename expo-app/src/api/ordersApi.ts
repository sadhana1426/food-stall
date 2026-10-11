import { apiClient } from './client';
import { Order } from '../types';

export const ordersApi = {
  createOrder: (data: any) => apiClient('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getOrders: (params?: { billNumber?: string; orderType?: string }) => {
    let query = '';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.billNumber) searchParams.append('billNumber', params.billNumber);
      if (params.orderType) searchParams.append('orderType', params.orderType);
      query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    }
    return apiClient(`/orders${query}`);
  },
  
  getOrder: (id: string) => apiClient(`/orders/${id}`),
  
  getOrderByBillNumber: (billNumber: string) => apiClient(`/orders/by-bill/${billNumber}`),
  
  reprintOrder: (id: string) => apiClient(`/orders/${id}/reprint`, {
    method: 'POST',
  }),
};
