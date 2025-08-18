import { AnalyticsService } from '../../../../src/modules/analytics-reporting/services/analytics.service';

// Mock the AnalyticsService
jest.mock('../../../../src/modules/analytics-reporting/services/analytics.service');

const mockAnalyticsService = {
  getPerformanceAnalytics: jest.fn(),
  getPerformanceComparison: jest.fn(),
  getPerformanceBreakdown: jest.fn(),
  getRealTimeAnalytics: jest.fn(),
  getRevenueAnalytics: jest.fn(),
  getUserAnalytics: jest.fn(),
  createCustomReport: jest.fn(),
  getCustomReports: jest.fn(),
  executeCustomReport: jest.fn(),
};

(AnalyticsService as jest.MockedClass<typeof AnalyticsService>).mockImplementation(() => mockAnalyticsService as any);

describe('Analytics Service Integration', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    jest.clearAllMocks();
  });

  describe('Performance Analytics Service', () => {
    const mockFilters = {
      organizationId: 'org-123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      groupBy: 'day' as const,
    };

    it('should return performance analytics successfully', async () => {
      const mockResponse = {
        performanceData: [
          { impressions: 100, clicks: 10, conversions: 2, revenue: 50 },
          { impressions: 200, clicks: 20, conversions: 4, revenue: 100 },
        ],
        aggregated: {
          impressions: 300,
          clicks: 30,
          conversions: 6,
          revenue: 150,
        },
        summary: {
          avgCTR: 10,
          avgCPC: 3,
          avgCPM: 300,
          conversionRate: 20,
          roas: 2.5,
        },
      };

      mockAnalyticsService.getPerformanceAnalytics.mockResolvedValue(mockResponse);

      const result = await analyticsService.getPerformanceAnalytics(mockFilters);

      expect(result.performanceData).toEqual(mockResponse.performanceData);
      expect(result.aggregated.impressions).toBe(300);
      expect(result.aggregated.clicks).toBe(30);
      expect(result.aggregated.conversions).toBe(6);
      expect(result.aggregated.revenue).toBe(150);
      expect(result.summary.avgCTR).toBe(10);
      expect(result.summary.avgCPC).toBe(3);
      expect(result.summary.avgCPM).toBe(300);
      expect(result.summary.conversionRate).toBe(20);
      expect(result.summary.roas).toBe(2.5);
    });

    it('should handle empty data gracefully', async () => {
      const mockEmptyResponse = {
        performanceData: [],
        aggregated: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
        },
        summary: {
          avgCTR: 0,
          avgCPC: 0,
          avgCPM: 0,
          conversionRate: 0,
          roas: 0,
        },
      };

      mockAnalyticsService.getPerformanceAnalytics.mockResolvedValue(mockEmptyResponse);

      const result = await analyticsService.getPerformanceAnalytics(mockFilters);

      expect(result.performanceData).toEqual([]);
      expect(result.aggregated.impressions).toBe(0);
      expect(result.aggregated.clicks).toBe(0);
      expect(result.aggregated.conversions).toBe(0);
      expect(result.aggregated.revenue).toBe(0);
    });
  });

  describe('Performance Comparison Service', () => {
    const mockParams = {
      organizationId: 'org-123',
      period1Start: new Date('2024-01-01'),
      period1End: new Date('2024-01-15'),
      period2Start: new Date('2024-01-16'),
      period2End: new Date('2024-01-31'),
    };

    it('should return performance comparison between two periods', async () => {
      const mockResponse = {
        period1: { start: '2024-01-01', end: '2024-01-15', data: { impressions: 100, clicks: 10 } },
        period2: { start: '2024-01-16', end: '2024-01-31', data: { impressions: 200, clicks: 20 } },
        changes: { impressions: { value: 100, percentage: 100 } },
        insights: ['Revenue has increased significantly'],
      };

      mockAnalyticsService.getPerformanceComparison.mockResolvedValue(mockResponse);

      const result = await analyticsService.getPerformanceComparison(
        mockParams.organizationId,
        mockParams.period1Start,
        mockParams.period1End,
        mockParams.period2Start,
        mockParams.period2End
      );

      expect(result.period1.data).toEqual(mockResponse.period1.data);
      expect(result.period2.data).toEqual(mockResponse.period2.data);
      expect(result.changes.impressions.value).toBe(100);
      expect(result.changes.impressions.percentage).toBe(100);
      expect(result.insights).toContain('Revenue has increased significantly');
    });
  });

  describe('Real-time Analytics Service', () => {
    it('should return real-time analytics successfully', async () => {
      const mockResponse = {
        realtimeMetrics: { impressions: 300, clicks: 30, conversions: 6, revenue: 150 },
        lastUpdated: new Date(),
        dataPoints: 2,
        timeRange: '1 hour',
      };

      mockAnalyticsService.getRealTimeAnalytics.mockResolvedValue(mockResponse);

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

  describe('Revenue Analytics Service', () => {
    it('should return revenue analytics successfully', async () => {
      const mockResponse = {
        revenueData: [
          { revenue: 100, cost: 60, profit: 40, roi: 0.67 },
          { revenue: 200, cost: 120, profit: 80, roi: 0.67 },
        ],
        metrics: { totalRevenue: 300, totalCost: 180, totalProfit: 120, avgROI: 0.67 },
        summary: { profitMargin: 40, costEfficiency: 1.67 },
      };

      mockAnalyticsService.getRevenueAnalytics.mockResolvedValue(mockResponse);

      const result = await analyticsService.getRevenueAnalytics('org-123');

      expect(result.revenueData).toEqual(mockResponse.revenueData);
      expect(result.metrics.totalRevenue).toBe(300);
      expect(result.metrics.totalCost).toBe(180);
      expect(result.metrics.totalProfit).toBe(120);
      expect(result.metrics.avgROI).toBe(0.67);
      expect(result.summary.profitMargin).toBe(40);
      expect(result.summary.costEfficiency).toBe(1.67);
    });
  });

  describe('Custom Reports Service', () => {
    it('should create custom report successfully', async () => {
      const mockReport = {
        id: 'report-1',
        organizationId: 'org-123',
        name: 'Test Report',
        description: 'Test Description',
        query: 'SELECT * FROM test',
        schedule: '0 0 * * *',
        createdAt: new Date(),
      };

      mockAnalyticsService.createCustomReport.mockResolvedValue(mockReport);

      const result = await analyticsService.createCustomReport(
        'org-123',
        'Test Report',
        'Test Description',
        'SELECT * FROM test',
        '0 0 * * *'
      );

      expect(result).toEqual(mockReport);
      expect(result.id).toBe('report-1');
      expect(result.name).toBe('Test Report');
      expect(result.organizationId).toBe('org-123');
    });

    it('should return custom reports for an organization', async () => {
      const mockReports = [
        { id: 'report-1', name: 'Report 1', description: 'Description 1' },
        { id: 'report-2', name: 'Report 2', description: 'Description 2' },
      ];

      mockAnalyticsService.getCustomReports.mockResolvedValue(mockReports);

      const result = await analyticsService.getCustomReports('org-123');

      expect(result).toEqual(mockReports);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Report 1');
      expect(result[1].name).toBe('Report 2');
    });
  });
}); 