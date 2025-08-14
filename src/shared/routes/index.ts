import { Express } from 'express';
import { setupAuthRoutes } from './auth.routes';

export function setupSharedRoutes(app: Express, apiPrefix: string): void {
  setupAuthRoutes(app, `${apiPrefix}/auth`);
} 