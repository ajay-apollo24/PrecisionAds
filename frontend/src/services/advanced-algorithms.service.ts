import { apiService } from './api.service';

// Types for Advanced Algorithms
export interface AIOptimizationCampaign {
  id: string;
  name: string;
  organizationId: string;
  optimizationType: 'PERFORMANCE' | 'REVENUE' | 'EFFICIENCY' | 'TARGETING' | 'BIDDING';
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ERROR';
  parameters: Record<string, any>;
  performance: {
    improvement: number;
    metrics: Record<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PredictiveBiddingModel {
  id: string;
  name: string;
  organizationId: string;
  modelType: 'LINEAR_REGRESSION' | 'RANDOM_FOREST' | 'GRADIENT_BOOSTING' | 'NEURAL_NETWORK';
  status: 'TRAINING' | 'ACTIVE' | 'INACTIVE' | 'ERROR';
  accuracy: number;
  trainingTime: number;
  epochs: number;
  loss: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RTBCampaign {
  id: string;
  name: string;
  organizationId: string;
  exchangeId: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  budget: number;
  targeting: Record<string, any>;
  performance: {
    impressions: number;
    clicks: number;
    spend: number;
    ctr: number;
    cpm: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgrammaticDeal {
  id: string;
  name: string;
  organizationId: string;
  type: 'PREFERRED_DEAL' | 'PRIVATE_MARKETPLACE' | 'PROGRAMMATIC_GUARANTEED';
  publisherId: string;
  campaignId: string;
  dealTerms: Record<string, any>;
  targeting: Record<string, any>;
  budget: number;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetargetingCampaign {
  id: string;
  name: string;
  organizationId: string;
  description?: string;
  targetAudience: Record<string, any>;
  retargetingRules: Record<string, any>;
  frequencyCaps: Record<string, any>;
  bidStrategy: string;
  budget: number;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OptimizationParameters {
  optimizationType: 'PERFORMANCE' | 'REVENUE' | 'EFFICIENCY' | 'TARGETING' | 'BIDDING';
  parameters: Record<string, any>;
}

export interface BidPredictionRequest {
  modelId: string;
  auctionData: Record<string, any>;
  context: Record<string, any>;
}

export interface UserEvent {
  userId: string;
  event: Record<string, any>;
}

export interface RetargetingRecommendation {
  userId: string;
  campaigns: string[];
  recommendations: Record<string, any>;
  nextActions: string[];
}

export class AdvancedAlgorithmsService {
  private baseUrl = '/api/v1/advanced-algorithms';

  // AI Optimization Methods
  async getAIOptimizationCampaigns(organizationId: string, page = 1, limit = 10) {
    const queryParams = new URLSearchParams({
      organizationId,
      page: page.toString(),
      limit: limit.toString()
    });
    return apiService.get(`${this.baseUrl}/ai-optimization/campaigns?${queryParams}`, organizationId);
  }

  async createAIOptimizationCampaign(organizationId: string, campaign: Partial<AIOptimizationCampaign>) {
    return apiService.post(`${this.baseUrl}/ai-optimization/campaigns`, {
      ...campaign,
      organizationId
    });
  }

  async executeAIOptimization(campaignId: string, organizationId: string, params: OptimizationParameters) {
    return apiService.post(`${this.baseUrl}/ai-optimization/campaigns/${campaignId}/execute`, {
      organizationId,
      ...params
    });
  }

  async getAIOptimizationStatus(campaignId: string, organizationId: string) {
    return apiService.get(`${this.baseUrl}/ai-optimization/campaigns/${campaignId}/status`, organizationId);
  }

  async applyAIRecommendation(campaignId: string, recommendationId: string, organizationId: string) {
    return apiService.post(`${this.baseUrl}/ai-optimization/recommendations/${recommendationId}/apply`, {
      campaignId,
      organizationId
    }, organizationId);
  }

  async generateAIInsights(campaignId: string, organizationId: string) {
    return apiService.post(`${this.baseUrl}/ai-optimization/campaigns/${campaignId}/insights`, {
      organizationId
    }, organizationId);
  }

  // Predictive Bidding Methods
  async getPredictiveBiddingModels(organizationId: string, page = 1, limit = 10) {
    const queryParams = new URLSearchParams({
      organizationId,
      page: page.toString(),
      limit: limit.toString()
    });
    return apiService.get(`${this.baseUrl}/predictive-bidding/models?${queryParams}`, organizationId);
  }

  async createPredictiveBiddingModel(organizationId: string, model: Partial<PredictiveBiddingModel>) {
    return apiService.post(`${this.baseUrl}/predictive-bidding/models`, {
      ...model,
      organizationId
    }, organizationId);
  }

  async trainPredictiveBiddingModel(modelId: string, trainingData: any[], parameters: Record<string, any>, organizationId: string) {
    return apiService.post(`${this.baseUrl}/predictive-bidding/models/${modelId}/train`, {
      trainingData,
      parameters,
      organizationId
    }, organizationId);
  }

  async executePredictiveBidding(modelId: string, organizationId: string, request: BidPredictionRequest) {
    return apiService.post(`${this.baseUrl}/predictive-bidding/models/${modelId}/execute`, {
      organizationId,
      ...request
    }, organizationId);
  }

  async evaluatePredictiveBiddingModel(modelId: string, organizationId: string, testData: any[]) {
    return apiService.post(`${this.baseUrl}/predictive-bidding/models/${modelId}/evaluate`, {
      organizationId,
      testData
    }, organizationId);
  }

  // RTB Methods
  async getRTBCampaigns(organizationId: string, page = 1, limit = 10) {
    const queryParams = new URLSearchParams({
      organizationId,
      page: page.toString(),
      limit: limit.toString()
    });
    return apiService.get(`${this.baseUrl}/rtb/campaigns?${queryParams}`, organizationId);
  }

  async createRTBCampaign(organizationId: string, campaign: Partial<RTBCampaign>) {
    return apiService.post(`${this.baseUrl}/rtb/campaigns`, {
      ...campaign,
      organizationId
    }, organizationId);
  }

  async executeRTBDeal(campaignId: string, organizationId: string, adRequest: any, exchangeId?: string) {
    return apiService.post(`${this.baseUrl}/rtb/campaigns/${campaignId}/execute`, {
      organizationId,
      adRequest,
      exchangeId
    }, organizationId);
  }

  async getRTBPerformance(campaignId: string, organizationId: string) {
    return apiService.get(`${this.baseUrl}/rtb/campaigns/${campaignId}/performance/service`, organizationId);
  }

  async getRTBPerformanceMetrics(organizationId: string, startDate?: Date, endDate?: Date) {
    const queryParams = new URLSearchParams({
      organizationId,
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && { endDate: endDate.toISOString() })
    });
    return apiService.get(`${this.baseUrl}/rtb/performance?${queryParams}`, organizationId);
  }

  // Programmatic Deals Methods
  async getProgrammaticDeals(organizationId: string, page = 1, limit = 10) {
    const queryParams = new URLSearchParams({
      organizationId,
      page: page.toString(),
      limit: limit.toString()
    });
    return apiService.get(`${this.baseUrl}/programmatic/deals?${queryParams}`, organizationId);
  }

  async createProgrammaticDeal(organizationId: string, deal: Partial<ProgrammaticDeal>) {
    return apiService.post(`${this.baseUrl}/programmatic/deals`, {
      ...deal,
      organizationId
    }, organizationId);
  }

  async executeProgrammaticDeal(dealId: string, organizationId: string, adRequest: any) {
    return apiService.post(`${this.baseUrl}/programmatic/deals/${dealId}/execute`, {
      organizationId,
      adRequest
    }, organizationId);
  }

  async getInventoryAvailability(publisherId: string, organizationId: string, targeting?: Record<string, any>, startDate?: Date, endDate?: Date) {
    const queryParams = new URLSearchParams({
      publisherId,
      organizationId,
      ...(targeting && { targeting: JSON.stringify(targeting) }),
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && { endDate: endDate.toISOString() })
    });
    return apiService.get(`${this.baseUrl}/programmatic/inventory/availability?${queryParams}`, organizationId);
  }

  async optimizeProgrammaticDeals(organizationId: string) {
    return apiService.post(`${this.baseUrl}/programmatic/optimize`, {
      organizationId
    }, organizationId);
  }

  // Retargeting Methods
  async getRetargetingCampaigns(organizationId: string, page = 1, limit = 10) {
    const queryParams = new URLSearchParams({
      organizationId,
      page: page.toString(),
      limit: limit.toString()
    });
    return apiService.get(`${this.baseUrl}/retargeting/campaigns?${queryParams}`, organizationId);
  }

  async createRetargetingCampaign(organizationId: string, campaign: Partial<RetargetingCampaign>) {
    return apiService.post(`${this.baseUrl}/retargeting/campaigns`, {
      ...campaign,
      organizationId
    }, organizationId);
  }

  async processUserEvent(organizationId: string, event: UserEvent) {
    return apiService.post(`${this.baseUrl}/retargeting/events`, {
      organizationId,
      ...event
    }, organizationId);
  }

  async getRetargetingRecommendations(userId: string, organizationId: string, context?: Record<string, any>) {
    const queryParams = new URLSearchParams({
      organizationId,
      ...(context && { context: JSON.stringify(context) })
    });
    return apiService.get(`${this.baseUrl}/retargeting/recommendations/${userId}?${queryParams}`, organizationId);
  }

  async optimizeRetargetingCampaigns(organizationId: string) {
    return apiService.post(`${this.baseUrl}/retargeting/optimize`, {
      organizationId
    });
  }

  // Utility Methods
  async getAdvancedAlgorithmsSummary(organizationId: string) {
    const [aiCampaigns, predictiveModels, rtbCampaigns, programmaticDeals, retargetingCampaigns] = await Promise.all([
      this.getAIOptimizationCampaigns(organizationId, 1, 5),
      this.getPredictiveBiddingModels(organizationId, 1, 5),
      this.getRTBCampaigns(organizationId, 1, 5),
      this.getProgrammaticDeals(organizationId, 1, 5),
      this.getRetargetingCampaigns(organizationId, 1, 5)
    ]);

    return {
      aiOptimization: {
        total: (aiCampaigns as any)?.total || 0,
        active: (aiCampaigns as any)?.campaigns?.filter((c: any) => c.status === 'ACTIVE').length || 0,
        campaigns: (aiCampaigns as any)?.campaigns || []
      },
      predictiveBidding: {
        total: (predictiveModels as any)?.total || 0,
        active: (predictiveModels as any)?.models?.filter((m: any) => m.status === 'ACTIVE').length || 0,
        models: (predictiveModels as any)?.models || []
      },
      rtb: {
        total: (rtbCampaigns as any)?.total || 0,
        active: (rtbCampaigns as any)?.campaigns?.filter((c: any) => c.status === 'ACTIVE').length || 0,
        campaigns: (rtbCampaigns as any)?.campaigns || []
      },
      programmatic: {
        total: (programmaticDeals as any)?.total || 0,
        active: (programmaticDeals as any)?.deals?.filter((d: any) => d.status === 'ACTIVE').length || 0,
        deals: (programmaticDeals as any)?.deals || []
      },
      retargeting: {
        total: (retargetingCampaigns as any)?.total || 0,
        active: (retargetingCampaigns as any)?.campaigns?.filter((c: any) => c.status === 'ACTIVE').length || 0,
        campaigns: (retargetingCampaigns as any)?.campaigns || []
      }
    };
  }
}

export const advancedAlgorithmsService = new AdvancedAlgorithmsService(); 