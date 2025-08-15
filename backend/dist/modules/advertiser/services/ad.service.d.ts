import { CreateAdData, UpdateAdData, AdFilters, AdWithRelations } from '../types/ad.types';
export declare class AdService {
    getAds(campaignId: string, organizationId: string, filters?: AdFilters): Promise<AdWithRelations[]>;
    getAdById(id: string, organizationId: string): Promise<AdWithRelations | null>;
    createAd(data: CreateAdData, organizationId: string): Promise<AdWithRelations>;
    updateAd(id: string, data: UpdateAdData, organizationId: string): Promise<AdWithRelations>;
    deleteAd(id: string, organizationId: string): Promise<AdWithRelations>;
    getAdStats(adId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<{
        totalImpressions: number;
        totalClicks: number;
        totalConversions: number;
        ctr: import("@prisma/client/runtime/library").Decimal;
        cpc: import("@prisma/client/runtime/library").Decimal;
        cpm: import("@prisma/client/runtime/library").Decimal;
        conversionRate: number;
    }>;
    getTopPerformingAds(campaignId: string, organizationId: string, limit?: number): Promise<AdWithRelations[]>;
    validateAdData(data: CreateAdData): {
        isValid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=ad.service.d.ts.map