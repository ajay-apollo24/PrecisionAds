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
      headers: {
        'Authorization': 'Bearer invalid_token' // Send invalid token to get 401
      },
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
      headers: {
        'Authorization': 'Bearer invalid_token' // Send invalid token to get 401
      },
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
        'x-api-key': 'DYNAMIC_API_KEY', // Will be replaced by test data generator
        'x-organization-id': 'DYNAMIC_ORG_ID' // Will be replaced by test data generator
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
        'x-api-key': 'DYNAMIC_API_KEY', // Will be replaced by test data generator
        'x-organization-id': 'DYNAMIC_ORG_ID' // Will be replaced by test data generator
      },
      body: {
        identityId: 'DYNAMIC_IDENTITY_ID', // Will be replaced with actual identity ID
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
        'x-api-key': 'DYNAMIC_API_KEY', // Will be replaced by test data generator
        'x-organization-id': 'DYNAMIC_ORG_ID' // Will be replaced by test data generator
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
        'x-api-key': 'DYNAMIC_API_KEY', // Will be replaced by test data generator
        'x-organization-id': 'DYNAMIC_ORG_ID' // Will be replaced by test data generator
      },
      body: {
        identityId: 'DYNAMIC_IDENTITY_ID', // Will be replaced with actual identity ID
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
        'x-api-key': 'DYNAMIC_API_KEY', // Will be replaced by test data generator
        'x-organization-id': 'DYNAMIC_ORG_ID' // Will be replaced by test data generator
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
              identityId: 'DYNAMIC_IDENTITY_ID', // Will be replaced with actual identity ID
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
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        siteId: 'test_site_id',
        adUnitId: 'test_ad_unit_id',
        requestId: 'test_request_001',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '127.0.0.1'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.success && data.data.status === 'PENDING'
    },
    {
      name: 'Ad Request with Targeting',
      method: 'POST',
      endpoint: '/api/v1/ad-serving/request',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        siteId: 'test_site_id',
        adUnitId: 'test_ad_unit_id',
        requestId: 'test_request_002',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        ipAddress: '127.0.0.1',
        geoLocation: { country: 'US', city: 'New York' },
        deviceInfo: { deviceType: 'mobile', os: 'iOS' },
        targeting: { age: '25-34', interests: ['technology'] }
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.success && data.data.status === 'PENDING'
    },
    {
      name: 'Track Impression',
      method: 'POST',
      endpoint: '/api/v1/ad-serving/impression',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        adRequestId: 'test_ad_request_id',
        timestamp: new Date().toISOString()
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.success
    },
    {
      name: 'Track Click',
      method: 'POST',
      endpoint: '/api/v1/ad-serving/click',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        adRequestId: 'test_ad_request_id',
        timestamp: new Date().toISOString(),
        clickPosition: { x: 100, y: 200 }
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.success
    },
    {
      name: 'Track Conversion',
      method: 'POST',
      endpoint: '/api/v1/ad-serving/conversion',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        adRequestId: 'test_ad_request_id',
        conversionType: 'purchase',
        conversionValue: 99.99,
        timestamp: new Date().toISOString()
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.success
    },
    {
      name: 'Get Ad Request Status',
      method: 'GET',
      endpoint: '/api/v1/ad-serving/request/test_ad_request_id',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.success && data.data.id
    },
    {
      name: 'Get Ad Serving Metrics',
      method: 'GET',
      endpoint: '/api/v1/ad-serving/metrics?startDate=2024-01-01&endDate=2024-01-31',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.success && data.metrics
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
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.performanceData && data.aggregated && data.summary
    },
    {
      name: 'Get Performance Comparison',
      method: 'GET',
      endpoint: '/api/v1/analytics-reporting/performance/comparison?period1Start=2024-01-01&period1End=2024-01-15&period2Start=2024-01-16&period2End=2024-01-31',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.period1 && data.period2 && data.changes
    },
    {
      name: 'Get Performance Breakdown',
      method: 'GET',
      endpoint: '/api/v1/analytics-reporting/performance/breakdown?dimension=campaignId&startDate=2024-01-01&endDate=2024-01-31',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.dimension && data.breakdown
    },
    {
      name: 'Get Real-time Analytics',
      method: 'GET',
      endpoint: '/api/v1/analytics-reporting/realtime',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.realtimeMetrics && data.lastUpdated
    },
    {
      name: 'Get Revenue Analytics',
      method: 'GET',
      endpoint: '/api/v1/analytics-reporting/revenue?startDate=2024-01-01&endDate=2024-01-31',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.revenueData && data.metrics
    },
    {
      name: 'Get User Analytics',
      method: 'GET',
      endpoint: '/api/v1/analytics-reporting/users?startDate=2024-01-01&endDate=2024-01-31',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.userData && data.metrics
    },
    {
      name: 'Create Custom Report',
      method: 'POST',
      endpoint: '/api/v1/analytics-reporting/custom-reports',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        name: 'Test Report',
        description: 'Test Description',
        query: 'SELECT * FROM performance_metrics LIMIT 10',
        schedule: '0 0 * * *'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.message === 'Custom report created successfully'
    },
    {
      name: 'Get Custom Reports',
      method: 'GET',
      endpoint: '/api/v1/analytics-reporting/custom-reports',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => Array.isArray(data.reports)
    },
    {
      name: 'Get Campaign Analytics',
      method: 'GET',
      endpoint: '/api/v1/analytics-reporting/campaigns?startDate=2024-01-01&endDate=2024-01-31',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => Array.isArray(data.campaigns)
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
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.segments && Array.isArray(data.segments)
    },
    {
      name: 'Create Audience Segment',
      method: 'POST',
      endpoint: '/api/v1/audience-management/segments',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        name: 'Test Segment',
        description: 'Test Description',
        type: 'BEHAVIORAL',
        estimatedSize: 5000,
        status: 'DRAFT'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.id && data.name === 'Test Segment'
    },
    {
      name: 'Get Audience Insights',
      method: 'GET',
      endpoint: '/api/v1/audience-management/insights',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.demographicInsights && data.behavioralInsights
    },
    {
      name: 'Get Real-time Audience Data',
      method: 'GET',
      endpoint: '/api/v1/audience-management/insights/realtime',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.activeUsers !== undefined && data.recentEvents
    },
    {
      name: 'Get Audience Overlap',
      method: 'GET',
      endpoint: '/api/v1/audience-management/insights/overlap?segmentIds=segment-1,segment-2,segment-3',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.segmentIds && data.overlapData
    },
    {
      name: 'Get Targeting Rules',
      method: 'GET',
      endpoint: '/api/v1/audience-management/targeting-rules',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.rules && Array.isArray(data.rules)
    },
    {
      name: 'Create Targeting Rule',
      method: 'POST',
      endpoint: '/api/v1/audience-management/targeting-rules',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        name: 'Test Rule',
        description: 'Test Description',
        type: 'DEMOGRAPHIC',
        conditions: { age: { min: 18, max: 65 } },
        priority: 1,
        status: 'ACTIVE'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.id && data.name === 'Test Rule'
    },
    {
      name: 'Get Optimization Recommendations',
      method: 'GET',
      endpoint: '/api/v1/audience-management/optimization/recommendations',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.recommendations && Array.isArray(data.recommendations)
    },
    {
      name: 'Get Optimization History',
      method: 'GET',
      endpoint: '/api/v1/audience-management/optimization/history',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.optimizations && Array.isArray(data.optimizations)
    }
  ]
};

