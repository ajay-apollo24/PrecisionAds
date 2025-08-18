const fetch = require('node-fetch');

async function testCampaignCreation() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🧪 Testing Campaign Creation...\n');
    
    // Test 1: Check if the route exists
    console.log('1️⃣ Testing route availability...');
    const response = await fetch(`${baseUrl}/api/v1/advertiser/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        'x-organization-id': 'demo-org'
      },
      body: JSON.stringify({
        name: 'Test Campaign',
        description: 'Test campaign for debugging',
        budget: 1000,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        type: 'DISPLAY',
        status: 'DRAFT'
      })
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Route: POST ${baseUrl}/api/v1/advertiser/campaigns`);
    
    if (response.status === 401) {
      console.log('   ✅ Route exists (401 Unauthorized - expected without valid token)');
    } else if (response.status === 404) {
      console.log('   ❌ Route not found - check route registration');
    } else {
      console.log(`   ⚠️ Unexpected status: ${response.status}`);
    }
    
    // Test 2: Check available routes
    console.log('\n2️⃣ Checking available routes...');
    const routesResponse = await fetch(`${baseUrl}/api/v1/docs`);
    
    if (routesResponse.ok) {
      const routes = await routesResponse.json();
      console.log('   Available API endpoints:');
      Object.entries(routes.endpoints).forEach(([name, path]) => {
        console.log(`     ${name}: ${path}`);
      });
    } else {
      console.log('   ❌ Could not fetch API documentation');
    }
    
    // Test 3: Check server status
    console.log('\n3️⃣ Checking server status...');
    try {
      const healthResponse = await fetch(`${baseUrl}/api/v1/auth/health`);
      console.log(`   Auth endpoint status: ${healthResponse.status}`);
    } catch (error) {
      console.log('   ❌ Could not reach auth endpoint');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
  
  console.log('\n🎯 Test completed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Check if backend is running on port 3000');
  console.log('   2. Verify routes are properly registered');
  console.log('   3. Check if Prisma schema is updated');
  console.log('   4. Ensure database is running');
}

// Run the test
testCampaignCreation(); 