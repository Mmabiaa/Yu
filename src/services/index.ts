// Core services
export { ApiClient } from './core/ApiClient';
export { TokenManager } from './core/TokenManager';
export { createTokenManager, getTokenManager, resetTokenManager } from './core/TokenManagerFactory';
export { WebSocketManager } from './core/WebSocketManager';
export { BaseService } from './core/BaseService';

// Cache services
export { CacheManagerImpl as CacheManager } from './core/CacheManager';
export { CacheManagerFactory } from './core/CacheManagerFactory';
export { MemoryCacheImpl as MemoryCache } from './core/MemoryCache';
export { PersistentCacheImpl as PersistentCache } from './core/PersistentCache';
export { CachePolicies } from './core/CachePolicies';
export { CacheCleanupService, CacheUtils } from './core/CacheCleanupService';

// Offline support services
export { NetworkMonitorImpl as NetworkMonitor } from './core/NetworkMonitor';
export { OfflineQueueImpl as OfflineQueue } from './core/OfflineQueue';
export { SyncManagerImpl as SyncManager } from './core/SyncManager';
export { OfflineSupportFactory, OfflineUtils } from './core/OfflineSupportFactory';

// Auth services
export { AuthService } from './auth/AuthService';
export { AuthServiceFactory } from './auth/AuthServiceFactory';
export { AuthIntegration, getAuthIntegration, resetAuthIntegration } from './auth/AuthIntegration';

// Chat services
export { ChatService } from './chat/ChatService';
export { ChatServiceFactory } from './chat/ChatServiceFactory';

// Voice services
export { VoiceService, VoiceServiceFactory, AudioManager, VoiceSettingsManager, VoiceIntegration, getVoiceIntegration, resetVoiceIntegration } from './voice';

// Service management
export { ServiceManager } from './ServiceManager';

// Types
export type { AuthServiceConfig } from './auth/AuthService';
export type { ChatServiceConfig } from './chat/ChatService';