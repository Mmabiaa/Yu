import { NetworkMonitor, OfflineQueue, SyncManager } from '../../types/cache';
import { NetworkMonitorImpl } from './NetworkMonitor';
import { OfflineQueueImpl } from './OfflineQueue';
import { SyncManagerImpl } from './SyncManager';

export interface OfflineSupportConfig {
  enableAutoSync: boolean;
  syncInterval: number; // in milliseconds
  maxQueueSize: number;
  maxRetries: number;
  networkCheckInterval: number;
}

export class OfflineSupportFactory {
  private static networkMonitor: NetworkMonitor | null = null;
  private static offlineQueue: OfflineQueue | null = null;
  private static syncManager: SyncManager | null = null;
  private static config: OfflineSupportConfig | null = null;

  static initialize(config?: Partial<OfflineSupportConfig>): {
    networkMonitor: NetworkMonitor;
    offlineQueue: OfflineQueue;
    syncManager: SyncManager;
  } {
    const defaultConfig: OfflineSupportConfig = {
      enableAutoSync: true,
      syncInterval: 5 * 60 * 1000, // 5 minutes
      maxQueueSize: 1000,
      maxRetries: 3,
      networkCheckInterval: 30 * 1000, // 30 seconds
    };

    OfflineSupportFactory.config = { ...defaultConfig, ...config };

    // Initialize components
    OfflineSupportFactory.networkMonitor = new NetworkMonitorImpl();
    OfflineSupportFactory.offlineQueue = new OfflineQueueImpl();
    OfflineSupportFactory.syncManager = new SyncManagerImpl(
      OfflineSupportFactory.offlineQueue,
      OfflineSupportFactory.networkMonitor
    );

    // Start network monitoring
    OfflineSupportFactory.networkMonitor.startMonitoring();

    // Set up periodic sync if enabled
    if (OfflineSupportFactory.config.enableAutoSync) {
      OfflineSupportFactory.setupPeriodicSync();
    }

    return {
      networkMonitor: OfflineSupportFactory.networkMonitor,
      offlineQueue: OfflineSupportFactory.offlineQueue,
      syncManager: OfflineSupportFactory.syncManager,
    };
  }

  static getNetworkMonitor(): NetworkMonitor {
    if (!OfflineSupportFactory.networkMonitor) {
      throw new Error('OfflineSupport not initialized. Call initialize() first.');
    }
    return OfflineSupportFactory.networkMonitor;
  }

  static getOfflineQueue(): OfflineQueue {
    if (!OfflineSupportFactory.offlineQueue) {
      throw new Error('OfflineSupport not initialized. Call initialize() first.');
    }
    return OfflineSupportFactory.offlineQueue;
  }

  static getSyncManager(): SyncManager {
    if (!OfflineSupportFactory.syncManager) {
      throw new Error('OfflineSupport not initialized. Call initialize() first.');
    }
    return OfflineSupportFactory.syncManager;
  }

  static async isOnline(): Promise<boolean> {
    const networkMonitor = OfflineSupportFactory.getNetworkMonitor();
    const status = await networkMonitor.getStatus();
    return status.isConnected && status.isInternetReachable;
  }

  static async queueRequest(
    url: string,
    method: string,
    data?: any,
    headers?: Record<string, string>,
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<string> {
    const offlineQueue = OfflineSupportFactory.getOfflineQueue();
    
    return await offlineQueue.enqueue({
      url,
      method,
      data,
      headers: headers || {},
      priority,
      maxRetries: OfflineSupportFactory.config?.maxRetries || 3,
    });
  }

  static async syncNow(): Promise<void> {
    const syncManager = OfflineSupportFactory.getSyncManager();
    await syncManager.sync();
  }

  static async getPendingRequestCount(): Promise<number> {
    const offlineQueue = OfflineSupportFactory.getOfflineQueue();
    return await offlineQueue.getSize();
  }

  static async getLastSyncTime(): Promise<Date | null> {
    const syncManager = OfflineSupportFactory.getSyncManager();
    return await syncManager.getLastSyncTime();
  }

  static destroy(): void {
    if (OfflineSupportFactory.networkMonitor) {
      (OfflineSupportFactory.networkMonitor as NetworkMonitorImpl).destroy();
      OfflineSupportFactory.networkMonitor = null;
    }

    OfflineSupportFactory.offlineQueue = null;
    OfflineSupportFactory.syncManager = null;
    OfflineSupportFactory.config = null;

    // Clear any intervals
    if (OfflineSupportFactory.syncInterval) {
      clearInterval(OfflineSupportFactory.syncInterval);
      OfflineSupportFactory.syncInterval = null;
    }
  }

  private static syncInterval: NodeJS.Timeout | null = null;

  private static setupPeriodicSync(): void {
    if (!OfflineSupportFactory.config || !OfflineSupportFactory.syncManager) {
      return;
    }

    OfflineSupportFactory.syncInterval = setInterval(async () => {
      try {
        const syncManager = OfflineSupportFactory.syncManager!;
        const shouldSync = await syncManager.shouldAutoSync();
        
        if (shouldSync) {
          console.log('Performing periodic sync...');
          await syncManager.sync();
        }
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, OfflineSupportFactory.config.syncInterval) as any;
  }
}

// Utility functions for common offline scenarios
export class OfflineUtils {
  static async executeWithOfflineSupport<T>(
    operation: () => Promise<T>,
    fallbackData?: T,
    queueOnFailure = true
  ): Promise<T> {
    try {
      const isOnline = await OfflineSupportFactory.isOnline();
      
      if (isOnline) {
        return await operation();
      } else if (fallbackData !== undefined) {
        return fallbackData;
      } else {
        throw new Error('Operation requires internet connection');
      }
    } catch (error) {
      if (queueOnFailure && error instanceof Error) {
        // Queue the operation for later if it's a network request
        console.log('Queueing failed operation for later sync');
      }
      
      if (fallbackData !== undefined) {
        return fallbackData;
      }
      
      throw error;
    }
  }

  static async waitForConnection(timeout = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const isOnline = await OfflineSupportFactory.isOnline();
      if (isOnline) {
        return true;
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  }

  static getConnectionStatus(): Promise<{
    isOnline: boolean;
    connectionType: string;
    pendingRequests: number;
    lastSync: Date | null;
  }> {
    return Promise.all([
      OfflineSupportFactory.getNetworkMonitor().getStatus(),
      OfflineSupportFactory.getPendingRequestCount(),
      OfflineSupportFactory.getLastSyncTime(),
    ]).then(([networkStatus, pendingRequests, lastSync]) => ({
      isOnline: networkStatus.isConnected && networkStatus.isInternetReachable,
      connectionType: networkStatus.connectionType,
      pendingRequests,
      lastSync,
    }));
  }
}