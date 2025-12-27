import { CacheManagerImpl } from '../CacheManager';
import { CacheManagerFactory } from '../CacheManagerFactory';
import { CacheConfig, CachePolicy } from '../../../types/cache';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the mocked AsyncStorage
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('CacheManager', () => {
  let cacheManager: CacheManagerImpl;
  let config: CacheConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset AsyncStorage mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
    mockAsyncStorage.multiRemove.mockResolvedValue(undefined);
    mockAsyncStorage.getAllKeys.mockResolvedValue([]);

    config = CacheManagerFactory.getMinimalConfig();
    cacheManager = new CacheManagerImpl(config);
  });

  afterEach(() => {
    cacheManager.destroy();
  });

  describe('Basic Operations', () => {
    it('should set and get values from memory cache', async () => {
      const key = 'test:key';
      const value = { data: 'test value' };

      await cacheManager.set(key, value);
      const result = await cacheManager.get(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheManager.get('non:existent');
      expect(result).toBeNull();
    });

    it('should delete values', async () => {
      const key = 'test:delete';
      const value = { data: 'to be deleted' };

      await cacheManager.set(key, value);
      expect(await cacheManager.get(key)).toEqual(value);

      await cacheManager.delete(key);
      expect(await cacheManager.get(key)).toBeNull();
    });

    it('should check if key exists', async () => {
      const key = 'test:exists';
      const value = { data: 'exists' };

      expect(await cacheManager.has(key)).toBe(false);

      await cacheManager.set(key, value);
      expect(await cacheManager.has(key)).toBe(true);

      await cacheManager.delete(key);
      expect(await cacheManager.has(key)).toBe(false);
    });

    it('should clear all cache', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.set('key2', 'value2');

      expect(await cacheManager.has('key1')).toBe(true);
      expect(await cacheManager.has('key2')).toBe(true);

      await cacheManager.clear();

      expect(await cacheManager.has('key1')).toBe(false);
      expect(await cacheManager.has('key2')).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    it('should get multiple values', async () => {
      const entries = {
        'key1': 'value1',
        'key2': 'value2',
        'key3': 'value3',
      };

      await cacheManager.setMultiple(entries);
      const result = await cacheManager.getMultiple(['key1', 'key2', 'key4']);

      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
        key4: null,
      });
    });

    it('should set multiple values', async () => {
      const entries = {
        'batch1': { data: 'batch value 1' },
        'batch2': { data: 'batch value 2' },
      };

      await cacheManager.setMultiple(entries);

      expect(await cacheManager.get('batch1')).toEqual(entries.batch1);
      expect(await cacheManager.get('batch2')).toEqual(entries.batch2);
    });

    it('should delete multiple values', async () => {
      await cacheManager.set('del1', 'value1');
      await cacheManager.set('del2', 'value2');
      await cacheManager.set('keep', 'keep this');

      await cacheManager.deleteMultiple(['del1', 'del2']);

      expect(await cacheManager.has('del1')).toBe(false);
      expect(await cacheManager.has('del2')).toBe(false);
      expect(await cacheManager.has('keep')).toBe(true);
    });
  });

  describe('Cache Policies', () => {
    it('should apply different policies based on key patterns', () => {
      const userPolicy = cacheManager.getCachePolicy('user:123');
      const apiPolicy = cacheManager.getCachePolicy('api:response');
      const defaultPolicy = cacheManager.getCachePolicy('unknown:key');

      expect(userPolicy.persistent).toBe(true);
      expect(apiPolicy.persistent).toBe(false);
      expect(defaultPolicy).toEqual(config.defaultPolicy);
    });

    it('should set custom cache policies', () => {
      const customPolicy: CachePolicy = {
        ttl: 1800,
        maxSize: 1024,
        maxEntries: 100,
        strategy: 'TTL',
        persistent: true,
        compression: false,
      };

      cacheManager.setCachePolicy('custom:*', customPolicy);
      const appliedPolicy = cacheManager.getCachePolicy('custom:test');

      expect(appliedPolicy).toEqual(customPolicy);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      const key = 'ttl:test';
      const value = 'expires soon';
      const shortTtl = 0.1; // 100ms

      await cacheManager.set(key, value, shortTtl);
      expect(await cacheManager.get(key)).toEqual(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(await cacheManager.get(key)).toBeNull();
    });

    it('should not expire entries without TTL', async () => {
      const key = 'no:ttl';
      const value = 'never expires';

      await cacheManager.set(key, value, 0); // 0 TTL means no expiration
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(await cacheManager.get(key)).toEqual(value);
    });
  });

  describe('Statistics', () => {
    it('should provide cache statistics', async () => {
      await cacheManager.set('stats1', 'value1');
      await cacheManager.set('stats2', 'value2');

      const stats = await cacheManager.getStats();

      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(typeof stats.hitRate).toBe('number');
      expect(typeof stats.missRate).toBe('number');
    });
  });

  describe('Pattern Invalidation', () => {
    it('should invalidate entries matching pattern', async () => {
      await cacheManager.set('user:1', 'user1');
      await cacheManager.set('user:2', 'user2');
      await cacheManager.set('api:response', 'api data');

      await cacheManager.invalidatePattern('user:*');

      expect(await cacheManager.has('user:1')).toBe(false);
      expect(await cacheManager.has('user:2')).toBe(false);
      expect(await cacheManager.has('api:response')).toBe(true);
    });
  });
});

describe('CacheManagerFactory', () => {
  afterEach(() => {
    CacheManagerFactory.resetInstance();
  });

  it('should create singleton instance', () => {
    const instance1 = CacheManagerFactory.getInstance();
    const instance2 = CacheManagerFactory.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should create new instance with custom config', () => {
    const config = CacheManagerFactory.getMinimalConfig();
    const instance = CacheManagerFactory.createInstance(config);

    expect(instance).toBeInstanceOf(CacheManagerImpl);
  });

  it('should provide predefined configurations', () => {
    const minimalConfig = CacheManagerFactory.getMinimalConfig();
    const performanceConfig = CacheManagerFactory.getPerformanceConfig();

    expect(minimalConfig.memoryLimit).toBeLessThan(performanceConfig.memoryLimit);
    expect(minimalConfig.persistentLimit).toBeLessThan(performanceConfig.persistentLimit);
  });
});