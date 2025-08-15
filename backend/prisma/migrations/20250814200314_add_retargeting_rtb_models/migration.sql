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
