export interface RoleRecord {
  id: string;
  name: string;
  description: string | null;
  level: number;
  isActive: boolean;
}

export interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleRecord;
  employeeId: string | null;
  stationIds: string[] | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  user: UserRecord;
  expiresAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  employeeId?: string | null;
  stationIds?: string[];
  password?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  employeeId?: string | null;
  stationIds?: string[];
  isActive?: boolean;
}
