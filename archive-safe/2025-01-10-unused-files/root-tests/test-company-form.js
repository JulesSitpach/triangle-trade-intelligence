/**
 * Simple Company Information Form Test
 * Manual screenshot and validation test
 */

const { chromium } = require('playwright');

async function testCompanyForm() {
  console.log('🚀 Starting Company Information Form Test...');
  
  const browser = await chromium.launch({
    headless: false, // Show browser for visual verification
    slowMo: 100 // Slow down actions for demo
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the workflow page
    console.log('📍 Navigating to USMCA workflow...');
    await page.goto('http://localhost:3004/usmca-workflow');
    
    // Wait for form to load
    await page.waitForSelector('.form-section', { timeout: 10000 });
    console.log('✅ Form section loaded');
    
    // Test form structure
    console.log('🔍 Testing form structure...');
    
    // Check if all required fields exist
    const requiredFields = [
      '#company-name',
      '#business-type', 
      '#supplier-country',
      '#trade-volume'
    ];
    
    for (const field of requiredFields) {
      const element = await page.locator(field);
      if (await element.count() > 0) {
        console.log(`✅ Found required field: ${field}`);
      } else {
        console.log(`❌ Missing required field: ${field}`);
      }
    }
    
    // Test responsive layouts
    console.log('📱 Testing mobile layout (375px)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'company-form-mobile-375px.png', fullPage: true });
    
    console.log('💻 Testing desktop layout (1920px)...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'company-form-desktop-1920px.png', fullPage: false });
    
    // Test form validation
    console.log('🧪 Testing form validation...');
    
    // Test empty field validation
    const companyNameInput = page.locator('#company-name');
    await companyNameInput.click();
    await companyNameInput.blur();
    
    // Check if error state is shown
    const hasError = await companyNameInput.evaluate(el => el.classList.contains('error'));
    console.log(hasError ? '✅ Error state works' : '⚠️  Error state not triggered');
    
    // Fill in sample data
    console.log('📝 Filling in sample company data...');
    await page.fill('#company-name', 'Triangle Manufacturing Solutions Inc.');
    
    // Wait for dropdowns to load and select first available options
    await page.waitForLoadState('networkidle');
    
    // Select business type (wait for options to load)
    const businessTypeOptions = await page.locator('#business-type option').count();
    if (businessTypeOptions > 1) {
      await page.selectOption('#business-type', { index: 1 });
    }
    
    // Select supplier country (wait for options to load)  
    const countryOptions = await page.locator('#supplier-country option').count();
    if (countryOptions > 1) {
      await page.selectOption('#supplier-country', { index: 1 });
    }
    
    // Select trade volume (wait for options to load)
    const volumeOptions = await page.locator('#trade-volume option').count(); 
    if (volumeOptions > 1) {
      await page.selectOption('#trade-volume', { index: 1 });
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'company-form-completed.png', fullPage: true });
    
    // Test submit button state
    const submitButton = page.locator('button[type="button"]:has-text("Continue to Product Details")');
    const isEnabled = await submitButton.isEnabled();
    console.log(isEnabled ? '✅ Submit button enabled with valid data' : '❌ Submit button not enabled');
    
    // Test touch target sizes
    console.log('👆 Testing touch target sizes...');
    const inputs = [
      '#company-name',
      '#business-type',
      '#supplier-country',
      '#trade-volume'
    ];
    
    for (const input of inputs) {
      const element = page.locator(input);
      const box = await element.boundingBox();
      if (box && box.height >= 48) {
        console.log(`✅ ${input} meets 48px minimum (${Math.round(box.height)}px)`);
      } else {
        console.log(`❌ ${input} too small for touch (${box ? Math.round(box.height) : 'not found'}px)`);
      }
    }
    
    console.log('✨ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await page.waitForTimeout(3000); // Keep browser open for 3 seconds
    await browser.close();
  }
}

if (require.main === module) {
  testCompanyForm();
}

module.exports = { testCompanyForm };