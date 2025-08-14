import { Express } from 'express';
import { setupCampaignRoutes } from './campaigns.routes';
import { setupAdsRoutes } from './ads.routes';
import { setupAudiencesRoutes } from './audiences.routes';
import { setupAnalyticsRoutes } from './analytics.routes';

export function setupAdvertiserRoutes(app: Express, apiPrefix: string): void {
  const advertiserPrefix = `${apiPrefix}/advertiser`;
  
  setupCampaignRoutes(app, advertiserPrefix);
  setupAdsRoutes(app, advertiserPrefix);
  setupAudiencesRoutes(app, advertiserPrefix);
  setupAnalyticsRoutes(app, advertiserPrefix);
} 