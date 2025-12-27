import { CacheManager, CachePolicy, CacheConfig, CacheStats, MemoryCache, PersistentCache } from '../../types/cache';
import { MemoryCacheImpl } from './MemoryCache';
import { PersistentCacheImpl } from './PersistentCache';

export class CacheManagerImpl implements CacheManager {
  private memoryCache: MemoryCache;
  private persistentCache: PersistentCache;
  private config: CacheConfig;
  private policies: Map<string, CachePolicy> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    lastCleanup: new Date(),
  };

  constructor(config: CacheConfig) {
    this.config = config;
    this.memoryCache = new MemoryCacheImpl(config.defaultPolicy);
    this.persistentCache = new PersistentCacheImpl(config.defaultPolicy);
    
    // Set up cache policies
    Object.entries(config.policies).forEach(([pattern, policy]) => {
      this.setCachePolicy(pattern, policy);
    });

    // Start cleanup interval
    this.startCleanupInterval();
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryResult = this.memoryCache.get<T>(key);
    if (memoryResult !== null) {
      this.stats.hits++;
      return memoryResult;
    }

    // Try persistent cache
    const persistentResult = await this.persistentCache.get<T>(key);
    if (persistentResult !== null) {
      this.stats.hits++;
      
      // Promote to memory cache if policy allows
      const policy = this.getCachePolicy(key);
      if (!policy.persistent || this.shouldPromoteToMemory(key)) {
        this.memoryCache.set(key, persistentResult, policy.ttl);
      }
      
      return persistentResult;
    }

    this.stats.misses++;
    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const policy = this.getCachePolicy(key);
    const effectiveTtl = ttl || policy.ttl;

    // Always set in memory cache for fast access
    this.memoryCache.set(key, value, effectiveTtl);

    // Set in persistent cache if policy requires it
    if (policy.persistent) {
      await this.persistentCache.set(key, value, effectiveTtl);
    }
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.persistentCache.delete(key);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.persistentCache.clear();
  }

  async has(key: string): Promise<boolean> {
    const inMemory = this.memoryCache.has(key);
    if (inMemory) {
      return true;
    }

    return await this.persistentCache.has(key);
  }

  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    const result: Record<string, T | null> = {};
    
    // Try to get all from memory first
    const memoryMisses: string[] = [];
    for (const key of keys) {
      const value = this.memoryCache.get<T>(key);
      if (value !== null) {
        result[key] = value;
        this.stats.hits++;
      } else {
        memoryMisses.push(key);
      }
    }

    // Get missing keys from persistent cache
    if (memoryMisses.length > 0) {
      for (const key of memoryMisses) {
        const value = await this.persistentCache.get<T>(key);
        result[key] = value;
        
        if (value !== null) {
          this.stats.hits++;
          // Promote to memory if appropriate
          const policy = this.getCachePolicy(key);
          if (!policy.persistent || this.shouldPromoteToMemory(key)) {
            this.memoryCache.set(key, value, policy.ttl);
          }
        } else {
          this.stats.misses++;
        }
      }
    }

    return result;
  }

  async setMultiple<T>(entries: Record<string, T>, ttl?: number): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [key, value] of Object.entries(entries)) {
      promises.push(this.set(key, value, ttl));
    }

    await Promise.all(promises);
  }

  async deleteMultiple(keys: string[]): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const key of keys) {
      promises.push(this.delete(key));
    }

    await Promise.all(promises);
  }

  setCachePolicy(pattern: string, policy: CachePolicy): void {
    this.policies.set(pattern, policy);
  }

  getCachePolicy(key: string): CachePolicy {
    // Find matching policy pattern
    for (const [pattern, policy] of this.policies.entries()) {
      if (this.matchesPattern(key, pattern)) {
        return policy;
      }
    }
    
    return this.config.defaultPolicy;
  }

  async getStats(): Promise<CacheStats> {
    const memorySize = this.memoryCache.getSize();
    const persistentSize = await this.persistentCache.getSize();
    const memoryEntries = this.memoryCache.getEntryCount();
    const persistentEntries = await this.persistentCache.getEntryCount();
    
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;

    return {
      totalEntries: memoryEntries + persistentEntries,
      memoryUsage: memorySize,
      persistentUsage: persistentSize,
      hitRate,
      missRate,
      evictions: this.stats.evictions,
      lastCleanup: this.stats.lastCleanup,
    };
  }

  async cleanup(): Promise<void> {
    this.memoryCache.cleanup();
    await this.persistentCache.cleanup();
    this.stats.lastCleanup = new Date();
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Get all keys and filter by pattern
    const memoryEntries = this.memoryCache.getAllEntries();
    const keysToDelete: string[] = [];

    for (const entry of memoryEntries) {
      if (this.matchesPattern(entry.key, pattern)) {
        keysToDelete.push(entry.key);
      }
    }

    // Delete matching keys
    await this.deleteMultiple(keysToDelete);
  }

  async getSize(): Promise<number> {
    const memorySize = this.memoryCache.getSize();
    const persistentSize = await this.persistentCache.getSize();
    return memorySize + persistentSize;
  }

  async getEntryCount(): Promise<number> {
    const memoryCount = this.memoryCache.getEntryCount();
    const persistentCount = await this.persistentCache.getEntryCount();
    return memoryCount + persistentCount;
  }

  async evictLRU(count = 1): Promise<void> {
    this.memoryCache.evictLRU(count);
    this.stats.evictions += count;
  }

  // Cleanup and shutdown
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private shouldPromoteToMemory(key: string): boolean {
    // Simple heuristic: promote frequently accessed items
    // This could be enhanced with more sophisticated logic
    return true;
  }

  private matchesPattern(key: string, pattern: string): boolean {
    // Simple pattern matching - could be enhanced with regex or glob patterns
    if (pattern === '*') {
      return true;
    }
    
    if (pattern.endsWith('*')) {
      return key.startsWith(pattern.slice(0, -1));
    }
    
    if (pattern.startsWith('*')) {
      return key.endsWith(pattern.slice(1));
    }
    
    return key === pattern;
  }

  private startCleanupInterval(): void {
    if (this.config.cleanupInterval > 0) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup().catch(error => {
          console.error('Cache cleanup error:', error);
        });
      }, this.config.cleanupInterval * 1000);
    }
  }
}