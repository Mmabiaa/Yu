import { AuthService, AuthServiceConfig } from './AuthService';
import { ApiClient } from '../core/ApiClient';
import { TokenManager } from '../core/TokenManager';
import { getCurrentConfig } from '../../config/environment';

export class AuthServiceFactory {
  private static instance: AuthService | null = null;

  /**
   * Create or get singleton AuthService instance
   */
  public static getInstance(
    apiClient?: ApiClient,
    tokenManager?: TokenManager,
    config?: AuthServiceConfig
  ): AuthService {
    if (!AuthServiceFactory.instance) {
      if (!apiClient || !tokenManager) {
        throw new Error('ApiClient and TokenManager are required for first initialization');
      }

      const appConfig = getCurrentConfig();
      const authConfig: AuthServiceConfig = config || {
        enableBiometric: appConfig.features.enableBiometricAuth,
        sessionTimeout: appConfig.authConfig.sessionTimeout,
        maxLoginAttempts: 5, // Default max login attempts
      };

      AuthServiceFactory.instance = new AuthService(apiClient, tokenManager, authConfig);
    }

    return AuthServiceFactory.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static reset(): void {
    AuthServiceFactory.instance = null;
  }

  /**
   * Create new AuthService instance (not singleton)
   */
  public static create(
    apiClient: ApiClient,
    tokenManager: TokenManager,
    config?: AuthServiceConfig
  ): AuthService {
    const appConfig = getCurrentConfig();
    const authConfig: AuthServiceConfig = config || {
      enableBiometric: appConfig.features.enableBiometricAuth,
      sessionTimeout: appConfig.authConfig.sessionTimeout,
      maxLoginAttempts: 5,
    };

    return new AuthService(apiClient, tokenManager, authConfig);
  }
}