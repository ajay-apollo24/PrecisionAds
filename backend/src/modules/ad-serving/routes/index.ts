import { Express } from 'express';
import { setupAdServingRoutes } from './ad-serving.routes';

export function setupAdServingRoutes(app: Express, apiPrefix: string): void {
  const adServingPrefix = `${apiPrefix}/ad-serving`;
  
  setupAdServingRoutes(app, adServingPrefix);
} 