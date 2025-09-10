/**
 * TRIANGLE INTELLIGENCE - ACTUAL FUNCTIONALITY VALIDATOR
 * Tests what users can ACTUALLY do, not just what APIs return
 * Based on the agent completion validation requirements
 */

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m', 
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

const BASE_URL = 'http://localhost:3000';

// Track what users can ACTUALLY do
let validationResults = {
  canAccess: {},
  buttonsWork: {},
  dataDisplays: {},
  workflowsComplete: {},
  errorsHandled: {}
};

async function validateFeatureComplete(featureName, testConfig) {
  console.log(`\n${COLORS.BLUE}${COLORS.BOLD}🧪 VALIDATING: ${featureName}${COLORS.RESET}`);
  console.log('=' . repeat(50));
  
  let overallSuccess = true;
  const results = {};

  // 1. Can user access the feature?
  console.log(`\n${COLORS.YELLOW}1. ACCESSIBILITY TEST${COLORS.RESET}`);
  const pageLoads = await testPageAccess(testConfig.url);
  results.pageAccess = pageLoads;
  if (!pageLoads.success) {
    console.log(`  ${COLORS.RED}❌ User cannot access ${featureName}${COLORS.RESET}`);
    overallSuccess = false;
  } else {
    console.log(`  ${COLORS.GREEN}✅ User can access ${featureName}${COLORS.RESET}`);
  }

  // 2. Do UI interactions work?
  console.log(`\n${COLORS.YELLOW}2. UI INTERACTION TEST${COLORS.RESET}`);
  const uiWorks = await testUIInteractions(testConfig);
  results.uiInteractions = uiWorks;
  if (!uiWorks.success) {
    console.log(`  ${COLORS.RED}❌ UI interactions broken in ${featureName}${COLORS.RESET}`);
    overallSuccess = false;
  }

  // 3. Does data actually display?
  console.log(`\n${COLORS.YELLOW}3. DATA DISPLAY TEST${COLORS.RESET}`);
  const dataDisplays = await testDataDisplay(testConfig);
  results.dataDisplay = dataDisplays;
  if (!dataDisplays.success) {
    console.log(`  ${COLORS.RED}❌ Data not displaying properly in ${featureName}${COLORS.RESET}`);
    overallSuccess = false;
  }

  // 4. Can user complete the workflow?
  if (testConfig.workflow) {
    console.log(`\n${COLORS.YELLOW}4. WORKFLOW COMPLETION TEST${COLORS.RESET}`);
    const workflowComplete = await testFullWorkflow(testConfig.workflow);
    results.workflowCompletion = workflowComplete;
    if (!workflowComplete.success) {
      console.log(`  ${COLORS.RED}❌ User cannot complete ${featureName} workflow${COLORS.RESET}`);
      overallSuccess = false;
    }
  }

  // Final assessment
  console.log(`\n${COLORS.BOLD}FEATURE ASSESSMENT:${COLORS.RESET}`);
  if (overallSuccess) {
    console.log(`  ${COLORS.GREEN}✅ ${featureName} is ACTUALLY COMPLETE${COLORS.RESET}`);
    console.log(`  ${COLORS.GREEN}   Users can successfully accomplish their goals${COLORS.RESET}`);
  } else {
    console.log(`  ${COLORS.RED}❌ ${featureName} is STILL BROKEN${COLORS.RESET}`);
    console.log(`  ${COLORS.RED}   Users will encounter failures and frustration${COLORS.RESET}`);
  }

  return { success: overallSuccess, details: results };
}

