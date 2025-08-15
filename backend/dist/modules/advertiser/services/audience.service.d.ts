import { CreateAudienceData, UpdateAudienceData, AudienceFilters, AudienceWithRelations } from '../types/audience.types';
export declare class AudienceService {
    getAudiences(campaignId: string, organizationId: string, filters?: AudienceFilters): Promise<AudienceWithRelations[]>;
    getAudienceById(id: string, organizationId: string): Promise<AudienceWithRelations | null>;
    createAudience(data: CreateAudienceData, organizationId: string): Promise<AudienceWithRelations>;
    updateAudience(id: string, data: UpdateAudienceData, organizationId: string): Promise<AudienceWithRelations>;
    deleteAudience(id: string, organizationId: string): Promise<AudienceWithRelations>;
    estimateAudienceSize(targeting: Record<string, any>): Promise<number>;
    getAudienceInsights(audienceId: string, organizationId: string): Promise<{
        audienceId: string;
        estimatedSize: number;
        targetingBreakdown: {
            geographic: any;
            demographic: any;
            interests: any;
            behaviors: any;
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
    }>;
    validateAudienceData(data: CreateAudienceData): {
        isValid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=audience.service.d.ts.map