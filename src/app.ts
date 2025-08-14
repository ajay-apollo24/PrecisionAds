import { Express } from 'express';
import { setupPublisherRoutes } from './modules/publisher/routes';
import { setupAdvertiserRoutes } from './modules/advertiser/routes';
import { setupAdServingRoutes } from './modules/ad-serving/routes';
import { setupSharedRoutes } from './shared/routes';

export function setupRoutes(app: Express): void {
  // API version prefix
  const apiPrefix = '/api/v1';

  // Setup module routes
  setupPublisherRoutes(app, apiPrefix);
  setupAdvertiserRoutes(app, apiPrefix);
  setupAdServingRoutes(app, apiPrefix);
  setupSharedRoutes(app, apiPrefix);

  // API documentation endpoint
  app.get(`${apiPrefix}/docs`, (req, res) => {
    res.json({
      message: 'Precision Ads API Documentation',
      version: '1.0.0',
      endpoints: {
        publisher: `${apiPrefix}/publisher`,
        advertiser: `${apiPrefix}/advertiser`,
        adServing: `${apiPrefix}/ad-serving`,
        shared: `${apiPrefix}/shared`
      }
    });
  });
} 