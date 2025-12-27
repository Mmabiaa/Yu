// Environment Configuration Management

export interface AppConfig {
  apiBaseUrl: string;
  wsBaseUrl: string;
  authConfig: AuthConfig;
  cacheConfig: CacheConfig;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  features: FeatureFlags;
  timeout: number;
  retryAttempts: number;
}

export interface AuthConfig {
  tokenRefreshThreshold: number; // minutes before expiry to refresh
  biometricEnabled: boolean;
  sessionTimeout: number; // minutes
}

export interface CacheConfig {
  maxSize: number; // MB
  defaultTTL: number; // seconds
  enablePersistent: boolean;
}

export interface FeatureFlags {
  enableVoiceStreaming: boolean;
  enableOfflineMode: boolean;
  enableBiometricAuth: boolean;
  enableAnalytics: boolean;
  enableWebSocket: boolean;
  enableCaching: boolean;
}

// Environment-specific configurations
const developmentConfig: AppConfig = {
  apiBaseUrl: 'http://localhost:8000',
  wsBaseUrl: 'ws://localhost:8000',
  authConfig: {
    tokenRefreshThreshold: 5,
    biometricEnabled: true,
    sessionTimeout: 60,
  },
  cacheConfig: {
    maxSize: 50,
    defaultTTL: 300,
    enablePersistent: true,
  },
  logLevel: 'debug',
  features: {
    enableVoiceStreaming: true,
    enableOfflineMode: true,
    enableBiometricAuth: true,
    enableAnalytics: false,
    enableWebSocket: true,
    enableCaching: true,
  },
  timeout: 10000,
  retryAttempts: 3,
};

const stagingConfig: AppConfig = {
  apiBaseUrl: 'https://staging-api.yu-assistant.com',
  wsBaseUrl: 'wss://staging-api.yu-assistant.com',
  authConfig: {
    tokenRefreshThreshold: 5,
    biometricEnabled: true,
    sessionTimeout: 30,
  },
  cacheConfig: {
    maxSize: 100,
    defaultTTL: 600,
    enablePersistent: true,
  },
  logLevel: 'info',
  features: {
    enableVoiceStreaming: true,
    enableOfflineMode: true,
    enableBiometricAuth: true,
    enableAnalytics: true,
    enableWebSocket: true,
    enableCaching: true,
  },
  timeout: 15000,
  retryAttempts: 3,
};

const productionConfig: AppConfig = {
  apiBaseUrl: 'https://api.yu-assistant.com',
  wsBaseUrl: 'wss://api.yu-assistant.com',
  authConfig: {
    tokenRefreshThreshold: 5,
    biometricEnabled: true,
    sessionTimeout: 30,
  },
  cacheConfig: {
    maxSize: 100,
    defaultTTL: 900,
    enablePersistent: true,
  },
  logLevel: 'error',
  features: {
    enableVoiceStreaming: true,
    enableOfflineMode: true,
    enableBiometricAuth: true,
    enableAnalytics: true,
    enableWebSocket: true,
    enableCaching: true,
  },
  timeout: 20000,
  retryAttempts: 2,
};

// Get environment from process or default to development
const getEnvironment = (): 'development' | 'staging' | 'production' => {
  // In React Native, you might use a different method to determine environment
  // This is a simplified approach
  if (__DEV__) {
    return 'development';
  }
  
  // You can set this through build configurations or environment variables
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return 'production';
  } else if (env === 'staging') {
    return 'staging';
  }
  
  return 'development';
};

const configs = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig,
};

export const getCurrentConfig = (): AppConfig => {
  const environment = getEnvironment();
  return configs[environment];
};