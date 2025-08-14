import { Request, Response } from 'express';
import { SiteService } from '../services/site.service';
import { createError } from '../../../shared/middleware/error-handler';
import { SiteFilters, PublisherSiteStatus } from '../types/site.types';

export class SiteController {
  private siteService: SiteService;

  constructor() {
    this.siteService = new SiteService();
  }

  /**
   * Get all sites for an organization
   */
  async getSites(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      const { status, domain } = req.query;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const filters: SiteFilters = {
        status: status as PublisherSiteStatus,
        domain: domain as string
      };

      const sites = await this.siteService.getSites(organizationId, filters);
      res.json({ sites });
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        res.status((error as any).statusCode).json({ error: (error as any).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  /**
   * Get a single site by ID
   */
  async getSiteById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const site = await this.siteService.getSiteById(id, organizationId);
      
      if (!site) {
        throw createError('Site not found', 404);
      }

      res.json({ site });
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        res.status((error as any).statusCode).json({ error: (error as any).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  /**
   * Create a new site
   */
  async createSite(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      const { name, domain, settings } = req.body;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      if (!name || !domain) {
        throw createError('Name and domain are required', 400);
      }

      const site = await this.siteService.createSite(
        { name, domain, settings },
        organizationId
      );

      res.status(201).json({
        message: 'Site created successfully',
        site
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        res.status((error as any).statusCode).json({ error: (error as any).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  /**
   * Update an existing site
   */
  async updateSite(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;
      const updateData = req.body;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const site = await this.siteService.updateSite(id, updateData, organizationId);

      res.json({
        message: 'Site updated successfully',
        site
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        res.status((error as any).statusCode).json({ error: (error as any).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  /**
   * Delete a site
   */
  async deleteSite(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const site = await this.siteService.deleteSite(id, organizationId);

      res.json({
        message: 'Site deleted successfully',
        site
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        res.status((error as any).statusCode).json({ error: (error as any).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  /**
   * Get site statistics
   */
  async getSiteStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const organizationId = req.headers['x-organization-id'] as string;
      const { startDate, endDate } = req.query;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const stats = await this.siteService.getSiteStats(id, organizationId, start, end);

      res.json({ stats });
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        res.status((error as any).statusCode).json({ error: (error as any).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  /**
   * Get top performing sites
   */
  async getTopPerformingSites(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      const { limit = 5 } = req.query;

      if (!organizationId) {
        throw createError('Organization ID required', 400);
      }

      const sites = await this.siteService.getTopPerformingSites(
        organizationId,
        Number(limit)
      );

      res.json({ sites });
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        res.status((error as any).statusCode).json({ error: (error as any).message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
} 