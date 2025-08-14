export type AdRequestStatus = 'PENDING' | 'PROCESSED' | 'SERVED' | 'FAILED' | 'BLOCKED';

export interface AdRequestData {
  organizationId: string;
  siteId: string;
  adUnitId: string;
  requestId: string;
  userAgent?: string;
  ipAddress?: string;
  geoLocation?: GeoLocation;
  deviceInfo?: DeviceInfo;
  targeting?: TargetingCriteria;
}

export interface AdSelectionResult {
  success: boolean;
  adId: string | null;
  bidAmount: number | null;
  cpm?: number;
  targetingScore?: number;
  error?: string;
}

export interface TargetingCriteria {
  geoLocation?: GeoLocation;
  deviceInfo?: DeviceInfo;
  interests?: string[];
  demographics?: Demographics;
  behaviors?: Behavior[];
}

export interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface DeviceInfo {
  type: 'DESKTOP' | 'MOBILE' | 'TABLET';
  browser?: string;
  os?: string;
  screenSize?: string;
}

export interface Demographics {
  ageRange?: string;
  gender?: string;
  income?: string;
  education?: string;
}

export interface Behavior {
  type: string;
  value: string;
  frequency?: number;
}

export interface AdRequestWithRelations {
  id: string;
  organizationId: string;
  siteId: string;
  adUnitId: string;
  requestId: string;
  userAgent?: string;
  ipAddress?: string;
  geoLocation?: GeoLocation;
  deviceInfo?: DeviceInfo;
  targeting?: TargetingCriteria;
  status: AdRequestStatus;
  servedAdId?: string;
  bidAmount?: number;
  cpm?: number;
  clickThrough: boolean;
  impression: boolean;
  createdAt: Date;
  updatedAt: Date;
  site: SiteSummary;
  adUnit: AdUnitSummary;
}

export interface SiteSummary {
  id: string;
  name: string;
  domain: string;
}

export interface AdUnitSummary {
  id: string;
  name: string;
  size: string;
  format: string;
} 