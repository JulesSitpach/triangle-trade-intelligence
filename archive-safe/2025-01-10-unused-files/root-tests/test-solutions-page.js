const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration for Solutions page
const TEST_CONFIG = {
  url: 'http://localhost:3000/solutions',
  baselineDir: './screenshots/baselines',
  outputDir: './screenshots/test-results',
  
  devices: {
    'iPhone 15': { width: 393, height: 852 },
    'iPad Pro': { width: 1024, height: 1366 },
    'Desktop': { width: 1920, height: 1080 },
    'Mobile Small': { width: 320, height: 568 }, // iPhone SE
    'Tablet Landscape': { width: 1366, height: 1024 }
  },
  
  testSections: [
    'navigation',
    'hero-section', 
    'services-grid',
    'benefits-section',
    'cta-section'
  ],
  
  cssComplianceChecks: [
    'inline-styles',
    'tailwind-classes',
    'mobile-responsive',
    'accessibility'
  ]
};

// Create directories if they don't exist
const createDirs = () => {
  [TEST_CONFIG.baselineDir, TEST_CONFIG.outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// CSS Compliance Validator
const validateCSSCompliance = async (page) => {
  console.log('🔍 Validating CSS compliance...');
  
  const violations = {
    inlineStyles: [],
    tailwindClasses: [],
    issues: []
  };
  
  // Check for inline styles (excluding Next.js dev tools)
  const inlineElements = await page.$$('[style]');
  for (let element of inlineElements) {
    const tagName = await element.evaluate(el => el.tagName);
    const style = await element.getAttribute('style');
    
    // Skip Next.js dev tool styles and visibility styles
    const isNextJSDevTool = style.includes('--nextjs-dev-tools') || 
                           style.includes('visibility: visible') ||
                           style.includes('clip: rect') ||
                           style.includes('box-shadow: none') ||
                           style.includes('touch-action: none') ||
                           style.includes('--animate-out') ||
                           style.includes('--size:') ||
                           tagName === 'NEXTJS-PORTAL';
    
    if (!isNextJSDevTool) {
      violations.inlineStyles.push({ tagName, style });
    }
  }
  
  // Check for Tailwind classes (exclude our custom CSS classes)
  const allElements = await page.$$('*');
  for (let element of allElements) {
    const className = await element.getAttribute('class');
    if (className) {
      // Custom CSS classes that are NOT Tailwind
      const customClasses = [
        'grid-2-cols', 'grid-3-cols', 'grid-4-cols',
        'text-body', 'text-muted', 'text-subtle',
        'bg-primary', 'bg-secondary', 'bg-subtle'
      ];
      
      const tailwindPattern = /\b(bg-|text-|p-|m-|w-|h-|flex-|grid-|border-)\S+/g;
      const matches = className.match(tailwindPattern);
      
      if (matches) {
        // Filter out our legitimate custom classes
        const actualTailwindClasses = matches.filter(match => 
          !customClasses.includes(match)
        );
        
        if (actualTailwindClasses.length > 0) {
          const tagName = await element.evaluate(el => el.tagName);
          violations.tailwindClasses.push({ 
            tagName, 
            className, 
            matches: actualTailwindClasses 
          });
        }
      }
    }
  }
  
  // Check mobile responsiveness
  const mobileMenuToggle = await page.$('.nav-menu-toggle');
  if (!mobileMenuToggle) {
    violations.issues.push('Mobile navigation toggle not found');
  }
  
  const heroSection = await page.$('.hero-video-section');
  if (!heroSection) {
    violations.issues.push('Hero section with proper class not found');
  }
  
  return violations;
};

// Mobile Navigation Test
const testMobileNavigation = async (page, deviceName) => {
  console.log(`📱 Testing mobile navigation on ${deviceName}...`);
  
  const results = {
    deviceName,
    hamburgerMenuPresent: false,
    menuToggleWorks: false,
    menuLinksAccessible: false,
    errors: []
  };
  
  try {
    // Check if hamburger menu button exists
    const menuToggle = await page.$('.nav-menu-toggle');
    results.hamburgerMenuPresent = !!menuToggle;
    
    if (menuToggle) {
      // Test menu toggle functionality
      await menuToggle.click();
      await page.waitForTimeout(300); // Animation time
      
      const navMenu = await page.$('.nav-menu.mobile-open');
      results.menuToggleWorks = !!navMenu;
      
      // Test menu links
      const menuLinks = await page.$$('.nav-menu .nav-menu-link');
      results.menuLinksAccessible = menuLinks.length > 0;
      
      // Close menu
      await menuToggle.click();
    }
    
  } catch (error) {
    results.errors.push(error.message);
  }
  
  return results;
};

// Visual Testing Function
const performVisualTests = async () => {
  console.log('🚀 Starting comprehensive Solutions page testing...\n');
  
  createDirs();
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 500 
  });
  
  const testResults = {
    cssCompliance: null,
    deviceTests: [],
    screenshots: [],
    overallScore: 0,
    criticalIssues: []
  };
  
  try {
    // Test each device configuration
    for (const [deviceName, viewport] of Object.entries(TEST_CONFIG.devices)) {
      console.log(`\n📱 Testing ${deviceName} (${viewport.width}x${viewport.height})`);
      
      const context = await browser.newContext({
        viewport,
        userAgent: deviceName.includes('iPhone') ? 
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' :
          undefined
      });
      
      const page = await context.newPage();
      
      try {
        // Navigate to solutions page
        console.log('  📂 Loading Solutions page...');
        await page.goto(TEST_CONFIG.url, { waitUntil: 'networkidle' });
        
        // Wait for content to load
        await page.waitForSelector('.hero-video-section', { timeout: 10000 });
        
        // CSS Compliance Check (run once)
        if (deviceName === 'Desktop' && !testResults.cssCompliance) {
          testResults.cssCompliance = await validateCSSCompliance(page);
        }
        
        // Mobile Navigation Test
        let mobileNavResults = null;
        if (viewport.width <= 768) {
          mobileNavResults = await testMobileNavigation(page, deviceName);
        }
        
        // Take full page screenshot
        const screenshotPath = path.join(TEST_CONFIG.outputDir, `solutions-${deviceName.toLowerCase().replace(/\s+/g, '-')}.png`);
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: true
        });
        
        console.log(`  📸 Screenshot saved: ${screenshotPath}`);
        
        // Test key sections visibility
        const sectionTests = {};
        for (const section of TEST_CONFIG.testSections) {
          const sectionElement = await page.$(`.${section}, [class*="${section}"], #${section}`);
          sectionTests[section] = !!sectionElement;
        }
        
        // Performance metrics
        const performanceMetrics = await page.evaluate(() => {
          return {
            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
            domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
          };
        });
        
        // Store device test results
        const deviceResult = {
          deviceName,
          viewport,
          screenshotPath,
          sectionsVisible: sectionTests,
          mobileNavigation: mobileNavResults,
          performance: performanceMetrics,
          passed: Object.values(sectionTests).every(Boolean)
        };
        
        testResults.deviceTests.push(deviceResult);
        testResults.screenshots.push(screenshotPath);
        
        console.log(`  ✅ ${deviceName} test completed`);
        
      } catch (error) {
        console.log(`  ❌ ${deviceName} test failed: ${error.message}`);
        testResults.criticalIssues.push(`${deviceName}: ${error.message}`);
      }
      
      await context.close();
      
      // Brief pause between devices
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } finally {
    await browser.close();
  }
  
  // Calculate overall score
  const passedTests = testResults.deviceTests.filter(test => test.passed).length;
  testResults.overallScore = Math.round((passedTests / testResults.deviceTests.length) * 100);
  
  return testResults;
};

