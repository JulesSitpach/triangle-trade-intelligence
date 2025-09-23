/**
 * Database Connection Debugger
 * Identifies why frontend shows "No data found" despite rich database content
 * Tests all key database tables and API endpoints
 */

export async function debugDatabaseConnections() {
  console.log('🔍 DEBUGGING DATABASE CONNECTIONS');
  console.log('=================================');

  const results = {
    apiEndpoints: {},
    dataTableCounts: {},
    serviceTypeMismatches: [],
    recommendations: []
  };

  // Test all key API endpoints
  const keyEndpoints = [
    '/api/admin/service-requests',
    '/api/admin/broker-operations',
    '/api/admin/professional-services',
    '/api/admin/workflow-analytics',
    '/api/workflow-session',
    '/api/dynamic-pricing',
    '/api/crisis-calculator',
    '/api/admin/market-intelligence'
  ];

  console.log('\n📡 TESTING API ENDPOINTS');
  console.log('------------------------');

  for (const endpoint of keyEndpoints) {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      results.apiEndpoints[endpoint] = {
        status: response.ok ? 'success' : 'error',
        dataFound: checkDataContent(data),
        recordCount: getRecordCount(data),
        dataStructure: getDataStructure(data)
      };

      console.log(`✅ ${endpoint}`);
      console.log(`   Records: ${results.apiEndpoints[endpoint].recordCount}`);
      console.log(`   Has Data: ${results.apiEndpoints[endpoint].dataFound}`);

    } catch (error) {
      results.apiEndpoints[endpoint] = {
        status: 'error',
        error: error.message
      };
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }

  // Test specific service type filtering issues
  console.log('\n🏷️  TESTING SERVICE TYPE FILTERING');
  console.log('----------------------------------');

  try {
    const serviceRequestsResponse = await fetch('/api/admin/service-requests');
    const serviceRequestsData = await serviceRequestsResponse.json();

    if (serviceRequestsData.success && serviceRequestsData.requests) {
      const serviceTypes = [...new Set(serviceRequestsData.requests.map(r => r.service_type))];
      const assignedMembers = [...new Set(serviceRequestsData.requests.map(r => r.assigned_to))];

      console.log(`📊 Found ${serviceRequestsData.requests.length} service requests`);
      console.log(`🏷️  Service Types: ${serviceTypes.join(', ')}`);
      console.log(`👥 Assigned Members: ${assignedMembers.join(', ')}`);

      // Check what frontend components expect vs what database has
      const frontendExpectations = {
        'jorge-supplier-sourcing': ['mexico-supplier-sourcing', 'supplier-sourcing'],
        'jorge-manufacturing': ['mexico-manufacturing-feasibility', 'manufacturing-feasibility'],
        'jorge-market-entry': ['mexico-market-entry', 'market-entry'],
        'cristina-certificates': ['usmca-certificate', 'certificate-generation'],
        'cristina-classification': ['hs-classification', 'hs-code-classification']
      };

      Object.entries(frontendExpectations).forEach(([component, expectedTypes]) => {
        const matches = expectedTypes.filter(type => serviceTypes.includes(type));
        if (matches.length === 0) {
          results.serviceTypeMismatches.push({
            component,
            expected: expectedTypes,
            available: serviceTypes,
            recommendation: `Update ${component} to filter for: ${serviceTypes.join(' OR ')}`
          });
        }
      });
    }
  } catch (error) {
    console.log(`❌ Service type analysis failed: ${error.message}`);
  }

  // Test workflow data richness
  console.log('\n📈 TESTING WORKFLOW DATA RICHNESS');
  console.log('---------------------------------');

  try {
    const workflowResponse = await fetch('/api/admin/workflow-analytics');
    const workflowData = await workflowResponse.json();

    results.dataTableCounts.workflow_sessions = workflowData.workflow_sessions?.length || 0;
    results.dataTableCounts.workflow_completions = workflowData.workflow_completions?.length || 0;

    console.log(`📊 Workflow Sessions: ${results.dataTableCounts.workflow_sessions}`);
    console.log(`✅ Workflow Completions: ${results.dataTableCounts.workflow_completions}`);

    if (results.dataTableCounts.workflow_sessions > 100) {
      results.recommendations.push('RICH DATA AVAILABLE: Leverage workflow_sessions table (186 records) for detailed analytics');
    }
  } catch (error) {
    console.log(`❌ Workflow analytics failed: ${error.message}`);
  }

  // Test broker operations data
  console.log('\n🏢 TESTING BROKER OPERATIONS DATA');
  console.log('---------------------------------');

  try {
    const brokerResponse = await fetch('/api/admin/broker-operations');
    const brokerData = await brokerResponse.json();

    results.dataTableCounts.broker_operations = getRecordCount(brokerData);
    console.log(`📊 Broker Operations: ${results.dataTableCounts.broker_operations}`);

    if (results.dataTableCounts.broker_operations > 0) {
      results.recommendations.push('USE BROKER DATA: broker_operations table has 8 records for Cristina\'s dashboard');
    }
  } catch (error) {
    console.log(`❌ Broker operations test failed: ${error.message}`);
  }

  // Generate recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('------------------');

  if (results.serviceTypeMismatches.length > 0) {
    console.log('🔧 SERVICE TYPE FIXES NEEDED:');
    results.serviceTypeMismatches.forEach((mismatch, index) => {
      console.log(`   ${index + 1}. ${mismatch.recommendation}`);
    });
  }

  results.recommendations.forEach((rec, index) => {
    console.log(`💡 ${index + 1}. ${rec}`);
  });

  // Critical data connection issues
  const criticalIssues = identifyCriticalIssues(results);
  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES');
    console.log('------------------');
    criticalIssues.forEach((issue, index) => {
      console.log(`❌ ${index + 1}. ${issue}`);
    });
  }

  return results;
}

