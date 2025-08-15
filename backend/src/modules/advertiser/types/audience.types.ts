export interface CreateAudienceData {
  campaignId: string;
  name: string;
  description?: string;
  targeting: Record<string, any>;
  size?: number;
}

export interface UpdateAudienceData {
  name?: string;
  description?: string;
  targeting?: Record<string, any>;
  size?: number;
}

export interface AudienceFilters {
  name?: string;
}

export interface AudienceWithRelations {
  id: string;
  organizationId: string;
  campaignId: string;
  name: string;
  description: string | null;
  targeting: Record<string, any> | null;
  size: number | null;
  createdAt: Date;
  updatedAt: Date;
  campaign: CampaignSummary;
}

export interface CampaignSummary {
  id: string;
  name: string;
  status: string;
  type: string;
}

export interface AudienceInsights {
  audienceId: string;
  estimatedSize: number;
  targetingBreakdown: {
    geographic: any;
    demographic: any;
    interests: string[];
    behaviors: string[];
  };
  reachEstimate: {
    potential: number;
    actual: number;
    overlap: number;
  };
  performanceMetrics: {
    avgCTR: number;
    avgConversionRate: number;
    avgCPM: number;
    qualityScore: number;
  };
}

export interface TargetingCriteria {
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  demographics?: {
    ageRange?: string;
    gender?: string;
    income?: string;
    education?: string;
  };
  interests?: string[];
  behaviors?: string[];
} 