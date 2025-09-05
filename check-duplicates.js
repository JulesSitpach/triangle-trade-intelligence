const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Checking for duplicate trust indicators...');
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true, 
      channel: 'chrome'
    });
    
    const page = await browser.newPage();
    await page.goto('http://localhost:3000/usmca-workflow');
    await page.waitForSelector('.workflow-progress');
    
    const count = await page.evaluate(() => {
      // Count all trust indicator elements
      const simpleIndicators = document.querySelectorAll('.trust-indicators .trust-indicator');
      const containerIndicators = document.querySelectorAll('.trust-indicators-container .trust-indicator');
      
      return {
        simple: simpleIndicators.length,
        container: containerIndicators.length,
        total: simpleIndicators.length + containerIndicators.length,
        simpleTexts: Array.from(simpleIndicators).map(el => el.textContent.trim()),
        containerTexts: Array.from(containerIndicators).map(el => {
          const title = el.querySelector('.trust-title');
          return title ? title.textContent.trim() : 'No title';
        })
      };
    });
    
    console.log('📊 Trust Indicator Count:');
    console.log(`   Simple indicators (.trust-indicators): ${count.simple}`);
    console.log(`   Container indicators (.trust-indicators-container): ${count.container}`);
    console.log(`   Total: ${count.total}`);
    
    if (count.simple > 0) {
      console.log('❌ Simple indicators found (should be removed):');
      count.simpleTexts.forEach((text, i) => console.log(`      ${i + 1}. "${text}"`));
    }
    
    if (count.container > 0) {
      console.log('✅ Container indicators found (correct):');
      count.containerTexts.forEach((text, i) => console.log(`      ${i + 1}. "${text}"`));
    }
    
    if (count.simple === 0 && count.container === 3) {
      console.log('🎉 SUCCESS: Duplicates removed, only detailed trust indicators remain!');
    } else if (count.simple > 0) {
      console.log('⚠️  Still have duplicates - simple indicators not fully removed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) await browser.close();
  }
})();