// Advertiser module test suite
export const advertiserTestSuite: TestSuite = {
  name: 'Advertiser Module Endpoints',
  tests: [
    {
      name: 'Get Campaigns',
      method: 'GET',
      endpoint: '/api/v1/advertiser/campaigns',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.campaigns && Array.isArray(data.campaigns)
    },
    {
      name: 'Get Campaigns with Filters',
      method: 'GET',
      endpoint: '/api/v1/advertiser/campaigns?status=ACTIVE&type=DISPLAY&page=1&limit=10',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.campaigns && data.pagination
    },
    {
      name: 'Get Single Campaign',
      method: 'GET',
      endpoint: '/api/v1/advertiser/campaigns/test_campaign_id',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.campaign && data.campaign.id
    },
    {
      name: 'Create Campaign',
      method: 'POST',
      endpoint: '/api/v1/advertiser/campaigns',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        name: 'Test Campaign',
        description: 'Test Description',
        type: 'DISPLAY',
        status: 'DRAFT',
        budget: 1000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        targeting: { age: '25-34', interests: ['technology'] }
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.campaign && data.campaign.name === 'Test Campaign'
    },
    {
      name: 'Update Campaign',
      method: 'PUT',
      endpoint: '/api/v1/advertiser/campaigns/test_campaign_id',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        name: 'Updated Campaign',
        budget: 1500
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.campaign && data.campaign.name === 'Updated Campaign'
    },
    {
      name: 'Get Ads',
      method: 'GET',
      endpoint: '/api/v1/advertiser/ads',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.ads && Array.isArray(data.ads)
    },
    {
      name: 'Create Ad',
      method: 'POST',
      endpoint: '/api/v1/advertiser/ads',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        name: 'Test Ad',
        description: 'Test Ad Description',
        campaignId: 'test_campaign_id',
        format: 'BANNER',
        size: '300x250',
        content: { title: 'Test Title', description: 'Test Description' },
        status: 'DRAFT'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.ad && data.ad.name === 'Test Ad'
    },
    {
      name: 'Get Audiences',
      method: 'GET',
      endpoint: '/api/v1/advertiser/audiences',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.audiences && Array.isArray(data.audiences)
    },
    {
      name: 'Create Audience',
      method: 'POST',
      endpoint: '/api/v1/advertiser/audiences',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        name: 'Test Audience',
        description: 'Test Audience Description',
        type: 'CUSTOM',
        criteria: { age: '25-34', location: 'US' },
        estimatedSize: 10000
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.audience && data.audience.name === 'Test Audience'
    },
    {
      name: 'Get Advertiser Analytics',
      method: 'GET',
      endpoint: '/api/v1/advertiser/analytics?startDate=2024-01-01&endDate=2024-01-31',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.analytics && data.metrics
    },
    {
      name: 'Get Campaign Performance',
      method: 'GET',
      endpoint: '/api/v1/advertiser/analytics/campaigns/test_campaign_id?startDate=2024-01-01&endDate=2024-01-31',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.performance && data.metrics
    },
    {
      name: 'Get Advertiser Settings',
      method: 'GET',
      endpoint: '/api/v1/advertiser/settings',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.settings
    },
    {
      name: 'Update Advertiser Settings',
      method: 'PUT',
      endpoint: '/api/v1/advertiser/settings',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        defaultBidStrategy: 'MANUAL',
        autoOptimization: true,
        notifications: { email: true, push: false }
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.settings && data.settings.autoOptimization === true
    }
  ]
};

