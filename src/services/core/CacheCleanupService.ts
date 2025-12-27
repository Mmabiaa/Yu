import { CacheManager, CacheStats } from '../../types/cache';

export interface CleanupStrategy {
  name: string;
  shouldCleanup(stats: CacheStats): boolean;
  cleanup(cacheManager: CacheManager): Promise<CleanupResult>;
}

export interface CleanupResult {
  entriesRemoved: number;
  sizeFreed: number;
  duration: number;
  strategy: string;
}

export class CacheCleanupService {
  private cacheManager: CacheManager;
  private strategies: CleanupStrategy[] = [];
  private isRunning = false;

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
    this.initializeStrategies();
  }

  async performCleanup(): Promise<CleanupResult[]> {
    if (this.isRunning) {
      return [];
    }

    this.isRunning = true;
    const results: CleanupResult[] = [];

    try {
      const stats = await this.cacheManager.getStats();

      for (const strategy of this.strategies) {
        if (strategy.shouldCleanup(stats)) {
          const result = await strategy.cleanup(this.cacheManager);
          results.push(result);
        }
      }
    } finally {
      this.isRunning = false;
    }

    return results;
  }

  addStrategy(strategy: CleanupStrategy): void {
    this.strategies.push(strategy);
  }

  removeStrategy(name: string): void {
    this.strategies = this.strategies.filter(s => s.name !== name);
  }

  private initializeStrategies(): void {
    // Memory pressure cleanup
    this.strategies.push(new MemoryPressureStrategy());
    
    // TTL cleanup
    this.strategies.push(new TTLCleanupStrategy());
    
    // Size limit cleanup
    this.strategies.push(new SizeLimitStrategy());
    
    // Low hit rate cleanup
    this.strategies.push(new LowHitRateStrategy());
  }
}

class MemoryPressureStrategy implements CleanupStrategy {
  name = 'memory-pressure';

  shouldCleanup(stats: CacheStats): boolean {
    // Cleanup if memory usage is above 80% of limit
    const memoryThreshold = 0.8;
    // This would need to be enhanced with actual memory limits from config
    return stats.memoryUsage > 40 * 1024 * 1024; // 40MB threshold for now
  }

  async cleanup(cacheManager: CacheManager): Promise<CleanupResult> {
    const startTime = Date.now();
    const initialStats = await cacheManager.getStats();
    
    // Evict 25% of LRU entries
    const entriesToEvict = Math.floor(initialStats.totalEntries * 0.25);
    await cacheManager.evictLRU(entriesToEvict);
    
    const finalStats = await cacheManager.getStats();
    
    return {
      entriesRemoved: initialStats.totalEntries - finalStats.totalEntries,
      sizeFreed: initialStats.memoryUsage - finalStats.memoryUsage,
      duration: Date.now() - startTime,
      strategy: this.name,
    };
  }
}

class TTLCleanupStrategy implements CleanupStrategy {
  name = 'ttl-cleanup';

  shouldCleanup(stats: CacheStats): boolean {
    // Always run TTL cleanup
    return true;
  }

  async cleanup(cacheManager: CacheManager): Promise<CleanupResult> {
    const startTime = Date.now();
    const initialStats = await cacheManager.getStats();
    
    // The cache manager's cleanup method handles TTL expiration
    await cacheManager.cleanup();
    
    const finalStats = await cacheManager.getStats();
    
    return {
      entriesRemoved: initialStats.totalEntries - finalStats.totalEntries,
      sizeFreed: (initialStats.memoryUsage + initialStats.persistentUsage) - 
                 (finalStats.memoryUsage + finalStats.persistentUsage),
      duration: Date.now() - startTime,
      strategy: this.name,
    };
  }
}

class SizeLimitStrategy implements CleanupStrategy {
  name = 'size-limit';

  shouldCleanup(stats: CacheStats): boolean {
    // Cleanup if total size exceeds reasonable limits
    const totalSize = stats.memoryUsage + stats.persistentUsage;
    return totalSize > 200 * 1024 * 1024; // 200MB total limit
  }

  async cleanup(cacheManager: CacheManager): Promise<CleanupResult> {
    const startTime = Date.now();
    const initialStats = await cacheManager.getStats();
    
    // Evict entries until we're under the limit
    const targetSize = 150 * 1024 * 1024; // 150MB target
    const currentSize = initialStats.memoryUsage + initialStats.persistentUsage;
    
    if (currentSize > targetSize) {
      const entriesToEvict = Math.ceil(initialStats.totalEntries * 0.3); // Evict 30%
      await cacheManager.evictLRU(entriesToEvict);
    }
    
    const finalStats = await cacheManager.getStats();
    
    return {
      entriesRemoved: initialStats.totalEntries - finalStats.totalEntries,
      sizeFreed: (initialStats.memoryUsage + initialStats.persistentUsage) - 
                 (finalStats.memoryUsage + finalStats.persistentUsage),
      duration: Date.now() - startTime,
      strategy: this.name,
    };
  }
}

class LowHitRateStrategy implements CleanupStrategy {
  name = 'low-hit-rate';

  shouldCleanup(stats: CacheStats): boolean {
    // Cleanup if hit rate is below 50%
    return stats.hitRate < 0.5 && stats.totalEntries > 100;
  }

  async cleanup(cacheManager: CacheManager): Promise<CleanupResult> {
    const startTime = Date.now();
    const initialStats = await cacheManager.getStats();
    
    // Evict 20% of entries to improve hit rate
    const entriesToEvict = Math.floor(initialStats.totalEntries * 0.2);
    await cacheManager.evictLRU(entriesToEvict);
    
    const finalStats = await cacheManager.getStats();
    
    return {
      entriesRemoved: initialStats.totalEntries - finalStats.totalEntries,
      sizeFreed: (initialStats.memoryUsage + initialStats.persistentUsage) - 
                 (finalStats.memoryUsage + finalStats.persistentUsage),
      duration: Date.now() - startTime,
      strategy: this.name,
    };
  }
}

// Utility functions for cache management
export class CacheUtils {
  static formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  static formatHitRate(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
  }

  static generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  static parseCacheKey(key: string): { prefix: string; parts: string[] } {
    const [prefix, ...parts] = key.split(':');
    return { prefix, parts };
  }

  static isExpired(timestamp: Date, ttl: number): boolean {
    const now = new Date();
    const expiryTime = new Date(timestamp.getTime() + ttl * 1000);
    return now > expiryTime;
  }

  static calculateTTL(dataType: string, priority: 'low' | 'normal' | 'high' = 'normal'): number {
    const baseTTL = {
      user: 7 * 24 * 3600, // 7 days
      chat: 30 * 24 * 3600, // 30 days
      translation: 14 * 24 * 3600, // 14 days
      voice: 30 * 24 * 3600, // 30 days
      vision: 14 * 24 * 3600, // 14 days
      api: 300, // 5 minutes
      temp: 60, // 1 minute
      session: 8 * 3600, // 8 hours
    };

    const multiplier = {
      low: 0.5,
      normal: 1.0,
      high: 2.0,
    };

    const base = baseTTL[dataType as keyof typeof baseTTL] || baseTTL.api;
    return Math.floor(base * multiplier[priority]);
  }
}