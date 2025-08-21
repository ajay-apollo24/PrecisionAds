import { PrismaClient } from '@prisma/client';
import { AssetFilters, AssetWithRelations, UpdateAssetData, CreativeAssetStatus } from '../types/asset.types';

export class AssetManagementService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getAssets(
    organizationId: string,
    filters: AssetFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ assets: AssetWithRelations[]; total: number; page: number; totalPages: number }> {
    try {
      const where: any = { organizationId };

      // Apply filters
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.mimeType) {
        where.mimeType = filters.mimeType;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { fileName: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [assets, total] = await Promise.all([
        this.prisma.creativeAsset.findMany({
          where,
          include: {
            organization: {
              select: {
                id: true,
                name: true
              }
            },
            assetVersions: {
              orderBy: { version: 'desc' },
              take: 1
            },
            ads: {
              select: {
                id: true,
                name: true,
                campaignId: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        this.prisma.creativeAsset.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        assets: assets as AssetWithRelations[],
        total,
        page,
        totalPages
      };
    } catch (error) {
      console.error('Error getting assets:', error);
      throw new Error('Failed to get assets');
    }
  }

  async getAssetById(assetId: string, organizationId: string): Promise<AssetWithRelations | null> {
    try {
      const asset = await this.prisma.creativeAsset.findFirst({
        where: {
          id: assetId,
          organizationId
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          assetVersions: {
            orderBy: { version: 'desc' }
          },
          ads: {
            select: {
              id: true,
              name: true,
              campaignId: true
            }
          }
        }
      });

      return asset as AssetWithRelations;
    } catch (error) {
      console.error('Error getting asset by ID:', error);
      throw new Error('Failed to get asset');
    }
  }

  async updateAsset(
    assetId: string,
    organizationId: string,
    updateData: UpdateAssetData
  ): Promise<AssetWithRelations> {
    try {
      // Verify asset belongs to organization
      const existingAsset = await this.prisma.creativeAsset.findFirst({
        where: {
          id: assetId,
          organizationId
        }
      });

      if (!existingAsset) {
        throw new Error('Asset not found or access denied');
      }

      const updatedAsset = await this.prisma.creativeAsset.update({
        where: { id: assetId },
        data: updateData,
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          assetVersions: {
            orderBy: { version: 'desc' }
          },
          ads: {
            select: {
              id: true,
              name: true,
              campaignId: true
            }
          }
        }
      });

      return updatedAsset as AssetWithRelations;
    } catch (error) {
      console.error('Error updating asset:', error);
      throw new Error('Failed to update asset');
    }
  }

  async deleteAsset(assetId: string, organizationId: string): Promise<void> {
    try {
      // Verify asset belongs to organization
      const existingAsset = await this.prisma.creativeAsset.findFirst({
        where: {
          id: assetId,
          organizationId
        },
        include: {
          ads: true
        }
      });

      if (!existingAsset) {
        throw new Error('Asset not found or access denied');
      }

      // Check if asset is being used by any ads
      if (existingAsset.ads.length > 0) {
        throw new Error('Cannot delete asset that is being used by ads');
      }

      // Delete asset versions first
      await this.prisma.creativeAssetVersion.deleteMany({
        where: { assetId }
      });

      // Delete the asset
      await this.prisma.creativeAsset.delete({
        where: { id: assetId }
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw new Error('Failed to delete asset');
    }
  }

  async archiveAsset(assetId: string, organizationId: string): Promise<AssetWithRelations> {
    try {
      return await this.updateAsset(assetId, organizationId, { status: 'ARCHIVED' });
    } catch (error) {
      console.error('Error archiving asset:', error);
      throw new Error('Failed to archive asset');
    }
  }

  async restoreAsset(assetId: string, organizationId: string): Promise<AssetWithRelations> {
    try {
      return await this.updateAsset(assetId, organizationId, { status: 'VALIDATED' });
    } catch (error) {
      console.error('Error restoring asset:', error);
      throw new Error('Failed to restore asset');
    }
  }

  async getAssetStats(organizationId: string): Promise<{
    totalAssets: number;
    totalSize: number;
    byStatus: Record<CreativeAssetStatus, number>;
    byType: Record<string, number>;
    recentUploads: number;
  }> {
    try {
      const [
        totalAssets,
        totalSize,
        statusStats,
        typeStats,
        recentUploads
      ] = await Promise.all([
        this.prisma.creativeAsset.count({ where: { organizationId } }),
        this.prisma.creativeAsset.aggregate({
          where: { organizationId },
          _sum: { fileSize: true }
        }),
        this.prisma.creativeAsset.groupBy({
          by: ['status'],
          where: { organizationId },
          _count: { status: true }
        }),
        this.prisma.creativeAsset.groupBy({
          by: ['mimeType'],
          where: { organizationId },
          _count: { mimeType: true }
        }),
        this.prisma.creativeAsset.count({
          where: {
            organizationId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ]);

      const byStatus = {
        PENDING: 0,
        PROCESSING: 0,
        VALIDATED: 0,
        REJECTED: 0,
        ARCHIVED: 0
      };

      statusStats.forEach(stat => {
        byStatus[stat.status as CreativeAssetStatus] = stat._count.status;
      });

      const byType: Record<string, number> = {};
      typeStats.forEach(stat => {
        byType[stat.mimeType] = stat._count.mimeType;
      });

      return {
        totalAssets,
        totalSize: totalSize._sum.fileSize || 0,
        byStatus,
        byType,
        recentUploads
      };
    } catch (error) {
      console.error('Error getting asset stats:', error);
      throw new Error('Failed to get asset stats');
    }
  }

  async searchAssets(
    organizationId: string,
    query: string,
    limit: number = 10
  ): Promise<AssetWithRelations[]> {
    try {
      const assets = await this.prisma.creativeAsset.findMany({
        where: {
          organizationId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { fileName: { contains: query, mode: 'insensitive' } },
            { metadata: { path: ['tags'], array_contains: [query] } }
          ]
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          assetVersions: {
            orderBy: { version: 'desc' },
            take: 1
          },
          ads: {
            select: {
              id: true,
              name: true,
              campaignId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return assets as AssetWithRelations[];
    } catch (error) {
      console.error('Error searching assets:', error);
      throw new Error('Failed to search assets');
    }
  }
} 