const { chromium, devices } = require('playwright');

async function testMobileResponsiveness() {
  console.log('🚀 Starting Triangle Intelligence Mobile Responsiveness Test');
  
  const browser = await chromium.launch({ headless: false });
  
  // Test configurations for different devices
  const testDevices = [
    {
      name: 'iPhone 15',
      device: devices['iPhone 15'],
      viewport: { width: 393, height: 852 }
    },
    {
      name: 'iPhone 15 Pro Max',
      device: devices['iPhone 15 Pro Max'],
      viewport: { width: 430, height: 932 }
    },
    {
      name: 'iPad Pro',
      device: devices['iPad Pro'],
      viewport: { width: 1024, height: 1366 }
    },
    {
      name: 'Galaxy S24',
      device: devices['Galaxy S24 Mobile'],
      viewport: { width: 384, height: 854 }
    },
    {
      name: 'Desktop Large',
      viewport: { width: 1920, height: 1080 }
    },
    {
      name: 'Desktop Standard',
      viewport: { width: 1280, height: 720 }
    }
  ];

  const testResults = [];

  for (const config of testDevices) {
    console.log(`\n📱 Testing ${config.name}...`);
    
    try {
      const context = await browser.newContext(config.device || { viewport: config.viewport });
      const page = await context.newPage();
      
      // Navigate to the homepage
      await page.goto('http://localhost:3000');
      
      // Wait for page to load
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      
      const result = {
        device: config.name,
        viewport: config.viewport,
        tests: {
          pageLoad: true,
          videoVisible: false,
          navigationVisible: false,
          heroContentReadable: false,
          buttonsAccessible: false,
          gridLayoutWorking: false,
          scrollPerformance: false
        }
      };

      // Test 1: Hero video section
      console.log(`  ✅ Testing hero video section...`);
      const videoElement = await page.$('.hero-video-element');
      const heroContent = await page.$('.hero-content-container');
      
      if (videoElement) {
        const videoVisible = await videoElement.isVisible();
        result.tests.videoVisible = videoVisible;
        console.log(`    Video visible: ${videoVisible}`);
      }

      // Test 2: Navigation menu
      console.log(`  ✅ Testing navigation...`);
      const navMenu = await page.$('.nav-menu');
      if (navMenu) {
        const navVisible = await navMenu.isVisible();
        result.tests.navigationVisible = navVisible;
        console.log(`    Navigation visible: ${navVisible}`);
      }

      // Test 3: Hero content readability
      console.log(`  ✅ Testing hero text readability...`);
      if (heroContent) {
        const heroTitle = await page.$('.hero-main-title');
        const heroSubtitle = await page.$('.hero-sub-title');
        
        if (heroTitle && heroSubtitle) {
          const titleBox = await heroTitle.boundingBox();
          const subtitleBox = await heroSubtitle.boundingBox();
          
          result.tests.heroContentReadable = titleBox && subtitleBox && 
                                           titleBox.width > 0 && subtitleBox.width > 0;
          console.log(`    Hero content readable: ${result.tests.heroContentReadable}`);
        }
      }

      // Test 4: Button accessibility (touch targets)
      console.log(`  ✅ Testing button accessibility...`);
      const buttons = await page.$$('.hero-primary-button, .hero-secondary-button, .btn-primary');
      let buttonsAccessible = true;
      
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && (box.height < 44 || box.width < 44)) { // iOS HIG minimum touch target
          buttonsAccessible = false;
          console.log(`    ⚠️ Button too small: ${box.width}x${box.height}px`);
        }
      }
      result.tests.buttonsAccessible = buttonsAccessible;
      console.log(`    All buttons accessible: ${buttonsAccessible}`);

      // Test 5: Grid layout adaptation
      console.log(`  ✅ Testing grid layout...`);
      const gridElements = await page.$$('.grid-2-cols, .content-card');
      if (gridElements.length > 0) {
        const firstCard = gridElements[0];
        const cardBox = await firstCard.boundingBox();
        
        result.tests.gridLayoutWorking = cardBox && cardBox.width > 0;
        console.log(`    Grid layout working: ${result.tests.gridLayoutWorking}`);
      }

      // Test 6: Scroll performance
      console.log(`  ✅ Testing scroll performance...`);
      const startTime = Date.now();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollTo(0, 0));
      const endTime = Date.now();
      
      result.tests.scrollPerformance = (endTime - startTime) < 1000;
      console.log(`    Scroll performance good: ${result.tests.scrollPerformance} (${endTime - startTime}ms)`);

      // Take screenshot
      const screenshotPath = `./screenshots/mobile-test-${config.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true,
        animations: 'disabled'
      });
      console.log(`    📸 Screenshot saved: ${screenshotPath}`);

      testResults.push(result);
      await context.close();
      
    } catch (error) {
      console.error(`❌ Error testing ${config.name}:`, error.message);
      testResults.push({
        device: config.name,
        error: error.message
      });
    }
  }

  await browser.close();

  // Generate report
  console.log('\n📊 MOBILE RESPONSIVENESS TEST RESULTS:');
  console.log('='.repeat(60));
  
  testResults.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.device}: ERROR - ${result.error}`);
      return;
    }
    
    const passedTests = Object.values(result.tests).filter(test => test === true).length;
    const totalTests = Object.keys(result.tests).length;
    const score = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n📱 ${result.device} (${result.viewport.width}x${result.viewport.height})`);
    console.log(`   Overall Score: ${score}% (${passedTests}/${totalTests} tests passed)`);
    
    Object.entries(result.tests).forEach(([test, passed]) => {
      const status = passed ? '✅' : '❌';
      console.log(`   ${status} ${test}`);
    });
  });

  // Specific recommendations
  console.log('\n🔧 MOBILE OPTIMIZATION RECOMMENDATIONS:');
  console.log('='.repeat(60));
  
  const mobileDevices = testResults.filter(r => r.viewport && r.viewport.width < 768);
  const issues = [];
  
  mobileDevices.forEach(device => {
    if (device.tests && !device.tests.navigationVisible) {
      issues.push('Navigation menu hidden on mobile - needs hamburger menu');
    }
    if (device.tests && !device.tests.buttonsAccessible) {
      issues.push('Button touch targets too small - increase to 44px minimum');
    }
    if (device.tests && !device.tests.heroContentReadable) {
      issues.push('Hero text may be too large/overlapping on small screens');
    }
    if (device.tests && !device.tests.gridLayoutWorking) {
      issues.push('Grid layout not adapting properly to mobile');
    }
  });

  const uniqueIssues = [...new Set(issues)];
  uniqueIssues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });

  if (uniqueIssues.length === 0) {
    console.log('✅ No major mobile responsiveness issues detected!');
  }

  console.log('\n🎯 CSS RECOMMENDATIONS (using existing classes):');
  console.log('='.repeat(60));
  console.log('• Navigation: Add mobile menu toggle with existing .nav-menu class');
  console.log('• Buttons: Ensure .hero-primary-button has adequate padding on mobile');
  console.log('• Typography: Use existing @media queries in globals.css for scaling');
  console.log('• Grid: .grid-2-cols automatically adapts via CSS Grid auto-fit');
  console.log('• Touch targets: Review button padding in mobile breakpoints');
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('./screenshots')) {
  fs.mkdirSync('./screenshots');
}

testMobileResponsiveness().catch(console.error);