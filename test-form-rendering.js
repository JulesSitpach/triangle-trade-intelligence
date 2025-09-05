const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Testing actual form rendering...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100 
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the USMCA workflow page
    console.log('📋 Navigating to USMCA workflow...');
    await page.goto('http://localhost:3000/usmca-workflow', { waitUntil: 'networkidle0' });
    
    // Wait for the form to load
    console.log('⏱️ Waiting for form to load...');
    await page.waitForSelector('.form-section', { timeout: 10000 });
    
    // Check if CSS classes are applied
    console.log('🎨 Checking CSS class application...');
    
    const formSection = await page.evaluate(() => {
      const section = document.querySelector('.form-section');
      if (!section) return null;
      
      const styles = window.getComputedStyle(section);
      return {
        background: styles.background,
        padding: styles.padding,
        borderRadius: styles.borderRadius,
        border: styles.border,
        boxShadow: styles.boxShadow,
        maxWidth: styles.maxWidth
      };
    });
    
    console.log('📊 Form section computed styles:', formSection);
    
    const inputStyles = await page.evaluate(() => {
      const input = document.querySelector('.form-input');
      if (!input) return null;
      
      const styles = window.getComputedStyle(input);
      return {
        padding: styles.padding,
        border: styles.border,
        borderRadius: styles.borderRadius,
        fontSize: styles.fontSize,
        minHeight: styles.minHeight,
        boxShadow: styles.boxShadow
      };
    });
    
    console.log('🔤 Input computed styles:', inputStyles);
    
    // Take a screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: 'form-rendering-test.png',
      fullPage: true 
    });
    
    console.log('✅ Test complete - screenshot saved as form-rendering-test.png');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
  
  await browser.close();
})();