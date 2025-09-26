const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🚀 Testing broker dashboard...');

  try {
    await page.goto('http://localhost:3000/admin/broker-dashboard', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const title = await page.title();
    console.log('✅ Page title:', title);

    const error = await page.evaluate(() => {
      return document.body.innerText.includes('missing required error components');
    });

    if (error) {
      console.log('❌ Still showing error message');
    } else {
      console.log('✅ Dashboard loaded successfully!');
    }

    await page.screenshot({ path: 'dashboard-test.png', fullPage: true });
    console.log('📸 Screenshot saved as dashboard-test.png');

    await browser.close();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await browser.close();
  }
})();