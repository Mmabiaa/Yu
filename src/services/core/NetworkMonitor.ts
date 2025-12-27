import { NetworkMonitor, NetworkStatus, ConnectionType, NetworkDetails } from '../../types/cache';

export class NetworkMonitorImpl implements NetworkMonitor {
  private listeners: ((status: NetworkStatus) => void)[] = [];
  private currentStatus: NetworkStatus | null = null;
  private isMonitoring = false;
  private checkInterval: NodeJS.Timeout | null = null;

  async getStatus(): Promise<NetworkStatus> {
    try {
      // Simple connectivity check using fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const status: NetworkStatus = {
        isConnected: true,
        connectionType: 'unknown', // We can't determine type without NetInfo
        isInternetReachable: true,
      };
      
      this.currentStatus = status;
      return status;
    } catch (error) {
      const status: NetworkStatus = {
        isConnected: false,
        connectionType: 'none',
        isInternetReachable: false,
      };
      
      this.currentStatus = status;
      return status;
    }
  }

  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    
    // Check connectivity every 30 seconds
    this.checkInterval = setInterval(async () => {
      const status = await this.getStatus();
      const previousStatus = this.currentStatus;

      // Only notify if status actually changed
      if (!previousStatus || this.hasStatusChanged(previousStatus, status)) {
        this.notifyListeners(status);
      }
    }, 30000) as any;

    // Initial check
    this.getStatus().then(status => {
      this.notifyListeners(status);
    });
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  onStatusChange(callback: (status: NetworkStatus) => void): void {
    this.listeners.push(callback);
  }

  offStatusChange(callback: (status: NetworkStatus) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Additional utility methods
  isOnline(): boolean {
    return this.currentStatus?.isConnected ?? false;
  }

  isWifi(): boolean {
    return this.currentStatus?.connectionType === 'wifi';
  }

  isCellular(): boolean {
    return this.currentStatus?.connectionType === 'cellular';
  }

  getConnectionQuality(): 'poor' | 'good' | 'excellent' | 'unknown' {
    if (!this.currentStatus?.isConnected) {
      return 'poor';
    }

    // Without NetInfo, we can't determine quality, so return unknown
    return 'unknown';
  }

  private hasStatusChanged(previous: NetworkStatus, current: NetworkStatus): boolean {
    return (
      previous.isConnected !== current.isConnected ||
      previous.connectionType !== current.connectionType ||
      previous.isInternetReachable !== current.isInternetReachable
    );
  }

  private notifyListeners(status: NetworkStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('NetworkMonitor listener error:', error);
      }
    });
  }

  // Cleanup method
  destroy(): void {
    this.stopMonitoring();
    this.listeners = [];
    this.currentStatus = null;
  }
}