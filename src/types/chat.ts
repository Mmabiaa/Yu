// Chat Types and Models

export interface Conversation {
  id: string;
  title: string;
  personality: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: Message;
  isArchived: boolean;
  tags?: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
  attachments?: MessageAttachment[];
}

export interface MessageMetadata {
  tokens?: number;
  processingTime?: number;
  model?: string;
  confidence?: number;
  personality?: string;
  isStreaming?: boolean;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'audio' | 'file';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  personality?: string;
  context?: ChatContext;
  attachments?: File[];
}

export interface ChatResponse {
  message: Message;
  conversation: Conversation;
  suggestions?: string[];
}

export interface ChatContext {
  previousMessages?: number;
  includePersonality?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface ConversationList {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface MessageList {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateConversationRequest {
  title: string;
  personality: string;
  initialMessage?: string;
}

export interface StreamResponse {
  type: 'message_start' | 'message_delta' | 'message_end' | 'error';
  data: any;
  conversationId: string;
  messageId?: string;
}

export interface ChatPersonality {
  id: string;
  name: string;
  description: string;
  prompt: string;
  isDefault: boolean;
  isCustom: boolean;
}

export interface SearchMessagesRequest {
  query: string;
  conversationId?: string;
  limit?: number;
  offset?: number;
}

export interface ExportConversationRequest {
  conversationId: string;
  format: 'json' | 'txt' | 'pdf';
  includeMetadata?: boolean;
}

export interface ExportConversationResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: Date;
}