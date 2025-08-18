import { prisma } from '../../../shared/database/prisma';
import { createError } from '../../../shared/middleware/error-handler';

export interface AudienceSegmentFilters {
  organizationId: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface TargetingRuleFilters {
  organizationId: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AudienceInsightsFilters {
  organizationId: string;
  startDate?: Date;
  endDate?: Date;
  segmentId?: string;
}

export interface OptimizationParameters {
  segmentId: string;
  optimizationType: string;
  parameters: any;
}

export class AudienceService {
  /**
   * Get all audience segments for an organization
   */
  async getAudienceSegments(filters: AudienceSegmentFilters) {
    const { organizationId, type, status, page = 1, limit = 50 } = filters;

    const where: any = { organizationId };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [segments, total] = await Promise.all([
      prisma.audienceSegment.findMany({
        where,
        include: {
          performance: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.audienceSegment.count({ where })
    ]);

    return {
      segments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create new audience segment
   */
  async createAudienceSegment(
    organizationId: string,
    name: string,
    description: string,
    type: string,
    targetingRules: any,
    estimatedSize?: number,
    status: string = 'DRAFT'
  ) {
    return await prisma.audienceSegment.create({
      data: {
        organizationId,
        name,
        description,
        type: type as any,
        targetingRules: targetingRules || {},
        estimatedSize,
        status: status as any,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Update audience segment
   */
  async updateAudienceSegment(
    segmentId: string,
    organizationId: string,
    updateData: any
  ) {
    const segment = await prisma.audienceSegment.findFirst({
      where: { 
        id: segmentId,
        organizationId 
      }
    });

    if (!segment) {
      throw createError('Audience segment not found', 404);
    }

    return await prisma.audienceSegment.update({
      where: { id: segmentId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Get segment performance metrics
   */
  async getSegmentPerformance(
    segmentId: string,
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { 
      segmentId,
      organizationId 
    };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const metrics = await prisma.audienceSegmentPerformance.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const aggregated = this.calculateSegmentMetrics(metrics);

    return {
      metrics,
      aggregated,
      ctr: aggregated.totalImpressions > 0 ? (aggregated.totalClicks / aggregated.totalImpressions) * 100 : 0,
      conversionRate: aggregated.totalClicks > 0 ? (aggregated.totalConversions / aggregated.totalClicks) * 100 : 0
    };
  }

  /**
   * Get audience insights and analytics
   */
  async getAudienceInsights(filters: AudienceInsightsFilters) {
    const { organizationId, startDate, endDate, segmentId } = filters;

    const where: any = { organizationId };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    if (segmentId) {
      where.segmentId = segmentId;
    }

    // Get demographic insights
    const demographicInsights = await prisma.audienceDemographics.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 30
    });

    // Get behavioral insights
    const behavioralInsights = await prisma.audienceBehavior.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 30
    });

    // Get engagement insights
    const engagementInsights = await prisma.audienceEngagement.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 30
    });

    return {
      demographicInsights,
      behavioralInsights,
      engagementInsights,
      summary: {
        totalAudienceSize: demographicInsights.reduce((sum, insight) => sum + insight.audienceSize, 0),
        averageEngagementRate: engagementInsights.length > 0 
          ? engagementInsights.reduce((sum, insight) => sum + Number(insight.engagementRate), 0) / engagementInsights.length 
          : 0,
        topBehaviors: behavioralInsights.slice(0, 5)
      }
    };
  }

  /**
   * Get real-time audience data
   */
  async getRealTimeAudienceData(organizationId: string) {
    // Get current active users
    const activeUsers = await prisma.audienceRealtimeData.findMany({
      where: { 
        organizationId,
        isActive: true 
      },
      orderBy: { lastActivity: 'desc' },
      take: 100
    });

    // Get recent audience events
    const recentEvents = await prisma.audienceEvent.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    return {
      activeUsers: activeUsers.length,
      recentEvents,
      realtimeMetrics: {
        currentEngagement: activeUsers.filter(u => u.isEngaged).length,
        averageSessionDuration: activeUsers.length > 0 
          ? activeUsers.reduce((sum, user) => sum + user.sessionDuration, 0) / activeUsers.length 
          : 0
      }
    };
  }

  /**
   * Get audience overlap analysis
   */
  async getAudienceOverlap(organizationId: string, segmentIds: string[]) {
    // Calculate overlap between segments
    const overlapData = await prisma.audienceSegmentOverlap.findMany({
      where: {
        organizationId,
        OR: [
          { segmentId1: { in: segmentIds } },
          { segmentId2: { in: segmentIds } }
        ]
      }
    });

    // Calculate overlap percentages
    const overlapMatrix = segmentIds.map(id1 => 
      segmentIds.map(id2 => {
        const overlap = overlapData.find(o => 
          (o.segmentId1 === id1 && o.segmentId2 === id2) ||
          (o.segmentId1 === id2 && o.segmentId2 === id1)
        );
        return overlap ? Number(overlap.overlapPercentage) : 0;
      })
    );

    return {
      segmentIds,
      overlapMatrix,
      overlapData
    };
  }

  /**
   * Get targeting rules for an organization
   */
  async getTargetingRules(filters: TargetingRuleFilters) {
    const { organizationId, type, status, page = 1, limit = 50 } = filters;

    const where: any = { organizationId };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [rules, total] = await Promise.all([
      prisma.targetingRule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.targetingRule.count({ where })
    ]);

    return {
      rules,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Create new targeting rule
   */
  async createTargetingRule(
    organizationId: string,
    name: string,
    description: string,
    type: string,
    conditions: any,
    priority: number = 1,
    status: string = 'DRAFT'
  ) {
    return await prisma.targetingRule.create({
      data: {
        organizationId,
        name,
        description,
        type,
        conditions: conditions || {},
        priority,
        status,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Test targeting rule against sample data
   */
  async testTargetingRule(
    ruleId: string,
    organizationId: string,
    sampleData: any[]
  ) {
    const rule = await prisma.targetingRule.findFirst({
      where: { 
        id: ruleId,
        organizationId 
      }
    });

    if (!rule) {
      throw createError('Targeting rule not found', 404);
    }

    // Simulate targeting logic
    const targetingResults = sampleData.map((data: any) => {
      const matches = this.evaluateTargetingRule(rule.conditions, data);
      return {
        data,
        matches,
        score: matches ? this.calculateTargetingScore(rule.conditions, data) : 0
      };
    });

    const summary = {
      totalSamples: targetingResults.length,
      matchingSamples: targetingResults.filter((r: any) => r.matches).length,
      averageScore: targetingResults.reduce((sum: number, r: any) => sum + r.score, 0) / targetingResults.length
    };

    return {
      rule,
      targetingResults,
      summary
    };
  }

  /**
   * Get targeting performance analytics
   */
  async getTargetingPerformance(
    ruleId: string,
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { 
      targetingRuleId: ruleId,
      organizationId 
    };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const performance = await prisma.targetingRulePerformance.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    // Calculate targeting efficiency metrics
    const metrics = this.calculateTargetingMetrics(performance);

    return {
      performance,
      metrics: {
        ...metrics,
        ctr: metrics.totalImpressions > 0 ? (metrics.totalClicks / metrics.totalImpressions) * 100 : 0,
        conversionRate: metrics.totalClicks > 0 ? (metrics.totalConversions / metrics.totalClicks) * 100 : 0,
        averageTargetingAccuracy: performance.length > 0 ? metrics.targetingAccuracy / performance.length : 0
      }
    };
  }

  /**
   * Get optimization recommendations for audiences
   */
  async getOptimizationRecommendations(
    organizationId: string,
    segmentId?: string,
    type?: string,
    limit: number = 10
  ) {
    const where: any = { organizationId };

    if (segmentId) {
      where.segmentId = segmentId;
    }

    if (type) {
      where.type = type;
    }

    const recommendations = await prisma.audienceOptimizationRecommendation.findMany({
      where,
      orderBy: { confidence: 'desc' },
      take: limit
    });

    // Group recommendations by type
    const groupedRecommendations = recommendations.reduce((acc: any, rec: any) => {
      if (!acc[rec.type]) {
        acc[rec.type] = [];
      }
      acc[rec.type].push(rec);
      return acc;
    }, {});

    return {
      recommendations,
      groupedRecommendations,
      summary: {
        totalRecommendations: recommendations.length,
        highConfidence: recommendations.filter((r: any) => r.confidence > 0.8).length,
        mediumConfidence: recommendations.filter((r: any) => r.confidence > 0.5 && r.confidence <= 0.8).length,
        lowConfidence: recommendations.filter((r: any) => r.confidence <= 0.5).length
      }
    };
  }

  /**
   * Apply optimization to audience segment
   */
  async applyOptimization(optimizationParams: OptimizationParameters, organizationId: string) {
    const { segmentId, optimizationType, parameters } = optimizationParams;

    // Get the segment
    const segment = await prisma.audienceSegment.findFirst({
      where: { 
        id: segmentId,
        organizationId 
      }
    });

    if (!segment) {
      throw createError('Audience segment not found', 404);
    }

    // Apply optimization logic (placeholder)
    const optimizationResult = await this.applyOptimizationLogic(segment, optimizationType, parameters);

    // Create optimization record
    const optimization = await prisma.audienceOptimization.create({
      data: {
        organizationId,
        segmentId,
        type: optimizationType,
        parameters: parameters || {},
        result: optimizationResult,
        status: 'COMPLETED',
        createdAt: new Date()
      }
    });

    return {
      optimization,
      result: optimizationResult
    };
  }

  /**
   * Get optimization history
   */
  async getOptimizationHistory(
    organizationId: string,
    segmentId?: string,
    type?: string,
    status?: string,
    page: number = 1,
    limit: number = 50
  ) {
    const where: any = { organizationId };

    if (segmentId) {
      where.segmentId = segmentId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [optimizations, total] = await Promise.all([
      prisma.audienceOptimization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.audienceOptimization.count({ where })
    ]);

    return {
      optimizations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get AI-powered audience insights
   */
  async getAIInsights(organizationId: string, segmentId?: string) {
    // Get AI-generated insights (placeholder implementation)
    const aiInsights = await this.generateAIInsights(organizationId, segmentId);

    return {
      aiInsights,
      generatedAt: new Date(),
      confidence: aiInsights.confidence || 0.85
    };
  }

  // Private helper methods
  private calculateSegmentMetrics(metrics: any[]) {
    return metrics.reduce((acc, metric) => ({
      totalImpressions: acc.totalImpressions + metric.impressions,
      totalClicks: acc.totalClicks + metric.clicks,
      totalConversions: acc.totalConversions + metric.conversions,
      totalRevenue: acc.totalRevenue + Number(metric.revenue)
    }), { totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0 });
  }

  private calculateTargetingMetrics(performance: any[]) {
    return performance.reduce((acc: any, perf: any) => ({
      totalImpressions: acc.totalImpressions + perf.impressions,
      totalClicks: acc.totalClicks + perf.clicks,
      totalConversions: acc.totalConversions + perf.conversions,
      totalRevenue: acc.totalRevenue + Number(perf.revenue),
      targetingAccuracy: acc.targetingAccuracy + perf.targetingAccuracy
    }), { totalImpressions: 0, totalClicks: 0, totalConversions: 0, totalRevenue: 0, targetingAccuracy: 0 });
  }

  private evaluateTargetingRule(conditions: any, data: any): boolean {
    // Placeholder implementation - would contain actual targeting logic
    // This is a simplified version for demonstration purposes
    if (!conditions || !data) return false;
    
    // Example targeting logic
    if (conditions.geographic && data.location) {
      if (!conditions.geographic.countries.includes(data.location.country)) {
        return false;
      }
    }
    
    if (conditions.demographic && data.demographics) {
      if (conditions.demographic.ageRange) {
        const age = data.demographics.age;
        if (age < conditions.demographic.ageRange.min || age > conditions.demographic.ageRange.max) {
          return false;
        }
      }
    }
    
    if (conditions.behavioral && data.behaviors) {
      if (conditions.behavioral.interests && !conditions.behavioral.interests.some((interest: string) => 
        data.behaviors.interests.includes(interest)
      )) {
        return false;
      }
    }
    
    return true;
  }

  private calculateTargetingScore(conditions: any, data: any): number {
    // Placeholder implementation - would calculate actual targeting score
    let score = 0;
    
    if (this.evaluateTargetingRule(conditions, data)) {
      score = 50; // Base score for matching
      
      // Add bonus points for better matches
      if (conditions.geographic && data.location) {
        score += 20;
      }
      
      if (conditions.demographic && data.demographics) {
        score += 20;
      }
      
      if (conditions.behavioral && data.behaviors) {
        score += 10;
      }
    }
    
    return Math.min(score, 100);
  }

  private async applyOptimizationLogic(segment: any, type: string, parameters: any): Promise<any> {
    // Placeholder implementation - would contain actual optimization logic
    return {
      type,
      parameters,
      applied: true,
      estimatedImpact: Math.random() * 0.3 + 0.1, // 10-40% improvement
      confidence: Math.random() * 0.2 + 0.8 // 80-100% confidence
    };
  }

  private async generateAIInsights(organizationId: string, segmentId?: string): Promise<any> {
    // Placeholder implementation - would contain actual AI insights generation
    return {
      keyInsights: [
        'Audience shows high engagement during evening hours',
        'Mobile users have 23% higher conversion rate',
        'Geographic targeting could improve performance by 15%'
      ],
      recommendations: [
        'Adjust bid strategy for mobile users',
        'Implement time-based targeting',
        'Expand to similar audience segments'
      ],
      confidence: 0.87,
      dataPoints: Math.floor(Math.random() * 10000) + 5000
    };
  }
} 