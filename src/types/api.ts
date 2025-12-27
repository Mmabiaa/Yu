// API Types and Interfaces

export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  enableCaching: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  timestamp: Date;
  requestId: string;
  processingTime: number;
  version: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
  field?: string;
  timestamp?: Date;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  validateResponse?: boolean;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoffFactor: number;
  maxDelay: number;
}

export interface ErrorContext {
  endpoint: string;
  method: string;
  userId?: string;
  timestamp: Date;
}

export interface ErrorResponse {
  handled: boolean;
  retry: boolean;
  userMessage: string;
  logError: boolean;
}

// Validation Types
export interface ValidationSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  required?: string[];
  properties?: Record<string, ValidationSchema>;
  items?: ValidationSchema;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
  rule: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// File Upload Types
export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  compress?: boolean;
  quality?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// WebSocket Types
export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
  id?: string;
}