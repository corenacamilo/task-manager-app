export interface User {
  id: string;
  name: string;
  email: string;
  role: 'commercial' | 'admin';
  isActive: boolean;
  profilePicture?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  assignedTo: User;
  createdBy: User;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  category: string;
  personalContacto?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  outlookEventId?: string;
  outlookMeetingUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  accessToken: string;
}

export interface TaskStats {
  totalTasks: number;
  pendingTasks: number;
  scheduledTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  todaysTasks: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  commercialUsers: number;
  adminUsers: number;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number;
  assignedTo?: string;
  category?: string;
  personalContacto?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
}
