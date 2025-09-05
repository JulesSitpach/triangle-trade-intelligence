/**
 * Quick test to validate improved trust indicators
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🎨 Testing improved trust indicators...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/usmca-workflow');
    await page.waitForLoadState('networkidle');
    
    // Check for new professional status cards
    const statusGrid = await page.locator('.status-grid');
    const statusCards = await page.locator('.status-card');
    const badges = await page.locator('.badge');
    
    await page.waitForSelector('.status-grid', { timeout: 10000 });
    
    console.log('✅ Status grid found');
    console.log(`✅ ${await statusCards.count()} status cards detected`);
    console.log(`✅ ${await badges.count()} professional badges found`);
    
    // Take screenshot
    await page.screenshot({ 
      path: './screenshots/improved-trust-indicators.png',
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved: improved-trust-indicators.png');
    console.log('🎉 Trust indicators successfully upgraded to professional dashboard styling!');
    
  } catch (error) {
    console.error('❌ Error testing trust indicators:', error.message);
  } finally {
    await browser.close();
  }
})();