import { BaseService } from '../core/BaseService';
import { ApiClient } from '../core/ApiClient';
import { CacheManager } from '../../types/cache';
import { WebSocketManager, WebSocketMessage } from '../core/WebSocketManager';
import {
  ChatRequest,
  ChatResponse,
  Conversation,
  ConversationList,
  MessageList,
  CreateConversationRequest,
  StreamResponse,
  SearchMessagesRequest,
  ExportConversationRequest,
  ExportConversationResponse,
  ChatPersonality
} from '../../types/chat';

export interface ChatServiceConfig {
  enableStreaming: boolean;
  defaultPersonality: string;
  maxMessageLength: number;
  enableMessageSearch: boolean;
}

/**
 * Service for managing chat conversations and messages
 */
export class ChatService extends BaseService {
  private config: ChatServiceConfig;
  private wsManager: WebSocketManager;
  private wsConnection: WebSocket | null = null;
  private streamCallbacks: Map<string, (response: StreamResponse) => void> = new Map();
  private currentConversationId: string | null = null;

  constructor(
    apiClient: ApiClient, 
    cacheManager: CacheManager, 
    config: ChatServiceConfig
  ) {
    super(apiClient, cacheManager, 'chat');
    this.config = config;
    this.wsManager = new WebSocketManager();
    
    // Set up WebSocket manager with token manager from API client
    if (this.apiClient && (this.apiClient as any).tokenManager) {
      this.wsManager.setTokenManager((this.apiClient as any).tokenManager);
    }
  }

