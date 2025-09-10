const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function takeScreenshot() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'] 
  });
  
  const page = await browser.newPage();
  
  // Set viewport to desktop size
  await page.setViewport({ width: 1440, height: 900 });
  
  try {
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:3001', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot of the full page
    const screenshotPath = path.join(__dirname, 'homepage-screenshot.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    console.log(`Screenshot saved: ${screenshotPath}`);
    
    // Take a screenshot of just the hero section
    const heroElement = await page.$('.main-content');
    if (heroElement) {
      const heroScreenshotPath = path.join(__dirname, 'hero-section-screenshot.png');
      await heroElement.screenshot({ path: heroScreenshotPath });
      console.log(`Hero section screenshot saved: ${heroScreenshotPath}`);
    }
    
    // Get some basic measurements
    const measurements = await page.evaluate(() => {
      const pageTitle = document.querySelector('.page-title');
      const cardTitle = document.querySelector('.card-title');
      const sectionTitle = document.querySelector('.section-title');
      
      return {
        pageTitle: pageTitle ? {
          fontSize: window.getComputedStyle(pageTitle).fontSize,
          marginBottom: window.getComputedStyle(pageTitle).marginBottom,
          color: window.getComputedStyle(pageTitle).color
        } : null,
        cardTitle: cardTitle ? {
          fontSize: window.getComputedStyle(cardTitle).fontSize,
          marginBottom: window.getComputedStyle(cardTitle).marginBottom
        } : null,
        sectionTitle: sectionTitle ? {
          fontSize: window.getComputedStyle(sectionTitle).fontSize,
          marginBottom: window.getComputedStyle(sectionTitle).marginBottom
        } : null,
        pageUrl: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    });
    
    console.log('Style measurements:', JSON.stringify(measurements, null, 2));
    
    // Check if dev server is showing any errors
    const pageErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        pageErrors.push(msg.text());
      }
    });
    
    console.log('Page loaded successfully!');
    if (pageErrors.length > 0) {
      console.log('Console errors found:', pageErrors);
    }
    
  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    
    // Try to get page content for debugging
    try {
      const content = await page.content();
      console.log('Page title:', await page.title());
      console.log('Current URL:', page.url());
    } catch (e) {
      console.log('Could not get page content');
    }
  }
  
  await browser.close();
}

// Run the screenshot function
takeScreenshot().catch(console.error);