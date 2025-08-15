-- CreateEnum
CREATE TYPE "public"."PermissionScope" AS ENUM ('ORG_READ', 'ORG_WRITE', 'ORG_DELETE', 'USERS_READ', 'USERS_WRITE', 'USERS_DELETE', 'INGEST_READ', 'INGEST_WRITE', 'TRAITS_READ', 'TRAITS_WRITE', 'COHORTS_READ', 'COHORTS_WRITE', 'ANALYTICS_READ', 'ANALYTICS_WRITE', 'ADS_READ', 'ADS_WRITE', 'ADS_DELETE', 'CAMPAIGNS_READ', 'CAMPAIGNS_WRITE', 'CAMPAIGNS_DELETE', 'PUBLISHER_READ', 'PUBLISHER_WRITE', 'FINANCIAL_READ', 'FINANCIAL_WRITE');

-- CreateEnum
CREATE TYPE "public"."APIKeyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('IDENTITY', 'TRAIT', 'COHORT', 'PAGE_VIEW', 'CLICK', 'CONVERSION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."TraitType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'ARRAY', 'OBJECT', 'DATE');

-- CreateEnum
CREATE TYPE "public"."CohortType" AS ENUM ('STATIC', 'DYNAMIC', 'BEHAVIORAL', 'PREDICTIVE');

-- AlterEnum
ALTER TYPE "public"."OrganizationType" ADD VALUE 'ADMIN';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."UserRole" ADD VALUE 'MANAGER';
ALTER TYPE "public"."UserRole" ADD VALUE 'VIEWER';

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "public"."PermissionScope" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopes" "public"."PermissionScope"[],
    "status" "public"."APIKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."identities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT,
    "anonymousId" TEXT,
    "userId" TEXT,
    "identityTraits" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."traits" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "type" "public"."TraitType" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "traits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cohorts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."CohortType" NOT NULL DEFAULT 'STATIC',
    "criteria" JSONB NOT NULL,
    "members" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "type" "public"."EventType" NOT NULL,
    "name" TEXT NOT NULL,
    "properties" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_organizationId_name_key" ON "public"."permissions"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_key" ON "public"."user_permissions"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_organizationId_name_key" ON "public"."api_keys"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "identities_organizationId_externalId_version_key" ON "public"."identities"("organizationId", "externalId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "identities_organizationId_anonymousId_version_key" ON "public"."identities"("organizationId", "anonymousId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "identities_organizationId_userId_version_key" ON "public"."identities"("organizationId", "userId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "traits_organizationId_identityId_key_version_key" ON "public"."traits"("organizationId", "identityId", "key", "version");

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_organizationId_name_version_key" ON "public"."cohorts"("organizationId", "name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "events_organizationId_identityId_type_name_timestamp_versio_key" ON "public"."events"("organizationId", "identityId", "type", "name", "timestamp", "version");

-- AddForeignKey
ALTER TABLE "public"."permissions" ADD CONSTRAINT "permissions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."identities" ADD CONSTRAINT "identities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."traits" ADD CONSTRAINT "traits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."traits" ADD CONSTRAINT "traits_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "public"."identities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."traits" ADD CONSTRAINT "traits_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cohorts" ADD CONSTRAINT "cohorts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cohorts" ADD CONSTRAINT "cohorts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "public"."identities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