  /**
   * Send a message and get AI response
   */
  public async sendMessage(
    message: string, 
    conversationId?: string, 
    personality?: string
  ): Promise<ChatResponse> {
    try {
      if (!message.trim()) {
        throw new Error('Message cannot be empty');
      }

      if (message.length > this.config.maxMessageLength) {
        throw new Error(`Message too long. Maximum ${this.config.maxMessageLength} characters allowed.`);
      }

      const request: ChatRequest = {
        message: message.trim(),
        conversationId,
        personality: personality || this.config.defaultPersonality,
        context: {
          previousMessages: 10, // Include last 10 messages for context
          includePersonality: true,
          temperature: 0.7,
          maxTokens: 2000
        }
      };

      const response = await this.makeRequest<ChatResponse>('/chat/message', {
        method: 'POST',
        data: request
      });

      if (!response.data) {
        throw new Error('Invalid chat response');
      }

      // Invalidate conversation cache to reflect new message
      if (conversationId) {
        await this.invalidateCache(`/conversations/${conversationId}/messages`);
        await this.invalidateCache('/conversations');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to send message:', error);
      throw new Error(error.message || 'Failed to send message. Please try again.');
    }
  }

  /**
   * Get list of conversations with pagination
   */
  public async getConversations(page: number = 1, limit: number = 20): Promise<ConversationList> {
    try {
      const response = await this.makeRequest<ConversationList>('/conversations', {
        method: 'GET',
        params: { page, limit }
      });

      if (!response.data) {
        throw new Error('Invalid conversations response');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to get conversations:', error);
      throw new Error(error.message || 'Failed to load conversations. Please try again.');
    }
  }

  /**
   * Create a new conversation
   */
  public async createConversation(
    title: string, 
    personality: string, 
    initialMessage?: string
  ): Promise<Conversation> {
    try {
      if (!title.trim()) {
        throw new Error('Conversation title cannot be empty');
      }

      const request: CreateConversationRequest = {
        title: title.trim(),
        personality,
        initialMessage
      };

      const response = await this.makeRequest<Conversation>('/conversations', {
        method: 'POST',
        data: request
      });

      if (!response.data) {
        throw new Error('Invalid conversation creation response');
      }

      // Invalidate conversations cache
      await this.invalidateCache('/conversations');

      return response.data;
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      throw new Error(error.message || 'Failed to create conversation. Please try again.');
    }
  }

  /**
   * Get messages for a specific conversation with pagination
   */
  public async getConversationMessages(
    conversationId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<MessageList> {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      const response = await this.makeRequest<MessageList>(
        `/conversations/${conversationId}/messages`,
        {
          method: 'GET',
          params: { page, limit }
        }
      );

      if (!response.data) {
        throw new Error('Invalid messages response');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to get conversation messages:', error);
      throw new Error(error.message || 'Failed to load messages. Please try again.');
    }
  }

  /**
   * Delete a conversation
   */
  public async deleteConversation(conversationId: string): Promise<void> {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      await this.makeRequest(`/conversations/${conversationId}`, {
        method: 'DELETE'
      });

      // Invalidate related caches
      await this.invalidateCache('/conversations');
      await this.invalidateCache(`/conversations/${conversationId}/messages`);
    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      throw new Error(error.message || 'Failed to delete conversation. Please try again.');
    }
  }

  /**
   * Search messages across conversations
   */
  public async searchMessages(
    query: string, 
    conversationId?: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<MessageList> {
    try {
      if (!this.config.enableMessageSearch) {
        throw new Error('Message search is not enabled');
      }

      if (!query.trim()) {
        throw new Error('Search query cannot be empty');
      }

      const request: SearchMessagesRequest = {
        query: query.trim(),
        conversationId,
        limit,
        offset
      };

      const response = await this.makeRequest<MessageList>('/messages/search', {
        method: 'POST',
        data: request
      });

      if (!response.data) {
        throw new Error('Invalid search response');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to search messages:', error);
      throw new Error(error.message || 'Failed to search messages. Please try again.');
    }
  }

  /**
   * Export conversation to file
   */
  public async exportConversation(
    conversationId: string, 
    format: 'json' | 'txt' | 'pdf' = 'json',
    includeMetadata: boolean = false
  ): Promise<ExportConversationResponse> {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      const request: ExportConversationRequest = {
        conversationId,
        format,
        includeMetadata
      };

      const response = await this.makeRequest<ExportConversationResponse>(
        `/conversations/${conversationId}/export`,
        {
          method: 'POST',
          data: request
        }
      );

      if (!response.data) {
        throw new Error('Invalid export response');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to export conversation:', error);
      throw new Error(error.message || 'Failed to export conversation. Please try again.');
    }
  }

  /**
   * Get available chat personalities
   */
  public async getPersonalities(): Promise<ChatPersonality[]> {
    try {
      const response = await this.makeRequest<ChatPersonality[]>('/chat/personalities', {
        method: 'GET'
      });

      if (!response.data) {
        throw new Error('Invalid personalities response');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to get personalities:', error);
      throw new Error(error.message || 'Failed to load personalities. Please try again.');
    }
  }

  /**
   * Update conversation title
   */
  public async updateConversationTitle(conversationId: string, title: string): Promise<Conversation> {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      if (!title.trim()) {
        throw new Error('Title cannot be empty');
      }

      const response = await this.makeRequest<Conversation>(
        `/conversations/${conversationId}`,
        {
          method: 'PUT',
          data: { title: title.trim() }
        }
      );

      if (!response.data) {
        throw new Error('Invalid update response');
      }

      // Invalidate conversations cache
      await this.invalidateCache('/conversations');

      return response.data;
    } catch (error: any) {
      console.error('Failed to update conversation title:', error);
      throw new Error(error.message || 'Failed to update conversation title. Please try again.');
    }
  }

  /**
   * Archive/unarchive conversation
   */
  public async archiveConversation(conversationId: string, archive: boolean = true): Promise<Conversation> {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      const response = await this.makeRequest<Conversation>(
        `/conversations/${conversationId}/archive`,
        {
          method: 'PUT',
          data: { archived: archive }
        }
      );

      if (!response.data) {
        throw new Error('Invalid archive response');
      }

      // Invalidate conversations cache
      await this.invalidateCache('/conversations');

      return response.data;
    } catch (error: any) {
      console.error('Failed to archive conversation:', error);
      throw new Error(error.message || 'Failed to archive conversation. Please try again.');
    }
  }

  // WebSocket methods for real-time chat streaming

  /**
   * Connect to chat streaming WebSocket
   */
  public async connectToStream(conversationId: string): Promise<WebSocket> {
    try {
      if (!this.config.enableStreaming) {
        throw new Error('Streaming is not enabled');
      }

      if (!conversationId) {
        throw new Error('Conversation ID is required for streaming');
      }

      // Disconnect existing stream if any
      if (this.wsConnection) {
        this.disconnectStream();
      }

      const endpoint = `/chat/stream/${conversationId}`;
      this.wsConnection = await this.wsManager.connect(endpoint);
      this.currentConversationId = conversationId;

      // Set up event listeners
      this.wsManager.on(endpoint, 'message', (message: WebSocketMessage) => {
        this.handleStreamMessage(message);
      });

      this.wsManager.on(endpoint, 'error', (error: any) => {
        console.error('WebSocket stream error:', error);
        this.emitStreamResponse({
          type: 'error',
          data: { error: error.message || 'Stream connection error' },
          conversationId
        });
      });

      // Set up reconnection handling
      this.setupReconnectionHandling(endpoint);

      return this.wsConnection;
    } catch (error: any) {
      console.error('Failed to connect to chat stream:', error);
      throw new Error(error.message || 'Failed to connect to chat stream');
    }
  }

  /**
   * Send typing indicator to other participants
   */
  public sendTypingIndicator(isTyping: boolean): void {
    try {
      if (!this.wsConnection || !this.currentConversationId) {
        return; // Silently fail if no connection
      }

      const endpoint = `/chat/stream/${this.currentConversationId}`;
      
      this.wsManager.sendMessage(endpoint, 'typing_indicator', {
        isTyping,
        conversationId: this.currentConversationId,
        timestamp: new Date()
      });

    } catch (error: any) {
      console.warn('Failed to send typing indicator:', error);
      // Don't throw error for typing indicators
    }
  }

  /**
   * Send message via WebSocket stream
   */
  public sendStreamMessage(message: string, personality?: string): void {
    try {
      if (!this.wsConnection || !this.currentConversationId) {
        throw new Error('No active stream connection');
      }

      if (!message.trim()) {
        throw new Error('Message cannot be empty');
      }

      if (message.length > this.config.maxMessageLength) {
        throw new Error(`Message too long. Maximum ${this.config.maxMessageLength} characters allowed.`);
      }

      const endpoint = `/chat/stream/${this.currentConversationId}`;
      
      this.wsManager.sendMessage(endpoint, 'chat_message', {
        message: message.trim(),
        personality: personality || this.config.defaultPersonality,
        conversationId: this.currentConversationId,
        context: {
          previousMessages: 10,
          includePersonality: true,
          temperature: 0.7,
          maxTokens: 2000
        }
      });

      // Emit message start event
      this.emitStreamResponse({
        type: 'message_start',
        data: { 
          message: message.trim(),
          personality: personality || this.config.defaultPersonality
        },
        conversationId: this.currentConversationId
      });

      // Send typing indicator to show Yu is processing
      this.sendTypingIndicator(true);

    } catch (error: any) {
      console.error('Failed to send stream message:', error);
      throw new Error(error.message || 'Failed to send stream message');
    }
  }

  /**
   * Set callback for stream responses
   */
  public onStreamResponse(callback: (response: StreamResponse) => void): void {
    const callbackId = `callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.streamCallbacks.set(callbackId, callback);
  }

  /**
   * Remove stream response callback
   */
  public offStreamResponse(callback: (response: StreamResponse) => void): void {
    const entries = Array.from(this.streamCallbacks.entries());
    for (const [id, cb] of entries) {
      if (cb === callback) {
        this.streamCallbacks.delete(id);
        break;
      }
    }
  }

  /**
   * Disconnect from WebSocket stream
   */
  public disconnectStream(): void {
    if (this.currentConversationId) {
      const endpoint = `/chat/stream/${this.currentConversationId}`;
      this.wsManager.disconnect(endpoint);
    }
    
    this.wsConnection = null;
    this.currentConversationId = null;
    this.streamCallbacks.clear();
  }

  /**
   * Check if streaming is available and enabled
   */
  public isStreamingEnabled(): boolean {
    return this.config.enableStreaming;
  }

  /**
   * Check if currently connected to a stream
   */
  public isStreamConnected(): boolean {
    return this.wsConnection !== null && this.currentConversationId !== null;
  }

  /**
   * Get current stream status with detailed connection info
   */
  public getStreamStatus(): { 
    connected: boolean; 
    conversationId: string | null; 
    status: string;
    reconnectAttempts?: number;
    lastError?: string;
  } {
    const endpoint = this.currentConversationId ? `/chat/stream/${this.currentConversationId}` : '';
    return {
      connected: this.isStreamConnected(),
      conversationId: this.currentConversationId,
      status: endpoint ? this.wsManager.getConnectionStatus(endpoint) : 'disconnected'
    };
  }

  /**
   * Force reconnect to current stream
   */
  public async reconnectStream(): Promise<void> {
    if (!this.currentConversationId) {
      throw new Error('No active conversation to reconnect to');
    }

    const conversationId = this.currentConversationId;
    this.disconnectStream();
    await this.connectToStream(conversationId);
  }

  /**
   * Set up automatic reconnection handling
   */
  private setupReconnectionHandling(endpoint: string): void {
    this.wsManager.on(endpoint, 'close', (event: CloseEvent) => {
      console.log('WebSocket stream closed:', event.code, event.reason);
      
      // Emit connection status update
      this.emitStreamResponse({
        type: 'connection_status',
        data: { 
          status: 'disconnected', 
          reason: event.reason,
          code: event.code 
        },
        conversationId: this.currentConversationId!
      });

      // Only attempt reconnection for unexpected closures
      if (event.code !== 1000 && event.code !== 1001) {
        this.emitStreamResponse({
          type: 'connection_status',
          data: { 
            status: 'reconnecting',
            message: 'Connection lost, attempting to reconnect...'
          },
          conversationId: this.currentConversationId!
        });
      }
    });

    this.wsManager.on(endpoint, 'reconnect', () => {
      console.log('WebSocket stream reconnected successfully');
      
      // Notify listeners about successful reconnection
      this.emitStreamResponse({
        type: 'connection_status',
        data: { 
          status: 'connected',
          message: 'Connection restored'
        },
        conversationId: this.currentConversationId!
      });
    });

    this.wsManager.on(endpoint, 'reconnect_failed', (data: any) => {
      console.error('WebSocket stream reconnection failed:', data);
      
      // Notify listeners about failed reconnection
      this.emitStreamResponse({
        type: 'connection_status',
        data: { 
          status: 'failed',
          message: 'Failed to reconnect. Please try again.',
          attempts: data.attempts
        },
        conversationId: this.currentConversationId!
      });
    });
  }

  /**
   * Handle incoming stream messages
   */
  private handleStreamMessage(message: WebSocketMessage): void {
    try {
      let streamResponse: StreamResponse;

      switch (message.type) {
        case 'message_start':
          // Yu has started generating a response
          streamResponse = {
            type: 'message_start',
            data: message.data,
            conversationId: this.currentConversationId!
          };
          break;

        case 'message_delta':
          streamResponse = {
            type: 'message_delta',
            data: message.data,
            conversationId: this.currentConversationId!,
            messageId: message.data.messageId
          };
          break;

        case 'message_complete':
          streamResponse = {
            type: 'message_end',
            data: message.data,
            conversationId: this.currentConversationId!,
            messageId: message.data.messageId
          };
          
          // Stop typing indicator when message is complete
          this.sendTypingIndicator(false);
          
          // Invalidate cache for this conversation
          this.invalidateCache(`/conversations/${this.currentConversationId}/messages`);
          this.invalidateCache('/conversations');
          break;

        case 'typing_indicator':
          streamResponse = {
            type: 'typing_indicator',
            data: message.data,
            conversationId: this.currentConversationId!
          };
          break;

        case 'error':
          streamResponse = {
            type: 'error',
            data: message.data,
            conversationId: this.currentConversationId!
          };
          
          // Stop typing indicator on error
          this.sendTypingIndicator(false);
          break;

        case 'connection_status':
          // Handle connection status updates
          streamResponse = {
            type: 'connection_status',
            data: message.data,
            conversationId: this.currentConversationId!
          };
          break;

        default:
          console.warn('Unknown stream message type:', message.type);
          return;
      }

      this.emitStreamResponse(streamResponse);
    } catch (error) {
      console.error('Error handling stream message:', error);
      this.emitStreamResponse({
        type: 'error',
        data: { error: 'Failed to process stream message' },
        conversationId: this.currentConversationId!
      });
    }
  }

  /**
   * Emit stream response to all registered callbacks
   */
  private emitStreamResponse(response: StreamResponse): void {
    this.streamCallbacks.forEach(callback => {
      try {
        callback(response);
      } catch (error) {
        console.error('Error in stream response callback:', error);
      }
    });
  }

  /**
   * Get service configuration
   */
  public getConfig(): ChatServiceConfig {
    return { ...this.config };
  }

  /**
   * Update service configuration
   */
  public updateConfig(newConfig: Partial<ChatServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}