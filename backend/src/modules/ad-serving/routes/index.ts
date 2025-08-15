import { Express } from 'express';
import { setupAdServingRoutes as setupRoutes } from './ad-serving.routes';

export function setupAdServingRoutes(app: Express, apiPrefix: string): void {
  const adServingPrefix = `${apiPrefix}/ad-serving`;
  
  setupRoutes(app, adServingPrefix);
} 