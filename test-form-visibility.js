/**
 * Form Visibility Test
 * Checks if form is visible without scrolling after compression
 */

const { chromium } = require('playwright');

(async () => {
  console.log('🎯 Testing Form Visibility After Compression...');
  
  const browser = await chromium.launch({ headless: false });
  
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('📊 Loading USMCA workflow page...');
    await page.goto('http://localhost:3000/usmca-workflow');
    await page.waitForLoadState('networkidle');
    
    // Check what's visible in viewport without scrolling
    const viewportAnalysis = await page.evaluate(() => {
      const viewport = {
        height: window.innerHeight,
        width: window.innerWidth
      };
      
      // Check key elements
      const title = document.querySelector('.page-title');
      const statusGrid = document.querySelector('.status-grid');
      const workflowProgress = document.querySelector('.workflow-progress');
      const formSection = document.querySelector('.form-section');
      const firstInput = document.querySelector('.form-input');
      
      const results = {
        viewportHeight: viewport.height,
        titleVisible: title ? title.getBoundingClientRect().top < viewport.height : false,
        statusCardsVisible: statusGrid ? statusGrid.getBoundingClientRect().bottom < viewport.height : false,
        progressBarVisible: workflowProgress ? workflowProgress.getBoundingClientRect().bottom < viewport.height : false,
        formStartsVisible: formSection ? formSection.getBoundingClientRect().top < viewport.height : false,
        firstInputVisible: firstInput ? firstInput.getBoundingClientRect().top < viewport.height : false,
      };
      
      // Get positions
      if (title) results.titleTop = Math.round(title.getBoundingClientRect().top);
      if (statusGrid) results.statusBottom = Math.round(statusGrid.getBoundingClientRect().bottom);
      if (formSection) results.formTop = Math.round(formSection.getBoundingClientRect().top);
      if (firstInput) results.inputTop = Math.round(firstInput.getBoundingClientRect().top);
      
      return results;
    });
    
    console.log('\n📏 VIEWPORT ANALYSIS (1920x1080):');
    console.log(`   Viewport Height: ${viewportAnalysis.viewportHeight}px`);
    console.log(`   Title Position: ${viewportAnalysis.titleTop}px ${viewportAnalysis.titleVisible ? '✅ Visible' : '❌ Not visible'}`);
    console.log(`   Status Cards Bottom: ${viewportAnalysis.statusBottom}px ${viewportAnalysis.statusCardsVisible ? '✅ Visible' : '❌ Below fold'}`);
    console.log(`   Form Section Top: ${viewportAnalysis.formTop}px ${viewportAnalysis.formStartsVisible ? '✅ Visible' : '❌ Below fold'}`);
    console.log(`   First Input Top: ${viewportAnalysis.inputTop}px ${viewportAnalysis.firstInputVisible ? '✅ Visible' : '❌ Below fold'}`);
    
    // Calculate compression success
    const pixelsToForm = viewportAnalysis.formTop || 1000;
    const compressionScore = pixelsToForm < viewportAnalysis.viewportHeight ? 100 : Math.round((viewportAnalysis.viewportHeight / pixelsToForm) * 100);
    
    console.log(`\n🏆 COMPRESSION SCORE: ${compressionScore}%`);
    
    if (viewportAnalysis.firstInputVisible) {
      console.log('✅ SUCCESS: Form inputs are visible without scrolling!');
    } else if (viewportAnalysis.formStartsVisible) {
      console.log('⚠️  PARTIAL: Form section visible but inputs require minimal scroll');
    } else {
      console.log(`❌ NEEDS MORE: Form is ${pixelsToForm - viewportAnalysis.viewportHeight}px below viewport`);
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: './screenshots/form-visibility-test.png',
      fullPage: false  // Only capture viewport
    });
    console.log('\n📸 Screenshot saved: form-visibility-test.png (viewport only)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();