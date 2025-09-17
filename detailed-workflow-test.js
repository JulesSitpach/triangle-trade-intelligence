/**
 * Detailed workflow functionality test
 * Tests the actual workflow endpoints and functionality
 */

const { chromium } = require('playwright');

async function testWorkflowFunctionality() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('🔍 Testing detailed workflow functionality...');

  try {
    // First, check what's actually at /usmca-workflow
    console.log('\n1. Checking /usmca-workflow endpoint...');
    await page.goto('http://localhost:3000/usmca-workflow');
    await page.waitForTimeout(2000);

    const pageTitle = await page.title();
    const url = page.url();
    console.log(`Current URL: ${url}`);
    console.log(`Page Title: ${pageTitle}`);

    // Check if this is actually a signup/login page or the workflow
    const isSignupPage = await page.locator('input[type="password"], button:has-text("Start Free Trial")').count() > 0;
    const isWorkflowPage = await page.locator('input[name="company_name"], select[name="business_type"]').count() > 0;

    console.log(`Is signup page: ${isSignupPage}`);
    console.log(`Is workflow page: ${isWorkflowPage}`);

    if (isSignupPage) {
      console.log('⚠️  USMCA workflow is redirecting to signup page');

      // Try to find alternative workflow access
      console.log('\n2. Checking if workflow is accessible from homepage...');
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(1000);

      // Look for workflow entry points
      const workflowLinks = await page.locator('a[href*="workflow"], button:has-text("Start"), a:has-text("USMCA")').count();
      console.log(`Found ${workflowLinks} potential workflow entry points on homepage`);

      if (workflowLinks > 0) {
        const firstLink = page.locator('a[href*="workflow"], button:has-text("Start"), a:has-text("USMCA")').first();
        const linkText = await firstLink.textContent();
        const linkHref = await firstLink.getAttribute('href');
        console.log(`First workflow link: "${linkText}" -> ${linkHref}`);

        if (linkHref && !linkHref.includes('signup')) {
          await firstLink.click();
          await page.waitForTimeout(2000);
          console.log(`Navigated to: ${page.url()}`);
        }
      }
    }

    // Test the tariff alerts page functionality
    console.log('\n3. Testing Trump Tariff Alerts functionality...');
    await page.goto('http://localhost:3000/trump-tariff-alerts');
    await page.waitForTimeout(2000);

    const alertsPageTitle = await page.title();
    console.log(`Alerts page title: ${alertsPageTitle}`);

    // Check for alert content
    const alertElements = await page.locator('.alert, [class*="alert"], .notification').count();
    const alertContent = await page.locator('text=/trade|tariff|alert/i').count();
    console.log(`Alert elements: ${alertElements}, Alert content mentions: ${alertContent}`);

    // Test email subscription if present
    const emailInput = await page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.first().fill('test@example.com');
      console.log('✓ Email input functional');
    }

    // Test certificate completion page
    console.log('\n4. Testing Certificate Completion functionality...');
    await page.goto('http://localhost:3000/usmca-certificate-completion');
    await page.waitForTimeout(2000);

    const certPageTitle = await page.title();
    console.log(`Certificate page title: ${certPageTitle}`);

    const formInputs = await page.locator('input, select, textarea').count();
    console.log(`Certificate form inputs found: ${formInputs}`);

    if (formInputs > 0) {
      // Try to fill some basic fields
      const nameInputs = await page.locator('input[name*="name"], input[name*="company"]');
      if (await nameInputs.count() > 0) {
        await nameInputs.first().fill('Test Company');
        console.log('✓ Certificate form inputs are functional');
      }
    } else {
      console.log('⚠️  No form inputs found on certificate page');
    }

    // Test admin dashboard access
    console.log('\n5. Testing Admin Dashboard access...');
    await page.goto('http://localhost:3000/admin/dashboard');
    await page.waitForTimeout(2000);

    const adminUrl = page.url();
    const isAdminPage = adminUrl.includes('admin');
    const hasAdminContent = await page.locator('[class*="admin"], [class*="dashboard"]').count() > 0;

    console.log(`Admin URL: ${adminUrl}`);
    console.log(`Is admin page: ${isAdminPage}`);
    console.log(`Has admin content: ${hasAdminContent}`);

    // Test user dashboard
    console.log('\n6. Testing User Dashboard access...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(2000);

    const dashboardUrl = page.url();
    const hasDashboardContent = await page.locator('[class*="dashboard"], .card').count() > 0;

    console.log(`Dashboard URL: ${dashboardUrl}`);
    console.log(`Has dashboard content: ${hasDashboardContent}`);

    console.log('\n✅ Detailed functionality test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testWorkflowFunctionality();