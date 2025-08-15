export interface TrackingData {
    requestId: string;
    siteId: string;
    adUnitId: string;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    geoLocation?: any;
    deviceInfo?: any;
    timestamp: Date;
}
export interface ImpressionData extends TrackingData {
    adId: string;
    viewability?: number;
    viewTime?: number;
    viewport?: {
        width: number;
        height: number;
    };
}
export interface ClickData extends TrackingData {
    adId: string;
    clickPosition?: {
        x: number;
        y: number;
    };
    referrer?: string;
    landingPageUrl?: string;
}
export interface TransactionData extends TrackingData {
    adId: string;
    transactionId: string;
    amount: number;
    currency: string;
    productId?: string;
    category?: string;
    conversionType: 'purchase' | 'signup' | 'download' | 'other';
}
export declare class DataTrackingService {
    static trackImpression(data: ImpressionData): Promise<void>;
    static trackClick(data: ClickData): Promise<void>;
    static trackTransaction(data: TransactionData): Promise<void>;
    private static getOrganizationId;
    private static updateDailyEarnings;
    static getSiteTrackingStats(siteId: string, startDate?: Date, endDate?: Date): Promise<any>;
}
export default DataTrackingService;
//# sourceMappingURL=data-tracking.service.d.ts.map