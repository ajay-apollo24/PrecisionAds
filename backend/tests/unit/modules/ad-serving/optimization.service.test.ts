import { OptimizationService } from '../../../../src/modules/ad-serving/services/optimization.service';
import { prisma } from '../../../../src/shared/database/prisma';

// Mock Prisma
jest.mock('../../../../src/shared/database/prisma', () => ({
  prisma: {
    adUnit: {
      findFirst: jest.fn(),
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

  describe('optimizeAdServing', () => {
    it('should optimize ad serving based on performance data', async () => {
      const adUnitId = 'unit-1';
      const organizationId = 'org-1';

      const mockAdUnit = {
        id: 'unit-1',
        organizationId: 'org-1',
        name: 'Test Ad Unit',
        adRequests: [
          { id: 'req-1', impression: true, clickThrough: false, createdAt: new Date() },
          { id: 'req-2', impression: true, clickThrough: true, createdAt: new Date() },
          { id: 'req-3', impression: false, clickThrough: false, createdAt: new Date() },
        ],
      };

      mockPrisma.adUnit.findFirst.mockResolvedValue(mockAdUnit);

      const result = await optimizationService.optimizeAdServing(adUnitId, organizationId);

      expect(result).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.optimizedSettings).toBeDefined();
      expect(mockPrisma.adUnit.findFirst).toHaveBeenCalledWith({
        where: { id: adUnitId, organizationId },
        include: {
          adRequests: {
            where: {
              createdAt: {
                gte: expect.any(Date)
              }
            }
          }
        }
      });
    });

    it('should handle ad unit not found', async () => {
      const adUnitId = 'invalid-unit';
      const organizationId = 'org-1';

      mockPrisma.adUnit.findFirst.mockResolvedValue(null);

      await expect(optimizationService.optimizeAdServing(adUnitId, organizationId))
        .rejects.toThrow('Ad unit not found');
    });

    it('should handle ad unit with no requests', async () => {
      const adUnitId = 'unit-1';
      const organizationId = 'org-1';

      const mockAdUnit = {
        id: 'unit-1',
        organizationId: 'org-1',
        name: 'Test Ad Unit',
        adRequests: [],
      };

      mockPrisma.adUnit.findFirst.mockResolvedValue(mockAdUnit);

      const result = await optimizationService.optimizeAdServing(adUnitId, organizationId);

      expect(result).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.optimizedSettings).toBeDefined();
    });
  });

  describe('private methods', () => {
    it('should analyze performance correctly', async () => {
      const adUnitId = 'unit-1';
      const organizationId = 'org-1';

      const mockAdUnit = {
        id: 'unit-1',
        organizationId: 'org-1',
        name: 'Test Ad Unit',
        adRequests: [
          { id: 'req-1', impression: true, clickThrough: false, createdAt: new Date() },
          { id: 'req-2', impression: true, clickThrough: true, createdAt: new Date() },
        ],
      };

      mockPrisma.adUnit.findFirst.mockResolvedValue(mockAdUnit);

      const result = await optimizationService.optimizeAdServing(adUnitId, organizationId);

      expect(result).toBeDefined();
      // The private methods are called internally, so we test their effects through the public method
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations based on performance', async () => {
      const adUnitId = 'unit-1';
      const organizationId = 'org-1';

      const mockAdUnit = {
        id: 'unit-1',
        organizationId: 'org-1',
        name: 'Test Ad Unit',
        adRequests: [
          { id: 'req-1', impression: true, clickThrough: false, createdAt: new Date() },
          { id: 'req-2', impression: true, clickThrough: true, createdAt: new Date() },
        ],
      };

      mockPrisma.adUnit.findFirst.mockResolvedValue(mockAdUnit);

      const result = await optimizationService.optimizeAdServing(adUnitId, organizationId);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Check recommendation structure
      if (result.recommendations.length > 0) {
        const recommendation = result.recommendations[0];
        expect(recommendation).toHaveProperty('type');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('impact');
        expect(recommendation).toHaveProperty('confidence');
      }
    });
  });

  describe('calculateOptimizedSettings', () => {
    it('should calculate optimized settings', async () => {
      const adUnitId = 'unit-1';
      const organizationId = 'org-1';

      const mockAdUnit = {
        id: 'unit-1',
        organizationId: 'org-1',
        name: 'Test Ad Unit',
        adRequests: [
          { id: 'req-1', impression: true, clickThrough: false, createdAt: new Date() },
          { id: 'req-2', impression: true, clickThrough: true, createdAt: new Date() },
        ],
      };

      mockPrisma.adUnit.findFirst.mockResolvedValue(mockAdUnit);

      const result = await optimizationService.optimizeAdServing(adUnitId, organizationId);

      expect(result.optimizedSettings).toBeDefined();
      expect(typeof result.optimizedSettings).toBe('object');
    });
  });
}); 