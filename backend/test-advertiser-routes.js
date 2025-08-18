const http = require('http');

// Test the advertiser routes
const testRoutes = async () => {
  const baseUrl = 'http://localhost:7401';
  const organizationId = 'demo-org';
  
  console.log('🧪 Testing Advertiser Routes...\n');
  
  // Test 1: Get campaigns
  console.log('1. Testing GET /advertiser/campaigns');
  try {
    const response = await makeRequest(`${baseUrl}/advertiser/campaigns`, 'GET', {
      'x-organization-id': organizationId
    });
    console.log('✅ GET campaigns response:', response);
  } catch (error) {
    console.log('❌ GET campaigns failed:', error.message);
  }
  
  // Test 2: Create campaign
  console.log('\n2. Testing POST /advertiser/campaigns');
  try {
    const campaignData = {
      name: 'Test Campaign',
      type: 'DISPLAY',
      budget: 1000,
      budgetType: 'LIFETIME',
      bidStrategy: 'MANUAL'
    };
    
    const response = await makeRequest(`${baseUrl}/advertiser/campaigns`, 'POST', {
      'x-organization-id': organizationId,
      'Content-Type': 'application/json'
    }, campaignData);
    console.log('✅ POST campaign response:', response);
  } catch (error) {
    console.log('❌ POST campaign failed:', error.message);
  }
  
  // Test 3: Get analytics summary
  console.log('\n3. Testing GET /advertiser/analytics/summary');
  try {
    const response = await makeRequest(`${baseUrl}/advertiser/analytics/summary`, 'GET', {
      'x-organization-id': organizationId
    });
    console.log('✅ GET analytics response:', response);
  } catch (error) {
    console.log('❌ GET analytics failed:', error.message);
  }
};

function makeRequest(url, method, headers, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers
    };
    
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          resolve(body);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Run tests
testRoutes().catch(console.error); 