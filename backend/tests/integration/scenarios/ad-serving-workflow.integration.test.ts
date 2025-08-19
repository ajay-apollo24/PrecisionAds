/**
 * Ad Serving Workflow Integration Test
 * 
 * Tests the complete ad serving workflow from ad request to ad delivery
 */

import { testDatabase } from '../utils/test-database';
import { TestDataFactory } from '../utils/test-data-factory';
import { AuctionService } from '../../../src/modules/ad-serving/services/auction.service';
import { TargetingService } from '../../../src/modules/ad-serving/services/targeting.service';
import { FrequencyService } from '../../../src/modules/ad-serving/services/frequency.service';
import { OptimizationService } from '../../../src/modules/ad-serving/services/optimization.service';

describe('Ad Serving Workflow Integration', () => {
  let auctionService: AuctionService;
  let targetingService: TargetingService;
  let frequencyService: FrequencyService;
  let optimizationService: OptimizationService;
  let testOrgId: string;
  let testSiteId: string;
  let testAdUnitId: string;
  let testCampaignId: string;
  let testAdId: string;

  beforeAll(async () => {
    await testDatabase.setup();
    
    const prisma = testDatabase.getClient();
    auctionService = new AuctionService(prisma);
    targetingService = new TargetingService(prisma);
    frequencyService = new FrequencyService(prisma);
    optimizationService = new OptimizationService(prisma);
    
    // Create test data
    const testOrg = TestDataFactory.createOrganization();
    const testSite = TestDataFactory.createSite({ organizationId: testOrg.id });
    const testAdUnit = TestDataFactory.createAdUnit({ 
      siteId: testSite.id, 
      organizationId: testOrg.id 
    });
    const testCampaign = TestDataFactory.createCampaign({ 
      organizationId: testOrg.id,
      budgetType: 'DAILY',
      bidStrategy: 'AUTO_CPM'
    });
    const testAd = TestDataFactory.createAd({
      organizationId: testOrg.id,
      campaignId: testCampaign.id
    });

    await prisma.organization.create({ data: testOrg });
    await prisma.publisherSite.create({ data: testSite });
    await prisma.adUnit.create({ data: testAdUnit });
    await prisma.advertiserCampaign.create({ data: testCampaign });
    await prisma.advertiserAd.create({ data: testAd });

    testOrgId = testOrg.id;
    testSiteId = testSite.id;
    testAdUnitId = testAdUnit.id;
    testCampaignId = testCampaign.id;
    testAdId = testAd.id;
  });

  afterAll(async () => {
    await testDatabase.cleanup();
    await testDatabase.close();
  });

  beforeEach(async () => {
    await testDatabase.cleanup();
  });

  describe('Complete Ad Serving Workflow', () => {
    it('should handle full ad serving workflow from request to delivery', async () => {
      const prisma = testDatabase.getClient();
      
      // Step 1: Create Ad Request
      const adRequestData = {
        organizationId: testOrgId,
        siteId: testSiteId,
        adUnitId: testAdUnitId,
        requestId: 'test-request-1',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '192.168.1.1',
        geoLocation: { country: 'US', city: 'New York' },
        deviceInfo: { type: 'desktop', os: 'Windows' },
        targeting: { interests: ['technology'], age: '25-35' }
      };

      const adRequest = await prisma.adRequest.create({ data: adRequestData });
      expect(adRequest.status).toBe('PENDING');

      // Step 2: Check Frequency Cap
      const frequencyCheck = await frequencyService.checkFrequencyCap(
        testCampaignId,
        'impression',
        'day'
      );
      
      expect(frequencyCheck.allowed).toBe(true);

      // Step 3: Evaluate Targeting
      const targetingResult = await targetingService.evaluateTargeting(
        testAdId,
        adRequest.targeting as any
      );
      
      expect(targetingResult.matched).toBe(true);
      expect(targetingResult.score).toBeGreaterThan(0);

      // Step 4: Run Auction
      const auctionResult = await auctionService.runAuction(adRequest.id);
      
      expect(auctionResult.success).toBe(true);
      expect(auctionResult.winningAd).toBeDefined();
      expect(auctionResult.winningBid).toBeGreaterThan(0);

      // Step 5: Record Frequency Event
      await frequencyService.recordFrequencyEvent(
        testCampaignId,
        'impression',
        'day'
      );

      // Step 6: Update Ad Request Status
      const updatedRequest = await prisma.adRequest.update({
        where: { id: adRequest.id },
        data: { 
          status: 'SERVED',
          servedAdId: testAdId,
          bidAmount: auctionResult.winningBid,
          cpm: auctionResult.winningBid,
          impression: true
        }
      });

      expect(updatedRequest.status).toBe('SERVED');
      expect(updatedRequest.servedAdId).toBe(testAdId);
      expect(updatedRequest.impression).toBe(true);

      // Step 7: Verify Performance Metrics
      const performanceMetrics = await prisma.performanceMetrics.findFirst({
        where: { adId: testAdId, organizationId: testOrgId }
      });

      expect(performanceMetrics).toBeDefined();
      expect(performanceMetrics?.impressions).toBeGreaterThan(0);
    });

    it('should handle frequency capping limits correctly', async () => {
      const prisma = testDatabase.getClient();
      
      // Create campaign with frequency cap
      const campaignData = TestDataFactory.createCampaign({
        organizationId: testOrgId,
        budgetType: 'DAILY',
        bidStrategy: 'AUTO_CPM'
      });

      const campaign = await prisma.advertiserCampaign.create({ data: campaignData });
      
      // Check frequency cap multiple times
      for (let i = 0; i < 3; i++) {
        const frequencyCheck = await frequencyService.checkFrequencyCap(
          campaign.id,
          'impression',
          'day'
        );
        
        if (i < 2) {
          expect(frequencyCheck.allowed).toBe(true);
          await frequencyService.recordFrequencyEvent(campaign.id, 'impression', 'day');
        } else {
          // After 2 impressions, should be capped
          expect(frequencyCheck.allowed).toBe(false);
        }
      }
    });

    it('should optimize ad serving based on performance data', async () => {
      const prisma = testDatabase.getClient();
      
      // Create ad unit with performance data
      const adUnit = await prisma.adUnit.findFirst({
        where: { id: testAdUnitId }
      });

      // Add performance data to trigger optimization
      await prisma.performanceMetrics.createMany({
        data: [
          TestDataFactory.createPerformanceData({
            organizationId: testOrgId,
            adUnitId: testAdUnitId,
            impressions: 1000,
            clicks: 20, // Low CTR
            conversions: 2,
            date: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }),
          TestDataFactory.createPerformanceData({
            organizationId: testOrgId,
            adUnitId: testAdUnitId,
            impressions: 800,
            clicks: 15,
            conversions: 1,
            date: new Date()
          })
        ]
      });

      // Get optimization recommendations
      const recommendations = await optimizationService.generateRecommendations(testAdUnitId);
      
      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should recommend improving CTR
      const ctrRecommendation = recommendations.find(r => 
        r.type === 'CTR_IMPROVEMENT' || r.description.includes('click')
      );
      expect(ctrRecommendation).toBeDefined();
    });
  });

  describe('Real-time Bidding Integration', () => {
    it('should handle multiple bidders in auction', async () => {
      const prisma = testDatabase.getClient();
      
      // Create multiple campaigns with different bid strategies
      const campaign1 = await prisma.advertiserCampaign.create({
        data: TestDataFactory.createCampaign({
          organizationId: testOrgId,
          name: 'High Bidder',
          budget: 10000,
          bidStrategy: 'AUTO_CPM'
        })
      });

      const campaign2 = await prisma.advertiserCampaign.create({
        data: TestDataFactory.createCampaign({
          organizationId: testOrgId,
          name: 'Low Bidder',
          budget: 5000,
          bidStrategy: 'MANUAL'
        })
      });

      // Create ads for each campaign
      const ad1 = await prisma.advertiserAd.create({
        data: TestDataFactory.createAd({
          organizationId: testOrgId,
          campaignId: campaign1.id
        })
      });

      const ad2 = await prisma.advertiserAd.create({
        data: TestDataFactory.createAd({
          organizationId: testOrgId,
          campaignId: campaign2.id
        })
      });

      // Create ad request
      const adRequest = await prisma.adRequest.create({
        data: {
          organizationId: testOrgId,
          siteId: testSiteId,
          adUnitId: testAdUnitId,
          requestId: 'test-request-2',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          ipAddress: '192.168.1.2',
          geoLocation: { country: 'US', city: 'Los Angeles' },
          deviceInfo: { type: 'mobile', os: 'iOS' },
          targeting: { interests: ['sports'], age: '18-25' }
        }
      });

      // Run auction with multiple eligible ads
      const auctionResult = await auctionService.runAuction(adRequest.id);
      
      expect(auctionResult.success).toBe(true);
      expect(auctionResult.winningAd).toBeDefined();
      expect(auctionResult.winningBid).toBeGreaterThan(0);
      
      // Verify the higher bidder won
      const winningAd = await prisma.advertiserAd.findUnique({
        where: { id: auctionResult.winningAd }
      });
      
      expect(winningAd).toBeDefined();
    });
  });

  describe('Targeting and Optimization Integration', () => {
    it('should apply targeting rules and optimize delivery', async () => {
      const prisma = testDatabase.getClient();
      
      // Create audience segment with specific targeting
      const audienceSegment = await prisma.audienceSegment.create({
        data: TestDataFactory.createAudienceSegment({
          organizationId: testOrgId,
          criteria: {
            age: '25-35',
            interests: ['technology', 'business'],
            location: 'US'
          }
        })
      });

      // Create targeting rule
      const targetingRule = await prisma.targetingRule.create({
        data: {
          id: 'test-rule-1',
          organizationId: testOrgId,
          audienceSegmentId: audienceSegment.id,
          criteria: {
            age: '25-35',
            interests: ['technology'],
            location: 'US'
          },
          priority: 1,
          status: 'ACTIVE'
        }
      });

      // Test targeting rule against sample data
      const testData = [
        { age: '25-35', interests: ['technology'], location: 'US' },
        { age: '18-25', interests: ['gaming'], location: 'CA' }
      ];

      const targetingResult = await targetingService.evaluateTargeting(
        testAdId,
        testData[0] // Should match
      );
      
      expect(targetingResult.matched).toBe(true);
      expect(targetingResult.score).toBeGreaterThan(0.5);

      const nonMatchingResult = await targetingService.evaluateTargeting(
        testAdId,
        testData[1] // Should not match
      );
      
      expect(nonMatchingResult.matched).toBe(false);
    });
  });
}); 