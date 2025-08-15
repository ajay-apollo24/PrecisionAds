import { CreateAdUnitData, UpdateAdUnitData, AdUnitFilters, AdUnitWithRelations } from '../types/ad-unit.types';
export declare class AdUnitService {
    getAdUnits(siteId: string, organizationId: string, filters?: AdUnitFilters): Promise<AdUnitWithRelations[]>;
    getAdUnitById(id: string, organizationId: string): Promise<AdUnitWithRelations | null>;
    createAdUnit(data: CreateAdUnitData, organizationId: string): Promise<AdUnitWithRelations>;
    updateAdUnit(id: string, data: UpdateAdUnitData, organizationId: string): Promise<AdUnitWithRelations>;
    deleteAdUnit(id: string, organizationId: string): Promise<AdUnitWithRelations>;
    getAdUnitStats(adUnitId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<{
        totalRequests: number;
        totalImpressions: number;
        totalClicks: number;
        ctr: number;
    }>;
    getTopPerformingAdUnits(siteId: string, organizationId: string, limit?: number): Promise<AdUnitWithRelations[]>;
    validateAdUnitSettings(settings: Record<string, any>): {
        isValid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=ad-unit.service.d.ts.map