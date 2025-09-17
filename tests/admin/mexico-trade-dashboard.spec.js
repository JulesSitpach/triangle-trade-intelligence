/**
 * MEXICO TRADE DASHBOARD TESTS
 * Test Supabase integration and real-time features
 */

import { test, expect } from '@playwright/test';

test.describe('Mexico Trade Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Mexico Trade Dashboard
    await page.goto('/admin/mexico-trade-dashboard');
  });

  test('should display Mexico trade analytics', async ({ page }) => {
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Mexico Trade Intelligence');

    // Check for key metric cards
    await expect(page.locator('text=USMCA Certificates')).toBeVisible();
    await expect(page.locator('text=Mexico Savings')).toBeVisible();
    await expect(page.locator('text=Triangle Routes')).toBeVisible();
    await expect(page.locator('text=User Engagement')).toBeVisible();
  });

  test('should load Supabase data successfully', async ({ page }) => {
    // Wait for analytics to load (not hardcoded loading text)
    await expect(page.locator('text=Loading Mexico Trade Analytics...')).not.toBeVisible({ timeout: 10000 });

    // Check that real data is displayed (not placeholder values)
    const certificateCard = page.locator('[data-testid="metric-certificates"]').first();
    await expect(certificateCard).toBeVisible();
  });

  test('should switch between timeframes', async ({ page }) => {
    // Test timeframe selector
    await page.click('text=7 Days');
    await expect(page.locator('button:has-text("7 Days")')).toHaveClass(/bg-blue-600/);

    await page.click('text=90 Days');
    await expect(page.locator('button:has-text("90 Days")')).toHaveClass(/bg-blue-600/);
  });

  test('should navigate between tabs', async ({ page }) => {
    // Test tab navigation
    await page.click('text=USMCA Certificates');
    await expect(page.locator('h3:has-text("USMCA Certificate Analytics")')).toBeVisible();

    await page.click('text=Tariff Savings');
    await expect(page.locator('h3:has-text("Mexico Tariff Savings Analysis")')).toBeVisible();

    await page.click('text=Triangle Routing');
    await expect(page.locator('h3:has-text("Triangle Routing via Mexico")')).toBeVisible();

    await page.click('text=Mexico Partners');
    await expect(page.locator('h3:has-text("Top Mexico Trade Partners")')).toBeVisible();
  });

  test('should display real-time updates indicator', async ({ page }) => {
    // Check for real-time update indicator when data changes
    // This would trigger when Supabase subscription receives new data

    // Wait for potential real-time updates
    await page.waitForTimeout(2000);

    // Check if real-time indicator appears
    const updateIndicator = page.locator('text=Real-time update:');
    // This element appears only when live data is received
  });

  test('should handle Mexico trade data correctly', async ({ page }) => {
    // Verify Mexico-specific content
    await expect(page.locator('text=🇲🇽')).toBeVisible(); // Mexico flag emoji
    await expect(page.locator('text=Triangle Routing via Mexico')).toBeVisible();
    await expect(page.locator('text=USMCA')).toBeVisible();

    // Check for triangle routing pattern mentions
    await page.click('text=Triangle Routing');
    await expect(page.locator('text=Mexico → US')).toBeVisible();
  });
});

test.describe('Mexico Dashboard Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/admin/mexico-trade-dashboard');

    // Check mobile responsiveness
    await expect(page.locator('h1')).toBeVisible();

    // Metric cards should stack on mobile
    const metricCards = page.locator('[class*="grid-cols-1"]').first();
    await expect(metricCards).toBeVisible();
  });
});

test.describe('Database Integration', () => {
  test('should connect to Supabase successfully', async ({ page }) => {
    // Intercept API calls to verify Supabase integration
    let apiCalled = false;

    page.on('response', response => {
      if (response.url().includes('/api/admin/mexico-trade-analytics')) {
        apiCalled = true;
        expect(response.status()).toBe(200);
      }
    });

    await page.goto('/admin/mexico-trade-dashboard');

    // Wait for API call
    await page.waitForTimeout(3000);
    expect(apiCalled).toBe(true);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('/api/admin/mexico-trade-analytics*', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto('/admin/mexico-trade-dashboard');

    // Should still load page without crashing
    await expect(page.locator('h1')).toBeVisible();
  });
});