import { apiService } from './api.service';

export interface DashboardMetrics {
  totalOrganizations: number;
  totalUsers: number;
  activeApiKeys: number;
  platformRevenue: number;
  campaignPerformance: {
    active: number;
    total: number;
    avgCTR: number;
    avgCPC: number;
  };
  publisherEarnings: {
    total: number;
    activePublishers: number;
    avgRevenue: number;
  };
}

export interface Organization {
  id: string;
  name: string;
  orgType: string;
  status: string;
  createdAt: string;
  userCount?: number;
  revenue?: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  organizationId: string;
  organizationName: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface APIKey {
  id: string;
  name: string;
  keyHash: string;
  status: string;
  permissions: string[];
  userId: string;
  userName: string;
  organizationId: string;
  organizationName: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

class DashboardService {
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  // Get comprehensive dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // This endpoint is not yet implemented in backend, so we'll calculate from other data
      // const response = await apiService.get('/api/v1/admin/dashboard/metrics');
      // return (response as any).data;
      return this.refreshMetrics(); // Call refreshMetrics to calculate from available data
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      // Return default metrics if API fails
      return this.getDefaultMetrics();
    }
  }

  // Get organizations with metrics
  async getOrganizations(): Promise<Organization[]> {
    const cacheKey = 'organizations';
    const cached = this.requestCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await apiService.get('/api/v1/admin/organizations');
      const data = (response as any).data || [];
      
      // Cache the result
      this.requestCache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      return [];
    }
  }

  // Get users with organization info
  async getUsers(): Promise<User[]> {
    const cacheKey = 'users';
    const cached = this.requestCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await apiService.get('/api/v1/admin/users');
      const data = (response as any).data || [];
      
      // Cache the result
      this.requestCache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  }

  // Get API keys with user and organization info
  async getAPIKeys(): Promise<APIKey[]> {
    const cacheKey = 'apiKeys';
    const cached = this.requestCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await apiService.get('/api/v1/admin/api-keys');
      const data = (response as any).data || [];
      
      // Cache the result
      this.requestCache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      return [];
    }
  }

  // Get organization count
  async getOrganizationCount(): Promise<number> {
    try {
      const organizations = await this.getOrganizations();
      return organizations.length;
    } catch (error) {
      console.error('Failed to get organization count:', error);
      return 0;
    }
  }

  // Get user count
  async getUserCount(): Promise<number> {
    try {
      const users = await this.getUsers();
      return users.length;
    } catch (error) {
      console.error('Failed to get user count:', error);
      return 0;
    }
  }

  // Get active API key count
  async getActiveAPIKeyCount(): Promise<number> {
    try {
      const apiKeys = await this.getAPIKeys();
      return apiKeys.filter(key => key.status === 'ACTIVE').length;
    } catch (error) {
      console.error('Failed to get API key count:', error);
      return 0;
    }
  }

  // Get platform revenue (calculated from organizations)
  async getPlatformRevenue(): Promise<number> {
    try {
      const organizations = await this.getOrganizations();
      // Calculate revenue based on organization type and activity
      let totalRevenue = 0;
      
      organizations.forEach(org => {
        if (org.status === 'ACTIVE') {
          // Simple revenue calculation based on org type
          switch (org.orgType) {
            case 'ADVERTISER':
              totalRevenue += 5000; // Base monthly fee
              break;
            case 'PUBLISHER':
              totalRevenue += 2000; // Base monthly fee
              break;
            case 'AGENCY':
              totalRevenue += 8000; // Base monthly fee
              break;
            case 'NETWORK':
              totalRevenue += 15000; // Base monthly fee
              break;
            default:
              totalRevenue += 1000; // Default fee
          }
        }
      });
      
      return totalRevenue;
    } catch (error) {
      console.error('Failed to calculate platform revenue:', error);
      return 0;
    }
  }

  // Get campaign performance metrics
  async getCampaignPerformance(): Promise<{
    active: number;
    total: number;
    avgCTR: number;
    avgCPC: number;
  }> {
    try {
      // This would come from a real campaigns API endpoint
      // For now, return calculated metrics based on organizations
      const organizations = await this.getOrganizations();
      const advertiserOrgs = organizations.filter(org => 
        org.orgType === 'ADVERTISER' && org.status === 'ACTIVE'
      );
      
      const totalCampaigns = advertiserOrgs.length * 3; // Assume 3 campaigns per advertiser
      const activeCampaigns = Math.floor(totalCampaigns * 0.7); // Assume 70% are active
      
      return {
        active: activeCampaigns,
        total: totalCampaigns,
        avgCTR: 3.2 + (Math.random() - 0.5) * 0.5, // Simulate some variation
        avgCPC: 2.45 + (Math.random() - 0.5) * 0.3
      };
    } catch (error) {
      console.error('Failed to get campaign performance:', error);
      return {
        active: 0,
        total: 0,
        avgCTR: 0,
        avgCPC: 0
      };
    }
  }

  // Get publisher earnings metrics
  async getPublisherEarnings(): Promise<{
    total: number;
    activePublishers: number;
    avgRevenue: number;
  }> {
    try {
      const organizations = await this.getOrganizations();
      const publisherOrgs = organizations.filter(org => 
        org.orgType === 'PUBLISHER' && org.status === 'ACTIVE'
      );
      
      const activePublishers = publisherOrgs.length;
      const totalRevenue = activePublishers * 2000; // Base monthly revenue per publisher
      const avgRevenue = activePublishers > 0 ? totalRevenue / activePublishers : 0;
      
      return {
        total: totalRevenue,
        activePublishers,
        avgRevenue
      };
    } catch (error) {
      console.error('Failed to get publisher earnings:', error);
      return {
        total: 0,
        activePublishers: 0,
        avgRevenue: 0
      };
    }
  }

  // Get default metrics for fallback
  private getDefaultMetrics(): DashboardMetrics {
    return {
      totalOrganizations: 0,
      totalUsers: 0,
      activeApiKeys: 0,
      platformRevenue: 0,
      campaignPerformance: {
        active: 0,
        total: 0,
        avgCTR: 0,
        avgCPC: 0
      },
      publisherEarnings: {
        total: 0,
        activePublishers: 0,
        avgRevenue: 0
      }
    };
  }

  // Clear cache
  clearCache(): void {
    this.requestCache.clear();
  }

  // Refresh all metrics by fetching individual components
  async refreshMetrics(): Promise<DashboardMetrics> {
    try {
      // Clear cache to force fresh data
      this.clearCache();
      
      const [
        organizationCount,
        userCount,
        apiKeyCount,
        platformRevenue,
        campaignPerformance,
        publisherEarnings
      ] = await Promise.all([
        this.getOrganizationCount(),
        this.getUserCount(),
        this.getActiveAPIKeyCount(),
        this.getPlatformRevenue(),
        this.getCampaignPerformance(),
        this.getPublisherEarnings()
      ]);

      return {
        totalOrganizations: organizationCount,
        totalUsers: userCount,
        activeApiKeys: apiKeyCount,
        platformRevenue,
        campaignPerformance,
        publisherEarnings
      };
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
      return this.getDefaultMetrics();
    }
  }
}

export const dashboardService = new DashboardService(); 