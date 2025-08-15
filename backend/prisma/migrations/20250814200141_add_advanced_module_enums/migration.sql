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
