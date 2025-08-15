// Test Configuration with Real Values
// This file contains actual API keys and organization IDs for testing

export const testConfig = {
  // Organization IDs (updated from seed script)
  organizations: {
    precisionAds: 'cmeca9rgu0000tupcz6avokli',
    techCorp: 'cmeca9rgv0001tupchzvo4mbx',
    fashionForward: 'cmeca9rgw0002tupcenwoed57',
    digitalAgency: 'cmeca9rgw0003tupcd4472ohq'
  },
  
  // API Keys (Data Ingestion) - updated from seed script
  apiKeys: {
    precisionAds: 'eb32b972a96b932d5ba8764d172227d6d10c589aeb1b368ab43e4435ff91b190', // TechCorp key
    techCorp: 'eb32b972a96b932d5ba8764d172227d6d10c589aeb1b368ab43e4435ff91b190', // TechCorp key
    fashionForward: 'fc1de00de397fa605632d99318b9409e28d5b2a9f2fed4308f9fdd69007e5558', // Analytics key
    digitalAgency: 'eb32b972a96b932d5ba8764d172227d6d10c589aeb1b368ab43e4435ff91b190' // TechCorp key
  },
  
  // API Keys (Analytics) - updated from seed script
  analyticsKeys: {
    precisionAds: 'fc1de00de397fa605632d99318b9409e28d5b2a9f2fed4308f9fdd69007e5558',
    techCorp: 'fc1de00de397fa605632d99318b9409e28d5b2a9f2fed4308f9fdd69007e5558',
    fashionForward: 'fc1de00de397fa605632d99318b9409e28d5b2a9f2fed4308f9fdd69007e5558',
    digitalAgency: 'fc1de00de397fa605632d99318b9409e28d5b2a9f2fed4308f9fdd69007e5558'
  },
  
  // Test User Credentials
  users: {
    superAdmin: {
      email: 'superadmin@precisionads.com',
      password: 'superadmin123'
    },
    admin: {
      email: 'admin@precisionads.com',
      password: 'admin123'
    },
    publisher: {
      email: 'publisher@techcorp.com',
      password: 'publisher123'
    },
    advertiser: {
      email: 'advertiser@fashionforward.com',
      password: 'advertiser123'
    }
  },
  
  // Base URL
  baseURL: 'http://localhost:7401'
}; 