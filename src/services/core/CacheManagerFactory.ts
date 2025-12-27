import { CacheManager, CacheConfig, CachePolicy } from '../../types/cache';
import { CacheManagerImpl } from './CacheManager';

export class CacheManagerFactory {
  private static instance: CacheManager | null = null;

  static getInstance(config?: CacheConfig): CacheManager {
    if (!CacheManagerFactory.instance) {
      const defaultConfig = CacheManagerFactory.getDefaultConfig();
      CacheManagerFactory.instance = new CacheManagerImpl(config || defaultConfig);
    }
    return CacheManagerFactory.instance;
  }

  static createInstance(config: CacheConfig): CacheManager {
    return new CacheManagerImpl(config);
  }

  static resetInstance(): void {
    if (CacheManagerFactory.instance) {
      (CacheManagerFactory.instance as CacheManagerImpl).destroy();
      CacheManagerFactory.instance = null;
    }
  }

  private static getDefaultConfig(): CacheConfig {
    const defaultPolicy: CachePolicy = {
      ttl: 3600, // 1 hour
      maxSize: 10 * 1024 * 1024, // 10MB
      maxEntries: 1000,
      strategy: 'LRU',
      persistent: false,
      compression: false,
    };

    const persistentPolicy: CachePolicy = {
      ttl: 24 * 3600, // 24 hours
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 5000,
      strategy: 'LRU',
      persistent: true,
      compression: true,
    };

    const shortTermPolicy: CachePolicy = {
      ttl: 300, // 5 minutes
      maxSize: 5 * 1024 * 1024, // 5MB
      maxEntries: 500,
      strategy: 'TTL',
      persistent: false,
      compression: false,
    };

    return {
      defaultPolicy,
      policies: {
        // API responses - short term memory cache
        'api:*': shortTermPolicy,
        
        // User data - persistent cache
        'user:*': persistentPolicy,
        'profile:*': persistentPolicy,
        'settings:*': persistentPolicy,
        
        // Chat conversations - persistent cache
        'chat:conversations:*': persistentPolicy,
        'chat:messages:*': persistentPolicy,
        
        // Translation history - persistent cache
        'translation:*': persistentPolicy,
        
        // Voice settings - persistent cache
        'voice:*': persistentPolicy,
        
        // Vision analysis results - persistent cache with longer TTL
        'vision:*': {
          ...persistentPolicy,
          ttl: 7 * 24 * 3600, // 7 days
        },
        
        // Temporary data - memory only
        'temp:*': {
          ...defaultPolicy,
          ttl: 60, // 1 minute
          persistent: false,
        },
        
        // Images - persistent with large size limit
        'image:*': {
          ttl: 7 * 24 * 3600, // 7 days
          maxSize: 100 * 1024 * 1024, // 100MB
          maxEntries: 1000,
          strategy: 'LRU',
          persistent: true,
          compression: true,
        },
      },
      memoryLimit: 50 * 1024 * 1024, // 50MB total memory limit
      persistentLimit: 200 * 1024 * 1024, // 200MB total persistent limit
      cleanupInterval: 300, // 5 minutes
    };
  }

  // Predefined configurations for different use cases
  static getMinimalConfig(): CacheConfig {
    const minimalPolicy: CachePolicy = {
      ttl: 1800, // 30 minutes
      maxSize: 5 * 1024 * 1024, // 5MB
      maxEntries: 100,
      strategy: 'LRU',
      persistent: false,
      compression: false,
    };

    return {
      defaultPolicy: minimalPolicy,
      policies: {
        'user:*': { ...minimalPolicy, persistent: true },
      },
      memoryLimit: 10 * 1024 * 1024, // 10MB
      persistentLimit: 20 * 1024 * 1024, // 20MB
      cleanupInterval: 600, // 10 minutes
    };
  }

  static getPerformanceConfig(): CacheConfig {
    const performancePolicy: CachePolicy = {
      ttl: 7200, // 2 hours
      maxSize: 20 * 1024 * 1024, // 20MB
      maxEntries: 2000,
      strategy: 'LRU',
      persistent: true,
      compression: true,
    };

    return {
      defaultPolicy: performancePolicy,
      policies: {
        'api:*': {
          ttl: 600, // 10 minutes
          maxSize: 10 * 1024 * 1024, // 10MB
          maxEntries: 1000,
          strategy: 'LRU',
          persistent: false,
          compression: false,
        },
        'user:*': performancePolicy,
        'chat:*': performancePolicy,
        'translation:*': performancePolicy,
        'voice:*': performancePolicy,
        'vision:*': {
          ...performancePolicy,
          ttl: 14 * 24 * 3600, // 14 days
          maxSize: 200 * 1024 * 1024, // 200MB
        },
      },
      memoryLimit: 100 * 1024 * 1024, // 100MB
      persistentLimit: 500 * 1024 * 1024, // 500MB
      cleanupInterval: 180, // 3 minutes
    };
  }
}