#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function createAPIKeys() {
  console.log('🔑 Creating API keys for existing organizations...');

  try {
    // Get existing organizations
    const organizations = await prisma.organization.findMany({
      where: { status: 'ACTIVE' }
    });

    console.log(`Found ${organizations.length} active organizations`);

    for (const org of organizations) {
      // Get a user from this organization
      const user = await prisma.user.findFirst({
        where: { 
          organizationId: org.id,
          status: 'ACTIVE'
        }
      });

      if (!user) {
        console.log(`No active users found for organization: ${org.name}`);
        continue;
      }

      // Create API key for data ingestion
      const dataIngestionKey = crypto.randomBytes(32).toString('hex');
      const dataIngestionKeyHash = await bcrypt.hash(dataIngestionKey, 12);
      
      await prisma.aPIKey.create({
        data: {
          name: `${org.name} - Data Ingestion Key`,
          keyHash: dataIngestionKeyHash,
          organizationId: org.id,
          userId: user.id,
          scopes: ['INGEST_WRITE', 'TRAITS_WRITE', 'COHORTS_WRITE'],
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      });

      // Create API key for analytics
      const analyticsKey = crypto.randomBytes(32).toString('hex');
      const analyticsKeyHash = await bcrypt.hash(analyticsKey, 12);
      
      await prisma.aPIKey.create({
        data: {
          name: `${org.name} - Analytics Key`,
          keyHash: analyticsKeyHash,
          organizationId: org.id,
          userId: user.id,
          scopes: ['ANALYTICS_READ', 'INGEST_READ'],
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      });

      console.log(`✅ Created API keys for: ${org.name}`);
      console.log(`   Data Ingestion: ${dataIngestionKey}`);
      console.log(`   Analytics: ${analyticsKey}`);
      console.log('');
    }

    console.log('🎉 API keys created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating API keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAPIKeys(); 