import { prisma } from '../../../shared/database/prisma';

export class OptimizationService {
  /**
   * Optimize ad serving based on performance data
   */
  async optimizeAdServing(
    adUnitId: string,
    organizationId: string
  ): Promise<{
    recommendations: Array<{
      type: string;
      description: string;
      impact: number;
      confidence: number;
    }>;
    optimizedSettings: Record<string, any>;
  }> {
    try {
      // Get ad unit performance data
      const adUnit = await prisma.adUnit.findFirst({
        where: { id: adUnitId, organizationId },
        include: {
          adRequests: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          }
        }
      });

      if (!adUnit) {
        throw new Error('Ad unit not found');
      }

      // Analyze performance
      const performance = this.analyzePerformance(adUnit.adRequests);
      
      // Generate optimization recommendations
      const recommendations = this.generateRecommendations(performance, adUnit);
      
      // Calculate optimized settings
      const optimizedSettings = this.calculateOptimizedSettings(recommendations, adUnit);

      return {
        recommendations,
        optimizedSettings
      };
    } catch (error) {
      throw new Error(`Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze ad unit performance
   */
  private analyzePerformance(adRequests: any[]): {
    totalRequests: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    avgResponseTime: number;
    fillRate: number;
    revenuePerRequest: number;
  } {
    if (adRequests.length === 0) {
      return {
        totalRequests: 0,
        totalImpressions: 0,
        totalClicks: 0,
        ctr: 0,
        avgResponseTime: 0,
        fillRate: 0,
        revenuePerRequest: 0
      };
    }

    const totalRequests = adRequests.length;
    const totalImpressions = adRequests.filter(req => req.impression).length;
    const totalClicks = adRequests.filter(req => req.clickThrough).length;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const fillRate = totalRequests > 0 ? (totalImpressions / totalRequests) * 100 : 0;

    // Calculate average response time (mock data for now)
    const avgResponseTime = 150; // milliseconds

    // Calculate revenue per request (mock data for now)
    const revenuePerRequest = 0.05; // $0.05 per request

    return {
      totalRequests,
      totalImpressions,
      totalClicks,
      ctr,
      avgResponseTime,
      fillRate,
      revenuePerRequest
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(
    performance: any,
    adUnit: any
  ): Array<{
    type: string;
    description: string;
    impact: number;
    confidence: number;
  }> {
    const recommendations = [];

    // CTR optimization
    if (performance.ctr < 1.0) {
      recommendations.push({
        type: 'CTR_OPTIMIZATION',
        description: 'Low CTR detected. Consider improving ad creative and targeting.',
        impact: 0.3,
        confidence: 0.8
      });
    }

    // Fill rate optimization
    if (performance.fillRate < 80) {
      recommendations.push({
        type: 'FILL_RATE_OPTIMIZATION',
        description: 'Low fill rate. Consider expanding ad inventory or adjusting pricing.',
        impact: 0.4,
        confidence: 0.9
      });
    }

    // Response time optimization
    if (performance.avgResponseTime > 200) {
      recommendations.push({
        type: 'RESPONSE_TIME_OPTIMIZATION',
        description: 'High response time. Consider optimizing ad selection algorithms.',
        impact: 0.2,
        confidence: 0.7
      });
    }

    // Revenue optimization
    if (performance.revenuePerRequest < 0.03) {
      recommendations.push({
        type: 'REVENUE_OPTIMIZATION',
        description: 'Low revenue per request. Consider adjusting bid strategies.',
        impact: 0.5,
        confidence: 0.8
      });
    }

    // Ad format optimization
    if (adUnit.format === 'BANNER' && performance.ctr < 0.5) {
      recommendations.push({
        type: 'FORMAT_OPTIMIZATION',
        description: 'Banner format underperforming. Consider testing video or native formats.',
        impact: 0.4,
        confidence: 0.6
      });
    }

    return recommendations;
  }

  /**
   * Calculate optimized settings based on recommendations
   */
  private calculateOptimizedSettings(
    recommendations: any[],
    adUnit: any
  ): Record<string, any> {
    const optimizedSettings: Record<string, any> = {};

    recommendations.forEach(rec => {
      switch (rec.type) {
        case 'CTR_OPTIMIZATION':
          optimizedSettings.qualityThreshold = 0.7;
          optimizedSettings.creativeRotation = 'performance_based';
          break;

        case 'FILL_RATE_OPTIMIZATION':
          optimizedSettings.minBidPrice = 0.01;
          optimizedSettings.expandInventory = true;
          break;

        case 'RESPONSE_TIME_OPTIMIZATION':
          optimizedSettings.cacheTimeout = 300; // 5 minutes
          optimizedSettings.asyncProcessing = true;
          break;

        case 'REVENUE_OPTIMIZATION':
          optimizedSettings.bidStrategy = 'revenue_optimized';
          optimizedSettings.minRevenueThreshold = 0.03;
          break;

        case 'FORMAT_OPTIMIZATION':
          optimizedSettings.preferredFormats = ['VIDEO', 'NATIVE', 'BANNER'];
          optimizedSettings.formatWeighting = { video: 1.2, native: 1.1, banner: 1.0 };
          break;
      }
    });

    return optimizedSettings;
  }

  /**
   * Get real-time optimization insights
   */
  async getRealTimeInsights(
    adUnitId: string,
    organizationId: string,
    timeWindow: number = 3600000 // 1 hour in milliseconds
  ): Promise<{
    currentPerformance: any;
    trends: any;
    alerts: string[];
    recommendations: string[];
  }> {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - timeWindow);

      // Get recent ad requests
      const recentRequests = await prisma.adRequest.findMany({
        where: {
          adUnitId,
          organizationId,
          createdAt: {
            gte: startTime
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate current performance
      const currentPerformance = this.analyzePerformance(recentRequests);

      // Calculate trends (compare with previous period)
      const previousStartTime = new Date(startTime.getTime() - timeWindow);
      const previousRequests = await prisma.adRequest.findMany({
        where: {
          adUnitId,
          organizationId,
          createdAt: {
            gte: previousStartTime,
            lt: startTime
          }
        }
      });

      const previousPerformance = this.analyzePerformance(previousRequests);
      const trends = this.calculateTrends(currentPerformance, previousPerformance);

      // Generate alerts
      const alerts = this.generateAlerts(currentPerformance, trends);

      // Generate real-time recommendations
      const recommendations = this.generateRealTimeRecommendations(currentPerformance, trends);

      return {
        currentPerformance,
        trends,
        alerts,
        recommendations
      };
    } catch (error) {
      throw new Error(`Failed to get real-time insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(current: any, previous: any): {
    ctrChange: number;
    fillRateChange: number;
    revenueChange: number;
    trend: 'improving' | 'declining' | 'stable';
  } {
    const ctrChange = previous.ctr > 0 ? ((current.ctr - previous.ctr) / previous.ctr) * 100 : 0;
    const fillRateChange = previous.fillRate > 0 ? ((current.fillRate - previous.fillRate) / previous.fillRate) * 100 : 0;
    const revenueChange = previous.revenuePerRequest > 0 ? ((current.revenuePerRequest - previous.revenuePerRequest) / previous.revenuePerRequest) * 100 : 0;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (ctrChange > 5 && fillRateChange > 5 && revenueChange > 5) {
      trend = 'improving';
    } else if (ctrChange < -5 || fillRateChange < -5 || revenueChange < -5) {
      trend = 'declining';
    }

    return {
      ctrChange,
      fillRateChange,
      revenueChange,
      trend
    };
  }

  /**
   * Generate performance alerts
   */
  private generateAlerts(performance: any, trends: any): string[] {
    const alerts = [];

    if (performance.ctr < 0.5) {
      alerts.push('Critical: CTR below 0.5% - immediate attention required');
    } else if (performance.ctr < 1.0) {
      alerts.push('Warning: CTR below 1.0% - consider optimization');
    }

    if (performance.fillRate < 70) {
      alerts.push('Critical: Fill rate below 70% - significant revenue loss');
    } else if (performance.fillRate < 85) {
      alerts.push('Warning: Fill rate below 85% - optimization opportunity');
    }

    if (trends.trend === 'declining') {
      alerts.push('Alert: Performance declining - investigate recent changes');
    }

    if (performance.avgResponseTime > 300) {
      alerts.push('Warning: High response time affecting user experience');
    }

    return alerts;
  }

  /**
   * Generate real-time recommendations
   */
  private generateRealTimeRecommendations(performance: any, trends: any): string[] {
    const recommendations = [];

    if (performance.ctr < 1.0) {
      recommendations.push('Immediate: Test higher-performing ad creatives');
      recommendations.push('Short-term: Implement A/B testing for ad variations');
    }

    if (performance.fillRate < 85) {
      recommendations.push('Immediate: Lower minimum bid prices to increase fill rate');
      recommendations.push('Short-term: Expand advertiser base and inventory sources');
    }

    if (trends.trend === 'declining') {
      recommendations.push('Immediate: Review recent campaign changes and targeting updates');
      recommendations.push('Short-term: Implement performance monitoring dashboard');
    }

    if (performance.avgResponseTime > 200) {
      recommendations.push('Immediate: Optimize ad selection algorithms');
      recommendations.push('Short-term: Implement caching and CDN optimization');
    }

    return recommendations;
  }

  /**
   * Apply optimization settings to ad unit
   */
  async applyOptimization(
    adUnitId: string,
    organizationId: string,
    settings: Record<string, any>
  ): Promise<{
    success: boolean;
    message: string;
    appliedSettings: Record<string, any>;
  }> {
    try {
      // Update ad unit with optimized settings
      await prisma.adUnit.update({
        where: { id: adUnitId, organizationId },
        data: {
          settings: settings,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        message: 'Optimization settings applied successfully',
        appliedSettings: settings
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to apply optimization: ${error instanceof Error ? error.message : 'Unknown error'}`,
        appliedSettings: {}
      };
    }
  }
} 