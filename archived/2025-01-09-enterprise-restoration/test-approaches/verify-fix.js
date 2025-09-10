const { chromium } = require('playwright');

(async () => {
  console.log('🔄 Verifying Trust Indicator Alignment Fix (Cache Refresh)...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    channel: 'chrome',
    slowMo: 100 
  });
  
  const page = await browser.newPage();
  
  // Force cache refresh
  await page.goto('http://localhost:3000/usmca-workflow', { 
    waitUntil: 'networkidle',
    timeout: 10000
  });
  
  // Force CSS refresh
  await page.evaluate(() => {
    // Force browser to recalculate styles
    document.body.style.display = 'none';
    document.body.offsetHeight; // trigger reflow
    document.body.style.display = '';
  });
  
  await page.waitForSelector('.trust-indicators .trust-indicator');
  
  // Check if the CSS fix is applied
  const cssCheck = await page.evaluate(() => {
    const trustIndicator = document.querySelector('.trust-indicators .trust-indicator');
    if (!trustIndicator) return { error: 'Trust indicator not found' };
    
    const styles = window.getComputedStyle(trustIndicator);
    return {
      flex: styles.flex,
      background: styles.background,
      padding: styles.padding,
      border: styles.border,
      color: styles.color,
      textAlign: styles.textAlign
    };
  });
  
  console.log('🎨 CSS APPLIED CHECK:');
  console.log('   Flex property:', cssCheck.flex);
  console.log('   Background:', cssCheck.background);
  console.log('   Text align:', cssCheck.textAlign);
  
  if (cssCheck.flex && cssCheck.flex.includes('1')) {
    console.log('✅ CSS fix successfully applied!');
    
    // Now check alignment
    const alignment = await page.evaluate(() => {
      const trustIndicators = document.querySelectorAll('.trust-indicators .trust-indicator');
      const workflowSteps = document.querySelectorAll('.workflow-step');
      
      const results = [];
      
      for (let i = 0; i < Math.min(trustIndicators.length, workflowSteps.length); i++) {
        const trustRect = trustIndicators[i].getBoundingClientRect();
        const workflowRect = workflowSteps[i].getBoundingClientRect();
        
        const trustCenter = trustRect.left + trustRect.width / 2;
        const workflowCenter = workflowRect.left + workflowRect.width / 2;
        
        results.push({
          index: i + 1,
          trustCenter: Math.round(trustCenter),
          workflowCenter: Math.round(workflowCenter),
          misalignment: Math.abs(trustCenter - workflowCenter)
        });
      }
      
      return results;
    });
    
    console.log('\n📍 UPDATED ALIGNMENT CHECK:');
    let totalMisalignment = 0;
    alignment.forEach(item => {
      console.log(`   ${item.index}. Trust: ${item.trustCenter}px vs Workflow: ${item.workflowCenter}px`);
      console.log(`      → Misalignment: ${Math.round(item.misalignment)}px ${item.misalignment < 10 ? '✅' : '❌'}`);
      totalMisalignment += item.misalignment;
    });
    
    const avgMisalignment = totalMisalignment / alignment.length;
    console.log(`\n📊 Average misalignment: ${Math.round(avgMisalignment)}px`);
    
    if (avgMisalignment < 10) {
      console.log('🎉 SUCCESS: Trust indicators now properly aligned!');
    } else {
      console.log('⚠️  Still needs adjustment - may require browser hard refresh');
    }
    
  } else {
    console.log('❌ CSS fix not yet applied - may need browser cache clear');
    console.log('Try: Ctrl+Shift+R (hard refresh) or Ctrl+Shift+Delete (clear cache)');
  }
  
  await browser.close();
})();