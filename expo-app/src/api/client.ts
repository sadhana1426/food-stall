import { useAuthStore } from '../store/useAuthStore';
import * as SecureStore from 'expo-secure-store';

const PRODUCTION_API_URL = 'https://food-stall-152b.onrender.com/api/v1';
let BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || PRODUCTION_API_URL;

export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.code = code;
  }
}

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const apiClient = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${BASE_URL}${endpoint}`;
  
  const { accessToken } = useAuthStore.getState();
  
  const headers = new Headers(options.headers || {});
  
  if (!options.body || typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    let response = await fetch(url, { ...options, headers });
    
    // Refresh token logic
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          headers.set('Authorization', `Bearer ${token}`);
          return fetch(url, { ...options, headers }).then(res => handleResponse(res));
        }).catch(err => {
          throw err;
        });
      }

      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          const refreshJson = await refreshRes.json();

          if (refreshRes.ok && refreshJson.success) {
            const newTokens = refreshJson.data;
            await SecureStore.setItemAsync('accessToken', newTokens.accessToken);
            await SecureStore.setItemAsync('refreshToken', newTokens.refreshToken);
            useAuthStore.getState().setSession(newTokens.accessToken);
            
            headers.set('Authorization', `Bearer ${newTokens.accessToken}`);
            processQueue(null, newTokens.accessToken);
            
            // Retry original request
            response = await fetch(url, { ...options, headers });
          } else {
            useAuthStore.getState().clearSession();
            processQueue(new ApiError('Session expired', 'UNAUTHORIZED'));
            throw new ApiError('Session expired. Please login again.', 'UNAUTHORIZED');
          }
        } catch (e) {
          useAuthStore.getState().clearSession();
          processQueue(e);
          throw e;
        } finally {
          isRefreshing = false;
        }
      } else {
        useAuthStore.getState().clearSession();
        throw new ApiError('Session expired. Please login again.', 'UNAUTHORIZED');
      }
    }

    return handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Unable to connect to server. Check your connection and retry.', 'NETWORK_ERROR');
  }
};

const handleResponse = async <T = any>(response: Response): Promise<T> => {
  let json: any = {};
  try {
    json = await response.json();
  } catch (e) {}

  if (!response.ok) {
    const errorMessage = json?.error?.message || 'An error occurred while connecting to the server.';
    throw new ApiError(errorMessage, json?.error?.code);
  }

  return json.data as T;
};
