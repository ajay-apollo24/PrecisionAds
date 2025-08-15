import { prisma } from '../src/shared/database/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface TestData {
  organization: any;
  user: any;
  apiKey: string;
  apiKeyHash: string;
  identity: any;
  cleanupIds: string[];
}

export class TestDataGenerator {
  private cleanupIds: string[] = [];

  async generateTestData(): Promise<TestData> {
    console.log('🧪 Generating fresh test data...');
    
    // Create a test organization
    const organization = await (prisma as any).organization.create({
      data: {
        name: `Test Org ${Date.now()}`,
        orgType: 'ADVERTISER',
        domain: `test-${Date.now()}.com`,
        status: 'ACTIVE',
        settings: {
          timezone: 'UTC',
          currency: 'USD'
        }
      }
    });
    this.cleanupIds.push(organization.id);

    // Create a test user
    const userPassword = await bcrypt.hash('testpass123', 12);
    const user = await (prisma as any).user.create({
      data: {
        email: `testuser-${Date.now()}@example.com`,
        password: userPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'SUPER_ADMIN', // Use SUPER_ADMIN to have all permissions
        status: 'ACTIVE',
        organizationId: organization.id,
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });
    this.cleanupIds.push(user.id);

    // Create a test API key
    const apiKey = crypto.randomBytes(32).toString('hex');
    const apiKeyHash = await bcrypt.hash(apiKey, 12);
    
    const apiKeyRecord = await (prisma as any).aPIKey.create({
      data: {
        name: `Test API Key ${Date.now()}`,
        keyHash: apiKeyHash,
        organizationId: organization.id,
        userId: user.id,
        scopes: ['INGEST_WRITE', 'TRAITS_WRITE', 'COHORTS_WRITE', 'INGEST_READ', 'TRAITS_READ', 'COHORTS_READ'],
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });
               // Create a test identity
           const identity = await (prisma as any).identity.create({
             data: {
               organizationId: organization.id,
               externalId: `test-identity-${Date.now()}`,
               identityTraits: {
                 email: 'test@example.com',
                 firstName: 'Test',
                 lastName: 'User'
               },
               version: 1,
               idempotencyKey: `test-identity-${Date.now()}`
             }
           });
           this.cleanupIds.push(identity.id);

           console.log('✅ Test data generated successfully');
           console.log(`   Organization: ${organization.id}`);
           console.log(`   User: ${user.id}`);
           console.log(`   API Key: ${apiKey.substring(0, 16)}...`);
           console.log(`   Identity: ${identity.id}`);

           return {
             organization,
             user,
             apiKey,
             apiKeyHash,
             identity,
             cleanupIds: [...this.cleanupIds]
           };
  }

  async cleanup(): Promise<void> {
    if (this.cleanupIds.length === 0) return;
    
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Delete in reverse order to respect foreign key constraints
      for (const id of this.cleanupIds.reverse()) {
        try {
          // Try to delete API key
          await (prisma as any).aPIKey.deleteMany({
            where: { id }
          });
        } catch (e) {
          // Ignore errors for non-existent records
        }
        
        try {
          // Try to delete user
          await (prisma as any).user.deleteMany({
            where: { id }
          });
        } catch (e) {
          // Ignore errors for non-existent records
        }
        
        try {
          // Try to delete organization
          await (prisma as any).organization.deleteMany({
            where: { id }
          });
        } catch (e) {
          // Ignore errors for non-existent records
        }
      }
      
      this.cleanupIds = [];
      console.log('✅ Test data cleaned up successfully');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  async cleanupOnExit(): Promise<void> {
    // Ensure cleanup happens even if process exits
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }
} 