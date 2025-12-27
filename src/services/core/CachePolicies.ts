import { CachePolicy } from '../../types/cache';

export class CachePolicies {
  // Base policies
  static readonly MEMORY_ONLY: CachePolicy = {
    ttl: 1800, // 30 minutes
    maxSize: 5 * 1024 * 1024, // 5MB
    maxEntries: 500,
    strategy: 'LRU',
    persistent: false,
    compression: false,
  };

  static readonly PERSISTENT_SHORT: CachePolicy = {
    ttl: 3600, // 1 hour
    maxSize: 10 * 1024 * 1024, // 10MB
    maxEntries: 1000,
    strategy: 'LRU',
    persistent: true,
    compression: true,
  };

  static readonly PERSISTENT_LONG: CachePolicy = {
    ttl: 24 * 3600, // 24 hours
    maxSize: 50 * 1024 * 1024, // 50MB
    maxEntries: 5000,
    strategy: 'LRU',
    persistent: true,
    compression: true,
  };

  static readonly PERSISTENT_EXTENDED: CachePolicy = {
    ttl: 7 * 24 * 3600, // 7 days
    maxSize: 100 * 1024 * 1024, // 100MB
    maxEntries: 10000,
    strategy: 'LRU',
    persistent: true,
    compression: true,
  };

  // Data type specific policies
  static readonly USER_DATA: CachePolicy = {
    ...CachePolicies.PERSISTENT_LONG,
    ttl: 7 * 24 * 3600, // 7 days - user data changes infrequently
  };

  static readonly CHAT_CONVERSATIONS: CachePolicy = {
    ...CachePolicies.PERSISTENT_LONG,
    ttl: 30 * 24 * 3600, // 30 days - conversations should persist
    maxSize: 100 * 1024 * 1024, // 100MB for chat history
  };

  static readonly CHAT_MESSAGES: CachePolicy = {
    ...CachePolicies.PERSISTENT_LONG,
    ttl: 30 * 24 * 3600, // 30 days
    maxSize: 200 * 1024 * 1024, // 200MB for messages
    maxEntries: 50000, // Large number of messages
  };

  static readonly TRANSLATION_HISTORY: CachePolicy = {
    ...CachePolicies.PERSISTENT_EXTENDED,
    ttl: 14 * 24 * 3600, // 14 days
    maxSize: 20 * 1024 * 1024, // 20MB
  };

  static readonly VOICE_SETTINGS: CachePolicy = {
    ...CachePolicies.PERSISTENT_LONG,
    ttl: 30 * 24 * 3600, // 30 days - settings change rarely
    maxSize: 1 * 1024 * 1024, // 1MB - settings are small
  };

  static readonly VISION_RESULTS: CachePolicy = {
    ...CachePolicies.PERSISTENT_EXTENDED,
    ttl: 14 * 24 * 3600, // 14 days
    maxSize: 150 * 1024 * 1024, // 150MB for vision analysis
  };

  static readonly API_RESPONSES: CachePolicy = {
    ...CachePolicies.MEMORY_ONLY,
    ttl: 300, // 5 minutes - API responses are short-lived
    maxSize: 10 * 1024 * 1024, // 10MB
  };

  static readonly IMAGES: CachePolicy = {
    ttl: 7 * 24 * 3600, // 7 days
    maxSize: 200 * 1024 * 1024, // 200MB for images
    maxEntries: 1000,
    strategy: 'LRU',
    persistent: true,
    compression: true,
  };

  static readonly TEMPORARY_DATA: CachePolicy = {
    ttl: 60, // 1 minute
    maxSize: 1 * 1024 * 1024, // 1MB
    maxEntries: 100,
    strategy: 'TTL',
    persistent: false,
    compression: false,
  };

