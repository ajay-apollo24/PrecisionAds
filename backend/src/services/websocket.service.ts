import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  organizationId?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: 'campaign_update' | 'analytics_update' | 'notification' | 'performance_alert' | 'ping' | 'pong';
  data: any;
  timestamp: string;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private organizationClients: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, request) => {
      this.handleConnection(ws, request);
    });
  }

  private async handleConnection(ws: AuthenticatedWebSocket, request: Request) {
    try {
      // Extract token from query parameters or headers
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const token = url.searchParams.get('token') || request.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      ws.userId = decoded.userId;
      ws.organizationId = decoded.organizationId;
      ws.isAlive = true;

      // Store client connection
      const clientId = `${ws.organizationId}:${ws.userId}`;
      this.clients.set(clientId, ws);

      // Add to organization group
      if (!this.organizationClients.has(ws.organizationId)) {
        this.organizationClients.set(ws.organizationId, new Set());
      }
      this.organizationClients.get(ws.organizationId)!.add(clientId);

      console.log(`WebSocket connected: ${clientId}`);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'notification',
        data: { message: 'Connected to real-time updates' },
        timestamp: new Date().toISOString()
      });

      // Setup event handlers
      ws.on('message', (data) => this.handleMessage(ws, data));
      ws.on('close', () => this.handleDisconnection(clientId, ws.organizationId!));
      ws.on('error', (error) => this.handleError(clientId, error));
      ws.on('pong', () => { ws.isAlive = true; });

    } catch (error) {
      console.error('WebSocket authentication failed:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: WebSocket.Data) {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'ping':
          this.sendToClient(ws, {
            type: 'pong',
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString()
          });
          break;
        
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private handleDisconnection(clientId: string, organizationId: string) {
    this.clients.delete(clientId);
    
    const orgClients = this.organizationClients.get(organizationId);
    if (orgClients) {
      orgClients.delete(clientId);
      if (orgClients.size === 0) {
        this.organizationClients.delete(organizationId);
      }
    }
    
    console.log(`WebSocket disconnected: ${clientId}`);
  }

  private handleError(clientId: string, error: Error) {
    console.error(`WebSocket error for ${clientId}:`, error);
    this.clients.delete(clientId);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  // Send message to specific client
  private sendToClient(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Send message to all clients in an organization
  public sendToOrganization(organizationId: string, message: WebSocketMessage) {
    const orgClients = this.organizationClients.get(organizationId);
    if (!orgClients) return;

    orgClients.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, message);
      }
    });
  }

  // Send message to specific user
  public sendToUser(organizationId: string, userId: string, message: WebSocketMessage) {
    const clientId = `${organizationId}:${userId}`;
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      this.sendToClient(client, message);
    }
  }

  // Broadcast campaign updates
  public async broadcastCampaignUpdate(organizationId: string, campaignId: string) {
    try {
      const campaign = await prisma.advertiserCampaign.findUnique({
        where: { id: campaignId },
        include: {
          ads: true,
          audiences: true
        }
      });

      if (campaign) {
        this.sendToOrganization(organizationId, {
          type: 'campaign_update',
          data: { campaign },
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error broadcasting campaign update:', error);
    }
  }

  // Broadcast analytics updates
  public async broadcastAnalyticsUpdate(organizationId: string) {
    try {
      // Get latest analytics summary
      const campaigns = await prisma.advertiserCampaign.findMany({
        where: { organizationId },
        select: {
          id: true,
          name: true,
          status: true,
          budget: true,
          totalSpent: true,
          impressions: true,
          clicks: true
        }
      });

      const totalBudget = campaigns.reduce((sum, c) => sum + Number(c.budget), 0);
      const totalSpent = campaigns.reduce((sum, c) => sum + Number(c.totalSpent), 0);
      const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
      const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);

      const analytics = {
        summary: {
          totalCampaigns: campaigns.length,
          activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
          totalBudget,
          totalSpent,
          totalImpressions,
          totalClicks,
          overallCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
          overallConversionRate: 2.5, // This would come from conversion tracking
          overallCPM: totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0,
          overallCPC: totalClicks > 0 ? totalSpent / totalClicks : 0,
          overallCPA: 0 // This would come from conversion tracking
        },
        campaigns: campaigns.slice(0, 5) // Top 5 campaigns
      };

      this.sendToOrganization(organizationId, {
        type: 'analytics_update',
        data: { analytics },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error broadcasting analytics update:', error);
    }
  }

  // Send performance alerts
  public async sendPerformanceAlert(organizationId: string, userId: string, alert: any) {
    this.sendToUser(organizationId, userId, {
      type: 'performance_alert',
      data: { alert },
      timestamp: new Date().toISOString()
    });
  }

  // Send notification
  public async sendNotification(organizationId: string, userId: string, notification: any) {
    this.sendToUser(organizationId, userId, {
      type: 'notification',
      data: { notification },
      timestamp: new Date().toISOString()
    });
  }

  // Get connection stats
  public getStats() {
    return {
      totalConnections: this.clients.size,
      organizationConnections: Object.fromEntries(
        Array.from(this.organizationClients.entries()).map(([org, clients]) => [
          org,
          clients.size
        ])
      )
    };
  }

  // Cleanup
  public cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
  }
}

export let wsService: WebSocketService;

export function initializeWebSocketService(server: Server) {
  wsService = new WebSocketService(server);
  return wsService;
} 