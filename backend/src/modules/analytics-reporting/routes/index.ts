import { Express } from 'express';
import { setupPerformanceAnalyticsRoutes } from './performance-analytics.routes';
import { setupCampaignAnalyticsRoutes } from './campaign-analytics.routes';

export function setupAnalyticsReportingRoutes(app: Express, apiPrefix: string): void {
  const analyticsPrefix = `${apiPrefix}/analytics-reporting`;
  
  setupPerformanceAnalyticsRoutes(app, analyticsPrefix);
  setupCampaignAnalyticsRoutes(app, analyticsPrefix);
} 