/**
 * Final Navigation Validation Test
 * Quick verification of dashboard navigation implementation
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🎯 Final Dashboard Navigation Validation...');
  
  const browser = await chromium.launch({ headless: false });
  
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Wait and go to USMCA workflow
    console.log('🔄 Loading USMCA workflow page...');
    await page.goto('http://localhost:3000/usmca-workflow', { waitUntil: 'networkidle' });
    
    // Wait a bit for any dynamic content
    await page.waitForTimeout(3000);
    
    // Simple check for any navigation
    const hasAnyNavigation = await page.evaluate(() => {
      // Check for various navigation patterns
      const dashboardNav = document.querySelector('.dashboard-nav');
      const navFixed = document.querySelector('.nav-fixed');
      const appHeader = document.querySelector('.app-header');
      const anyNav = document.querySelector('nav');
      
      return {
        dashboardNav: !!dashboardNav,
        navFixed: !!navFixed,
        appHeader: !!appHeader,
        anyNav: !!anyNav,
        hasWorkflowText: document.body.textContent.includes('Workflow'),
        hasReportsText: document.body.textContent.includes('Reports'),
        hasSettingsText: document.body.textContent.includes('Settings'),
        hasSolutionsText: document.body.textContent.includes('Solutions'),
        hasIntelligenceText: document.body.textContent.includes('Intelligence'),
        hasPricingText: document.body.textContent.includes('Pricing'),
        title: document.title
      };
    });
    
    console.log('\n📊 NAVIGATION STATUS:');
    console.log(`   Dashboard Nav (.dashboard-nav): ${hasAnyNavigation.dashboardNav ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Fixed Nav (.nav-fixed): ${hasAnyNavigation.navFixed ? '⚠️ Found (should be removed)' : '✅ Removed'}`);
    console.log(`   App Header (.app-header): ${hasAnyNavigation.appHeader ? '⚠️ Found (should be dashboard)' : '✅ Clean'}`);
    console.log(`   Any Nav Tag: ${hasAnyNavigation.anyNav ? '✅ Found' : '❌ Missing'}`);
    
    console.log('\n🔗 LINK VALIDATION:');
    console.log(`   Workflow Link: ${hasAnyNavigation.hasWorkflowText ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Reports Link: ${hasAnyNavigation.hasReportsText ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Settings Link: ${hasAnyNavigation.hasSettingsText ? '✅ Found' : '❌ Missing'}`);
    
    console.log('\n❌ MARKETING LINKS (Should be GONE):');
    console.log(`   Solutions: ${hasAnyNavigation.hasSolutionsText ? '❌ Still Present' : '✅ Removed'}`);
    console.log(`   Intelligence: ${hasAnyNavigation.hasIntelligenceText ? '❌ Still Present' : '✅ Removed'}`);
    console.log(`   Pricing: ${hasAnyNavigation.hasPricingText ? '❌ Still Present' : '✅ Removed'}`);
    
    console.log(`\n📄 Page Title: ${hasAnyNavigation.title}`);
    
    // Take final screenshot
    await page.screenshot({ 
      path: './screenshots/final-navigation-validation.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved: final-navigation-validation.png');
    
    // Calculate success score
    let score = 0;
    if (!hasAnyNavigation.hasSolutionsText) score += 20; // Marketing removed
    if (!hasAnyNavigation.hasIntelligenceText) score += 20; // Marketing removed
    if (!hasAnyNavigation.hasPricingText) score += 20; // Marketing removed
    if (hasAnyNavigation.hasWorkflowText) score += 15; // Dashboard links
    if (hasAnyNavigation.hasReportsText) score += 15; // Dashboard links
    if (hasAnyNavigation.hasSettingsText) score += 10; // Dashboard links
    
    console.log(`\n🏆 NAVIGATION CONVERSION SCORE: ${score}%`);
    
    if (score >= 90) {
      console.log('🎉 SUCCESS: Professional dashboard navigation achieved!');
    } else if (score >= 70) {
      console.log('⚠️ GOOD: Marketing navigation removed, dashboard links present');
    } else {
      console.log('❌ NEEDS WORK: Navigation conversion incomplete');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();