/**
 * Test Database Utility
 * 
 * Provides utilities for setting up and tearing down test databases
 * for integration tests.
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

export class TestDatabase {
  private prisma: PrismaClient;
  private originalDatabaseUrl: string = '';

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/precision_ads_test'
        }
      }
    });
  }

  /**
   * Set up test database
   */
  async setup(): Promise<void> {
    try {
      // Run database migrations
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
      });

      // Seed with test data
      await this.seedTestData();
      
      console.log('✅ Test database setup completed');
    } catch (error) {
      console.error('❌ Test database setup failed:', error);
      throw error;
    }
  }

  /**
   * Clean up test database
   */
  async cleanup(): Promise<void> {
    try {
      // Clean all tables
      const tables = await this.getTableNames();
      
      for (const table of tables) {
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
      }
      
      console.log('✅ Test database cleanup completed');
    } catch (error) {
      console.error('❌ Test database cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get all table names from the database
   */
  private async getTableNames(): Promise<string[]> {
    const result = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%' 
      AND tablename NOT LIKE '_prisma_%'
    `;
    
    return result.map(r => r.tablename);
  }

  /**
   * Seed test database with initial data
   */
  private async seedTestData(): Promise<void> {
    // Create test organization
    await this.prisma.organization.upsert({
      where: { id: 'test-org-1' },
      update: {},
      create: {
        id: 'test-org-1',
        name: 'Test Organization',
        domain: 'test.com',
        orgType: 'ADVERTISER',
        status: 'ACTIVE'
      }
    });

    // Create test user
    await this.prisma.user.upsert({
      where: { id: 'test-user-1' },
      update: {},
      create: {
        id: 'test-user-1',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword123',
        role: 'ADMIN',
        organizationId: 'test-org-1',
        status: 'ACTIVE'
      }
    });

    console.log('✅ Test data seeded');
  }

  /**
   * Get Prisma client instance
   */
  getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export const testDatabase = new TestDatabase(); 