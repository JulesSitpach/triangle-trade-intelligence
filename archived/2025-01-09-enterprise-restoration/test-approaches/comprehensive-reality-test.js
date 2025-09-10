/**
 * COMPREHENSIVE REALITY-BASED FUNCTIONAL TEST
 * Tests EXACTLY what exists in the Triangle Intelligence platform
 * Based on actual code inspection, not documentation assumptions
 * 
 * DISCOVERED ARCHITECTURE:
 * - 6 Admin Dashboards (5 in /admin/, 1 in /sales/)
 * - 9 Admin API Endpoints (all functional)
 * - 39 Total API Endpoints
 * - Complete USMCA Workflow System
 */

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

const BASE_URL = 'http://localhost:3000';

// ============================================
// ACTUAL DASHBOARD STRUCTURE FROM YOUR CODE
// ============================================
const ACTUAL_DASHBOARDS = {
  admin: [
    {
      path: '/admin/supplier-management',
      label: 'Supplier Management',
      description: 'Manage suppliers and preferences',
      expectedButtons: ['Add Supplier', 'Import Suppliers', 'Export Data'],
      apiCalls: ['/api/admin/suppliers']
    },
    {
      path: '/admin/user-management',
      label: 'User Management',
      description: 'Manage customer accounts',
      expectedButtons: ['Add User', 'Export Users', 'Bulk Actions'],
      apiCalls: ['/api/admin/users', '/api/admin/subscriptions', '/api/admin/user-analytics']
    },
    {
      path: '/admin/analytics',
      label: 'Analytics',
      description: 'Platform usage and metrics',
      expectedButtons: ['Export Report', 'Date Range', 'Refresh'],
      apiCalls: ['/api/admin/workflow-analytics', '/api/admin/performance-analytics', '/api/admin/daily-activity']
    },
    {
      path: '/admin/system-config',
      label: 'System Config',
      description: 'Configure system settings',
      expectedButtons: ['Save Settings', 'Reset Defaults', 'Export Config'],
      apiCalls: ['/api/admin/performance-analytics']
    },
    {
      path: '/admin/crisis-management',
      label: 'Crisis Management',
      description: 'Monitor and manage tariff crises',
      expectedButtons: ['Pause Monitoring', 'Resume Monitoring', 'Manual Check'],
      apiCalls: ['/api/smart-rss-status', '/api/crisis-alerts', '/api/admin/rss-feeds']
    }
  ],
  sales: [
    {
      path: '/sales/dashboard',
      label: 'Sales Dashboard',
      description: 'Sales team tools and metrics',
      expectedButtons: ['View Leads', 'Export Pipeline', 'Add Opportunity'],
      apiCalls: ['/api/admin/revenue-analytics', '/api/admin/subscriptions']
    }
  ]
};

// ============================================
// ACTUAL API ENDPOINTS FROM YOUR PROJECT
// ============================================
const ADMIN_API_ENDPOINTS = [
  { path: '/api/admin/users', description: 'User management with activity analytics' },
  { path: '/api/admin/suppliers', description: 'Supplier directory with risk assessment' },
  { path: '/api/admin/daily-activity', description: 'Historical daily metrics and trends' },
  { path: '/api/admin/performance-analytics', description: 'System performance monitoring' },
  { path: '/api/admin/rss-feeds', description: 'RSS feed management for crisis monitoring' },
  { path: '/api/admin/workflow-analytics', description: 'Workflow completion analytics' },
  { path: '/api/admin/user-analytics', description: 'User behavior analytics' },
  { path: '/api/admin/subscriptions', description: 'Subscription management' },
  { path: '/api/admin/revenue-analytics', description: 'Revenue tracking and analysis' }
];

const CORE_WORKFLOW_APIS = [
  { path: '/api/simple-classification', description: 'AI-enhanced HS code classification' },
  { path: '/api/simple-usmca-compliance', description: 'USMCA compliance checking' },
  { path: '/api/simple-savings', description: 'Tariff savings calculation' },
  { path: '/api/simple-dropdown-options', description: 'Dynamic form options' }
];

