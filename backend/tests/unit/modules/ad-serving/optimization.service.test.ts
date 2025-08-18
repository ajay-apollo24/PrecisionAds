import { OptimizationService } from '../../../../src/modules/ad-serving/services/optimization.service';
import { prisma } from '../../../../src/shared/database/prisma';

// Mock Prisma
jest.mock('../../../../src/shared/database/prisma', () => ({
  prisma: {
    advertiserAd: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    adRequest: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    analyticsEvent: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

describe('OptimizationService', () => {
  let optimizationService: OptimizationService;
  let mockPrisma: any;

  beforeEach(() => {
    optimizationService = new OptimizationService();
    mockPrisma = prisma as jest.Mocked<typeof prisma>;
    jest.clearAllMocks();
  });

  describe('optimizeAdSelection', () => {
    it('should optimize ad selection based on performance', async () => {
      const adUnitId = 'unit-1';
      const organizationId = 'org-1';
      const userContext = {
        geoLocation: { country: 'US' },
        deviceType: 'desktop',
        interests: ['technology'],
      };

      const mockAds = [
        {
          id: 'ad-1',
          ctr: 0.05,
          conversionRate: 0.02,
          relevanceScore: 0.8,
          bidPrice: 2.5,
        },
        {
          id: 'ad-2',
          ctr: 0.03,
          conversionRate: 0.01,
          relevanceScore: 0.6,
          bidPrice: 3.0,
        },
      ];

      mockPrisma.advertiserAd.findMany.mockResolvedValue(mockAds);

      const result = await optimizationService.optimizeAdSelection(
        adUnitId,
        organizationId,
        userContext
      );

      expect(result).toBeDefined();
      expect(result.optimizedAds).toBeDefined();
      expect(result.optimizationScore).toBeDefined();
      expect(mockPrisma.advertiserAd.findMany).toHaveBeenCalled();
    });

    it('should handle no ads available', async () => {
      const adUnitId = 'unit-1';
      const organizationId = 'org-1';
      const userContext = {
        geoLocation: { country: 'US' },
        deviceType: 'desktop',
      };

      mockPrisma.advertiserAd.findMany.mockResolvedValue([]);

      const result = await optimizationService.optimizeAdSelection(
        adUnitId,
        organizationId,
        userContext
      );

      expect(result.optimizedAds).toHaveLength(0);
      expect(result.optimizationScore).toBe(0);
    });
  });

  describe('calculatePerformanceScore', () => {
    it('should calculate performance score correctly', () => {
      const ad = {
        ctr: 0.05,
        conversionRate: 0.02,
        relevanceScore: 0.8,
        bidPrice: 2.5,
      };

      const result = (optimizationService as any).calculatePerformanceScore(ad);

      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    it('should handle ad with zero metrics', () => {
      const ad = {
        ctr: 0,
        conversionRate: 0,
        relevanceScore: 0,
        bidPrice: 1.0,
      };

      const result = (optimizationService as any).calculatePerformanceScore(ad);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(typeof result).toBe('number');
    });
  });

  describe('updateAdPerformance', () => {
    it('should update ad performance metrics', async () => {
      const adId = 'ad-1';
      const performanceData = {
        impressions: 100,
        clicks: 5,
        conversions: 1,
        revenue: 25.0,
      };

      const mockUpdatedAd = {
        id: adId,
        ...performanceData,
        ctr: 0.05,
        conversionRate: 0.02,
        updatedAt: new Date(),
      };

      mockPrisma.advertiserAd.update.mockResolvedValue(mockUpdatedAd);

      const result = await optimizationService.updateAdPerformance(adId, performanceData);

      expect(result).toBeDefined();
      expect(mockPrisma.advertiserAd.update).toHaveBeenCalledWith({
        where: { id: adId },
        data: expect.objectContaining({
          impressions: performanceData.impressions,
          clicks: performanceData.clicks,
          conversions: performanceData.conversions,
        }),
      });
    });
  });

  describe('getPerformanceAnalytics', () => {
    it('should get performance analytics for ad unit', async () => {
      const adUnitId = 'unit-1';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockAnalytics = {
        totalImpressions: 1000,
        totalClicks: 50,
        totalConversions: 10,
        totalRevenue: 500.0,
        averageCtr: 0.05,
        averageConversionRate: 0.2,
        averageCpc: 10.0,
        averageCpm: 50.0,
      };

      mockPrisma.adRequest.count.mockResolvedValue(1000);
      mockPrisma.analyticsEvent.aggregate.mockResolvedValue({
        _count: { id: 50 },
        _sum: { value: 500.0 },
      });

      const result = await optimizationService.getPerformanceAnalytics(
        adUnitId,
        startDate,
        endDate
      );

      expect(result).toBeDefined();
      expect(result.totalImpressions).toBeDefined();
      expect(result.totalClicks).toBeDefined();
      expect(result.totalConversions).toBeDefined();
      expect(result.totalRevenue).toBeDefined();
    });
  });

  describe('optimizeBidPrices', () => {
    it('should optimize bid prices based on performance', async () => {
      const campaignId = 'campaign-1';
      const optimizationParams = {
        targetCtr: 0.05,
        targetCpc: 10.0,
        maxBidIncrease: 0.2,
        minBidDecrease: 0.1,
      };

      const mockAds = [
        { id: 'ad-1', currentBid: 2.0, ctr: 0.03, cpc: 12.0 },
        { id: 'ad-2', currentBid: 3.0, ctr: 0.07, cpc: 8.0 },
      ];

      mockPrisma.advertiserAd.findMany.mockResolvedValue(mockAds);
      mockPrisma.advertiserAd.update.mockResolvedValue({});

      const result = await optimizationService.optimizeBidPrices(campaignId, optimizationParams);

      expect(result).toBeDefined();
      expect(result.optimizedBids).toBeDefined();
      expect(result.optimizationSummary).toBeDefined();
    });
  });
}); 