import { Express } from 'express';
import { setupSiteRoutes } from './sites.routes';
import { setupAdUnitRoutes } from './ad-units.routes';
import { setupAdRequestRoutes } from './ad-requests.routes';
import { setupEarningsRoutes } from './earnings.routes';

export function setupPublisherRoutes(app: Express, apiPrefix: string): void {
  const publisherPrefix = `${apiPrefix}/publisher`;
  
  setupSiteRoutes(app, publisherPrefix);
  setupAdUnitRoutes(app, publisherPrefix);
  setupAdRequestRoutes(app, publisherPrefix);
  setupEarningsRoutes(app, publisherPrefix);
} 