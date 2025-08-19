import { Request, Response } from 'express';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { createError } from '../../../shared/middleware/error-handler';

const prisma = new PrismaClient();
const prefix = '/advertiser';

interface CustomError {
  message: string;
  statusCode?: number;
}

// User Profile Settings
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        organizationId 
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        timezone: true,
        language: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({ user });
  } catch (error: unknown) {
    const customError = error as CustomError;
    if (customError.statusCode) {
      res.status(customError.statusCode).json({ error: customError.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;
    const { firstName, lastName, phone, timezone, language } = req.body;

    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    // Validate timezone
    const validTimezones = [
      'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 
      'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo'
    ];
    
    if (timezone && !validTimezones.includes(timezone)) {
      throw createError('Invalid timezone', 400);
    }

    // Validate language
    const validLanguages = ['en', 'es', 'fr', 'de', 'ja'];
    if (language && !validLanguages.includes(language)) {
      throw createError('Invalid language', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { 
        id: userId,
        organizationId 
      },
      data: {
        firstName,
        lastName,
        phone,
        timezone,
        language,
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        timezone: true,
        language: true,
        updatedAt: true
      }
    });

    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser 
    });
  } catch (error: unknown) {
    const customError = error as CustomError;
    if (customError.statusCode) {
      res.status(customError.statusCode).json({ error: customError.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;
    const { currentPassword, newPassword } = req.body;

    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    if (!currentPassword || !newPassword) {
      throw createError('Current and new password required', 400);
    }

    if (newPassword.length < 8) {
      throw createError('Password must be at least 8 characters long', 400);
    }

    // In a real implementation, you would:
    // 1. Verify current password hash
    // 2. Hash new password
    // 3. Update password hash in database
    
    // For now, we'll simulate the password change
    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        organizationId 
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Simulate password update (in real app, hash the password)
    await prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error: unknown) {
    const customError = error as CustomError;
    if (customError.statusCode) {
      res.status(customError.statusCode).json({ error: customError.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Campaign Preferences
export const getCampaignPreferences = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    // Get or create default preferences
    let preferences = await prisma.userPreferences.findFirst({
      where: { 
        userId,
        organizationId 
      }
    });

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.userPreferences.create({
        data: {
          userId,
          organizationId,
          defaultBidStrategy: 'TARGET_CPC',
          defaultBudgetType: 'DAILY',
          defaultDailyBudget: 100,
          autoOptimization: true,
          minCTR: 1.0,
          maxCPC: 2.0,
          minConversionRate: 2.0
        }
      });
    }

    res.json({ preferences });
  } catch (error: unknown) {
    const customError = error as CustomError;
    if (customError.statusCode) {
      res.status(customError.statusCode).json({ error: customError.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateCampaignPreferences = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;
    const {
      defaultBidStrategy,
      defaultBudgetType,
      defaultDailyBudget,
      autoOptimization,
      minCTR,
      maxCPC,
      minConversionRate
    } = req.body;

    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    // Validate bid strategy
    const validBidStrategies = ['TARGET_CPC', 'TARGET_CPM', 'TARGET_CPA', 'MANUAL'];
    if (defaultBidStrategy && !validBidStrategies.includes(defaultBidStrategy)) {
      throw createError('Invalid bid strategy', 400);
    }

    // Validate budget type
    const validBudgetTypes = ['DAILY', 'LIFETIME'];
    if (defaultBudgetType && !validBudgetTypes.includes(defaultBudgetType)) {
      throw createError('Invalid budget type', 400);
    }

    // Validate numeric values
    if (defaultDailyBudget && defaultDailyBudget < 1) {
      throw createError('Daily budget must be at least $1', 400);
    }

    if (minCTR && minCTR < 0) {
      throw createError('Minimum CTR cannot be negative', 400);
    }

    if (maxCPC && maxCPC < 0) {
      throw createError('Maximum CPC cannot be negative', 400);
    }

    if (minConversionRate && minConversionRate < 0) {
      throw createError('Minimum conversion rate cannot be negative', 400);
    }

    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { 
        userId_organizationId: {
          userId,
          organizationId
        }
      },
      update: {
        defaultBidStrategy,
        defaultBudgetType,
        defaultDailyBudget,
        autoOptimization,
        minCTR,
        maxCPC,
        minConversionRate,
        updatedAt: new Date()
      },
      create: {
        userId,
        organizationId,
        defaultBidStrategy,
        defaultBudgetType,
        defaultDailyBudget,
        autoOptimization,
        minCTR,
        maxCPC,
        minConversionRate
      }
    });

    res.json({ 
      message: 'Campaign preferences updated successfully',
      preferences: updatedPreferences 
    });
  } catch (error: unknown) {
    const customError = error as CustomError;
    if (customError.statusCode) {
      res.status(customError.statusCode).json({ error: customError.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Notification Settings
export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    // Get or create default notification settings
    let settings = await prisma.userNotificationSettings.findFirst({
      where: { 
        userId,
        organizationId 
      }
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.userNotificationSettings.create({
        data: {
          userId,
          organizationId,
          emailCampaignUpdates: true,
          emailPerformanceAlerts: true,
          emailBudgetWarnings: true,
          emailWeeklyReports: true,
          pushRealTimeAlerts: true,
          pushMilestoneAchievements: true,
          pushSystemMaintenance: false,
          smsCriticalAlerts: false,
          smsBudgetExceeded: true
        }
      });
    }

    res.json({ settings });
  } catch (error: unknown) {
    const customError = error as CustomError;
    if (customError.statusCode) {
      res.status(customError.statusCode).json({ error: customError.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;
    const {
      emailCampaignUpdates,
      emailPerformanceAlerts,
      emailBudgetWarnings,
      emailWeeklyReports,
      pushRealTimeAlerts,
      pushMilestoneAchievements,
      pushSystemMaintenance,
      smsCriticalAlerts,
      smsBudgetExceeded
    } = req.body;

    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    const updatedSettings = await prisma.userNotificationSettings.upsert({
      where: { 
        userId_organizationId: {
          userId,
          organizationId
        }
      },
      update: {
        emailCampaignUpdates,
        emailPerformanceAlerts,
        emailBudgetWarnings,
        emailWeeklyReports,
        pushRealTimeAlerts,
        pushMilestoneAchievements,
        pushSystemMaintenance,
        smsCriticalAlerts,
        smsBudgetExceeded,
        updatedAt: new Date()
      },
      create: {
        userId,
        organizationId,
        emailCampaignUpdates,
        emailPerformanceAlerts,
        emailBudgetWarnings,
        emailWeeklyReports,
        pushRealTimeAlerts,
        pushMilestoneAchievements,
        pushSystemMaintenance,
        smsCriticalAlerts,
        smsBudgetExceeded
      }
    });

    res.json({ 
      message: 'Notification settings updated successfully',
      settings: updatedSettings 
    });
  } catch (error: unknown) {
    const customError = error as CustomError;
    if (customError.statusCode) {
      res.status(customError.statusCode).json({ error: customError.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Security Settings
export const getSecuritySettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;

    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    // Get or create default security settings
    let settings = await prisma.userSecuritySettings.findFirst({
      where: { 
        userId,
        organizationId 
      }
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.userSecuritySettings.create({
        data: {
          userId,
          organizationId,
          twoFactorEnabled: false,
          sessionTimeout: 30,
          apiKeyRotation: true
        }
      });
    }

    res.json({ settings });
  } catch (error: unknown) {
    const customError = error as CustomError;
    if (customError.statusCode) {
      res.status(customError.statusCode).json({ error: customError.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateSecuritySettings = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const organizationId = req.headers['x-organization-id'] as string;
    const {
      twoFactorEnabled,
      sessionTimeout,
      apiKeyRotation
    } = req.body;

    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    // Validate session timeout
    const validTimeouts = [15, 30, 60, 120, 480];
    if (sessionTimeout && !validTimeouts.includes(sessionTimeout)) {
      throw createError('Invalid session timeout value', 400);
    }

    const updatedSettings = await prisma.userSecuritySettings.upsert({
      where: { 
        userId_organizationId: {
          userId,
          organizationId
        }
      },
      update: {
        twoFactorEnabled,
        sessionTimeout,
        apiKeyRotation,
        updatedAt: new Date()
      },
      create: {
        userId,
        organizationId,
        twoFactorEnabled,
        sessionTimeout,
        apiKeyRotation
      }
    });

    res.json({ 
      message: 'Security settings updated successfully',
      settings: updatedSettings 
    });
  } catch (error: unknown) {
    const customError = error as CustomError;
    if (customError.statusCode) {
      res.status(customError.statusCode).json({ error: customError.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Data Export
export const exportData = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { type, format, startDate, endDate } = req.query;
    const organizationId = req.headers['x-organization-id'] as string;

    if (!organizationId) {
      throw createError('Organization ID required', 400);
    }

    if (!type || !['campaigns', 'analytics', 'audiences'].includes(type as string)) {
      throw createError('Invalid export type', 400);
    }

    if (!format || !['csv', 'json', 'excel'].includes(format as string)) {
      throw createError('Invalid export format', 400);
    }

    let data: any = {};

    switch (type) {
      case 'campaigns':
        data = await prisma.advertiserCampaign.findMany({
          where: { organizationId },
          include: {
            ads: true,
            audiences: true
          }
        });
        break;

      case 'analytics':
        // Get analytics data for the date range
        const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate as string) : new Date();
        
        data = await prisma.analyticsEvent.findMany({
          where: {
            organizationId,
            timestamp: {
              gte: start,
              lte: end
            }
          }
        });
        break;

      case 'audiences':
        data = await prisma.advertiserAudience.findMany({
          where: { organizationId },
          include: {
            campaign: true
          }
        });
        break;
    }

    // In a real implementation, you would:
    // 1. Format data according to the requested format
    // 2. Generate file (CSV, Excel, etc.)
    // 3. Stream file to response or save to cloud storage

    res.json({ 
      message: `${type} data exported successfully`,
      data,
      format,
      recordCount: Array.isArray(data) ? data.length : 0
    });
  } catch (error: unknown) {
    const customError = error as CustomError;
    if (customError.statusCode) {
      res.status(customError.statusCode).json({ error: customError.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Setup function to register all settings routes
export function setupSettingsRoutes(app: Express, prefix: string): void {
  // User Profile Routes
  app.get(`${prefix}/settings/profile/:userId`, getUserProfile);
  app.put(`${prefix}/settings/profile/:userId`, updateUserProfile);
  app.post(`${prefix}/settings/profile/:userId/password`, changePassword);

  // Campaign Preferences Routes
  app.get(`${prefix}/settings/preferences/:userId`, getCampaignPreferences);
  app.put(`${prefix}/settings/preferences/:userId`, updateCampaignPreferences);

  // Notification Settings Routes
  app.get(`${prefix}/settings/notifications/:userId`, getNotificationSettings);
  app.put(`${prefix}/settings/notifications/:userId`, updateNotificationSettings);

  // Security Settings Routes
  app.get(`${prefix}/settings/security/:userId`, getSecuritySettings);
  app.put(`${prefix}/settings/security/:userId`, updateSecuritySettings);

  // Data Export Routes
  app.get(`${prefix}/settings/export/:userId`, exportData);
} 