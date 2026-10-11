import { apiClient } from './client';
import { MenuItem } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { File } from 'expo-file-system';

export const menuApi = {
  getMenu: async (params?: { available?: boolean; category?: string; search?: string }): Promise<MenuItem[]> => {
    let query = '';
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.available !== undefined) searchParams.append('available', params.available.toString());
      if (params.category) searchParams.append('category', params.category);
      if (params.search) searchParams.append('search', params.search);
      query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    }
    const items = await apiClient<MenuItem[]>(`/menu${query}`);
    return (items || []).map(item => ({
      ...item,
      id: item.id || item._id || '',
      _id: item._id || item.id,
    }));
  },
  
  getMenuItem: async (id: string): Promise<MenuItem> => {
    const item = await apiClient<MenuItem>(`/menu/${id}`);
    return {
      ...item,
      id: item.id || item._id || '',
      _id: item._id || item.id,
    };
  },
  
  createMenuItem: async (data: any, imageUri?: string) => {
    if (!imageUri || !imageUri.startsWith('file://')) {
      return apiClient('/menu', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }

    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key].toString());
    });

    const file = new File(imageUri);
    formData.append('image', file as any);

    return apiClient('/menu', {
      method: 'POST',
      body: formData,
    });
  },
  
  updateMenuItem: async (id: string, data: any, imageUri?: string, removeImage?: boolean) => {
    if ((!imageUri || !imageUri.startsWith('file://')) && !removeImage) {
      return apiClient(`/menu/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    }

    const formData = new FormData();
    Object.keys(data).forEach(key => {
      formData.append(key, data[key].toString());
    });
    
    if (removeImage) {
      formData.append('removeImage', 'true');
    }

    if (imageUri && imageUri.startsWith('file://')) {
      const file = new File(imageUri);
      formData.append('image', file as any);
    }

    return apiClient(`/menu/${id}`, {
      method: 'PATCH',
      body: formData,
    });
  },
  
  updateAvailability: (id: string, isAvailable: boolean) => apiClient(`/menu/${id}/availability`, {
    method: 'PATCH',
  }),
  
  toggleAvailability: (id: string) => apiClient(`/menu/${id}/availability`, {
    method: 'PATCH',
  }),
  
  removeMenuImage: (id: string) => apiClient(`/menu/${id}/image`, {
    method: 'DELETE',
  }),

  deleteMenuItem: (id: string) => apiClient(`/menu/${id}`, {
    method: 'DELETE',
  }),
};
