// Authentication Types and Models

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  isActive: boolean;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
  profileImage?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  chatNotifications: boolean;
  systemUpdates: boolean;
}

export interface PrivacySettings {
  dataCollection: boolean;
  analytics: boolean;
  crashReporting: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  isFirstLogin: boolean;
}

export interface SignupRequest {
  email: string;
  password: string;
  username: string;
  fullName: string;
  acceptTerms: boolean;
}

export interface SignupResponse {
  user: User;
  tokens: AuthTokens;
  requiresVerification: boolean;
}

export interface OTPRequest {
  email: string;
  code: string;
  type: 'verification' | 'password_reset';
}

export interface OTPResponse {
  success: boolean;
  message: string;
  tokens?: AuthTokens;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresAt: Date;
}

export interface BiometricAuthRequest {
  userId: string;
  biometricData: string;
}

export interface SocialAuthRequest {
  provider: 'google' | 'apple';
  token: string;
  email?: string;
}

export interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'USER_NOT_FOUND' | 'EMAIL_EXISTS' | 'INVALID_TOKEN' | 'TOKEN_EXPIRED' | 'ACCOUNT_LOCKED' | 'VERIFICATION_REQUIRED';
  message: string;
  details?: any;
}