export interface CreateOrganizationData {
    name: string;
    orgType: string;
    domain?: string;
    settings?: Record<string, any>;
}
export interface UpdateOrganizationData {
    name?: string;
    orgType?: string;
    domain?: string;
    status?: string;
    settings?: Record<string, any>;
}
export interface OrganizationFilters {
    orgType?: string;
    status?: string;
    domain?: string;
}
export declare class OrganizationService {
    static createOrganization(data: CreateOrganizationData, createdBy: string): Promise<any>;
    static getOrganizations(filters?: OrganizationFilters): Promise<any[]>;
    static getOrganizationById(id: string): Promise<any>;
    static updateOrganization(id: string, data: UpdateOrganizationData, updatedBy: string): Promise<any>;
    static deleteOrganization(id: string, deletedBy: string): Promise<any>;
    static getOrganizationStats(id: string): Promise<any>;
    static getOrganizationsWithMetrics(): Promise<any[]>;
}
export default OrganizationService;
//# sourceMappingURL=organization.service.d.ts.map