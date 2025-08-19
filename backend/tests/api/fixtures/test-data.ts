/**
 * API Test Data Fixtures
 * 
 * Provides test data for API tests
 */

export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN'
  },
  advertiser: {
    email: 'advertiser@test.com',
    password: 'advertiser123',
    firstName: 'Advertiser',
    lastName: 'User',
    role: 'ADVERTISER'
  },
  publisher: {
    email: 'publisher@test.com',
    password: 'publisher123',
    firstName: 'Publisher',
    lastName: 'User',
    role: 'PUBLISHER'
  }
};

export const testOrganizations = {
  advertiser: {
    name: 'Test Advertiser',
    domain: 'advertiser.test',
    orgType: 'ADVERTISER',
    status: 'ACTIVE'
  },
  publisher: {
    name: 'Test Publisher',
    domain: 'publisher.test',
    orgType: 'PUBLISHER',
    status: 'ACTIVE'
  }
};

export const testCampaigns = {
  display: {
    name: 'Test Display Campaign',
    description: 'A test display campaign',
    type: 'DISPLAY',
    budget: 1000,
    budgetType: 'DAILY',
    bidStrategy: 'MANUAL',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  video: {
    name: 'Test Video Campaign',
    description: 'A test video campaign',
    type: 'VIDEO',
    budget: 2000,
    budgetType: 'LIFETIME',
    bidStrategy: 'AUTO_CPM',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  }
};

export const testAds = {
  banner: {
    name: 'Test Banner Ad',
    creativeType: 'IMAGE',
    creativeUrl: 'https://example.com/banner.jpg',
    landingPageUrl: 'https://example.com/landing',
    weight: 100
  },
  video: {
    name: 'Test Video Ad',
    creativeType: 'VIDEO',
    creativeUrl: 'https://example.com/video.mp4',
    landingPageUrl: 'https://example.com/landing',
    weight: 100
  }
};

export const testSites = {
  news: {
    name: 'Test News Site',
    url: 'https://news.test.com',
    domain: 'news.test.com',
    status: 'ACTIVE'
  },
  blog: {
    name: 'Test Blog Site',
    url: 'https://blog.test.com',
    domain: 'blog.test.com',
    status: 'ACTIVE'
  }
};

export const testAdUnits = {
  banner: {
    name: 'Header Banner',
    format: 'BANNER',
    size: '728x90',
    status: 'ACTIVE'
  },
  sidebar: {
    name: 'Sidebar Ad',
    format: 'BANNER',
    size: '300x250',
    status: 'ACTIVE'
  }
};

export const testAudienceSegments = {
  young: {
    name: 'Young Adults',
    description: 'Adults aged 18-25',
    criteria: {
      age: '18-25',
      interests: ['technology', 'gaming'],
      location: 'US'
    },
    size: 50000
  },
  professionals: {
    name: 'Professionals',
    description: 'Working professionals aged 25-45',
    criteria: {
      age: '25-45',
      interests: ['business', 'technology'],
      location: 'US'
    },
    size: 100000
  }
}; 