  static readonly SESSION_DATA: CachePolicy = {
    ttl: 8 * 3600, // 8 hours - session length
    maxSize: 5 * 1024 * 1024, // 5MB
    maxEntries: 500,
    strategy: 'LRU',
    persistent: false, // Session data shouldn't persist across app restarts
    compression: false,
  };

  // Get policy by data type
  static getPolicyForDataType(dataType: string): CachePolicy {
    switch (dataType) {
      case 'user':
      case 'profile':
        return CachePolicies.USER_DATA;
      
      case 'chat_conversations':
        return CachePolicies.CHAT_CONVERSATIONS;
      
      case 'chat_messages':
        return CachePolicies.CHAT_MESSAGES;
      
      case 'translation':
        return CachePolicies.TRANSLATION_HISTORY;
      
      case 'voice':
        return CachePolicies.VOICE_SETTINGS;
      
      case 'vision':
        return CachePolicies.VISION_RESULTS;
      
      case 'api':
        return CachePolicies.API_RESPONSES;
      
      case 'image':
        return CachePolicies.IMAGES;
      
      case 'temp':
        return CachePolicies.TEMPORARY_DATA;
      
      case 'session':
        return CachePolicies.SESSION_DATA;
      
      default:
        return CachePolicies.MEMORY_ONLY;
    }
  }

  // Get cache key patterns for different data types
  static getCacheKeyPatterns(): Record<string, CachePolicy> {
    return {
      // User and profile data
      'user:*': CachePolicies.USER_DATA,
      'profile:*': CachePolicies.USER_DATA,
      'settings:*': CachePolicies.USER_DATA,
      
      // Chat data
      'chat:conversations:*': CachePolicies.CHAT_CONVERSATIONS,
      'chat:messages:*': CachePolicies.CHAT_MESSAGES,
      'chat:history:*': CachePolicies.CHAT_MESSAGES,
      
      // Translation data
      'translation:*': CachePolicies.TRANSLATION_HISTORY,
      'translate:*': CachePolicies.TRANSLATION_HISTORY,
      
      // Voice data
      'voice:*': CachePolicies.VOICE_SETTINGS,
      'audio:*': CachePolicies.VOICE_SETTINGS,
      
      // Vision data
      'vision:*': CachePolicies.VISION_RESULTS,
      'image:analysis:*': CachePolicies.VISION_RESULTS,
      'ocr:*': CachePolicies.VISION_RESULTS,
      
      // API responses
      'api:*': CachePolicies.API_RESPONSES,
      'response:*': CachePolicies.API_RESPONSES,
      
      // Images
      'image:*': CachePolicies.IMAGES,
      'photo:*': CachePolicies.IMAGES,
      'media:*': CachePolicies.IMAGES,
      
      // Temporary data
      'temp:*': CachePolicies.TEMPORARY_DATA,
      'tmp:*': CachePolicies.TEMPORARY_DATA,
      
      // Session data
      'session:*': CachePolicies.SESSION_DATA,
      'auth:session:*': CachePolicies.SESSION_DATA,
    };
  }

  // Size management utilities
  static calculateOptimalSizes(deviceMemory: number = 2048): {
    memoryLimit: number;
    persistentLimit: number;
  } {
    // Allocate cache based on device memory
    // Use 10% of device memory for cache, split 30/70 between memory/persistent
    const totalCacheSize = Math.min(deviceMemory * 0.1 * 1024 * 1024, 500 * 1024 * 1024); // Max 500MB
    
    return {
      memoryLimit: Math.floor(totalCacheSize * 0.3), // 30% for memory cache
      persistentLimit: Math.floor(totalCacheSize * 0.7), // 70% for persistent cache
    };
  }

  // Cleanup strategies
  static getCleanupInterval(usage: 'light' | 'normal' | 'heavy'): number {
    switch (usage) {
      case 'light':
        return 600; // 10 minutes
      case 'normal':
        return 300; // 5 minutes
      case 'heavy':
        return 120; // 2 minutes
      default:
        return 300;
    }
  }
}