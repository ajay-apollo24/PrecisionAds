import { AdService } from '../../../../src/modules/advertiser/services/ad.service';
import { prisma } from '../../../../src/shared/database/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { JsonValue } from '@prisma/client/runtime/library';

// Mock Prisma
jest.mock('../../../../src/shared/database/prisma', () => ({
  prisma: {
    advertiserAd: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    advertiserCampaign: {
      findFirst: jest.fn()
    }
  }
}));

describe('AdService', () => {
  let adService: AdService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    adService = new AdService();
    jest.clearAllMocks();
  });

  describe('getAds', () => {
    it('should return ads for a campaign', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const mockAds = [
        {
          id: 'ad-1',
          organizationId,
          campaignId: 'campaign-1',
          name: 'Test Ad 1',
          creativeType: 'IMAGE' as const,
          creativeUrl: 'https://example.com/ad1.jpg',
          landingPageUrl: 'https://example.com/landing1',
          status: 'ACTIVE' as const,
          weight: 100,
          targeting: { age: '18-25', location: 'US' } as JsonValue,
          impressions: 1000,
          clicks: 50,
          conversions: 5,
          ctr: new Decimal(0.05),
          cpc: new Decimal(2.0),
          cpm: new Decimal(10.0),
          createdAt: new Date(),
          updatedAt: new Date(),
          campaign: {
            id: 'campaign-1',
            name: 'Test Campaign',
            status: 'ACTIVE',
            type: 'DISPLAY'
          }
        }
      ];

      (mockPrisma.advertiserAd.findMany as jest.Mock).mockResolvedValue(mockAds);

      const result = await adService.getAds(campaignId, organizationId);

      expect(result).toEqual(mockAds);
      expect(mockPrisma.advertiserAd.findMany).toHaveBeenCalledWith({
        where: { campaignId, organizationId },
        include: {
          campaign: {
            select: { id: true, name: true, status: true, type: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should apply filters when provided', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const filters = { status: 'ACTIVE' as const, creativeType: 'IMAGE' as const };
      const mockAds: any[] = [];

      (mockPrisma.advertiserAd.findMany as jest.Mock).mockResolvedValue(mockAds);

      await adService.getAds(campaignId, organizationId, filters);

      expect(mockPrisma.advertiserAd.findMany).toHaveBeenCalledWith({
        where: { campaignId, organizationId, status: 'ACTIVE', creativeType: 'IMAGE' },
        include: {
          campaign: {
            select: { id: true, name: true, status: true, type: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('getAdById', () => {
    it('should return an ad by ID', async () => {
      const adId = 'ad-123';
      const organizationId = 'org-123';
      const mockAd = {
        id: adId,
        organizationId,
        campaignId: 'campaign-1',
        name: 'Test Ad',
        creativeType: 'IMAGE' as const,
        creativeUrl: 'https://example.com/ad.jpg',
        landingPageUrl: 'https://example.com/landing',
        status: 'ACTIVE' as const,
        weight: 100,
        targeting: { age: '18-25', location: 'US' } as JsonValue,
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        ctr: new Decimal(0.05),
        cpc: new Decimal(2.0),
        cpm: new Decimal(10.0),
        createdAt: new Date(),
        updatedAt: new Date(),
        campaign: {
          id: 'campaign-1',
          name: 'Test Campaign',
          status: 'ACTIVE',
          type: 'DISPLAY'
        }
      };

      (mockPrisma.advertiserAd.findFirst as jest.Mock).mockResolvedValue(mockAd);

      const result = await adService.getAdById(adId, organizationId);

      expect(result).toEqual(mockAd);
      expect(mockPrisma.advertiserAd.findFirst).toHaveBeenCalledWith({
        where: { id: adId, organizationId },
        include: {
          campaign: {
            select: { id: true, name: true, status: true, type: true }
          }
        }
      });
    });

    it('should return null for non-existent ad', async () => {
      const adId = 'non-existent';
      const organizationId = 'org-123';

      (mockPrisma.advertiserAd.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await adService.getAdById(adId, organizationId);

      expect(result).toBeNull();
    });
  });

  describe('createAd', () => {
    it('should create a new ad', async () => {
      const organizationId = 'org-123';
      const adData = {
        campaignId: 'campaign-1',
        name: 'New Ad',
        creativeType: 'IMAGE' as const,
        creativeUrl: 'https://example.com/new-ad.jpg',
        landingPageUrl: 'https://example.com/new-landing',
        weight: 100,
        targeting: { age: '18-25', location: 'US' } as JsonValue
      };

      const mockCreatedAd = {
        id: 'ad-new',
        organizationId,
        campaignId: 'campaign-1',
        name: 'New Ad',
        creativeType: 'IMAGE' as const,
        creativeUrl: 'https://example.com/new-ad.jpg',
        landingPageUrl: 'https://example.com/new-landing',
        status: 'DRAFT' as const,
        weight: 100,
        targeting: { age: '18-25', location: 'US' } as JsonValue,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: new Decimal(0),
        cpc: new Decimal(0),
        cpm: new Decimal(0),
        createdAt: new Date(),
        updatedAt: new Date(),
        campaign: {
          id: 'campaign-1',
          name: 'Test Campaign',
          status: 'ACTIVE',
          type: 'DISPLAY'
        }
      };

      (mockPrisma.advertiserAd.create as jest.Mock).mockResolvedValue(mockCreatedAd);
      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue({
        id: 'campaign-1',
        name: 'Test Campaign',
        status: 'ACTIVE',
        type: 'DISPLAY'
      });

      const result = await adService.createAd(adData, organizationId);

      expect(result).toEqual(mockCreatedAd);
      expect(mockPrisma.advertiserAd.create).toHaveBeenCalledWith({
        data: {
          ...adData,
          organizationId,
          status: 'DRAFT',
          targeting: adData.targeting as any
        }
      });
    });
  });

  describe('updateAd', () => {
    it('should update an existing ad', async () => {
      const adId = 'ad-123';
      const organizationId = 'org-123';
      const updateData = {
        name: 'Updated Ad',
        status: 'ACTIVE' as const
      };

      const mockUpdatedAd = {
        id: adId,
        organizationId,
        campaignId: 'campaign-1',
        name: 'Updated Ad',
        creativeType: 'IMAGE' as const,
        creativeUrl: 'https://example.com/ad.jpg',
        landingPageUrl: 'https://example.com/landing',
        status: 'ACTIVE' as const,
        weight: 100,
        targeting: { age: '18-25', location: 'US' } as JsonValue,
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        ctr: new Decimal(0.05),
        cpc: new Decimal(2.0),
        cpm: new Decimal(10.0),
        createdAt: new Date(),
        updatedAt: new Date(),
        campaign: {
          id: 'campaign-1',
          name: 'Test Campaign',
          status: 'ACTIVE',
          type: 'DISPLAY'
        }
      };

      (mockPrisma.advertiserAd.update as jest.Mock).mockResolvedValue(mockUpdatedAd);
      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue({
        id: 'campaign-1',
        name: 'Test Campaign',
        status: 'ACTIVE',
        type: 'DISPLAY'
      });

      const result = await adService.updateAd(adId, updateData, organizationId);

      expect(result).toEqual(mockUpdatedAd);
      expect(mockPrisma.advertiserAd.update).toHaveBeenCalledWith({
        where: { id: adId, organizationId },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('deleteAd', () => {
    it('should soft delete an ad by setting status to REJECTED', async () => {
      const adId = 'ad-123';
      const organizationId = 'org-123';

      const mockDeletedAd = {
        id: adId,
        organizationId,
        campaignId: 'campaign-1',
        name: 'Test Ad',
        creativeType: 'IMAGE' as const,
        creativeUrl: 'https://example.com/ad.jpg',
        landingPageUrl: 'https://example.com/landing',
        status: 'REJECTED' as const,
        weight: 100,
        targeting: { age: '18-25', location: 'US' } as JsonValue,
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        ctr: new Decimal(0.05),
        cpc: new Decimal(2.0),
        cpm: new Decimal(10.0),
        createdAt: new Date(),
        updatedAt: new Date(),
        campaign: {
          id: 'campaign-1',
          name: 'Test Campaign',
          status: 'ACTIVE',
          type: 'DISPLAY'
        }
      };

      (mockPrisma.advertiserAd.update as jest.Mock).mockResolvedValue(mockDeletedAd);

      const result = await adService.deleteAd(adId, organizationId);

      expect(result).toEqual(mockDeletedAd);
      expect(mockPrisma.advertiserAd.update).toHaveBeenCalledWith({
        where: { id: adId, organizationId },
        data: {
          status: 'REJECTED',
          updatedAt: expect.any(Date)
        },
        include: {
          campaign: {
            select: { id: true, name: true, status: true, type: true }
          }
        }
      });
    });
  });

  describe('getAdStats', () => {
    it('should return ad statistics', async () => {
      const adId = 'ad-123';
      const organizationId = 'org-123';

      const mockAd = {
        id: adId,
        organizationId,
        campaignId: 'campaign-1',
        name: 'Test Ad',
        creativeType: 'IMAGE' as const,
        creativeUrl: 'https://example.com/ad.jpg',
        landingPageUrl: 'https://example.com/landing',
        status: 'ACTIVE' as const,
        weight: 100,
        targeting: { age: '18-25', location: 'US' } as JsonValue,
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        ctr: new Decimal(0.05),
        cpc: new Decimal(2.0),
        cpm: new Decimal(10.0),
        createdAt: new Date(),
        updatedAt: new Date(),
        campaign: {
          id: 'campaign-1',
          name: 'Test Campaign',
          status: 'ACTIVE',
          type: 'DISPLAY'
        }
      };

      (mockPrisma.advertiserAd.findFirst as jest.Mock).mockResolvedValue(mockAd);

      const result = await adService.getAdStats(adId, organizationId);

      expect(result).toEqual({
        totalImpressions: 1000,
        totalClicks: 50,
        totalConversions: 5,
        ctr: 0.05,
        cpc: 2.0,
        cpm: 10.0,
        conversionRate: 10 // 5/50 * 100 = 10%
      });
    });
  });
}); 