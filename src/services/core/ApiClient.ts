import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiClientConfig, ApiResponse, ApiError, RequestOptions, RetryConfig } from '../../types/api';

export class ApiClient {
  private axiosInstance: AxiosInstance;
  private config: ApiClientConfig;
  private retryConfig: RetryConfig;
  private tokenManager?: any; // Will be injected later
  private authErrorCallback?: (error: ApiError) => void;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.retryConfig = {
      attempts: config.retryAttempts,
      delay: 1000, // 1 second initial delay
      backoffFactor: 2,
      maxDelay: 10000, // 10 seconds max delay
    };

    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set token manager for authentication
   */
  public setTokenManager(tokenManager: any): void {
    this.tokenManager = tokenManager;
  }

  /**
   * Set callback for authentication errors (e.g., redirect to login)
   */
  public setAuthErrorCallback(callback: (error: ApiError) => void): void {
    this.authErrorCallback = callback;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add authentication token if available
        const token = await this.getAuthToken();
        if (token) {
          const tokenType = await this.getTokenType();
          config.headers.Authorization = `${tokenType} ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Add timestamp
        config.headers['X-Request-Time'] = new Date().toISOString();

        // Add API version header
        config.headers['X-API-Version'] = '1.0';

        return config;
      },
      (error) => {
        return Promise.reject(this.standardizeError(error));
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return this.transformResponse(response);
      },
      async (error) => {
        return this.handleResponseError(error);
      }
    );
  }

  /**
   * Make HTTP request with retry logic
   */
  public async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const config: AxiosRequestConfig = {
      url: endpoint,
      method: options.method || 'GET',
      headers: options.headers,
      params: options.params,
      data: options.data,
      timeout: options.timeout || this.config.timeout,
    };

    return this.executeWithRetry<T>(config, options.retries || this.retryConfig.attempts);
  }

  /**
   * GET request
   */
  public async get<T>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST request
   */
  public async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', data });
  }

  /**
   * PUT request
   */
  public async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', data });
  }

  /**
   * DELETE request
   */
  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  public async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', data });
  }

  /**
   * Upload file with progress tracking
   */
  public async uploadFile<T>(
    endpoint: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      url: endpoint,
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    return this.executeWithRetry<T>(config, 1); // No retry for file uploads
  }

  private async executeWithRetry<T>(
    config: AxiosRequestConfig,
    maxAttempts: number
  ): Promise<ApiResponse<T>> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.axiosInstance.request(config);
        return response.data;
      } catch (error) {
        lastError = error;

        // Don't retry on certain errors
        if (!this.shouldRetry(error, attempt, maxAttempts)) {
          throw this.standardizeError(error);
        }

        // Wait before retry
        if (attempt < maxAttempts) {
          await this.delay(this.calculateRetryDelay(attempt));
        }
      }
    }

    throw this.standardizeError(lastError);
  }

  private shouldRetry(error: any, attempt: number, maxAttempts: number): boolean {
    if (attempt >= maxAttempts) {
      return false;
    }

    // Don't retry on client errors (4xx)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return false;
    }

    // Retry on network errors, timeouts, and server errors (5xx)
    return (
      !error.response || // Network error
      error.code === 'ECONNABORTED' || // Timeout
      (error.response.status >= 500 && error.response.status < 600) // Server error
    );
  }

  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.delay * Math.pow(this.retryConfig.backoffFactor, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async getAuthToken(): Promise<string | null> {
    if (!this.tokenManager) {
      return null;
    }

    try {
      return await this.tokenManager.getAccessToken();
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  }

  private async getTokenType(): Promise<string> {
    if (!this.tokenManager) {
      return 'Bearer';
    }

    try {
      return await this.tokenManager.getTokenType();
    } catch (error) {
      console.warn('Failed to get token type:', error);
      return 'Bearer';
    }
  }

  private handleAuthenticationError(error: ApiError): void {
    console.warn('Authentication error occurred:', error);
    
    if (this.authErrorCallback) {
      this.authErrorCallback(error);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private transformResponse(response: AxiosResponse): any {
    // Transform response to standardized format
    return {
      data: response.data,
      status: response.status,
      message: response.data?.message,
      meta: {
        timestamp: new Date(),
        requestId: response.headers['x-request-id'],
        processingTime: response.headers['x-processing-time'],
        version: response.headers['x-api-version'],
      },
    };
  }

  private async handleResponseError(error: AxiosError): Promise<never> {
    const originalRequest = error.config;

    // Handle token refresh for 401 errors
    if (error.response?.status === 401 && this.tokenManager && originalRequest) {
      // Avoid infinite retry loops
      if (originalRequest.headers['X-Retry-Auth']) {
        console.warn('Authentication retry failed, clearing tokens');
        await this.tokenManager.clearTokens();
        this.handleAuthenticationError(this.standardizeError(error));
        throw this.standardizeError(error);
      }

      try {
        console.log('Attempting token refresh for 401 error');
        const newToken = await this.tokenManager.refreshAccessToken();
        
        if (newToken) {
          // Mark request as retried to avoid infinite loops
          originalRequest.headers['X-Retry-Auth'] = 'true';
          
          // Update authorization header with new token
          const tokenType = await this.getTokenType();
          originalRequest.headers.Authorization = `${tokenType} ${newToken}`;
          
          // Retry the original request
          console.log('Retrying request with new token');
          return this.axiosInstance.request(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear tokens if refresh fails
        await this.tokenManager.clearTokens();
        
        // Handle authentication error
        this.handleAuthenticationError(this.standardizeError(error));
      }
    }

    // Handle other authentication errors (403, etc.)
    if (error.response?.status === 403) {
      this.handleAuthenticationError(this.standardizeError(error));
    }

    throw this.standardizeError(error);
  }

  private standardizeError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      const statusCode = error.response.status;
      const responseData = error.response.data;
      
      // Handle authentication-specific errors
      if (statusCode === 401) {
        return {
          code: responseData?.code || 'AUTHENTICATION_FAILED',
          message: responseData?.message || 'Authentication failed. Please log in again.',
          details: responseData?.details,
          statusCode,
          timestamp: new Date(),
        };
      }
      
      if (statusCode === 403) {
        return {
          code: responseData?.code || 'ACCESS_FORBIDDEN',
          message: responseData?.message || 'Access forbidden. You do not have permission to perform this action.',
          details: responseData?.details,
          statusCode,
          timestamp: new Date(),
        };
      }
      
      if (statusCode === 422) {
        return {
          code: responseData?.code || 'VALIDATION_ERROR',
          message: responseData?.message || 'Validation failed',
          details: responseData?.details,
          field: responseData?.field,
          statusCode,
          timestamp: new Date(),
        };
      }

      return {
        code: responseData?.code || `HTTP_${statusCode}`,
        message: responseData?.message || error.message || `Request failed with status ${statusCode}`,
        details: responseData?.details,
        statusCode,
        timestamp: new Date(),
      };
    } else if (error.request) {
      // Network error
      return {
        code: 'NETWORK_ERROR',
        message: 'Network request failed. Please check your connection.',
        details: error.message,
        timestamp: new Date(),
      };
    } else {
      // Other error
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'An unexpected error occurred',
        details: error,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Update base configuration
   */
  public updateConfig(newConfig: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.baseUrl) {
      this.axiosInstance.defaults.baseURL = newConfig.baseUrl;
    }
    
    if (newConfig.timeout) {
      this.axiosInstance.defaults.timeout = newConfig.timeout;
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): ApiClientConfig {
    return { ...this.config };
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    if (!this.tokenManager) {
      return false;
    }

    try {
      const hasTokens = await this.tokenManager.hasValidTokens();
      if (!hasTokens) {
        return false;
      }

      const isExpired = await this.tokenManager.isTokenExpired();
      return !isExpired;
    } catch (error) {
      console.warn('Failed to check authentication status:', error);
      return false;
    }
  }

  /**
   * Clear authentication state
   */
  public async clearAuthentication(): Promise<void> {
    if (this.tokenManager) {
      try {
        await this.tokenManager.clearTokens();
      } catch (error) {
        console.error('Failed to clear authentication:', error);
      }
    }
  }

  /**
   * Get authentication headers for manual requests
   */
  public async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    
    const token = await this.getAuthToken();
    if (token) {
      const tokenType = await this.getTokenType();
      headers.Authorization = `${tokenType} ${token}`;
    }
    
    return headers;
  }

  /**
   * Get the base URL for the API client
   */
  public getBaseUrl(): string {
    return this.config.baseUrl;
  }
} 