-- CreateEnum
CREATE TYPE "public"."AudienceSegmentType" AS ENUM ('DEMOGRAPHIC', 'BEHAVIORAL', 'GEOGRAPHIC', 'INTEREST_BASED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."AudienceSegmentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."OptimizationType" AS ENUM ('PERFORMANCE', 'REVENUE', 'EFFICIENCY', 'TARGETING', 'BIDDING');

-- CreateEnum
CREATE TYPE "public"."OptimizationStatus" AS ENUM ('SETUP', 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED');

-- CreateEnum
CREATE TYPE "public"."ModelStatus" AS ENUM ('TRAINING', 'ACTIVE', 'INACTIVE', 'ERROR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."BidStrategy" ADD VALUE 'PREDICTIVE';
ALTER TYPE "public"."BidStrategy" ADD VALUE 'AI_OPTIMIZED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."CampaignType" ADD VALUE 'RETARGETING';
ALTER TYPE "public"."CampaignType" ADD VALUE 'RTB';
ALTER TYPE "public"."CampaignType" ADD VALUE 'PROGRAMMATIC';

-- CreateTable
CREATE TABLE "public"."audience_segments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."AudienceSegmentType" NOT NULL,
    "targetingRules" JSONB NOT NULL,
    "estimatedSize" INTEGER,
    "status" "public"."AudienceSegmentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audience_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audience_segment_performance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audience_segment_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audience_demographics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "audienceSize" INTEGER NOT NULL,
    "ageGroups" JSONB NOT NULL,
    "gender" JSONB NOT NULL,
    "income" JSONB NOT NULL,
    "education" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audience_demographics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audience_behavior" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "behaviorType" TEXT NOT NULL,
    "behaviorData" JSONB NOT NULL,
    "frequency" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audience_behavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audience_engagement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "engagementRate" DECIMAL(65,30) NOT NULL,
    "sessionDuration" INTEGER NOT NULL,
    "pageViews" INTEGER NOT NULL,
    "bounceRate" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audience_engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audience_realtime_data" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEngaged" BOOLEAN NOT NULL DEFAULT false,
    "sessionDuration" INTEGER NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audience_realtime_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audience_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audience_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audience_segment_overlap" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "segmentId1" TEXT NOT NULL,
    "segmentId2" TEXT NOT NULL,
    "overlapPercentage" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audience_segment_overlap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."performance_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT,
    "adId" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "spend" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "ctr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cpc" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cpm" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."revenue_analytics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "profit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "roi" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_analytics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionDuration" INTEGER NOT NULL,
    "pageViews" INTEGER NOT NULL,
    "conversions" INTEGER NOT NULL,
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."custom_reports" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "query" JSONB NOT NULL,
    "schedule" TEXT,
    "lastGenerated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."retargeting_campaigns" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetAudience" JSONB NOT NULL,
    "retargetingRules" JSONB NOT NULL,
    "frequencyCaps" JSONB NOT NULL,
    "bidStrategy" "public"."BidStrategy" NOT NULL,
    "budget" DECIMAL(65,30),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "public"."CampaignType" NOT NULL DEFAULT 'RETARGETING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retargeting_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rtb_campaigns" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "exchanges" JSONB NOT NULL,
    "bidStrategy" "public"."BidStrategy" NOT NULL,
    "maxBid" DECIMAL(65,30) NOT NULL,
    "budget" DECIMAL(65,30),
    "targeting" JSONB NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "public"."CampaignType" NOT NULL DEFAULT 'RTB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rtb_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rtb_bid_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "requestData" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rtb_bid_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rtb_performance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bidRequests" INTEGER NOT NULL DEFAULT 0,
    "bids" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "spend" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rtb_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."programmatic_deals" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "campaignId" TEXT,
    "dealTerms" JSONB NOT NULL,
    "targeting" JSONB NOT NULL,
    "budget" DECIMAL(65,30),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programmatic_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."programmatic_inventory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "adUnitType" TEXT NOT NULL,
    "geoLocation" JSONB,
    "date" TIMESTAMP(3) NOT NULL,
    "availableImpressions" INTEGER NOT NULL,
    "estimatedCPM" DECIMAL(65,30) NOT NULL,
    "estimatedRevenue" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programmatic_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."programmatic_performance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT,
    "publisherId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "spend" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'PROGRAMMATIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programmatic_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."predictive_bidding_models" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "trainingData" JSONB NOT NULL,
    "targetMetrics" JSONB NOT NULL,
    "status" "public"."ModelStatus" NOT NULL DEFAULT 'TRAINING',
    "accuracy" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lastTrainedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictive_bidding_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bid_predictions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "auctionData" JSONB NOT NULL,
    "context" JSONB,
    "prediction" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bid_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."predictive_bidding_performance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "predictions" INTEGER NOT NULL DEFAULT 0,
    "accuratePredictions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "spend" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictive_bidding_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_optimization_campaigns" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "optimizationType" "public"."OptimizationType" NOT NULL,
    "targetMetrics" JSONB NOT NULL,
    "constraints" JSONB NOT NULL,
    "budget" DECIMAL(65,30),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "public"."OptimizationStatus" NOT NULL DEFAULT 'SETUP',
    "startedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_optimization_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_optimization_recommendations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" DECIMAL(65,30) NOT NULL,
    "confidence" DECIMAL(65,30) NOT NULL,
    "parameters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_optimization_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."optimization_applications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "optimization_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_model_insights" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "modelId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "accuracy" DECIMAL(65,30) NOT NULL,
    "performance" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_model_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."targeting_rules" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "targeting_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."targeting_rule_performance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "targetingRuleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "targetingAccuracy" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "targeting_rule_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audience_optimizations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audience_optimizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audience_optimization_recommendations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "segmentId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" DECIMAL(65,30) NOT NULL,
    "confidence" DECIMAL(65,30) NOT NULL,
    "parameters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audience_optimization_recommendations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."audience_segments" ADD CONSTRAINT "audience_segments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audience_segment_performance" ADD CONSTRAINT "audience_segment_performance_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "public"."audience_segments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
