const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Analyzing Trust Indicator Alignment...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    channel: 'chrome',
    slowMo: 100 
  });
  
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/usmca-workflow');
  await page.waitForSelector('.trust-indicators');
  
  const alignment = await page.evaluate(() => {
    const trustContainer = document.querySelector('.trust-indicators');
    const workflowContainer = document.querySelector('.workflow-progress');
    
    if (!trustContainer || !workflowContainer) {
      return { error: 'Containers not found' };
    }
    
    const trustRect = trustContainer.getBoundingClientRect();
    const workflowRect = workflowContainer.getBoundingClientRect();
    
    const trustIndicators = document.querySelectorAll('.trust-indicator');
    const workflowSteps = document.querySelectorAll('.workflow-step');
    
    const results = {
      containers: {
        trust: {
          width: Math.round(trustRect.width),
          left: Math.round(trustRect.left),
          center: Math.round(trustRect.left + trustRect.width/2)
        },
        workflow: {
          width: Math.round(workflowRect.width),
          left: Math.round(workflowRect.left),
          center: Math.round(workflowRect.left + workflowRect.width/2)
        }
      },
      misalignment: Math.abs(trustRect.left - workflowRect.left),
      trustIndicators: [],
      workflowSteps: []
    };
    
    trustIndicators.forEach((indicator, i) => {
      const rect = indicator.getBoundingClientRect();
      const textContent = indicator.textContent.trim().split('\n')[0];
      results.trustIndicators.push({
        index: i,
        text: textContent,
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        center: Math.round(rect.left + rect.width/2)
      });
    });
    
    workflowSteps.forEach((step, i) => {
      const rect = step.getBoundingClientRect();
      const numberElement = step.querySelector('.workflow-step-indicator');
      const labelElement = step.querySelector('.workflow-step-label');
      results.workflowSteps.push({
        index: i,
        number: numberElement ? numberElement.textContent.trim() : 'N/A',
        label: labelElement ? labelElement.textContent.trim() : 'N/A',
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        center: Math.round(rect.left + rect.width/2)
      });
    });
    
    return results;
  });
  
  console.log('📊 ALIGNMENT ANALYSIS RESULTS');
  console.log('=' .repeat(50));
  
  if (alignment.error) {
    console.log('❌ Error:', alignment.error);
    await browser.close();
    return;
  }
  
  console.log('🏗️  CONTAINER COMPARISON:');
  console.log(`   Trust Indicators: ${alignment.containers.trust.width}px wide, starts at ${alignment.containers.trust.left}px`);
  console.log(`   Workflow Steps:   ${alignment.containers.workflow.width}px wide, starts at ${alignment.containers.workflow.left}px`);
  console.log(`   Container Misalignment: ${Math.round(alignment.misalignment)}px`);
  
  console.log('\n📍 ELEMENT POSITIONS:');
  for (let i = 0; i < Math.max(alignment.trustIndicators.length, alignment.workflowSteps.length); i++) {
    const trust = alignment.trustIndicators[i];
    const workflow = alignment.workflowSteps[i];
    
    if (trust && workflow) {
      const centerDiff = Math.abs(trust.center - workflow.center);
      console.log(`   ${i + 1}. "${trust.text}" (center: ${trust.center}px) vs "${workflow.label}" (center: ${workflow.center}px)`);
      console.log(`      → Misalignment: ${centerDiff}px ${centerDiff > 10 ? '❌ SIGNIFICANT' : '✅ OK'}`);
    }
  }
  
  // Calculate the fix needed
  const avgMisalignment = alignment.trustIndicators.reduce((sum, trust, i) => {
    const workflow = alignment.workflowSteps[i];
    return workflow ? sum + Math.abs(trust.center - workflow.center) : sum;
  }, 0) / alignment.trustIndicators.length;
  
  console.log('\n💡 RECOMMENDED FIX:');
  if (avgMisalignment > 10) {
    console.log(`   Average misalignment: ${Math.round(avgMisalignment)}px`);
    
    if (alignment.containers.trust.width !== alignment.containers.workflow.width) {
      console.log('   📏 Container width mismatch detected');
      console.log(`   🔧 Solution: Make .trust-indicators width match .workflow-progress width`);
      console.log(`   CSS: .trust-indicators { max-width: ${alignment.containers.workflow.width}px }`);
    }
    
    if (Math.abs(alignment.containers.trust.left - alignment.containers.workflow.left) > 5) {
      console.log('   📐 Container position mismatch detected');
      console.log('   🔧 Solution: Ensure both containers have identical centering');
    }
  } else {
    console.log('   ✅ Alignment appears acceptable (within 10px tolerance)');
  }
  
  await browser.close();
})();