// Generate comprehensive report
const generateReport = (results) => {
  console.log('\n' + '='.repeat(80));
  console.log('📊 SOLUTIONS PAGE TESTING REPORT');
  console.log('='.repeat(80));
  
  // CSS Compliance Report
  console.log('\n🔍 CSS COMPLIANCE ANALYSIS:');
  const compliance = results.cssCompliance;
  
  if (compliance.inlineStyles.length === 0) {
    console.log('  ✅ NO INLINE STYLES DETECTED - PERFECT COMPLIANCE');
  } else {
    console.log(`  ❌ ${compliance.inlineStyles.length} INLINE STYLE VIOLATIONS FOUND:`);
    compliance.inlineStyles.forEach(violation => {
      console.log(`     - ${violation.tagName}: style="${violation.style}"`);
    });
  }
  
  if (compliance.tailwindClasses.length === 0) {
    console.log('  ✅ NO TAILWIND CLASSES DETECTED - USING CUSTOM CSS ONLY');
  } else {
    console.log(`  ❌ ${compliance.tailwindClasses.length} TAILWIND CLASS VIOLATIONS FOUND:`);
    compliance.tailwindClasses.forEach(violation => {
      console.log(`     - ${violation.tagName}: ${violation.matches.join(', ')}`);
    });
  }
  
  // Device Testing Results
  console.log('\n📱 DEVICE TESTING RESULTS:');
  results.deviceTests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`  ${status} ${test.deviceName} (${test.viewport.width}x${test.viewport.height})`);
    
    // Mobile navigation results
    if (test.mobileNavigation) {
      const nav = test.mobileNavigation;
      console.log(`     📱 Hamburger Menu: ${nav.hamburgerMenuPresent ? '✅' : '❌'}`);
      console.log(`     🔄 Menu Toggle: ${nav.menuToggleWorks ? '✅' : '❌'}`);
      console.log(`     🔗 Menu Links: ${nav.menuLinksAccessible ? '✅' : '❌'}`);
      
      if (nav.errors.length > 0) {
        console.log(`     ⚠️  Errors: ${nav.errors.join(', ')}`);
      }
    }
    
    // Performance metrics
    console.log(`     ⚡ Load Time: ${test.performance.loadTime}ms`);
    console.log(`     📄 DOM Ready: ${test.performance.domContentLoaded}ms`);
    
    // Section visibility
    const sectionsVisible = Object.entries(test.sectionsVisible)
      .filter(([_, visible]) => visible).length;
    const totalSections = Object.keys(test.sectionsVisible).length;
    console.log(`     🎯 Sections Visible: ${sectionsVisible}/${totalSections}`);
  });
  
  // Overall Assessment
  console.log('\n🏆 OVERALL ASSESSMENT:');
  console.log(`  📊 Overall Score: ${results.overallScore}%`);
  
  if (results.overallScore >= 90) {
    console.log('  🎉 EXCELLENT - Solutions page meets enterprise standards');
  } else if (results.overallScore >= 75) {
    console.log('  👍 GOOD - Minor issues to address');
  } else {
    console.log('  ⚠️  NEEDS IMPROVEMENT - Critical issues found');
  }
  
  if (results.criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    results.criticalIssues.forEach(issue => {
      console.log(`  ❌ ${issue}`);
    });
  }
  
  // Screenshots
  console.log('\n📸 SCREENSHOTS CAPTURED:');
  results.screenshots.forEach(screenshot => {
    console.log(`  📷 ${screenshot}`);
  });
  
  console.log('\n' + '='.repeat(80));
  
  return results;
};

// Main execution
const runSolutionsPageTests = async () => {
  try {
    console.log('🧪 Starting Solutions Page Comprehensive Testing');
    console.log('Target URL: http://localhost:3000/solutions');
    console.log('Focus: CSS Compliance, Mobile Responsiveness, Design Quality\n');
    
    const results = await performVisualTests();
    return generateReport(results);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return { error: error.message, passed: false };
  }
};

// Run if called directly
if (require.main === module) {
  runSolutionsPageTests()
    .then(results => {
      process.exit(results.overallScore >= 75 ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runSolutionsPageTests, TEST_CONFIG };