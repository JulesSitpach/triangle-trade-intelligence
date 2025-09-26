/**
 * Comprehensive UI Testing Suite for Triangle Intelligence Dashboards
 * Tests all critical UI components, routing, and functionality using Puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

class DashboardUITester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:3000';
    this.screenshotDir = path.join(__dirname, 'screenshots');
    this.testResults = [];
  }

  async initialize() {
    // Ensure screenshot directory exists
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }

    // Launch browser with comprehensive options
    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: 50,
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();

    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`❌ Browser Console Error: ${msg.text()}`);
      }
    });

    // Set up error handling
    this.page.on('pageerror', error => {
      console.error(`❌ Page Error: ${error.message}`);
    });

    console.log('✅ Puppeteer initialized successfully');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
  }

  async takeScreenshot(name, fullPage = true) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${timestamp}.png`;
    const filepath = path.join(this.screenshotDir, filename);

    await this.page.screenshot({
      path: filepath,
      fullPage: fullPage
    });

    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }

  async login() {
    console.log('🔐 Testing login functionality...');

    await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2' });

    // Take screenshot of login page
    await this.takeScreenshot('01-login-page');

    // Check if login form exists
    const loginForm = await this.page.$('form');
    if (!loginForm) {
      throw new Error('Login form not found');
    }

    // Fill login form (assuming email/password fields)
    await this.page.type('input[type="email"], input[name="email"]', 'admin@triangle.com');
    await this.page.type('input[type="password"], input[name="password"]', 'admin123');

    // Submit form
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle2' }),
      this.page.click('button[type="submit"], input[type="submit"]')
    ]);

    await this.takeScreenshot('02-post-login');
    console.log('✅ Login test completed');
  }

  async testBrokerDashboard() {
    console.log('🔍 Testing Broker Dashboard UI...');

    await this.page.goto(`${this.baseUrl}/admin/broker-dashboard`, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(2000);

    await this.takeScreenshot('03-broker-dashboard-main');

    // Test dashboard header
    const dashboardTitle = await this.page.$('.dashboard-title');
    if (!dashboardTitle) {
      throw new Error('Dashboard title not found');
    }

    // Test metrics cards
    const metricCards = await this.page.$$('.metric-card');
    if (metricCards.length === 0) {
      throw new Error('No metric cards found');
    }
    console.log(`📊 Found ${metricCards.length} metric cards`);

    // Test tab navigation
    const tabButtons = await this.page.$$('.tab-button');
    console.log(`📋 Found ${tabButtons.length} tab buttons`);

    for (let i = 0; i < tabButtons.length; i++) {
      const tab = tabButtons[i];
      const tabText = await this.page.evaluate(el => el.textContent, tab);
      console.log(`🔄 Testing tab: ${tabText.trim()}`);

      await tab.click();
      await this.page.waitForTimeout(1000);

      // Take screenshot of each tab
      const tabName = tabText.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      await this.takeScreenshot(`04-broker-tab-${i}-${tabName}`);

      // Check for tab content
      const tabContent = await this.page.$('.tab-content');
      if (!tabContent) {
        console.warn(`⚠️ No content found for tab: ${tabText}`);
      }
    }

    console.log('✅ Broker dashboard test completed');
  }

  async testHSClassificationTab() {
    console.log('🏷️ Testing HS Classification Tab functionality...');

    // Navigate to HS Classification tab
    await this.page.click('button:contains("HS Classification"), [data-tab="hs-classification"]');
    await this.page.waitForTimeout(2000);

    await this.takeScreenshot('05-hs-classification-tab');

    // Test table functionality
    const table = await this.page.$('.admin-table');
    if (table) {
      const rows = await this.page.$$('.admin-table tbody tr');
      console.log(`📊 Found ${rows.length} classification requests`);

      // Test action buttons if any data exists
      if (rows.length > 1) { // More than just empty state
        const actionButton = await this.page.$('.btn-action.btn-primary');
        if (actionButton) {
          await actionButton.click();
          await this.page.waitForTimeout(1000);

          // Take screenshot of modal if opened
          const modal = await this.page.$('.workflow-modal-overlay');
          if (modal) {
            await this.takeScreenshot('06-hs-classification-modal');

            // Test form elements in modal
            await this.testModalFormElements();

            // Close modal
            const closeButton = await this.page.$('.workflow-modal-close');
            if (closeButton) {
              await closeButton.click();
              await this.page.waitForTimeout(500);
            }
          }
        }
      }
    } else {
      console.warn('⚠️ HS Classification table not found');
    }

    console.log('✅ HS Classification tab test completed');
  }

  async testModalFormElements() {
    console.log('📝 Testing modal form elements...');

    // Test form inputs
    const textInputs = await this.page.$$('input[type="text"], textarea');
    console.log(`📝 Found ${textInputs.length} form inputs`);

    // Test each input field
    for (let i = 0; i < Math.min(textInputs.length, 3); i++) {
      const input = textInputs[i];
      await input.click();
      await input.type('Test input data');
      await this.page.waitForTimeout(500);
    }

    // Take screenshot of filled form
    await this.takeScreenshot('07-modal-form-filled');

    // Test navigation buttons
    const nextButton = await this.page.$('button:contains("Next"), .btn-primary');
    if (nextButton) {
      await nextButton.click();
      await this.page.waitForTimeout(1000);
      await this.takeScreenshot('08-modal-next-stage');
    }

    console.log('✅ Modal form test completed');
  }

  async testResponsiveDesign() {
    console.log('📱 Testing responsive design...');

    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      console.log(`🔄 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);

      await this.page.setViewport(viewport);
      await this.page.waitForTimeout(1000);

      await this.takeScreenshot(`09-responsive-${viewport.name}`, true);

      // Test navigation menu on mobile
      if (viewport.name === 'mobile') {
        const mobileMenu = await this.page.$('.mobile-menu-toggle, .hamburger-menu');
        if (mobileMenu) {
          await mobileMenu.click();
          await this.page.waitForTimeout(500);
          await this.takeScreenshot('10-mobile-menu');
        }
      }
    }

    // Reset to desktop viewport
    await this.page.setViewport({ width: 1920, height: 1080 });

    console.log('✅ Responsive design test completed');
  }

  async testPerformance() {
    console.log('⚡ Testing performance metrics...');

    // Enable performance monitoring
    await this.page.tracing.start({ screenshots: true, path: 'trace.json' });

    // Navigate to dashboard
    await this.page.goto(`${this.baseUrl}/admin/broker-dashboard`, { waitUntil: 'networkidle2' });

    // Get performance metrics
    const performanceMetrics = await this.page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        ttfb: perfData.responseStart - perfData.requestStart
      };
    });

    await this.page.tracing.stop();

    console.log('📊 Performance Metrics:', performanceMetrics);

    // Check for console errors
    const consoleLogs = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });

    if (consoleLogs.length > 0) {
      console.warn('⚠️ Console errors detected:', consoleLogs);
    }

    console.log('✅ Performance test completed');
  }

  async testAccessibility() {
    console.log('♿ Testing accessibility...');

    // Basic accessibility checks
    const accessibilityIssues = await this.page.evaluate(() => {
      const issues = [];

      // Check for missing alt text
      const images = document.querySelectorAll('img:not([alt])');
      if (images.length > 0) {
        issues.push(`${images.length} images missing alt text`);
      }

      // Check for missing form labels
      const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
      const inputsWithoutLabels = Array.from(inputs).filter(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        return !label && !input.closest('label');
      });

      if (inputsWithoutLabels.length > 0) {
        issues.push(`${inputsWithoutLabels.length} form inputs missing labels`);
      }

      // Check for heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (headings.length === 0) {
        issues.push('No headings found');
      }

      return issues;
    });

    if (accessibilityIssues.length > 0) {
      console.warn('⚠️ Accessibility issues:', accessibilityIssues);
    } else {
      console.log('✅ No major accessibility issues found');
    }

    console.log('✅ Accessibility test completed');
  }

  async generateReport() {
    console.log('📊 Generating test report...');

    const report = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      summary: {
        totalTests: this.testResults.length,
        passed: this.testResults.filter(t => t.passed).length,
        failed: this.testResults.filter(t => !t.passed).length
      }
    };

    const reportPath = path.join(this.screenshotDir, 'test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 Test report generated: ${reportPath}`);
    console.log(`✅ Tests passed: ${report.summary.passed}/${report.summary.totalTests}`);

    return report;
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive UI testing suite...');

    try {
      await this.initialize();

      // Run all tests
      await this.login();
      await this.testBrokerDashboard();
      await this.testHSClassificationTab();
      await this.testResponsiveDesign();
      await this.testPerformance();
      await this.testAccessibility();

      // Generate final report
      await this.generateReport();

      console.log('🎉 All tests completed successfully!');

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      await this.takeScreenshot('error-state');
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
if (require.main === module) {
  const tester = new DashboardUITester();
  tester.runAllTests()
    .then(() => {
      console.log('✅ Test execution completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = DashboardUITester;