import { PrismaClient } from '@prisma/client';
import { wsService } from './websocket.service';

const prisma = new PrismaClient();

export interface NotificationData {
  id: string;
  type: 'campaign_update' | 'performance_alert' | 'budget_warning' | 'system_maintenance' | 'milestone_achievement';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  organizationId: string;
  userId?: string;
  campaignId?: string;
  metadata?: any;
  createdAt: Date;
}

export interface PerformanceAlert {
  type: 'low_ctr' | 'high_budget_utilization' | 'spending_spike' | 'performance_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  campaignId?: string;
  organizationId: string;
  metadata: any;
}

export class NotificationService {
  
  // Send real-time notification via WebSocket
  async sendRealTimeNotification(notification: NotificationData) {
    try {
      if (wsService) {
        if (notification.userId) {
          // Send to specific user
          await wsService.sendNotification(
            notification.organizationId,
            notification.userId,
            notification
          );
        } else {
          // Send to all users in organization
          await wsService.sendToOrganization(
            notification.organizationId,
            {
              type: 'notification',
              data: { notification },
              timestamp: new Date().toISOString()
            }
          );
        }
      }
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }

  // Check for performance alerts and send notifications
  async checkPerformanceAlerts(organizationId: string) {
    try {
      const campaigns = await prisma.advertiserCampaign.findMany({
        where: { 
          organizationId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          name: true,
          budget: true,
          totalSpent: true,
          impressions: true,
          clicks: true
        }
      });

      const alerts: PerformanceAlert[] = [];

      for (const campaign of campaigns) {
        // Check for low CTR
        if (campaign.impressions > 1000) {
          const ctr = (campaign.clicks / campaign.impressions) * 100;
          if (ctr < 1.0) {
            alerts.push({
              type: 'low_ctr',
              severity: ctr < 0.5 ? 'critical' : ctr < 0.8 ? 'high' : 'medium',
              title: 'Low CTR Alert',
              message: `Campaign "${campaign.name}" has CTR of ${ctr.toFixed(2)}%`,
              campaignId: campaign.id,
              organizationId,
              metadata: { ctr, threshold: 1.0 }
            });
          }
        }

        // Check for high budget utilization
        if (campaign.budget > 0) {
          const utilization = (Number(campaign.totalSpent) / Number(campaign.budget)) * 100;
          if (utilization > 80) {
            alerts.push({
              type: 'high_budget_utilization',
              severity: utilization > 95 ? 'critical' : utilization > 90 ? 'high' : 'medium',
              title: 'High Budget Utilization',
              message: `Campaign "${campaign.name}" has used ${utilization.toFixed(1)}% of budget`,
              campaignId: campaign.id,
              organizationId,
              metadata: { utilization, threshold: 80 }
            });
          }
        }
      }

      // Send alerts
      for (const alert of alerts) {
        await this.sendPerformanceAlert(alert);
      }

      return alerts;
    } catch (error) {
      console.error('Error checking performance alerts:', error);
      return [];
    }
  }

  // Send performance alert
  async sendPerformanceAlert(alert: PerformanceAlert) {
    try {
      // Get users who should receive this alert
      const users = await prisma.user.findMany({
        where: { 
          organizationId: alert.organizationId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          notificationSettings: {
            select: {
              emailPerformanceAlerts: true,
              pushRealTimeAlerts: true
            }
          }
        }
      });

      for (const user of users) {
        if (user.notificationSettings?.pushRealTimeAlerts) {
          // Send real-time alert
          await this.sendRealTimeNotification({
            id: `alert_${Date.now()}_${Math.random()}`,
            type: 'performance_alert',
            title: alert.title,
            message: alert.message,
            severity: alert.severity,
            organizationId: alert.organizationId,
            userId: user.id,
            campaignId: alert.campaignId,
            metadata: alert.metadata,
            createdAt: new Date()
          });
        }

        if (user.notificationSettings?.emailPerformanceAlerts) {
          // Send email notification (would integrate with email service)
          await this.sendEmailNotification(user.id, alert);
        }
      }
    } catch (error) {
      console.error('Error sending performance alert:', error);
    }
  }

  // Send campaign update notification
  async sendCampaignUpdateNotification(
    organizationId: string,
    campaignId: string,
    updateType: 'created' | 'updated' | 'status_changed' | 'budget_updated'
  ) {
    try {
      const campaign = await prisma.advertiserCampaign.findUnique({
        where: { id: campaignId },
        select: { name: true, status: true }
      });

      if (!campaign) return;

      const messages = {
        created: 'Campaign created successfully',
        updated: 'Campaign updated',
        status_changed: `Campaign status changed to ${campaign.status}`,
        budget_updated: 'Campaign budget updated'
      };

      const notification: NotificationData = {
        id: `campaign_${updateType}_${Date.now()}`,
        type: 'campaign_update',
        title: 'Campaign Update',
        message: `${campaign.name}: ${messages[updateType]}`,
        severity: 'low',
        organizationId,
        campaignId,
        metadata: { updateType, campaignName: campaign.name },
        createdAt: new Date()
      };

      await this.sendRealTimeNotification(notification);

      // Broadcast campaign update to all connected clients
      if (wsService) {
        await wsService.broadcastCampaignUpdate(organizationId, campaignId);
      }
    } catch (error) {
      console.error('Error sending campaign update notification:', error);
    }
  }

  // Send milestone achievement notification
  async sendMilestoneNotification(
    organizationId: string,
    userId: string,
    milestone: 'budget_reached' | 'impression_target' | 'click_target' | 'conversion_target',
    campaignId?: string
  ) {
    try {
      const campaign = campaignId ? await prisma.advertiserCampaign.findUnique({
        where: { id: campaignId },
        select: { name: true }
      }) : null;

      const messages = {
        budget_reached: 'Budget milestone reached',
        impression_target: 'Impression target achieved',
        click_target: 'Click target achieved',
        conversion_target: 'Conversion target achieved'
      };

      const notification: NotificationData = {
        id: `milestone_${milestone}_${Date.now()}`,
        type: 'milestone_achievement',
        title: 'Milestone Achieved!',
        message: campaign ? 
          `${campaign.name}: ${messages[milestone]}` : 
          messages[milestone],
        severity: 'low',
        organizationId,
        userId,
        campaignId,
        metadata: { milestone, campaignName: campaign?.name },
        createdAt: new Date()
      };

      await this.sendRealTimeNotification(notification);
    } catch (error) {
      console.error('Error sending milestone notification:', error);
    }
  }

  // Send system maintenance notification
  async sendSystemMaintenanceNotification(
    organizationId: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    try {
      const notification: NotificationData = {
        id: `maintenance_${Date.now()}`,
        type: 'system_maintenance',
        title: 'System Maintenance',
        message,
        severity,
        organizationId,
        metadata: { maintenanceType: 'system' },
        createdAt: new Date()
      };

      await this.sendRealTimeNotification(notification);
    } catch (error) {
      console.error('Error sending system maintenance notification:', error);
    }
  }

  // Send budget warning notification
  async sendBudgetWarningNotification(
    organizationId: string,
    campaignId: string,
    utilization: number
  ) {
    try {
      const campaign = await prisma.advertiserCampaign.findUnique({
        where: { id: campaignId },
        select: { name: true }
      });

      if (!campaign) return;

      const notification: NotificationData = {
        id: `budget_warning_${Date.now()}`,
        type: 'budget_warning',
        title: 'Budget Warning',
        message: `Campaign "${campaign.name}" has used ${utilization.toFixed(1)}% of budget`,
        severity: utilization > 95 ? 'critical' : utilization > 90 ? 'high' : 'medium',
        organizationId,
        campaignId,
        metadata: { utilization, threshold: 80 },
        createdAt: new Date()
      };

      await this.sendRealTimeNotification(notification);
    } catch (error) {
      console.error('Error sending budget warning notification:', error);
    }
  }

  // Send email notification (placeholder for email service integration)
  private async sendEmailNotification(userId: string, alert: PerformanceAlert) {
    // This would integrate with an email service like SendGrid, AWS SES, etc.
    console.log(`Email notification sent to user ${userId}: ${alert.title}`);
  }

  // Get notification history for a user
  async getNotificationHistory(userId: string, organizationId: string, limit: number = 50) {
    try {
      // In a real implementation, you would store notifications in a database
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string, userId: string) {
    try {
      // In a real implementation, you would update the notification status
      console.log(`Notification ${notificationId} marked as read by user ${userId}`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
}

export const notificationService = new NotificationService(); 