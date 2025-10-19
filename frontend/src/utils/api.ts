import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('authToken');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData: { username: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', userData),
  
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (userData: { username?: string; email?: string }) =>
    api.put('/auth/profile', userData),
  
  verifyToken: () => api.get('/auth/verify'),
};

// Topics API
export const topicsAPI = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    difficulty?: string;
    search?: string;
  }) => api.get('/topics', { params }),
  
  getById: (id: string) => api.get(`/topics/${id}`),
  
  create: (topicData: {
    name: string;
    description?: string;
    category: string;
    difficulty?: string;
    tags?: string[];
  }) => api.post('/topics', topicData),
  
  update: (id: string, topicData: any) => api.put(`/topics/${id}`, topicData),
  
  getCategories: () => api.get('/topics/meta/categories'),
  
  getPopular: () => api.get('/topics/meta/popular'),
};

// Sessions API
export const sessionsAPI = {
  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/sessions/history', { params }),
  
  getById: (id: string) => api.get(`/sessions/${id}`),
  
  endSession: (id: string) => api.patch(`/sessions/${id}/end`),
  
  submitFeedback: (id: string, feedback: { rating: number; comment?: string }) =>
    api.post(`/sessions/${id}/feedback`, feedback),
  
  getStats: () => api.get('/sessions/stats/overview'),
};

// Matching API
export const matchingAPI = {
  join: (data: { topicId: string; socketId?: string }) =>
    api.post('/matching/join', data),
  
  leave: (data?: { topicId?: string }) => api.post('/matching/leave', data),
  
  getStatus: () => api.get('/matching/status'),
  
  getTopicStats: (topicId: string) => api.get(`/matching/stats/${topicId}`),
  
  cancel: (data?: { sessionId?: string }) => api.post('/matching/cancel', data),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;