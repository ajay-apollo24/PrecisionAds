import { TargetingService } from '../../../../src/modules/ad-serving/services/targeting.service';
import { prisma } from '../../../../src/shared/database/prisma';

// Mock Prisma
jest.mock('../../../../src/shared/database/prisma', () => ({
  prisma: {
    advertiserAd: {
      findUnique: jest.fn(),
    },
  },
}));

describe('TargetingService', () => {
  let targetingService: TargetingService;
  let mockPrisma: any;

  beforeEach(() => {
    targetingService = new TargetingService();
    mockPrisma = prisma as jest.Mocked<typeof prisma>;
    jest.clearAllMocks();
  });

  describe('evaluateTargeting', () => {
    it('should evaluate targeting criteria successfully', async () => {
      const adId = 'ad-1';
      const userContext = {
        geoLocation: { country: 'US', city: 'New York' },
        deviceInfo: { deviceType: 'desktop', os: 'Windows' },
        interests: ['technology', 'business'],
        demographics: { age: 25, gender: 'male' },
        behaviors: ['frequent_shopper', 'tech_enthusiast'],
      };

      const mockAd = {
        id: 'ad-1',
        targeting: {
          geoLocation: { country: 'US' },
          deviceInfo: { deviceType: 'desktop' },
          interests: ['technology'],
          demographics: { age: { min: 18, max: 35 } },
          behaviors: ['tech_enthusiast'],
        },
        campaign: {
          targeting: {
            geoLocation: { country: 'US', region: 'Northeast' },
          },
        },
      };

      mockPrisma.advertiserAd.findUnique.mockResolvedValue(mockAd);

      const result = await targetingService.evaluateTargeting(adId, userContext);

      expect(result).toBeDefined();
      expect(result.matches).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.breakdown).toBeDefined();
      expect(result.reasons).toBeDefined();
      expect(mockPrisma.advertiserAd.findUnique).toHaveBeenCalledWith({
        where: { id: adId }
      });
    });

    it('should handle ad not found', async () => {
      const adId = 'invalid-ad';
      const userContext = {
        geoLocation: { country: 'US' },
        deviceInfo: { deviceType: 'desktop' },
      };

      mockPrisma.advertiserAd.findUnique.mockResolvedValue(null);

      await expect(targetingService.evaluateTargeting(adId, userContext))
        .rejects.toThrow('Ad not found');
    });

    it('should handle targeting with no criteria', async () => {
      const adId = 'ad-1';
      const userContext = {
        geoLocation: { country: 'US' },
        deviceInfo: { deviceType: 'desktop' },
      };

      const mockAd = {
        id: 'ad-1',
        targeting: {},
        campaign: { targeting: {} },
      };

      mockPrisma.advertiserAd.findUnique.mockResolvedValue(mockAd);

      const result = await targetingService.evaluateTargeting(adId, userContext);

      expect(result).toBeDefined();
      expect(result.matches).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.breakdown).toBeDefined();
      expect(result.reasons).toBeDefined();
    });
  });

  describe('private methods', () => {
    it('should evaluate geographic targeting correctly', async () => {
      const adId = 'ad-1';
      const userContext = {
        geoLocation: { country: 'US', region: 'Northeast' },
      };

      const mockAd = {
        id: 'ad-1',
        targeting: {
          geoLocation: { country: 'US', region: 'Northeast' },
        },
        campaign: { targeting: {} },
      };

      mockPrisma.advertiserAd.findUnique.mockResolvedValue(mockAd);

      const result = await targetingService.evaluateTargeting(adId, userContext);

      expect(result.breakdown.geographic).toBeDefined();
      expect(result.breakdown.geographic.score).toBeGreaterThan(0);
    });

    it('should evaluate device targeting correctly', async () => {
      const adId = 'ad-1';
      const userContext = {
        deviceInfo: { deviceType: 'desktop', os: 'Windows' },
      };

      const mockAd = {
        id: 'ad-1',
        targeting: {
          deviceInfo: { deviceType: 'desktop' },
        },
        campaign: { targeting: {} },
      };

      mockPrisma.advertiserAd.findUnique.mockResolvedValue(mockAd);

      const result = await targetingService.evaluateTargeting(adId, userContext);

      expect(result.breakdown.device).toBeDefined();
      expect(result.breakdown.device.score).toBeGreaterThan(0);
    });
  });
}); 