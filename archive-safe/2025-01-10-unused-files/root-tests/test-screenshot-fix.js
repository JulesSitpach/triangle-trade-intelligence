const { chromium } = require('playwright');

(async () => {
  console.log('🔧 Testing Playwright screenshot functionality after config fix...');
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log('📋 Navigating to USMCA workflow...');
    await page.goto('http://localhost:3000/usmca-workflow', { 
      waitUntil: 'networkidle' 
    });
    
    console.log('📸 Testing screenshot capture...');
    await page.screenshot({ 
      path: 'test-screenshot-verification.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    console.log('✅ Screenshot capture successful!');
    console.log('📁 Saved as: test-screenshot-verification.png');
    
    // Test if form elements can be found
    console.log('\n🔍 Testing element detection...');
    
    const formSection = await page.locator('.form-section').count();
    console.log(`   Form sections found: ${formSection}`);
    
    const formInputs = await page.locator('.form-input').count();
    console.log(`   Form inputs found: ${formInputs}`);
    
    const workflowSteps = await page.locator('.workflow-step').count();
    console.log(`   Workflow steps found: ${workflowSteps}`);
    
    if (formSection > 0 && formInputs > 0) {
      console.log('\n✅ Elements successfully detected - visual validation is now possible!');
    } else {
      console.log('\n❌ Elements still not found - may need test updates');
    }
    
  } catch (error) {
    console.error('❌ Error during screenshot test:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();