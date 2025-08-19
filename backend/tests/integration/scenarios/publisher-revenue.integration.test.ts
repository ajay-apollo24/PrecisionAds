/**
 * Publisher Revenue Integration Test
 * 
 * Tests the complete publisher revenue workflow from ad serving to earnings
 */

import { testDatabase } from '../utils/test-database';
import { TestDataFactory } from '../utils/test-data-factory';
import { SiteService } from '../../../src/modules/publisher/services/site.service';
import { AdUnitService } from '../../../src/modules/publisher/services/ad-unit.service';
import { RevenueService } from '../../../src/modules/publisher/services/revenue.service';
import { AnalyticsService } from '../../../src/modules/analytics-reporting/services/analytics.service';

describe('Publisher Revenue Integration', () => {
  let siteService: SiteService;
  let adUnitService: AdUnitService;
  let revenueService: RevenueService;
  let analyticsService: AnalyticsService;
  let testOrgId: string;
  let testSiteId: string;
  let testAdUnitId: string;

  beforeAll(async () => {
    await testDatabase.setup();
    
    const prisma = testDatabase.getClient();
    siteService = new SiteService(prisma);
    adUnitService = new AdUnitService(prisma);
    revenueService = new RevenueService(prisma);
    analyticsService = new AnalyticsService(prisma);
    
    // Create test organization
    const testOrg = TestDataFactory.createOrganization({ orgType: 'PUBLISHER' });
    await prisma.organization.create({ data: testOrg });
    testOrgId = testOrg.id;
  });

  afterAll(async () => {
    await testDatabase.cleanup();
    await testDatabase.close();
  });

  beforeEach(async () => {
    await testDatabase.cleanup();
  });

  describe('Publisher Revenue Workflow', () => {
    it('should track complete revenue flow from ad serving to earnings', async () => {
      const prisma = testDatabase.getClient();
      
      // Step 1: Create Publisher Site
      const siteData = TestDataFactory.createSite({
        organizationId: testOrgId,
        name: 'High-Traffic News Site',
        url: 'https://news.example.com',
        domain: 'news.example.com'
      });

      const site = await siteService.createSite(siteData, testOrgId);
      testSiteId = site.id;
      
      expect(site.status).toBe('ACTIVE');
      expect(site.organizationId).toBe(testOrgId);

      // Step 2: Create Ad Units
      const adUnitData = TestDataFactory.createAdUnit({
        organizationId: testOrgId,
        siteId: testSiteId,
        name: 'Header Banner',
        format: 'BANNER',
        size: '728x90'
      });

      const adUnit = await adUnitService.createAdUnit(adUnitData, testOrgId);
      testAdUnitId = adUnit.id;
      
      expect(adUnit.siteId).toBe(testSiteId);
      expect(adUnit.status).toBe('ACTIVE');

      // Step 3: Simulate Ad Requests and Impressions
      const adRequests = [];
      for (let i = 0; i < 5; i++) {
        const adRequest = await prisma.adRequest.create({
          data: {
            organizationId: testOrgId,
            siteId: testSiteId,
            adUnitId: testAdUnitId,
            requestId: `test-request-${i}`,
            userAgent: 'Mozilla/5.0 (Test Browser)',
            ipAddress: `192.168.1.${i + 1}`,
            geoLocation: { country: 'US', city: 'New York' },
            deviceInfo: { type: 'desktop', os: 'Windows' },
            status: 'SERVED',
            servedAdId: 'test-ad-id',
            bidAmount: 2.50,
            cpm: 2.50,
            impression: true,
            clickThrough: i % 3 === 0 // 33% click-through rate
          }
        });
        adRequests.push(adRequest);
      }

      // Step 4: Record Publisher Earnings
      const earningsData = {
        organizationId: testOrgId,
        siteId: testSiteId,
        date: new Date(),
        impressions: 5,
        clicks: 2,
        revenue: 12.50, // 5 impressions * $2.50 CPM
        cpm: 2.50,
        cpc: 6.25 // $12.50 / 2 clicks
      };

      await prisma.publisherEarning.create({ data: earningsData });

      // Step 5: Verify Site Statistics
      const siteStats = await siteService.getSiteStats(testSiteId, testOrgId);
      
      expect(siteStats.totalImpressions).toBe(5);
      expect(siteStats.totalClicks).toBe(2);
      expect(siteStats.totalRevenue).toBe(12.50);
      expect(siteStats.ctr).toBe(40); // (2/5) * 100

      // Step 6: Verify Revenue Analytics
      const revenueAnalytics = await analyticsService.getRevenueAnalytics(testOrgId, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });

      expect(revenueAnalytics.metrics.totalRevenue).toBe(12.50);
      expect(revenueAnalytics.summary.profitMargin).toBe(100); // Publisher keeps 100% of revenue

      // Step 7: Get Top Performing Sites
      const topSites = await siteService.getTopPerformingSites(testOrgId, 10);
      
      expect(topSites).toHaveLength(1);
      expect(topSites[0].id).toBe(testSiteId);
      expect(topSites[0].totalRevenue).toBe(12.50);
    });

    it('should handle multiple ad units and revenue aggregation', async () => {
      const prisma = testDatabase.getClient();
      
      // Create site
      const site = await siteService.createSite(
        TestDataFactory.createSite({ organizationId: testOrgId }),
        testOrgId
      );

      // Create multiple ad units
      const adUnit1 = await adUnitService.createAdUnit(
        TestDataFactory.createAdUnit({
          organizationId: testOrgId,
          siteId: site.id,
          name: 'Header Banner',
          format: 'BANNER',
          size: '728x90'
        }),
        testOrgId
      );

      const adUnit2 = await adUnitService.createAdUnit(
        TestDataFactory.createAdUnit({
          organizationId: testOrgId,
          siteId: site.id,
          name: 'Sidebar Ad',
          format: 'BANNER',
          size: '300x250'
        }),
        testOrgId
      );

      // Add performance data for each ad unit
      await prisma.performanceMetrics.createMany({
        data: [
          {
            id: 'perf-1',
            organizationId: testOrgId,
            adUnitId: adUnit1.id,
            impressions: 1000,
            clicks: 50,
            conversions: 5,
            revenue: 250,
            spend: 100,
            date: new Date()
          },
          {
            id: 'perf-2',
            organizationId: testOrgId,
            adUnitId: adUnit2.id,
            impressions: 800,
            clicks: 40,
            conversions: 4,
            revenue: 200,
            spend: 80,
            date: new Date()
          }
        ]
      });

      // Verify aggregated site performance
      const siteStats = await siteService.getSiteStats(site.id, testOrgId);
      
      expect(siteStats.totalImpressions).toBe(1800);
      expect(siteStats.totalClicks).toBe(90);
      expect(siteStats.totalRevenue).toBe(450);
      expect(siteStats.ctr).toBe(5); // (90/1800) * 100
    });

    it('should track revenue trends over time', async () => {
      const prisma = testDatabase.getClient();
      
      // Create site and ad unit
      const site = await siteService.createSite(
        TestDataFactory.createSite({ organizationId: testOrgId }),
        testOrgId
      );

      const adUnit = await adUnitService.createAdUnit(
        TestDataFactory.createAdUnit({
          organizationId: testOrgId,
          siteId: site.id
        }),
        testOrgId
      );

      // Add earnings data over multiple days
      const earningsData = [
        {
          organizationId: testOrgId,
          siteId: site.id,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          impressions: 1000,
          clicks: 50,
          revenue: 25.00,
          cpm: 2.50,
          cpc: 0.50
        },
        {
          organizationId: testOrgId,
          siteId: site.id,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          impressions: 1200,
          clicks: 60,
          revenue: 30.00,
          cpm: 2.50,
          cpc: 0.50
        },
        {
          organizationId: testOrgId,
          siteId: site.id,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          impressions: 1100,
          clicks: 55,
          revenue: 27.50,
          cpm: 2.50,
          cpc: 0.50
        },
        {
          organizationId: testOrgId,
          siteId: site.id,
          date: new Date(), // Today
          impressions: 1300,
          clicks: 65,
          revenue: 32.50,
          cpm: 2.50,
          cpc: 0.50
        }
      ];

      await prisma.publisherEarning.createMany({ data: earningsData });

      // Verify revenue trends
      const revenueAnalytics = await analyticsService.getRevenueAnalytics(testOrgId, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });

      expect(revenueAnalytics.metrics.totalRevenue).toBe(115.00);
      expect(revenueAnalytics.metrics.totalImpressions).toBe(4600);
      expect(revenueAnalytics.metrics.totalClicks).toBe(230);

      // Check daily revenue trend
      const performanceAnalytics = await analyticsService.getPerformanceAnalytics(testOrgId, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        grouping: 'daily'
      });

      expect(performanceAnalytics.summary.totalImpressions).toBe(4600);
      expect(performanceAnalytics.summary.totalClicks).toBe(230);
      expect(performanceAnalytics.summary.avgCTR).toBe(5); // (230/4600) * 100
    });
  });

  describe('Publisher Site Management', () => {
    it('should handle site status changes and performance tracking', async () => {
      const prisma = testDatabase.getClient();
      
      // Create site
      const site = await siteService.createSite(
        TestDataFactory.createSite({ organizationId: testOrgId }),
        testOrgId
      );

      // Update site status
      const updatedSite = await siteService.updateSite(
        site.id,
        { status: 'SUSPENDED' },
        testOrgId
      );
      
      expect(updatedSite.status).toBe('SUSPENDED');

      // Reactivate site
      const reactivatedSite = await siteService.updateSite(
        site.id,
        { status: 'ACTIVE' },
        testOrgId
      );
      
      expect(reactivatedSite.status).toBe('ACTIVE');

      // Verify site is included in active sites
      const activeSites = await siteService.getSites(testOrgId, { status: 'ACTIVE' });
      expect(activeSites.some(s => s.id === site.id)).toBe(true);
    });
  });
}); 