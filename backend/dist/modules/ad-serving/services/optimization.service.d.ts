export declare class OptimizationService {
    optimizeAdServing(adUnitId: string, organizationId: string): Promise<{
        recommendations: Array<{
            type: string;
            description: string;
            impact: number;
            confidence: number;
        }>;
        optimizedSettings: Record<string, any>;
    }>;
    private analyzePerformance;
    private generateRecommendations;
    private calculateOptimizedSettings;
    getRealTimeInsights(adUnitId: string, organizationId: string, timeWindow?: number): Promise<{
        currentPerformance: any;
        trends: any;
        alerts: string[];
        recommendations: string[];
    }>;
    private calculateTrends;
    private generateAlerts;
    private generateRealTimeRecommendations;
    applyOptimization(adUnitId: string, organizationId: string, settings: Record<string, any>): Promise<{
        success: boolean;
        message: string;
        appliedSettings: Record<string, any>;
    }>;
}
//# sourceMappingURL=optimization.service.d.ts.map