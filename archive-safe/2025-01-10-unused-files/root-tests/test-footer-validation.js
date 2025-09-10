// Footer Validation Test for Solutions Page
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testFooterImplementation() {
  console.log('🚀 Starting Footer Validation Test for Solutions Page');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  const testResults = {
    desktop: null,
    mobile: null,
    tablet: null,
    validation: {
      structure: false,
      content: false,
      typography: false,
      links: false,
      copyright: false,
      responsive: false,
      professional: false
    }
  };
  
  try {
    // Navigate to solutions page
    console.log('📍 Navigating to http://localhost:3000/solutions');
    await page.goto('http://localhost:3000/solutions', { waitUntil: 'networkidle2' });
    
    // Wait for footer to load
    await page.waitForSelector('footer', { timeout: 10000 });
    
    // 1. Desktop Testing (1920x1080)
    console.log('🖥️ Testing Desktop Layout (1920x1080)');
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Scroll to footer
    await page.evaluate(() => {
      document.querySelector('footer').scrollIntoView({ behavior: 'smooth' });
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take desktop screenshot
    const desktopScreenshot = await page.screenshot({ 
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
      fullPage: false 
    });
    fs.writeFileSync('footer-desktop-test.png', desktopScreenshot);
    testResults.desktop = 'footer-desktop-test.png';
    
    // Validate desktop structure
    const desktopFooterStructure = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      const grid = footer.querySelector('.grid-3-cols');
      const columns = grid ? grid.children.length : 0;
      
      return {
        hasFooter: !!footer,
        hasGrid: !!grid,
        columnCount: columns,
        hasGradient: footer.classList.contains('gradient-subtle'),
        hasMainContent: footer.classList.contains('main-content')
      };
    });
    
    console.log('✅ Desktop Structure:', desktopFooterStructure);
    testResults.validation.structure = desktopFooterStructure.columnCount === 3;
    
    // 2. iPhone 15 Testing (393x852)
    console.log('📱 Testing iPhone 15 Layout (393x852)');
    await page.setViewport({ width: 393, height: 852 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Scroll to footer again
    await page.evaluate(() => {
      document.querySelector('footer').scrollIntoView({ behavior: 'smooth' });
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take mobile screenshot
    const mobileScreenshot = await page.screenshot({ 
      clip: { x: 0, y: 0, width: 393, height: 852 },
      fullPage: false 
    });
    fs.writeFileSync('footer-mobile-test.png', mobileScreenshot);
    testResults.mobile = 'footer-mobile-test.png';
    
    // 3. iPad Pro Testing (1024x1366)
    console.log('📱 Testing iPad Pro Layout (1024x1366)');
    await page.setViewport({ width: 1024, height: 1366 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Scroll to footer
    await page.evaluate(() => {
      document.querySelector('footer').scrollIntoView({ behavior: 'smooth' });
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take tablet screenshot
    const tabletScreenshot = await page.screenshot({ 
      clip: { x: 0, y: 0, width: 1024, height: 1366 },
      fullPage: false 
    });
    fs.writeFileSync('footer-tablet-test.png', tabletScreenshot);
    testResults.tablet = 'footer-tablet-test.png';
    
    // 4. Content Validation
    console.log('📋 Validating Footer Content');
    const footerContent = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      const companyTitle = footer.querySelector('.section-header-title');
      const solutionsTitle = footer.querySelectorAll('.content-card-title')[0];
      const companyLinksTitle = footer.querySelectorAll('.content-card-title')[1];
      const copyright = footer.querySelector('.section-header');
      
      const navLinks = Array.from(footer.querySelectorAll('.nav-link')).map(link => ({
        text: link.textContent.trim(),
        href: link.href
      }));
      
      return {
        companyTitle: companyTitle ? companyTitle.textContent.trim() : null,
        solutionsTitle: solutionsTitle ? solutionsTitle.textContent.trim() : null,
        companyLinksTitle: companyLinksTitle ? companyLinksTitle.textContent.trim() : null,
        hasCopyright: !!copyright,
        copyrightText: copyright ? copyright.textContent.trim() : null,
        navLinks: navLinks,
        totalLinks: navLinks.length
      };
    });
    
    console.log('✅ Footer Content:', footerContent);
    testResults.validation.content = footerContent.companyTitle === 'TradeFlow Intelligence';
    testResults.validation.links = footerContent.totalLinks >= 7; // Should have multiple nav links
    testResults.validation.copyright = footerContent.copyrightText.includes('2024 TradeFlow Intelligence');
    
    // 5. Typography Validation
    const typographyValidation = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      const sectionTitle = footer.querySelector('.section-header-title');
      const cardTitles = footer.querySelectorAll('.content-card-title');
      const bodyText = footer.querySelectorAll('.text-body');
      
      return {
        hasSectionTitle: !!sectionTitle,
        cardTitlesCount: cardTitles.length,
        bodyTextCount: bodyText.length,
        sectionTitleClass: sectionTitle ? sectionTitle.className : null,
        cardTitleClasses: Array.from(cardTitles).map(el => el.className),
        bodyTextClasses: Array.from(bodyText).map(el => el.className)
      };
    });
    
    console.log('✅ Typography Validation:', typographyValidation);
    testResults.validation.typography = typographyValidation.cardTitlesCount >= 2;
    
    // 6. Link Functionality Test
    console.log('🔗 Testing Link Functionality');
    const linkTest = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('footer .nav-link'));
      return links.map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        hasValidHref: link.href && link.href !== '#' && link.href.includes('/')
      }));
    });
    
    console.log('✅ Link Test Results:', linkTest);
    testResults.validation.links = linkTest.every(link => link.hasValidHref);
    
    // 7. Professional Appearance Check
    const professionalCheck = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      const computedStyle = window.getComputedStyle(footer);
      
      return {
        hasGradientBg: footer.classList.contains('gradient-subtle'),
        hasMainContent: footer.classList.contains('main-content'),
        backgroundColor: computedStyle.backgroundColor,
        padding: computedStyle.padding,
        containerClass: footer.querySelector('.container-app') ? 'container-app' : null
      };
    });
    
    console.log('✅ Professional Check:', professionalCheck);
    testResults.validation.professional = professionalCheck.hasGradientBg && professionalCheck.hasMainContent;
    
    // Calculate overall validation score
    const validationScore = Object.values(testResults.validation).filter(Boolean).length;
    const totalValidations = Object.keys(testResults.validation).length;
    
    console.log('\n🎯 FOOTER VALIDATION RESULTS:');
    console.log('================================');
    console.log(`Structure (3-column): ${testResults.validation.structure ? '✅' : '❌'}`);
    console.log(`Content Organization: ${testResults.validation.content ? '✅' : '❌'}`);
    console.log(`Typography Hierarchy: ${testResults.validation.typography ? '✅' : '❌'}`);
    console.log(`Link Functionality: ${testResults.validation.links ? '✅' : '❌'}`);
    console.log(`Copyright Notice: ${testResults.validation.copyright ? '✅' : '❌'}`);
    console.log(`Professional Style: ${testResults.validation.professional ? '✅' : '❌'}`);
    console.log(`Overall Score: ${validationScore}/${totalValidations}`);
    console.log('================================');
    
    if (validationScore === totalValidations) {
      console.log('🎉 ALL VALIDATIONS PASSED! Footer implementation is enterprise-ready.');
    } else {
      console.log(`⚠️ ${totalValidations - validationScore} validation(s) failed. Review needed.`);
    }
    
    // Save test results
    fs.writeFileSync('footer-test-results.json', JSON.stringify(testResults, null, 2));
    console.log('💾 Test results saved to footer-test-results.json');
    console.log('📸 Screenshots saved: footer-desktop-test.png, footer-mobile-test.png, footer-tablet-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testResults.error = error.message;
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run the test
if (require.main === module) {
  testFooterImplementation().then(results => {
    console.log('\n✅ Footer validation test completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { testFooterImplementation };