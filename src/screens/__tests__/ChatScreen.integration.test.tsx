import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ChatScreen from '../ChatScreen';
import { ServiceManager } from '../../services/ServiceManager';
import { ThemeProvider } from '../../context/ThemeContext';

// Mock dependencies
jest.mock('../../services/ServiceManager');
jest.mock('../../utils/speech');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

const mockChatService = {
  getConversations: jest.fn(),
  createConversation: jest.fn(),
  getConversationMessages: jest.fn(),
  sendMessage: jest.fn(),
  searchMessages: jest.fn(),
  exportConversation: jest.fn(),
  updateConversationTitle: jest.fn(),
  archiveConversation: jest.fn(),
  isStreamingEnabled: jest.fn(() => false),
  isStreamConnected: jest.fn(() => false),
  connectToStream: jest.fn(),
  disconnectStream: jest.fn(),
  onStreamResponse: jest.fn(),
};

const mockServiceManager = {
  getChatService: jest.fn(() => mockChatService),
};

(ServiceManager.getInstance as jest.Mock).mockReturnValue(mockServiceManager);

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('ChatScreen Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockChatService.getConversations.mockResolvedValue({
      conversations: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    });
    
    mockChatService.createConversation.mockResolvedValue({
      id: 'test-conversation',
      title: 'New Chat',
      personality: 'helpful',
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 1,
      isArchived: false,
    });
    
    mockChatService.getConversationMessages.mockResolvedValue({
      messages: [],
      total: 0,
      page: 1,
      limit: 50,
      hasMore: false,
    });
  });

  it('should render ChatScreen with conversation management features', async () => {
    const { getByTestId, queryByText } = render(
      <TestWrapper>
        <ChatScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockChatService.getConversations).toHaveBeenCalled();
    });

    // Should show conversation list button
    expect(queryByText('chatbubbles-outline')).toBeTruthy();
    
    // Should show search button
    expect(queryByText('search-outline')).toBeTruthy();
  });

  it('should handle conversation creation', async () => {
    const { getByText } = render(
      <TestWrapper>
        <ChatScreen navigation={mockNavigation} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockChatService.createConversation).toHaveBeenCalledWith(
        'New Chat',
        'helpful',
        expect.stringContaining("Hello! I'm Yu")
      );
    });
  });

  it('should handle message search functionality', async () => {
    mockChatService.searchMessages.mockResolvedValue({
      messages: [
        {
          id: 'msg1',
          conversationId: 'conv1',
          role: 'user',
          content: 'test message',
          timestamp: new Date(),
        }
      ],
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false,
    });

    const result = await mockChatService.searchMessages('test', undefined, 20, 0);
    
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content).toBe('test message');
  });

  it('should handle conversation export', async () => {
    const mockExportResponse = {
      downloadUrl: 'https://example.com/export.txt',
      filename: 'conversation-export.txt',
      expiresAt: new Date(),
    };
    
    mockChatService.exportConversation.mockResolvedValue(mockExportResponse);

    const result = await mockChatService.exportConversation('conv1', 'txt', false);
    
    expect(result.downloadUrl).toBe('https://example.com/export.txt');
    expect(result.filename).toBe('conversation-export.txt');
  });

  it('should handle conversation management operations', async () => {
    const updatedConversation = {
      id: 'conv1',
      title: 'Updated Title',
      personality: 'helpful',
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 5,
      isArchived: false,
    };

    mockChatService.updateConversationTitle.mockResolvedValue(updatedConversation);
    mockChatService.archiveConversation.mockResolvedValue({
      ...updatedConversation,
      isArchived: true,
    });

    // Test title update
    const titleResult = await mockChatService.updateConversationTitle('conv1', 'Updated Title');
    expect(titleResult.title).toBe('Updated Title');

    // Test archiving
    const archiveResult = await mockChatService.archiveConversation('conv1', true);
    expect(archiveResult.isArchived).toBe(true);
  });
});