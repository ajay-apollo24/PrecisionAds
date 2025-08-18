import { authService } from './auth.service';

export interface WebSocketMessage {
  type: 'campaign_update' | 'analytics_update' | 'notification' | 'performance_alert' | 'ping' | 'pong';
  data: any;
  timestamp: string;
}

export interface WebSocketCallbacks {
  onCampaignUpdate?: (data: any) => void;
  onAnalyticsUpdate?: (data: any) => void;
  onNotification?: (data: any) => void;
  onPerformanceAlert?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export class FrontendWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private callbacks: WebSocketCallbacks = {};
  private isConnecting = false;
  private shouldReconnect = true;

  constructor(private baseUrl: string) {}

  // Connect to WebSocket server
  async connect(callbacks: WebSocketCallbacks = {}) {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    this.callbacks = callbacks;

    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('No user information available');
      }

      const wsUrl = `${this.baseUrl.replace('http', 'ws')}/ws?token=${token}`;
      this.ws = new WebSocket(wsUrl);

      this.setupEventHandlers();
      this.startHeartbeat();

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.callbacks.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.isConnecting = false;
      this.stopHeartbeat();
      this.callbacks.onDisconnect?.();
      
      if (this.shouldReconnect) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.callbacks.onError?.(error);
    };
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'campaign_update':
        this.callbacks.onCampaignUpdate?.(message.data);
        break;
      
      case 'analytics_update':
        this.callbacks.onAnalyticsUpdate?.(message.data);
        break;
      
      case 'notification':
        this.callbacks.onNotification?.(message.data);
        break;
      
      case 'performance_alert':
        this.callbacks.onPerformanceAlert?.(message.data);
        break;
      
      case 'pong':
        // Heartbeat response, no action needed
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect(this.callbacks);
      }
    }, delay);
  }

  // Send message to server
  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Disconnect from WebSocket server
  disconnect() {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  // Get connection status
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (this.isConnecting) return 'connecting';
    if (this.ws?.readyState === WebSocket.OPEN) return 'connected';
    if (this.ws?.readyState === WebSocket.CLOSED) return 'disconnected';
    return 'error';
  }

  // Check if connected
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
const wsBaseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
export const wsService = new FrontendWebSocketService(wsBaseUrl); 