import { Express } from 'express';
import { setupAudienceSegmentsRoutes } from './audience-segments.routes';
import { setupAudienceInsightsRoutes } from './audience-insights.routes';
import { setupAudienceTargetingRoutes } from './audience-targeting.routes';
import { setupAudienceOptimizationRoutes } from './audience-optimization.routes';

export function setupAudienceManagementRoutes(app: Express, apiPrefix: string): void {
  const audiencePrefix = `${apiPrefix}/audience-management`;
  
  setupAudienceSegmentsRoutes(app, audiencePrefix);
  setupAudienceInsightsRoutes(app, audiencePrefix);
  setupAudienceTargetingRoutes(app, audiencePrefix);
  setupAudienceOptimizationRoutes(app, audiencePrefix);
} 