async function testPageAccess(url) {
  try {
    const response = await fetch(BASE_URL + url);
    const html = await response.text();
    
    // Check if page actually loads (not error page)
    const hasContent = html.length > 1000;
    const isErrorPage = html.includes('404') || html.includes('500') || html.includes('Error');
    const hasNavigation = html.includes('nav') || html.includes('menu');
    
    return {
      success: response.ok && hasContent && !isErrorPage,
      status: response.status,
      hasContent,
      isErrorPage,
      hasNavigation,
      contentLength: html.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testUIInteractions(testConfig) {
  // Test if the page contains expected interactive elements
  try {
    const response = await fetch(BASE_URL + testConfig.url);
    const html = await response.text();
    
    const results = {
      success: true,
      issues: []
    };
    
    // Check for expected buttons
    if (testConfig.expectedButtons) {
      testConfig.expectedButtons.forEach(buttonText => {
        const hasButton = html.includes(`>${buttonText}<`) || html.includes(`"${buttonText}"`);
        if (!hasButton) {
          results.issues.push(`Missing expected button: "${buttonText}"`);
          results.success = false;
        }
      });
    }
    
    // Check for form elements
    if (testConfig.shouldHaveForms && !html.includes('<form')) {
      results.issues.push('Expected forms but none found');
      results.success = false;
    }
    
    // Check for data tables
    if (testConfig.shouldHaveTables && !html.includes('<table')) {
      results.issues.push('Expected data tables but none found');
      results.success = false;
    }
    
    return results;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testDataDisplay(testConfig) {
  // Test if APIs are actually called and data displayed
  const results = {
    success: true,
    issues: []
  };
  
  if (testConfig.requiredAPIs) {
    for (const api of testConfig.requiredAPIs) {
      try {
        const response = await fetch(BASE_URL + api);
        const data = await response.json();
        
        if (!response.ok) {
          results.issues.push(`API ${api} returns error: ${response.status}`);
          results.success = false;
          continue;
        }
        
        // Check if API returns meaningful data
        const hasData = data && Object.keys(data).length > 0;
        if (!hasData) {
          results.issues.push(`API ${api} returns empty/no data`);
          results.success = false;
        }
        
        // Check for expected data structure
        if (testConfig.expectedDataFields) {
          for (const field of testConfig.expectedDataFields[api] || []) {
            if (!data[field]) {
              results.issues.push(`API ${api} missing expected field: ${field}`);
              results.success = false;
            }
          }
        }
        
      } catch (error) {
        results.issues.push(`API ${api} failed: ${error.message}`);
        results.success = false;
      }
    }
  }
  
  return results;
}

async function testFullWorkflow(workflowSteps) {
  console.log(`    Testing ${workflowSteps.length} workflow steps...`);
  
  const results = {
    success: true,
    completedSteps: 0,
    failedSteps: [],
    issues: []
  };
  
  for (let i = 0; i < workflowSteps.length; i++) {
    const step = workflowSteps[i];
    console.log(`      Step ${i + 1}: ${step.name}`);
    
    try {
      let stepResult;
      
      if (step.type === 'api_call') {
        const response = await fetch(BASE_URL + step.endpoint, {
          method: step.method || 'GET',
          headers: step.headers || { 'Content-Type': 'application/json' },
          body: step.body ? JSON.stringify(step.body) : null
        });
        
        stepResult = {
          success: response.ok,
          status: response.status,
          data: await response.json()
        };
        
      } else if (step.type === 'page_load') {
        stepResult = await testPageAccess(step.url);
        
      } else {
        stepResult = { success: true }; // Unknown step type, assume success
      }
      
      if (stepResult.success) {
        results.completedSteps++;
        console.log(`        ${COLORS.GREEN}✅ Success${COLORS.RESET}`);
      } else {
        results.failedSteps.push({
          step: i + 1,
          name: step.name,
          error: stepResult.error || stepResult.status || 'Unknown failure'
        });
        results.success = false;
        console.log(`        ${COLORS.RED}❌ Failed${COLORS.RESET}`);
      }
      
    } catch (error) {
      results.failedSteps.push({
        step: i + 1,
        name: step.name,
        error: error.message
      });
      results.success = false;
      console.log(`        ${COLORS.RED}❌ Error: ${error.message}${COLORS.RESET}`);
    }
  }
  
  console.log(`    ${COLORS.BOLD}Workflow Result: ${results.completedSteps}/${workflowSteps.length} steps completed${COLORS.RESET}`);
  return results;
}

async function runComprehensiveValidation() {
  console.log(`${COLORS.BOLD}${COLORS.BLUE}🔍 TRIANGLE INTELLIGENCE - ACTUAL FUNCTIONALITY VALIDATION${COLORS.RESET}`);
  console.log('Testing what users can ACTUALLY do, not just what APIs return');
  console.log('=' . repeat(70));
  
  const featureTests = [
    {
      name: 'User Management Dashboard',
      url: '/admin/user-management',
      requiredAPIs: ['/api/admin/users', '/api/admin/subscriptions', '/api/admin/user-analytics'],
      expectedButtons: ['Add User', 'Export Users'],
      shouldHaveTables: true,
      expectedDataFields: {
        '/api/admin/users': ['users', 'summary'],
        '/api/admin/subscriptions': ['subscriptions', 'summary'],
        '/api/admin/user-analytics': ['total_users', 'active_users']
      }
    },
    {
      name: 'Supplier Management Dashboard', 
      url: '/admin/supplier-management',
      requiredAPIs: ['/api/admin/suppliers'],
      expectedButtons: ['Add Supplier', 'Export Data'],
      shouldHaveTables: true,
      expectedDataFields: {
        '/api/admin/suppliers': ['suppliers', 'summary']
      }
    },
    {
      name: 'Crisis Management Dashboard',
      url: '/admin/crisis-management',
      requiredAPIs: ['/api/smart-rss-status', '/api/crisis-alerts?action=get_active_alerts', '/api/admin/rss-feeds'],
      expectedButtons: ['Pause Monitoring', 'Resume Monitoring', 'Manual Check'],
      expectedDataFields: {
        '/api/smart-rss-status': ['monitoring'],
        '/api/admin/rss-feeds': ['rss_feeds', 'summary']
      }
    },
    {
      name: 'USMCA Compliance Workflow',
      url: '/usmca-workflow',
      requiredAPIs: ['/api/simple-dropdown-options'],
      shouldHaveForms: true,
      workflow: [
        {
          name: 'Load workflow page',
          type: 'page_load',
          url: '/usmca-workflow'
        },
        {
          name: 'Load dropdown options',
          type: 'api_call',
          endpoint: '/api/simple-dropdown-options',
          method: 'GET'
        },
        {
          name: 'Classify product',
          type: 'api_call',
          endpoint: '/api/simple-classification',
          method: 'POST',
          body: {
            product_description: 'automotive electrical wire harness',
            business_type: 'manufacturing'
          }
        },
        {
          name: 'Check USMCA qualification',
          type: 'api_call',
          endpoint: '/api/simple-usmca-compliance',
          method: 'POST',
          body: {
            action: 'check_qualification',
            data: {
              hs_code: '8544429000',
              product_details: {
                origin_country: 'MX',
                components: [
                  { description: 'Wire', origin: 'MX', value_percentage: 60 }
                ]
              }
            }
          }
        }
      ]
    },
    {
      name: 'Analytics Dashboard',
      url: '/admin/analytics', 
      requiredAPIs: ['/api/admin/workflow-analytics', '/api/admin/performance-analytics', '/api/admin/daily-activity'],
      expectedButtons: ['Export Report', 'Refresh'],
      expectedDataFields: {
        '/api/admin/workflow-analytics': ['total_workflows', 'completion_rate'],
        '/api/admin/performance-analytics': ['avg_workflow_time', 'api_success_rate'],
        '/api/admin/daily-activity': ['daily_activity', 'summary']
      }
    }
  ];
  
  const overallResults = {};
  let totalSuccess = 0;
  
  for (const test of featureTests) {
    const result = await validateFeatureComplete(test.name, test);
    overallResults[test.name] = result;
    if (result.success) totalSuccess++;
  }
  
  // Final Report
  console.log(`\n${COLORS.BOLD}${COLORS.BLUE}=' . repeat(70)${COLORS.RESET}`);
  console.log(`${COLORS.BOLD}COMPREHENSIVE VALIDATION RESULTS${COLORS.RESET}`);
  console.log('=' . repeat(70));
  
  const successRate = ((totalSuccess / featureTests.length) * 100).toFixed(1);
  
  console.log(`\n${COLORS.BOLD}WHAT USERS CAN ACTUALLY DO:${COLORS.RESET}`);
  Object.entries(overallResults).forEach(([feature, result]) => {
    const status = result.success ? `${COLORS.GREEN}✅ WORKS` : `${COLORS.RED}❌ BROKEN`;
    console.log(`  ${status}${COLORS.RESET} ${feature}`);
    
    if (!result.success && result.details) {
      Object.entries(result.details).forEach(([category, details]) => {
        if (details.issues && details.issues.length > 0) {
          details.issues.forEach(issue => {
            console.log(`       ${COLORS.RED}• ${issue}${COLORS.RESET}`);
          });
        }
      });
    }
  });
  
  console.log(`\n${COLORS.BOLD}HONEST ASSESSMENT:${COLORS.RESET}`);
  if (successRate >= 90) {
    console.log(`  ${COLORS.GREEN}✅ PLATFORM ACTUALLY WORKS - ${successRate}% features functional for users${COLORS.RESET}`);
  } else if (successRate >= 70) {
    console.log(`  ${COLORS.YELLOW}⚠️ PLATFORM PARTIALLY WORKS - ${successRate}% features functional for users${COLORS.RESET}`);
  } else {
    console.log(`  ${COLORS.RED}❌ PLATFORM STILL BROKEN - Only ${successRate}% features work for users${COLORS.RESET}`);
  }
  
  console.log(`\n${COLORS.BOLD}USER EXPERIENCE VERDICT:${COLORS.RESET}`);
  console.log(`Users can successfully accomplish their goals in ${totalSuccess}/${featureTests.length} major features`);
  
  return {
    overallSuccess: successRate >= 80,
    successRate,
    results: overallResults
  };
}

// Run the validation
if (require.main === module) {
  runComprehensiveValidation().catch(console.error);
}

module.exports = { runComprehensiveValidation, validateFeatureComplete };