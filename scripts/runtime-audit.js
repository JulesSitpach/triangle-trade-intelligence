#!/usr/bin/env node
/**
 * RUNTIME DATA FLOW AUDIT
 * Tests actual workflow with real data to catch field mismatches
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const AUDIT_RESULTS = {
  timestamp: new Date().toISOString(),
  testsPassed: 0,
  testsFailed: 0,
  criticalIssues: [],
  warnings: [],
  dataFlows: []
};

async function runAudit() {
  console.log('🚀 Starting Runtime Data Flow Audit...\n');

  const browser = await puppeteer.launch({
    headless: false, // Show browser so user can see what's happening
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('formData') || text.includes('additionalContext')) {
      console.log('📋 Browser Console:', text);
    }
  });

  try {
    // Test 1: USMCA Workflow Data Flow
    console.log('🔍 TEST 1: USMCA Workflow Data Flow\n');
    await testWorkflowDataFlow(page);

    // Test 2: AI Classification Data Flow
    console.log('\n🔍 TEST 2: AI Classification Data Flow\n');
    await testAIClassificationFlow(page);

    // Test 3: Component Enrichment Flow
    console.log('\n🔍 TEST 3: Component Enrichment Flow\n');
    await testEnrichmentFlow(page);

  } catch (error) {
    AUDIT_RESULTS.criticalIssues.push({
      test: 'Runtime Audit',
      error: error.message,
      stack: error.stack
    });
  }

  await browser.close();

  // Generate report
  generateReport();
}

async function testWorkflowDataFlow(page) {
  try {
    await page.goto('http://localhost:3000/usmca-workflow', {
      waitUntil: 'networkidle2'
    });

    // Fill Step 1 with test data
    const testData = {
      company_name: 'Test Company Inc',
      business_type: 'Manufacturer',
      industry_sector: 'Automotive',
      company_address: '123 Test St, City, State',
      company_country: 'United States',
      contact_person: 'John Doe',
      contact_phone: '555-0123',
      contact_email: 'test@example.com',
      trade_volume: '1000000',
      supplier_country: 'CN',
      destination_country: 'US',
      product_description: 'High-pressure hydraulic pumps for industrial machinery'
    };

    console.log('✏️  Filling Step 1 form...');

    // Fill form fields - use actual class names from the app
    await page.type('input.form-input[placeholder*="legal entity name"]', testData.company_name);

    // Wait for business type dropdown
    await page.waitForSelector('select.form-select');

    // Select business type - need to find the option by text
    await page.evaluate((businessType) => {
      const select = document.querySelector('select.form-select');
      const option = Array.from(select.options).find(opt => opt.text.includes(businessType));
      if (option) select.value = option.value;
    }, testData.business_type);

    // Wait and capture formData state
    await page.waitForTimeout(1000);

    // Inject script to capture formData
    const formDataStep1 = await page.evaluate(() => {
      // Access React state directly
      const root = document.querySelector('#__next');
      const reactProps = root?._reactProps || {};
      return JSON.stringify(localStorage.getItem('triangleUserData'));
    });

    console.log('📊 FormData after Step 1:', formDataStep1);

    // Click Continue
    await page.click('button:has-text("Continue to Product Details")');
    await page.waitForTimeout(2000);

    // Now we're on Step 2 - check if data persisted
    const formDataStep2 = await page.evaluate(() => {
      return localStorage.getItem('triangleUserData');
    });

    if (!formDataStep2) {
      AUDIT_RESULTS.criticalIssues.push({
        test: 'Step 1 → Step 2 Data Persistence',
        issue: 'formData NOT saved to localStorage',
        impact: 'CRITICAL - All Step 1 data lost'
      });
      console.log('❌ CRITICAL: formData not persisted to Step 2');
    } else {
      const parsed = JSON.parse(formDataStep2);

      // Validate all expected fields exist
      const expectedFields = Object.keys(testData);
      const missingFields = expectedFields.filter(field => !parsed[field]);

      if (missingFields.length > 0) {
        AUDIT_RESULTS.criticalIssues.push({
          test: 'Step 1 → Step 2 Data Completeness',
          issue: `Missing fields: ${missingFields.join(', ')}`,
          impact: 'HIGH - Partial data loss'
        });
        console.log(`❌ Missing fields in Step 2: ${missingFields.join(', ')}`);
      } else {
        AUDIT_RESULTS.testsPassed++;
        console.log('✅ All Step 1 fields persisted to Step 2');
      }
    }

    AUDIT_RESULTS.dataFlows.push({
      flow: 'Step 1 → Step 2',
      status: formDataStep2 ? 'PASS' : 'FAIL',
      data: formDataStep2
    });

  } catch (error) {
    AUDIT_RESULTS.testsFailed++;
    AUDIT_RESULTS.criticalIssues.push({
      test: 'Workflow Data Flow',
      error: error.message
    });
    console.log('❌ Test failed:', error.message);
  }
}

async function testAIClassificationFlow(page) {
  try {
    // Intercept AI classification API calls
    const apiCalls = [];

    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('/api/agents/classification')) {
        const postData = request.postData();
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          body: postData ? JSON.parse(postData) : null
        });
        console.log('📡 API Call intercepted:', request.url());
        console.log('📦 Request body:', postData);
      }
      request.continue();
    });

    // Fill product description - wait for it to exist
    await page.waitForSelector('textarea.form-input');
    await page.type('textarea.form-input',
      'High-pressure hydraulic pumps for industrial machinery');

    // Wait for component section to load
    await page.waitForTimeout(1000);

    // Fill first component (should already exist)
    const componentInputs = await page.$$('input.form-input[placeholder*="Polyester"]');
    if (componentInputs.length > 0) {
      await componentInputs[0].type('Cast steel pump housing');
    }

    // Select origin country
    const selects = await page.$$('select.form-select');
    if (selects.length > 0) {
      await page.evaluate(() => {
        const selects = document.querySelectorAll('select.form-select');
        for (let select of selects) {
          const option = Array.from(select.options).find(opt => opt.value === 'CN');
          if (option) {
            select.value = 'CN';
            break;
          }
        }
      });
    }

    // Fill percentage
    const numberInputs = await page.$$('input[type="number"]');
    if (numberInputs.length > 0) {
      await numberInputs[0].type('60');
    }

    // Click AI suggestion button - use actual button text
    const aiButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Get AI HS Code'));
    });

    if (aiButton) {
      await aiButton.asElement().click();
    }
    await page.waitForTimeout(3000);

    // Validate API call
    if (apiCalls.length === 0) {
      AUDIT_RESULTS.criticalIssues.push({
        test: 'AI Classification API Call',
        issue: 'No API call made',
        impact: 'CRITICAL - AI classification not working'
      });
      console.log('❌ No AI classification API call detected');
    } else {
      const apiCall = apiCalls[0];
      const { additionalContext } = apiCall.body;

      // Validate field mappings
      const fieldValidation = {
        companyName: additionalContext?.companyName || 'NOT PROVIDED',
        businessType: additionalContext?.businessType || 'NOT PROVIDED',
        tradeVolume: additionalContext?.tradeVolume || 'NOT PROVIDED',
        manufacturingLocation: additionalContext?.manufacturingLocation || 'NOT PROVIDED',
        exportDestination: additionalContext?.exportDestination || 'NOT PROVIDED',
        primarySupplier: additionalContext?.primarySupplier || 'NOT PROVIDED'
      };

      console.log('🔍 Field Validation:', fieldValidation);

      // Check for "Not provided" values
      const missingFields = Object.entries(fieldValidation)
        .filter(([key, value]) => value === 'NOT PROVIDED')
        .map(([key]) => key);

      if (missingFields.length > 0) {
        AUDIT_RESULTS.criticalIssues.push({
          test: 'AI Classification Context',
          issue: `Missing context fields: ${missingFields.join(', ')}`,
          impact: 'HIGH - AI will make generic classifications',
          fix: 'Check field name mapping in ComponentOriginsStepEnhanced.js'
        });
        console.log(`❌ Missing AI context: ${missingFields.join(', ')}`);
      } else {
        AUDIT_RESULTS.testsPassed++;
        console.log('✅ All context fields provided to AI');
      }
    }

  } catch (error) {
    AUDIT_RESULTS.testsFailed++;
    console.log('❌ Test failed:', error.message);
  }
}

async function testEnrichmentFlow(page) {
  try {
    // Wait for AI response
    await page.waitForSelector('.agent-suggestion-badge', { timeout: 10000 });

    // Check if enrichment data is displayed
    const enrichmentData = await page.evaluate(() => {
      const badge = document.querySelector('.agent-suggestion-badge');
      if (!badge) return null;

      return {
        visible: true,
        hasHSCode: badge.textContent.includes('HS Code'),
        hasConfidence: badge.textContent.includes('%'),
        hasTariffRates: badge.textContent.includes('MFN') || badge.textContent.includes('USMCA')
      };
    });

    if (!enrichmentData) {
      AUDIT_RESULTS.criticalIssues.push({
        test: 'Component Enrichment Display',
        issue: 'Enrichment data not displayed',
        impact: 'HIGH - User cannot see AI classification results'
      });
      console.log('❌ Enrichment data not displayed');
    } else if (!enrichmentData.hasHSCode || !enrichmentData.hasConfidence) {
      AUDIT_RESULTS.warnings.push({
        test: 'Component Enrichment Completeness',
        issue: 'Enrichment data incomplete',
        details: enrichmentData
      });
      console.log('⚠️  Enrichment data incomplete:', enrichmentData);
    } else {
      AUDIT_RESULTS.testsPassed++;
      console.log('✅ Enrichment data displayed correctly');
    }

  } catch (error) {
    AUDIT_RESULTS.testsFailed++;
    console.log('❌ Test failed:', error.message);
  }
}

function generateReport() {
  console.log('\n\n========================================');
  console.log('📊 RUNTIME AUDIT REPORT');
  console.log('========================================\n');

  console.log(`✅ Tests Passed: ${AUDIT_RESULTS.testsPassed}`);
  console.log(`❌ Tests Failed: ${AUDIT_RESULTS.testsFailed}`);
  console.log(`🚨 Critical Issues: ${AUDIT_RESULTS.criticalIssues.length}`);
  console.log(`⚠️  Warnings: ${AUDIT_RESULTS.warnings.length}\n`);

  if (AUDIT_RESULTS.criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:\n');
    AUDIT_RESULTS.criticalIssues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.test}`);
      console.log(`   Issue: ${issue.issue}`);
      console.log(`   Impact: ${issue.impact}`);
      if (issue.fix) console.log(`   Fix: ${issue.fix}`);
      console.log('');
    });
  }

  if (AUDIT_RESULTS.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    AUDIT_RESULTS.warnings.forEach((warning, i) => {
      console.log(`${i + 1}. ${warning.test}`);
      console.log(`   Issue: ${warning.issue}`);
      console.log('');
    });
  }

  // Save to file
  fs.writeFileSync(
    './RUNTIME-AUDIT-REPORT.json',
    JSON.stringify(AUDIT_RESULTS, null, 2)
  );

  console.log('📄 Full report saved to: RUNTIME-AUDIT-REPORT.json\n');

  // Exit with error code if critical issues found
  if (AUDIT_RESULTS.criticalIssues.length > 0) {
    process.exit(1);
  }
}

// Run audit
runAudit().catch(error => {
  console.error('❌ Audit failed:', error);
  process.exit(1);
});
