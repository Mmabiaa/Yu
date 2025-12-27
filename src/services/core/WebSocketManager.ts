import { getCurrentConfig } from '../../config/environment';

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectAttempts: number;
  reconnectDelay: number;
  maxReconnectDelay: number;
  backoffFactor: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export interface ReconnectPolicy {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  id?: string;
  timestamp?: Date;
}

export type WebSocketEventType = 'open' | 'close' | 'error' | 'message' | 'reconnect' | 'reconnect_failed';

export class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private eventListeners: Map<string, Map<WebSocketEventType, Set<Function>>> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: WebSocketConfig;
  private tokenManager?: any; // Will be injected

  constructor(config?: Partial<WebSocketConfig>) {
    const appConfig = getCurrentConfig();
    this.config = {
      url: appConfig.wsBaseUrl,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      backoffFactor: 2,
      heartbeatInterval: 30000, // 30 seconds
      connectionTimeout: 10000, // 10 seconds
      ...config
    };
  }

  /**
   * Set token manager for authentication
   */
  public setTokenManager(tokenManager: any): void {
    this.tokenManager = tokenManager;
  }

  /**
   * Connect to WebSocket endpoint
   */
  public async connect(endpoint: string, protocols?: string[]): Promise<WebSocket> {
    const fullUrl = `${this.config.url}${endpoint}`;
    const connectionKey = this.getConnectionKey(endpoint);

    // Close existing connection if any
    if (this.connections.has(connectionKey)) {
      await this.disconnect(endpoint);
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Add authentication token to URL if available
        const wsUrl = await this.buildAuthenticatedUrl(fullUrl);
        
        const ws = new WebSocket(wsUrl, protocols || this.config.protocols);
        
        // Set connection timeout
        const timeoutId = setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }, this.config.connectionTimeout);

        ws.onopen = (event) => {
          clearTimeout(timeoutId);
          console.log(`WebSocket connected to ${endpoint}`);
          
          this.connections.set(connectionKey, ws);
          this.resetReconnectAttempts(connectionKey);
          this.startHeartbeat(connectionKey);
          
          this.emitEvent(connectionKey, 'open', event);
          resolve(ws);
        };

        ws.onclose = (event) => {
          clearTimeout(timeoutId);
          console.log(`WebSocket disconnected from ${endpoint}:`, event.code, event.reason);
          
          this.cleanup(connectionKey);
          this.emitEvent(connectionKey, 'close', event);
          
          // Attempt reconnection if not a clean close
          if (event.code !== 1000 && event.code !== 1001) {
            this.attemptReconnect(endpoint, protocols);
          }
        };

        ws.onerror = (event) => {
          clearTimeout(timeoutId);
          console.error(`WebSocket error on ${endpoint}:`, event);
          
          this.emitEvent(connectionKey, 'error', event);
          reject(new Error(`WebSocket connection failed: ${event}`));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(connectionKey, message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
            this.emitEvent(connectionKey, 'error', new Error('Invalid message format'));
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket endpoint
   */
  public async disconnect(endpoint: string): Promise<void> {
    const connectionKey = this.getConnectionKey(endpoint);
    const ws = this.connections.get(connectionKey);
    
    if (ws) {
      // Clean close
      ws.close(1000, 'Client disconnect');
      this.cleanup(connectionKey);
    }
  }

  /**
   * Send message to WebSocket endpoint
   */
  public send(endpoint: string, data: any): void {
    const connectionKey = this.getConnectionKey(endpoint);
    const ws = this.connections.get(connectionKey);
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error(`WebSocket not connected to ${endpoint}`);
    }

    const message: WebSocketMessage = {
      type: 'message',
      data,
      id: this.generateMessageId(),
      timestamp: new Date()
    };

    ws.send(JSON.stringify(message));
  }

  /**
   * Send typed message to WebSocket endpoint
   */
  public sendMessage(endpoint: string, type: string, data: any): void {
    const connectionKey = this.getConnectionKey(endpoint);
    const ws = this.connections.get(connectionKey);
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error(`WebSocket not connected to ${endpoint}`);
    }

    const message: WebSocketMessage = {
      type,
      data,
      id: this.generateMessageId(),
      timestamp: new Date()
    };

    ws.send(JSON.stringify(message));
  }

  /**
   * Check if connected to endpoint
   */
  public isConnected(endpoint: string): boolean {
    const connectionKey = this.getConnectionKey(endpoint);
    const ws = this.connections.get(connectionKey);
    return ws ? ws.readyState === WebSocket.OPEN : false;
  }

  /**
   * Add event listener
   */
  public on(endpoint: string, event: WebSocketEventType, callback: Function): void {
    const connectionKey = this.getConnectionKey(endpoint);
    
    if (!this.eventListeners.has(connectionKey)) {
      this.eventListeners.set(connectionKey, new Map());
    }
    
    const connectionListeners = this.eventListeners.get(connectionKey)!;
    if (!connectionListeners.has(event)) {
      connectionListeners.set(event, new Set());
    }
    
    connectionListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  public off(endpoint: string, event: WebSocketEventType, callback: Function): void {
    const connectionKey = this.getConnectionKey(endpoint);
    const connectionListeners = this.eventListeners.get(connectionKey);
    
    if (connectionListeners && connectionListeners.has(event)) {
      connectionListeners.get(event)!.delete(callback);
    }
  }

  /**
   * Reconnect to endpoint
   */
  public async reconnect(endpoint: string): Promise<void> {
    await this.disconnect(endpoint);
    await this.connect(endpoint);
  }

  /**
   * Set reconnect policy
   */
  public setReconnectPolicy(policy: ReconnectPolicy): void {
    this.config.reconnectAttempts = policy.maxAttempts;
    this.config.reconnectDelay = policy.initialDelay;
    this.config.maxReconnectDelay = policy.maxDelay;
    this.config.backoffFactor = policy.backoffFactor;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(endpoint: string): string {
    const connectionKey = this.getConnectionKey(endpoint);
    const ws = this.connections.get(connectionKey);
    
    if (!ws) return 'disconnected';
    
    switch (ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }

  /**
   * Disconnect all connections
   */
  public disconnectAll(): void {
    for (const [connectionKey, ws] of this.connections) {
      ws.close(1000, 'Manager shutdown');
      this.cleanup(connectionKey);
    }
  }

  private getConnectionKey(endpoint: string): string {
    return endpoint.replace(/^\//, ''); // Remove leading slash
  }

  private async buildAuthenticatedUrl(url: string): Promise<string> {
    if (!this.tokenManager) {
      return url;
    }

    try {
      const token = await this.tokenManager.getAccessToken();
      if (token) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}token=${encodeURIComponent(token)}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token for WebSocket:', error);
    }

    return url;
  }

  private handleMessage(connectionKey: string, message: WebSocketMessage): void {
    // Handle heartbeat/ping messages
    if (message.type === 'ping') {
      const ws = this.connections.get(connectionKey);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
      }
      return;
    }

    this.emitEvent(connectionKey, 'message', message);
  }

  private emitEvent(connectionKey: string, event: WebSocketEventType, data: any): void {
    const connectionListeners = this.eventListeners.get(connectionKey);
    if (connectionListeners && connectionListeners.has(event)) {
      const listeners = connectionListeners.get(event)!;
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event listener:', error);
        }
      });
    }
  }

  private attemptReconnect(endpoint: string, protocols?: string[]): void {
    const connectionKey = this.getConnectionKey(endpoint);
    const attempts = this.reconnectAttempts.get(connectionKey) || 0;
    
    if (attempts >= this.config.reconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${endpoint}`);
      this.emitEvent(connectionKey, 'reconnect_failed', { endpoint, attempts });
      return;
    }

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(this.config.backoffFactor, attempts),
      this.config.maxReconnectDelay
    );

    console.log(`Attempting to reconnect to ${endpoint} in ${delay}ms (attempt ${attempts + 1})`);

    const timer = setTimeout(async () => {
      try {
        this.reconnectAttempts.set(connectionKey, attempts + 1);
        await this.connect(endpoint, protocols);
        this.emitEvent(connectionKey, 'reconnect', { endpoint, attempts: attempts + 1 });
      } catch (error) {
        console.error(`Reconnection attempt ${attempts + 1} failed for ${endpoint}:`, error);
        this.attemptReconnect(endpoint, protocols);
      }
    }, delay) as any;

    this.reconnectTimers.set(connectionKey, timer);
  }

  private resetReconnectAttempts(connectionKey: string): void {
    this.reconnectAttempts.set(connectionKey, 0);
    
    const timer = this.reconnectTimers.get(connectionKey);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(connectionKey);
    }
  }

  private startHeartbeat(connectionKey: string): void {
    const timer = setInterval(() => {
      const ws = this.connections.get(connectionKey);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', timestamp: new Date() }));
      } else {
        this.stopHeartbeat(connectionKey);
      }
    }, this.config.heartbeatInterval) as any;

    this.heartbeatTimers.set(connectionKey, timer);
  }

  private stopHeartbeat(connectionKey: string): void {
    const timer = this.heartbeatTimers.get(connectionKey);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(connectionKey);
    }
  }

  private cleanup(connectionKey: string): void {
    this.connections.delete(connectionKey);
    this.stopHeartbeat(connectionKey);
    
    const reconnectTimer = this.reconnectTimers.get(connectionKey);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      this.reconnectTimers.delete(connectionKey);
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}