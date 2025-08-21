import { Express } from 'express';
import { setupAssetUploadRoutes } from './asset-upload.routes';
import { setupAssetManagementRoutes } from './asset-management.routes';

export function setupCreativeAssetRoutes(app: Express, prefix: string): void {
  // Setup all creative asset routes
  setupAssetUploadRoutes(app, `${prefix}/creative-assets`);
  setupAssetManagementRoutes(app, `${prefix}/creative-assets`);
} 