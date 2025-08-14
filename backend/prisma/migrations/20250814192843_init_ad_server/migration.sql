-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('PUBLISHER', 'ADVERTISER', 'AGENCY', 'NETWORK');

-- CreateEnum
CREATE TYPE "PublisherSiteStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AdUnitFormat" AS ENUM ('BANNER', 'VIDEO', 'NATIVE', 'DISPLAY', 'INTERSTITIAL');

-- CreateEnum
CREATE TYPE "AdUnitStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TESTING');

-- CreateEnum
CREATE TYPE "AdRequestStatus" AS ENUM ('PENDING', 'PROCESSED', 'SERVED', 'FAILED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('DISPLAY', 'VIDEO', 'NATIVE', 'SEARCH', 'SOCIAL');

-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('DAILY', 'LIFETIME', 'MONTHLY');

-- CreateEnum
CREATE TYPE "BidStrategy" AS ENUM ('MANUAL', 'AUTO_CPC', 'AUTO_CPM', 'TARGET_CPA');

-- CreateEnum
CREATE TYPE "CreativeType" AS ENUM ('IMAGE', 'VIDEO', 'HTML5', 'NATIVE', 'TEXT');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'REJECTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PUBLISHER', 'ADVERTISER', 'ANALYST');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "organizationId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgType" "OrganizationType" NOT NULL DEFAULT 'ADVERTISER',
    "domain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publisher_sites" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" "PublisherSiteStatus" NOT NULL DEFAULT 'PENDING',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publisher_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_units" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "format" "AdUnitFormat" NOT NULL,
    "status" "AdUnitStatus" NOT NULL DEFAULT 'INACTIVE',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "adUnitId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "geoLocation" JSONB,
    "deviceInfo" JSONB,
    "targeting" JSONB,
    "status" "AdRequestStatus" NOT NULL DEFAULT 'PENDING',
    "servedAdId" TEXT,
    "bidAmount" DECIMAL(65,30),
    "cpm" DECIMAL(65,30),
    "clickThrough" BOOLEAN NOT NULL DEFAULT false,
    "impression" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publisher_earnings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cpm" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cpc" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publisher_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertiser_campaigns" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "CampaignType" NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(65,30) NOT NULL,
    "budgetType" "BudgetType" NOT NULL,
    "bidStrategy" "BidStrategy" NOT NULL,
    "targetCPM" DECIMAL(65,30),
    "targetCPC" DECIMAL(65,30),
    "targetCPA" DECIMAL(65,30),
    "dailyBudget" DECIMAL(65,30),
    "totalSpent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertiser_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertiser_ads" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creativeType" "CreativeType" NOT NULL,
    "creativeUrl" TEXT NOT NULL,
    "landingPageUrl" TEXT NOT NULL,
    "status" "AdStatus" NOT NULL DEFAULT 'DRAFT',
    "weight" INTEGER NOT NULL DEFAULT 100,
    "targeting" JSONB,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cpc" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cpm" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertiser_ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertiser_audiences" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targeting" JSONB,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertiser_audiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "sessionId" TEXT,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_bids" (
    "id" TEXT NOT NULL,
    "adRequestId" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "bidAmount" DECIMAL(65,30) NOT NULL,
    "cpm" DECIMAL(65,30) NOT NULL,
    "cpc" DECIMAL(65,30),
    "targetingScore" DECIMAL(65,30),
    "qualityScore" DECIMAL(65,30),
    "won" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frequency_caps" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "adId" TEXT,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "frequency_caps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "publisher_sites_organizationId_domain_key" ON "publisher_sites"("organizationId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "ad_units_organizationId_siteId_name_key" ON "ad_units"("organizationId", "siteId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ad_requests_requestId_key" ON "ad_requests"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "publisher_earnings_organizationId_siteId_date_key" ON "publisher_earnings"("organizationId", "siteId", "date");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publisher_sites" ADD CONSTRAINT "publisher_sites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_units" ADD CONSTRAINT "ad_units_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "publisher_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_requests" ADD CONSTRAINT "ad_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_requests" ADD CONSTRAINT "ad_requests_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "publisher_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_requests" ADD CONSTRAINT "ad_requests_adUnitId_fkey" FOREIGN KEY ("adUnitId") REFERENCES "ad_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publisher_earnings" ADD CONSTRAINT "publisher_earnings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publisher_earnings" ADD CONSTRAINT "publisher_earnings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "publisher_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertiser_campaigns" ADD CONSTRAINT "advertiser_campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertiser_ads" ADD CONSTRAINT "advertiser_ads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertiser_ads" ADD CONSTRAINT "advertiser_ads_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "advertiser_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertiser_audiences" ADD CONSTRAINT "advertiser_audiences_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertiser_audiences" ADD CONSTRAINT "advertiser_audiences_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "advertiser_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
