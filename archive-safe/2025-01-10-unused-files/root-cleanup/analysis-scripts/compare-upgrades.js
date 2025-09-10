const { chromium } = require('playwright');

(async () => {
  console.log('📊 VISUAL UPGRADE COMPARISON');
  console.log('=' .repeat(50));
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: false,
      channel: 'chrome',
      slowMo: 100 
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000/usmca-workflow', { waitUntil: 'networkidle' });
    await page.waitForSelector('.form-section', { timeout: 10000 });

    console.log('📸 Capturing UPGRADED interface screenshot...');
    await page.screenshot({
      path: 'upgraded-interface.png',
      fullPage: true,
      animations: 'disabled'
    });

    // Quick visual assessment
    const visualCheck = await page.evaluate(() => {
      const results = {
        formSectionPadding: '',
        sectionTitleSize: '',
        sectionTitleWeight: '',
        colorScheme: '',
        headingHierarchy: ''
      };

      const formSection = document.querySelector('.form-section');
      if (formSection) {
        const styles = window.getComputedStyle(formSection);
        results.formSectionPadding = styles.padding;
      }

      const sectionTitle = document.querySelector('.form-section-title');
      if (sectionTitle) {
        const styles = window.getComputedStyle(sectionTitle);
        results.sectionTitleSize = styles.fontSize;
        results.sectionTitleWeight = styles.fontWeight;
      }

      // Check color scheme
      const navyElements = document.querySelectorAll('*');
      let professionalColors = 0;
      navyElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.color.includes('1, 42, 73') || styles.color.includes('19, 65, 105')) {
          professionalColors++;
        }
      });
      results.colorScheme = `${professionalColors} elements using professional navy colors`;

      return results;
    });

    console.log('\n✅ UPGRADE VERIFICATION:');
    console.log(`   📏 Form section padding: ${visualCheck.formSectionPadding} (was 32px)`);
    console.log(`   📝 Section title size: ${visualCheck.sectionTitleSize} (was 18px)`);
    console.log(`   💪 Section title weight: ${visualCheck.sectionTitleWeight} (was 600)`);
    console.log(`   🎨 ${visualCheck.colorScheme}`);

    console.log('\n📁 COMPARISON SCREENSHOTS:');
    console.log('   📄 Previous: analysis-desktop-baseline.png');
    console.log('   📄 Upgraded: upgraded-interface.png');
    
    console.log('\n🎯 EXPECTED IMPROVEMENTS:');
    console.log('   ✅ Increased form section padding (32px → 48px)');
    console.log('   ✅ Stronger typography hierarchy (font-weight 600 → 700)'); 
    console.log('   ✅ Larger section titles (18px → 24px)');
    console.log('   ✅ Enhanced government color palette');
    console.log('   ✅ Better spacing throughout (3rem instead of 2.5rem)');
    
  } catch (error) {
    console.error('❌ Comparison error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();