import * as FileSystem from 'expo-file-system/legacy';
import { useAuthStore } from '../store/useAuthStore';

let BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is not defined in .env');
}

export const reportsApi = {
  downloadOrderPdf: async (orderId: string): Promise<string> => {
    const { accessToken } = useAuthStore.getState();
    const url = `${BASE_URL}/reports/orders/${orderId}/pdf`;
    
    const fileUri = `${FileSystem.documentDirectory}TastyBites-Bill-${orderId}.pdf`;
    
    const { uri, status } = await FileSystem.downloadAsync(url, fileUri, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (status !== 200) {
      throw new Error('Unable to download report.');
    }
    return uri;
  },

  downloadSalesPdf: async (dateFrom: string, dateTo: string): Promise<string> => {
    const { accessToken } = useAuthStore.getState();
    const url = `${BASE_URL}/reports/sales/pdf?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    
    const filename = dateFrom === dateTo ? `TastyBites-Sales-${dateFrom}.pdf` : `TastyBites-Sales-${dateFrom}-to-${dateTo}.pdf`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    const { uri, status } = await FileSystem.downloadAsync(url, fileUri, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (status !== 200) {
      throw new Error('Unable to generate report.');
    }
    return uri;
  },

  downloadSalesCsv: async (dateFrom: string, dateTo: string): Promise<string> => {
    const { accessToken } = useAuthStore.getState();
    const url = `${BASE_URL}/reports/sales/csv?dateFrom=${dateFrom}&dateTo=${dateTo}`;
    
    const filename = dateFrom === dateTo ? `TastyBites-Sales-${dateFrom}.csv` : `TastyBites-Sales-${dateFrom}-to-${dateTo}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    const { uri, status } = await FileSystem.downloadAsync(url, fileUri, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (status !== 200) {
      throw new Error('Unable to generate report.');
    }
    return uri;
  },
};
