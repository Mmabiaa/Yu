import { TokenManager, TokenManagerConfig } from './TokenManager';
import { getCurrentConfig } from '../../config/environment';

/**
 * Factory function to create TokenManager with proper configuration
 */
export const createTokenManager = (): TokenManager => {
  const appConfig = getCurrentConfig();
  
  const config: TokenManagerConfig = {
    keychainService: 'yu-assistant-tokens',
    fallbackToAsyncStorage: true,
    tokenRefreshThreshold: appConfig.authConfig.tokenRefreshThreshold,
  };

  return new TokenManager(config);
};

/**
 * Singleton instance for app-wide use
 */
let tokenManagerInstance: TokenManager | null = null;

/**
 * Get singleton TokenManager instance
 */
export const getTokenManager = (): TokenManager => {
  if (!tokenManagerInstance) {
    tokenManagerInstance = createTokenManager();
  }
  return tokenManagerInstance;
};

/**
 * Reset singleton instance (useful for testing)
 */
export const resetTokenManager = (): void => {
  tokenManagerInstance = null;
};