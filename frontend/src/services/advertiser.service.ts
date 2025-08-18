import { apiService } from './api.service';

// Types for advertiser data
export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  type: 'DISPLAY' | 'VIDEO' | 'NATIVE' | 'SEARCH' | 'SOCIAL' | 'RETARGETING' | 'RTB' | 'PROGRAMMATIC';
  startDate?: string;
  endDate?: string;
  budget: number;
  budgetType: 'DAILY' | 'LIFETIME' | 'MONTHLY';
  bidStrategy: 'MANUAL' | 'AUTO_CPC' | 'AUTO_CPM' | 'TARGET_CPA' | 'PREDICTIVE' | 'AI_OPTIMIZED';
  targetCPM?: number;
  targetCPC?: number;
  targetCPA?: number;
  dailyBudget?: number;
  totalSpent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  createdAt: string;
  updatedAt: string;
  ads?: Ad[];
  audiences?: Audience[];
}

export interface Ad {
  id: string;
  organizationId: string;
  campaignId: string;
  name: string;
  creativeType: 'IMAGE' | 'VIDEO' | 'HTML5' | 'NATIVE' | 'TEXT';
  creativeUrl: string;
  landingPageUrl: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'REJECTED' | 'APPROVED';
  weight: number;
  targeting?: any;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign;
}

export interface Audience {
  id: string;
  organizationId: string;
  campaignId: string;
  name: string;
  description?: string;
  targeting?: any;
  size?: number;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign;
}

