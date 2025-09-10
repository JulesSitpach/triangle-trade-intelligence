/**
 * End-to-End Workflow Test
 * Tests the complete USMCA workflow including HS code lookup
 */

const { chromium } = require('playwright');

async function testWorkflow() {
  console.log('🧪 Starting End-to-End Workflow Test...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to workflow page
    console.log('📍 Step 1: Navigate to USMCA Workflow');
    await page.goto('http://localhost:3000/usmca-workflow');
    await page.waitForSelector('.dashboard-title', { timeout: 10000 });
    console.log('✅ Page loaded successfully');
    
    // Step 2: Fill company information
    console.log('📍 Step 2: Fill Company Information');
    await page.fill('input[value=""]', 'Test Company LLC'); // Company name
    await page.selectOption('select', 'electronics'); // Business type
    await page.selectOption('select[value=""]', '$1M - $5M'); // Trade volume
    console.log('✅ Company information filled');
    
    // Click Continue
    await page.click('button:has-text("Continue to Product Details")');
    await page.waitForSelector('text=Step 2: Product & Component Analysis', { timeout: 5000 });
    console.log('✅ Moved to Step 2');
    
    // Step 3: Fill product information
    console.log('📍 Step 3: Fill Product Information');
    await page.fill('input[placeholder*="Describe your complete product"]', 'Electronic circuit board assembly');
    await page.selectOption('select[value=""]', 'CN'); // Manufacturing location
    console.log('✅ Product overview filled');
    
    // Step 4: Fill component information (testing HS lookup)
    console.log('📍 Step 4: Test HS Code Lookup');
    
    // Fill first component
    await page.fill('input[placeholder*="Describe this component"]', 'Printed circuit board with electronic components');
    await page.selectOption('select:near(:text("Origin Country"))', 'CN'); // Origin country
    await page.fill('input[type="number"]', '75'); // Value percentage
    
    console.log('⏳ Waiting for HS code suggestions...');
    await page.waitForSelector('.hs-suggestions-container', { timeout: 15000 });
    console.log('✅ HS code suggestions appeared!');
    
    // Check if suggestions are displayed
    const suggestions = await page.$$('.hs-suggestion-button');
    console.log(`📋 Found ${suggestions.length} HS code suggestions`);
    
    if (suggestions.length > 0) {
      // Get first suggestion details
      const firstSuggestion = await page.textContent('.hs-suggestion-button:first-child .hs-code-display');
      const firstDescription = await page.textContent('.hs-suggestion-button:first-child .hs-description');
      console.log(`🎯 First suggestion: ${firstSuggestion} - ${firstDescription}`);
      
      // Click first suggestion
      await page.click('.hs-suggestion-button:first-child');
      console.log('✅ Selected HS code suggestion');
      
      // Verify HS code was filled
      const hsCodeValue = await page.inputValue('input[placeholder*="Enter HS code"]');
      console.log(`📝 HS Code filled: ${hsCodeValue}`);
    } else {
      console.log('⚠️ No HS suggestions found - manual entry required');
      await page.fill('input[placeholder*="Enter HS code"]', '85340000'); // Manual HS code
    }
    
    // Add second component to reach 100%
    await page.click('button:has-text("Add Component")');
    await page.fill('input[placeholder*="Describe this component"]:nth(1)', 'Metal housing and connectors');
    await page.selectOption('select:near(:text("Origin Country")):nth(1)', 'MX');
    await page.fill('input[type="number"]:nth(1)', '25');
    
    // Wait for second component HS lookup
    console.log('⏳ Waiting for second component HS lookup...');
    await page.waitForTimeout(3000);
    
    // Check if we have HS suggestions for second component
    const secondHSSuggestions = await page.$$('.hs-suggestions-container');
    if (secondHSSuggestions.length > 1) {
      await page.click('.hs-suggestion-button:first-child');
    } else {
      // Manual entry for second component
      await page.fill('input[placeholder*="Enter HS code"]:nth(1)', '83081000');
    }
    
    // Step 5: Check total percentage
    console.log('📍 Step 5: Verify Total Percentage');
    const totalPercentage = await page.textContent('.percentage-value');
    console.log(`📊 Total percentage: ${totalPercentage}`);
    
    if (totalPercentage.includes('100.0%')) {
      console.log('✅ Components total 100% - Ready to process');
      
      // Step 6: Process workflow
      console.log('📍 Step 6: Process USMCA Compliance');
      await page.click('button:has-text("Process USMCA Compliance")');
      
      // Wait for processing
      console.log('⏳ Processing workflow...');
      await page.waitForSelector('text=Processing...', { timeout: 5000 });
      
      // Wait for results (up to 30 seconds)
      await page.waitForSelector('.workflow-results, .results-container', { timeout: 30000 });
      console.log('✅ Workflow processing completed!');
      
      // Check results
      const hasResults = await page.isVisible('.workflow-results, .results-container');
      if (hasResults) {
        console.log('🎉 End-to-End Test PASSED!');
        console.log('✅ Complete workflow executed successfully');
      } else {
        console.log('❌ Results page not found');
      }
      
    } else {
      console.log(`❌ Components don't total 100% (${totalPercentage})`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take screenshot on failure
    await page.screenshot({ path: 'test-failure-screenshot.png' });
    console.log('📸 Screenshot saved: test-failure-screenshot.png');
  }
  
  await browser.close();
  console.log('🏁 Test completed');
}

// Run the test
testWorkflow().catch(console.error);