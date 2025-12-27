import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistentCache, CacheEntry, CachePolicy } from '../../types/cache';

interface StoredCacheEntry {
  value: any;
  timestamp: string;
  ttl?: number;
  size: number;
  accessCount: number;
  lastAccessed: string;
}

export class PersistentCacheImpl implements PersistentCache {
  private policy: CachePolicy;
  private keyPrefix: string;
  private metadataKey: string;

  constructor(policy: CachePolicy, keyPrefix = 'cache_') {
    this.policy = policy;
    this.keyPrefix = keyPrefix;
    this.metadataKey = `${keyPrefix}metadata`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const storageKey = this.getStorageKey(key);
      const stored = await AsyncStorage.getItem(storageKey);
      
      if (!stored) {
        return null;
      }

      const entry: StoredCacheEntry = JSON.parse(stored);
      
      // Check TTL
      if (this.isExpired(entry)) {
        await this.delete(key);
        return null;
      }

      // Update access info
      entry.accessCount++;
      entry.lastAccessed = new Date().toISOString();
      await AsyncStorage.setItem(storageKey, JSON.stringify(entry));

      return entry.value;
    } catch (error) {
      console.error('PersistentCache.get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const storageKey = this.getStorageKey(key);
      const now = new Date();
      const size = this.calculateSize(value);

      // Check if we need to cleanup before adding
      await this.ensureCapacity(size);

      const entry: StoredCacheEntry = {
        value,
        timestamp: now.toISOString(),
        ttl: ttl || this.policy.ttl,
        size,
        accessCount: 1,
        lastAccessed: now.toISOString(),
      };

      await AsyncStorage.setItem(storageKey, JSON.stringify(entry));
      await this.updateMetadata(key, entry);
    } catch (error) {
      console.error('PersistentCache.set error:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(key);
      await AsyncStorage.removeItem(storageKey);
      await this.removeFromMetadata(key);
    } catch (error) {
      console.error('PersistentCache.delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.getAllCacheKeys();
      await AsyncStorage.multiRemove(keys);
      await AsyncStorage.removeItem(this.metadataKey);
    } catch (error) {
      console.error('PersistentCache.clear error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const storageKey = this.getStorageKey(key);
      const stored = await AsyncStorage.getItem(storageKey);
      
      if (!stored) {
        return false;
      }

      const entry: StoredCacheEntry = JSON.parse(stored);
      
      if (this.isExpired(entry)) {
        await this.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      console.error('PersistentCache.has error:', error);
      return false;
    }
  }

  async getSize(): Promise<number> {
    try {
      const metadata = await this.getMetadata();
      return Object.values(metadata).reduce((total, entry) => total + entry.size, 0);
    } catch (error) {
      console.error('PersistentCache.getSize error:', error);
      return 0;
    }
  }

  async getEntryCount(): Promise<number> {
    try {
      const metadata = await this.getMetadata();
      return Object.keys(metadata).length;
    } catch (error) {
      console.error('PersistentCache.getEntryCount error:', error);
      return 0;
    }
  }

  async cleanup(): Promise<void> {
    try {
      const metadata = await this.getMetadata();
      const keysToDelete: string[] = [];

      for (const [key, entry] of Object.entries(metadata)) {
        if (this.isExpired(entry)) {
          keysToDelete.push(key);
        }
      }

      // Also check for size limits and evict LRU if needed
      const totalSize = Object.values(metadata).reduce((sum, entry) => sum + entry.size, 0);
      if (totalSize > this.policy.maxSize) {
        const sortedEntries = Object.entries(metadata)
          .filter(([key]) => !keysToDelete.includes(key))
          .sort(([, a], [, b]) => new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime());

        let currentSize = totalSize;
        for (const [key, entry] of sortedEntries) {
          if (currentSize <= this.policy.maxSize * 0.8) break; // Leave some headroom
          keysToDelete.push(key);
          currentSize -= entry.size;
        }
      }

      // Delete expired and LRU entries
      for (const key of keysToDelete) {
        await this.delete(key);
      }
    } catch (error) {
      console.error('PersistentCache.cleanup error:', error);
    }
  }

  private getStorageKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  private async getAllCacheKeys(): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys.filter(key => key.startsWith(this.keyPrefix));
    } catch (error) {
      console.error('PersistentCache.getAllCacheKeys error:', error);
      return [];
    }
  }

  private async getMetadata(): Promise<Record<string, StoredCacheEntry>> {
    try {
      const stored = await AsyncStorage.getItem(this.metadataKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('PersistentCache.getMetadata error:', error);
      return {};
    }
  }

  private async updateMetadata(key: string, entry: StoredCacheEntry): Promise<void> {
    try {
      const metadata = await this.getMetadata();
      metadata[key] = entry;
      await AsyncStorage.setItem(this.metadataKey, JSON.stringify(metadata));
    } catch (error) {
      console.error('PersistentCache.updateMetadata error:', error);
    }
  }

  private async removeFromMetadata(key: string): Promise<void> {
    try {
      const metadata = await this.getMetadata();
      delete metadata[key];
      await AsyncStorage.setItem(this.metadataKey, JSON.stringify(metadata));
    } catch (error) {
      console.error('PersistentCache.removeFromMetadata error:', error);
    }
  }

  private async ensureCapacity(newEntrySize: number): Promise<void> {
    const currentSize = await this.getSize();
    const currentCount = await this.getEntryCount();

    if (
      currentSize + newEntrySize > this.policy.maxSize ||
      currentCount >= this.policy.maxEntries
    ) {
      await this.cleanup();
    }
  }

  private isExpired(entry: StoredCacheEntry): boolean {
    if (!entry.ttl) {
      return false;
    }
    const now = new Date();
    const expiryTime = new Date(new Date(entry.timestamp).getTime() + entry.ttl * 1000);
    return now > expiryTime;
  }

  private calculateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1000; // Default size for non-serializable objects
    }
  }
}