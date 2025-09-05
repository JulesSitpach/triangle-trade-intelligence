/**
 * Playwright Configuration - Triangle Intelligence Platform
 * Prevents repeated browser installations
 */

module.exports = {
  // Use installed browsers, don't download again
  use: {
    // Browser settings
    headless: process.env.CI === 'true',
    viewport: { width: 1920, height: 1080 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  // Test configuration
  testDir: './tests',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  
  // Browser projects
  projects: [
    {
      name: 'desktop-chrome',
      use: { 
        ...require('@playwright/test').devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'mobile-iphone',
      use: { 
        ...require('@playwright/test').devices['iPhone 15'],
        viewport: { width: 375, height: 667 }
      },
    },
    {
      name: 'tablet-ipad',
      use: { 
        ...require('@playwright/test').devices['iPad Pro'],
        viewport: { width: 1024, height: 768 }
      },
    }
  ],
  
  // Output directories
  outputDir: './test-results',
  
  // Web server (for testing)
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
};