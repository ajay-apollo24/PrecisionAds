import { prisma } from '../../../shared/database/prisma';
import { withQueryLogging } from '../../../shared/middleware/db-logger';
import AuditService from '../../../shared/services/audit.service';

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

export class OrganizationService {
  /**
   * Create a new organization
   */
  static async createOrganization(
    data: CreateOrganizationData,
    createdBy: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const organization = await withQueryLogging(
        'create_organization',
        data,
        async () => {
          return await prisma.organization.create({
            data: {
              name: data.name,
              orgType: data.orgType as any,
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
        },
        { operation: 'organization_creation' }
      );

      // Log audit event
      AuditService.logCRUDEvent(
        createdBy,
        'create',
        'ORGANIZATION',
        organization.id,
        {
          name: organization.name,
          orgType: organization.orgType,
          domain: organization.domain
        }
      );

      // Log performance metric
      const duration = Date.now() - startTime;
      AuditService.logPerformanceMetric(
        'organization_creation_duration',
        duration,
        'ms',
        'ADMIN',
        { orgType: organization.orgType }
      );

      return organization;
    } catch (error) {
      throw new Error(`Failed to create organization: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all organizations with optional filtering
   */
  static async getOrganizations(filters: OrganizationFilters = {}): Promise<any[]> {
    try {
      const where: any = {};

      if (filters.orgType) {
        where.orgType = filters.orgType;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.domain) {
        where.domain = { contains: filters.domain, mode: 'insensitive' };
      }

      return await withQueryLogging(
        'get_organizations',
        filters,
        async () => {
          return await prisma.organization.findMany({
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
        },
        { operation: 'organization_listing' }
      );
    } catch (error) {
      throw new Error(`Failed to get organizations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get organization by ID
   */
  static async getOrganizationById(id: string): Promise<any> {
    try {
      return await withQueryLogging(
        'get_organization_by_id',
        { id },
        async () => {
          return await prisma.organization.findUnique({
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
        },
        { operation: 'organization_detail' }
      );
    } catch (error) {
      throw new Error(`Failed to get organization: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update organization
   */
  static async updateOrganization(
    id: string,
    data: UpdateOrganizationData,
    updatedBy: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const organization = await withQueryLogging(
        'update_organization',
        { id, data },
        async () => {
          return await prisma.organization.update({
            where: { id },
            data: {
              ...data,
              orgType: data.orgType as any,
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
        },
        { operation: 'organization_update' }
      );

      // Log audit event
      AuditService.logCRUDEvent(
        updatedBy,
        'update',
        'ORGANIZATION',
        id,
        data
      );

      // Log performance metric
      const duration = Date.now() - startTime;
      AuditService.logPerformanceMetric(
        'organization_update_duration',
        duration,
        'ms',
        'ADMIN',
        { orgType: organization.orgType }
      );

      return organization;
    } catch (error) {
      throw new Error(`Failed to update organization: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete organization (soft delete by setting status)
   */
  static async deleteOrganization(
    id: string,
    deletedBy: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      const organization = await withQueryLogging(
        'delete_organization',
        { id },
        async () => {
          return await prisma.organization.update({
            where: { id },
            data: {
              status: 'DELETED',
              updatedAt: new Date()
            }
          });
        },
        { operation: 'organization_deletion' }
      );

      // Log audit event
      AuditService.logCRUDEvent(
        deletedBy,
        'delete',
        'ORGANIZATION',
        id,
        {
          name: organization.name,
          orgType: organization.orgType
        }
      );

      // Log performance metric
      const duration = Date.now() - startTime;
      AuditService.logPerformanceMetric(
        'organization_deletion_duration',
        duration,
        'ms',
        'ADMIN',
        { orgType: organization.orgType }
      );

      return organization;
    } catch (error) {
      throw new Error(`Failed to delete organization: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get organization statistics
   */
  static async getOrganizationStats(id: string): Promise<any> {
    try {
      const [userCount, siteCount, campaignCount, apiKeyCount] = await Promise.all([
        prisma.user.count({ where: { organizationId: id } }),
        prisma.publisherSite.count({ where: { organizationId: id } }),
        prisma.advertiserCampaign.count({ where: { organizationId: id } }),
        prisma.aPIKey.count({ where: { organizationId: id } })
      ]);

      return {
        userCount,
        siteCount,
        campaignCount,
        apiKeyCount,
        totalResources: userCount + siteCount + campaignCount + apiKeyCount
      };
    } catch (error) {
      throw new Error(`Failed to get organization stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get organizations with performance metrics (RBAC-enabled)
   */
  static async getOrganizationsWithMetrics(userRole: string, userOrgId?: string): Promise<any[]> {
    try {
      return await withQueryLogging(
        'get_organizations_with_metrics',
        { userRole, userOrgId },
        async () => {
          // Import RBAC service
          const { RBACService } = await import('../../../shared/services/rbac.service');
          const dataScope = RBACService.getDataScope(userRole, userOrgId || '');
          
          // Build where clause based on RBAC
          const whereClause = dataScope.canSeeAllOrganizations ? {} : { id: userOrgId };
          
          const organizations = await prisma.organization.findMany({
            where: whereClause,
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
            const totalRevenue = org.publisherEarnings.reduce((sum: number, earning: any) => 
              sum + Number(earning.revenue), 0);
            const totalImpressions = org.publisherEarnings.reduce((sum: number, earning: any) => 
              sum + earning.impressions, 0);
            const totalClicks = org.publisherEarnings.reduce((sum: number, earning: any) => 
              sum + earning.clicks, 0);

            return {
              ...org,
              metrics: {
                totalRevenue: dataScope.canSeeRevenue ? totalRevenue : 0,
                totalImpressions,
                totalClicks,
                ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
              }
            };
          });
        },
        { operation: 'organization_metrics' }
      );
    } catch (error) {
      throw new Error(`Failed to get organizations with metrics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default OrganizationService; 