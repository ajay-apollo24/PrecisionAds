import { AnalyticsService } from '../../../../src/modules/analytics-reporting/services/analytics.service';
import { prisma } from '../../../../src/shared/database/prisma';
import { createError } from '../../../../src/shared/middleware/error-handler';

// Mock Prisma
jest.mock('../../../../src/shared/database/prisma', () => ({
  prisma: {
    performanceMetrics: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    revenueAnalytics: {
      findMany: jest.fn(),
    },
    userAnalytics: {
      findMany: jest.fn(),
    },
    customReport: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  },
}));

// Mock error handler
jest.mock('../../../../src/shared/middleware/error-handler', () => ({
  createError: jest.fn((message: string, statusCode?: number) => {
    const error = new Error(message);
    (error as any).statusCode = statusCode;
    throw error;
  }),
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    jest.clearAllMocks();
  });

  describe('getPerformanceAnalytics', () => {
    const mockFilters = {
      organizationId: 'org-123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      groupBy: 'day' as const,
    };

    it('should return performance analytics with daily grouping', async () => {
      const mockData = [
        { impressions: 100, clicks: 10, conversions: 2, revenue: 50, spend: 30, ctr: 10, cpc: 3, cpm: 300 },
        { impressions: 200, clicks: 20, conversions: 4, revenue: 100, spend: 60, ctr: 10, cpc: 3, cpm: 300 },
      ];

      (mockPrisma.performanceMetrics.findMany as jest.Mock).mockResolvedValue(mockData);

      const result = await analyticsService.getPerformanceAnalytics(mockFilters);

      expect(result.performanceData).toEqual(mockData);
      expect(result.aggregated.impressions).toBe(300);
      expect(result.aggregated.clicks).toBe(30);
      expect(result.aggregated.conversions).toBe(6);
      expect(result.aggregated.revenue).toBe(150);
      expect(result.summary.avgCTR).toBe(10);
      expect(result.summary.avgCPC).toBe(3);
      expect(result.summary.avgCPM).toBe(300);
      expect(result.summary.conversionRate).toBe(20);
      expect(result.summary.roas).toBeCloseTo(1.67, 2);
    });

    it('should return performance analytics with hourly grouping', async () => {
      const mockFiltersHourly = { ...mockFilters, groupBy: 'hour' as const };
      const mockHourlyData = [
        { period: '2024-01-01T10:00:00Z', total_impressions: 100, total_clicks: 10, total_conversions: 2, total_revenue: 50 },
        { period: '2024-01-01T11:00:00Z', total_impressions: 200, total_clicks: 20, total_conversions: 4, total_revenue: 100 },
      ];

      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockHourlyData);

      const result = await analyticsService.getPerformanceAnalytics(mockFiltersHourly);

      expect(result.performanceData).toEqual(mockHourlyData);
      expect(result.aggregated.impressions).toBe(300);
      expect(result.aggregated.clicks).toBe(30);
      expect(result.aggregated.conversions).toBe(6);
      expect(result.aggregated.revenue).toBe(150);
    });

    it('should return performance analytics with weekly grouping', async () => {
      const mockFiltersWeekly = { ...mockFilters, groupBy: 'week' as const };
      const mockWeeklyData = [
        { period: '2024-01-01T00:00:00Z', total_impressions: 100, total_clicks: 10, total_conversions: 2, total_revenue: 50 },
        { period: '2024-01-08T00:00:00Z', total_impressions: 200, total_clicks: 20, total_conversions: 4, total_revenue: 100 },
      ];

      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockWeeklyData);

      const result = await analyticsService.getPerformanceAnalytics(mockFiltersWeekly);

      expect(result.performanceData).toEqual(mockWeeklyData);
      expect(result.aggregated.impressions).toBe(300);
      expect(result.aggregated.clicks).toBe(30);
      expect(result.aggregated.conversions).toBe(6);
      expect(result.aggregated.revenue).toBe(150);
    });

    it('should return performance analytics with monthly grouping', async () => {
      const mockFiltersMonthly = { ...mockFilters, groupBy: 'month' as const };
      const mockMonthlyData = [
        { period: '2024-01-01T00:00:00Z', total_impressions: 100, total_clicks: 10, total_conversions: 2, total_revenue: 50 },
        { period: '2024-02-01T00:00:00Z', total_impressions: 200, total_clicks: 20, total_conversions: 4, total_revenue: 100 },
      ];

      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockMonthlyData);

      const result = await analyticsService.getPerformanceAnalytics(mockFiltersMonthly);

      expect(result.performanceData).toEqual(mockMonthlyData);
      expect(result.aggregated.impressions).toBe(300);
      expect(result.aggregated.clicks).toBe(30);
      expect(result.aggregated.conversions).toBe(6);
      expect(result.aggregated.revenue).toBe(150);
    });

    it('should handle empty data gracefully', async () => {
      (mockPrisma.performanceMetrics.findMany as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.getPerformanceAnalytics(mockFilters);

      expect(result.performanceData).toEqual([]);
      expect(result.aggregated.impressions).toBe(0);
      expect(result.aggregated.clicks).toBe(0);
      expect(result.aggregated.conversions).toBe(0);
      expect(result.aggregated.revenue).toBe(0);
      expect(result.summary.avgCTR).toBe(0);
      expect(result.summary.avgCPC).toBe(0);
      expect(result.summary.avgCPM).toBe(0);
      expect(result.summary.conversionRate).toBe(0);
      expect(result.summary.roas).toBe(0);
    });
  });

  describe('getPerformanceComparison', () => {
    const mockParams = {
      organizationId: 'org-123',
      period1Start: new Date('2024-01-01'),
      period1End: new Date('2024-01-15'),
      period2Start: new Date('2024-01-16'),
      period2End: new Date('2024-01-31'),
    };

    it('should return performance comparison between two periods', async () => {
      const mockPeriod1Data = { impressions: 100, clicks: 10, conversions: 2, revenue: 50 };
      const mockPeriod2Data = { impressions: 200, clicks: 20, conversions: 4, revenue: 100 };

      (mockPrisma.performanceMetrics.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: mockPeriod1Data })
        .mockResolvedValueOnce({ _sum: mockPeriod2Data });

      const result = await analyticsService.getPerformanceComparison(
        mockParams.organizationId,
        mockParams.period1Start,
        mockParams.period1End,
        mockParams.period2Start,
        mockParams.period2End
      );

      expect(result.period1.data).toEqual(mockPeriod1Data);
      expect(result.period2.data).toEqual(mockPeriod2Data);
      expect(result.changes.impressions.value).toBe(100);
      expect(result.changes.impressions.percentage).toBe(100);
      expect(result.changes.revenue.value).toBe(50);
      expect(result.changes.revenue.percentage).toBe(100);
      expect(result.insights).toContain('Revenue has increased significantly');
      expect(result.insights).toContain('Audience reach and engagement are growing');
    });

    it('should handle zero values in comparison', async () => {
      const mockPeriod1Data = { impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
      const mockPeriod2Data = { impressions: 100, clicks: 10, conversions: 2, revenue: 50 };

      (mockPrisma.performanceMetrics.aggregate as jest.Mock)
        .mockResolvedValueOnce({ _sum: mockPeriod1Data })
        .mockResolvedValueOnce({ _sum: mockPeriod2Data });

      const result = await analyticsService.getPerformanceComparison(
        mockParams.organizationId,
        mockParams.period1Start,
        mockParams.period1End,
        mockParams.period2Start,
        mockParams.period2End
      );

      expect(result.changes.impressions.percentage).toBe(0);
      expect(result.changes.revenue.percentage).toBe(0);
    });
  });

  describe('getPerformanceBreakdown', () => {
    const mockParams = {
      organizationId: 'org-123',
      dimension: 'campaignId',
      filters: { organizationId: 'org-123', startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31'), limit: 10 },
    };

    it('should return performance breakdown by dimension', async () => {
      const mockBreakdown = [
        { campaignId: 'campaign-1', _sum: { impressions: 100, clicks: 10, conversions: 2, revenue: 50 } },
        { campaignId: 'campaign-2', _sum: { impressions: 200, clicks: 20, conversions: 4, revenue: 100 } },
      ];

      (mockPrisma.performanceMetrics.groupBy as jest.Mock).mockResolvedValue(mockBreakdown);

      const result = await analyticsService.getPerformanceBreakdown(
        mockParams.organizationId,
        mockParams.dimension,
        mockParams.filters
      );

      expect(result.dimension).toBe('campaignId');
      expect(result.breakdown).toEqual(mockBreakdown);
      expect(result.summary.totalValues).toBe(2);
      expect(result.summary.topPerformers).toHaveLength(2);
    });
  });

  describe('getRealTimeAnalytics', () => {
    it('should return real-time analytics for the last hour', async () => {
      const mockRealtimeData = [
        { impressions: 100, clicks: 10, conversions: 2, revenue: 50, spend: 30, ctr: 10, cpc: 3, cpm: 300 },
        { impressions: 200, clicks: 20, conversions: 4, revenue: 100, spend: 60, ctr: 10, cpc: 3, cpm: 300 },
      ];

      (mockPrisma.performanceMetrics.findMany as jest.Mock).mockResolvedValue(mockRealtimeData);

      const result = await analyticsService.getRealTimeAnalytics('org-123');

      expect(result.realtimeMetrics.impressions).toBe(300);
      expect(result.realtimeMetrics.clicks).toBe(30);
      expect(result.realtimeMetrics.conversions).toBe(6);
      expect(result.realtimeMetrics.revenue).toBe(150);
      expect(result.dataPoints).toBe(2);
      expect(result.timeRange).toBe('1 hour');
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('getRevenueAnalytics', () => {
    it('should return revenue analytics with metrics', async () => {
      const mockRevenueData = [
        { revenue: 100, cost: 60, profit: 40, roi: 0.67 },
        { revenue: 200, cost: 120, profit: 80, roi: 0.67 },
      ];

      (mockPrisma.revenueAnalytics.findMany as jest.Mock).mockResolvedValue(mockRevenueData);

      const result = await analyticsService.getRevenueAnalytics('org-123');

      expect(result.revenueData).toEqual(mockRevenueData);
      expect(result.metrics.totalRevenue).toBe(300);
      expect(result.metrics.totalCost).toBe(180);
      expect(result.metrics.totalProfit).toBe(120);
      expect(result.metrics.avgROI).toBe(0.67);
      expect(result.summary.profitMargin).toBe(40);
      expect(result.summary.costEfficiency).toBeCloseTo(1.67, 2);
    });

    it('should handle empty revenue data', async () => {
      (mockPrisma.revenueAnalytics.findMany as jest.Mock).mockResolvedValue([]);

      const result = await analyticsService.getRevenueAnalytics('org-123');

      expect(result.metrics.totalRevenue).toBe(0);
      expect(result.metrics.totalCost).toBe(0);
      expect(result.metrics.totalProfit).toBe(0);
      expect(result.summary.profitMargin).toBe(0);
      expect(result.summary.costEfficiency).toBe(0);
    });
  });

  describe('getUserAnalytics', () => {
    it('should return user analytics with metrics', async () => {
      const mockUserData = [
        { sessionDuration: 300, pageViews: 5, conversions: 1, revenue: 25 },
        { sessionDuration: 600, pageViews: 10, conversions: 2, revenue: 50 },
      ];

      (mockPrisma.userAnalytics.findMany as jest.Mock).mockResolvedValue(mockUserData);

      const result = await analyticsService.getUserAnalytics('org-123');

      expect(result.userData).toEqual(mockUserData);
      expect(result.metrics.totalSessions).toBe(900);
      expect(result.metrics.totalPageViews).toBe(15);
      expect(result.metrics.totalConversions).toBe(3);
      expect(result.metrics.totalRevenue).toBe(75);
      expect(result.summary.avgSessionDuration).toBe(450);
      expect(result.summary.avgPageViews).toBe(7.5);
      expect(result.summary.conversionRate).toBe(150);
    });
  });

  describe('createCustomReport', () => {
    it('should create a custom report', async () => {
      const mockReport = {
        id: 'report-1',
        organizationId: 'org-123',
        name: 'Test Report',
        description: 'Test Description',
        query: 'SELECT * FROM test',
        schedule: '0 0 * * *',
        createdAt: new Date(),
      };

      (mockPrisma.customReport.create as jest.Mock).mockResolvedValue(mockReport);

      const result = await analyticsService.createCustomReport(
        'org-123',
        'Test Report',
        'Test Description',
        'SELECT * FROM test',
        '0 0 * * *'
      );

      expect(result).toEqual(mockReport);
      expect(mockPrisma.customReport.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-123',
          name: 'Test Report',
          description: 'Test Description',
          query: 'SELECT * FROM test',
          schedule: '0 0 * * *',
          createdAt: expect.any(Date),
        },
      });
    });
  });

  describe('getCustomReports', () => {
    it('should return custom reports for an organization', async () => {
      const mockReports = [
        { id: 'report-1', name: 'Report 1' },
        { id: 'report-2', name: 'Report 2' },
      ];

      (mockPrisma.customReport.findMany as jest.Mock).mockResolvedValue(mockReports);

      const result = await analyticsService.getCustomReports('org-123');

      expect(result).toEqual(mockReports);
      expect(mockPrisma.customReport.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-123' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('executeCustomReport', () => {
    it('should execute a custom report successfully', async () => {
      const mockReport = {
        id: 'report-1',
        organizationId: 'org-123',
        query: 'SELECT * FROM test',
      };

      const mockResult = [{ id: 1, name: 'Test' }];

      (mockPrisma.customReport.findFirst as jest.Mock).mockResolvedValue(mockReport);
      (mockPrisma.$queryRawUnsafe as jest.Mock).mockResolvedValue(mockResult);
      (mockPrisma.customReport.update as jest.Mock).mockResolvedValue(mockReport);

      const result = await analyticsService.executeCustomReport('report-1', 'org-123');

      expect(result.result).toEqual(mockResult);
      expect(result.executedAt).toBeInstanceOf(Date);
      expect(mockPrisma.customReport.update).toHaveBeenCalledWith({
        where: { id: 'report-1' },
        data: { lastGenerated: expect.any(Date) },
      });
    });

    it('should throw error when report not found', async () => {
      (mockPrisma.customReport.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        analyticsService.executeCustomReport('invalid-id', 'org-123')
      ).rejects.toThrow('Custom report not found');
    });

    it('should throw error when query execution fails', async () => {
      const mockReport = {
        id: 'report-1',
        organizationId: 'org-123',
        query: 'INVALID QUERY',
      };

      (mockPrisma.customReport.findFirst as jest.Mock).mockResolvedValue(mockReport);
      (mockPrisma.$queryRawUnsafe as jest.Mock).mockRejectedValue(new Error('Query failed'));

      await expect(
        analyticsService.executeCustomReport('report-1', 'org-123')
      ).rejects.toThrow('Invalid query execution');
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should return campaign analytics with placeholder data', async () => {
      const mockFilters = {
        organizationId: 'org-123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        limit: 10,
      };

      const result = await analyticsService.getCampaignAnalytics(mockFilters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('campaign-1');
      expect(result[0].name).toBe('Sample Campaign');
      expect(result[0].type).toBe('DISPLAY');
      expect(result[0].status).toBe('ACTIVE');
      expect(result[0].performance).toBeDefined();
      expect(result[0].summary).toBeDefined();
    });
  });

  describe('compareCampaigns', () => {
    it('should return campaign comparison data', async () => {
      const result = await analyticsService.compareCampaigns('org-123', ['campaign-1', 'campaign-2']);

      expect(result.campaigns).toHaveLength(2);
      expect(result.comparison).toBeDefined();
      expect(result.comparison.bestPerformer).toBeDefined();
      expect(result.comparison.worstPerformer).toBeDefined();
      expect(result.comparison.averageMetrics).toBeDefined();
    });

    it('should handle single campaign comparison', async () => {
      const result = await analyticsService.compareCampaigns('org-123', ['campaign-1']);

      expect(result.comparison.message).toBe('Need at least 2 campaigns to compare');
    });
  });

  describe('getCampaignFunnel', () => {
    it('should return campaign funnel analysis', async () => {
      const mockMetrics = [
        { impressions: 100, clicks: 10, conversions: 2, revenue: 50 },
        { impressions: 200, clicks: 20, conversions: 4, revenue: 100 },
      ];

      (mockPrisma.performanceMetrics.findMany as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await analyticsService.getCampaignFunnel('campaign-1', 'org-123');

      expect(result.funnel.impressions).toBe(300);
      expect(result.funnel.clicks).toBe(30);
      expect(result.funnel.conversions).toBe(6);
      expect(result.rates.ctr).toBe(10);
      expect(result.rates.conversionRate).toBe(20);
    });
  });

  describe('getCampaignGeographicPerformance', () => {
    it('should return geographic performance data', async () => {
      const result = await analyticsService.getCampaignGeographicPerformance('campaign-1', 'org-123');

      expect(result.campaignId).toBe('campaign-1');
      expect(result.geographicData).toHaveLength(3);
      expect(result.geographicData[0].country).toBe('US');
      expect(result.geographicData[0].impressions).toBe(1000);
    });
  });

  describe('getCampaignDevicePerformance', () => {
    it('should return device performance data', async () => {
      const result = await analyticsService.getCampaignDevicePerformance('campaign-1', 'org-123');

      expect(result.campaignId).toBe('campaign-1');
      expect(result.deviceData).toHaveLength(3);
      expect(result.deviceData[0].device).toBe('Desktop');
      expect(result.deviceData[0].impressions).toBe(800);
    });
  });
}); 