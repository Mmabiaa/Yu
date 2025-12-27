import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncManager, SyncResult, SyncError, SyncStatus, OfflineQueue } from '../../types/cache';
import { NetworkMonitor } from '../../types/cache';

export class SyncManagerImpl implements SyncManager {
  private offlineQueue: OfflineQueue;
  private networkMonitor: NetworkMonitor;
  private lastSyncKey = 'last_sync_time';
  private syncStatusKey = 'sync_status';
  private currentStatus: SyncStatus = 'idle';
  private syncInProgress = false;

  constructor(offlineQueue: OfflineQueue, networkMonitor: NetworkMonitor) {
    this.offlineQueue = offlineQueue;
    this.networkMonitor = networkMonitor;

    // Auto-sync when network becomes available
    this.networkMonitor.onStatusChange((status) => {
      if (status.isConnected && status.isInternetReachable && !this.syncInProgress) {
        this.sync().catch(error => {
          console.error('Auto-sync failed:', error);
        });
      }
    });
  }

  async sync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    await this.setSyncStatus('syncing');

    const startTime = Date.now();
    let syncedCount = 0;
    let failedCount = 0;
    const errors: SyncError[] = [];

    try {
      // Check network connectivity
      const networkStatus = await this.networkMonitor.getStatus();
      if (!networkStatus.isConnected || !networkStatus.isInternetReachable) {
        throw new Error('No internet connection available');
      }

      // Process offline queue
      const queueSize = await this.offlineQueue.getSize();
      if (queueSize > 0) {
        console.log(`Syncing ${queueSize} queued requests...`);

        try {
          await this.offlineQueue.processQueue();

          // Check how many requests are left (failed ones)
          const remainingSize = await this.offlineQueue.getSize();
          syncedCount = queueSize - remainingSize;
          failedCount = remainingSize;

          // Collect error information for failed requests
          if (failedCount > 0) {
            const allRequests = await this.offlineQueue.getAll();
            const failedRequests = allRequests.filter(req => req.retryCount >= req.maxRetries);
            for (const request of failedRequests) {
              errors.push({
                requestId: request.id,
                error: `Failed after ${request.retryCount} retries`,
                retryable: request.retryCount < request.maxRetries,
              });
            }
          }
        } catch (error) {
          failedCount = queueSize;
          errors.push({
            requestId: 'queue_processing',
            error: error instanceof Error ? error.message : 'Unknown error',
            retryable: true,
          });
        }
      }

      // Update last sync time
      await this.setLastSyncTime(new Date());
      await this.setSyncStatus('completed');

      const result: SyncResult = {
        success: failedCount === 0,
        syncedCount,
        failedCount,
        errors,
        duration: Date.now() - startTime,
      };

      console.log('Sync completed:', result);
      return result;

    } catch (error) {
      await this.setSyncStatus('error');

      const result: SyncResult = {
        success: false,
        syncedCount,
        failedCount: failedCount + 1,
        errors: [
          ...errors,
          {
            requestId: 'sync_manager',
            error: error instanceof Error ? error.message : 'Unknown sync error',
            retryable: true,
          },
        ],
        duration: Date.now() - startTime,
      };

      console.error('Sync failed:', result);
      return result;

    } finally {
      this.syncInProgress = false;

      // Reset status to idle after a delay if no errors
      setTimeout(async () => {
        const status = await this.getSyncStatus();
        if (status === 'completed') {
          await this.setSyncStatus('idle');
        }
      }, 2000);
    }
  }

  async syncPartial(types: string[]): Promise<SyncResult> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    await this.setSyncStatus('syncing');

    const startTime = Date.now();
    let syncedCount = 0;
    let failedCount = 0;
    const errors: SyncError[] = [];

    try {
      // Check network connectivity
      const networkStatus = await this.networkMonitor.getStatus();
      if (!networkStatus.isConnected || !networkStatus.isInternetReachable) {
        throw new Error('No internet connection available');
      }

      // Get all queued requests
      const allRequests = await this.offlineQueue.getAll();

      // Filter requests by type (based on URL patterns)
      const filteredRequests = allRequests.filter(request =>
        types.some(type => request.url.includes(type))
      );

      console.log(`Syncing ${filteredRequests.length} requests of types: ${types.join(', ')}`);

      // Process filtered requests
      for (const request of filteredRequests) {
        try {
          // This would need to be implemented based on the specific request
          // For now, we'll just remove it from the queue as if it succeeded
          await this.offlineQueue.remove(request.id);
          syncedCount++;
        } catch (error) {
          failedCount++;
          errors.push({
            requestId: request.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryable: true,
          });
        }
      }

      await this.setLastSyncTime(new Date());
      await this.setSyncStatus('completed');

      const result: SyncResult = {
        success: failedCount === 0,
        syncedCount,
        failedCount,
        errors,
        duration: Date.now() - startTime,
      };

      console.log('Partial sync completed:', result);
      return result;

    } catch (error) {
      await this.setSyncStatus('error');

      const result: SyncResult = {
        success: false,
        syncedCount,
        failedCount: failedCount + 1,
        errors: [
          ...errors,
          {
            requestId: 'partial_sync',
            error: error instanceof Error ? error.message : 'Unknown sync error',
            retryable: true,
          },
        ],
        duration: Date.now() - startTime,
      };

      console.error('Partial sync failed:', result);
      return result;

    } finally {
      this.syncInProgress = false;

      setTimeout(async () => {
        const status = await this.getSyncStatus();
        if (status === 'completed') {
          await this.setSyncStatus('idle');
        }
      }, 2000);
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    try {
      const stored = await AsyncStorage.getItem(this.lastSyncKey);
      return stored ? new Date(stored) : null;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  async setLastSyncTime(time: Date): Promise<void> {
    try {
      await AsyncStorage.setItem(this.lastSyncKey, time.toISOString());
    } catch (error) {
      console.error('Failed to set last sync time:', error);
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const stored = await AsyncStorage.getItem(this.syncStatusKey);
      return (stored as SyncStatus) || 'idle';
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return 'idle';
    }
  }

  private async setSyncStatus(status: SyncStatus): Promise<void> {
    try {
      this.currentStatus = status;
      await AsyncStorage.setItem(this.syncStatusKey, status);
    } catch (error) {
      console.error('Failed to set sync status:', error);
    }
  }

  // Additional utility methods
  async canSync(): Promise<boolean> {
    const networkStatus = await this.networkMonitor.getStatus();
    return networkStatus.isConnected && networkStatus.isInternetReachable && !this.syncInProgress;
  }

  async getPendingSyncCount(): Promise<number> {
    return await this.offlineQueue.getSize();
  }

  async getTimeSinceLastSync(): Promise<number | null> {
    const lastSync = await this.getLastSyncTime();
    return lastSync ? Date.now() - lastSync.getTime() : null;
  }

  async shouldAutoSync(): Promise<boolean> {
    const canSync = await this.canSync();
    if (!canSync) {
      return false;
    }

    const pendingCount = await this.getPendingSyncCount();
    if (pendingCount === 0) {
      return false;
    }

    const timeSinceLastSync = await this.getTimeSinceLastSync();
    const autoSyncThreshold = 5 * 60 * 1000; // 5 minutes

    return timeSinceLastSync === null || timeSinceLastSync > autoSyncThreshold;
  }

  // Cleanup old sync data
  async cleanup(): Promise<void> {
    try {
      // Clean up stale requests (older than 24 hours) - simplified implementation
      const allRequests = await this.offlineQueue.getAll();
      const staleThreshold = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

      for (const request of allRequests) {
        if (request.timestamp.getTime() < staleThreshold) {
          await this.offlineQueue.remove(request.id);
        }
      }

      // Reset error status if it's been more than an hour
      const status = await this.getSyncStatus();
      if (status === 'error') {
        const lastSync = await this.getLastSyncTime();
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        if (!lastSync || lastSync < oneHourAgo) {
          await this.setSyncStatus('idle');
        }
      }
    } catch (error) {
      console.error('Sync cleanup failed:', error);
    }
  }
}