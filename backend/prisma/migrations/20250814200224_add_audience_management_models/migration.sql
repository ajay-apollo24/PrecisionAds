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

-- AddForeignKey
ALTER TABLE "public"."audience_segments" ADD CONSTRAINT "audience_segments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audience_segment_performance" ADD CONSTRAINT "audience_segment_performance_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "public"."audience_segments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
