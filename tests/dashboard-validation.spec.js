/**
 * USMCA Dashboard Validation Test
 * Validates dashboard.css styling and professional compliance standards
 */

const { test, expect } = require('@playwright/test');

test.describe('USMCA Compliance Dashboard', () => {
  
  test('Company Information section styling validation', async ({ page }) => {
    // Navigate to USMCA workflow
    await page.goto('/usmca-workflow');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Validate dashboard container
    const dashboardContainer = page.locator('.dashboard-container');
    await expect(dashboardContainer).toBeVisible();
    
    // Validate form section
    const formSection = page.locator('.form-section');
    await expect(formSection).toBeVisible();
    
    // Validate form elements
    await expect(page.locator('.form-input')).toBeVisible(); // Company name
    await expect(page.locator('.form-select').first()).toBeVisible(); // Business type
    
    // Check required labels
    const requiredLabels = page.locator('.form-label.required');
    await expect(requiredLabels).toHaveCount(3); // Company name, business type, trade volume
    
    // Validate action buttons
    const continueButton = page.locator('.btn-primary');
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toHaveText('Continue to Product Details');
    
    console.log('✅ All dashboard.css classes are properly applied');
  });
  
  test('Desktop screenshot validation', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/usmca-workflow');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ 
      path: './screenshots/dashboard-desktop-validation.png',
      fullPage: true 
    });
    
    console.log('✅ Desktop screenshot captured');
  });
  
  test('Mobile responsive validation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/usmca-workflow');
    await page.waitForLoadState('networkidle');
    
    // Check mobile layout
    const formGrid = page.locator('.form-grid-2');
    await expect(formGrid).toBeVisible();
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: './screenshots/dashboard-mobile-validation.png',
      fullPage: true 
    });
    
    console.log('✅ Mobile screenshot captured');
  });
  
});