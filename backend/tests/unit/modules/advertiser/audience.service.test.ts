import { AudienceService } from '../../../../src/modules/advertiser/services/audience.service';
import { prisma } from '../../../../src/shared/database/prisma';
import { JsonValue } from '@prisma/client/runtime/library';

// Mock Prisma
jest.mock('../../../../src/shared/database/prisma', () => ({
  prisma: {
    advertiserAudience: {
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

describe('AudienceService', () => {
  let audienceService: AudienceService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    audienceService = new AudienceService();
    jest.clearAllMocks();
  });

  describe('getAudiences', () => {
    it('should return audiences for a campaign', async () => {
      const campaignId = 'campaign-123';
      const organizationId = 'org-123';
      const mockAudiences = [
        {
          id: 'audience-1',
          organizationId,
          campaignId,
          name: 'Test Audience 1',
          description: 'Test description 1',
          targeting: { age: '18-25', location: 'US' } as JsonValue,
          size: 10000,
          createdAt: new Date(),
          updatedAt: new Date(),
          campaign: {
            id: 'campaign-123',
            name: 'Test Campaign',
            status: 'ACTIVE',
            type: 'DISPLAY'
          }
        }
      ];

      (mockPrisma.advertiserAudience.findMany as jest.Mock).mockResolvedValue(mockAudiences);

      const result = await audienceService.getAudiences(campaignId, organizationId);

      expect(result).toEqual(mockAudiences);
      expect(mockPrisma.advertiserAudience.findMany).toHaveBeenCalledWith({
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
      const filters = { name: 'Test' };
      const mockAudiences: any[] = [];

      (mockPrisma.advertiserAudience.findMany as jest.Mock).mockResolvedValue(mockAudiences);

      await audienceService.getAudiences(campaignId, organizationId, filters);

      expect(mockPrisma.advertiserAudience.findMany).toHaveBeenCalledWith({
        where: { campaignId, organizationId, name: { contains: 'Test', mode: 'insensitive' } },
        include: {
          campaign: {
            select: { id: true, name: true, status: true, type: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('getAudienceById', () => {
    it('should return an audience by ID', async () => {
      const audienceId = 'audience-123';
      const organizationId = 'org-123';
      const mockAudience = {
        id: audienceId,
        organizationId,
        campaignId: 'campaign-123',
        name: 'Test Audience',
        description: 'Test description',
        targeting: { age: '18-25', location: 'US' } as JsonValue,
        size: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
        campaign: {
          id: 'campaign-123',
          name: 'Test Campaign',
          status: 'ACTIVE',
          type: 'DISPLAY'
        }
      };

      (mockPrisma.advertiserAudience.findFirst as jest.Mock).mockResolvedValue(mockAudience);

      const result = await audienceService.getAudienceById(audienceId, organizationId);

      expect(result).toEqual(mockAudience);
      expect(mockPrisma.advertiserAudience.findFirst).toHaveBeenCalledWith({
        where: { id: audienceId, organizationId },
        include: {
          campaign: {
            select: { id: true, name: true, status: true, type: true }
          }
        }
      });
    });

    it('should return null for non-existent audience', async () => {
      const audienceId = 'non-existent';
      const organizationId = 'org-123';

      (mockPrisma.advertiserAudience.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await audienceService.getAudienceById(audienceId, organizationId);

      expect(result).toBeNull();
    });
  });

  describe('createAudience', () => {
    it('should create a new audience', async () => {
      const organizationId = 'org-123';
      const audienceData = {
        campaignId: 'campaign-123',
        name: 'New Audience',
        description: 'New description',
        targeting: { age: '18-25', location: 'US' } as JsonValue,
        size: 10000
      };

      const mockCreatedAudience = {
        id: 'audience-new',
        organizationId,
        campaignId: 'campaign-123',
        name: 'New Audience',
        description: 'New description',
        targeting: { age: '18-25', location: 'US' } as JsonValue,
        size: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
        campaign: {
          id: 'campaign-123',
          name: 'Test Campaign',
          status: 'ACTIVE',
          type: 'DISPLAY'
        }
      };

      (mockPrisma.advertiserAudience.create as jest.Mock).mockResolvedValue(mockCreatedAudience);
      
      // Mock the campaign lookup
      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue({
        id: 'campaign-123',
        name: 'Test Campaign',
        status: 'ACTIVE',
        type: 'DISPLAY'
      });

      const result = await audienceService.createAudience(audienceData, organizationId);

      expect(result).toEqual(mockCreatedAudience);
      expect(mockPrisma.advertiserAudience.create).toHaveBeenCalledWith({
        data: {
          ...audienceData,
          organizationId,
          targeting: audienceData.targeting
        }
      });
      expect(mockPrisma.advertiserCampaign.findFirst).toHaveBeenCalledWith({
        where: { id: 'campaign-123' },
        select: { id: true, name: true, status: true, type: true }
      });
    });
  });

  describe('updateAudience', () => {
    it('should update an existing audience', async () => {
      const audienceId = 'audience-123';
      const organizationId = 'org-123';
      const updateData = {
        name: 'Updated Audience',
        description: 'Updated description'
      };

      const mockUpdatedAudience = {
        id: audienceId,
        organizationId,
        campaignId: 'campaign-123',
        name: 'Updated Audience',
        description: 'Updated description',
        targeting: { age: '18-25', location: 'US' } as JsonValue,
        size: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
        campaign: {
          id: 'campaign-123',
          name: 'Test Campaign',
          status: 'ACTIVE',
          type: 'DISPLAY'
        }
      };

      (mockPrisma.advertiserAudience.update as jest.Mock).mockResolvedValue(mockUpdatedAudience);
      
      // Mock the campaign lookup
      (mockPrisma.advertiserCampaign.findFirst as jest.Mock).mockResolvedValue({
        id: 'campaign-123',
        name: 'Test Campaign',
        status: 'ACTIVE',
        type: 'DISPLAY'
      });

      const result = await audienceService.updateAudience(audienceId, updateData, organizationId);

      expect(result).toEqual(mockUpdatedAudience);
      expect(mockPrisma.advertiserAudience.update).toHaveBeenCalledWith({
        where: { id: audienceId, organizationId },
        data: {
          ...updateData,
          updatedAt: expect.any(Date)
        }
      });
      expect(mockPrisma.advertiserCampaign.findFirst).toHaveBeenCalledWith({
        where: { id: 'campaign-123' },
        select: { id: true, name: true, status: true, type: true }
      });
    });
  });

  describe('deleteAudience', () => {
    it('should delete an audience', async () => {
      const audienceId = 'audience-123';
      const organizationId = 'org-123';

      const mockDeletedAudience = {
        id: audienceId,
        organizationId,
        campaignId: 'campaign-123',
        name: 'Test Audience',
        description: 'Test description',
        targeting: { age: '18-25', location: 'US' } as JsonValue,
        size: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
        campaign: {
          id: 'campaign-123',
          name: 'Test Campaign',
          status: 'ACTIVE',
          type: 'DISPLAY'
        }
      };

      (mockPrisma.advertiserAudience.delete as jest.Mock).mockResolvedValue(mockDeletedAudience);

      const result = await audienceService.deleteAudience(audienceId, organizationId);

      expect(result).toEqual(mockDeletedAudience);
      expect(mockPrisma.advertiserAudience.delete).toHaveBeenCalledWith({
        where: { id: audienceId, organizationId },
        include: {
          campaign: {
            select: { id: true, name: true, status: true, type: true }
          }
        }
      });
    });
  });

  describe('estimateAudienceSize', () => {
    it('should estimate audience size based on targeting criteria', async () => {
      const targeting = {
        geoLocation: { country: 'US' },
        demographics: { ageRange: '18-25', gender: 'male' },
        interests: ['sports', 'technology'],
        behaviors: ['online_shopping']
      };

      const result = await audienceService.estimateAudienceSize(targeting);

      expect(result).toBe(23520); // Calculated size based on targeting criteria
    });

    it('should return minimum size for very restrictive targeting', async () => {
      const targeting = {
        geoLocation: { city: 'New York' },
        demographics: { ageRange: '18-25', gender: 'male' },
        interests: ['sports', 'technology', 'music', 'art'],
        behaviors: ['online_shopping', 'social_media', 'gaming']
      };

      const result = await audienceService.estimateAudienceSize(targeting);

      expect(result).toBe(1229); // Calculated size based on targeting criteria
    });
  });

  describe('getAudienceInsights', () => {
    it('should return audience insights', async () => {
      const audienceId = 'audience-123';
      const organizationId = 'org-123';
      const mockAudience = {
        targeting: { age: '18-25', location: 'US' },
        size: 10000,
        createdAt: new Date()
      };

      (mockPrisma.advertiserAudience.findFirst as jest.Mock).mockResolvedValue(mockAudience);

      const result = await audienceService.getAudienceInsights(audienceId, organizationId);

      expect(result).toEqual({
        audienceId,
        estimatedSize: 10000,
        targetingBreakdown: {
          geographic: 'Not specified',
          demographic: 'Not specified',
          interests: [],
          behaviors: []
        },
        reachEstimate: {
          potential: 10000,
          actual: 3000,
          overlap: 1000
        },
        performanceMetrics: {
          avgCTR: 2.5,
          avgConversionRate: 0.8,
          avgCPM: 3.50,
          qualityScore: 8.5
        }
      });
    });

    it('should throw error for non-existent audience', async () => {
      const audienceId = 'non-existent';
      const organizationId = 'org-123';

      (mockPrisma.advertiserAudience.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(audienceService.getAudienceInsights(audienceId, organizationId))
        .rejects.toThrow('Audience not found');
    });
  });

  describe('validateAudienceData', () => {
    it('should validate valid audience data', () => {
      const validData = {
        campaignId: 'campaign-123',
        name: 'Valid Audience',
        targeting: { age: '18-25', location: 'US' }
      };

      const result = audienceService.validateAudienceData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid audience data', () => {
      const invalidData = {
        campaignId: 'campaign-123',
        name: '',
        targeting: {}
      };

      const result = audienceService.validateAudienceData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Audience name is required');
      expect(result.errors).toContain('Targeting criteria are required');
    });

    it('should validate targeting structure', () => {
      const invalidData = {
        campaignId: 'campaign-123',
        name: 'Test Audience',
        targeting: {
          geoLocation: 'invalid',
          interests: 'not-an-array'
        }
      };

      const result = audienceService.validateAudienceData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Geographic targeting must be an object');
      expect(result.errors).toContain('Interests must be an array');
    });
  });
}); 