/**
 * Campaign Lifecycle Integration Test
 * 
 * Tests the complete workflow from campaign creation to performance tracking
 */

import { testDatabase } from '../utils/test-database';
import { TestDataFactory } from '../utils/test-data-factory';
import { AnalyticsService } from '../../../src/modules/analytics-reporting/services/analytics.service';
import { CampaignService } from '../../../src/modules/advertiser/services/campaign.service';
import { AdService } from '../../../src/modules/advertiser/services/ad.service';
import { AudienceService } from '../../../src/modules/advertiser/services/audience.service';
import { Prisma } from '@prisma/client';

const { Decimal } = Prisma;

describe('Campaign Lifecycle Integration', () => {
  let analyticsService: AnalyticsService;
  let campaignService: CampaignService;
  let adService: AdService;
  let audienceService: AudienceService;
  let testOrgId: string;
  let testCampaignId: string;
  let testAdId: string;
  let testAudienceId: string;

  beforeAll(async () => {
    await testDatabase.setup();
    
    const prisma = testDatabase.getClient();
    analyticsService = new AnalyticsService();
    campaignService = new CampaignService();
    adService = new AdService();
    audienceService = new AudienceService();
    
    // Create test organization
    const testOrg = TestDataFactory.createOrganization();
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

  describe('Complete Campaign Workflow', () => {
    it('should handle full campaign lifecycle from creation to performance tracking', async () => {
      const prisma = testDatabase.getClient();
      
      // Step 1: Create Campaign
      const campaignData = TestDataFactory.createCampaign({
        organizationId: testOrgId,
        status: 'ACTIVE',
        budget: new Decimal(5000),
        budgetType: 'DAILY',
        bidStrategy: 'AUTO_CPM'
      });

      const campaign = await campaignService.createCampaign(campaignData, testOrgId);
      testCampaignId = campaign.id;
      
      expect(campaign.status).toBe('ACTIVE');
      expect(campaign.budget).toBe(5000);
      expect(campaign.organizationId).toBe(testOrgId);

      // Step 2: Create Audience
      const audienceData = TestDataFactory.createAudienceSegment({
        organizationId: testOrgId,
        campaignId: testCampaignId,
        targeting: { interests: ['technology'], age: '25-35' }
      });

      const audience = await audienceService.createAudience(audienceData, testOrgId);
      testAudienceId = audience.id;
      
      expect(audience.campaignId).toBe(testCampaignId);
      expect(audience.organizationId).toBe(testOrgId);

      // Step 3: Create Ad
      const adData = TestDataFactory.createAd({
        organizationId: testOrgId,
        campaignId: testCampaignId
      });

      const ad = await adService.createAd(adData, testOrgId);
      testAdId = ad.id;
      
      expect(ad.campaignId).toBe(testCampaignId);
      expect(ad.organizationId).toBe(testOrgId);

      // Step 4: Simulate Performance Data
      const performanceData = [
        TestDataFactory.createPerformanceData({
          organizationId: testOrgId,
          campaignId: testCampaignId,
          adId: testAdId,
          impressions: 1000,
          clicks: 50,
          conversions: 5,
          revenue: 250,
          spend: 100,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
        }),
        TestDataFactory.createPerformanceData({
          organizationId: testOrgId,
          campaignId: testCampaignId,
          adId: testAdId,
          impressions: 1200,
          clicks: 60,
          conversions: 6,
          revenue: 300,
          spend: 120,
          date: new Date() // Today
        })
      ];

      await prisma.performanceMetrics.createMany({ data: performanceData });

      // Step 5: Verify Campaign Performance
      const campaignStats = await campaignService.getCampaignStats(testCampaignId, testOrgId);
      
      expect(campaignStats.totalImpressions).toBe(2200);
      expect(campaignStats.totalClicks).toBe(110);
      expect(campaignStats.totalConversions).toBe(11);
      expect(campaignStats.totalSpent).toBe(220);

      // Step 6: Verify Analytics Integration
      const analytics = await analyticsService.getPerformanceAnalytics(testOrgId, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        grouping: 'daily'
      });

      expect(analytics.summary.totalImpressions).toBe(2200);
      expect(analytics.summary.totalClicks).toBe(110);
      expect(analytics.summary.totalConversions).toBe(11);
      expect(analytics.summary.avgCTR).toBe(5); // (110/2200) * 100

      // Step 7: Verify Revenue Analytics
      const revenueAnalytics = await analyticsService.getRevenueAnalytics(testOrgId, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });

      expect(revenueAnalytics.metrics.totalRevenue).toBe(550);
      expect(revenueAnalytics.metrics.totalCost).toBe(220);
      expect(revenueAnalytics.metrics.totalProfit).toBe(330);
      expect(revenueAnalytics.summary.profitMargin).toBe(60); // (330/550) * 100

      // Step 8: Update Campaign Budget
      const updatedCampaign = await campaignService.updateCampaign(
        testCampaignId,
        { budget: new Decimal(7500) },
        testOrgId
      );
      
      expect(updatedCampaign.budget).toBe(7500);

      // Step 9: Verify Campaign Status After Updates
      const finalCampaign = await campaignService.getCampaignById(testCampaignId, testOrgId);
      expect(finalCampaign).toBeDefined();
      expect(finalCampaign?.budget).toBe(7500);
      expect(finalCampaign?.status).toBe('ACTIVE');
    });

    it('should handle campaign pause and resume workflow', async () => {
      const prisma = testDatabase.getClient();
      
      // Create campaign
      const campaignData = TestDataFactory.createCampaign({
        organizationId: testOrgId,
        status: 'ACTIVE'
      });

      const campaign = await campaignService.createCampaign(campaignData, testOrgId);
      
      // Pause campaign
      const pausedCampaign = await campaignService.updateCampaign(
        campaign.id,
        { status: 'PAUSED' },
        testOrgId
      );
      
      expect(pausedCampaign.status).toBe('PAUSED');

      // Resume campaign
      const resumedCampaign = await campaignService.updateCampaign(
        campaign.id,
        { status: 'ACTIVE' },
        testOrgId
      );
      
      expect(resumedCampaign.status).toBe('ACTIVE');
    });

    it('should track budget consumption and spending limits', async () => {
      const prisma = testDatabase.getClient();
      
      // Create campaign with daily budget
      const campaignData = TestDataFactory.createCampaign({
        organizationId: testOrgId,
        budget: new Decimal(1000),
        budgetType: 'DAILY',
        status: 'ACTIVE'
      });

      const campaign = await campaignService.createCampaign(campaignData, testOrgId);
      
      // Add performance data with spending
      const performanceData = TestDataFactory.createPerformanceData({
        organizationId: testOrgId,
        campaignId: campaign.id,
        spend: new Decimal(800),
        date: new Date()
      });

      await prisma.performanceMetrics.create({ data: performanceData });

      // Verify budget tracking
      const campaignStats = await campaignService.getCampaignStats(campaign.id, testOrgId);
      expect(campaignStats.totalSpent).toBe(800);
      
      // Check if budget limit is respected
      expect(campaignStats.totalSpent).toBeLessThanOrEqual(campaign.budget);
    });
  });

  describe('Multi-Campaign Performance Comparison', () => {
    it('should compare performance across multiple campaigns', async () => {
      const prisma = testDatabase.getClient();
      
      // Create multiple campaigns
      const campaign1 = await campaignService.createCampaign(
        TestDataFactory.createCampaign({
          organizationId: testOrgId,
          name: 'High-Performance Campaign',
          budget: new Decimal(5000)
        }),
        testOrgId
      );

      const campaign2 = await campaignService.createCampaign(
        TestDataFactory.createCampaign({
          organizationId: testOrgId,
          name: 'Low-Performance Campaign',
          budget: new Decimal(3000)
        }),
        testOrgId
      );

      // Add performance data
      await prisma.performanceMetrics.createMany({
        data: [
          TestDataFactory.createPerformanceData({
            organizationId: testOrgId,
            campaignId: campaign1.id,
            impressions: 2000,
            clicks: 200,
            conversions: 20,
            revenue: new Decimal(1000),
            spend: new Decimal(400)
          }),
          TestDataFactory.createPerformanceData({
            organizationId: testOrgId,
            campaignId: campaign2.id,
            impressions: 1500,
            clicks: 75,
            conversions: 5,
            revenue: new Decimal(300),
            spend: new Decimal(300)
          })
        ]
      });

      // Compare campaigns
      const comparison = await analyticsService.compareCampaigns(
        testOrgId,
        [campaign1.id, campaign2.id],
        {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      );

      expect(comparison.campaigns).toHaveLength(2);
      expect(comparison.summary.totalImpressions).toBe(3500);
      expect(comparison.summary.totalRevenue).toBe(1300);
      
      // Campaign 1 should have better performance
      const campaign1Data = comparison.campaigns.find(c => c.id === campaign1.id);
      const campaign2Data = comparison.campaigns.find(c => c.id === campaign2.id);
      
      expect(campaign1Data?.ctr).toBeGreaterThan(campaign2Data?.ctr || 0);
      expect(campaign1Data?.conversionRate).toBeGreaterThan(campaign2Data?.conversionRate || 0);
    });
  });
}); 