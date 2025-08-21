import { PublisherSite, AdUnit, EarningsSummary } from '../services/publisher.service';

export function generateMockPublisherData() {
  // Generate mock sites
  const mockSites: PublisherSite[] = [
    {
      id: 'site-1',
      organizationId: 'org-1',
      name: 'TechBlog.com',
      domain: 'techblog.com',
      status: 'ACTIVE',
      settings: { theme: 'dark', language: 'en' },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      adUnits: [
        {
          id: 'unit-1',
          name: 'Header Banner',
          format: 'BANNER',
          status: 'ACTIVE'
        },
        {
          id: 'unit-2',
          name: 'Sidebar Ad',
          format: 'BANNER',
          status: 'ACTIVE'
        }
      ],
      earnings: [
        {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          revenue: 1250.50,
          impressions: 45000,
          clicks: 225
        },
        {
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          revenue: 1180.75,
          impressions: 42000,
          clicks: 198
        }
      ]
    },
    {
      id: 'site-2',
      organizationId: 'org-1',
      name: 'LifestyleMag.net',
      domain: 'lifestylemag.net',
      status: 'ACTIVE',
      settings: { theme: 'light', language: 'en' },
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      adUnits: [
        {
          id: 'unit-3',
          name: 'Article Banner',
          format: 'BANNER',
          status: 'ACTIVE'
        }
      ],
      earnings: [
        {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          revenue: 890.25,
          impressions: 32000,
          clicks: 156
        }
      ]
    }
  ];

  // Generate mock ad units
  const mockAdUnits: AdUnit[] = [
    {
      id: 'unit-1',
      organizationId: 'org-1',
      siteId: 'site-1',
      name: 'Header Banner',
      size: '728x90',
      format: 'BANNER',
      status: 'ACTIVE',
      settings: { targeting: { location: 'US' } },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'unit-2',
      organizationId: 'org-1',
      siteId: 'site-1',
      name: 'Sidebar Ad',
      size: '300x250',
      format: 'BANNER',
      status: 'ACTIVE',
      settings: { targeting: { category: 'technology' } },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Generate mock earnings summary
  const mockEarningsSummary: EarningsSummary = {
    summary: {
      totalImpressions: 156000,
      totalClicks: 3120,
      totalRevenue: 3240.50,
      averageCPM: 20.77,
      averageCPC: 1.04
    },
    topSites: [
      {
        siteId: 'site-1',
        _sum: {
          revenue: 2431.25,
          impressions: 87000,
          clicks: 423
        }
      },
      {
        siteId: 'site-2',
        _sum: {
          revenue: 809.25,
          impressions: 69000,
          clicks: 156
        }
      }
    ]
  };

  return {
    sites: mockSites,
    adUnits: mockAdUnits,
    earningsSummary: mockEarningsSummary
  };
}

export function generateMockAdRequestData() {
  return {
    adRequests: [
      {
        id: 'req-1',
        siteId: 'site-1',
        adUnitId: 'unit-1',
        requestId: 'req-12345678',
        status: 'SERVED',
        servedAdId: 'ad-1',
        bidAmount: 2.50,
        cpm: 25.00,
        clickThrough: false,
        impression: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        adUnit: {
          name: 'Header Banner',
          size: '728x90',
          format: 'BANNER'
        }
      },
      {
        id: 'req-2',
        siteId: 'site-1',
        adUnitId: 'unit-2',
        requestId: 'req-87654321',
        status: 'SERVED',
        servedAdId: 'ad-2',
        bidAmount: 1.80,
        cpm: 18.00,
        clickThrough: true,
        impression: true,
        createdAt: new Date(Date.now() - 1000 * 60).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60).toISOString(),
        adUnit: {
          name: 'Sidebar Ad',
          size: '300x250',
          format: 'BANNER'
        }
      }
    ],
    stats: {
      stats: [
        { status: 'SERVED', _count: { status: 150 } },
        { status: 'PROCESSED', _count: { status: 25 } },
        { status: 'PENDING', _count: { status: 10 } },
        { status: 'FAILED', _count: { status: 5 } }
      ],
      summary: {
        totalRequests: 190,
        totalImpressions: 150,
        totalClicks: 45,
        ctr: 30.0
      }
    }
  };
} 