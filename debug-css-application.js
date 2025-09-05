const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Debugging CSS application on live form...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Navigate to the USMCA workflow page
    await page.goto('http://localhost:3000/usmca-workflow', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    // Wait for the form to load
    await page.waitForSelector('.form-section', { timeout: 10000 });
    
    console.log('📋 Form loaded, checking CSS application...');
    
    // Get detailed CSS analysis
    const cssAnalysis = await page.evaluate(() => {
      const results = {
        formSectionFound: false,
        formInputFound: false,
        formSelectFound: false,
        customPropertiesWorking: false,
        appliedStyles: {},
        cssVariables: {},
        issues: []
      };
      
      // Check form section
      const formSection = document.querySelector('.form-section');
      if (formSection) {
        results.formSectionFound = true;
        const styles = window.getComputedStyle(formSection);
        results.appliedStyles.formSection = {
          background: styles.background,
          padding: styles.padding,
          borderRadius: styles.borderRadius,
          border: styles.border,
          boxShadow: styles.boxShadow,
          maxWidth: styles.maxWidth,
          marginBottom: styles.marginBottom
        };
      } else {
        results.issues.push('❌ .form-section element not found');
      }
      
      // Check form input
      const formInput = document.querySelector('.form-input');
      if (formInput) {
        results.formInputFound = true;
        const styles = window.getComputedStyle(formInput);
        results.appliedStyles.formInput = {
          padding: styles.padding,
          border: styles.border,
          borderRadius: styles.borderRadius,
          fontSize: styles.fontSize,
          minHeight: styles.minHeight,
          boxShadow: styles.boxShadow,
          backgroundColor: styles.backgroundColor,
          color: styles.color
        };
        
        // Check if thick border is applied (should be 3px)
        if (!styles.border.includes('3px')) {
          results.issues.push(`❌ Form input border is "${styles.border}" - should be 3px thick`);
        }
        
        // Check if proper padding is applied (should be 1.25rem 1.5rem)
        if (!styles.padding.includes('20px') && !styles.padding.includes('1.25rem')) {
          results.issues.push(`❌ Form input padding is "${styles.padding}" - should be 1.25rem 1.5rem`);
        }
      } else {
        results.issues.push('❌ .form-input element not found');
      }
      
      // Check form select
      const formSelect = document.querySelector('.form-select');
      if (formSelect) {
        results.formSelectFound = true;
        const styles = window.getComputedStyle(formSelect);
        results.appliedStyles.formSelect = {
          padding: styles.padding,
          border: styles.border,
          borderRadius: styles.borderRadius,
          fontSize: styles.fontSize,
          minHeight: styles.minHeight,
          backgroundColor: styles.backgroundColor
        };
        
        if (!styles.border.includes('3px')) {
          results.issues.push(`❌ Form select border is "${styles.border}" - should be 3px thick`);
        }
      } else {
        results.issues.push('❌ .form-select element not found');
      }
      
      // Check CSS custom properties
      const computedStyle = window.getComputedStyle(document.documentElement);
      const cssVars = [
        '--navy-900', '--navy-700', '--blue-500', '--white', '--gray-300', '--gray-200',
        '--space-4', '--space-6', '--radius-base', '--shadow-md'
      ];
      
      cssVars.forEach(varName => {
        const value = computedStyle.getPropertyValue(varName);
        results.cssVariables[varName] = value || 'NOT_DEFINED';
        if (!value) {
          results.issues.push(`❌ CSS variable ${varName} not defined`);
        }
      });
      
      results.customPropertiesWorking = Object.values(results.cssVariables).every(val => val !== 'NOT_DEFINED');
      
      return results;
    });
    
    console.log('\n📊 CSS ANALYSIS RESULTS:');
    console.log('='.repeat(50));
    
    console.log(`\n🎯 Elements Found:`);
    console.log(`   Form Section: ${cssAnalysis.formSectionFound ? '✅' : '❌'}`);
    console.log(`   Form Input: ${cssAnalysis.formInputFound ? '✅' : '❌'}`);
    console.log(`   Form Select: ${cssAnalysis.formSelectFound ? '✅' : '❌'}`);
    
    console.log(`\n🎨 CSS Variables Working: ${cssAnalysis.customPropertiesWorking ? '✅' : '❌'}`);
    
    if (Object.keys(cssAnalysis.cssVariables).length > 0) {
      console.log('\n🔧 CSS Variables:');
      Object.entries(cssAnalysis.cssVariables).forEach(([key, value]) => {
        const status = value === 'NOT_DEFINED' ? '❌' : '✅';
        console.log(`   ${status} ${key}: ${value}`);
      });
    }
    
    if (cssAnalysis.appliedStyles.formInput) {
      console.log('\n📝 Form Input Styles:');
      Object.entries(cssAnalysis.appliedStyles.formInput).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
    
    if (cssAnalysis.appliedStyles.formSelect) {
      console.log('\n📋 Form Select Styles:');
      Object.entries(cssAnalysis.appliedStyles.formSelect).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
    
    if (cssAnalysis.issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      cssAnalysis.issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('\n✅ No CSS issues detected!');
    }
    
    console.log('\n' + '='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error during CSS analysis:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();