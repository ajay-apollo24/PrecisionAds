export declare class FrequencyService {
    checkFrequencyCap(userId: string, adId: string, campaignId: string, organizationId: string, eventType?: 'impression' | 'click'): Promise<{
        allowed: boolean;
        reason: string;
        currentCount: number;
        limit: number;
        timeRemaining: number;
    }>;
    recordFrequencyEvent(userId: string, adId: string, campaignId: string, organizationId: string, eventType: 'impression' | 'click'): Promise<void>;
    private getCurrentFrequencyCount;
    private calculateTimeWindow;
    private calculateTimeRemaining;
    getFrequencyAnalytics(campaignId: string, organizationId: string, startDate?: Date, endDate?: Date): Promise<{
        totalEvents: number;
        uniqueUsers: number;
        averageEventsPerUser: number;
        topUsers: Array<{
            userId: string;
            eventCount: number;
        }>;
        eventBreakdown: Record<string, number>;
    }>;
    resetFrequencyCaps(userId: string, campaignId: string, organizationId: string): Promise<void>;
    getRecommendedFrequencyCaps(campaignId: string, organizationId: string): Promise<{
        impression: {
            limit: number;
            window: string;
        };
        click: {
            limit: number;
            window: string;
        };
        reasoning: string;
    }>;
}
//# sourceMappingURL=frequency.service.d.ts.map