import { CreateCampaignData, UpdateCampaignData, CampaignFilters, CampaignWithRelations } from '../types/campaign.types';
export declare class CampaignService {
    getCampaigns(organizationId: string, filters?: CampaignFilters): Promise<CampaignWithRelations[]>;
    getCampaignById(id: string, organizationId: string): Promise<CampaignWithRelations | null>;
    createCampaign(data: CreateCampaignData, organizationId: string): Promise<CampaignWithRelations>;
    updateCampaign(id: string, data: UpdateCampaignData, organizationId: string): Promise<CampaignWithRelations>;
    deleteCampaign(id: string, organizationId: string): Promise<CampaignWithRelations>;
    getCampaignStats(campaignId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<{
        totalAds: number;
        totalSpent: number | import("@prisma/client/runtime/library").Decimal;
        totalImpressions: number;
        totalClicks: number;
        totalConversions: number;
        ctr: number;
        conversionRate: number;
        cpm: number;
        cpc: number;
        cpa: number;
    }>;
    getTopPerformingCampaigns(organizationId: string, limit?: number): Promise<CampaignWithRelations[]>;
    validateCampaignData(data: CreateCampaignData): {
        isValid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=campaign.service.d.ts.map