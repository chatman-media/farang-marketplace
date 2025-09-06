import { Location } from './common';

export enum UserRole {
  USER = 'user',
  AGENCY = 'agency',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple',
  TIKTOK = 'tiktok',
  TELEGRAM = 'telegram',
  LINE = 'line',
  WHATSAPP = 'whatsapp',
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export interface SocialProfile {
  provider: AuthProvider;
  providerId: string;
  email?: string;
  name?: string;
  avatar?: string;
  username?: string;
  connectedAt: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  location?: Location;
  rating: number;
  reviewsCount: number;
  verificationStatus: VerificationStatus;
  socialProfiles: SocialProfile[];
  primaryAuthProvider: AuthProvider;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  telegramId?: string;
  role: UserRole;
  profile: UserProfile;
  socialProfiles: SocialProfile[];
  primaryAuthProvider: AuthProvider;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  telegramId?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface OAuthLoginRequest {
  provider: AuthProvider;
  code?: string;
  state?: string;
  redirectUri?: string;
  // Для Telegram Login Widget
  telegramData?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
  };
}

export interface LinkSocialAccountRequest {
  provider: AuthProvider;
  code?: string;
  state?: string;
  telegramData?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
  };
}

export interface UnlinkSocialAccountRequest {
  provider: AuthProvider;
}

export interface SocialAccountsResponse {
  socialProfiles: SocialProfile[];
  primaryProvider: AuthProvider;
}

export interface OAuthCallbackRequest {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}
