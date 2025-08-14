import { Express } from 'express';
import { setupPerformanceAnalyticsRoutes } from './performance-analytics.routes';
import { setupRevenueAnalyticsRoutes } from './revenue-analytics.routes';
import { setupUserAnalyticsRoutes } from './user-analytics.routes';
import { setupCustomReportsRoutes } from './custom-reports.routes';
import { setupRealTimeAnalyticsRoutes } from './realtime-analytics.routes';

export function setupAnalyticsReportingRoutes(app: Express, apiPrefix: string): void {
  const analyticsPrefix = `${apiPrefix}/analytics-reporting`;
  
  setupPerformanceAnalyticsRoutes(app, analyticsPrefix);
  setupRevenueAnalyticsRoutes(app, analyticsPrefix);
  setupUserAnalyticsRoutes(app, analyticsPrefix);
  setupCustomReportsRoutes(app, analyticsPrefix);
  setupRealTimeAnalyticsRoutes(app, analyticsPrefix);
} 