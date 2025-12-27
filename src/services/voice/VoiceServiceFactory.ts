import { VoiceService } from './VoiceService';
import { ApiClient } from '../core/ApiClient';
import { CacheManager } from '../../types/cache';

/**
 * Factory for creating VoiceService instances
 */
export class VoiceServiceFactory {
  private static instance: VoiceService | null = null;

  /**
   * Create or get existing VoiceService instance
   */
  static create(apiClient: ApiClient, cacheManager: CacheManager): VoiceService {
    if (!VoiceServiceFactory.instance) {
      VoiceServiceFactory.instance = new VoiceService(apiClient, cacheManager);
    }
    return VoiceServiceFactory.instance;
  }

  /**
   * Reset the factory instance (useful for testing)
   */
  static reset(): void {
    VoiceServiceFactory.instance = null;
  }

  /**
   * Get existing instance without creating new one
   */
  static getInstance(): VoiceService | null {
    return VoiceServiceFactory.instance;
  }
}