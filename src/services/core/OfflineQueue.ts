import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineQueue, QueuedRequest, RequestPriority } from '../../types/cache';

export class OfflineQueueImpl implements OfflineQueue {
  private queue: QueuedRequest[] = [];
  private storageKey = 'offline_queue';
  private isProcessing = false;
  private maxRetries = 3;
  private retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s

  constructor() {
    this.loadQueue();
  }

  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: this.generateId(),
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: request.maxRetries || this.maxRetries,
    };

    this.queue.push(queuedRequest);
    this.sortQueueByPriority();
    await this.saveQueue();

    return queuedRequest.id;
  }

  async dequeue(): Promise<QueuedRequest | null> {
    if (this.queue.length === 0) {
      return null;
    }

    const request = this.queue.shift()!;
    await this.saveQueue();
    return request;
  }

  async peek(): Promise<QueuedRequest | null> {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  async remove(id: string): Promise<boolean> {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(request => request.id !== id);
    
    if (this.queue.length !== initialLength) {
      await this.saveQueue();
      return true;
    }
    
    return false;
  }

  async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  async getSize(): Promise<number> {
    return this.queue.length;
  }

  async getAll(): Promise<QueuedRequest[]> {
    return [...this.queue];
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const request = await this.peek();
        if (!request) {
          break;
        }

        try {
          await this.executeRequest(request);
          await this.dequeue(); // Remove successful request
        } catch (error) {
          console.error('Failed to execute queued request:', error);
          
          // Handle retry logic
          request.retryCount++;
          
          if (request.retryCount >= request.maxRetries) {
            // Max retries reached, remove from queue
            await this.dequeue();
            console.warn(`Request ${request.id} failed after ${request.maxRetries} retries`);
          } else {
            // Wait before retrying
            const delay = this.getRetryDelay(request.retryCount);
            await this.sleep(delay);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Get requests by priority
  async getRequestsByPriority(priority: RequestPriority): Promise<QueuedRequest[]> {
    return this.queue.filter(request => request.priority === priority);
  }

  // Get failed requests (those that have been retried)
  async getFailedRequests(): Promise<QueuedRequest[]> {
    return this.queue.filter(request => request.retryCount > 0);
  }

  // Get requests older than specified time
  async getStaleRequests(maxAge: number): Promise<QueuedRequest[]> {
    const cutoff = new Date(Date.now() - maxAge);
    return this.queue.filter(request => request.timestamp < cutoff);
  }

  // Clean up stale requests
  async cleanupStaleRequests(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    const staleRequests = await this.getStaleRequests(maxAge);
    
    for (const request of staleRequests) {
      await this.remove(request.id);
    }
    
    return staleRequests.length;
  }

  private async executeRequest(request: QueuedRequest): Promise<void> {
    const { url, method, headers, data } = request;

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.queue = parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        this.sortQueueByPriority();
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private sortQueueByPriority(): void {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    
    this.queue.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // Then by timestamp (older first)
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRetryDelay(retryCount: number): number {
    const index = Math.min(retryCount - 1, this.retryDelays.length - 1);
    return this.retryDelays[index];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}