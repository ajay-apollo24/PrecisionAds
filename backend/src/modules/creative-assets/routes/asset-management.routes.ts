import { Express, Request, Response } from 'express';
import { AssetManagementService } from '../services/asset-management.service';
import { AssetFilters, UpdateAssetData } from '../types/asset.types';

interface AssetRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
  };
}

export function setupAssetManagementRoutes(app: Express, prefix: string): void {
  console.log(`Setting up asset management routes at ${prefix}`);
  
  const assetService = new AssetManagementService();
  
  // Test endpoint to verify routes are working
  app.get(`${prefix}/test`, (req: Request, res: Response) => {
    console.log('Creative assets test endpoint hit');
    res.json({ 
      message: 'Creative Assets API is working!',
      prefix,
      timestamp: new Date().toISOString()
    });
  });

  // Get all assets for an organization
  app.get(`${prefix}/assets`, async (req: AssetRequest, res: Response) => {
    console.log('GET /assets endpoint hit', { 
      query: req.query, 
      headers: req.headers 
    });
    
    try {
      const { page = 1, limit = 20, status, mimeType, search } = req.query;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const filters: AssetFilters = {};
      if (status) filters.status = status as any;
      if (mimeType) filters.mimeType = mimeType as string;
      if (search) filters.search = search as string;

      const result = await assetService.getAssets(
        organizationId,
        filters,
        Number(page),
        Number(limit)
      );

      res.json(result);
    } catch (error) {
      console.error('Error getting assets:', error);
      res.status(500).json({ 
        error: 'Failed to get assets',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get asset by ID
  app.get(`${prefix}/assets/:assetId`, async (req: AssetRequest, res: Response) => {
    try {
      const { assetId } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const asset = await assetService.getAssetById(assetId, organizationId);
      
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      res.json(asset);
    } catch (error) {
      console.error('Error getting asset:', error);
      res.status(500).json({ 
        error: 'Failed to get asset',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update asset
  app.put(`${prefix}/assets/:assetId`, async (req: AssetRequest, res: Response) => {
    try {
      const { assetId } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;
      const updateData: UpdateAssetData = req.body;

      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const updatedAsset = await assetService.updateAsset(
        assetId,
        organizationId,
        updateData
      );

      res.json(updatedAsset);
    } catch (error) {
      console.error('Error updating asset:', error);
      res.status(500).json({ 
        error: 'Failed to update asset',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete asset
  app.delete(`${prefix}/assets/:assetId`, async (req: AssetRequest, res: Response) => {
    try {
      const { assetId } = req.params;
      const organizationId = req.user.organizationId;

      await assetService.deleteAsset(assetId, organizationId);

      res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({ 
        error: 'Failed to delete asset',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Archive asset
  app.post(`${prefix}/assets/:assetId/archive`, async (req: AssetRequest, res: Response) => {
    try {
      const { assetId } = req.params;
      const organizationId = req.user.organizationId;

      const archivedAsset = await assetService.archiveAsset(assetId, organizationId);

      res.json(archivedAsset);
    } catch (error) {
      console.error('Error archiving asset:', error);
      res.status(500).json({ 
        error: 'Failed to archive asset',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Restore asset
  app.post(`${prefix}/assets/:assetId/restore`, async (req: AssetRequest, res: Response) => {
    try {
      const { assetId } = req.params;
      const organizationId = req.user.organizationId;

      const restoredAsset = await assetService.restoreAsset(assetId, organizationId);

      res.json(restoredAsset);
    } catch (error) {
      console.error('Error restoring asset:', error);
      res.status(500).json({ 
        error: 'Failed to restore asset',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get asset statistics
  app.get(`${prefix}/assets/stats`, async (req: AssetRequest, res: Response) => {
    try {
      const organizationId = req.user.organizationId;

      const stats = await assetService.getAssetStats(organizationId);

      res.json(stats);
    } catch (error) {
      console.error('Error getting asset stats:', error);
      res.status(500).json({ 
        error: 'Failed to get asset stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Search assets
  app.get(`${prefix}/assets/search`, async (req: AssetRequest, res: Response) => {
    try {
      const { q, limit = 10 } = req.query;
      const organizationId = req.user.organizationId;

      if (!q) {
        return res.status(400).json({ error: 'Search query required' });
      }

      const assets = await assetService.searchAssets(
        organizationId,
        q as string,
        Number(limit)
      );

      res.json({ assets, query: q, total: assets.length });
    } catch (error) {
      console.error('Error searching assets:', error);
      res.status(500).json({ 
        error: 'Failed to search assets',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
} 