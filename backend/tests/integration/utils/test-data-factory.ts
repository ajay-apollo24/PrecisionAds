/**
 * Test Data Factory
 * 
 * Provides utilities for generating test data for integration tests.
 */

import { faker } from '@faker-js/faker';

export class TestDataFactory {
  /**
   * Generate a test organization
   */
  static createOrganization(overrides: Partial<any> = {}) {
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      domain: faker.internet.domainName(),
      orgType: faker.helpers.arrayElement(['ADVERTISER', 'PUBLISHER', 'AGENCY']),
      status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'PENDING']),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate a test user
   */
  static createUser(overrides: Partial<any> = {}) {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      password: 'hashedpassword123',
      role: faker.helpers.arrayElement(['SUPER_ADMIN', 'ADMIN', 'PUBLISHER', 'ADVERTISER', 'ANALYST', 'MANAGER', 'VIEWER']),
      organizationId: faker.string.uuid(),
      status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate a test campaign
   */
  static createCampaign(overrides: Partial<any> = {}) {
    return {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']),
      type: faker.helpers.arrayElement(['DISPLAY', 'VIDEO', 'NATIVE', 'SEARCH', 'SOCIAL', 'RETARGETING', 'RTB', 'PROGRAMMATIC']),
      budget: parseFloat(faker.finance.amount()),
      budgetType: faker.helpers.arrayElement(['DAILY', 'LIFETIME', 'MONTHLY']),
      bidStrategy: faker.helpers.arrayElement(['MANUAL', 'AUTO_CPC', 'AUTO_CPM', 'TARGET_CPA', 'PREDICTIVE', 'AI_OPTIMIZED']),
      startDate: faker.date.past(),
      endDate: faker.date.future(),
      organizationId: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate a test ad
   */
  static createAd(overrides: Partial<any> = {}) {
    return {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      creativeType: faker.helpers.arrayElement(['IMAGE', 'VIDEO', 'HTML5', 'NATIVE', 'TEXT']),
      creativeUrl: faker.internet.url(),
      landingPageUrl: faker.internet.url(),
      status: faker.helpers.arrayElement(['DRAFT', 'ACTIVE', 'PAUSED', 'REJECTED', 'APPROVED']),
      weight: faker.number.int({ min: 1, max: 100 }),
      campaignId: faker.string.uuid(),
      organizationId: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate test audience segment
   */
  static createAudienceSegment(overrides: Partial<any> = {}) {
    return {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(),
      criteria: {
        age: faker.helpers.arrayElement(['18-25', '26-35', '36-45']),
        location: faker.location.country(),
        interests: faker.helpers.arrayElements(['sports', 'technology', 'fashion'], 2)
      },
      size: faker.number.int({ min: 1000, max: 100000 }),
      organizationId: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate test site
   */
  static createSite(overrides: Partial<any> = {}) {
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      url: faker.internet.url(),
      domain: faker.internet.domainName(),
      status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED']),
      organizationId: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate test ad unit
   */
  static createAdUnit(overrides: Partial<any> = {}) {
    return {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      format: faker.helpers.arrayElement(['BANNER', 'VIDEO', 'NATIVE', 'DISPLAY', 'INTERSTITIAL']),
      size: faker.helpers.arrayElement(['728x90', '300x250', '160x600']),
      status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'TESTING']),
      siteId: faker.string.uuid(),
      organizationId: faker.string.uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Generate test performance data
   */
  static createPerformanceData(overrides: Partial<any> = {}) {
    return {
      id: faker.string.uuid(),
      impressions: faker.number.int({ min: 100, max: 10000 }),
      clicks: faker.number.int({ min: 10, max: 1000 }),
      conversions: faker.number.int({ min: 1, max: 100 }),
      revenue: parseFloat(faker.finance.amount()),
      spend: parseFloat(faker.finance.amount()),
      date: faker.date.recent(),
      organizationId: faker.string.uuid(),
      ...overrides
    };
  }
}

export default TestDataFactory; 