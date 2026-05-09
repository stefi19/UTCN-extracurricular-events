export type UserRole = 'STUDENT' | 'ORGANIZER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId: number | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  department: string;
  organizerId: number | null;
  categoryId: number | null;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  maxParticipants: number | null;
}

export interface Registration {
  id: number;
  studentId: number;
  eventId: number;
  status: string;
  registeredAt: string;
  cancelledAt: string | null;
}

export interface Category {
  id: number;
  name: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface ApiError {
  error: string;
  status: number;
}
