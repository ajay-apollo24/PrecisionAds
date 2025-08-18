import { CampaignService } from '../../../../src/modules/advertiser/services/campaign.service';
import { prisma } from '../../../../src/shared/database/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Mock Prisma
jest.mock('../../../../src/shared/database/prisma', () => ({
  prisma: {
    advertiserCampaign: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('CampaignService', () => {
  let campaignService: CampaignService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    campaignService = new CampaignService();
    jest.clearAllMocks();
  });

  describe('getCampaigns', () => {
    it('should return campaigns for an organization', async () => {
      const organizationId = 'org-123';
      const mockCampaigns = [
        {
          id: 'campaign-1',
          organizationId,
          name: 'Test Campaign 1',
          status: 'ACTIVE' as const,
          type: 'DISPLAY' as const,
          startDate: new Date(),
          endDate: null,
          budget: new Decimal(1000),
          budgetType: 'DAILY' as const,
          bidStrategy: 'MANUAL' as const,
          targetCPM: null,
          targetCPC: null,
          targetCPA: null,
          dailyBudget: new Decimal(100),
          totalSpent: new Decimal(500),
          impressions: 1000,
          clicks: 50,
          conversions: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          ads: [],
          audiences: []
        }
      ];

      (mockPrisma.advertiserCampaign.findMany as jest.Mock).mockResolvedValue(mockCampaigns);

      const result = await campaignService.getCampaigns(organizationId);

      expect(result).toEqual(mockCampaigns);
      expect(mockPrisma.advertiserCampaign.findMany).toHaveBeenCalledWith({
        where: { organizationId },
        include: {
          ads: {
            where: { status: 'ACTIVE' },
            select: { id: true, name: true, creativeType: true, status: true }
          },
          audiences: {
            select: { id: true, name: true, description: true, size: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should apply filters when provided', async () => {
      const organizationId = 'org-123';
      const filters = { status: 'ACTIVE' as const, type: 'DISPLAY' as const };
      const mockCampaigns: any[] = [];

      (mockPrisma.advertiserCampaign.findMany as jest.Mock).mockResolvedValue(mockCampaigns);

      await campaignService.getCampaigns(organizationId, filters);

      expect(mockPrisma.advertiserCampaign.findMany).toHaveBeenCalledWith({
        where: { organizationId, status: 'ACTIVE', type: 'DISPLAY' },
        include: {
          ads: {
            where: { status: 'ACTIVE' },
            select: { id: true, name: true, creativeType: true, status: true }
          },
          audiences: {
            select: { id: true, name: true, description: true, size: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('getCampaignById', () => {
    it('should return a campaign by ID', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const mockCampaign = {
        id: campaignId,
        organizationId,
        name: 'Test Campaign',
        status: 'ACTIVE' as const,
        type: 'DISPLAY' as const,
        startDate: new Date(),
        endDate: null,
        budget: new Decimal(1000),
        budgetType: 'DAILY' as const,
        bidStrategy: 'MANUAL' as const,
        targetCPM: null,
        targetCPC: null,
        targetCPA: null,
        dailyBudget: new Decimal(100),
        totalSpent: new Decimal(500),
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        ads: [],
        audiences: []
      };

      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);

      const result = await campaignService.getCampaignById(campaignId, organizationId);

      expect(result).toEqual(mockCampaign);
      expect(mockPrisma.advertiserCampaign.findFirst).toHaveBeenCalledWith({
        where: { id: campaignId, organizationId },
        include: { ads: true, audiences: true }
      });
    });

    it('should return null for non-existent campaign', async () => {
      const campaignId = 'non-existent';
      const organizationId = 'org-123';

      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await campaignService.getCampaignById(campaignId, organizationId);

      expect(result).toBeNull();
    });
  });

  describe('createCampaign', () => {
    it('should create a new campaign', async () => {
      const organizationId = 'org-123';
      const campaignData = {
        name: 'New Campaign',
        type: 'DISPLAY' as const,
        budget: new Decimal(1000),
        budgetType: 'DAILY' as const,
        bidStrategy: 'MANUAL' as const
      };

      const mockCreatedCampaign = {
        id: 'campaign-new',
        organizationId,
        name: 'New Campaign',
        status: 'DRAFT' as const,
        type: 'DISPLAY' as const,
        startDate: null,
        endDate: null,
        budget: new Decimal(1000),
        budgetType: 'DAILY' as const,
        bidStrategy: 'MANUAL' as const,
        targetCPM: null,
        targetCPC: null,
        targetCPA: null,
        dailyBudget: null,
        totalSpent: new Decimal(0),
        impressions: 0,
        clicks: 0,
        conversions: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ads: [],
        audiences: []
      };

      (mockPrisma.advertiserCampaign.create as jest.Mock).mockResolvedValue(mockCreatedCampaign);

      const result = await campaignService.createCampaign(campaignData, organizationId);

      expect(result).toEqual(mockCreatedCampaign);
      expect(mockPrisma.advertiserCampaign.create).toHaveBeenCalledWith({
        data: {
          ...campaignData,
          organizationId,
          status: 'DRAFT'
        }
      });
    });
  });

  describe('updateCampaign', () => {
    it('should update an existing campaign', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const updateData = {
        name: 'Updated Campaign',
        status: 'ACTIVE' as const
      };

      const mockUpdatedCampaign = {
        id: campaignId,
        organizationId,
        name: 'Updated Campaign',
        status: 'ACTIVE' as const,
        type: 'DISPLAY' as const,
        startDate: null,
        endDate: null,
        budget: new Decimal(1000),
        budgetType: 'DAILY' as const,
        bidStrategy: 'MANUAL' as const,
        targetCPM: null,
        targetCPC: null,
        targetCPA: null,
        dailyBudget: null,
        totalSpent: new Decimal(0),
        impressions: 0,
        clicks: 0,
        conversions: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ads: [],
        audiences: []
      };

      (mockPrisma.advertiserCampaign.update as jest.Mock).mockResolvedValue(mockUpdatedCampaign);

      const result = await campaignService.updateCampaign(campaignId, updateData, organizationId);

      expect(result).toEqual(mockUpdatedCampaign);
      expect(mockPrisma.advertiserCampaign.update).toHaveBeenCalledWith({
        where: { id: campaignId, organizationId },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        },
        include: { ads: true, audiences: true }
      });
    });
  });

  describe('deleteCampaign', () => {
    it('should soft delete a campaign by setting status to CANCELLED', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';

      const mockDeletedCampaign = {
        id: campaignId,
        organizationId,
        name: 'Test Campaign',
        status: 'CANCELLED' as const,
        type: 'DISPLAY' as const,
        startDate: null,
        endDate: null,
        budget: new Decimal(1000),
        budgetType: 'DAILY' as const,
        bidStrategy: 'MANUAL' as const,
        targetCPM: null,
        targetCPC: null,
        targetCPA: null,
        dailyBudget: null,
        totalSpent: new Decimal(0),
        impressions: 0,
        clicks: 0,
        conversions: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ads: [],
        audiences: []
      };

      (mockPrisma.advertiserCampaign.update as jest.Mock).mockResolvedValue(mockDeletedCampaign);

      const result = await campaignService.deleteCampaign(campaignId, organizationId);

      expect(result).toEqual(mockDeletedCampaign);
      expect(mockPrisma.advertiserCampaign.update).toHaveBeenCalledWith({
        where: { id: campaignId, organizationId },
        data: {
          status: 'CANCELLED',
          updatedAt: expect.any(Date)
        },
        include: { ads: true, audiences: true }
      });
    });
  });

  describe('getCampaignStats', () => {
    it('should return campaign statistics', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';

      const mockCampaign = {
        id: campaignId,
        organizationId,
        name: 'Test Campaign',
        status: 'ACTIVE' as const,
        type: 'DISPLAY' as const,
        startDate: null,
        endDate: null,
        budget: new Decimal(1000),
        budgetType: 'DAILY' as const,
        bidStrategy: 'MANUAL' as const,
        targetCPM: null,
        targetCPC: null,
        targetCPA: null,
        dailyBudget: null,
        totalSpent: new Decimal(500),
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        ads: [],
        audiences: []
      };

      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);

      const result = await campaignService.getCampaignStats(campaignId, organizationId);

      expect(result).toEqual({
        totalAds: 0,
        totalSpent: 500,
        totalImpressions: 1000,
        totalClicks: 50,
        totalConversions: 5,
        ctr: 5, // 50/1000 * 100 = 5%
        conversionRate: 10, // 5/50 * 100 = 10%
        cpm: 500, // 500/1000 * 1000 = 500
        cpc: 10, // 500/50 = 10
        cpa: 100 // 500/5 = 100
      });
    });
  });
}); 