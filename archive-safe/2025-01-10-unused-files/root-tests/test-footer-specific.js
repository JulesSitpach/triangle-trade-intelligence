// Specific Footer Screenshot Test
const puppeteer = require('puppeteer');
const fs = require('fs');

async function captureFooterScreenshots() {
  console.log('🔍 Capturing specific footer screenshots');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to solutions page
    await page.goto('http://localhost:3000/solutions', { waitUntil: 'networkidle2' });
    
    // Wait for footer to load
    await page.waitForSelector('footer', { timeout: 10000 });
    
    // Desktop Footer (1920x1080)
    console.log('📸 Desktop Footer Screenshot');
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get footer element and its position
    const footerElement = await page.$('footer');
    const footerBox = await footerElement.boundingBox();
    
    console.log('Footer bounding box:', footerBox);
    
    // Take screenshot of just the footer
    const desktopFooter = await footerElement.screenshot();
    fs.writeFileSync('footer-desktop-only.png', desktopFooter);
    
    // Mobile Footer (iPhone 15: 393x852)
    console.log('📱 Mobile Footer Screenshot');
    await page.setViewport({ width: 393, height: 852 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileFooter = await footerElement.screenshot();
    fs.writeFileSync('footer-mobile-only.png', mobileFooter);
    
    // Tablet Footer (iPad Pro: 1024x1366)
    console.log('📱 Tablet Footer Screenshot');
    await page.setViewport({ width: 1024, height: 1366 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const tabletFooter = await footerElement.screenshot();
    fs.writeFileSync('footer-tablet-only.png', tabletFooter);
    
    // Test responsive behavior
    console.log('🔧 Testing Responsive Behavior');
    
    // Desktop - Check grid columns
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const desktopGrid = await page.evaluate(() => {
      const grid = document.querySelector('footer .grid-3-cols');
      const computedStyle = window.getComputedStyle(grid);
      return {
        display: computedStyle.display,
        gridTemplateColumns: computedStyle.gridTemplateColumns,
        gap: computedStyle.gap,
        flexDirection: computedStyle.flexDirection
      };
    });
    
    console.log('Desktop Grid:', desktopGrid);
    
    // Mobile - Check if grid stacks
    await page.setViewport({ width: 393, height: 852 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mobileGrid = await page.evaluate(() => {
      const grid = document.querySelector('footer .grid-3-cols');
      const computedStyle = window.getComputedStyle(grid);
      return {
        display: computedStyle.display,
        gridTemplateColumns: computedStyle.gridTemplateColumns,
        gap: computedStyle.gap,
        flexDirection: computedStyle.flexDirection
      };
    });
    
    console.log('Mobile Grid:', mobileGrid);
    
    // Check if responsive breakpoint is working
    const isResponsive = desktopGrid.gridTemplateColumns !== mobileGrid.gridTemplateColumns ||
                        desktopGrid.gridTemplateColumns.includes('1fr 1fr 1fr') && 
                        mobileGrid.gridTemplateColumns.includes('1fr');
    
    console.log('🎯 Responsive Test Result:', isResponsive ? '✅ RESPONSIVE' : '❌ NOT RESPONSIVE');
    
    // Footer content analysis
    const footerAnalysis = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      const gridCols = footer.querySelector('.grid-3-cols');
      const columns = gridCols ? Array.from(gridCols.children) : [];
      
      return {
        footerClasses: footer.className,
        hasGradient: footer.classList.contains('gradient-subtle'),
        hasMainContent: footer.classList.contains('main-content'),
        gridColumns: columns.length,
        columnContent: columns.map((col, index) => ({
          index: index,
          hasTitle: !!col.querySelector('.section-header-title, .content-card-title'),
          titleText: col.querySelector('.section-header-title, .content-card-title')?.textContent?.trim(),
          linkCount: col.querySelectorAll('.nav-link').length,
          textElements: col.querySelectorAll('.text-body').length
        })),
        copyrightSection: footer.querySelector('.section-header') ? {
          text: footer.querySelector('.section-header').textContent.trim(),
          hasMultipleParagraphs: footer.querySelectorAll('.section-header .text-body').length > 1
        } : null
      };
    });
    
    console.log('📋 Footer Analysis:', JSON.stringify(footerAnalysis, null, 2));
    
    console.log('✅ Footer screenshots captured successfully');
    console.log('📸 Files saved: footer-desktop-only.png, footer-mobile-only.png, footer-tablet-only.png');
    
  } catch (error) {
    console.error('❌ Error capturing footer screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
captureFooterScreenshots().then(() => {
  console.log('🎉 Footer screenshot test completed');
}).catch(error => {
  console.error('❌ Screenshot test failed:', error);
});