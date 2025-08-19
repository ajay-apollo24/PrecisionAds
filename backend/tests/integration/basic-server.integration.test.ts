/**
 * Basic Server Integration Test
 * 
 * Tests basic connectivity and database operations against the running server
 */

import { testDatabase } from './utils/test-database';
import { TestDataFactory } from './utils/test-data-factory';

describe('Basic Server Integration', () => {
  beforeAll(async () => {
    await testDatabase.setup();
  });

  afterAll(async () => {
    await testDatabase.cleanup();
    await testDatabase.close();
  });

  beforeEach(async () => {
    await testDatabase.cleanup();
  });

  it('should connect to database and create basic entities', async () => {
    const prisma = testDatabase.getClient();
    
    // Test 1: Create Organization
    const orgData = TestDataFactory.createOrganization();
    const organization = await prisma.organization.create({ data: orgData });
    
    expect(organization).toBeDefined();
    expect(organization.id).toBe(orgData.id);
    expect(organization.name).toBe(orgData.name);
    expect(organization.orgType).toBe(orgData.orgType);

    // Test 2: Create User
    const userData = TestDataFactory.createUser({
      organizationId: organization.id,
      role: 'ADMIN' // Use valid role
    });
    const user = await prisma.user.create({ data: userData });
    
    expect(user).toBeDefined();
    expect(user.organizationId).toBe(organization.id);
    expect(user.email).toBe(userData.email);

    // Test 3: Create Campaign
    const campaignData = TestDataFactory.createCampaign({
      organizationId: organization.id
    });
    const campaign = await prisma.advertiserCampaign.create({ data: campaignData });
    
    expect(campaign).toBeDefined();
    expect(campaign.organizationId).toBe(organization.id);
    expect(campaign.name).toBe(campaignData.name);

    // Test 4: Create Site
    const siteData = TestDataFactory.createSite({
      organizationId: organization.id
    });
    const site = await prisma.publisherSite.create({ data: siteData });
    
    expect(site).toBeDefined();
    expect(site.organizationId).toBe(organization.id);
    expect(site.name).toBe(siteData.name);

    // Test 5: Create Ad Unit
    const adUnitData = TestDataFactory.createAdUnit({
      organizationId: organization.id,
      siteId: site.id
    });
    const adUnit = await prisma.adUnit.create({ data: adUnitData });
    
    expect(adUnit).toBeDefined();
    expect(adUnit.siteId).toBe(site.id);
    expect(adUnit.organizationId).toBe(organization.id);

    // Test 6: Create Performance Metrics
    const performanceData = TestDataFactory.createPerformanceData({
      organizationId: organization.id
    });
    const performance = await prisma.performanceMetrics.create({ data: performanceData });
    
    expect(performance).toBeDefined();
    expect(performance.organizationId).toBe(organization.id);
    expect(performance.impressions).toBe(performanceData.impressions);

    // Test 7: Query relationships
    const orgWithRelations = await prisma.organization.findUnique({
      where: { id: organization.id },
      include: {
        users: true,
        advertiserCampaigns: true,
        publisherSites: {
          include: {
            adUnits: true
          }
        }
      }
    });

    expect(orgWithRelations).toBeDefined();
    expect(orgWithRelations?.users).toHaveLength(1);
    expect(orgWithRelations?.advertiserCampaigns).toHaveLength(1);
    expect(orgWithRelations?.publisherSites).toHaveLength(1);
    expect(orgWithRelations?.publisherSites[0].adUnits).toHaveLength(1);
  });

  it('should handle database transactions correctly', async () => {
    const prisma = testDatabase.getClient();
    
    // Test transaction rollback on error
    try {
      await prisma.$transaction(async (tx) => {
        // Create valid organization
        const org = await tx.organization.create({
          data: TestDataFactory.createOrganization()
        });
        
        // Try to create invalid user (missing required fields)
        await tx.user.create({
          data: {
            id: 'test-user',
            email: 'test@test.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            role: 'ADMIN',
            organizationId: org.id,
            status: 'ACTIVE'
          }
        });
      });
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Transaction should rollback
      expect(error).toBeDefined();
      
      // Verify organization was not created
      const orgs = await prisma.organization.findMany();
      expect(orgs).toHaveLength(0);
    }
  });

  it('should handle concurrent database operations', async () => {
    const prisma = testDatabase.getClient();
    
    // Create base organization
    const org = await prisma.organization.create({
      data: TestDataFactory.createOrganization()
    });
    
    // Perform concurrent operations
    const promises = Array.from({ length: 5 }, (_, i) => 
      prisma.user.create({
        data: TestDataFactory.createUser({
          id: `user-${i}`,
          organizationId: org.id
        })
      })
    );
    
    const users = await Promise.all(promises);
    
    expect(users).toHaveLength(5);
    users.forEach(user => {
      expect(user.organizationId).toBe(org.id);
    });
    
    // Verify all users were created
    const allUsers = await prisma.user.findMany({
      where: { organizationId: org.id }
    });
    expect(allUsers).toHaveLength(5);
  });
}); 