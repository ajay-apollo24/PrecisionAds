"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationService = void 0;
const prisma_1 = require("../../../shared/database/prisma");
const db_logger_1 = require("../../../shared/middleware/db-logger");
const audit_service_1 = __importDefault(require("../../../shared/services/audit.service"));
class OrganizationService {
    static async createOrganization(data, createdBy) {
        const startTime = Date.now();
        try {
            const organization = await (0, db_logger_1.withQueryLogging)('create_organization', data, async () => {
                return await prisma_1.prisma.organization.create({
                    data: {
                        name: data.name,
                        orgType: data.orgType,
                        domain: data.domain,
                        settings: data.settings || {},
                        status: 'ACTIVE'
                    },
                    include: {
                        users: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                                status: true
                            }
                        }
                    }
                });
            }, { operation: 'organization_creation' });
            audit_service_1.default.logCRUDEvent(createdBy, 'create', 'ORGANIZATION', organization.id, {
                name: organization.name,
                orgType: organization.orgType,
                domain: organization.domain
            });
            const duration = Date.now() - startTime;
            audit_service_1.default.logPerformanceMetric('organization_creation_duration', duration, 'ms', 'ADMIN', { orgType: organization.orgType });
            return organization;
        }
        catch (error) {
            throw new Error(`Failed to create organization: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async getOrganizations(filters = {}) {
        try {
            const where = {};
            if (filters.orgType) {
                where.orgType = filters.orgType;
            }
            if (filters.status) {
                where.status = filters.status;
            }
            if (filters.domain) {
                where.domain = { contains: filters.domain, mode: 'insensitive' };
            }
            return await (0, db_logger_1.withQueryLogging)('get_organizations', filters, async () => {
                return await prisma_1.prisma.organization.findMany({
                    where,
                    include: {
                        users: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                                status: true
                            }
                        },
                        _count: {
                            select: {
                                users: true,
                                publisherSites: true,
                                advertiserCampaigns: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });
            }, { operation: 'organization_listing' });
        }
        catch (error) {
            throw new Error(`Failed to get organizations: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async getOrganizationById(id) {
        try {
            return await (0, db_logger_1.withQueryLogging)('get_organization_by_id', { id }, async () => {
                return await prisma_1.prisma.organization.findUnique({
                    where: { id },
                    include: {
                        users: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                                status: true,
                                lastLoginAt: true,
                                createdAt: true
                            }
                        },
                        publisherSites: {
                            select: {
                                id: true,
                                name: true,
                                domain: true,
                                status: true
                            }
                        },
                        advertiserCampaigns: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                                budget: true
                            }
                        },
                        _count: {
                            select: {
                                users: true,
                                publisherSites: true,
                                advertiserCampaigns: true,
                                apiKeys: true
                            }
                        }
                    }
                });
            }, { operation: 'organization_detail' });
        }
        catch (error) {
            throw new Error(`Failed to get organization: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async updateOrganization(id, data, updatedBy) {
        const startTime = Date.now();
        try {
            const organization = await (0, db_logger_1.withQueryLogging)('update_organization', { id, data }, async () => {
                return await prisma_1.prisma.organization.update({
                    where: { id },
                    data: {
                        ...data,
                        updatedAt: new Date()
                    },
                    include: {
                        users: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                                status: true
                            }
                        }
                    }
                });
            }, { operation: 'organization_update' });
            audit_service_1.default.logCRUDEvent(updatedBy, 'update', 'ORGANIZATION', id, data);
            const duration = Date.now() - startTime;
            audit_service_1.default.logPerformanceMetric('organization_update_duration', duration, 'ms', 'ADMIN', { orgType: organization.orgType });
            return organization;
        }
        catch (error) {
            throw new Error(`Failed to update organization: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async deleteOrganization(id, deletedBy) {
        const startTime = Date.now();
        try {
            const organization = await (0, db_logger_1.withQueryLogging)('delete_organization', { id }, async () => {
                return await prisma_1.prisma.organization.update({
                    where: { id },
                    data: {
                        status: 'DELETED',
                        updatedAt: new Date()
                    }
                });
            }, { operation: 'organization_deletion' });
            audit_service_1.default.logCRUDEvent(deletedBy, 'delete', 'ORGANIZATION', id, {
                name: organization.name,
                orgType: organization.orgType
            });
            const duration = Date.now() - startTime;
            audit_service_1.default.logPerformanceMetric('organization_deletion_duration', duration, 'ms', 'ADMIN', { orgType: organization.orgType });
            return organization;
        }
        catch (error) {
            throw new Error(`Failed to delete organization: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async getOrganizationStats(id) {
        try {
            const [userCount, siteCount, campaignCount, apiKeyCount] = await Promise.all([
                prisma_1.prisma.user.count({ where: { organizationId: id } }),
                prisma_1.prisma.publisherSite.count({ where: { organizationId: id } }),
                prisma_1.prisma.advertiserCampaign.count({ where: { organizationId: id } }),
                prisma_1.prisma.aPIKey.count({ where: { organizationId: id } })
            ]);
            return {
                userCount,
                siteCount,
                campaignCount,
                apiKeyCount,
                totalResources: userCount + siteCount + campaignCount + apiKeyCount
            };
        }
        catch (error) {
            throw new Error(`Failed to get organization stats: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    static async getOrganizationsWithMetrics() {
        try {
            return await (0, db_logger_1.withQueryLogging)('get_organizations_with_metrics', {}, async () => {
                const organizations = await prisma_1.prisma.organization.findMany({
                    include: {
                        _count: {
                            select: {
                                users: true,
                                publisherSites: true,
                                advertiserCampaigns: true,
                                apiKeys: true
                            }
                        },
                        publisherEarnings: {
                            select: {
                                revenue: true,
                                impressions: true,
                                clicks: true
                            }
                        }
                    }
                });
                return organizations.map(org => {
                    const totalRevenue = org.publisherEarnings.reduce((sum, earning) => sum + Number(earning.revenue), 0);
                    const totalImpressions = org.publisherEarnings.reduce((sum, earning) => sum + earning.impressions, 0);
                    const totalClicks = org.publisherEarnings.reduce((sum, earning) => sum + earning.clicks, 0);
                    return {
                        ...org,
                        metrics: {
                            totalRevenue,
                            totalImpressions,
                            totalClicks,
                            ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
                        }
                    };
                });
            }, { operation: 'organization_metrics' });
        }
        catch (error) {
            throw new Error(`Failed to get organizations with metrics: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.OrganizationService = OrganizationService;
exports.default = OrganizationService;
//# sourceMappingURL=organization.service.js.map