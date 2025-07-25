import { config } from '@/config';
import Cookies from 'js-cookie';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

// Maximum retry attempts
const MAX_RETRIES = 2;

// Function to create an AbortController with timeout
const createAbortController = (timeoutMs = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  return {
    controller,
    timeoutId,
    cleanup: () => clearTimeout(timeoutId)
  };
};

// Helper function to build headers
const buildHeaders = (token: string | null, existingHeaders?: HeadersInit): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge existing headers
  if (existingHeaders) {
    if (existingHeaders instanceof Headers) {
      existingHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(existingHeaders)) {
      existingHeaders.forEach(([key, value]) => {
        if (value !== undefined) {
          headers[key] = value;
        }
      });
    } else {
      Object.entries(existingHeaders).forEach(([key, value]) => {
        if (value !== undefined) {
          headers[key] = value;
        }
      });
    }
  }

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Authentication state (to prevent multiple simultaneous refreshes)
let refreshInProgress: Promise<string> | null = null;

// Function to refresh the access token
export const refreshToken = async (): Promise<string> => {
  // If a refresh is already in progress, return that promise
  if (refreshInProgress) {
    return refreshInProgress;
  }
  
  const refreshTokenStr = Cookies.get('refreshToken');
  
  if (!refreshTokenStr) {
    Cookies.remove('accessToken');
    Cookies.remove('userData');
    throw new Error('No refresh token found');
  }
  
  const { controller, timeoutId, cleanup } = createAbortController();
  
  // Create a fresh promise for this refresh attempt
  refreshInProgress = (async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshTokenStr}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'include',
        signal: controller.signal
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update access token in cookies
      Cookies.set('accessToken', data.access_token, { expires: 7 });
      
      return data.access_token;
    } catch (error: unknown) {
      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Auth request timed out after ${REQUEST_TIMEOUT}ms`);
      }
      
      // Clear tokens on auth failure
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('userData');
      Cookies.remove('loginTime');
      
      throw error;
    } finally {
      cleanup();
      refreshInProgress = null;
    }
  })();
  
  return refreshInProgress;
};

// Generic fetch function with token refresh logic, retries, and timeouts
export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}, retries = 0, responseType: 'json' | 'blob' = 'json'): Promise<any> => {
  const token = Cookies.get('accessToken') || null;
  const { controller, timeoutId, cleanup } = createAbortController();
  
  try {
    // Check if we're sending FormData (for file uploads)
    const isFormData = options.body instanceof FormData;
    
    // Don't set Content-Type for FormData requests, let the browser set it with the boundary
    const headers = isFormData 
      ? { 'Authorization': token ? `Bearer ${token}` : '' } 
      : buildHeaders(token, options.headers);
    
    // Try the request with current token
    let response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: headers,
      mode: 'cors',
      credentials: 'include',
      signal: controller.signal
    });
    
    // If unauthorized, try to refresh token and retry
    if (response.status === 401) {
      try {
        // Try to get a new token
        const newToken = await refreshToken();
        
        // Update headers with new token
        const refreshedHeaders = isFormData
          ? { 'Authorization': `Bearer ${newToken}` }
          : buildHeaders(newToken, options.headers);
        
        // Retry the request with new token
        response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
          ...options,
          headers: refreshedHeaders,
          mode: 'cors',
          credentials: 'include',
          signal: controller.signal
        });
      } catch (error: unknown) {
        console.error('Token refresh failed:', error);
        // Clear all tokens and user data
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('userData');
        Cookies.remove('loginTime');
        
        // Redirect to login
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    }
    
    // Handle retriable errors (5xx server errors, network errors)
    if (!response.ok && response.status >= 500 && retries < MAX_RETRIES) {
      // Wait with exponential backoff before retrying
      const backoffTime = Math.min(1000 * (2 ** retries), 10000);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      return fetchWithAuth(endpoint, options, retries + 1, responseType);
    }
    
    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    // Return the appropriate response based on responseType
    if (responseType === 'blob') {
      return response.blob();
    } else {
      return response.json();
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT}ms`);
    }
    throw error;
  } finally {
    cleanup();
  }
};

// GET request helper
export const get = (endpoint: string) => {
  return fetchWithAuth(endpoint);
};

// POST request helper
export const post = (endpoint: string, data: any) => {
  return fetchWithAuth(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// PUT request helper
export const put = (endpoint: string, data: any) => {
  return fetchWithAuth(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// DELETE request helper
export const del = (endpoint: string) => {
  return fetchWithAuth(endpoint, {
    method: 'DELETE',
  });
};

// Original login function (kept for compatibility)
export async function login(email: string, password: string) {
  const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    mode: 'cors',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to login');
  }

  return response.json();
} 