import axios from 'axios';
import { AuthResponse, Task, User, TaskStats, UserStats, CreateTaskRequest } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  getLoginUrl: () => api.get('/auth/login'),
  callback: (code: string) => api.post<AuthResponse>('/auth/callback', { code }),
  getProfile: () => api.get<User>('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  getUsers: (params?: any) => api.get('/users', { params }),
  getUserById: (id: string) => api.get(`/users/${id}`),
  updateUserRole: (id: string, data: { role: string }) => api.put(`/users/${id}/role`, data),
  updateUserStatus: (id: string, data: { isActive: boolean }) => api.put(`/users/${id}/status`, data),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getUserStats: () => api.get('/users/stats')
};

// Tasks API
export const tasksAPI = {
  getTasks: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    assignedTo?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => api.get<{
    tasks: Task[];
    totalPages: number;
    currentPage: number;
    total: number;
  }>('/tasks', { params }),
  
  getTaskById: (id: string) => api.get<Task>(`/tasks/${id}`),
  
  createTask: (data: CreateTaskRequest) => api.post<{ message: string; task: Task }>('/tasks', data),
  
  updateTask: (id: string, data: Partial<Task>) => 
    api.patch<{ message: string; task: Task }>(`/tasks/${id}`, data),
  
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
  
  scheduleInOutlook: (id: string, accessToken: string) => 
    api.post(`/tasks/${id}/schedule`, { accessToken }),
  
  exportToExcel: (params?: {
    startDate?: string;
    endDate?: string;
    assignedTo?: string;
    status?: string;
  }) => api.get('/tasks/export/excel', { 
    params,
    responseType: 'blob'
  }),
  
  getTaskStats: () => api.get<TaskStats>('/tasks/stats/overview'),
};

export default api;
