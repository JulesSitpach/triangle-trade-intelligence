/**
 * ACCURATE UI-BACKEND INTEGRATION TEST
 * Based on actual UI structure discovered through browser screenshots
 * Tests real user workflows with correct selectors
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

test.describe('Accurate UI-Backend Integration Tests', () => {
  let context;
  let page;
  let apiCalls = [];

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Reset API calls tracking
    apiCalls = [];
    
    // Track network requests to verify API calls
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData(),
          timestamp: new Date().toISOString()
        });
        console.log(`🔗 API Call: ${request.method()} ${request.url()}`);
      }
    });
    
    // Track console errors (but allow favicon/manifest 404s)
    page.on('console', msg => {
      if (msg.type() === 'error' && 
          !msg.text().includes('favicon') && 
          !msg.text().includes('manifest')) {
        console.error(`🚨 Critical Console Error: ${msg.text()}`);
      }
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('Homepage Calculate Savings Button Integration', async () => {
    await test.step('Load homepage and verify button exists', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded correctly
      expect(await page.title()).toContain('TradeFlow Intelligence');
      
      // Look for the actual "Calculate Savings" button from screenshot
      const calculateSavingsButton = page.locator('button:has-text("Calculate Savings")');
      await expect(calculateSavingsButton).toBeVisible({ timeout: 10000 });
      
      await page.screenshot({ path: 'test-results/homepage-loaded-correctly.png' });
    });

    await test.step('Click Calculate Savings and verify functionality', async () => {
      // Clear API calls tracking
      apiCalls = [];
      
      // Click the Calculate Savings button
      const calculateSavingsButton = page.locator('button:has-text("Calculate Savings")');
      await calculateSavingsButton.click();
      
      // Wait for any modal or form to appear
      await page.waitForTimeout(2000);
      
      // Check if a calculator modal/form appears or if we navigate somewhere
      const hasModal = await page.locator('[role="dialog"], .modal, .calculator-modal').count() > 0;
      const urlChanged = page.url() !== BASE_URL + '/';
      
      expect(hasModal || urlChanged).toBe(true);
      
      await page.screenshot({ path: 'test-results/calculate-savings-clicked.png' });
    });
  });

  test('Start USMCA Analysis Button Integration', async () => {
    await test.step('Test Start USMCA Analysis button', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Clear API tracking
      apiCalls = [];
      
      // Look for "Start USMCA Analysis" button
      const startAnalysisButton = page.locator('button:has-text("Start USMCA Analysis")');
      await expect(startAnalysisButton).toBeVisible();
      
      await startAnalysisButton.click();
      await page.waitForTimeout(2000);
      
      // Should navigate to workflow page or trigger some action
      const urlAfterClick = page.url();
      const hasNavigated = urlAfterClick !== BASE_URL + '/';
      
      expect(hasNavigated).toBe(true);
      
      await page.screenshot({ path: 'test-results/start-analysis-clicked.png' });
    });
  });

  test('USMCA Workflow Page Real Structure', async () => {
    await test.step('Navigate to workflow and verify actual form structure', async () => {
      await page.goto(`${BASE_URL}/usmca-workflow`);
      await page.waitForLoadState('networkidle');
      
      // Verify we're on the workflow page
      expect(await page.locator('text="USMCA Compliance Analysis"').count()).toBeGreaterThan(0);
      
      // Check for the 3-step progress indicator from screenshot
      const progressSteps = await page.locator('text="Company Information"').count();
      expect(progressSteps).toBeGreaterThan(0);
      
      // Verify status cards are present (Government Records, System Uptime, etc.)
      const statusCards = await page.locator('text="Government Records", text="System Uptime", text="Licensed"').count();
      expect(statusCards).toBeGreaterThan(0);
      
      await page.screenshot({ path: 'test-results/workflow-actual-structure.png' });
    });

    await test.step('Check for real form fields in workflow', async () => {
      // Wait for any forms to load
      await page.waitForTimeout(3000);
      
      // Look for any input fields that might be present
      const inputFields = await page.locator('input').count();
      const selectFields = await page.locator('select').count();
      const textareaFields = await page.locator('textarea').count();
      
      console.log(`📊 Form Fields Found: ${inputFields} inputs, ${selectFields} selects, ${textareaFields} textareas`);
      
      // Take screenshot to see actual form structure
      await page.screenshot({ path: 'test-results/workflow-form-fields.png' });
      
      // If no fields are visible, check if we need to interact with something first
      if (inputFields === 0 && selectFields === 0 && textareaFields === 0) {
        // Maybe there's a "Start" button or similar
        const startButton = page.locator('button:has-text("Start"), button:has-text("Begin"), button:has-text("Continue")');
        if (await startButton.count() > 0) {
          await startButton.first().click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'test-results/workflow-after-start.png' });
        }
      }
    });
  });

  test('API Calls Verification Through Real UI', async () => {
    await test.step('Verify dropdown APIs are called on workflow page load', async () => {
      await page.goto(`${BASE_URL}/usmca-workflow`);
      await page.waitForLoadState('networkidle');
      
      // Wait for API calls to complete
      await page.waitForTimeout(3000);
      
      // Check if dropdown options API was called
      const dropdownAPICalls = apiCalls.filter(call => 
        call.url.includes('dropdown-options') || 
        call.url.includes('trust-metrics')
      );
      
      expect(dropdownAPICalls.length).toBeGreaterThan(0);
      console.log(`✅ Dropdown APIs triggered: ${dropdownAPICalls.length} calls`);
      
      dropdownAPICalls.forEach(call => {
        console.log(`  - ${call.method} ${call.url}`);
      });
    });

    await test.step('Test system status API integration', async () => {
      await page.goto(`${BASE_URL}/system-status`);
      await page.waitForLoadState('networkidle');
      
      // Wait for status to load
      await page.waitForTimeout(3000);
      
      // Verify system status API was called
      const statusAPICalls = apiCalls.filter(call => 
        call.url.includes('/api/system-status')
      );
      
      expect(statusAPICalls.length).toBeGreaterThan(0);
      console.log(`💚 System status API calls: ${statusAPICalls.length}`);
      
      await page.screenshot({ path: 'test-results/system-status-real.png' });
    });
  });

  test('Console Errors and Performance Monitoring', async () => {
    const criticalErrors = [];
    const performanceMetrics = [];
    
    await test.step('Monitor performance and errors across key pages', async () => {
      page.on('console', msg => {
        if (msg.type() === 'error' && 
            !msg.text().includes('favicon') && 
            !msg.text().includes('manifest') &&
            !msg.text().includes('_next/static')) {
          criticalErrors.push({
            url: page.url(),
            error: msg.text(),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      const testPages = [
        { url: '/', name: 'Homepage' },
        { url: '/usmca-workflow', name: 'Workflow' },
        { url: '/system-status', name: 'System Status' }
      ];
      
      for (const testPage of testPages) {
        console.log(`🔍 Testing page: ${testPage.name}`);
        
        const startTime = Date.now();
        await page.goto(`${BASE_URL}${testPage.url}`);
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        
        performanceMetrics.push({
          page: testPage.name,
          url: testPage.url,
          loadTime: loadTime,
          timestamp: new Date().toISOString()
        });
        
        console.log(`  ⏱️ ${testPage.name} loaded in ${loadTime}ms`);
        
        // Wait for full render
        await page.waitForTimeout(2000);
      }
    });

    await test.step('Report findings', async () => {
      console.log('\n📊 PERFORMANCE METRICS:');
      performanceMetrics.forEach(metric => {
        const status = metric.loadTime < 5000 ? '✅' : '⚠️';
        console.log(`${status} ${metric.page}: ${metric.loadTime}ms`);
      });
      
      if (criticalErrors.length > 0) {
        console.error('\n🚨 CRITICAL ERRORS DETECTED:');
        criticalErrors.forEach(error => {
          console.error(`  - ${error.url}: ${error.error}`);
        });
      } else {
        console.log('\n✅ NO CRITICAL CONSOLE ERRORS DETECTED');
      }
      
      // Expect reasonable performance and minimal errors
      const slowPages = performanceMetrics.filter(m => m.loadTime > 10000);
      expect(slowPages.length).toBeLessThan(2); // Allow 1 slow page
      expect(criticalErrors.length).toBeLessThan(3); // Allow up to 2 critical errors
    });
  });

  test('Complete User Journey Test', async () => {
    await test.step('Simulate real user workflow', async () => {
      // Start at homepage
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/journey-1-homepage.png' });
      
      // User clicks "Start USMCA Analysis"
      const startButton = page.locator('button:has-text("Start USMCA Analysis")');
      if (await startButton.count() > 0) {
        await startButton.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-results/journey-2-after-start.png' });
      }
      
      // Navigate to workflow manually if button didn't work
      if (!page.url().includes('workflow')) {
        await page.goto(`${BASE_URL}/usmca-workflow`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-results/journey-3-workflow-page.png' });
      }
      
      // Check system status
      await page.goto(`${BASE_URL}/system-status`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/journey-4-system-status.png' });
      
      // Verify APIs were called throughout journey
      const totalAPICalls = apiCalls.length;
      expect(totalAPICalls).toBeGreaterThan(0);
      
      console.log(`🎯 Complete user journey triggered ${totalAPICalls} API calls`);
      console.log('📸 Journey screenshots saved for review');
    });
  });
});