/**
 * Analytics Integration Tests
 * 
 * Tests the interaction between analytics services and the database
 */

import { testDatabase } from '../utils/test-database';
import { TestDataFactory } from '../utils/test-data-factory';
import { AnalyticsService } from '../../../src/modules/analytics-reporting/services/analytics.service';

describe('Analytics Integration Tests', () => {
  let analyticsService: AnalyticsService;
  let testOrgId: string;
  let testCampaignId: string;
  let testAdUnitId: string;

  beforeAll(async () => {
    await testDatabase.setup();
    analyticsService = new AnalyticsService(testDatabase.getClient());
    
    // Create test data
    const testOrg = TestDataFactory.createOrganization();
    const testCampaign = TestDataFactory.createCampaign({ 
      organizationId: testOrg.id,
      budgetType: 'DAILY',
      bidStrategy: 'MANUAL'
    });
    const testSite = TestDataFactory.createSite({ organizationId: testOrg.id });
    const testAdUnit = TestDataFactory.createAdUnit({ 
      siteId: testSite.id, 
      organizationId: testOrg.id,
      status: 'ACTIVE'
    });

    const prisma = testDatabase.getClient();
    
    await prisma.organization.create({ data: testOrg });
    await prisma.advertiserCampaign.create({ data: testCampaign });
    await prisma.publisherSite.create({ data: testSite });
    await prisma.adUnit.create({ data: testAdUnit });

    testOrgId = testOrg.id;
    testCampaignId = testCampaign.id;
    testAdUnitId = testAdUnit.id;
  });

  afterAll(async () => {
    await testDatabase.cleanup();
    await testDatabase.close();
  });

  beforeEach(async () => {
    await testDatabase.cleanup();
  });

  describe('Performance Analytics Integration', () => {
    it('should create and retrieve performance data', async () => {
      const prisma = testDatabase.getClient();
      
      // Create performance data
      const performanceData = TestDataFactory.createPerformanceData({
        adUnitId: testAdUnitId,
        organizationId: testOrgId,
        date: new Date()
      });

      await prisma.performanceMetrics.create({ data: performanceData });

      // Test analytics service
      const result = await analyticsService.getPerformanceAnalytics(testOrgId, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endDate: new Date(),
        grouping: 'daily'
      });

      expect(result).toBeDefined();
      expect(result.summary.totalImpressions).toBe(performanceData.impressions);
      expect(result.summary.totalClicks).toBe(performanceData.clicks);
      expect(result.summary.totalConversions).toBe(performanceData.conversions);
    });

    it('should handle multiple performance records', async () => {
      const prisma = testDatabase.getClient();
      
      // Create multiple performance records
      const performanceData1 = TestDataFactory.createPerformanceData({
        adUnitId: testAdUnitId,
        organizationId: testOrgId,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        impressions: 1000,
        clicks: 50
      });

      const performanceData2 = TestDataFactory.createPerformanceData({
        adUnitId: testAdUnitId,
        organizationId: testOrgId,
        date: new Date(),
        impressions: 2000,
        clicks: 100
      });

      await prisma.performanceMetrics.createMany({ 
        data: [performanceData1, performanceData2] 
      });

      // Test analytics service
      const result = await analyticsService.getPerformanceAnalytics(testOrgId, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        grouping: 'daily'
      });

      expect(result.summary.totalImpressions).toBe(3000);
      expect(result.summary.totalClicks).toBe(150);
      expect(result.summary.avgCTR).toBe(5); // (150/3000) * 100
    });
  });

  describe('Revenue Analytics Integration', () => {
    it('should calculate revenue metrics correctly', async () => {
      const prisma = testDatabase.getClient();
      
      // Create revenue data
      const revenueData = TestDataFactory.createPerformanceData({
        adUnitId: testAdUnitId,
        organizationId: testOrgId,
        revenue: 500,
        cost: 200,
        date: new Date()
      });

      await prisma.performanceMetrics.create({ data: revenueData });

      // Test revenue analytics
      const result = await analyticsService.getRevenueAnalytics(testOrgId, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });

      expect(result.metrics.totalRevenue).toBe(500);
      expect(result.metrics.totalCost).toBe(200);
      expect(result.metrics.totalProfit).toBe(300);
      expect(result.summary.profitMargin).toBe(60); // (300/500) * 100
    });
  });

  describe('Custom Reports Integration', () => {
    it('should create and execute custom reports', async () => {
      const prisma = testDatabase.getClient();
      
      // Create custom report
      const reportData = {
        name: 'Test Report',
        description: 'Test custom report',
        query: { sql: 'SELECT * FROM performance_metrics WHERE "organizationId" = $1' },
        organizationId: testOrgId
      };

      const report = await prisma.customReport.create({ data: reportData });

      // Test report execution
      const result = await analyticsService.executeCustomReport(report.id, testOrgId);

      expect(result).toBeDefined();
      expect(result.reportId).toBe(report.id);
    });
  });
}); 