import { SiteService } from '../../../../src/modules/publisher/services/site.service';
import { prisma } from '../../../../src/shared/database/prisma';

// Mock Prisma
jest.mock('../../../../src/shared/database/prisma', () => ({
  prisma: {
    publisherSite: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    adUnit: {
      count: jest.fn(),
    },
    adRequest: {
      count: jest.fn(),
    },
    publisherEarning: {
      aggregate: jest.fn(),
    },
  },
}));

describe('SiteService', () => {
  let siteService: SiteService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    siteService = new SiteService();
    mockPrisma = prisma;
  });

  describe('getSites', () => {
    it('should return sites for organization', async () => {
      const mockSites = [
        {
          id: 'site-1',
          name: 'Site 1',
          status: 'ACTIVE',
          url: 'https://site1.com',
          domain: 'site1.com',
          organizationId: 'org-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: undefined,
          adUnits: [],
          earnings: []
        },
        {
          id: 'site-2',
          name: 'Site 2',
          status: 'ACTIVE',
          url: 'https://site2.com',
          domain: 'site2.com',
          organizationId: 'org-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: undefined,
          adUnits: [],
          earnings: []
        }
      ];

      (mockPrisma.publisherSite.findMany as jest.Mock).mockResolvedValue(mockSites);

      const result = await siteService.getSites('org-1');

      expect(result).toEqual(mockSites);
      expect(mockPrisma.publisherSite.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        include: {
          adUnits: {
            where: { status: 'ACTIVE' },
            select: { id: true, name: true, format: true, status: true }
          },
          earnings: {
            orderBy: { date: 'desc' },
            take: 7,
            select: { date: true, revenue: true, impressions: true, clicks: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should handle empty sites', async () => {
      (mockPrisma.publisherSite.findMany as jest.Mock).mockResolvedValue([]);

      const result = await siteService.getSites('org-1');

      expect(result).toEqual([]);
    });

    it('should apply filters when provided', async () => {
      const mockSites = [{
        id: 'site-1',
        name: 'Site 1',
        status: 'ACTIVE',
        domain: 'site1.com',
        organizationId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        url: 'https://site1.com',
        settings: undefined,
        adUnits: [],
        earnings: []
      }];
      (mockPrisma.publisherSite.findMany as jest.Mock).mockResolvedValue(mockSites);

      const result = await siteService.getSites('org-1', { status: 'ACTIVE', domain: 'site1' });

      expect(result).toEqual(mockSites);
      expect(mockPrisma.publisherSite.findMany).toHaveBeenCalledWith({
        where: { 
          organizationId: 'org-1',
          status: 'ACTIVE',
          domain: { contains: 'site1', mode: 'insensitive' }
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('createSite', () => {
    it('should create a site successfully', async () => {
      const mockSiteData = { name: 'New Site', url: 'https://newsite.com', domain: 'newsite.com' };
      const mockCreatedSite = {
        id: 'site-new',
        name: 'New Site',
        url: 'https://newsite.com',
        domain: 'newsite.com',
        status: 'PENDING',
        organizationId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: undefined,
        adUnits: [],
        earnings: []
      };

      (mockPrisma.publisherSite.create as jest.Mock).mockResolvedValue(mockCreatedSite);

      const result = await siteService.createSite(mockSiteData, 'org-1');

      expect(result).toEqual(mockCreatedSite);
      expect(mockPrisma.publisherSite.create).toHaveBeenCalledWith({
        data: {
          ...mockSiteData,
          organizationId: 'org-1',
          status: 'PENDING'
        }
      });
    });
  });

  describe('getSiteById', () => {
    it('should return site by id', async () => {
      const mockSite = {
        id: 'site-1',
        name: 'Site 1',
        url: 'https://site1.com',
        status: 'ACTIVE',
        domain: 'site1.com',
        organizationId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: undefined,
        adUnits: [],
        earnings: []
      };

      (mockPrisma.publisherSite.findFirst as jest.Mock).mockResolvedValue(mockSite);

      const result = await siteService.getSiteById('site-1', 'org-1');

      expect(result).toEqual(mockSite);
      expect(mockPrisma.publisherSite.findFirst).toHaveBeenCalledWith({
        where: { id: 'site-1', organizationId: 'org-1' },
        include: {
          adUnits: true,
          earnings: {
            orderBy: { date: 'desc' },
            take: 30
          }
        }
      });
    });

    it('should return null for non-existent site', async () => {
      (mockPrisma.publisherSite.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await siteService.getSiteById('invalid-id', 'org-1');

      expect(result).toBeNull();
    });
  });

  describe('updateSite', () => {
    it('should update site successfully', async () => {
      const mockUpdateData = { name: 'Updated Site' };
      const mockUpdatedSite = {
        id: 'site-1',
        name: 'Updated Site',
        status: 'ACTIVE',
        domain: 'site1.com',
        organizationId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        url: 'https://site1.com',
        settings: undefined,
        adUnits: [],
        earnings: []
      };

      (mockPrisma.publisherSite.update as jest.Mock).mockResolvedValue(mockUpdatedSite);

      const result = await siteService.updateSite('site-1', mockUpdateData, 'org-1');

      expect(result).toEqual(mockUpdatedSite);
      expect(mockPrisma.publisherSite.update).toHaveBeenCalledWith({
        where: { id: 'site-1', organizationId: 'org-1' },
        data: {
          ...mockUpdateData,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('deleteSite', () => {
    it('should soft delete site by setting status to INACTIVE', async () => {
      const mockDeletedSite = {
        id: 'site-1',
        status: 'INACTIVE',
        name: 'Site 1',
        domain: 'site1.com',
        organizationId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        url: 'https://site1.com',
        settings: undefined,
        adUnits: [],
        earnings: []
      };

      (mockPrisma.publisherSite.update as jest.Mock).mockResolvedValue(mockDeletedSite);

      const result = await siteService.deleteSite('site-1', 'org-1');

      expect(result).toEqual(mockDeletedSite);
      expect(mockPrisma.publisherSite.update).toHaveBeenCalledWith({
        where: { id: 'site-1', organizationId: 'org-1' },
        data: { 
          status: 'INACTIVE',
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('getSiteStats', () => {
    it('should return site statistics', async () => {
      const mockAggregateResult = {
        _sum: {
          impressions: 1000,
          clicks: 50,
          revenue: 100
        }
      };

      (mockPrisma.publisherEarning.aggregate as jest.Mock).mockResolvedValue(mockAggregateResult);
      (mockPrisma.adUnit.count as jest.Mock).mockResolvedValue(5);
      (mockPrisma.adRequest.count as jest.Mock).mockResolvedValue(1200);

      const result = await siteService.getSiteStats('site-1', 'org-1');

      expect(result.totalImpressions).toBe(1000);
      expect(result.totalClicks).toBe(50);
      expect(result.totalRevenue).toBe(100);
      expect(result.activeAdUnits).toBe(5);
      expect(result.totalAdRequests).toBe(1200);
      expect(result.ctr).toBe(5); // (50/1000) * 100
    });

    it('should handle zero impressions for CTR calculation', async () => {
      const mockAggregateResult = {
        _sum: {
          impressions: 0,
          clicks: 0,
          revenue: 0
        }
      };

      (mockPrisma.publisherEarning.aggregate as jest.Mock).mockResolvedValue(mockAggregateResult);
      (mockPrisma.adUnit.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.adRequest.count as jest.Mock).mockResolvedValue(0);

      const result = await siteService.getSiteStats('site-1', 'org-1');

      expect(result.ctr).toBe(0);
    });
  });

  describe('getTopPerformingSites', () => {
    it('should return top performing sites', async () => {
      const mockSites = [
        {
          id: 'site-1',
          name: 'Site 1',
          earnings: [
            { revenue: 100, impressions: 1000, clicks: 50 }
          ]
        },
        {
          id: 'site-2',
          name: 'Site 2',
          earnings: [
            { revenue: 200, impressions: 2000, clicks: 100 }
          ]
        }
      ];

      (mockPrisma.publisherSite.findMany as jest.Mock).mockResolvedValue(mockSites);

      const result = await siteService.getTopPerformingSites('org-1', 2);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('site-2'); // Higher performance score
      expect(result[1].id).toBe('site-1'); // Lower performance score
      expect(result[0]).toHaveProperty('performanceScore');
    });
  });
}); 