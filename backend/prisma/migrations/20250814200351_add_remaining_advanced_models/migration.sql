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
