import { BiddingService } from '../../../../src/modules/advertiser/services/bidding.service';
import { prisma } from '../../../../src/shared/database/prisma';

// Mock Prisma
jest.mock('../../../../src/shared/database/prisma', () => ({
  prisma: {
    advertiserCampaign: {
      findFirst: jest.fn()
    },
    adUnit: {
      findFirst: jest.fn()
    },
    advertiserAd: {
      findMany: jest.fn()
    }
  }
}));

describe('BiddingService', () => {
  let biddingService: BiddingService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    biddingService = new BiddingService();
    jest.clearAllMocks();
  });

  describe('calculateOptimalBid', () => {
    it('should calculate optimal bid for a campaign', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const adUnitId = 'ad-unit-123';
      const targetingScore = 0.8;

      const mockCampaign = {
        bidStrategy: 'AUTO_CPC',
        targetCPM: null,
        targetCPC: 2.0,
        targetCPA: null,
        budget: 1000,
        totalSpent: 500
      };

      const mockAdUnit = {
        format: 'BANNER',
        size: '728x90'
      };

      const mockHistoricalData = {
        summary: {
          avgCTR: 0.025,
          avgCPC: 1.50,
          avgCPM: 3.00,
          conversionRate: 0.015,
          totalImpressions: 5000,
          totalClicks: 125,
          totalConversions: 2
        },
        recent: []
      };

      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (mockPrisma.adUnit.findFirst as jest.Mock).mockResolvedValue(mockAdUnit);
      (mockPrisma.advertiserAd.findMany as jest.Mock).mockResolvedValue([]);

      const result = await biddingService.calculateOptimalBid(campaignId, organizationId, adUnitId, targetingScore);

      expect(result).toBeDefined();
      expect(result.bidAmount).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.factors).toBeDefined();
      expect(result.factors.baseBid).toBeDefined();
      expect(result.factors.performanceMultiplier).toBeDefined();
      expect(result.factors.targetingMultiplier).toBeDefined();
      expect(result.factors.budgetMultiplier).toBeDefined();
    });

    it('should throw error when campaign not found', async () => {
      const campaignId = 'non-existent';
      const organizationId = 'org-123';
      const adUnitId = 'ad-unit-123';

      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(biddingService.calculateOptimalBid(campaignId, organizationId, adUnitId))
        .rejects.toThrow('Campaign not found');
    });

    it('should throw error when ad unit not found', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const adUnitId = 'non-existent';

      const mockCampaign = {
        bidStrategy: 'AUTO_CPC',
        targetCPM: null,
        targetCPC: 2.0,
        targetCPA: null,
        budget: 1000,
        totalSpent: 500
      };

      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (mockPrisma.adUnit.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(biddingService.calculateOptimalBid(campaignId, organizationId, adUnitId))
        .rejects.toThrow('Ad unit not found');
    });
  });

  describe('simulateRTBAuction', () => {
    it('should simulate RTB auction successfully', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const adUnitId = 'ad-unit-123';
      const competitors = 3;

      const mockCampaign = {
        bidStrategy: 'AUTO_CPC',
        targetCPM: null,
        targetCPC: 2.0,
        targetCPA: null,
        budget: 1000,
        totalSpent: 500
      };

      const mockAdUnit = {
        format: 'BANNER',
        size: '728x90'
      };

      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (mockPrisma.adUnit.findFirst as jest.Mock).mockResolvedValue(mockAdUnit);
      (mockPrisma.advertiserAd.findMany as jest.Mock).mockResolvedValue([]);

      const result = await biddingService.simulateRTBAuction(campaignId, organizationId, adUnitId, competitors);

      expect(result).toBeDefined();
      expect(result.won).toBeDefined();
      expect(result.bidAmount).toBeGreaterThan(0);
      expect(result.clearingPrice).toBeGreaterThan(0);
      expect(result.position).toBeGreaterThan(0);
      expect(result.competitors).toBe(competitors);
    });

    it('should handle different competitor counts', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const adUnitId = 'ad-unit-123';

      const mockCampaign = {
        bidStrategy: 'AUTO_CPC',
        targetCPM: null,
        targetCPC: 2.0,
        targetCPA: null,
        budget: 1000,
        totalSpent: 500
      };

      const mockAdUnit = {
        format: 'BANNER',
        size: '728x90'
      };

      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (mockPrisma.adUnit.findFirst as jest.Mock).mockResolvedValue(mockAdUnit);
      (mockPrisma.advertiserAd.findMany as jest.Mock).mockResolvedValue([]);

      const result = await biddingService.simulateRTBAuction(campaignId, organizationId, adUnitId, 10);

      expect(result.competitors).toBe(10);
    });
  });

  describe('private methods through public interface', () => {
    it('should handle different bid strategies', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const adUnitId = 'ad-unit-123';

      const mockAdUnit = {
        format: 'VIDEO',
        size: '640x480'
      };

      // Test MANUAL strategy
      const mockManualCampaign = {
        bidStrategy: 'MANUAL',
        targetCPM: 500,
        targetCPC: null,
        targetCPA: null,
        budget: 1000,
        totalSpent: 500
      };

      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue(mockManualCampaign);
      (mockPrisma.adUnit.findFirst as jest.Mock).mockResolvedValue(mockAdUnit);
      (mockPrisma.advertiserAd.findMany as jest.Mock).mockResolvedValue([]);

      const manualResult = await biddingService.calculateOptimalBid(campaignId, organizationId, adUnitId);
      expect(manualResult.factors.baseBid).toBeDefined();

      // Test AUTO_CPM strategy
      const mockAutoCpmCampaign = {
        bidStrategy: 'AUTO_CPM',
        targetCPM: 300,
        targetCPC: null,
        targetCPA: null,
        budget: 1000,
        totalSpent: 500
      };

      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue(mockAutoCpmCampaign);

      const autoCpmResult = await biddingService.calculateOptimalBid(campaignId, organizationId, adUnitId);
      expect(autoCpmResult.factors.baseBid).toBeDefined();
    });

    it('should handle different ad unit formats', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const adUnitId = 'ad-unit-123';

      const mockCampaign = {
        bidStrategy: 'AUTO_CPC',
        targetCPM: null,
        targetCPC: 2.0,
        targetCPA: null,
        budget: 1000,
        totalSpent: 500
      };

      // Test VIDEO format (should have higher multiplier)
      const mockVideoAdUnit = {
        format: 'VIDEO',
        size: '640x480'
      };

      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (mockPrisma.adUnit.findFirst as jest.Mock).mockResolvedValue(mockVideoAdUnit);
      (mockPrisma.advertiserAd.findMany as jest.Mock).mockResolvedValue([]);

      const videoResult = await biddingService.calculateOptimalBid(campaignId, organizationId, adUnitId);
      expect(videoResult.factors.adUnit.format).toBe('VIDEO');

      // Test NATIVE format
      const mockNativeAdUnit = {
        format: 'NATIVE',
        size: '300x250'
      };

      (mockPrisma.adUnit.findFirst as jest.Mock).mockResolvedValue(mockNativeAdUnit);

      const nativeResult = await biddingService.calculateOptimalBid(campaignId, organizationId, adUnitId);
      expect(nativeResult.factors.adUnit.format).toBe('NATIVE');
    });

    it('should handle historical performance data', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const adUnitId = 'ad-unit-123';

      const mockCampaign = {
        bidStrategy: 'AUTO_CPC',
        targetCPM: null,
        targetCPC: 2.0,
        targetCPA: null,
        budget: 1000,
        totalSpent: 500
      };

      const mockAdUnit = {
        format: 'BANNER',
        size: '728x90'
      };

      const mockHistoricalAds = [
        {
          impressions: 1000,
          clicks: 25,
          conversions: 1,
          ctr: 0.025,
          cpc: 1.50,
          cpm: 3.00,
          createdAt: new Date()
        },
        {
          impressions: 1000,
          clicks: 30,
          conversions: 2,
          ctr: 0.030,
          cpc: 1.25,
          cpm: 2.50,
          createdAt: new Date()
        }
      ];

      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue(mockCampaign);
      (mockPrisma.adUnit.findFirst as jest.Mock).mockResolvedValue(mockAdUnit);
      (mockPrisma.advertiserAd.findMany as jest.Mock).mockResolvedValue(mockHistoricalAds);

      const result = await biddingService.calculateOptimalBid(campaignId, organizationId, adUnitId);

      expect(result.factors.historicalData).toBeDefined();
      expect(result.factors.historicalData.avgCTR).toBeCloseTo(0.0275, 4);
      expect(result.factors.historicalData.avgCPC).toBeCloseTo(1.375, 3);
    });
  });
}); 