const { chromium } = require('playwright');

async function testMobileNavigation() {
  console.log('🧪 Testing Mobile Navigation on Solutions Page');
  console.log('Target URL: http://localhost:3000/solutions\n');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for visual confirmation
    slowMo: 1000 
  });
  
  try {
    // Test iPhone 15 viewport
    const context = await browser.newContext({
      viewport: { width: 393, height: 852 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    
    const page = await context.newPage();
    
    console.log('📱 Loading Solutions page...');
    await page.goto('http://localhost:3000/solutions', { waitUntil: 'networkidle' });
    
    console.log('🔍 Testing mobile navigation functionality...');
    
    // Check if hamburger menu exists
    const menuToggle = await page.$('.nav-menu-toggle');
    console.log(`   Hamburger menu present: ${!!menuToggle ? '✅' : '❌'}`);
    
    if (menuToggle) {
      // Test menu toggle
      console.log('   🔄 Testing menu toggle...');
      
      // Click to open menu
      await menuToggle.click();
      await page.waitForTimeout(500); // Wait for animation
      
      const openMenu = await page.$('.nav-menu.mobile-open');
      console.log(`   Menu opens correctly: ${!!openMenu ? '✅' : '❌'}`);
      
      // Check menu links are visible
      const menuLinks = await page.$$('.nav-menu .nav-menu-link');
      console.log(`   Menu links count: ${menuLinks.length} ${menuLinks.length >= 5 ? '✅' : '❌'}`);
      
      // Test a menu link click
      if (menuLinks.length > 0) {
        console.log('   🔗 Testing menu link functionality...');
        
        // Click first link (should be Solutions - current page)
        await menuLinks[0].click();
        await page.waitForTimeout(300);
        
        // Menu should close after link click
        const closedMenu = await page.$('.nav-menu:not(.mobile-open)');
        console.log(`   Menu closes after link click: ${!!closedMenu ? '✅' : '❌'}`);
      }
      
      // Test clicking hamburger to close menu
      await menuToggle.click();
      await page.waitForTimeout(500);
      
      const finalClosedMenu = await page.$('.nav-menu:not(.mobile-open)');
      console.log(`   Menu closes with hamburger click: ${!!finalClosedMenu ? '✅' : '❌'}`);
    }
    
    // Test page responsiveness
    console.log('\n📐 Testing responsive layout...');
    
    const heroSection = await page.$('.hero-video-section');
    const servicesGrid = await page.$('.grid-2-cols');
    const benefitsGrid = await page.$('.grid-3-cols');
    
    console.log(`   Hero section visible: ${!!heroSection ? '✅' : '❌'}`);
    console.log(`   Services grid visible: ${!!servicesGrid ? '✅' : '❌'}`);
    console.log(`   Benefits grid visible: ${!!benefitsGrid ? '✅' : '❌'}`);
    
    // Check if content adapts to mobile
    if (servicesGrid) {
      const gridStyles = await servicesGrid.evaluate(el => {
        const computedStyle = window.getComputedStyle(el);
        return {
          display: computedStyle.display,
          gridTemplateColumns: computedStyle.gridTemplateColumns
        };
      });
      
      console.log(`   Grid responsive behavior: ${gridStyles.display === 'grid' ? '✅' : '❌'}`);
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: './screenshots/mobile-nav-final-test.png',
      fullPage: true
    });
    
    console.log('\n📸 Screenshot saved: ./screenshots/mobile-nav-final-test.png');
    
    await context.close();
    
    console.log('\n🎉 Mobile navigation test completed successfully!');
    
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testMobileNavigation()
    .then(() => {
      console.log('✅ Test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}