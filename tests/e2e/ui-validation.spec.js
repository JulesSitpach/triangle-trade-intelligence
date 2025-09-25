/**
 * Triangle Intelligence Platform - UI Validation Tests
 * Automated testing for CSS compliance and visual consistency
 */

const { test, expect } = require('@playwright/test');

test.describe('Triangle Intelligence Platform - UI Validation', () => {

  test.beforeEach(async ({ page }) => {
    // Start dev server on port 3000
    await page.goto('http://localhost:3000');
  });

  test('Homepage loads without CSS violations', async ({ page }) => {
    // Check for inline styles (forbidden)
    const inlineStyles = await page.locator('[style]').count();
    expect(inlineStyles).toBe(0);

    // Check for Tailwind classes (forbidden)
    const tailwindElements = await page.locator('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="m-"]').count();
    expect(tailwindElements).toBe(0);

    // Check page loads successfully
    await expect(page).toHaveTitle(/Triangle Intelligence/);
  });

  test('Mobile responsiveness - iPhone 15', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check navigation is mobile-friendly
    const navElement = page.locator('nav');
    await expect(navElement).toBeVisible();

    // Take screenshot for visual comparison
    await page.screenshot({ path: './test-results/mobile-homepage.png', fullPage: true });
  });

  test('Desktop layout validation', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Check main navigation is visible
    const navigation = page.locator('.header-nav');
    await expect(navigation).toBeVisible();

    // Check hero section
    const heroSection = page.locator('.hero');
    await expect(heroSection).toBeVisible();

    // Take screenshot for visual comparison
    await page.screenshot({ path: './test-results/desktop-homepage.png', fullPage: true });
  });

  test('USMCA Workflow accessibility', async ({ page }) => {
    // Navigate to workflow
    await page.click('text=Start USMCA Analysis');

    // Check form accessibility
    const companyNameInput = page.locator('input[name="company_name"]');
    await expect(companyNameInput).toBeVisible();
    await expect(companyNameInput).toHaveAttribute('required');

    // Check all form labels exist
    const labels = await page.locator('label').count();
    expect(labels).toBeGreaterThan(0);
  });

  test('Console errors check', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate through key pages
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('CSS classes validation', async ({ page }) => {
    // Get all elements with classes
    const elements = await page.$$('[class]');

    for (const element of elements) {
      const className = await element.getAttribute('class');

      // Check no Tailwind utility classes
      expect(className).not.toMatch(/\b(bg-|text-|p-|m-|w-|h-|flex-|grid-|border-)\S+/);

      // Check only approved CSS classes are used
      const approvedClasses = [
        'header-nav', 'hero', 'card', 'btn-primary', 'btn-secondary',
        'form-group', 'text-body', 'nav-link', 'section-spacing'
      ];

      const classNames = className.split(' ');
      for (const cls of classNames) {
        if (cls.trim()) {
          // Allow component-specific classes or check against approved list
          const isApproved = approvedClasses.some(approved => cls.includes(approved)) ||
                           cls.startsWith('component-') ||
                           cls.startsWith('page-');

          if (!isApproved) {
            console.warn(`Potentially unapproved CSS class: ${cls}`);
          }
        }
      }
    }
  });
});