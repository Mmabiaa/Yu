import { ChatService, ChatServiceConfig } from './ChatService';
import { ApiClient } from '../core/ApiClient';
import { CacheManager } from '../../types/cache';
import { getCurrentConfig } from '../../config/environment';

/**
 * Factory for creating and managing ChatService instances
 */
export class ChatServiceFactory {
  private static instance: ChatService | null = null;

  /**
   * Get singleton ChatService instance
   */
  public static getInstance(
    apiClient?: ApiClient, 
    cacheManager?: CacheManager
  ): ChatService {
    if (!ChatServiceFactory.instance) {
      if (!apiClient || !cacheManager) {
        throw new Error('ApiClient and CacheManager are required for first-time initialization');
      }

      const config = getCurrentConfig();
      const chatConfig: ChatServiceConfig = {
        enableStreaming: config.features.enableStreaming || false,
        defaultPersonality: config.chat?.defaultPersonality || 'helpful',
        maxMessageLength: config.chat?.maxMessageLength || 4000,
        enableMessageSearch: config.features.enableMessageSearch || true,
      };

      ChatServiceFactory.instance = new ChatService(apiClient, cacheManager, chatConfig);
    }

    return ChatServiceFactory.instance;
  }

  /**
   * Create a new ChatService instance (not singleton)
   */
  public static create(
    apiClient: ApiClient, 
    cacheManager: CacheManager, 
    config?: Partial<ChatServiceConfig>
  ): ChatService {
    const defaultConfig = getCurrentConfig();
    const chatConfig: ChatServiceConfig = {
      enableStreaming: config?.enableStreaming ?? defaultConfig.features.enableStreaming ?? false,
      defaultPersonality: config?.defaultPersonality ?? defaultConfig.chat?.defaultPersonality ?? 'helpful',
      maxMessageLength: config?.maxMessageLength ?? defaultConfig.chat?.maxMessageLength ?? 4000,
      enableMessageSearch: config?.enableMessageSearch ?? defaultConfig.features.enableMessageSearch ?? true,
    };

    return new ChatService(apiClient, cacheManager, chatConfig);
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static reset(): void {
    ChatServiceFactory.instance = null;
  }

  /**
   * Check if instance exists
   */
  public static hasInstance(): boolean {
    return ChatServiceFactory.instance !== null;
  }
}