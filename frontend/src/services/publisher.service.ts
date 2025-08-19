import { apiService } from './api.service';

export interface PublisherSite {
  id: string;
  organizationId: string;
  name: string;
  domain: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  settings: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  adUnits: AdUnitSummary[];
  earnings: EarningSummary[];
}

export interface AdUnitSummary {
  id: string;
  name: string;
  format: string;
  status: string;
}

export interface EarningSummary {
  date: string;
  revenue: number;
  impressions: number;
  clicks: number;
}

export interface CreateSiteData {
  name: string;
  domain: string;
  settings?: Record<string, any>; 
}

export interface UpdateSiteData {
  name?: string;
  domain?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  settings?: Record<string, any>;
}

export interface AdUnit {
  id: string;
  organizationId: string;
  siteId: string;
  name: string;
  size: string;
  format: 'BANNER' | 'VIDEO' | 'NATIVE' | 'DISPLAY' | 'INTERSTITIAL';
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING';
  settings: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdUnitData {
  name: string;
  size: string;
  format: 'BANNER' | 'VIDEO' | 'NATIVE' | 'DISPLAY' | 'INTERSTITIAL';
  settings?: Record<string, any>;
}

export interface UpdateAdUnitData {
  name?: string;
  size?: string;
  format?: 'BANNER' | 'VIDEO' | 'NATIVE' | 'DISPLAY' | 'INTERSTITIAL';
  status?: 'ACTIVE' | 'INACTIVE' | 'TESTING';
  settings?: Record<string, any>;
}

export interface SiteStats {
  totalImpressions: number;
  totalClicks: number;
  totalRevenue: number;
  activeAdUnits: number;
  totalAdRequests: number;
  ctr: number;
}

export interface EarningsSummary {
  summary: {
    totalImpressions: number;
    totalClicks: number;
    totalRevenue: number;
    averageCPM: number;
    averageCPC: number;
  };
  topSites: Array<{
    siteId: string;
    _sum: {
      revenue: number;
      impressions: number;
      clicks: number;
    };
  }>;
}

class PublisherService {
  private baseUrl = '/api/publisher';

  // Site Management
  async getSites(): Promise<PublisherSite[]> {
    const response = await apiService.get(`${this.baseUrl}/sites`) as any;
    return response.sites;
  }

  async getSiteById(id: string): Promise<PublisherSite | null> {
    try {
      const response = await apiService.get(`${this.baseUrl}/sites/${id}`) as any;
      return response.site;
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async createSite(data: CreateSiteData): Promise<PublisherSite> {
    const response = await apiService.post(`${this.baseUrl}/sites`, data) as any;
    return response.site;
  }

  async updateSite(id: string, data: UpdateSiteData): Promise<PublisherSite> {
    const response = await apiService.put(`${this.baseUrl}/sites/${id}`, data) as any;
    return response.site;
  }

  async deleteSite(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/sites/${id}`);
  }

  async getSiteStats(siteId: string, startDate?: string, endDate?: string): Promise<SiteStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiService.get(`${this.baseUrl}/sites/${siteId}/stats?${params}`) as any;
    return response.stats;
  }

  // Ad Unit Management
  async getAdUnits(siteId: string): Promise<AdUnit[]> {
    const response = await apiService.get(`${this.baseUrl}/sites/${siteId}/ad-units`) as any;
    return response.adUnits;
  }

  async createAdUnit(siteId: string, data: CreateAdUnitData): Promise<AdUnit> {
    const response = await apiService.post(`${this.baseUrl}/sites/${siteId}/ad-units`, data) as any;
    return response.adUnit;
  }

  async updateAdUnit(id: string, data: UpdateAdUnitData): Promise<AdUnit> {
    const response = await apiService.put(`${this.baseUrl}/ad-units/${id}`, data) as any;
    return response.adUnit;
  }

  async deleteAdUnit(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/ad-units/${id}`);
  }

  // Earnings & Analytics
  async getEarningsSummary(startDate?: string, endDate?: string): Promise<EarningsSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiService.get(`${this.baseUrl}/earnings/summary?${params}`) as any;
    return response;
  }

  async getSiteEarnings(siteId: string, startDate?: string, endDate?: string, groupBy: 'day' | 'month' = 'day') {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('groupBy', groupBy);
    
    const response = await apiService.get(`${this.baseUrl}/sites/${siteId}/earnings?${params}`) as any;
    return response;
  }

  // Ad Request Analytics
  async getAdRequests(siteId: string, page: number = 1, limit: number = 50, status?: string) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    
    const response = await apiService.get(`${this.baseUrl}/sites/${siteId}/ad-requests?${params}`) as any;
    return response;
  }

  async getAdRequestStats(siteId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiService.get(`${this.baseUrl}/sites/${siteId}/ad-requests/stats?${params}`) as any;
    return response;
  }

  // Tracking Events
  async trackImpression(data: any): Promise<void> {
    await apiService.post(`${this.baseUrl}/impression`, data);
  }

  async trackClick(data: any): Promise<void> {
    await apiService.post(`${this.baseUrl}/click`, data);
  }

  async trackConversion(data: any): Promise<void> {
    await apiService.post(`${this.baseUrl}/conversion`, data);
  }

  async getTrackingStats(siteId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiService.get(`${this.baseUrl}/tracking/stats/${siteId}?${params}`) as any;
    return response.data;
  }
}

export const publisherService = new PublisherService(); 