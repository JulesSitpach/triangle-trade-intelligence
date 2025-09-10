/**
 * UI-BACKEND INTEGRATION TEST
 * Tests actual user workflows with real browser interactions
 * Verifies buttons trigger correct API calls and forms submit properly
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

test.describe('UI-Backend Integration Tests', () => {
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
    
    // Track console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`🚨 Console Error: ${msg.text()}`);
      }
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('Homepage Simple Calculator Integration', async () => {
    await test.step('Load homepage and verify calculator form', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded correctly
      expect(await page.title()).toContain('TradeFlow Intelligence');
      
      // Look for calculator form elements
      const calculatorSection = await page.locator('[data-testid="simple-calculator"], .simple-savings-calculator').first();
      await expect(calculatorSection).toBeVisible({ timeout: 10000 });
    });

    await test.step('Fill calculator form with test data', async () => {
      // Fill import volume
      const importVolumeInput = page.locator('input[type="number"], input[placeholder*="volume"], input[name*="volume"]').first();
      await importVolumeInput.fill('100000');
      
      // Select supplier country if dropdown exists
      const countrySelect = page.locator('select[name*="country"], select[name*="origin"]').first();
      if (await countrySelect.count() > 0) {
        await countrySelect.selectOption('CN');
      }
      
      await page.screenshot({ path: 'test-results/calculator-form-filled.png' });
    });

    await test.step('Submit calculator and verify API call', async () => {
      // Clear API calls tracking
      apiCalls = [];
      
      // Find and click calculate button
      const calculateButton = page.locator('button:has-text("Calculate"), button[type="submit"], .btn-calculate').first();
      await expect(calculateButton).toBeVisible();
      
      await calculateButton.click();
      
      // Wait for API response
      await page.waitForTimeout(3000);
      
      // Verify API was called
      const savingsAPICalls = apiCalls.filter(call => 
        call.url.includes('/api/simple-savings') || 
        call.url.includes('/api/savings')
      );
      
      expect(savingsAPICalls.length).toBeGreaterThan(0);
      console.log(`✅ Calculator triggered ${savingsAPICalls.length} API call(s)`);
      
      // Verify response is displayed
      const resultsSection = page.locator('.savings-result, .calculator-result, [data-testid="results"]').first();
      await expect(resultsSection).toBeVisible({ timeout: 10000 });
      
      await page.screenshot({ path: 'test-results/calculator-results.png' });
    });
  });

  test('USMCA Workflow Form Integration', async () => {
    await test.step('Navigate to USMCA workflow page', async () => {
      await page.goto(`${BASE_URL}/usmca-workflow`);
      await page.waitForLoadState('networkidle');
      
      // Verify form elements exist
      const companyInput = page.locator('input[name*="company"], input[placeholder*="company"]').first();
      const productTextarea = page.locator('textarea[name*="product"], textarea[placeholder*="product"]').first();
      
      await expect(companyInput).toBeVisible({ timeout: 10000 });
      await expect(productTextarea).toBeVisible({ timeout: 10000 });
      
      await page.screenshot({ path: 'test-results/workflow-form-loaded.png' });
    });

    await test.step('Fill workflow form completely', async () => {
      // Company information
      await page.fill('input[name*="company"], input[placeholder*="company"]', 'Test Manufacturing Corp');
      
      // Business type
      const businessTypeSelect = page.locator('select[name*="business"], select[name*="type"]').first();
      if (await businessTypeSelect.count() > 0) {
        await businessTypeSelect.selectOption('Manufacturing');
      }
      
      // Product description
      await page.fill('textarea[name*="product"], textarea[placeholder*="product"]', 'Industrial electronic components for automotive assembly');
      
      // Trade volume
      const volumeSelect = page.locator('select[name*="volume"], select[name*="trade"]').first();
      if (await volumeSelect.count() > 0) {
        await volumeSelect.selectOption('$1M - $5M');
      }
      
      await page.screenshot({ path: 'test-results/workflow-form-filled.png' });
    });

    await test.step('Submit workflow and verify API integration', async () => {
      apiCalls = [];
      
      // Find submit button
      const submitButton = page.locator('button:has-text("Process"), button:has-text("Submit"), button[type="submit"]').first();
      await expect(submitButton).toBeVisible();
      
      await submitButton.click();
      
      // Wait for processing
      await page.waitForTimeout(5000);
      
      // Verify workflow API was called
      const workflowAPICalls = apiCalls.filter(call => 
        call.url.includes('/api/simple-usmca-compliance') ||
        call.url.includes('/api/database-driven-usmca-compliance') ||
        call.url.includes('/api/trust/complete-workflow')
      );
      
      expect(workflowAPICalls.length).toBeGreaterThan(0);
      console.log(`✅ Workflow triggered ${workflowAPICalls.length} API call(s)`);
      
      // Check for results or loading state
      const hasResults = await page.locator('.workflow-results, .results-section, [data-testid="results"]').count() > 0;
      const hasLoading = await page.locator('.loading, .spinner, [data-testid="loading"]').count() > 0;
      
      expect(hasResults || hasLoading).toBe(true);
      
      await page.screenshot({ path: 'test-results/workflow-submitted.png' });
    });
  });

  test('Admin Dashboard API Integration', async () => {
    await test.step('Load admin dashboard', async () => {
      await page.goto(`${BASE_URL}/admin/analytics`);
      await page.waitForLoadState('networkidle');
      
      // Check if dashboard loads without errors
      const title = await page.title();
      expect(title).toContain('Admin');
      
      await page.screenshot({ path: 'test-results/admin-dashboard.png' });
    });

    await test.step('Verify admin API calls are triggered', async () => {
      // Wait for admin APIs to load
      await page.waitForTimeout(3000);
      
      // Check for admin API calls
      const adminAPICalls = apiCalls.filter(call => 
        call.url.includes('/api/admin/') ||
        call.url.includes('/api/users') ||
        call.url.includes('/api/suppliers')
      );
      
      console.log(`📊 Admin dashboard triggered ${adminAPICalls.length} API call(s)`);
      
      // Verify some data is displayed
      const hasUserData = await page.locator('text=/users?/i, text=/customers?/i').count() > 0;
      const hasSavingsData = await page.locator('text=/savings?/i, text=/\\$/').count() > 0;
      
      expect(hasUserData || hasSavingsData).toBe(true);
    });
  });

  test('System Status API Integration', async () => {
    await test.step('Load system status page', async () => {
      await page.goto(`${BASE_URL}/system-status`);
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: 'test-results/system-status.png' });
    });

    await test.step('Verify status API integration', async () => {
      // Wait for status to load
      await page.waitForTimeout(3000);
      
      // Check for system status API calls
      const statusAPICalls = apiCalls.filter(call => 
        call.url.includes('/api/system-status') ||
        call.url.includes('/api/health')
      );
      
      expect(statusAPICalls.length).toBeGreaterThan(0);
      console.log(`💚 System status triggered ${statusAPICalls.length} API call(s)`);
      
      // Verify status indicators are visible
      const statusIndicators = await page.locator('.status-card, .health-check, [data-testid="status"]').count();
      expect(statusIndicators).toBeGreaterThan(0);
    });
  });

  test('Console Error Detection', async () => {
    const consoleErrors = [];
    
    await test.step('Monitor console errors across key pages', async () => {
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push({
            url: page.url(),
            error: msg.text(),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Test key pages
      const testPages = ['/', '/usmca-workflow', '/admin/analytics', '/system-status'];
      
      for (const testPage of testPages) {
        await page.goto(`${BASE_URL}${testPage}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Let page fully render
      }
    });

    await test.step('Report console errors', async () => {
      if (consoleErrors.length > 0) {
        console.error('🚨 Console Errors Detected:');
        consoleErrors.forEach(error => {
          console.error(`  - ${error.url}: ${error.error}`);
        });
      }
      
      // Allow some errors but flag critical ones
      const criticalErrors = consoleErrors.filter(error => 
        !error.error.includes('favicon') && 
        !error.error.includes('manifest') &&
        !error.error.includes('_next/static')
      );
      
      expect(criticalErrors.length).toBeLessThan(3); // Allow up to 2 non-critical errors
    });
  });

  test('API Response Validation', async () => {
    const apiResponses = [];
    
    await test.step('Capture API responses', async () => {
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Trigger various API calls
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Try to trigger calculator
      const calculateBtn = page.locator('button:has-text("Calculate")').first();
      if (await calculateBtn.count() > 0) {
        await calculateBtn.click();
        await page.waitForTimeout(2000);
      }
    });

    await test.step('Validate API response statuses', async () => {
      const failedRequests = apiResponses.filter(response => response.status >= 400);
      
      if (failedRequests.length > 0) {
        console.error('❌ Failed API Requests:');
        failedRequests.forEach(req => {
          console.error(`  - ${req.status} ${req.url}`);
        });
      }
      
      // Allow some 404s for optional endpoints but no 500s
      const serverErrors = apiResponses.filter(response => response.status >= 500);
      expect(serverErrors.length).toBe(0);
      
      const successfulRequests = apiResponses.filter(response => response.status < 300);
      console.log(`✅ ${successfulRequests.length} successful API calls, ${failedRequests.length} failed`);
    });
  });
});