import { Express, Request, Response } from 'express';
import { setupPublisherRoutes } from './modules/publisher/routes';
import { setupAdvertiserRoutes } from './modules/advertiser/routes';
import { setupAdServingRoutes } from './modules/ad-serving/routes';
import { setupAudienceManagementRoutes } from './modules/audience-management/routes';
import { setupAnalyticsReportingRoutes } from './modules/analytics-reporting/routes';
import { setupAdvancedAdAlgorithmsRoutes } from './modules/advanced-ad-algorithms/routes';
import { setupAdminRoutes } from './modules/admin/routes';
import { setupSharedRoutes } from './shared/routes';
import { enhancedLoggerMiddleware, enhancedLogger404Handler } from './shared/middleware/enhanced-logger';

export function setupRoutes(app: Express): void {
  // API version prefix
  const apiPrefix = '/api/v1';

  // Add enhanced logging middleware
  app.use(enhancedLoggerMiddleware);

  // Setup core module routes
  setupPublisherRoutes(app, apiPrefix);
  setupAdvertiserRoutes(app, apiPrefix);
  setupAdServingRoutes(app, apiPrefix);
  
  // Setup advanced module routes
  setupAudienceManagementRoutes(app, apiPrefix);
  setupAnalyticsReportingRoutes(app, apiPrefix);
  setupAdvancedAdAlgorithmsRoutes(app, apiPrefix);
  
  // Setup admin routes
  setupAdminRoutes(app, apiPrefix);
  
  // Setup shared routes
  setupSharedRoutes(app, apiPrefix);

  // API documentation endpoint
  app.get(`${apiPrefix}/docs`, (req: Request, res: Response) => {
    res.json({
      message: 'Precision Ads API Documentation',
      version: '1.0.0',
      endpoints: {
        publisher: `${apiPrefix}/publisher`,
        advertiser: `${apiPrefix}/advertiser`,
        adServing: `${apiPrefix}/ad-serving`,
        audienceManagement: `${apiPrefix}/audience-management`,
        analyticsReporting: `${apiPrefix}/analytics-reporting`,
        advancedAlgorithms: `${apiPrefix}/advanced-algorithms`,
        admin: `${apiPrefix}/admin`,
        shared: `${apiPrefix}/shared`
      },
      features: {
        core: ['Publisher Management', 'Advertiser Management', 'Ad Serving'],
        advanced: [
          'Audience Management & Segmentation',
          'Advanced Analytics & Reporting',
          'Retargeting Algorithms',
          'Real-Time Bidding (RTB)',
          'Programmatic Advertising',
          'Predictive Bidding',
          'AI-Powered Optimization'
        ]
      }
    });
  });
} 