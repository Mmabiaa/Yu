import { ChatService } from '../ChatService';
import { ApiClient } from '../../core/ApiClient';
import { CacheManager } from '../../core/CacheManager';
import { WebSocketManager } from '../../core/WebSocketManager';

// Mock dependencies
jest.mock('../../core/ApiClient');
jest.mock('../../core/CacheManager');
jest.mock('../../core/WebSocketManager');

describe('ChatService Streaming', () => {
    let chatService: ChatService;
    let mockApiClient: jest.Mocked<ApiClient>;
    let mockCacheManager: jest.Mocked<CacheManager>;
    let mockWebSocketManager: jest.Mocked<WebSocketManager>;

    beforeEach(() => {
        mockApiClient = new ApiClient({} as any) as jest.Mocked<ApiClient>;
        mockCacheManager = {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
            has: jest.fn(),
            invalidate: jest.fn(),
        } as any;

        const config = {
            enableStreaming: true,
            defaultPersonality: 'helpful',
            maxMessageLength: 4000,
            enableMessageSearch: true,
        };

        chatService = new ChatService(mockApiClient, mockCacheManager, config);
    });

    describe('Streaming Configuration', () => {
        it('should be enabled by default in config', () => {
            expect(chatService.isStreamingEnabled()).toBe(true);
        });

        it('should not be connected initially', () => {
            expect(chatService.isStreamConnected()).toBe(false);
        });

        it('should return proper stream status', () => {
            const status = chatService.getStreamStatus();
            expect(status.connected).toBe(false);
            expect(status.conversationId).toBe(null);
            expect(status.status).toBe('disconnected');
        });
    });

    describe('Stream Response Callbacks', () => {
        it('should allow adding stream response callbacks', () => {
            const callback = jest.fn();

            // This should not throw
            expect(() => {
                chatService.onStreamResponse(callback);
            }).not.toThrow();
        });

        it('should allow removing stream response callbacks', () => {
            const callback = jest.fn();

            chatService.onStreamResponse(callback);

            // This should not throw
            expect(() => {
                chatService.offStreamResponse(callback);
            }).not.toThrow();
        });
    });

    describe('Typing Indicators', () => {
        it('should handle typing indicators gracefully when not connected', () => {
            // Should not throw when no connection exists
            expect(() => {
                chatService.sendTypingIndicator(true);
            }).not.toThrow();

            expect(() => {
                chatService.sendTypingIndicator(false);
            }).not.toThrow();
        });
    });

    describe('Configuration Management', () => {
        it('should return current configuration', () => {
            const config = chatService.getConfig();

            expect(config.enableStreaming).toBe(true);
            expect(config.defaultPersonality).toBe('helpful');
            expect(config.maxMessageLength).toBe(4000);
            expect(config.enableMessageSearch).toBe(true);
        });

        it('should allow updating configuration', () => {
            chatService.updateConfig({
                enableStreaming: false,
                maxMessageLength: 2000,
            });

            const config = chatService.getConfig();
            expect(config.enableStreaming).toBe(false);
            expect(config.maxMessageLength).toBe(2000);
            // Other values should remain unchanged
            expect(config.defaultPersonality).toBe('helpful');
            expect(config.enableMessageSearch).toBe(true);
        });
    });

    describe('Stream Connection Management', () => {
        it('should handle disconnection gracefully', () => {
            // Should not throw when no connection exists
            expect(() => {
                chatService.disconnectStream();
            }).not.toThrow();
        });
    });
});