export interface CreateCampaignData {
  name: string;
  type: Campaign['type'];
  startDate?: string;
  endDate?: string;
  budget: number;
  budgetType: Campaign['budgetType'];
  bidStrategy: Campaign['bidStrategy'];
  targetCPM?: number;
  targetCPC?: number;
  targetCPA?: number;
  dailyBudget?: number;
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {
  status?: Campaign['status'];
}

export interface CreateAdData {
  name: string;
  creativeType: Ad['creativeType'];
  creativeUrl: string;
  landingPageUrl: string;
  weight?: number;
  targeting?: any;
}

export interface UpdateAdData extends Partial<CreateAdData> {
  status?: Ad['status'];
}

export interface CreateAudienceData {
  name: string;
  description?: string;
  targeting?: any;
}

export interface UpdateAudienceData extends Partial<CreateAudienceData> {}

export interface CampaignFilters {
  status?: Campaign['status'];
  type?: Campaign['type'];
  page?: number;
  limit?: number;
}

export interface AdFilters {
  status?: Ad['status'];
  creativeType?: Ad['creativeType'];
  campaignId?: string;
  page?: number;
  limit?: number;
}

export interface AudienceFilters {
  campaignId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AnalyticsSummary {
  summary: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    totalSpent: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    overallCTR: number;
    overallConversionRate: number;
    overallCPM: number;
    overallCPC: number;
    overallCPA: number;
  };
  topCampaigns: Array<{
    id: string;
    name: string;
    clicks: number;
    impressions: number;
    ctr: number;
    spent: number;
  }>;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

export interface CampaignAnalytics {
  campaign: {
    id: string;
    name: string;
    status: string;
    budget: number;
    totalSpent: number;
    budgetUtilization: number;
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
    cpm: number;
    cpc: number;
    cpa: number;
  };
  adPerformance: Array<{
    id: string;
    name: string;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpm: number;
  }>;
  dailyData: Array<{
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface AdAnalytics {
  ad: {
    id: string;
    name: string;
    status: string;
    creativeType: string;
    campaign: {
      id: string;
      name: string;
    };
  };
  performance: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    conversionRate: number;
    cpm: number;
    cpc: number;
  };
  hourlyData: Array<{
    hour: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

class AdvertiserService {
  // Campaign CRUD operations
  async getCampaigns(filters: CampaignFilters = {}, organizationId: string = 'demo-org'): Promise<PaginatedResponse<Campaign>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/api/v1/advertiser/campaigns${queryString ? `?${queryString}` : ''}`;
    
    return apiService.get<PaginatedResponse<Campaign>>(endpoint, organizationId);
  }

  async getCampaign(id: string, organizationId: string = 'demo-org'): Promise<{ campaign: Campaign }> {
    return apiService.get<{ message: string; campaign: Campaign }>(`/api/v1/advertiser/campaigns/${id}`, organizationId);
  }

  async createCampaign(data: CreateCampaignData, organizationId: string = 'demo-org'): Promise<{ message: string; campaign: Campaign }> {
    return apiService.post<{ message: string; campaign: Campaign }>('/api/v1/advertiser/campaigns', data, organizationId);
  }

  async updateCampaign(id: string, data: UpdateCampaignData, organizationId: string = 'demo-org'): Promise<{ message: string; campaign: Campaign }> {
    return apiService.put<{ message: string; campaign: Campaign }>(`/api/v1/advertiser/campaigns/${id}`, data, organizationId);
  }

  async updateCampaignStatus(id: string, status: Campaign['status'], organizationId: string = 'demo-org'): Promise<{ message: string; campaign: Campaign }> {
    return apiService.patch<{ message: string; campaign: Campaign }>(`/api/v1/advertiser/campaigns/${id}/status`, { status }, organizationId);
  }

  async deleteCampaign(id: string, organizationId: string = 'demo-org'): Promise<{ message: string; campaign: Campaign }> {
    return apiService.delete<{ message: string; campaign: Campaign }>(`/api/v1/advertiser/campaigns/${id}`, organizationId);
  }

  // Ad CRUD operations
  async getCampaignAds(campaignId: string, filters: AdFilters = {}): Promise<PaginatedResponse<Ad>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.creativeType) params.append('creativeType', filters.creativeType);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/api/v1/advertiser/campaigns/${campaignId}/ads${queryString ? `?${queryString}` : ''}`;
    
    return apiService.get<PaginatedResponse<Ad>>(endpoint);
  }

  async getAds(filters: AdFilters = {}): Promise<PaginatedResponse<Ad>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.creativeType) params.append('creativeType', filters.creativeType);
    if (filters.campaignId) params.append('campaignId', filters.campaignId);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/api/v1/advertiser/ads${queryString ? `?${queryString}` : ''}`;
    
    return apiService.get<PaginatedResponse<Ad>>(endpoint);
  }

  async getAd(id: string): Promise<{ ad: Ad }> {
    return apiService.get<{ ad: Ad }>(`/api/v1/advertiser/ads/${id}`);
  }

  async createAd(campaignId: string, data: CreateAdData): Promise<{ message: string; ad: Ad }> {
    return apiService.post<{ message: string; ad: Ad }>(`/api/v1/advertiser/campaigns/${campaignId}/ads`, data);
  }

  async updateAd(id: string, data: UpdateAdData): Promise<{ message: string; ad: Ad }> {
    return apiService.put<{ message: string; ad: Ad }>(`/api/v1/advertiser/ads/${id}`, data);
  }

  async updateAdStatus(id: string, status: Ad['status']): Promise<{ message: string; ad: Ad }> {
    return apiService.patch<{ message: string; ad: Ad }>(`/api/v1/advertiser/ads/${id}/status`, { status });
  }

  async deleteAd(id: string): Promise<{ message: string; ad: Ad }> {
    return apiService.delete<{ message: string; ad: Ad }>(`/api/v1/advertiser/ads/${id}`);
  }

  // Audience CRUD operations
  async getCampaignAudiences(campaignId: string, filters: AudienceFilters = {}): Promise<PaginatedResponse<Audience>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/api/v1/advertiser/campaigns/${campaignId}/audiences${queryString ? `?${queryString}` : ''}`;
    
    return apiService.get<PaginatedResponse<Audience>>(endpoint);
  }

  async getAudiences(filters: AudienceFilters = {}): Promise<PaginatedResponse<Audience>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = `/api/v1/advertiser/audiences${queryString ? `?${queryString}` : ''}`;
    
    return apiService.get<PaginatedResponse<Audience>>(endpoint);
  }

  async getAudience(id: string): Promise<{ audience: Audience }> {
    return apiService.get<{ audience: Audience }>(`/api/v1/advertiser/audiences/${id}`);
  }

  async createAudience(campaignId: string, data: CreateAudienceData): Promise<{ message: string; audience: Audience }> {
    return apiService.post<{ message: string; audience: Audience }>(`/api/v1/advertiser/campaigns/${campaignId}/audiences`, data);
  }

