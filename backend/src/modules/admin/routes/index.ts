import { Express } from 'express';
import { setupOrganizationRoutes } from './organizations.routes';
import { setupUserRoutes } from './users.routes';
import { setupCanonicalRoutes } from './canonical-full.routes';
import { setupAPIKeyRoutes } from './api-keys.routes';

export function setupAdminRoutes(app: Express, apiPrefix: string): void {
  const adminPrefix = `${apiPrefix}/admin`;
  
  setupOrganizationRoutes(app, adminPrefix);
  setupUserRoutes(app, adminPrefix);
  setupCanonicalRoutes(app, adminPrefix);
  setupAPIKeyRoutes(app, adminPrefix);
}

export default setupAdminRoutes; 