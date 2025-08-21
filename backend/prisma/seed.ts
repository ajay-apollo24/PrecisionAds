import { PrismaClient, OrganizationType, UserRole, UserStatus, PermissionScope, APIKeyStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean up existing data
  console.log('🧹 Cleaning up existing data...');
  await prisma.userPermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.aPIKey.deleteMany();
  await prisma.event.deleteMany();
  await prisma.trait.deleteMany();
  await prisma.cohort.deleteMany();
  await prisma.identity.deleteMany();
  await prisma.adRequest.deleteMany();
  await prisma.adUnit.deleteMany();
  await prisma.publisherEarning.deleteMany();
  await prisma.publisherSite.deleteMany();
  await prisma.advertiserAudience.deleteMany();
  await prisma.advertiserAd.deleteMany();
  await prisma.advertiserCampaign.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.audienceSegment.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.creativeAssetVersion.deleteMany();
  await prisma.creativeAsset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('✅ Database cleaned');

  // Create Organizations
  console.log('🏢 Creating organizations...');
  
  const precisionAdsOrg = await prisma.organization.create({
    data: {
      name: 'Precision Ads Inc.',
      orgType: 'ADMIN',
      domain: 'precisionads.com',
      status: 'ACTIVE',
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        features: ['advanced_analytics', 'ai_optimization', 'rtb']
      }
    }
  });

  const techCorpOrg = await prisma.organization.create({
    data: {
      name: 'TechCorp Media',
      orgType: 'PUBLISHER',
      domain: 'techcorp.com',
      status: 'ACTIVE',
      settings: {
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        adFormats: ['banner', 'video', 'native']
      }
    }
  });

  const fashionBrandOrg = await prisma.organization.create({
    data: {
      name: 'Fashion Forward Brands',
      orgType: 'ADVERTISER',
      domain: 'fashionforward.com',
      status: 'ACTIVE',
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        targetAudience: ['fashion', 'lifestyle', 'luxury']
      }
    }
  });

  const agencyOrg = await prisma.organization.create({
    data: {
      name: 'Digital Marketing Agency',
      orgType: 'AGENCY',
      domain: 'digitalagency.com',
      status: 'ACTIVE',
      settings: {
        timezone: 'America/Chicago',
        currency: 'USD',
        services: ['campaign_management', 'creative_design', 'analytics']
      }
    }
  });

  console.log('✅ Organizations created');

  // Create Permissions
  console.log('🔐 Creating permissions...');
  
  const permissionScopes = Object.values(PermissionScope);
  const permissions: any[] = [];

  for (const scope of permissionScopes) {
    const permission = await prisma.permission.create({
      data: {
        organizationId: precisionAdsOrg.id,
        name: scope,
        description: `Permission to ${scope.toLowerCase().replace('_', ' ')}`,
        scope,
        isActive: true
      }
    });
    permissions.push(permission);
  }

  console.log('✅ Permissions created');

  // Create Users
  console.log('👥 Creating users...');
  
  const superAdminPassword = await bcrypt.hash('superadmin123', 12);
  const adminPassword = await bcrypt.hash('admin123', 12);
  const userPassword = await bcrypt.hash('user123', 12);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@precisionads.com',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      organizationId: precisionAdsOrg.id,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@precisionads.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      organizationId: precisionAdsOrg.id,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  const publisherUser = await prisma.user.create({
    data: {
      email: 'publisher@techcorp.com',
      password: userPassword,
      firstName: 'Publisher',
      lastName: 'User',
      role: 'PUBLISHER',
      status: 'ACTIVE',
      organizationId: techCorpOrg.id,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  const advertiserUser = await prisma.user.create({
    data: {
      email: 'advertiser@fashionforward.com',
      password: userPassword,
      firstName: 'Advertiser',
      lastName: 'User',
      role: 'ADVERTISER',
      status: 'ACTIVE',
      organizationId: fashionBrandOrg.id,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  const agencyUser = await prisma.user.create({
    data: {
      email: 'manager@digitalagency.com',
      password: userPassword,
      firstName: 'Agency',
      lastName: 'Manager',
      role: 'MANAGER',
      status: 'ACTIVE',
      organizationId: agencyOrg.id,
      emailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  console.log('✅ Users created');

  // Assign permissions to users
  console.log('🔑 Assigning permissions...');
  
  // Super admin gets all permissions
  for (const permission of permissions) {
    await prisma.userPermission.create({
      data: {
        userId: superAdmin.id,
        permissionId: permission.id,
        grantedAt: new Date(),
        grantedBy: superAdmin.id,
        isActive: true
      }
    });
  }

  // Admin gets most permissions
  const adminPermissions = permissions.filter(p => 
    !p.scope.includes('DELETE') && 
    !p.scope.includes('SUPER_ADMIN')
  );
  
  for (const permission of adminPermissions) {
    await prisma.userPermission.create({
      data: {
        userId: admin.id,
        permissionId: permission.id,
        grantedAt: new Date(),
        grantedBy: superAdmin.id,
        isActive: true
      }
    });
  }

  // Publisher gets relevant permissions
  const publisherPermissions = permissions.filter(p => 
    p.scope.includes('PUBLISHER') || 
    p.scope.includes('READ') ||
    p.scope.includes('INGEST')
  );
  
  for (const permission of publisherPermissions) {
    await prisma.userPermission.create({
      data: {
        userId: publisherUser.id,
        permissionId: permission.id,
        grantedAt: new Date(),
        grantedBy: admin.id,
        isActive: true
      }
    });
  }

  // Advertiser gets relevant permissions
  const advertiserPermissions = permissions.filter(p => 
    p.scope.includes('ADVERTISER') || 
    p.scope.includes('CAMPAIGN') ||
    p.scope.includes('ADS') ||
    p.scope.includes('READ')
  );
  
  for (const permission of advertiserPermissions) {
    await prisma.userPermission.create({
      data: {
        userId: advertiserUser.id,
        permissionId: permission.id,
        grantedAt: new Date(),
        grantedBy: admin.id,
        isActive: true
      }
    });
  }

  console.log('✅ Permissions assigned');

  // Create API Keys
  console.log('🔑 Creating API keys...');
  
  const apiKey1 = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const apiKey1Hash = await bcrypt.hash(apiKey1, 12);
  
  await prisma.aPIKey.create({
    data: {
      name: 'Data Ingestion Key',
      keyHash: apiKey1Hash,
      organizationId: techCorpOrg.id,
      userId: publisherUser.id,
      scopes: ['INGEST_WRITE', 'TRAITS_WRITE', 'COHORTS_WRITE'],
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
  });

  const apiKey2 = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const apiKey2Hash = await bcrypt.hash(apiKey2, 12);
  
  await prisma.aPIKey.create({
    data: {
      name: 'Analytics Key',
      keyHash: apiKey2Hash,
      organizationId: fashionBrandOrg.id,
      userId: advertiserUser.id,
      scopes: ['ANALYTICS_READ', 'INGEST_READ'],
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
  });

  console.log('✅ API keys created');

  // Create Publisher Sites
  console.log('🌐 Creating publisher sites...');
  
  const techSite = await prisma.publisherSite.create({
    data: {
      name: 'TechCorp News',
      domain: 'news.techcorp.com',
      organizationId: techCorpOrg.id,
      status: 'ACTIVE',
      settings: {
        adFormats: ['banner', 'video'],
        categories: ['technology', 'news'],
        language: 'en'
      }
    }
  });

  const blogSite = await prisma.publisherSite.create({
    data: {
      name: 'TechCorp Blog',
      domain: 'blog.techcorp.com',
      organizationId: techCorpOrg.id,
      status: 'ACTIVE',
      settings: {
        adFormats: ['banner', 'native'],
        categories: ['technology', 'blog'],
        language: 'en'
      }
    }
  });

  console.log('✅ Publisher sites created');

  // Create Ad Units
  console.log('📱 Creating ad units...');
  
  const bannerAdUnit = await prisma.adUnit.create({
    data: {
      name: 'Header Banner',
      size: '728x90',
      format: 'BANNER',
      organizationId: techCorpOrg.id,
      siteId: techSite.id,
      status: 'ACTIVE',
      settings: {
        allowedFormats: ['banner'],
        targeting: ['technology', 'news']
      }
    }
  });

  const videoAdUnit = await prisma.adUnit.create({
    data: {
      name: 'Video Player',
      size: '640x360',
      format: 'VIDEO',
      organizationId: techCorpOrg.id,
      siteId: techSite.id,
      status: 'ACTIVE',
      settings: {
        allowedFormats: ['video'],
        targeting: ['technology', 'video']
      }
    }
  });

  console.log('✅ Ad units created');

  // Create Advertiser Campaigns
  console.log('📢 Creating advertiser campaigns...');
  
  const fashionCampaign = await prisma.advertiserCampaign.create({
    data: {
      name: 'Summer Fashion Collection',
      organizationId: fashionBrandOrg.id,
      status: 'ACTIVE',
      type: 'DISPLAY',
      budget: 10000,
      budgetType: 'DAILY',
      bidStrategy: 'AUTO_CPC',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      targetCPC: 0.50,
      dailyBudget: 100
    }
  });

  console.log('✅ Advertiser campaigns created');

  // Create Advertiser Audience
  console.log('👥 Creating advertiser audience...');
  
  await prisma.advertiserAudience.create({
    data: {
      organizationId: fashionBrandOrg.id,
      campaignId: fashionCampaign.id,
      name: 'Fashion Enthusiasts',
      description: 'Target audience for fashion campaigns',
      targeting: {
        demographics: { age: [18, 45], gender: ['female'] },
        interests: ['fashion', 'lifestyle', 'shopping'],
        locations: ['US', 'CA', 'UK']
      },
      size: 50000
    }
  });

  console.log('✅ Advertiser audience created');

  // Create Advertiser Ads
  console.log('🖼️ Creating advertiser ads...');
  
  const fashionAd = await prisma.advertiserAd.create({
    data: {
      name: 'Summer Dress Banner',
      organizationId: fashionBrandOrg.id,
      campaignId: fashionCampaign.id,
      status: 'ACTIVE',
      creativeType: 'IMAGE',
      creativeUrl: 'https://example.com/summer-dress-banner.jpg',
      landingPageUrl: 'https://example.com/summer-collection',
      targeting: {
        interests: ['fashion', 'summer'],
        demographics: { age: [18, 45] }
      }
    }
  });

  console.log('✅ Advertiser ads created');

  // Create Sample Identities
  console.log('👤 Creating sample identities...');
  
  const sampleIdentity = await prisma.identity.create({
    data: {
      organizationId: techCorpOrg.id,
      externalId: 'user_tech_001',
      anonymousId: 'anon_tech_001',
      userId: 'internal_user_001',
      identityTraits: {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Tech',
        interests: ['technology', 'programming'],
        location: 'San Francisco'
      },
      version: 1,
      idempotencyKey: 'seed_identity_001'
    }
  });

  console.log('✅ Sample identities created');

  // Create Sample Traits
  console.log('🏷️ Creating sample traits...');
  
  await prisma.trait.create({
    data: {
      organizationId: techCorpOrg.id,
      identityId: sampleIdentity.id,
      key: 'preferred_topics',
      value: ['AI', 'Machine Learning', 'Web Development'],
      type: 'ARRAY',
      version: 1,
      idempotencyKey: 'seed_trait_001',
      createdBy: publisherUser.id
    }
  });

  await prisma.trait.create({
    data: {
      organizationId: techCorpOrg.id,
      identityId: sampleIdentity.id,
      key: 'subscription_tier',
      value: 'premium',
      type: 'STRING',
      version: 1,
      idempotencyKey: 'seed_trait_002',
      createdBy: publisherUser.id
    }
  });

  console.log('✅ Sample traits created');

  // Create Sample Cohorts
  console.log('👥 Creating sample cohorts...');
  
  await prisma.cohort.create({
    data: {
      organizationId: techCorpOrg.id,
      name: 'Tech Enthusiasts',
      description: 'Users interested in technology and programming',
      type: 'BEHAVIORAL',
      criteria: {
        interests: ['technology', 'programming'],
        behavior: ['frequent_visitor', 'content_engaged'],
        minVisits: 5
      },
      version: 1,
      idempotencyKey: 'seed_cohort_001',
      createdBy: publisherUser.id
    }
  });

  console.log('✅ Sample cohorts created');

  // Create Sample Events
  console.log('📊 Creating sample events...');
  
  await prisma.event.create({
    data: {
      organizationId: techCorpOrg.id,
      identityId: sampleIdentity.id,
      type: 'PAGE_VIEW',
      name: 'Article Read',
      properties: {
        page: '/articles/ai-future',
        category: 'technology',
        timeSpent: 180,
        referrer: 'google.com'
      },
      timestamp: new Date(),
      version: 1,
      idempotencyKey: 'seed_event_001',
      createdBy: publisherUser.id
    }
  });

  console.log('✅ Sample events created');

  // Create Publisher Earnings
  console.log('💰 Creating sample earnings...');
  
  await prisma.publisherEarning.create({
    data: {
      organizationId: techCorpOrg.id,
      siteId: techSite.id,
      date: new Date(),
      impressions: 15000,
      clicks: 450,
      revenue: 225.50,
      cpm: 15.03,
      cpc: 0.50
    }
  });

  console.log('✅ Sample earnings created');

  // Create Creative Assets
  console.log('🎨 Creating creative assets...');
  
  const summerDressAsset = await prisma.creativeAsset.create({
    data: {
      organizationId: fashionBrandOrg.id,
      name: 'Summer Dress Collection Banner',
      fileName: 'summer-dress-banner.jpg',
      fileSize: 245760, // 240KB
      mimeType: 'image/jpeg',
      dimensions: { width: 728, height: 90 },
      fileHash: 'a1b2c3d4e5f6789012345678901234567890abcdef',
      cdnUrl: 'https://cdn.example.com/assets/summer-dress-banner.jpg',
      status: 'VALIDATED',
      metadata: {
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
        tags: ['summer', 'fashion', 'dresses', 'banner'],
        brand: 'Fashion Forward',
        campaign: 'Summer Collection 2024'
      }
    }
  });

  const winterCoatAsset = await prisma.creativeAsset.create({
    data: {
      organizationId: fashionBrandOrg.id,
      name: 'Winter Coat Video Ad',
      fileName: 'winter-coat-video.mp4',
      fileSize: 5242880, // 5MB
      mimeType: 'video/mp4',
      dimensions: { width: 640, height: 360 },
      duration: 15, // 15 seconds
      fileHash: 'b2c3d4e5f6789012345678901234567890abcdef1',
      cdnUrl: 'https://cdn.example.com/assets/winter-coat-video.mp4',
      status: 'VALIDATED',
      metadata: {
        tags: ['winter', 'fashion', 'coats', 'video'],
        brand: 'Fashion Forward',
        campaign: 'Winter Collection 2024',
        videoQuality: 'HD',
        aspectRatio: '16:9'
      }
    }
  });

  const html5BannerAsset = await prisma.creativeAsset.create({
    data: {
      organizationId: fashionBrandOrg.id,
      name: 'Interactive HTML5 Banner',
      fileName: 'interactive-banner.html',
      fileSize: 15360, // 15KB
      mimeType: 'text/html',
      fileHash: 'c3d4e5f6789012345678901234567890abcdef12',
      cdnUrl: 'https://cdn.example.com/assets/interactive-banner.html',
      status: 'VALIDATED',
      metadata: {
        tags: ['interactive', 'html5', 'banner', 'fashion'],
        brand: 'Fashion Forward',
        campaign: 'Interactive Collection',
        features: ['animation', 'click-tracking', 'responsive'],
        dimensions: { width: 300, height: 250 }
      }
    }
  });

  const techBannerAsset = await prisma.creativeAsset.create({
    data: {
      organizationId: techCorpOrg.id,
      name: 'Tech Conference Banner',
      fileName: 'tech-conference-banner.png',
      fileSize: 184320, // 180KB
      mimeType: 'image/png',
      dimensions: { width: 300, height: 250 },
      fileHash: 'd4e5f6789012345678901234567890abcdef123',
      cdnUrl: 'https://cdn.example.com/assets/tech-conference-banner.png',
      status: 'VALIDATED',
      metadata: {
        colors: ['#2C3E50', '#3498DB', '#E74C3C'],
        tags: ['technology', 'conference', 'banner'],
        brand: 'TechCorp',
        event: 'Tech Conference 2024'
      }
    }
  });

  console.log('✅ Creative assets created');

  // Create Asset Versions
  console.log('🔄 Creating asset versions...');
  
  await prisma.creativeAssetVersion.create({
    data: {
      assetId: summerDressAsset.id,
      version: 1,
      filePath: '/assets/v1/summer-dress-banner.jpg',
      cdnUrl: 'https://cdn.example.com/assets/v1/summer-dress-banner.jpg',
      isActive: true
    }
  });

  await prisma.creativeAssetVersion.create({
    data: {
      assetId: winterCoatAsset.id,
      version: 1,
      filePath: '/assets/v1/winter-coat-video.mp4',
      cdnUrl: 'https://cdn.example.com/assets/v1/winter-coat-video.mp4',
      isActive: true
    }
  });

  await prisma.creativeAssetVersion.create({
    data: {
      assetId: html5BannerAsset.id,
      version: 1,
      filePath: '/assets/v1/interactive-banner.html',
      cdnUrl: 'https://cdn.example.com/assets/v1/interactive-banner.html',
      isActive: true
    }
  });

  // Create a second version for the summer dress asset
  await prisma.creativeAssetVersion.create({
    data: {
      assetId: summerDressAsset.id,
      version: 2,
      filePath: '/assets/v2/summer-dress-banner.jpg',
      cdnUrl: 'https://cdn.example.com/assets/v2/summer-dress-banner.jpg',
      isActive: true
    }
  });

  console.log('✅ Asset versions created');

  // Update existing ads to use creative assets
  console.log('🔗 Linking ads to creative assets...');
  
  await prisma.advertiserAd.update({
    where: { id: fashionAd.id },
    data: {
      creativeAssetId: summerDressAsset.id
    }
  });

  // Create additional ads with different creative assets
  const winterCoatAd = await prisma.advertiserAd.create({
    data: {
      name: 'Winter Coat Video Ad',
      organizationId: fashionBrandOrg.id,
      campaignId: fashionCampaign.id,
      status: 'ACTIVE',
      creativeType: 'VIDEO',
      creativeUrl: 'https://cdn.example.com/assets/winter-coat-video.mp4',
      landingPageUrl: 'https://example.com/winter-collection',
      creativeAssetId: winterCoatAsset.id,
      targeting: {
        interests: ['fashion', 'winter'],
        demographics: { age: [25, 55] }
      }
    }
  });

  const html5Ad = await prisma.advertiserAd.create({
    data: {
      name: 'Interactive HTML5 Banner',
      organizationId: fashionBrandOrg.id,
      campaignId: fashionCampaign.id,
      status: 'ACTIVE',
      creativeType: 'HTML5',
      creativeUrl: 'https://cdn.example.com/assets/interactive-banner.html',
      landingPageUrl: 'https://example.com/interactive-collection',
      creativeAssetId: html5BannerAsset.id,
      targeting: {
        interests: ['fashion', 'interactive'],
        demographics: { age: [18, 35] }
      }
    }
  });

  console.log('✅ Ads linked to creative assets');

  // Create additional campaigns for more variety
  console.log('📢 Creating additional campaigns...');
  
  const winterCampaign = await prisma.advertiserCampaign.create({
    data: {
      name: 'Winter Fashion Collection',
      organizationId: fashionBrandOrg.id,
      status: 'ACTIVE',
      type: 'VIDEO',
      budget: 15000,
      budgetType: 'DAILY',
      bidStrategy: 'AUTO_CPM',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
      targetCPM: 8.50,
      dailyBudget: 150
    }
  });

  const interactiveCampaign = await prisma.advertiserCampaign.create({
    data: {
      name: 'Interactive Fashion Experience',
      organizationId: fashionBrandOrg.id,
      status: 'ACTIVE',
      type: 'DISPLAY',
      budget: 8000,
      budgetType: 'DAILY',
      bidStrategy: 'AUTO_CPC',
      startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // 75 days from now
      targetCPC: 0.75,
      dailyBudget: 80
    }
  });

  console.log('✅ Additional campaigns created');

  // Create more audiences
  console.log('👥 Creating additional audiences...');
  
  await prisma.advertiserAudience.create({
    data: {
      organizationId: fashionBrandOrg.id,
      campaignId: winterCampaign.id,
      name: 'Winter Fashion Enthusiasts',
      description: 'Target audience for winter fashion campaigns',
      targeting: {
        demographics: { age: [25, 55], gender: ['female', 'male'] },
        interests: ['fashion', 'winter', 'luxury'],
        locations: ['US', 'CA', 'UK', 'DE', 'FR']
      },
      size: 75000
    }
  });

  await prisma.advertiserAudience.create({
    data: {
      organizationId: fashionBrandOrg.id,
      campaignId: interactiveCampaign.id,
      name: 'Digital Fashion Forward',
      description: 'Tech-savvy fashion consumers',
      targeting: {
        demographics: { age: [18, 35], gender: ['female', 'male'] },
        interests: ['fashion', 'technology', 'social_media'],
        behaviors: ['online_shopping', 'mobile_users', 'early_adopters']
      },
      size: 45000
    }
  });

  console.log('✅ Additional audiences created');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary of created data:');
  console.log(`   🏢 Organizations: 4`);
  console.log(`   👥 Users: 5`);
  console.log(`   🔐 Permissions: ${permissions.length}`);
  console.log(`   🔑 API Keys: 2`);
  console.log(`   🌐 Publisher Sites: 2`);
  console.log(`   📱 Ad Units: 2`);
  console.log(`   📢 Campaigns: 3`);
  console.log(`   🖼️ Ads: 3`);
  console.log(`   🎨 Creative Assets: 4`);
  console.log(`   🔄 Asset Versions: 4`);
  console.log(`   👥 Audiences: 3`);
  console.log(`   👤 Identities: 1`);
  console.log(`   🏷️ Traits: 2`);
  console.log(`   👥 Cohorts: 1`);
  console.log(`   📊 Events: 1`);
  console.log(`   💰 Earnings: 1`);
  
  console.log('\n🔑 Test Credentials:');
  console.log('   Super Admin: superadmin@precisionads.com / superadmin123');
  console.log('   Admin: admin@precisionads.com / admin123');
  console.log('   Publisher: publisher@techcorp.com / user123');
  console.log('   Advertiser: advertiser@fashionforward.com / user123');
  console.log('   Agency: manager@digitalagency.com / user123');
  
  console.log('\n🔑 API Keys (for testing):');
  console.log(`   Data Ingestion: ${apiKey1}`);
  console.log(`   Analytics: ${apiKey2}`);
  
  console.log('\n🌐 Test Organization IDs:');
  console.log(`   Precision Ads (Admin): ${precisionAdsOrg.id}`);
  console.log(`   TechCorp (Publisher): ${techCorpOrg.id}`);
  console.log(`   Fashion Forward (Advertiser): ${fashionBrandOrg.id}`);
  console.log(`   Digital Agency: ${agencyOrg.id}`);
  
  console.log('\n🎨 Creative Assets Created:');
  console.log(`   Summer Dress Banner: ${summerDressAsset.id}`);
  console.log(`   Winter Coat Video: ${winterCoatAsset.id}`);
  console.log(`   Interactive HTML5: ${html5BannerAsset.id}`);
  console.log(`   Tech Conference Banner: ${techBannerAsset.id}`);
  
  console.log('\n📢 Campaigns Created:');
  console.log(`   Summer Fashion: ${fashionCampaign.id}`);
  console.log(`   Winter Fashion: ${winterCampaign.id}`);
  console.log(`   Interactive Fashion: ${interactiveCampaign.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 