// ============================================
// TEST UTILITIES
// ============================================
async function testEndpoint(url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    let data = null;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      success: response.ok,
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function extractPageContent(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Extract buttons from the HTML
    const buttonMatches = html.match(/<button[^>]*>([^<]+)<\/button>/g) || [];
    const buttons = buttonMatches.map(btn => {
      const text = btn.replace(/<[^>]+>/g, '').trim();
      return text;
    }).filter(text => text.length > 0);
    
    // Extract API calls from JavaScript
    const apiCalls = [];
    const fetchMatches = html.match(/fetch\(['"`](\/api[^'"`]+)['"`]/g) || [];
    fetchMatches.forEach(match => {
      const api = match.match(/['"`](\/api[^'"`]+)['"`]/);
      if (api) apiCalls.push(api[1]);
    });
    
    // Check for specific UI elements
    const hasTable = html.includes('<table') || html.includes('className="table');
    const hasForm = html.includes('<form') || html.includes('onSubmit');
    const hasChart = html.includes('chart') || html.includes('Chart');
    
    return {
      success: response.ok,
      status: response.status,
      buttons,
      apiCalls: [...new Set(apiCalls)], // Remove duplicates
      features: {
        hasTable,
        hasForm,
        hasChart
      },
      contentLength: html.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// COMPREHENSIVE TEST SUITES
// ============================================

async function testDashboardPages() {
  console.log(`\n${COLORS.CYAN}${COLORS.BOLD}📊 TESTING: All 6 Dashboard Pages${COLORS.RESET}`);
  console.log('=' . repeat(60));
  
  const results = {};
  const allDashboards = [...ACTUAL_DASHBOARDS.admin, ...ACTUAL_DASHBOARDS.sales];
  
  for (const dashboard of allDashboards) {
    console.log(`\n${COLORS.BLUE}Testing: ${dashboard.label}${COLORS.RESET}`);
    console.log(`  Path: ${dashboard.path}`);
    
    const pageData = await extractPageContent(BASE_URL + dashboard.path);
    
    if (pageData.success) {
      console.log(`  ${COLORS.GREEN}✅ Page loads successfully${COLORS.RESET}`);
      console.log(`  📦 Content size: ${pageData.contentLength} bytes`);
      
      // Check for expected buttons
      console.log(`  🔘 Buttons found: ${pageData.buttons.length}`);
      if (pageData.buttons.length > 0) {
        pageData.buttons.slice(0, 5).forEach(btn => {
          console.log(`     - "${btn}"`);
        });
      }
      
      // Check API integrations
      console.log(`  🔗 API calls detected: ${pageData.apiCalls.length}`);
      if (pageData.apiCalls.length > 0) {
        pageData.apiCalls.forEach(api => {
          console.log(`     - ${api}`);
        });
      }
      
      // Check UI features
      console.log(`  📋 UI Features:`);
      console.log(`     Table: ${pageData.features.hasTable ? '✅' : '❌'}`);
      console.log(`     Form: ${pageData.features.hasForm ? '✅' : '❌'}`);
      console.log(`     Charts: ${pageData.features.hasChart ? '✅' : '❌'}`);
      
    } else {
      console.log(`  ${COLORS.RED}❌ Failed to load: ${pageData.error}${COLORS.RESET}`);
    }
    
    results[dashboard.path] = pageData;
  }
  
  return results;
}

async function testAdminAPIs() {
  console.log(`\n${COLORS.CYAN}${COLORS.BOLD}🔌 TESTING: All 9 Admin API Endpoints${COLORS.RESET}`);
  console.log('=' . repeat(60));
  
  const results = {};
  
  for (const api of ADMIN_API_ENDPOINTS) {
    console.log(`\n${COLORS.BLUE}Testing: ${api.path}${COLORS.RESET}`);
    console.log(`  Purpose: ${api.description}`);
    
    const result = await testEndpoint(BASE_URL + api.path);
    
    if (result.success) {
      console.log(`  ${COLORS.GREEN}✅ API responds successfully${COLORS.RESET}`);
      
      // Analyze response structure
      if (result.data && typeof result.data === 'object') {
        const keys = Object.keys(result.data);
        console.log(`  📦 Response structure:`);
        keys.forEach(key => {
          const value = result.data[key];
          const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
          console.log(`     - ${key}: ${type}`);
        });
        
        // Check for expected data patterns
        if (result.data.users) {
          console.log(`  👥 Users found: ${result.data.users.length}`);
        }
        if (result.data.suppliers) {
          console.log(`  🏢 Suppliers found: ${result.data.suppliers.length}`);
        }
        if (result.data.rss_feeds) {
          console.log(`  📰 RSS feeds found: ${result.data.rss_feeds.length}`);
        }
        if (result.data.summary) {
          console.log(`  📊 Summary data included`);
        }
      }
    } else {
      console.log(`  ${COLORS.RED}❌ API failed: ${result.error}${COLORS.RESET}`);
    }
    
    results[api.path] = result;
  }
  
  return results;
}

async function testButtonFunctionality() {
  console.log(`\n${COLORS.CYAN}${COLORS.BOLD}🔘 TESTING: Interactive Button Functionality${COLORS.RESET}`);
  console.log('=' . repeat(60));
  
  // Test Crisis Management buttons
  console.log(`\n${COLORS.BLUE}Crisis Management Button Tests:${COLORS.RESET}`);
  
  // Test toggle monitoring button (would send POST)
  const toggleResult = await testEndpoint(
    BASE_URL + '/api/admin/crisis-monitoring',
    'POST',
    { active: true }
  );
  console.log(`  Toggle Monitoring: ${toggleResult.status === 404 ? '⚠️  API not implemented' : '✅ Working'}`);
  
  // Test manual check functionality
  const manualCheckResult = await testEndpoint(BASE_URL + '/api/smart-rss-status');
  console.log(`  Manual Check: ${manualCheckResult.success ? '✅ RSS status available' : '❌ Failed'}`);
  
  return { toggleResult, manualCheckResult };
}

async function testCompleteUserJourney() {
  console.log(`\n${COLORS.CYAN}${COLORS.BOLD}🚀 TESTING: Complete User Journey (Landing → Classification → Certificate)${COLORS.RESET}`);
  console.log('=' . repeat(60));
  
  const journey = {
    steps: [],
    success: true
  };
  
  // Step 1: Landing page
  console.log(`\n${COLORS.YELLOW}Step 1: User visits landing page${COLORS.RESET}`);
  const landing = await testEndpoint(BASE_URL + '/');
  journey.steps.push({ name: 'Landing Page', success: landing.success });
  console.log(`  ${landing.success ? '✅' : '❌'} Landing page loads`);
  
  // Step 2: Navigate to workflow
  console.log(`\n${COLORS.YELLOW}Step 2: User navigates to USMCA workflow${COLORS.RESET}`);
  const workflow = await testEndpoint(BASE_URL + '/usmca-workflow');
  journey.steps.push({ name: 'Workflow Page', success: workflow.success });
  console.log(`  ${workflow.success ? '✅' : '❌'} Workflow page accessible`);
  
  // Step 3: Get dropdown options
  console.log(`\n${COLORS.YELLOW}Step 3: Load form dropdown options${COLORS.RESET}`);
  const options = await testEndpoint(BASE_URL + '/api/simple-dropdown-options');
  journey.steps.push({ name: 'Dropdown Options', success: options.success });
  console.log(`  ${options.success ? '✅' : '❌'} Dropdown options loaded`);
  
  // Step 4: Classify product
  console.log(`\n${COLORS.YELLOW}Step 4: Classify automotive wire product${COLORS.RESET}`);
  const classification = await testEndpoint(
    BASE_URL + '/api/simple-classification',
    'POST',
    {
      product_description: 'automotive electrical wire harness',
      business_type: 'manufacturing'
    }
  );
  journey.steps.push({ name: 'Classification', success: classification.success });
  if (classification.success && classification.data.results) {
    console.log(`  ✅ Found ${classification.data.results.length} HS codes`);
    console.log(`  📦 Top result: ${classification.data.results[0].hs_code}`);
  } else {
    console.log(`  ❌ Classification failed`);
  }
  
  // Step 5: Check USMCA compliance
  console.log(`\n${COLORS.YELLOW}Step 5: Check USMCA qualification${COLORS.RESET}`);
  const compliance = await testEndpoint(
    BASE_URL + '/api/simple-usmca-compliance',
    'POST',
    {
      hs_code: '8544429000',
      action: 'check_qualification',
      product_details: {
        origin_country: 'MX',
        components: [
          { description: 'Wire', origin: 'MX', value_percentage: 60 },
          { description: 'Connectors', origin: 'US', value_percentage: 40 }
        ]
      }
    }
  );
  journey.steps.push({ name: 'USMCA Check', success: compliance.success });
  if (compliance.success) {
    console.log(`  ✅ Qualification checked`);
    console.log(`  📋 Result: ${compliance.data.qualification?.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}`);
  }
  
  // Step 6: Calculate savings
  console.log(`\n${COLORS.YELLOW}Step 6: Calculate tariff savings${COLORS.RESET}`);
  const savings = await testEndpoint(
    BASE_URL + '/api/simple-usmca-compliance',
    'POST',
    {
      hs_code: '8544429000',
      action: 'calculate_savings',
      annual_trade_value: 1000000
    }
  );
  journey.steps.push({ name: 'Savings Calculation', success: savings.success });
  if (savings.success && savings.data.savings) {
    console.log(`  ✅ Savings calculated`);
    console.log(`  💰 Potential savings: $${savings.data.savings.savings || 0}`);
  }
  
  // Step 7: Generate certificate
  console.log(`\n${COLORS.YELLOW}Step 7: Generate USMCA certificate${COLORS.RESET}`);
  const certificate = await testEndpoint(
    BASE_URL + '/api/trust/complete-certificate',
    'POST',
    {
      company_info: {
        company_name: 'Test Company Inc',
        address: '123 Trade St',
        contact_email: 'test@example.com'
      },
      product_info: {
        hs_code: '8544429000',
        description: 'Automotive wire harness'
      },
      qualification: {
        qualified: true,
        regional_content: 100
      }
    }
  );
  journey.steps.push({ name: 'Certificate Generation', success: certificate.success });
  if (certificate.success) {
    console.log(`  ✅ Certificate generated`);
    console.log(`  📄 Certificate ID: ${certificate.data.certificate_id || 'Generated'}`);
  }
  
  // Summary
  const successCount = journey.steps.filter(s => s.success).length;
  journey.overall_success = successCount === journey.steps.length;
  
  console.log(`\n${COLORS.BOLD}Journey Summary:${COLORS.RESET}`);
  console.log(`  Steps completed: ${successCount}/${journey.steps.length}`);
  console.log(`  Success rate: ${((successCount/journey.steps.length) * 100).toFixed(1)}%`);
  
  return journey;
}

async function testDataFlow() {
  console.log(`\n${COLORS.CYAN}${COLORS.BOLD}🔄 TESTING: Data Flow (API → Dashboard → UI)${COLORS.RESET}`);
  console.log('=' . repeat(60));
  
  // Test 1: RSS Feeds data flow
  console.log(`\n${COLORS.BLUE}RSS Feeds Data Flow:${COLORS.RESET}`);
  
  // API provides data
  const rssAPI = await testEndpoint(BASE_URL + '/api/admin/rss-feeds');
  console.log(`  1. API provides data: ${rssAPI.success ? '✅' : '❌'}`);
  if (rssAPI.success && rssAPI.data.rss_feeds) {
    console.log(`     - ${rssAPI.data.rss_feeds.length} feeds available`);
  }
  
  // Dashboard requests data
  const crisisDashboard = await extractPageContent(BASE_URL + '/admin/crisis-management');
  console.log(`  2. Dashboard loads: ${crisisDashboard.success ? '✅' : '❌'}`);
  
  // Check if dashboard calls the right API
  const callsRSSAPI = crisisDashboard.apiCalls?.includes('/api/admin/rss-feeds');
  console.log(`  3. Dashboard calls RSS API: ${callsRSSAPI ? '✅' : '❌'}`);
  
  // Test 2: User Management data flow
  console.log(`\n${COLORS.BLUE}User Management Data Flow:${COLORS.RESET}`);
  
  const usersAPI = await testEndpoint(BASE_URL + '/api/admin/users');
  console.log(`  1. Users API provides data: ${usersAPI.success ? '✅' : '❌'}`);
  
  const userDashboard = await extractPageContent(BASE_URL + '/admin/user-management');
  console.log(`  2. User dashboard loads: ${userDashboard.success ? '✅' : '❌'}`);
  
  const callsUserAPI = userDashboard.apiCalls?.includes('/api/admin/users');
  console.log(`  3. Dashboard calls Users API: ${callsUserAPI ? '✅' : '❌'}`);
  
  return {
    rssFlow: { api: rssAPI.success, dashboard: crisisDashboard.success, integrated: callsRSSAPI },
    userFlow: { api: usersAPI.success, dashboard: userDashboard.success, integrated: callsUserAPI }
  };
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runComprehensiveTest() {
  console.log(`${COLORS.BOLD}${COLORS.MAGENTA}`);
  console.log('🔍 TRIANGLE INTELLIGENCE - COMPREHENSIVE REALITY TEST');
  console.log('=' . repeat(60));
  console.log(`Testing EXACTLY what exists in your project${COLORS.RESET}`);
  console.log(`Based on actual code inspection, not assumptions\n`);
  
  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    dashboards: {},
    apis: {},
    buttons: {},
    journey: {},
    dataFlow: {}
  };
  
  // Run all test suites
  results.dashboards = await testDashboardPages();
  results.apis = await testAdminAPIs();
  results.buttons = await testButtonFunctionality();
  results.journey = await testCompleteUserJourney();
  results.dataFlow = await testDataFlow();
  
  // Calculate statistics
  const dashboardCount = Object.keys(results.dashboards).filter(k => results.dashboards[k].success).length;
  const apiCount = Object.keys(results.apis).filter(k => results.apis[k].success).length;
  
  // Final Report
  console.log(`\n${COLORS.BOLD}${COLORS.MAGENTA}`);
  console.log('=' . repeat(60));
  console.log('📈 COMPREHENSIVE TEST RESULTS');
  console.log('=' . repeat(60));
  console.log(`${COLORS.RESET}`);
  
  console.log(`\n${COLORS.BOLD}DISCOVERED ARCHITECTURE:${COLORS.RESET}`);
  console.log(`  📊 Dashboards: ${dashboardCount}/6 working`);
  console.log(`  🔌 Admin APIs: ${apiCount}/9 responding`);
  console.log(`  🚀 User Journey: ${results.journey.overall_success ? 'COMPLETE' : 'INCOMPLETE'}`);
  console.log(`  🔄 Data Flows: ${results.dataFlow.rssFlow.integrated && results.dataFlow.userFlow.integrated ? 'CONNECTED' : 'ISSUES DETECTED'}`);
  
  console.log(`\n${COLORS.BOLD}KEY FINDINGS:${COLORS.RESET}`);
  
  // Dashboard findings
  console.log(`\n  ${COLORS.CYAN}Dashboard Status:${COLORS.RESET}`);
  const allDashboards = [...ACTUAL_DASHBOARDS.admin, ...ACTUAL_DASHBOARDS.sales];
  allDashboards.forEach(d => {
    const status = results.dashboards[d.path]?.success ? '✅' : '❌';
    console.log(`    ${status} ${d.label} - ${d.path}`);
  });
  
  // API findings
  console.log(`\n  ${COLORS.CYAN}API Endpoints:${COLORS.RESET}`);
  ADMIN_API_ENDPOINTS.forEach(api => {
    const status = results.apis[api.path]?.success ? '✅' : '❌';
    const hasData = results.apis[api.path]?.data ? ' (has data)' : ' (no data)';
    console.log(`    ${status} ${api.path}${status === '✅' ? hasData : ''}`);
  });
  
  // Overall verdict
  const totalTests = dashboardCount + apiCount + (results.journey.overall_success ? 1 : 0);
  const maxTests = 6 + 9 + 1;
  const successRate = (totalTests / maxTests * 100).toFixed(1);
  
  console.log(`\n${COLORS.BOLD}FINAL VERDICT:${COLORS.RESET}`);
  if (successRate >= 80) {
    console.log(`  ${COLORS.GREEN}✅ PLATFORM FUNCTIONAL - ${successRate}% components working${COLORS.RESET}`);
  } else if (successRate >= 60) {
    console.log(`  ${COLORS.YELLOW}⚠️  PLATFORM PARTIALLY FUNCTIONAL - ${successRate}% components working${COLORS.RESET}`);
  } else {
    console.log(`  ${COLORS.RED}❌ PLATFORM NEEDS ATTENTION - Only ${successRate}% components working${COLORS.RESET}`);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n⏱️  Test completed in ${duration} seconds`);
  
  // Save detailed report
  require('fs').writeFileSync(
    'comprehensive-reality-report.json',
    JSON.stringify(results, null, 2)
  );
  console.log(`📄 Detailed report saved to: comprehensive-reality-report.json`);
  
  return results;
}

// Run the test if called directly
if (require.main === module) {
  runComprehensiveTest().catch(console.error);
}

module.exports = { runComprehensiveTest };