// Cache Types and Interfaces

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: Date;
  ttl?: number; // Time to live in seconds
  size?: number; // Size in bytes
  accessCount: number;
  lastAccessed: Date;
}

export interface CachePolicy {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  strategy: CacheStrategy;
  persistent: boolean; // Persist across app restarts
  compression?: boolean; // Compress cached data
}

export type CacheStrategy = 'LRU' | 'FIFO' | 'TTL' | 'LFU';

export interface CacheConfig {
  defaultPolicy: CachePolicy;
  policies: Record<string, CachePolicy>;
  memoryLimit: number; // Total memory limit in bytes
  persistentLimit: number; // Persistent storage limit in bytes
  cleanupInterval: number; // Cleanup interval in seconds
}

export interface CacheStats {
  totalEntries: number;
  memoryUsage: number;
  persistentUsage: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  lastCleanup: Date;
}

export interface CacheManager {
  // Basic operations
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  
  // Batch operations
  getMultiple<T>(keys: string[]): Promise<Record<string, T | null>>;
  setMultiple<T>(entries: Record<string, T>, ttl?: number): Promise<void>;
  deleteMultiple(keys: string[]): Promise<void>;
  
  // Cache policies
  setCachePolicy(pattern: string, policy: CachePolicy): void;
  getCachePolicy(key: string): CachePolicy;
  
  // Cache management
  getStats(): Promise<CacheStats>;
  cleanup(): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
  
  // Size management
  getSize(): Promise<number>;
  getEntryCount(): Promise<number>;
  evictLRU(count?: number): Promise<void>;
}

export interface MemoryCache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
  getSize(): number;
  getEntryCount(): number;
  evictLRU(count?: number): void;
  cleanup(): void;
}

export interface PersistentCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  getSize(): Promise<number>;
  getEntryCount(): Promise<number>;
  cleanup(): Promise<void>;
}

// Network and Offline Types
export interface NetworkStatus {
  isConnected: boolean;
  connectionType: ConnectionType;
  isInternetReachable: boolean;
  details?: NetworkDetails;
}

export type ConnectionType = 'none' | 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'wimax' | 'vpn' | 'other' | 'unknown';

export interface NetworkDetails {
  ssid?: string;
  bssid?: string;
  strength?: number;
  frequency?: number;
  ipAddress?: string;
  subnet?: string;
  gateway?: string;
}

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  data?: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: RequestPriority;
}

export type RequestPriority = 'low' | 'normal' | 'high' | 'critical';

export interface OfflineQueue {
  enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string>;
  dequeue(): Promise<QueuedRequest | null>;
  peek(): Promise<QueuedRequest | null>;
  remove(id: string): Promise<boolean>;
  clear(): Promise<void>;
  getSize(): Promise<number>;
  getAll(): Promise<QueuedRequest[]>;
  processQueue(): Promise<void>;
}

export interface SyncManager {
  sync(): Promise<SyncResult>;
  syncPartial(types: string[]): Promise<SyncResult>;
  getLastSyncTime(): Promise<Date | null>;
  setLastSyncTime(time: Date): Promise<void>;
  getSyncStatus(): Promise<SyncStatus>;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: SyncError[];
  duration: number;
}

export interface SyncError {
  requestId: string;
  error: string;
  retryable: boolean;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'completed';

export interface NetworkMonitor {
  getStatus(): Promise<NetworkStatus>;
  startMonitoring(): void;
  stopMonitoring(): void;
  onStatusChange(callback: (status: NetworkStatus) => void): void;
  offStatusChange(callback: (status: NetworkStatus) => void): void;
}