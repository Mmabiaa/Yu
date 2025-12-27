import { 
  LoginRequest, 
  LoginResponse, 
  SignupRequest, 
  SignupResponse, 
  OTPRequest, 
  OTPResponse, 
  PasswordResetRequest, 
  PasswordResetResponse,
  SocialAuthRequest,
  User,
  AuthTokens,
  AuthError
} from '../../types/auth';
import { ApiResponse } from '../../types/api';
import { ApiClient } from '../core/ApiClient';
import { TokenManager } from '../core/TokenManager';

export interface AuthServiceConfig {
  enableBiometric: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

export class AuthService {
  private apiClient: ApiClient;
  private tokenManager: TokenManager;
  private config: AuthServiceConfig;
  private loginAttempts: Map<string, number> = new Map();

  constructor(apiClient: ApiClient, tokenManager: TokenManager, config: AuthServiceConfig) {
    this.apiClient = apiClient;
    this.tokenManager = tokenManager;
    this.config = config;
  }

  /**
   * Authenticate user with email and password
   */
  public async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // Check login attempts
      const attempts = this.loginAttempts.get(request.email) || 0;
      if (attempts >= this.config.maxLoginAttempts) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      const response = await this.apiClient.post<LoginResponse>('/auth/login', request);

      if (!response.data) {
        throw new Error('Invalid login response');
      }

      // Store tokens securely
      await this.tokenManager.setTokens(response.data.tokens);

      // Clear login attempts on successful login
      this.loginAttempts.delete(request.email);

      return response.data;
    } catch (error: any) {
      // Increment login attempts on failure
      const attempts = this.loginAttempts.get(request.email) || 0;
      this.loginAttempts.set(request.email, attempts + 1);

      // Handle specific auth errors
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 423) {
        throw new Error('Account is locked. Please contact support.');
      } else if (error.response?.status === 403) {
        throw new Error('Account requires verification. Please check your email.');
      }

