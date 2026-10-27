export type UserRole = 'investigator' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status?: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
  iat: number;
  exp: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserPublic;
  token: string;
}
