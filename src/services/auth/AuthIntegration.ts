import { ServiceManager } from '../ServiceManager';
import { ApiError } from '../../types/api';

/**
 * Authentication integration helper
 * Provides utilities for integrating authentication with navigation and app state
 */
export class AuthIntegration {
  private serviceManager: ServiceManager;
  private navigationCallback?: (route: string) => void;

  constructor() {
    this.serviceManager = ServiceManager.getInstance();
    this.setupAuthErrorHandling();
  }

  /**
   * Set navigation callback for authentication errors
   */
  public setNavigationCallback(callback: (route: string) => void): void {
    this.navigationCallback = callback;
  }

  /**
   * Setup authentication error handling
   */
  private setupAuthErrorHandling(): void {
    this.serviceManager.setAuthErrorCallback((error: ApiError) => {
      this.handleAuthError(error);
    });
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: ApiError): void {
    console.log('Handling authentication error:', error);

    // Navigate to login screen based on error type
    if (error.code === 'AUTHENTICATION_FAILED' || error.statusCode === 401) {
      this.navigateToLogin();
    } else if (error.code === 'ACCESS_FORBIDDEN' || error.statusCode === 403) {
      this.handleAccessForbidden(error);
    }
  }

  /**
   * Navigate to login screen
   */
  private navigateToLogin(): void {
    console.log('Navigating to login due to authentication error');
    
    if (this.navigationCallback) {
      this.navigationCallback('Login');
    } else {
      console.warn('No navigation callback set for authentication errors');
    }
  }

  /**
   * Handle access forbidden errors
   */
  private handleAccessForbidden(error: ApiError): void {
    console.warn('Access forbidden:', error.message);
    
    // Could show a modal or navigate to a specific screen
    // For now, just log the error
  }

  /**
   * Check authentication status and navigate if needed
   */
  public async checkAuthenticationStatus(): Promise<boolean> {
    try {
      const isAuthenticated = await this.serviceManager.isAuthenticated();
      
      if (!isAuthenticated) {
        this.navigateToLogin();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      this.navigateToLogin();
      return false;
    }
  }

  /**
   * Logout user and navigate to login
   */
  public async logout(): Promise<void> {
    try {
      await this.serviceManager.logout();
      this.navigateToLogin();
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to login even if logout fails
      this.navigateToLogin();
    }
  }

  /**
   * Get service manager instance
   */
  public getServiceManager(): ServiceManager {
    return this.serviceManager;
  }
}

// Export singleton instance
let authIntegrationInstance: AuthIntegration | null = null;

export const getAuthIntegration = (): AuthIntegration => {
  if (!authIntegrationInstance) {
    authIntegrationInstance = new AuthIntegration();
  }
  return authIntegrationInstance;
};

export const resetAuthIntegration = (): void => {
  authIntegrationInstance = null;
};