// Advanced algorithms test suite
export const advancedAlgorithmsTestSuite: TestSuite = {
  name: 'Advanced Algorithms Endpoints',
  tests: [
    {
      name: 'Get AI Optimization Campaigns',
      method: 'GET',
      endpoint: '/api/v1/advanced-algorithms/ai-optimization/campaigns',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.campaigns && Array.isArray(data.campaigns)
    },
    {
      name: 'Create AI Optimization Campaign',
      method: 'POST',
      endpoint: '/api/v1/advanced-algorithms/ai-optimization/campaigns',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        name: 'Test AI Campaign',
        description: 'Test AI Optimization Campaign',
        optimizationType: 'BID_OPTIMIZATION',
        targetMetrics: ['CTR', 'CPC'],
        constraints: { budget: 1000, maxBid: 5.0 },
        budget: 1000,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.campaign && data.campaign.name === 'Test AI Campaign'
    },
    {
      name: 'Get AI Models',
      method: 'GET',
      endpoint: '/api/v1/advanced-algorithms/ai-optimization/models',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.models && Array.isArray(data.models)
    },
    {
      name: 'Get AI Recommendations',
      method: 'GET',
      endpoint: '/api/v1/advanced-algorithms/ai-optimization/recommendations',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.recommendations && Array.isArray(data.recommendations)
    },
    {
      name: 'Get Predictive Bidding Models',
      method: 'GET',
      endpoint: '/api/v1/advanced-algorithms/predictive-bidding/models',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.models && Array.isArray(data.models)
    },
    {
      name: 'Create Predictive Bidding Model',
      method: 'POST',
      endpoint: '/api/v1/advanced-algorithms/predictive-bidding/models',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        name: 'Test Bidding Model',
        description: 'Test Predictive Bidding Model',
        algorithm: 'RANDOM_FOREST',
        features: ['impressions', 'clicks', 'conversions'],
        targetMetric: 'CPC',
        status: 'TRAINING'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.model && data.model.name === 'Test Bidding Model'
    },
    {
      name: 'Get Predictive Bidding Predictions',
      method: 'POST',
      endpoint: '/api/v1/advanced-algorithms/predictive-bidding/predict',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        modelId: 'test_model_id',
        features: { impressions: 1000, clicks: 50, conversions: 5 }
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.prediction && data.confidence
    },
    {
      name: 'Get Programmatic Deals',
      method: 'GET',
      endpoint: '/api/v1/advanced-algorithms/programmatic/deals',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.deals && Array.isArray(data.deals)
    },
    {
      name: 'Create Programmatic Deal',
      method: 'POST',
      endpoint: '/api/v1/advanced-algorithms/programmatic/deals',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        name: 'Test Programmatic Deal',
        description: 'Test Programmatic Deal',
        type: 'PRIVATE_MARKETPLACE',
        publisherId: 'test_publisher_id',
        dealTerms: { floorPrice: 2.0, priority: 'HIGH' },
        targeting: { age: '25-34', interests: ['technology'] },
        budget: 5000,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.deal && data.deal.name === 'Test Programmatic Deal'
    },
    {
      name: 'Get Retargeting Campaigns',
      method: 'GET',
      endpoint: '/api/v1/advanced-algorithms/retargeting/campaigns',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.campaigns && Array.isArray(data.campaigns)
    },
    {
      name: 'Create Retargeting Campaign',
      method: 'POST',
      endpoint: '/api/v1/advanced-algorithms/retargeting/campaigns',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        name: 'Test Retargeting Campaign',
        description: 'Test Retargeting Campaign',
        type: 'ABANDONED_CART',
        audienceId: 'test_audience_id',
        bidStrategy: 'AUTOMATIC',
        budget: 2000,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.campaign && data.campaign.name === 'Test Retargeting Campaign'
    },
    {
      name: 'Get RTB Campaigns',
      method: 'GET',
      endpoint: '/api/v1/advanced-algorithms/rtb/campaigns',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.campaigns && Array.isArray(data.campaigns)
    },
    {
      name: 'Create RTB Campaign',
      method: 'POST',
      endpoint: '/api/v1/advanced-algorithms/rtb/campaigns',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      body: {
        name: 'Test RTB Campaign',
        description: 'Test RTB Campaign',
        type: 'OPEN_AUCTION',
        budget: 3000,
        maxBid: 3.0,
        targeting: { geo: 'US', device: 'MOBILE' },
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.campaign && data.campaign.name === 'Test RTB Campaign'
    },
    {
      name: 'Get RTB Bid Requests',
      method: 'GET',
      endpoint: '/api/v1/advanced-algorithms/rtb/bid-requests',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.bidRequests && Array.isArray(data.bidRequests)
    },
    {
      name: 'Get RTB Performance',
      method: 'GET',
      endpoint: '/api/v1/advanced-algorithms/rtb/performance?startDate=2024-01-01&endDate=2024-01-31',
      headers: {
        'x-organization-id': 'test-org-123'
      },
      expectedStatus: 200,
      validateResponse: (data: any) => data.performance && data.metrics
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
  advertiserTestSuite,
  advancedAlgorithmsTestSuite
];

export default allTestSuites; 