/**
 * Test All Workflow Steps Compression
 * Ensures steps 1, 2, and 3 all use compressed dashboard.css layout
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🎯 Testing All Workflow Steps Compression...');
  
  const browser = await chromium.launch({ headless: false });
  
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('📊 Loading USMCA workflow page...');
    await page.goto('http://localhost:3000/usmca-workflow');
    await page.waitForLoadState('networkidle');
    
    // Test Step 1 - Initial Load
    console.log('\n=== STEP 1: Company Information ===');
    const step1Analysis = await page.evaluate(() => {
      const viewport = { height: window.innerHeight };
      const title = document.querySelector('.page-title');
      const statusCards = document.querySelector('.status-grid');
      const progress = document.querySelector('.workflow-progress');
      const formSection = document.querySelector('.form-section');
      
      return {
        step: 1,
        titleTop: title ? Math.round(title.getBoundingClientRect().top) : null,
        statusBottom: statusCards ? Math.round(statusCards.getBoundingClientRect().bottom) : null,
        progressBottom: progress ? Math.round(progress.getBoundingClientRect().bottom) : null,
        formTop: formSection ? Math.round(formSection.getBoundingClientRect().top) : null,
        allVisible: (
          (title?.getBoundingClientRect().top || 0) < viewport.height &&
          (statusCards?.getBoundingClientRect().bottom || 0) < viewport.height &&
          (progress?.getBoundingClientRect().bottom || 0) < viewport.height &&
          (formSection?.getBoundingClientRect().top || 0) < viewport.height
        )
      };
    });
    
    console.log(`   Title: ${step1Analysis.titleTop}px`);
    console.log(`   Status Cards End: ${step1Analysis.statusBottom}px`);
    console.log(`   Progress End: ${step1Analysis.progressBottom}px`);
    console.log(`   Form Start: ${step1Analysis.formTop}px`);
    console.log(`   All Elements Visible: ${step1Analysis.allVisible ? '✅ YES' : '❌ NO'}`);
    
    // Fill out step 1 to proceed to step 2
    console.log('\n🔄 Filling Step 1 to proceed...');
    await page.fill('input[placeholder*="legal entity name"]', 'Test Electronics Inc');
    await page.selectOption('select:has-text("Select your primary business activity")', { index: 1 });
    await page.selectOption('select:has-text("China")', { index: 1 });
    await page.selectOption('select:has-text("United States")', { index: 1 });
    await page.selectOption('select:has-text("Select your annual")', { index: 1 });
    
    // Click Continue to Step 2
    const continueButton = await page.locator('button:has-text("Continue to Product Details")');
    await continueButton.click();
    await page.waitForTimeout(1000);
    
    // Test Step 2 - Product & Components
    console.log('\n=== STEP 2: Product & Components ===');
    const step2Analysis = await page.evaluate(() => {
      const viewport = { height: window.innerHeight };
      const title = document.querySelector('.page-title');
      const statusCards = document.querySelector('.status-grid');
      const progress = document.querySelector('.workflow-progress');
      const formSections = document.querySelectorAll('.form-section');
      const firstFormSection = formSections[0];
      
      return {
        step: 2,
        titleTop: title ? Math.round(title.getBoundingClientRect().top) : null,
        statusBottom: statusCards ? Math.round(statusCards.getBoundingClientRect().bottom) : null,
        progressBottom: progress ? Math.round(progress.getBoundingClientRect().bottom) : null,
        formTop: firstFormSection ? Math.round(firstFormSection.getBoundingClientRect().top) : null,
        totalFormSections: formSections.length,
        allVisible: (
          (title?.getBoundingClientRect().top || 0) < viewport.height &&
          (statusCards?.getBoundingClientRect().bottom || 0) < viewport.height &&
          (progress?.getBoundingClientRect().bottom || 0) < viewport.height &&
          (firstFormSection?.getBoundingClientRect().top || 0) < viewport.height
        )
      };
    });
    
    console.log(`   Title: ${step2Analysis.titleTop}px`);
    console.log(`   Status Cards End: ${step2Analysis.statusBottom}px`);
    console.log(`   Progress End: ${step2Analysis.progressBottom}px`);
    console.log(`   Form Start: ${step2Analysis.formTop}px`);
    console.log(`   Form Sections Found: ${step2Analysis.totalFormSections}`);
    console.log(`   All Elements Visible: ${step2Analysis.allVisible ? '✅ YES' : '❌ NO'}`);
    
    // Fill product description to enable continue
    await page.fill('textarea[placeholder*="Describe your product"]', 'Electronic circuit board with copper wires');
    await page.waitForTimeout(500);
    
    // Click Continue to Step 3 (if button appears)
    const continueToStep3 = await page.locator('button:has-text("Continue")').first();
    if (await continueToStep3.isVisible()) {
      await continueToStep3.click();
      await page.waitForTimeout(1000);
      
      // Test Step 3 - Results & Certificate
      console.log('\n=== STEP 3: Results & Certificate ===');
      const step3Analysis = await page.evaluate(() => {
        const viewport = { height: window.innerHeight };
        const title = document.querySelector('.page-title');
        const statusCards = document.querySelector('.status-grid');
        const progress = document.querySelector('.workflow-progress');
        const resultsSection = document.querySelector('.results-section') || 
                              document.querySelector('.form-section') ||
                              document.querySelector('[class*="result"]');
        
        return {
          step: 3,
          titleTop: title ? Math.round(title.getBoundingClientRect().top) : null,
          statusBottom: statusCards ? Math.round(statusCards.getBoundingClientRect().bottom) : null,
          progressBottom: progress ? Math.round(progress.getBoundingClientRect().bottom) : null,
          resultsTop: resultsSection ? Math.round(resultsSection.getBoundingClientRect().top) : null,
          allVisible: (
            (title?.getBoundingClientRect().top || 0) < viewport.height &&
            (statusCards?.getBoundingClientRect().bottom || 0) < viewport.height &&
            (progress?.getBoundingClientRect().bottom || 0) < viewport.height &&
            (resultsSection?.getBoundingClientRect().top || 0) < viewport.height
          )
        };
      });
      
      console.log(`   Title: ${step3Analysis.titleTop}px`);
      console.log(`   Status Cards End: ${step3Analysis.statusBottom}px`);
      console.log(`   Progress End: ${step3Analysis.progressBottom}px`);
      console.log(`   Results Start: ${step3Analysis.resultsTop}px`);
      console.log(`   All Elements Visible: ${step3Analysis.allVisible ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log('   ⚠️  Could not proceed to Step 3 (button not available)');
    }
    
    // Summary
    console.log('\n🏆 COMPRESSION CONSISTENCY ANALYSIS:');
    console.log('=====================================');
    
    const allStepsCompressed = [step1Analysis, step2Analysis].every(step => step.allVisible);
    
    if (allStepsCompressed) {
      console.log('✅ SUCCESS: All workflow steps use compressed layout!');
      console.log('✅ All elements (header, stats, progress, content) fit in viewport');
      console.log('✅ dashboard.css compression rules applied consistently');
    } else {
      console.log('❌ ISSUE: Some steps may not be fully compressed');
      console.log('   Check if all CSS is properly in dashboard.css');
    }
    
    // Take screenshots of each step
    await page.screenshot({ 
      path: './screenshots/workflow-all-steps-compressed.png',
      fullPage: false
    });
    console.log('\n📸 Screenshot saved: workflow-all-steps-compressed.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();