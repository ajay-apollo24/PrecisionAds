import { FrequencyService } from '../../../../src/modules/ad-serving/services/frequency.service';
import { prisma } from '../../../../src/shared/database/prisma';

// Mock Prisma
jest.mock('../../../../src/shared/database/prisma', () => ({
  prisma: {
    advertiserCampaign: {
      findFirst: jest.fn(),
    },
    adRequest: {
      count: jest.fn(),
    },
    frequencyCap: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

describe('FrequencyService', () => {
  let frequencyService: FrequencyService;
  let mockPrisma: any;

  beforeEach(() => {
    frequencyService = new FrequencyService();
    mockPrisma = prisma as jest.Mocked<typeof prisma>;
    jest.clearAllMocks();
  });

  describe('checkFrequencyCap', () => {
    it('should check frequency cap successfully for impression', async () => {
      const userId = 'user-1';
      const adId = 'ad-1';
      const campaignId = 'campaign-1';
      const organizationId = 'org-1';
      const eventType = 'impression';

      const mockCampaign = {
        id: 'campaign-1',
        organizationId: 'org-1',
        name: 'Test Campaign',
      };

      mockPrisma.advertiserCampaign.findFirst.mockResolvedValue(mockCampaign);

      const result = await frequencyService.checkFrequencyCap(
        userId,
        adId,
        campaignId,
        organizationId,
        eventType
      );

      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
      expect(result.reason).toBeDefined();
      expect(result.currentCount).toBeDefined();
      expect(result.limit).toBeDefined();
      expect(result.timeRemaining).toBeDefined();
      expect(mockPrisma.advertiserCampaign.findFirst).toHaveBeenCalledWith({
        where: { id: campaignId, organizationId }
      });
    });

    it('should check frequency cap successfully for click', async () => {
      const userId = 'user-1';
      const adId = 'ad-1';
      const campaignId = 'campaign-1';
      const organizationId = 'org-1';
      const eventType = 'click';

      const mockCampaign = {
        id: 'campaign-1',
        organizationId: 'org-1',
        name: 'Test Campaign',
      };

      mockPrisma.advertiserCampaign.findFirst.mockResolvedValue(mockCampaign);

      const result = await frequencyService.checkFrequencyCap(
        userId,
        adId,
        campaignId,
        organizationId,
        eventType
      );

      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
      expect(result.reason).toBeDefined();
      expect(result.currentCount).toBeDefined();
      expect(result.limit).toBeDefined();
      expect(result.timeRemaining).toBeDefined();
    });

    it('should handle campaign not found', async () => {
      const userId = 'user-1';
      const adId = 'ad-1';
      const campaignId = 'invalid-campaign';
      const organizationId = 'org-1';
      const eventType = 'impression';

      mockPrisma.advertiserCampaign.findFirst.mockResolvedValue(null);

      await expect(frequencyService.checkFrequencyCap(
        userId,
        adId,
        campaignId,
        organizationId,
        eventType
      )).rejects.toThrow('Campaign not found');
    });
  });

  describe('recordFrequencyEvent', () => {
    it('should record frequency event successfully', async () => {
      const userId = 'user-1';
      const adId = 'ad-1';
      const campaignId = 'campaign-1';
      const organizationId = 'org-1';
      const eventType = 'impression';

      const mockCampaign = {
        id: 'campaign-1',
        organizationId: 'org-1',
        name: 'Test Campaign',
      };

      mockPrisma.advertiserCampaign.findFirst.mockResolvedValue(mockCampaign);

      await expect(frequencyService.recordFrequencyEvent(
        userId,
        adId,
        campaignId,
        organizationId,
        eventType
      )).resolves.not.toThrow();

      expect(mockPrisma.advertiserCampaign.findFirst).toHaveBeenCalledWith({
        where: { id: campaignId, organizationId }
      });
    });

    it('should handle campaign not found in recordFrequencyEvent', async () => {
      const userId = 'user-1';
      const adId = 'ad-1';
      const campaignId = 'invalid-campaign';
      const organizationId = 'org-1';
      const eventType = 'impression';

      mockPrisma.advertiserCampaign.findFirst.mockResolvedValue(null);

      await expect(frequencyService.recordFrequencyEvent(
        userId,
        adId,
        campaignId,
        organizationId,
        eventType
      )).rejects.toThrow('Campaign not found');
    });
  });

  describe('getCurrentFrequencyCount', () => {
    it('should get current frequency count for day window', async () => {
      const userId = 'user-1';
      const adId = 'ad-1';
      const campaignId = 'campaign-1';
      const organizationId = 'org-1';
      const eventType = 'impression';
      const window = 'day';

      const mockCount = 2;
      mockPrisma.frequencyCap.findFirst.mockResolvedValue({ count: mockCount });

      const result = await (frequencyService as any).getCurrentFrequencyCount(
        userId,
        adId,
        campaignId,
        organizationId,
        eventType,
        window
      );

      expect(result).toBe(mockCount);
      expect(mockPrisma.frequencyCap.findFirst).toHaveBeenCalled();
    });
  });

  describe('calculateTimeRemaining', () => {
    it('should calculate time remaining for day window', () => {
      const window = 'day';
      const result = (frequencyService as any).calculateTimeRemaining(window);

      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    it('should calculate time remaining for hour window', () => {
      const window = 'hour';
      const result = (frequencyService as any).calculateTimeRemaining(window);

      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });
  });
}); 