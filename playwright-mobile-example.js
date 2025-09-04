/**
 * Playwright Mobile Emulation Example
 * This script demonstrates how to use Playwright with iPhone 15 device emulation
 */

const { chromium, devices } = require('playwright');

async function testMobileView() {
  // Launch browser with iPhone 15 device emulation
  const browser = await chromium.launch({
    headless: false, // Set to true for headless mode
    args: ['--disable-web-security'] // Disable CORS for testing
  });

  // Create context with iPhone 15 device settings
  const iPhone15 = devices['iPhone 15'];
  const context = await browser.newContext({
    ...iPhone15,
    // Additional context options
    locale: 'en-US',
    geolocation: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
    permissions: ['geolocation']
  });

  // Create a new page
  const page = await context.newPage();

  // Navigate to your local development site
  await page.goto('http://localhost:3000', {
    waitUntil: 'networkidle'
  });

  // Take a screenshot of the mobile view
  await page.screenshot({ 
    path: 'mobile-screenshot.png',
    fullPage: true 
  });

  console.log('Mobile view screenshot saved as mobile-screenshot.png');

  // Test mobile-specific interactions
  // Example: Test the mobile menu toggle
  const mobileMenuButton = await page.$('[data-testid="mobile-menu"]');
  if (mobileMenuButton) {
    await mobileMenuButton.click();
    console.log('Mobile menu clicked');
  }

  // Test touch gestures
  await page.tap('button'); // Tap instead of click for mobile

  // Test viewport changes
  console.log('Current viewport:', page.viewportSize());

  // Simulate device rotation
  await context.setViewportSize({ width: 844, height: 390 }); // Landscape
  console.log('Rotated to landscape');
  
  await page.waitForTimeout(2000); // Wait to see the changes

  // Close browser
  await browser.close();
  console.log('Test completed successfully!');
}

// Run the test
testMobileView().catch(console.error);

// Alternative: Use with MCP configuration
// When using with MCP, the configuration in playwright-mcp-mobile-config.json
// will automatically apply the device settings, so you can simplify:

async function testWithMCPConfig() {
  // MCP will handle browser launch with iPhone 15 settings
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000');
  
  // Your test logic here
  
  await browser.close();
}

module.exports = { testMobileView, testWithMCPConfig };