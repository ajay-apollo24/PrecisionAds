import { TestSuite, TestCase } from './api-tester';

// Health and basic endpoints
export const healthTestSuite: TestSuite = {
  name: 'Health & Basic Endpoints',
  tests: [
    {
      name: 'Health Check',
      method: 'GET',
      endpoint: '/health',
      expectedStatus: 200,
      validateResponse: (data: any) => data.status === 'OK'
    },
    {
      name: 'API Documentation',
      method: 'GET',
      endpoint: '/api/v1/docs',
      expectedStatus: 200,
      validateResponse: (data: any) => data.message === 'Precision Ads API Documentation'
    }
  ]
};

// Authentication endpoints
export const authTestSuite: TestSuite = {
  name: 'Authentication Endpoints',
  tests: [
    {
      name: 'User Registration',
      method: 'POST',
      endpoint: '/api/v1/auth/register',
      body: {
        email: 'testuser@example.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADVERTISER',
        organizationName: 'Test Org',
        orgType: 'ADVERTISER'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.message === 'User registered successfully'
    },
    {
      name: 'User Login',
      method: 'POST',
      endpoint: '/api/v1/auth/login',
      body: {
        email: 'superadmin@precisionads.com',
        password: 'superadmin123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.token && data.user
    }
  ]
};

// Admin module test suites
export const adminTestSuite: TestSuite = {
  name: 'Admin Module Endpoints',
  tests: [
    {
      name: 'Get All Organizations (Unauthorized)',
      method: 'GET',
      endpoint: '/api/v1/admin/organizations',
      expectedStatus: 401
    },
    {
      name: 'Get All Organizations (Authorized)',
      method: 'GET',
      endpoint: '/api/v1/admin/organizations',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success && Array.isArray(data.data)
    },
    {
      name: 'Get Organizations with Metrics',
      method: 'GET',
      endpoint: '/api/v1/admin/organizations/metrics',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success && Array.isArray(data.data)
    },
    {
      name: 'Get All Users',
      method: 'GET',
      endpoint: '/api/v1/admin/users',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success && Array.isArray(data.data)
    },
    {
      name: 'Get Users by Role',
      method: 'GET',
      endpoint: '/api/v1/admin/users/role/ADMIN',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success && Array.isArray(data.data)
    },
    {
      name: 'Get API Keys',
      method: 'GET',
      endpoint: '/api/v1/admin/api-keys',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success && Array.isArray(data.data)
    }
  ]
};

// Canonical spec test suites
export const canonicalTestSuite: TestSuite = {
  name: 'Canonical Specification Endpoints',
  tests: [
    {
      name: 'Create Identity (Unauthorized)',
      method: 'POST',
      endpoint: '/api/v1/admin/identities',
      body: {
        externalId: 'test_user_001',
        traits: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      },
      expectedStatus: 401
    },
    {
      name: 'Create Identity (API Key)',
      method: 'POST',
      endpoint: '/api/v1/admin/identities',
      headers: {
        'x-api-key': 'REPLACE_WITH_ACTUAL_API_KEY',
        'x-organization-id': 'REPLACE_WITH_ORG_ID'
      },
      body: {
        externalId: 'test_user_001',
        traits: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        },
        idempotencyKey: 'test_identity_001'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.success && data.data.externalId === 'test_user_001'
    },
    {
      name: 'Create Trait (API Key)',
      method: 'POST',
      endpoint: '/api/v1/admin/traits',
      headers: {
        'x-api-key': 'REPLACE_WITH_ACTUAL_API_KEY',
        'x-organization-id': 'REPLACE_WITH_ORG_ID'
      },
      body: {
        identityId: 'REPLACE_WITH_IDENTITY_ID',
        key: 'preferences',
        value: ['technology', 'sports'],
        type: 'ARRAY',
        idempotencyKey: 'test_trait_001'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.success && data.data.key === 'preferences'
    },
    {
      name: 'Create Cohort (API Key)',
      method: 'POST',
      endpoint: '/api/v1/admin/cohorts',
      headers: {
        'x-api-key': 'REPLACE_WITH_ACTUAL_API_KEY',
        'x-organization-id': 'REPLACE_WITH_ORG_ID'
      },
      body: {
        name: 'Tech Enthusiasts',
        description: 'Users interested in technology',
        type: 'BEHAVIORAL',
        criteria: {
          interests: ['technology', 'programming'],
          minVisits: 3
        },
        idempotencyKey: 'test_cohort_001'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.success && data.data.name === 'Tech Enthusiasts'
    },
    {
      name: 'Track Event (API Key)',
      method: 'POST',
      endpoint: '/api/v1/admin/events',
      headers: {
        'x-api-key': 'REPLACE_WITH_ACTUAL_API_KEY',
        'x-organization-id': 'REPLACE_WITH_ORG_ID'
      },
      body: {
        identityId: 'REPLACE_WITH_IDENTITY_ID',
        type: 'PAGE_VIEW',
        name: 'Homepage Visited',
        properties: {
          page: '/',
          referrer: 'google.com'
        },
        idempotencyKey: 'test_event_001'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.success && data.data.name === 'Homepage Visited'
    },
    {
      name: 'Batch Operations (API Key)',
      method: 'POST',
      endpoint: '/api/v1/admin/batch',
      headers: {
        'x-api-key': 'REPLACE_WITH_ACTUAL_API_KEY',
        'x-organization-id': 'REPLACE_WITH_ORG_ID'
      },
      body: {
        operations: [
          {
            id: 'op_1',
            type: 'identity',
            data: {
              externalId: 'batch_user_001',
              traits: { email: 'batch@example.com' }
            }
          },
          {
            id: 'op_2',
            type: 'trait',
            data: {
              identityId: 'REPLACE_WITH_IDENTITY_ID',
              key: 'batch_trait',
              value: 'batch_value',
              type: 'STRING'
            }
          }
        ]
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.success && data.results.total === 2
    }
  ]
};

// Publisher endpoints test suite
export const publisherTestSuite: TestSuite = {
  name: 'Publisher Module Endpoints',
  tests: [
    {
      name: 'Get Publisher Sites (Unauthorized)',
      method: 'GET',
      endpoint: '/api/v1/publisher/sites',
      expectedStatus: 401
    },
    {
      name: 'Get Publisher Sites (Authorized)',
      method: 'GET',
      endpoint: '/api/v1/publisher/sites',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success && Array.isArray(data.data)
    },
    {
      name: 'Get Ad Units',
      method: 'GET',
      endpoint: '/api/v1/publisher/ad-units',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success && Array.isArray(data.data)
    },
    {
      name: 'Get Earnings',
      method: 'GET',
      endpoint: '/api/v1/publisher/earnings',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success && Array.isArray(data.data)
    }
  ]
};

// Ad serving test suite
export const adServingTestSuite: TestSuite = {
  name: 'Ad Serving Endpoints',
  tests: [
    {
      name: 'Ad Request (Unauthorized)',
      method: 'POST',
      endpoint: '/api/v1/ad-serving/request',
      body: {
        siteId: 'test_site_id',
        adUnitId: 'test_ad_unit_id',
        requestId: 'test_request_001'
      },
      expectedStatus: 401
    },
    {
      name: 'Ad Request (Authorized)',
      method: 'POST',
      endpoint: '/api/v1/ad-serving/request',
      body: {
        siteId: 'REPLACE_WITH_SITE_ID',
        adUnitId: 'REPLACE_WITH_AD_UNIT_ID',
        requestId: 'test_request_001',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '127.0.0.1'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.success && data.data.status === 'PENDING'
    },
    {
      name: 'Track Impression',
      method: 'POST',
      endpoint: '/api/v1/ad-serving/impression',
      body: {
        adRequestId: 'REPLACE_WITH_AD_REQUEST_ID',
        timestamp: new Date().toISOString()
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.success
    },
    {
      name: 'Track Click',
      method: 'POST',
      endpoint: '/api/v1/ad-serving/click',
      body: {
        adRequestId: 'REPLACE_WITH_AD_REQUEST_ID',
        timestamp: new Date().toISOString(),
        clickPosition: { x: 100, y: 200 }
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.success
    }
  ]
};

// Analytics test suite
export const analyticsTestSuite: TestSuite = {
  name: 'Analytics & Reporting Endpoints',
  tests: [
    {
      name: 'Get Performance Analytics',
      method: 'GET',
      endpoint: '/api/v1/analytics-reporting/performance',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success
    }
  ]
};

// Audience management test suite
export const audienceTestSuite: TestSuite = {
  name: 'Audience Management Endpoints',
  tests: [
    {
      name: 'Get Audience Segments',
      method: 'GET',
      endpoint: '/api/v1/audience-management/segments',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success && Array.isArray(data.data)
    },
    {
      name: 'Get Audience Insights',
      method: 'GET',
      endpoint: '/api/v1/audience-management/insights',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success
    }
  ]
};

// Advanced algorithms test suite
export const advancedAlgorithmsTestSuite: TestSuite = {
  name: 'Advanced Algorithms Endpoints',
  tests: [
    {
      name: 'Get Retargeting Campaigns',
      method: 'GET',
      endpoint: '/api/v1/advanced-algorithms/retargeting',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success
    },
    {
      name: 'Get RTB Endpoints',
      method: 'GET',
      endpoint: '/api/v1/advanced-algorithms/rtb',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success
    },
    {
      name: 'Get AI Optimization',
      method: 'GET',
      endpoint: '/api/v1/advanced-algorithms/ai-optimization',
      expectedStatus: 200,
      validateResponse: (data: any) => data.success
    }
  ]
};

// All test suites
export const allTestSuites: TestSuite[] = [
  healthTestSuite,
  authTestSuite,
  adminTestSuite,
  canonicalTestSuite,
  publisherTestSuite,
  adServingTestSuite,
  analyticsTestSuite,
  audienceTestSuite,
  advancedAlgorithmsTestSuite
];

export default allTestSuites; 