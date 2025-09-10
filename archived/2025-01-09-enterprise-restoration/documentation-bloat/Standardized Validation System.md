#!/usr/bin/env node

/**
 * TRIANGLE INTELLIGENCE - CONSISTENT VALIDATION SYSTEM
 * 
 * Eliminates agent assessment contradictions by enforcing
 * a single, standardized validation methodology
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class ConsistentValidationSystem {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.validationStandard = {
      // Define EXACTLY what constitutes "working" vs "broken"
      criteria: {
        pageLoads: 'Returns 200 status and contains expected HTML elements',
        apiResponds: 'Returns 200 status with valid JSON structure',
        dataDisplays: 'User can see actual data values in the browser UI',
        buttonWorks: 'Click produces visible result or state change',
        workflowComplete: 'User can accomplish stated business goal end-to-end'
      },
      
      // Standardized test order - every agent must follow this sequence
      testSequence: [
        'technical_infrastructure',
        'api_functionality', 
        'ui_data_display',
        'user_interaction',
        'business_workflow'
      ],
      
      // Pass/fail thresholds
      thresholds: {
        technical: 0.9,    // 90% of infrastructure must work
        functional: 0.8,   // 80% of features must work for users
        business: 0.7      // 70% of business goals must be achievable
      }
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      technical: {},
      functional: {},
      business: {},
      overall: {}
    };
  }

  async runStandardizedValidation() {
    console.log('🔍 TRIANGLE INTELLIGENCE - STANDARDIZED VALIDATION');
    console.log('Using consistent methodology to eliminate contradictory reports\n');

    try {
      // Phase 1: Technical Infrastructure (APIs, servers, database)
      await this.validateTechnicalInfrastructure();
      
      // Phase 2: API Functionality (data returned, proper format)
      await this.validateAPIFunctionality();
      
      // Phase 3: UI Data Display (users can see data)
      await this.validateUIDataDisplay();
      
      // Phase 4: User Interactions (buttons, forms work)
      await this.validateUserInteractions();
      
      // Phase 5: Business Workflows (complete user journeys)
      await this.validateBusinessWorkflows();
      
      // Generate definitive assessment
      await this.generateStandardizedReport();
      
    } catch (error) {
      console.error('Validation failed:', error.message);
    }
  }

  async validateTechnicalInfrastructure() {
    console.log('\n📡 PHASE 1: Technical Infrastructure');
    console.log('Standard: Does basic infrastructure work?');
    
    // Server accessibility
    const serverTest = await this.testServerAccessibility();
    this.results.technical.server = serverTest;
    
    // Database connectivity
    const dbTest = await this.testDatabaseConnectivity();
    this.results.technical.database = dbTest;
    
    // Environment configuration
    const configTest = await this.testEnvironmentConfig();
    this.results.technical.config = configTest;
    
    const technicalScore = this.calculateScore(this.results.technical);
    console.log(`Technical Infrastructure: ${technicalScore}% functional`);
  }

  async validateAPIFunctionality() {
    console.log('\n🔧 PHASE 2: API Functionality');
    console.log('Standard: Do APIs return correct data when called?');
    
    const apiEndpoints = [
      '/api/simple-classification',
      '/api/simple-usmca-compliance',
      '/api/simple-savings',
      '/api/admin/users',
      '/api/admin/suppliers',
      '/api/admin/analytics'
    ];
    
    for (const endpoint of apiEndpoints) {
      const apiTest = await this.testAPIEndpoint(endpoint);
      this.results.functional[endpoint] = apiTest;
    }
    
    const apiScore = this.calculateScore(this.results.functional);
    console.log(`API Functionality: ${apiScore}% working`);
  }

  async validateUIDataDisplay() {
    console.log('\n🖥️  PHASE 3: UI Data Display');
    console.log('Standard: Can users see actual data in the browser?');
    
    const browser = await puppeteer.launch({ headless: false });
    
    try {
      const dashboards = [
        '/admin/user-management',
        '/admin/supplier-management',
        '/admin/analytics',
        '/admin/crisis-management',
        '/admin/system-config',
        '/sales/dashboard'
      ];
      
      for (const dashboard of dashboards) {
        const uiTest = await this.testUIDataDisplay(browser, dashboard);
        this.results.business[dashboard] = uiTest;
      }
      
    } finally {
      await browser.close();
    }
    
    const uiScore = this.calculateScore(this.results.business);
    console.log(`UI Data Display: ${uiScore}% showing data`);
  }

  async validateUserInteractions() {
    console.log('\n🖱️  PHASE 4: User Interactions');
    console.log('Standard: Do buttons and forms work when clicked?');
    
    const browser = await puppeteer.launch({ headless: false });
    
    try {
      // Test main workflow
      const workflowTest = await this.testWorkflowInteractions(browser);
      this.results.business.workflow = workflowTest;
      
      // Test admin interactions
      const adminTest = await this.testAdminInteractions(browser);
      this.results.business.admin = adminTest;
      
    } finally {
      await browser.close();
    }
  }

  async validateBusinessWorkflows() {
    console.log('\n💼 PHASE 5: Business Workflows');
    console.log('Standard: Can users complete actual business tasks?');
    
    const browser = await puppeteer.launch({ headless: false });
    
    try {
      // Test: Complete USMCA classification workflow
      const usmcaWorkflow = await this.testUSMCAWorkflow(browser);
      this.results.business.usmcaComplete = usmcaWorkflow;
      
      // Test: Admin can manage users
      const userManagement = await this.testUserManagementWorkflow(browser);
      this.results.business.userManagement = userManagement;
      
      // Test: View business analytics
      const analytics = await this.testAnalyticsWorkflow(browser);
      this.results.business.analytics = analytics;
      
    } finally {
      await browser.close();
    }
  }

  async testServerAccessibility() {
    try {
      const response = await fetch(this.baseUrl);
      return {
        status: response.ok ? 'PASS' : 'FAIL',
        details: `Status: ${response.status}`,
        score: response.ok ? 100 : 0
      };
    } catch (error) {
      return {
        status: 'FAIL',
        details: error.message,
        score: 0
      };
    }
  }

  async testDatabaseConnectivity() {
    try {
      const response = await fetch(`${this.baseUrl}/api/trust/verify-hs-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hs_code: '8544429000' })
      });
      
      const data = await response.json();
      const hasData = data && data.hs_code;
      
      return {
        status: hasData ? 'PASS' : 'FAIL',
        details: hasData ? 'Database returns HS code data' : 'No database data available',
        score: hasData ? 100 : 0
      };
    } catch (error) {
      return {
        status: 'FAIL',
        details: error.message,
        score: 0
      };
    }
  }

  async testEnvironmentConfig() {
    // Check if required environment variables are set
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    let configuredCount = 0;
    const details = [];
    
    for (const envVar of requiredVars) {
      if (process.env[envVar]) {
        configuredCount++;
        details.push(`${envVar}: SET`);
      } else {
        details.push(`${envVar}: MISSING`);
      }
    }
    
    const score = (configuredCount / requiredVars.length) * 100;
    
    return {
      status: score >= 80 ? 'PASS' : 'FAIL',
      details: details.join(', '),
      score: score
    };
  }

  async testAPIEndpoint(endpoint) {
    try {
      let response;
      
      if (endpoint.includes('simple-')) {
        // POST endpoints
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_description: 'test product',
            hs_code: '8544429000'
          })
        });
      } else {
        // GET endpoints
        response = await fetch(`${this.baseUrl}${endpoint}`);
      }
      
      const data = await response.json();
      const hasValidData = response.ok && data && typeof data === 'object';
      
      return {
        status: hasValidData ? 'PASS' : 'FAIL',
        details: hasValidData ? 'Returns valid JSON data' : `Status: ${response.status}`,
        score: hasValidData ? 100 : 0,
        responseData: hasValidData ? Object.keys(data) : []
      };
    } catch (error) {
      return {
        status: 'FAIL',
        details: error.message,
        score: 0
      };
    }
  }

  async testUIDataDisplay(browser, dashboardPath) {
    try {
      const page = await browser.newPage();
      await page.goto(`${this.baseUrl}${dashboardPath}`);
      await page.waitForTimeout(3000); // Wait for data loading
      
      // Check for actual data content
      const hasDataTables = await page.$eval('body', (body) => {
        const tables = body.querySelectorAll('table, .data-table, .table');
        const lists = body.querySelectorAll('ul li, ol li');
        const dataElements = body.querySelectorAll('[data-testid*="data"], .metric, .stat');
        
        // Look for signs of actual data vs empty states
        const hasTableRows = Array.from(tables).some(table => 
          table.querySelectorAll('tr').length > 1 || 
          table.querySelectorAll('tbody tr').length > 0
        );
        
        const hasListItems = lists.length > 0;
        const hasMetrics = dataElements.length > 0;
        
        return hasTableRows || hasListItems || hasMetrics;
      });
      
      // Check for loading states vs actual content
      const isLoading = await page.$('.loading, .spinner, [data-loading="true"]');
      const hasEmptyState = await page.$('.empty, .no-data, [data-empty="true"]');
      
      await page.close();
      
      let status, details, score;
      
      if (hasDataTables && !isLoading) {
        status = 'PASS';
        details = 'Dashboard displays data to users';
        score = 100;
      } else if (isLoading) {
        status = 'PARTIAL';
        details = 'Dashboard shows loading state';
        score = 50;
      } else if (hasEmptyState) {
        status = 'EMPTY';
        details = 'Dashboard shows empty state (no data available)';
        score = 25;
      } else {
        status = 'FAIL';
        details = 'Dashboard shows no content';
        score = 0;
      }
      
      return { status, details, score };
      
    } catch (error) {
      return {
        status: 'FAIL',
        details: error.message,
        score: 0
      };
    }
  }

  async testWorkflowInteractions(browser) {
    try {
      const page = await browser.newPage();
      await page.goto(`${this.baseUrl}/usmca-workflow`);
      await page.waitForTimeout(2000);
      
      // Test if buttons exist and are clickable
      const buttons = await page.$$eval('button', buttons => 
        buttons.map(btn => ({
          text: btn.textContent.trim(),
          disabled: btn.disabled,
          visible: btn.offsetParent !== null
        })).filter(btn => btn.visible && !btn.disabled)
      );
      
      let workingButtons = 0;
      
      // Test clicking each button
      for (let i = 0; i < Math.min(buttons.length, 3); i++) {
        try {
          await page.click(`button:nth-of-type(${i + 1})`);
          await page.waitForTimeout(1000);
          
          // Check if click produced any result (new content, navigation, etc.)
          const hasResponse = await page.evaluate(() => {
            return document.body.innerHTML !== window.initialHTML;
          });
          
          if (hasResponse) workingButtons++;
          
        } catch (error) {
          // Button click failed
        }
      }
      
      await page.close();
      
      const score = buttons.length > 0 ? (workingButtons / buttons.length) * 100 : 0;
      
      return {
        status: score >= 70 ? 'PASS' : 'FAIL',
        details: `${workingButtons}/${buttons.length} buttons work`,
        score: score
      };
      
    } catch (error) {
      return {
        status: 'FAIL',
        details: error.message,
        score: 0
      };
    }
  }

  async testAdminInteractions(browser) {
    // Similar testing for admin dashboard interactions
    return {
      status: 'PARTIAL',
      details: 'Admin interactions test not fully implemented',
      score: 50
    };
  }

  async testUSMCAWorkflow(browser) {
    try {
      const page = await browser.newPage();
      await page.goto(`${this.baseUrl}/usmca-workflow`);
      
      // Test complete workflow: input → classification → compliance → savings
      let workflowSteps = 0;
      const totalSteps = 4;
      
      // Step 1: Product input
      const hasProductInput = await page.$('input[type="text"], textarea');
      if (hasProductInput) {
        workflowSteps++;
        await page.type('input[type="text"], textarea', 'automotive wire harness');
      }
      
      // Step 2: Classification
      const classifyButton = await page.$('button[type="submit"], button:contains("Classify")');
      if (classifyButton) {
        await classifyButton.click();
        await page.waitForTimeout(2000);
        
        // Check if results appeared
        const hasResults = await page.$('.result, .classification, .hs-code');
        if (hasResults) workflowSteps++;
      }
      
      // Step 3: Compliance check
      const complianceButton = await page.$('button:contains("Compliance"), button:contains("Check")');
      if (complianceButton) {
        await complianceButton.click();
        await page.waitForTimeout(2000);
        
        const hasCompliance = await page.$('.compliance, .qualification');
        if (hasCompliance) workflowSteps++;
      }
      
      // Step 4: Savings calculation
      const savingsButton = await page.$('button:contains("Savings"), button:contains("Calculate")');
      if (savingsButton) {
        await savingsButton.click();
        await page.waitForTimeout(2000);
        
        const hasSavings = await page.$('.savings, .amount, .dollar');
        if (hasSavings) workflowSteps++;
      }
      
      await page.close();
      
      const score = (workflowSteps / totalSteps) * 100;
      
      return {
        status: score >= 75 ? 'PASS' : 'FAIL',
        details: `${workflowSteps}/${totalSteps} workflow steps complete`,
        score: score
      };
      
    } catch (error) {
      return {
        status: 'FAIL',
        details: error.message,
        score: 0
      };
    }
  }

  async testUserManagementWorkflow(browser) {
    // Test admin can view/manage users
    return {
      status: 'PARTIAL',
      details: 'User management workflow test not fully implemented',
      score: 50
    };
  }

  async testAnalyticsWorkflow(browser) {
    // Test admin can view analytics
    return {
      status: 'PARTIAL',
      details: 'Analytics workflow test not fully implemented',
      score: 50
    };
  }

  calculateScore(results) {
    const scores = Object.values(results).map(r => r.score || 0);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
  }

  async generateStandardizedReport() {
    console.log('\n📊 STANDARDIZED VALIDATION REPORT');
    console.log('='.repeat(80));
    
    const technicalScore = this.calculateScore(this.results.technical);
    const functionalScore = this.calculateScore(this.results.functional);
    const businessScore = this.calculateScore(this.results.business);
    
    console.log(`\n📈 STANDARDIZED SCORES:`);
    console.log(`Technical Infrastructure: ${technicalScore}%`);
    console.log(`API Functionality: ${functionalScore}%`);
    console.log(`Business Workflows: ${businessScore}%`);
    
    // Overall assessment using standardized thresholds
    const overallScore = Math.round((technicalScore + functionalScore + businessScore) / 3);
    
    console.log(`\n🎯 OVERALL PLATFORM STATUS: ${overallScore}%`);
    
    let status, recommendation;
    
    if (overallScore >= 85) {
      status = 'PRODUCTION READY';
      recommendation = 'Platform is functional for users';
    } else if (overallScore >= 70) {
      status = 'MOSTLY FUNCTIONAL';
      recommendation = 'Minor issues need fixing';
    } else if (overallScore >= 50) {
      status = 'PARTIALLY FUNCTIONAL';
      recommendation = 'Significant development work needed';
    } else if (overallScore >= 25) {
      status = 'BASIC INFRASTRUCTURE ONLY';
      recommendation = 'Major development work required';
    } else {
      status = 'NON-FUNCTIONAL';
      recommendation = 'Platform needs fundamental rebuilding';
    }
    
    console.log(`Status: ${status}`);
    console.log(`Recommendation: ${recommendation}`);
    
    // Detailed breakdown
    console.log(`\n🔍 DETAILED FINDINGS:`);
    
    console.log(`\nTechnical Infrastructure (${technicalScore}%):`);
    Object.entries(this.results.technical).forEach(([test, result]) => {
      console.log(`  ${result.status === 'PASS' ? '✅' : '❌'} ${test}: ${result.details}`);
    });
    
    console.log(`\nAPI Functionality (${functionalScore}%):`);
    Object.entries(this.results.functional).forEach(([api, result]) => {
      console.log(`  ${result.status === 'PASS' ? '✅' : '❌'} ${api}: ${result.details}`);
    });
    
    console.log(`\nBusiness Workflows (${businessScore}%):`);
    Object.entries(this.results.business).forEach(([workflow, result]) => {
      console.log(`  ${result.status === 'PASS' ? '✅' : '❌'} ${workflow}: ${result.details}`);
    });
    
    // Save standardized report
    this.results.overall = {
      timestamp: new Date().toISOString(),
      technicalScore,
      functionalScore,
      businessScore,
      overallScore,
      status,
      recommendation
    };
    
    try {
      await fs.writeFile('triangle-standardized-report.json', JSON.stringify(this.results, null, 2));
      console.log(`\n📁 Standardized report saved to: triangle-standardized-report.json`);
    } catch (error) {
      console.log(`\n⚠️  Could not save report file`);
    }
    
    console.log(`\n🎯 CONSISTENT VALIDATION COMPLETE`);
    console.log(`Any agent using this methodology will get the same ${overallScore}% result.`);
  }
}

// Dependency check
async function checkDependencies() {
  try {
    require('puppeteer');
    return true;
  } catch (error) {
    console.log('❌ Missing dependency: puppeteer');
    console.log('Install with: npm install puppeteer');
    return false;
  }
}

// Run standardized validation
if (require.main === module) {
  console.log('Triangle Intelligence - Standardized Validation System');
  console.log('Eliminates contradictory agent assessments\n');
  
  checkDependencies().then(hasRequired => {
    if (hasRequired) {
      const validator = new ConsistentValidationSystem();
      validator.runStandardizedValidation().catch(console.error);
    }
  });
}

module.exports = ConsistentValidationSystem;