  async updateAudience(id: string, data: UpdateAudienceData): Promise<{ message: string; audience: Audience }> {
    return apiService.put<{ message: string; audience: Audience }>(`/api/v1/advertiser/audiences/${id}`, data);
  }

  async deleteAudience(id: string): Promise<{ message: string }> {
    return apiService.delete<{ message: string }>(`/api/v1/advertiser/audiences/${id}`);
  }

  // Analytics operations
  async getAnalyticsSummary(startDate?: string, endDate?: string, organizationId: string = 'demo-org'): Promise<AnalyticsSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const endpoint = `/api/v1/advertiser/analytics/summary${queryString ? `?${queryString}` : ''}`;
    
    return apiService.get<AnalyticsSummary>(endpoint, organizationId);
  }

  async getCampaignAnalytics(campaignId: string, startDate?: string, endDate?: string): Promise<CampaignAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const endpoint = `/api/v1/advertiser/campaigns/${campaignId}/analytics${queryString ? `?${queryString}` : ''}`;
    
    return apiService.get<CampaignAnalytics>(endpoint);
  }

  async getAdAnalytics(adId: string, startDate?: string, endDate?: string): Promise<AdAnalytics> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    const endpoint = `/api/v1/advertiser/ads/${adId}/analytics${queryString ? `?${queryString}` : ''}`;
    
    return apiService.get<AdAnalytics>(endpoint);
  }

  // Settings APIs
  async getUserProfile(userId: string, organizationId: string = 'demo-org'): Promise<{ user: any }> {
    return apiService.get<{ user: any }>(`/api/v1/advertiser/settings/profile/${userId}`, organizationId);
  }

  async updateUserProfile(userId: string, data: any, organizationId: string = 'demo-org'): Promise<{ message: string; user: any }> {
    return apiService.put<{ message: string; user: any }>(`/api/v1/advertiser/settings/profile/${userId}`, data, organizationId);
  }

  async changePassword(userId: string, data: any, organizationId: string = 'demo-org'): Promise<{ message: string }> {
    return apiService.post<{ message: string }>(`/api/v1/advertiser/settings/profile/${userId}/password`, data, organizationId);
  }

  async getCampaignPreferences(userId: string, organizationId: string = 'demo-org'): Promise<{ preferences: any }> {
    return apiService.get<{ preferences: any }>(`/api/v1/advertiser/settings/preferences/${userId}`, organizationId);
  }

  async updateCampaignPreferences(userId: string, data: any, organizationId: string = 'demo-org'): Promise<{ message: string; preferences: any }> {
    return apiService.put<{ message: string; preferences: any }>(`/api/v1/advertiser/settings/preferences/${userId}`, data, organizationId);
  }

  async getNotificationSettings(userId: string, organizationId: string = 'demo-org'): Promise<{ settings: any }> {
    return apiService.get<{ settings: any }>(`/api/v1/advertiser/settings/notifications/${userId}`, organizationId);
  }

  async updateNotificationSettings(userId: string, data: any, organizationId: string = 'demo-org'): Promise<{ message: string; settings: any }> {
    return apiService.put<{ message: string; settings: any }>(`/api/v1/advertiser/settings/notifications/${userId}`, data, organizationId);
  }

  async getSecuritySettings(userId: string, organizationId: string = 'demo-org'): Promise<{ settings: any }> {
    return apiService.get<{ settings: any }>(`/api/v1/advertiser/settings/security/${userId}`, organizationId);
  }

  async updateSecuritySettings(userId: string, data: any, organizationId: string = 'demo-org'): Promise<{ message: string; settings: any }> {
    return apiService.put<{ message: string; settings: any }>(`/api/v1/advertiser/settings/security/${userId}`, data, organizationId);
  }

  async exportData(userId: string, type: string, format: string, organizationId: string = 'demo-org'): Promise<any> {
    const params = new URLSearchParams();
    params.append('type', type);
    params.append('format', format);
    
    return apiService.get<any>(`/api/v1/advertiser/settings/export/${userId}?${params.toString()}`, organizationId);
  }
}

export const advertiserService = new AdvertiserService(); 