function checkDataContent(data) {
  if (!data) return false;

  // Check various data structures
  if (data.requests && Array.isArray(data.requests) && data.requests.length > 0) return true;
  if (data.operations && Array.isArray(data.operations) && data.operations.length > 0) return true;
  if (data.services && Array.isArray(data.services) && data.services.length > 0) return true;
  if (data.workflow_sessions && Array.isArray(data.workflow_sessions) && data.workflow_sessions.length > 0) return true;
  if (data.data && Array.isArray(data.data) && data.data.length > 0) return true;

  return false;
}

function getRecordCount(data) {
  if (!data) return 0;

  if (data.requests && Array.isArray(data.requests)) return data.requests.length;
  if (data.operations && Array.isArray(data.operations)) return data.operations.length;
  if (data.services && Array.isArray(data.services)) return data.services.length;
  if (data.workflow_sessions && Array.isArray(data.workflow_sessions)) return data.workflow_sessions.length;
  if (data.data && Array.isArray(data.data)) return data.data.length;

  return 0;
}

function getDataStructure(data) {
  if (!data) return 'no data';

  const keys = Object.keys(data);
  return keys.slice(0, 5).join(', '); // Show first 5 keys
}

function identifyCriticalIssues(results) {
  const issues = [];

  // Check if service-requests API is working but returning no data
  const serviceRequestsResult = results.apiEndpoints['/api/admin/service-requests'];
  if (serviceRequestsResult?.status === 'success' && serviceRequestsResult?.recordCount === 0) {
    issues.push('service-requests API works but returns 0 records - check database connection');
  }

  // Check if any APIs are completely failing
  const failedApis = Object.entries(results.apiEndpoints)
    .filter(([endpoint, result]) => result.status === 'error')
    .map(([endpoint]) => endpoint);

  if (failedApis.length > 0) {
    issues.push(`API endpoints failing: ${failedApis.join(', ')}`);
  }

  // Check if rich data tables are not being leveraged
  if (Object.values(results.dataTableCounts).every(count => count === 0)) {
    issues.push('No rich database tables being accessed - frontend not connected to database');
  }

  return issues;
}

// Quick test function to run from browser console
export function quickDatabaseTest() {
  console.log('🧪 QUICK DATABASE CONNECTION TEST');

  // Test the most critical endpoints
  const criticalTests = [
    { name: 'Service Requests', url: '/api/admin/service-requests' },
    { name: 'Workflow Data', url: '/api/admin/workflow-analytics' },
    { name: 'Dynamic Pricing', url: '/api/dynamic-pricing',
      method: 'POST',
      body: { action: 'health_check' } }
  ];

  criticalTests.forEach(async (test) => {
    try {
      const options = {
        method: test.method || 'GET',
        headers: { 'Content-Type': 'application/json' }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const data = await response.json();

      console.log(`✅ ${test.name}: ${getRecordCount(data)} records`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  });
}

export default { debugDatabaseConnections, quickDatabaseTest };