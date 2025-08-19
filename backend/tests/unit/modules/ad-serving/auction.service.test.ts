import { AuctionService } from '../../../../src/modules/ad-serving/services/auction.service';
import { prisma } from '../../../../src/shared/database/prisma';

// Mock Prisma
jest.mock('../../../../src/shared/database/prisma', () => ({
  prisma: {
    adRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    advertiserAd: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    adUnit: {
      findFirst: jest.fn(),
    },
    targetingRule: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('AuctionService', () => {
  let auctionService: AuctionService;
  let mockPrisma: any;

  beforeEach(() => {
    auctionService = new AuctionService();
    mockPrisma = prisma as jest.Mocked<typeof prisma>;
    jest.clearAllMocks();
  });

  describe('runAuction', () => {
    it('should run auction successfully', async () => {
      const mockAdRequest = {
        id: 'req-1',
        organizationId: 'org-1',
        adUnitId: 'unit-1',
        status: 'PENDING',
        adUnit: {
          id: 'unit-1',
          organizationId: 'org-1',
          status: 'ACTIVE',
          site: { id: 'site-1' }
        },
        siteId: 'site-1'
      };

      // Mock the private methods by accessing them directly
      const mockGetEligibleAds = jest.spyOn(auctionService as any, 'getEligibleAds').mockResolvedValue([
        { id: 'ad-1', bidAmount: 2.5, qualityScore: 0.8, targetingScore: 0.9 }
      ]);
      
      const mockCollectBids = jest.spyOn(auctionService as any, 'collectBids').mockResolvedValue([
        { adId: 'ad-1', bidAmount: 2.5, qualityScore: 0.8, targetingScore: 0.9, totalScore: 4.2 }
      ]);
      
      const mockRecordAuctionResult = jest.spyOn(auctionService as any, 'recordAuctionResult').mockResolvedValue(undefined);

      // Mock the ad request lookup
      mockPrisma.adRequest.findUnique.mockResolvedValue(mockAdRequest);

      const result = await auctionService.runAuction('req-1');

      expect(result).toBeDefined();
      expect(result.winner).toBe('ad-1');
      expect(mockGetEligibleAds).toHaveBeenCalled();
      expect(mockCollectBids).toHaveBeenCalled();
      expect(mockRecordAuctionResult).toHaveBeenCalled();
    });

    it('should handle auction with no eligible ads', async () => {
      const mockAdRequest = {
        id: 'req-1',
        organizationId: 'org-1',
        adUnitId: 'unit-1',
        status: 'PENDING',
        adUnit: {
          id: 'unit-1',
          organizationId: 'org-1',
          status: 'ACTIVE',
          site: { id: 'site-1' }
        },
        siteId: 'site-1'
      };

      const mockGetEligibleAds = jest.spyOn(auctionService as any, 'getEligibleAds').mockResolvedValue([]);

      // Mock the ad request lookup
      mockPrisma.adRequest.findUnique.mockResolvedValue(mockAdRequest);

      const result = await auctionService.runAuction('req-1');

      expect(result.winner).toBeNull();
      expect(result.participants).toBe(0);
      expect(mockGetEligibleAds).toHaveBeenCalled();
    });

    it('should handle invalid ad request', async () => {
      mockPrisma.adRequest.findUnique.mockResolvedValue(null);

      await expect(auctionService.runAuction('invalid-id')).rejects.toThrow('Ad request not found');
    });
  });

  describe('getEligibleAds', () => {
    it('should get eligible ads for ad unit', async () => {
      const mockAds = [
        { id: 'ad-1', status: 'ACTIVE', targetingCriteria: {} },
        { id: 'ad-2', status: 'ACTIVE', targetingCriteria: {} },
      ];

      const mockAdUnit = {
        id: 'unit-1',
        organizationId: 'org-1',
        format: 'BANNER',
        size: '728x90',
        site: { id: 'site-1', geoLocation: null, deviceInfo: null }
      };

      mockPrisma.adUnit.findFirst.mockResolvedValue(mockAdUnit);
      mockPrisma.advertiserAd.findMany.mockResolvedValue(mockAds);

      const result = await (auctionService as any).getEligibleAds('unit-1', 'org-1');

      expect(result).toEqual(mockAds);
      expect(mockPrisma.advertiserAd.findMany).toHaveBeenCalled();
    });
  });

  describe('collectBids', () => {
    it('should collect and process bids', async () => {
      const mockAds = [
        { 
          id: 'ad-1', 
          bidAmount: 2.5, 
          qualityScore: 0.8, 
          targetingScore: 0.9,
          campaign: { id: 'campaign-1', bidStrategy: 'AUTO_CPC', targetCPC: 2.0 },
          ctr: 0.025,
          clicks: 100,
          conversions: 2,
          createdAt: new Date(),
          organizationId: 'org-1'
        },
        { 
          id: 'ad-2', 
          bidAmount: 3.0, 
          qualityScore: 0.9, 
          targetingScore: 0.8,
          campaign: { id: 'campaign-2', bidStrategy: 'AUTO_CPC', targetCPC: 3.0 },
          ctr: 0.030,
          clicks: 150,
          conversions: 3,
          createdAt: new Date(),
          organizationId: 'org-1'
        },
      ];

      const mockAdRequest = { id: 'req-1', adUnitId: 'unit-1' };

      const result = await (auctionService as any).collectBids(mockAds, mockAdRequest);

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('totalScore');
      expect(result[0]).toHaveProperty('adId');
      expect(result[0]).toHaveProperty('bidAmount');
    });
  });
}); 