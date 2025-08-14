import { Express } from 'express';
import { setupRetargetingRoutes } from './retargeting.routes';
import { setupRTBRoutes } from './rtb.routes';
import { setupProgrammaticRoutes } from './programmatic.routes';
import { setupPredictiveBiddingRoutes } from './predictive-bidding.routes';
import { setupAIOptimizationRoutes } from './ai-optimization.routes';

export function setupAdvancedAdAlgorithmsRoutes(app: Express, apiPrefix: string): void {
  const algorithmsPrefix = `${apiPrefix}/advanced-algorithms`;
  
  setupRetargetingRoutes(app, algorithmsPrefix);
  setupRTBRoutes(app, algorithmsPrefix);
  setupProgrammaticRoutes(app, algorithmsPrefix);
  setupPredictiveBiddingRoutes(app, algorithmsPrefix);
  setupAIOptimizationRoutes(app, algorithmsPrefix);
} 