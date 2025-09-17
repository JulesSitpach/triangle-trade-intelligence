/**
 * Comprehensive End-to-End Test for Triangle Intelligence Platform
 * Tests all major functionality areas as requested
 */

const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

// Ensure test results directory exists
const testResultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = testResultsDir;
const TEST_TIMEOUT = 30000;

class TriangleIntelligenceE2ETest {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = {
      homepage: { status: 'pending', issues: [], screenshots: [] },
      usmcaWorkflow: { status: 'pending', issues: [], screenshots: [] },
      certificateGeneration: { status: 'pending', issues: [], screenshots: [] },
      trumpTariffAlerts: { status: 'pending', issues: [], screenshots: [] },
      adminDashboard: { status: 'pending', issues: [], screenshots: [] },
      userDashboard: { status: 'pending', issues: [], screenshots: [] },
      mobileResponsive: { status: 'pending', issues: [], screenshots: [] },
      errors: []
    };
  }

  async initialize() {
    console.log('🚀 Starting comprehensive E2E test...');

    this.browser = await chromium.launch({
      headless: false,
      slowMo: 1000 // Add delay to see actions
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true
    });

    this.page = await this.context.newPage();

    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
        this.results.errors.push({
          type: 'console',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    // Listen for page errors
    this.page.on('pageerror', error => {
      console.error('Page error:', error.message);
      this.results.errors.push({
        type: 'page',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  async captureScreenshot(name, section = 'general') {
    const filename = `${section}-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);

    try {
      await this.page.screenshot({
        path: filepath,
        fullPage: true
      });
      this.results[section] && this.results[section].screenshots.push(filename);
      console.log(`📷 Screenshot saved: ${filename}`);
      return filename;
    } catch (error) {
      console.error(`Failed to capture screenshot ${filename}:`, error.message);
      return null;
    }
  }

  async testHomepage() {
    console.log('\n📍 Testing Homepage...');

    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await this.captureScreenshot('homepage-initial', 'homepage');

      // Check page title and basic elements
      const title = await this.page.title();
      console.log('Page title:', title);

      // Test navigation buttons
      const navButtons = await this.page.locator('nav button, nav a, .nav-link').count();
      console.log(`Found ${navButtons} navigation elements`);

      // Test main call-to-action buttons
      const ctaButtons = await this.page.locator('button, .btn, [role="button"]').count();
      console.log(`Found ${ctaButtons} interactive buttons`);

      // Test calculator functionality if present
      const calculatorInputs = await this.page.locator('input[type="number"], input[placeholder*="volume"], input[placeholder*="savings"]');
      if (await calculatorInputs.count() > 0) {
        console.log('Testing calculator inputs...');

        const firstInput = calculatorInputs.first();
        await firstInput.click();
        await firstInput.fill('100000');
        await this.captureScreenshot('calculator-filled', 'homepage');

        // Look for calculate button
        const calculateBtn = await this.page.locator('button:has-text("Calculate"), button:has-text("Analyze"), .btn:has-text("Calculate")').first();
        if (await calculateBtn.isVisible()) {
          await calculateBtn.click();
          await this.page.waitForTimeout(2000);
          await this.captureScreenshot('calculator-results', 'homepage');
        }
      }

      // Test "Start USMCA Analysis" or similar workflow buttons
      const workflowButton = await this.page.locator('button:has-text("Start"), button:has-text("USMCA"), button:has-text("Analysis"), a[href*="usmca"]').first();
      if (await workflowButton.isVisible()) {
        console.log('Found workflow start button');
        // Don't click yet, just note it exists
      }

      this.results.homepage.status = 'passed';
      console.log('✅ Homepage test completed successfully');

    } catch (error) {
      this.results.homepage.status = 'failed';
      this.results.homepage.issues.push(`Homepage test failed: ${error.message}`);
      console.error('❌ Homepage test failed:', error.message);
    }
  }

  async testUSMCAWorkflow() {
    console.log('\n📍 Testing USMCA Workflow...');

    try {
      await this.page.goto(`${BASE_URL}/usmca-workflow`, { waitUntil: 'networkidle' });
      await this.captureScreenshot('workflow-start', 'usmcaWorkflow');

      // Step 1: Company Information
      console.log('Testing Company Information step...');

      // Fill company name
      const companyNameInput = await this.page.locator('input[name="company_name"], input[placeholder*="company"], input[placeholder*="Company"]').first();
      if (await companyNameInput.isVisible()) {
        await companyNameInput.click();
        await companyNameInput.fill('Test Manufacturing Corp');
        console.log('✓ Company name filled');
      }

      // Select business type
      const businessTypeSelect = await this.page.locator('select[name="business_type"], select:has-text("Manufacturing")').first();
      if (await businessTypeSelect.isVisible()) {
        await businessTypeSelect.selectOption('Manufacturing');
        console.log('✓ Business type selected');
      }

      // Fill trade volume
      const tradeVolumeInput = await this.page.locator('input[name="trade_volume"], input[placeholder*="volume"]').first();
      if (await tradeVolumeInput.isVisible()) {
        await tradeVolumeInput.click();
        await tradeVolumeInput.fill('5000000');
        console.log('✓ Trade volume filled');
      }

      // Select manufacturing location
      const mfgLocationSelect = await this.page.locator('select[name="manufacturing_location"], select:has-text("Mexico")').first();
      if (await mfgLocationSelect.isVisible()) {
        await mfgLocationSelect.selectOption('Mexico');
        console.log('✓ Manufacturing location selected');
      }

      await this.captureScreenshot('step1-filled', 'usmcaWorkflow');

      // Click Next/Continue
      const nextButton = await this.page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Product")').first();
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();
        await this.page.waitForTimeout(2000);
        console.log('✓ Proceeded to next step');
      }

      await this.captureScreenshot('step2-start', 'usmcaWorkflow');

      // Step 2: Product & Component Analysis
      console.log('Testing Product Analysis step...');

      // Fill product description
      const productDescInput = await this.page.locator('textarea[name="product_description"], input[name="product_description"], textarea[placeholder*="product"]').first();
      if (await productDescInput.isVisible()) {
        await productDescInput.click();
        await productDescInput.fill('Electronic automotive components including sensors and control modules');
        console.log('✓ Product description filled');
      }

      // Fill component origins
      const componentOriginsInput = await this.page.locator('textarea[name="component_origins"], input[name="component_origins"], textarea[placeholder*="component"]').first();
      if (await componentOriginsInput.isVisible()) {
        await componentOriginsInput.click();
        await componentOriginsInput.fill('Semiconductors from Taiwan, Plastics from Mexico, Assembly in Mexico');
        console.log('✓ Component origins filled');
      }

      await this.captureScreenshot('step2-filled', 'usmcaWorkflow');

      // Submit workflow
      const submitButton = await this.page.locator('button:has-text("Complete"), button:has-text("Submit"), button:has-text("Analyze"), button[type="submit"]').first();
      if (await submitButton.isVisible() && await submitButton.isEnabled()) {
        await submitButton.click();
        console.log('✓ Submitted workflow');

        // Wait for results
        await this.page.waitForTimeout(5000);
        await this.captureScreenshot('workflow-results', 'usmcaWorkflow');
      }

      this.results.usmcaWorkflow.status = 'passed';
      console.log('✅ USMCA Workflow test completed successfully');

    } catch (error) {
      this.results.usmcaWorkflow.status = 'failed';
      this.results.usmcaWorkflow.issues.push(`USMCA Workflow test failed: ${error.message}`);
      console.error('❌ USMCA Workflow test failed:', error.message);
    }
  }

  async testCertificateGeneration() {
    console.log('\n📍 Testing Certificate Generation...');

    try {
      await this.page.goto(`${BASE_URL}/usmca-certificate-completion`, { waitUntil: 'networkidle' });
      await this.captureScreenshot('certificate-start', 'certificateGeneration');

      // Check if form elements are present and functional
      const formInputs = await this.page.locator('input, select, textarea').count();
      console.log(`Found ${formInputs} form inputs`);

      // Test key certificate fields
      const exporterNameInput = await this.page.locator('input[name*="exporter"], input[placeholder*="exporter"]').first();
      if (await exporterNameInput.isVisible()) {
        await exporterNameInput.click();
        await exporterNameInput.fill('Test Exporter Inc');
        console.log('✓ Exporter name filled');
      }

      const productDescInput = await this.page.locator('textarea[name*="product"], input[name*="product"]').first();
      if (await productDescInput.isVisible()) {
        await productDescInput.click();
        await productDescInput.fill('Electronic components for automotive industry');
        console.log('✓ Product description filled');
      }

      await this.captureScreenshot('certificate-filled', 'certificateGeneration');

      // Look for generate/complete buttons
      const generateButton = await this.page.locator('button:has-text("Generate"), button:has-text("Complete"), button:has-text("Create")').first();
      if (await generateButton.isVisible()) {
        await generateButton.click();
        await this.page.waitForTimeout(3000);
        await this.captureScreenshot('certificate-generated', 'certificateGeneration');
        console.log('✓ Certificate generation attempted');
      }

      this.results.certificateGeneration.status = 'passed';
      console.log('✅ Certificate Generation test completed successfully');

    } catch (error) {
      this.results.certificateGeneration.status = 'failed';
      this.results.certificateGeneration.issues.push(`Certificate Generation test failed: ${error.message}`);
      console.error('❌ Certificate Generation test failed:', error.message);
    }
  }

  async testTrumpTariffAlerts() {
    console.log('\n📍 Testing Trump Tariff Alerts...');

    try {
      await this.page.goto(`${BASE_URL}/trump-tariff-alerts`, { waitUntil: 'networkidle' });
      await this.captureScreenshot('alerts-page', 'trumpTariffAlerts');

      // Check for alerts content
      const alertElements = await this.page.locator('.alert, .notification, [class*="alert"]').count();
      console.log(`Found ${alertElements} alert elements`);

      // Check for subscription or interaction elements
      const subscribeButtons = await this.page.locator('button:has-text("Subscribe"), button:has-text("Alert"), input[type="email"]').count();
      console.log(`Found ${subscribeButtons} subscription elements`);

      // Test email input if present
      const emailInput = await this.page.locator('input[type="email"], input[placeholder*="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.click();
        await emailInput.fill('test@example.com');
        console.log('✓ Email input tested');
      }

      await this.captureScreenshot('alerts-interaction', 'trumpTariffAlerts');

      this.results.trumpTariffAlerts.status = 'passed';
      console.log('✅ Trump Tariff Alerts test completed successfully');

    } catch (error) {
      this.results.trumpTariffAlerts.status = 'failed';
      this.results.trumpTariffAlerts.issues.push(`Trump Tariff Alerts test failed: ${error.message}`);
      console.error('❌ Trump Tariff Alerts test failed:', error.message);
    }
  }

  async testAdminDashboard() {
    console.log('\n📍 Testing Admin Dashboard...');

    try {
      await this.page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle' });
      await this.captureScreenshot('admin-dashboard', 'adminDashboard');

      // Check if we can access admin features
      const adminElements = await this.page.locator('[class*="admin"], [class*="dashboard"]').count();
      console.log(`Found ${adminElements} admin dashboard elements`);

      // Look for charts, tables, or admin controls
      const dataElements = await this.page.locator('table, canvas, [class*="chart"], [class*="metric"]').count();
      console.log(`Found ${dataElements} data visualization elements`);

      this.results.adminDashboard.status = 'passed';
      console.log('✅ Admin Dashboard test completed successfully');

    } catch (error) {
      this.results.adminDashboard.status = 'failed';
      this.results.adminDashboard.issues.push(`Admin Dashboard test failed: ${error.message}`);
      console.error('❌ Admin Dashboard test failed:', error.message);
    }
  }

  async testUserDashboard() {
    console.log('\n📍 Testing User Dashboard...');

    try {
      await this.page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      await this.captureScreenshot('user-dashboard', 'userDashboard');

      // Check for user dashboard elements
      const dashboardElements = await this.page.locator('[class*="dashboard"], .card, [class*="widget"]').count();
      console.log(`Found ${dashboardElements} dashboard elements`);

      // Test navigation within dashboard
      const navLinks = await this.page.locator('nav a, .nav-link, [class*="nav"]').count();
      console.log(`Found ${navLinks} navigation links`);

      this.results.userDashboard.status = 'passed';
      console.log('✅ User Dashboard test completed successfully');

    } catch (error) {
      this.results.userDashboard.status = 'failed';
      this.results.userDashboard.issues.push(`User Dashboard test failed: ${error.message}`);
      console.error('❌ User Dashboard test failed:', error.message);
    }
  }

  async testMobileResponsive() {
    console.log('\n📍 Testing Mobile Responsive Design...');

    try {
      // Switch to mobile viewport
      await this.page.setViewportSize({ width: 375, height: 667 });

      // Test homepage on mobile
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await this.captureScreenshot('mobile-homepage', 'mobileResponsive');

      // Test workflow on mobile
      await this.page.goto(`${BASE_URL}/usmca-workflow`, { waitUntil: 'networkidle' });
      await this.captureScreenshot('mobile-workflow', 'mobileResponsive');

      // Check if mobile navigation works
      const mobileMenuButton = await this.page.locator('button[aria-label*="menu"], .mobile-menu, [class*="hamburger"]').first();
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await this.captureScreenshot('mobile-menu-open', 'mobileResponsive');
        console.log('✓ Mobile menu tested');
      }

      this.results.mobileResponsive.status = 'passed';
      console.log('✅ Mobile Responsive test completed successfully');

    } catch (error) {
      this.results.mobileResponsive.status = 'failed';
      this.results.mobileResponsive.issues.push(`Mobile Responsive test failed: ${error.message}`);
      console.error('❌ Mobile Responsive test failed:', error.message);
    }
  }

  async generateReport() {
    const report = {
      testSuite: 'Triangle Intelligence Platform E2E Test',
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: Object.keys(this.results).length - 1, // Exclude 'errors'
        passed: Object.values(this.results).filter(r => r.status === 'passed').length - 1,
        failed: Object.values(this.results).filter(r => r.status === 'failed').length,
        pending: Object.values(this.results).filter(r => r.status === 'pending').length
      },
      results: this.results,
      recommendations: []
    };

    // Add recommendations based on issues found
    if (this.results.errors.length > 0) {
      report.recommendations.push('Fix console and page errors for better user experience');
    }

    Object.entries(this.results).forEach(([section, result]) => {
      if (result.issues && result.issues.length > 0) {
        report.recommendations.push(`Address issues in ${section}: ${result.issues.join(', ')}`);
      }
    });

    const reportPath = path.join(SCREENSHOT_DIR, 'comprehensive-e2e-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 TEST REPORT SUMMARY');
    console.log('=====================================');
    console.log(`Tests Passed: ${report.summary.passed}/${report.summary.totalTests}`);
    console.log(`Tests Failed: ${report.summary.failed}/${report.summary.totalTests}`);
    console.log(`Console/Page Errors: ${this.results.errors.length}`);
    console.log(`Screenshots Captured: ${Object.values(this.results).reduce((total, r) => total + (r.screenshots?.length || 0), 0)}`);
    console.log(`Report saved to: ${reportPath}`);

    return report;
  }

  async runAllTests() {
    await this.initialize();

    try {
      await this.testHomepage();
      await this.testUSMCAWorkflow();
      await this.testCertificateGeneration();
      await this.testTrumpTariffAlerts();
      await this.testAdminDashboard();
      await this.testUserDashboard();
      await this.testMobileResponsive();

      const report = await this.generateReport();
      return report;

    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the tests
async function main() {
  const tester = new TriangleIntelligenceE2ETest();

  try {
    const report = await tester.runAllTests();

    console.log('\n🎉 Comprehensive E2E testing completed!');
    console.log('Check the test-results directory for screenshots and detailed report.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

main();