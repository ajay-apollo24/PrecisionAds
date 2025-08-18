import { SiteService } from '../../../../src/modules/publisher/services/site.service';
import { prisma } from '../../../../src/shared/database/prisma';
import { createError } from '../../../../src/shared/middleware/error-handler';

// Mock Prisma
jest.mock('../../../../src/shared/database/prisma', () => ({
  prisma: {
    site: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    adUnit: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    performanceMetrics: {
      findMany: jest.fn(),
    },
  },
}));

// Mock error handler
jest.mock('../../../../src/shared/middleware/error-handler', () => ({
  createError: jest.fn(),
}));

describe('SiteService', () => {
  let siteService: SiteService;
  let mockPrisma: any;
  let mockCreateError: any;

  beforeEach(() => {
    jest.clearAllMocks();
    siteService = new SiteService();
    mockPrisma = prisma;
    mockCreateError = createError;
  });

  describe('getSites', () => {
    it('should return sites with pagination', async () => {
      const mockSites = [
        { id: 'site-1', name: 'Site 1', url: 'https://site1.com', status: 'ACTIVE' },
        { id: 'site-2', name: 'Site 2', url: 'https://site2.com', status: 'ACTIVE' },
      ];

      (mockPrisma.site.findMany as jest.Mock).mockResolvedValue(mockSites);
      (mockPrisma.site.count as jest.Mock).mockResolvedValue(2);

      const result = await siteService.getSites({ page: 1, limit: 10 });

      expect(result.sites).toEqual(mockSites);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should handle empty sites', async () => {
      (mockPrisma.site.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.site.count as jest.Mock).mockResolvedValue(0);

      const result = await siteService.getSites({ page: 1, limit: 10 });

      expect(result.sites).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('createSite', () => {
    it('should create a site successfully', async () => {
      const mockSiteData = { name: 'New Site', url: 'https://newsite.com' };
      const mockCreatedSite = { id: 'site-new', ...mockSiteData, status: 'ACTIVE' };

      (mockPrisma.site.create as jest.Mock).mockResolvedValue(mockCreatedSite);

      const result = await siteService.createSite(mockSiteData);

      expect(result).toEqual(mockCreatedSite);
      expect(mockPrisma.site.create).toHaveBeenCalledWith({
        data: mockSiteData,
      });
    });
  });

  describe('getSiteById', () => {
    it('should return site by id', async () => {
      const mockSite = { id: 'site-1', name: 'Site 1', url: 'https://site1.com', status: 'ACTIVE' };

      (mockPrisma.site.findFirst as jest.Mock).mockResolvedValue(mockSite);

      const result = await siteService.getSiteById('site-1');

      expect(result).toEqual(mockSite);
      expect(mockPrisma.site.findFirst).toHaveBeenCalledWith({
        where: { id: 'site-1' },
      });
    });

    it('should return null when site not found', async () => {
      (mockPrisma.site.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await siteService.getSiteById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('updateSite', () => {
    it('should update site successfully', async () => {
      const mockUpdateData = { name: 'Updated Site' };
      const mockUpdatedSite = { id: 'site-1', ...mockUpdateData, url: 'https://site1.com', status: 'ACTIVE' };

      (mockPrisma.site.update as jest.Mock).mockResolvedValue(mockUpdatedSite);

      const result = await siteService.updateSite('site-1', mockUpdateData);

      expect(result).toEqual(mockUpdatedSite);
      expect(mockPrisma.site.update).toHaveBeenCalledWith({
        where: { id: 'site-1' },
        data: mockUpdateData,
      });
    });
  });

  describe('deleteSite', () => {
    it('should delete site successfully', async () => {
      (mockPrisma.site.delete as jest.Mock).mockResolvedValue({ id: 'site-1' });

      const result = await siteService.deleteSite('site-1');

      expect(result).toEqual({ id: 'site-1' });
      expect(mockPrisma.site.delete).toHaveBeenCalledWith({
        where: { id: 'site-1' },
      });
    });
  });

  describe('getSiteStats', () => {
    it('should return site statistics', async () => {
      (mockPrisma.adUnit.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.performanceMetrics.findMany as jest.Mock).mockResolvedValue([
        { impressions: 1000, clicks: 50, revenue: 100 },
      ]);

      const result = await siteService.getSiteStats('site-1');

      expect(result.totalAdUnits).toBe(5);
      expect(result.performance).toBeDefined();
    });
  });
}); 