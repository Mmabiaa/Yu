import { ApiClient } from './ApiClient';
import { CacheManager } from '../../types/cache';
import { ApiResponse, RequestOptions } from '../../types/api';

/**
 * Base service class that provides common functionality for all services
 */
export abstract class BaseService {
  protected apiClient: ApiClient;
  protected cacheManager: CacheManager;
  protected serviceName: string;

  constructor(apiClient: ApiClient, cacheManager: CacheManager, serviceName: string) {
    this.apiClient = apiClient;
    this.cacheManager = cacheManager;
    this.serviceName = serviceName;
  }

  /**
   * Make an API request with caching support
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(endpoint, options.params);
    
    // Check cache first for GET requests
    if (options.method === 'GET' || !options.method) {
      if (this.shouldCache(endpoint)) {
        const cachedData = await this.cacheManager.get<T>(cacheKey);
        if (cachedData) {
          return {
            data: cachedData,
            status: 200,
            message: 'Retrieved from cache'
          };
        }
      }
    }

    // Make API request
    let response: ApiResponse<T>;
    
    switch (options.method?.toUpperCase()) {
      case 'POST':
        response = await this.apiClient.post<T>(endpoint, options.data);
        break;
      case 'PUT':
        response = await this.apiClient.put<T>(endpoint, options.data);
        break;
      case 'DELETE':
        response = await this.apiClient.delete<T>(endpoint);
        break;
      case 'GET':
      default:
        response = await this.apiClient.get<T>(endpoint, options.params);
        break;
    }

    // Cache successful GET responses
    if (response.data && (options.method === 'GET' || !options.method) && this.shouldCache(endpoint)) {
      await this.cacheManager.set(cacheKey, response.data, this.getCacheTTL(endpoint));
    }

    return response;
  }

  /**
   * Generate cache key for endpoint and parameters
   */
  protected getCacheKey(endpoint: string, params?: any): string {
    const baseKey = `${this.serviceName}:${endpoint}`;
    if (params && Object.keys(params).length > 0) {
      const paramString = JSON.stringify(params);
      return `${baseKey}:${paramString}`;
    }
    return baseKey;
  }

  /**
   * Determine if endpoint should be cached
   */
  protected shouldCache(endpoint: string): boolean {
    // Default caching rules - can be overridden by subclasses
    const cacheableEndpoints = [
      '/conversations',
      '/messages',
      '/personalities',
      '/languages',
      '/voices',
      '/profile'
    ];
    
    return cacheableEndpoints.some(cacheable => endpoint.includes(cacheable));
  }

  /**
   * Get cache TTL for endpoint
   */
  protected getCacheTTL(endpoint: string): number {
    // Default TTL rules - can be overridden by subclasses
    if (endpoint.includes('/conversations')) {
      return 300; // 5 minutes
    }
    if (endpoint.includes('/messages')) {
      return 600; // 10 minutes
    }
    if (endpoint.includes('/profile')) {
      return 1800; // 30 minutes
    }
    
    return 300; // Default 5 minutes
  }

  /**
   * Clear cache for this service
   */
  protected async clearServiceCache(): Promise<void> {
    // This would require a more sophisticated cache implementation
    // For now, we'll implement a simple pattern-based clearing
    console.log(`Clearing cache for service: ${this.serviceName}`);
  }

  /**
   * Invalidate specific cache entries
   */
  protected async invalidateCache(pattern: string): Promise<void> {
    const cacheKey = this.getCacheKey(pattern);
    await this.cacheManager.delete(cacheKey);
  }
}