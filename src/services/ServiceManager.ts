import { ApiClient } from './core/ApiClient';
import { TokenManager } from './core/TokenManager';
import { getTokenManager } from './core/TokenManagerFactory';
import { AuthService } from './auth/AuthService';
import { AuthServiceFactory } from './auth/AuthServiceFactory';
import { ChatService } from './chat/ChatService';
import { ChatServiceFactory } from './chat/ChatServiceFactory';
import { VoiceService } from './voice/VoiceService';
import { VoiceServiceFactory } from './voice/VoiceServiceFactory';
import { CacheManagerFactory } from './core/CacheManagerFactory';
import { CacheManager } from '../types/cache';
import { getCurrentConfig } from '../config/environment';
import { ApiClientConfig, ApiError } from '../types/api';

export class ServiceManager {
  private static instance: ServiceManager | null = null;
  
  private apiClient: ApiClient;
  private tokenManager: TokenManager;
  private cacheManager: CacheManager;
  private authService: AuthService;
  private chatService: ChatService;
  private voiceService: VoiceService;
  private authErrorCallback?: (error: ApiError) => void;

  private constructor() {
    // Initialize services with configuration
    const config = getCurrentConfig();
    
    // Initialize API client
    const apiConfig: ApiClientConfig = {
      baseUrl: config.apiBaseUrl,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      enableCaching: config.features.enableCaching,
    };
    
    this.apiClient = new ApiClient(apiConfig);
    
    // Initialize token manager
    this.tokenManager = getTokenManager();
    
    // Initialize cache manager
    this.cacheManager = CacheManagerFactory.getInstance();
    
    // Set up circular dependencies
    this.apiClient.setTokenManager(this.tokenManager);
    this.tokenManager.setApiClient(this.apiClient);
    
    // Set up authentication error handling
    this.apiClient.setAuthErrorCallback((error: ApiError) => {
      this.handleAuthenticationError(error);
    });
    
    // Initialize auth service
    this.authService = AuthServiceFactory.getInstance(this.apiClient, this.tokenManager);
    
    // Initialize chat service
    this.chatService = ChatServiceFactory.getInstance(this.apiClient, this.cacheManager);
    
    // Initialize voice service
    this.voiceService = VoiceServiceFactory.create(this.apiClient, this.cacheManager);
  }

  /**
   * Get singleton ServiceManager instance
   */
  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static reset(): void {
    ServiceManager.instance = null;
    AuthServiceFactory.reset();
    ChatServiceFactory.reset();
    VoiceServiceFactory.reset();
  }

  /**
   * Get API client instance
   */
  public getApiClient(): ApiClient {
    return this.apiClient;
  }

  /**
   * Get token manager instance
   */
  public getTokenManager(): TokenManager {
    return this.tokenManager;
  }

  /**
   * Get auth service instance
   */
  public getAuthService(): AuthService {
    return this.authService;
  }

  /**
   * Get chat service instance
   */
  public getChatService(): ChatService {
    return this.chatService;
  }

  /**
   * Get voice service instance
   */
  public getVoiceService(): VoiceService {
    return this.voiceService;
  }

  /**
   * Get cache manager instance
   */
  public getCacheManager(): CacheManager {
    return this.cacheManager;
  }

  /**
   * Set callback for authentication errors (e.g., navigation to login)
   */
  public setAuthErrorCallback(callback: (error: ApiError) => void): void {
    this.authErrorCallback = callback;
  }

  /**
   * Handle authentication errors
   */
  private handleAuthenticationError(error: ApiError): void {
    console.warn('Authentication error in ServiceManager:', error);
    
    if (this.authErrorCallback) {
      this.authErrorCallback(error);
    } else {
      console.warn('No authentication error callback set. Consider setting one with setAuthErrorCallback()');
    }
  }

  /**
   * Initialize all services (call this on app startup)
   */
  public async initialize(): Promise<void> {
    try {
      // Check authentication state on startup
      const isAuthenticated = await this.apiClient.isAuthenticated();
      console.log('ServiceManager initialized successfully. Authenticated:', isAuthenticated);
    } catch (error) {
      console.error('ServiceManager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    return this.apiClient.isAuthenticated();
  }

  /**
   * Logout user and clear all authentication state
   */
  public async logout(): Promise<void> {
    try {
      // Use auth service to logout (which handles backend notification)
      await this.authService.logout();
      
      // Clear API client authentication state
      await this.apiClient.clearAuthentication();
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Update configuration (useful for environment changes)
   */
  public updateConfiguration(): void {
    const config = getCurrentConfig();
    
    // Update API client configuration
    this.apiClient.updateConfig({
      baseUrl: config.apiBaseUrl,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      enableCaching: config.features.enableCaching,
    });
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    try {
      // Perform any cleanup operations
      console.log('ServiceManager cleanup completed');
    } catch (error) {
      console.error('ServiceManager cleanup failed:', error);
    }
  }
}