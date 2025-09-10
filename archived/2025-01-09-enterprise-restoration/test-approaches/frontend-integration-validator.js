#!/usr/bin/env node

/**
 * FRONTEND INTEGRATION VALIDATOR
 * Tests the UI-to-API integration that users actually experience
 * Complementary to the backend API validator
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const testResults = [];

function addResult(test, passed, details = {}) {
  testResults.push({
    test,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
  
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${test}`);
  if (!passed && details.error) {
    console.log(`   Error: ${details.error}`);
  }
}

async function testFrontendIntegration() {
  console.log('\n🔗 TESTING FRONTEND-TO-BACKEND INTEGRATION...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Track network requests to verify API calls
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });
    
    // Test 1: Homepage loads
    try {
      await page.goto(`${BASE_URL}/`);
      const title = await page.title();
      addResult(
        'Homepage loads with correct title',
        title.includes('TradeFlow Intelligence'),
        { title }
      );
    } catch (error) {
      addResult('Homepage loads with correct title', false, { error: error.message });
    }
    
    // Test 2: USMCA Workflow page loads
    try {
      await page.goto(`${BASE_URL}/usmca-workflow`);
      await page.waitForSelector('body', { timeout: 5000 });
      
      // Check if form elements exist
      const hasCompanyField = await page.$('input[placeholder*="company"], input[name*="company"]');
      const hasProductField = await page.$('textarea[placeholder*="product"], textarea[name*="product"]');
      
      addResult(
        'USMCA workflow page loads with form elements',
        !!(hasCompanyField && hasProductField),
        { 
          hasCompanyField: !!hasCompanyField,
          hasProductField: !!hasProductField
        }
      );
    } catch (error) {
      addResult('USMCA workflow page loads with form elements', false, { error: error.message });
    }
    
    // Test 3: Simple Calculator Widget (if exists)
    try {
      await page.goto(`${BASE_URL}/`);
      
      // Look for calculator elements
      const calculatorButton = await page.$('button[type="submit"], button:contains("Calculate")');
      
      if (calculatorButton) {
        // Try to trigger the calculator
        await calculatorButton.click();
        
        // Wait a moment for API calls
        await page.waitForTimeout(2000);
        
        // Check if API was called
        const savingsAPICalled = apiCalls.some(call => 
          call.url.includes('/api/simple-savings')
        );
        
        addResult(
          'Calculator button triggers API call',
          savingsAPICalled,
          { apiCalls: apiCalls.length }
        );
      } else {
        addResult(
          'Calculator button triggers API call',
          false,
          { error: 'No calculator button found on homepage' }
        );
      }
    } catch (error) {
      addResult('Calculator button triggers API call', false, { error: error.message });
    }
    
    // Test 4: Check for JavaScript errors
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.goto(`${BASE_URL}/usmca-workflow`);
    await page.waitForTimeout(3000); // Let page fully load
    
    addResult(
      'No JavaScript console errors',
      jsErrors.length === 0,
      { errorCount: jsErrors.length, errors: jsErrors.slice(0, 3) }
    );
    
    // Test 5: Admin dashboard loads (if accessible)
    try {
      await page.goto(`${BASE_URL}/admin/analytics`);
      await page.waitForSelector('body', { timeout: 3000 });
      
      const pageText = await page.evaluate(() => document.body.innerText);
      const hasData = pageText.includes('users') || pageText.includes('savings') || pageText.includes('workflows');
      
      addResult(
        'Admin dashboard displays data',
        hasData,
        { hasUserData: pageText.includes('users') }
      );
    } catch (error) {
      addResult('Admin dashboard displays data', false, { error: 'Dashboard not accessible or timeout' });
    }
    
  } catch (error) {
    console.error('Browser test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function testAPIEndpointsDirectly() {
  console.log('\n🔌 TESTING API ENDPOINTS DIRECTLY...\n');
  
  const endpoints = [
    {
      name: 'Simple dropdown options',
      url: '/api/simple-dropdown-options',
      method: 'GET'
    },
    {
      name: 'Database dropdown options',
      url: '/api/database-driven-dropdown-options?category=all',
      method: 'GET'
    },
    {
      name: 'System status',
      url: '/api/system-status',
      method: 'GET'
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.url}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      });
      
      const isSuccess = response.ok;
      const data = isSuccess ? await response.json() : null;
      
      addResult(
        `${endpoint.name} API responds`,
        isSuccess,
        { 
          status: response.status,
          hasData: !!data,
          dataType: typeof data
        }
      );
    } catch (error) {
      addResult(
        `${endpoint.name} API responds`,
        false,
        { error: error.message }
      );
    }
  }
}

function generateReport() {
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  const score = Math.round((passed / total) * 100);
  
  console.log('\n' + '='.repeat(60));
  console.log('🔗 FRONTEND INTEGRATION TEST REPORT');
  console.log('='.repeat(60));
  console.log(`📊 Score: ${score}% (${passed}/${total} tests passed)`);
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  
  const failedTests = testResults.filter(r => !r.passed);
  
  if (failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failedTests.forEach((test, i) => {
      console.log(`${i + 1}. ${test.test}`);
      if (test.details.error) {
        console.log(`   ${test.details.error}`);
      }
    });
  }
  
  if (score >= 80) {
    console.log('\n✅ FRONTEND INTEGRATION: GOOD');
    console.log('The UI properly connects to backend APIs');
  } else if (score >= 60) {
    console.log('\n⚠️  FRONTEND INTEGRATION: PARTIAL');
    console.log('Some UI components may not connect properly to APIs');
  } else {
    console.log('\n❌ FRONTEND INTEGRATION: BROKEN');
    console.log('Major issues with UI-to-API integration');
  }
  
  console.log('='.repeat(60));
  
  // Save detailed report
  require('fs').writeFileSync(
    'frontend-integration-report.json', 
    JSON.stringify({ score, passed, total, tests: testResults }, null, 2)
  );
  
  console.log('\n📁 Detailed report saved to: frontend-integration-report.json');
}

async function main() {
  console.log('🚀 STARTING FRONTEND INTEGRATION TESTS...');
  console.log('This validates that the UI actually connects to backend APIs\n');
  
  try {
    // Test if server is running
    const response = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    if (!response || !response.ok) {
      console.error('❌ Server not running on http://localhost:3000');
      console.error('Please start the server with: npm run dev\n');
      process.exit(1);
    }
    
    await testAPIEndpointsDirectly();
    await testFrontendIntegration();
    
    generateReport();
    
    const passRate = (testResults.filter(r => r.passed).length / testResults.length) * 100;
    process.exit(passRate >= 70 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Frontend integration test failed:', error.message);
    process.exit(1);
  }
}

main();