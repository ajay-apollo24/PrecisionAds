import { APITester } from './api-tester';
import { TestDataGenerator, TestData } from './test-data-generator';

async function getAuthToken(testData: TestData): Promise<string | null> {
  try {
    const response = await fetch('http://localhost:7401/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testData.user.email,
        password: 'testpass123'
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authentication successful');
      return data.token;
    } else {
      console.log('❌ Authentication failed:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    return null;
  }
}

async function main() {
  console.log('🚀 Running Single Test: Track Event (API Key)');
  console.log('='.repeat(60));
  
  const testDataGenerator = new TestDataGenerator();
  let testData: TestData | null = null;
  
  try {
    // Generate fresh test data
    testData = await testDataGenerator.generateTestData();
    
    // Set up cleanup on exit
    testDataGenerator.cleanupOnExit();
    
    // Get authentication token using the generated test data
    console.log('🔐 Getting authentication token...');
    const authToken = await getAuthToken(testData);
    
    if (!authToken) {
      console.log('❌ Failed to get authentication token. Exiting.');
      return;
    }
    
    const tester = new APITester('http://localhost:7401');
    tester.setAuthToken(authToken);
    
    // Create the single test case
    const singleTest = {
      name: 'Track Event (API Key)',
      method: 'POST' as const,
      endpoint: '/api/v1/admin/events',
      headers: {
        'x-api-key': testData.apiKey,
        'x-organization-id': testData.organization.id
      },
      body: {
        identityId: testData.identity.id,
        type: 'PAGE_VIEW',
        name: 'Homepage Visited',
        properties: {
          page: '/',
          referrer: 'google.com'
        },
        idempotencyKey: 'test_event_001'
      },
      expectedStatus: 201,
      validateResponse: (data: any) => data.success && data.data.name === 'Homepage Visited'
    };
    
    console.log('\n🧪 Running single test...');
    console.log('Test data:', {
      organizationId: testData.organization.id,
      identityId: testData.identity.id,
      apiKey: testData.apiKey.substring(0, 16) + '...'
    });
    
    const result = await tester.runTest(singleTest);
    
    console.log('\n📊 Test Result:');
    console.log(`Name: ${result.name}`);
    console.log(`Success: ${result.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Status Code: ${result.statusCode}`);
    console.log(`Response Time: ${result.responseTime}ms`);
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
    if (result.data) {
      console.log(`Response Data:`, JSON.stringify(result.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    // Always cleanup test data
    if (testData) {
      console.log('\n🧹 Final cleanup...');
      await testDataGenerator.cleanup();
    }
  }
}

main(); 