      throw new Error(error.message || 'Login failed. Please try again.');
    }
  }

  /**
   * Register new user account
   */
  public async signup(request: SignupRequest): Promise<SignupResponse> {
    try {
      // Validate signup request
      this.validateSignupRequest(request);

      const response = await this.apiClient.post<SignupResponse>('/auth/signup', request);

      if (!response.data) {
        throw new Error('Invalid signup response');
      }

      // Store tokens if provided (some flows might require verification first)
      if (response.data.tokens) {
        await this.tokenManager.setTokens(response.data.tokens);
      }

      return response.data;
    } catch (error: any) {
      // Handle specific signup errors
      if (error.response?.status === 409) {
        throw new Error('An account with this email already exists');
      } else if (error.response?.status === 400) {
        const details = error.response.data?.details;
        if (details?.field === 'email') {
          throw new Error('Please enter a valid email address');
        } else if (details?.field === 'password') {
          throw new Error('Password does not meet requirements');
        } else if (details?.field === 'username') {
          throw new Error('Username is already taken');
        }
      }

      throw new Error(error.message || 'Signup failed. Please try again.');
    }
  }

  /**
   * Verify OTP code
   */
  public async verifyOTP(request: OTPRequest): Promise<OTPResponse> {
    try {
      const response = await this.apiClient.post<OTPResponse>('/auth/verify-otp', request);

      if (!response.data) {
        throw new Error('Invalid OTP verification response');
      }

      // Store tokens if provided (for account verification)
      if (response.data.tokens) {
        await this.tokenManager.setTokens(response.data.tokens);
      }

      return response.data;
    } catch (error: any) {
      // Handle specific OTP errors
      if (error.response?.status === 400) {
        throw new Error('Invalid or expired OTP code');
      } else if (error.response?.status === 429) {
        throw new Error('Too many OTP attempts. Please request a new code.');
      }

      throw new Error(error.message || 'OTP verification failed. Please try again.');
    }
  }

  /**
   * Request password reset
   */
  public async requestPasswordReset(request: PasswordResetRequest): Promise<PasswordResetResponse> {
    try {
      const response = await this.apiClient.post<PasswordResetResponse>('/auth/password-reset', request);

      if (!response.data) {
        throw new Error('Invalid password reset response');
      }

      return response.data;
    } catch (error: any) {
      // Handle specific password reset errors
      if (error.response?.status === 404) {
        throw new Error('No account found with this email address');
      } else if (error.response?.status === 429) {
        throw new Error('Too many password reset requests. Please try again later.');
      }

      throw new Error(error.message || 'Password reset request failed. Please try again.');
    }
  }

  /**
   * Reset password with OTP
   */
  public async resetPassword(email: string, otp: string, newPassword: string): Promise<OTPResponse> {
    try {
      const request = {
        email,
        code: otp,
        type: 'password_reset' as const,
        newPassword,
      };

      const response = await this.apiClient.post<OTPResponse>('/auth/reset-password', request);

      if (!response.data) {
        throw new Error('Invalid password reset response');
      }

      // Store tokens if provided
      if (response.data.tokens) {
        await this.tokenManager.setTokens(response.data.tokens);
      }

      return response.data;
    } catch (error: any) {
      // Handle specific password reset errors
      if (error.response?.status === 400) {
        throw new Error('Invalid or expired reset code');
      } else if (error.response?.status === 422) {
        throw new Error('New password does not meet requirements');
      }

      throw new Error(error.message || 'Password reset failed. Please try again.');
    }
  }

  /**
   * Authenticate with social providers (Google/Apple)
   */
  public async socialAuth(request: SocialAuthRequest): Promise<LoginResponse> {
    try {
      const response = await this.apiClient.post<LoginResponse>('/auth/social', request);

      if (!response.data) {
        throw new Error('Invalid social authentication response');
      }

      // Store tokens securely
      await this.tokenManager.setTokens(response.data.tokens);

      return response.data;
    } catch (error: any) {
      // Handle specific social auth errors
      if (error.response?.status === 401) {
        throw new Error('Social authentication failed. Please try again.');
      } else if (error.response?.status === 409) {
        throw new Error('An account with this email already exists. Please use regular login.');
      }

      throw new Error(error.message || 'Social authentication failed. Please try again.');
    }
  }

  /**
   * Logout user and clear tokens
   */
  public async logout(): Promise<void> {
    try {
      // Notify backend about logout (optional, for session tracking)
      try {
        await this.apiClient.post('/auth/logout');
      } catch (error) {
        // Ignore logout API errors, still clear local tokens
        console.warn('Logout API call failed:', error);
      }

      // Clear stored tokens
      await this.tokenManager.clearTokens();

      // Clear login attempts
      this.loginAttempts.clear();
    } catch (error) {
      console.error('Logout failed:', error);
      throw new Error('Logout failed. Please try again.');
    }
  }

  /**
   * Get current user profile
   */
  public async getCurrentUser(): Promise<User | null> {
    try {
      // Check if we have valid tokens
      const hasTokens = await this.tokenManager.hasValidTokens();
      if (!hasTokens) {
        return null;
      }

      const response = await this.apiClient.get<User>('/auth/me');

      if (!response.data) {
        return null;
      }

      return response.data;
    } catch (error: any) {
      // Handle authentication errors
      if (error.response?.status === 401) {
        // Token is invalid, clear it
        await this.tokenManager.clearTokens();
        return null;
      }

      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    try {
      const hasTokens = await this.tokenManager.hasValidTokens();
      if (!hasTokens) {
        return false;
      }

      // Verify token with backend
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Refresh authentication tokens
   */
  public async refreshTokens(): Promise<AuthTokens | null> {
    try {
      const newAccessToken = await this.tokenManager.refreshAccessToken();
      
      // Get updated token info
      const refreshToken = await this.tokenManager.getRefreshToken();
      const tokenType = await this.tokenManager.getTokenType();

      if (!newAccessToken || !refreshToken) {
        return null;
      }

      // Return updated tokens (expiry is handled by TokenManager)
      return {
        accessToken: newAccessToken,
        refreshToken,
        tokenType,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Default 1 hour
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Request new OTP code
   */
  public async requestOTP(email: string, type: 'verification' | 'password_reset'): Promise<void> {
    try {
      await this.apiClient.post('/auth/request-otp', { email, type });
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Too many OTP requests. Please wait before requesting again.');
      } else if (error.response?.status === 404) {
        throw new Error('No account found with this email address.');
      }

      throw new Error(error.message || 'Failed to send OTP. Please try again.');
    }
  }

  /**
   * Update user password (when authenticated)
   */
  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await this.apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Current password is incorrect');
      } else if (error.response?.status === 422) {
        throw new Error('New password does not meet requirements');
      }

      throw new Error(error.message || 'Password change failed. Please try again.');
    }
  }

  /**
   * Validate signup request
   */
  private validateSignupRequest(request: SignupRequest): void {
    if (!request.email || !this.isValidEmail(request.email)) {
      throw new Error('Please enter a valid email address');
    }

    if (!request.password || request.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!request.username || request.username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    if (!request.fullName || request.fullName.trim().length < 2) {
      throw new Error('Please enter your full name');
    }

    if (!request.acceptTerms) {
      throw new Error('You must accept the terms and conditions');
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get login attempts for an email
   */
  public getLoginAttempts(email: string): number {
    return this.loginAttempts.get(email) || 0;
  }

  /**
   * Clear login attempts for an email
   */
  public clearLoginAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }

  /**
   * Check if account is locked due to too many attempts
   */
  public isAccountLocked(email: string): boolean {
    return this.getLoginAttempts(email) >= this.config.maxLoginAttempts;
  }
}