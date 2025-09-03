import { Location } from './common'

export enum UserRole {
  USER = 'user',
  AGENCY = 'agency',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export interface UserProfile {
  firstName: string
  lastName: string
  avatar?: string
  location?: Location
  rating: number
  reviewsCount: number
  verificationStatus: VerificationStatus
}

export interface User {
  id: string
  email: string
  phone?: string
  telegramId?: string
  role: UserRole
  profile: UserProfile
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  telegramId?: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RefreshRequest {
  refreshToken: string
}
