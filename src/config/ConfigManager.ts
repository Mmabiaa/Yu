// Configuration Manager for runtime configuration access

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppConfig, FeatureFlags, getCurrentConfig } from './environment';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  private featureFlags: FeatureFlags;
  private readonly FEATURE_FLAGS_KEY = '@yu_app_feature_flags';

  private constructor() {
    this.config = getCurrentConfig();
    this.featureFlags = { ...this.config.features };
    this.loadPersistedFeatureFlags();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Get the current application configuration
   */
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Get API base URL
   */
  public getApiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  /**
   * Get WebSocket base URL
   */
  public getWebSocketUrl(): string {
    return this.config.wsBaseUrl;
  }

  /**
   * Get request timeout
   */
  public getTimeout(): number {
    return this.config.timeout;
  }

  /**
   * Get retry attempts
   */
  public getRetryAttempts(): number {
    return this.config.retryAttempts;
  }

  /**
   * Get log level
   */
  public getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
    return this.config.logLevel;
  }

  /**
   * Check if a feature is enabled
   */
  public isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.featureFlags[feature] || false;
  }

  /**
   * Get all feature flags
   */
  public getFeatureFlags(): FeatureFlags {
    return { ...this.featureFlags };
  }

  /**
   * Enable a feature flag
   */
  public async enableFeature(feature: keyof FeatureFlags): Promise<void> {
    this.featureFlags[feature] = true;
    await this.persistFeatureFlags();
  }

  /**
   * Disable a feature flag
   */
  public async disableFeature(feature: keyof FeatureFlags): Promise<void> {
    this.featureFlags[feature] = false;
    await this.persistFeatureFlags();
  }

  /**
   * Update multiple feature flags
   */
  public async updateFeatureFlags(flags: Partial<FeatureFlags>): Promise<void> {
    this.featureFlags = { ...this.featureFlags, ...flags };
    await this.persistFeatureFlags();
  }

  /**
   * Reset feature flags to default configuration
   */
  public async resetFeatureFlags(): Promise<void> {
    this.featureFlags = { ...this.config.features };
    await this.persistFeatureFlags();
  }

  /**
   * Get authentication configuration
   */
  public getAuthConfig() {
    return { ...this.config.authConfig };
  }

  /**
   * Get cache configuration
   */
  public getCacheConfig() {
    return { ...this.config.cacheConfig };
  }

  /**
   * Load persisted feature flags from storage
   */
  private async loadPersistedFeatureFlags(): Promise<void> {
    try {
      const persistedFlags = await AsyncStorage.getItem(this.FEATURE_FLAGS_KEY);
      if (persistedFlags) {
        const flags = JSON.parse(persistedFlags) as FeatureFlags;
        this.featureFlags = { ...this.featureFlags, ...flags };
      }
    } catch (error) {
      console.warn('Failed to load persisted feature flags:', error);
    }
  }

  /**
   * Persist feature flags to storage
   */
  private async persistFeatureFlags(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.FEATURE_FLAGS_KEY,
        JSON.stringify(this.featureFlags)
      );
    } catch (error) {
      console.warn('Failed to persist feature flags:', error);
    }
  }

  /**
   * Check if development mode is enabled
   */
  public isDevelopment(): boolean {
    return __DEV__;
  }

  /**
   * Check if caching is enabled
   */
  public isCachingEnabled(): boolean {
    return this.isFeatureEnabled('enableCaching');
  }

  /**
   * Check if offline mode is enabled
   */
  public isOfflineModeEnabled(): boolean {
    return this.isFeatureEnabled('enableOfflineMode');
  }

  /**
   * Check if WebSocket is enabled
   */
  public isWebSocketEnabled(): boolean {
    return this.isFeatureEnabled('enableWebSocket');
  }

  /**
   * Check if analytics is enabled
   */
  public isAnalyticsEnabled(): boolean {
    return this.isFeatureEnabled('enableAnalytics');
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();