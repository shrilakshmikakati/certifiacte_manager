import axios from 'axios';
import toast from 'react-hot-toast';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken = localStorage.getItem('token');

// Set auth token
export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Initialize with existing token
if (authToken) {
  setAuthToken(authToken);
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };

    // Add auth token if available
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  (error) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          if (authToken) {
            setAuthToken(null);
            toast.error('Session expired. Please log in again.');
            // Redirect to login page
            window.location.href = '/login';
          }
          break;
        
        case 403:
          // Forbidden - insufficient permissions
          toast.error('You do not have permission to perform this action.');
          break;
        
        case 404:
          // Not found
          toast.error('Requested resource not found.');
          break;
        
        case 422:
          // Validation error
          if (data?.errors) {
            const errorMessages = Object.values(data.errors).flat();
            errorMessages.forEach(msg => toast.error(msg));
          } else if (data?.message) {
            toast.error(data.message);
          }
          break;
        
        case 429:
          // Rate limiting
          toast.error('Too many requests. Please try again later.');
          break;
        
        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;
        
        default:
          // Generic error
          const errorMessage = data?.message || `Request failed with status ${status}`;
          toast.error(errorMessage);
      }
      
      // Return formatted error
      return Promise.reject({
        status,
        message: data?.message || 'Request failed',
        errors: data?.errors || null,
        response: error.response,
      });
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
      return Promise.reject({
        status: 0,
        message: 'Network error',
        errors: null,
        response: null,
      });
    } else {
      // Request setup error
      toast.error('Request configuration error.');
      return Promise.reject({
        status: 0,
        message: 'Request setup error',
        errors: null,
        response: null,
      });
    }
  }
);

// API helper functions
export const apiRequest = {
  // GET request
  get: async (url, params = {}) => {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // POST request
  post: async (url, data = {}) => {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PUT request
  put: async (url, data = {}) => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // PATCH request
  patch: async (url, data = {}) => {
    try {
      const response = await api.patch(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // DELETE request
  delete: async (url) => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload file
  upload: async (url, formData, onUploadProgress = null) => {
    try {
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Download file
  download: async (url, filename = null) => {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
      });
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// API endpoints
export const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    profile: '/auth/profile',
    updateProfile: '/auth/profile',
    changePassword: '/auth/change-password',
    refreshToken: '/auth/refresh',
  },
  
  // Certificates
  certificates: {
    list: '/certificates',
    create: '/certificates',
    getById: (id) => `/certificates/${id}`,
    update: (id) => `/certificates/${id}`,
    delete: (id) => `/certificates/${id}`,
    verify: (id) => `/certificates/${id}/verify`,
    issue: (id) => `/certificates/${id}/issue`,
    revoke: (id) => `/certificates/${id}/revoke`,
    download: (id) => `/certificates/${id}/download`,
    search: '/certificates/search',
  },
  
  // File uploads
  upload: {
    csv: '/upload/csv',
    document: '/upload/document',
    bulk: '/upload/bulk',
  },
  
  // Verification
  verification: {
    verify: '/verify',
    verifyById: (id) => `/verify/${id}`,
    history: '/verify/history',
  },
  
  // Blockchain
  blockchain: {
    anchor: '/blockchain/anchor',
    verify: '/blockchain/verify',
    transaction: (hash) => `/blockchain/transaction/${hash}`,
    status: '/blockchain/status',
  },
  
  // Analytics
  analytics: {
    dashboard: '/analytics/dashboard',
    certificates: '/analytics/certificates',
    verification: '/analytics/verification',
    users: '/analytics/users',
  },
  
  // Settings
  settings: {
    get: '/settings',
    update: '/settings',
    reset: '/settings/reset',
  },
};

// Export the axios instance for direct use if needed
export { api };

export default api;