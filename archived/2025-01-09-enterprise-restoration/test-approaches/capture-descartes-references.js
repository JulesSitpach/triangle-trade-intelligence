#!/usr/bin/env node

/**
 * Descartes Reference Screenshot Capture System
 * Captures high-quality reference screenshots from Descartes-inspired designs
 * for visual comparison and design compliance validation
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Descartes Design Reference Sources
const DESCARTES_SOURCES = {
  // Actual Descartes website for authentic design reference
  references: [
    {
      name: 'descartes-homepage',
      url: 'https://www.descartes.com/home',
      description: 'Authentic Descartes homepage with professional B2B design',
      components: ['navigation', 'hero', 'cards', 'buttons', 'forms']
    },
    {
      name: 'descartes-solutions',
      url: 'https://www.descartes.com/solutions',
      description: 'Descartes solutions page with enterprise design patterns',
      components: ['navigation', 'cards', 'features', 'buttons']
    },
    {
      name: 'descartes-products',
      url: 'https://www.descartes.com/products',
      description: 'Product showcase with professional layout and typography',
      components: ['navigation', 'cards', 'tables', 'buttons']
    },
    {
      name: 'shopify-admin-reference',
      url: 'https://shopify.dev/docs/admin-api',
      description: 'Secondary reference - Clean admin interface',
      components: ['navigation', 'cards', 'forms', 'tables']
    },
    {
      name: 'stripe-dashboard-reference',
      url: 'https://stripe.com/docs/dashboard',
      description: 'Secondary reference - Professional financial interface',
      components: ['navigation', 'cards', 'charts', 'buttons']
    }
  ],
  
  // Specific design elements to capture
  components: {
    navigation: {
      selector: 'nav, header, [role="navigation"]',
      description: 'Primary navigation patterns'
    },
    hero: {
      selector: '.hero, [class*="hero"], .banner, .jumbotron',
      description: 'Hero section layouts and typography'
    },
    cards: {
      selector: '.card, [class*="card"], .feature, [class*="feature"]',
      description: 'Card component patterns'
    },
    forms: {
      selector: 'form, .form, [class*="form"]',
      description: 'Form styling and input patterns'
    },
    buttons: {
      selector: 'button, .button, .btn, [role="button"]',
      description: 'Button styling variations'
    },
    tables: {
      selector: 'table, .table, [role="table"]',
      description: 'Data table styling'
    },
    typography: {
      selector: 'h1, h2, h3, p, .heading, .title',
      description: 'Typography hierarchy and styling'
    }
  }
};

// Screenshot Configuration
const CAPTURE_CONFIG = {
  // Output directories
  directories: {
    references: '.claude/references/descartes/',
    components: '.claude/references/components/',
    analysis: '.claude/references/analysis/'
  },
  
  // Viewport configurations matching our target devices
  viewports: {
    desktop: {
      width: 1920,
      height: 1080,
      name: 'desktop'
    },
    laptop: {
      width: 1366,
      height: 768, 
      name: 'laptop'
    },
    tablet: {
      width: 768,
      height: 1024,
      name: 'tablet'
    },
    mobile_iphone15: {
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      name: 'mobile_iphone15'
    }
  },
  
  // Screenshot quality settings
  quality: {
    format: 'png',
    quality: 100,
    animations: 'disabled',
    fullPage: false,
    clip: null // Will be set dynamically for components
  }
};

class DescartesReferenceCapture {
  constructor() {
    this.browser = null;
    this.captureResults = [];
    this.errors = [];
  }

  async initialize() {
    console.log('🎨 Initializing Descartes Reference Capture System...');
    
    try {
      // Ensure directories exist
      await this.ensureDirectories();
      
      // Launch browser with optimal settings for screenshot capture
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-dev-shm-usage',
          '--no-sandbox'
        ]
      });
      
      console.log('✅ Browser initialized for reference capture');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize reference capture:', error.message);
      return false;
    }
  }

  async ensureDirectories() {
    for (const dir of Object.values(CAPTURE_CONFIG.directories)) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async captureAllReferences() {
    console.log('📸 Starting comprehensive Descartes reference capture...\n');
    
    const totalSources = DESCARTES_SOURCES.references.length;
    const totalViewports = Object.keys(CAPTURE_CONFIG.viewports).length;
    const totalCaptures = totalSources * totalViewports;
    
    console.log(`📊 Capture Plan:`);
    console.log(`  • ${totalSources} reference sources`);
    console.log(`  • ${totalViewports} viewports (desktop, laptop, tablet, mobile)`);
    console.log(`  • ${totalCaptures} total screenshots planned`);
    console.log('');
    
    let captureCount = 0;
    
    for (const source of DESCARTES_SOURCES.references) {
      console.log(`🔄 Processing: ${source.name}`);
      console.log(`   URL: ${source.url}`);
      console.log(`   Components: ${source.components.join(', ')}`);
      
      for (const [viewportName, viewport] of Object.entries(CAPTURE_CONFIG.viewports)) {
        captureCount++;
        console.log(`   📱 ${viewportName} (${captureCount}/${totalCaptures})`);
        
        try {
          const result = await this.captureReference(source, viewport);
          this.captureResults.push(result);
          
          if (result.success) {
            console.log(`     ✅ Captured: ${result.filename}`);
          } else {
            console.log(`     ❌ Failed: ${result.error}`);
            this.errors.push({ source: source.name, viewport: viewportName, error: result.error });
          }
          
        } catch (error) {
          console.log(`     ❌ Error: ${error.message}`);
          this.errors.push({ source: source.name, viewport: viewportName, error: error.message });
        }
        
        // Brief pause between captures for stability
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('');
    }
    
    await this.generateCaptureReport();
    return this.captureResults;
  }

  async captureReference(source, viewport) {
    const context = await this.browser.newContext({
      viewport: {
        width: viewport.width,
        height: viewport.height
      },
      deviceScaleFactor: viewport.deviceScaleFactor || 1,
      userAgent: viewport.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    
    const page = await context.newPage();
    
    try {
      // Navigate with extended timeout for complex pages
      await page.goto(source.url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      // Wait for fonts and critical resources
      await page.waitForFunction(() => document.fonts.ready);
      await page.waitForTimeout(2000);
      
      // Remove cookie banners and overlays that might interfere
      await this.removeCookieBanners(page);
      
      // Capture full page reference
      const filename = this.generateFilename(source.name, viewport.name, 'reference');
      const filepath = path.join(CAPTURE_CONFIG.directories.references, filename);
      
      await page.screenshot({
        path: filepath,
        fullPage: true,
        animations: 'disabled'
        // Note: quality option not supported for PNG format
      });
      
      // Capture specific components if they exist
      const components = await this.captureComponents(page, source, viewport);
      
      await context.close();
      
      return {
        success: true,
        source: source.name,
        viewport: viewport.name,
        filename,
        filepath,
        components,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      await context.close();
      return {
        success: false,
        source: source.name,
        viewport: viewport.name,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async captureComponents(page, source, viewport) {
    const componentCaptures = [];
    
    for (const componentName of source.components) {
      const componentConfig = DESCARTES_SOURCES.components[componentName];
      
      if (!componentConfig) continue;
      
      try {
        const elements = await page.locator(componentConfig.selector).all();
        
        if (elements.length === 0) {
          console.log(`     📄 Component '${componentName}' not found on page`);
          continue;
        }
        
        // Capture the first visible element
        const element = elements[0];
        const isVisible = await element.isVisible();
        
        if (!isVisible) continue;
        
        const filename = this.generateFilename(
          `${source.name}_${componentName}`,
          viewport.name,
          'component'
        );
        const filepath = path.join(CAPTURE_CONFIG.directories.components, filename);
        
        await element.screenshot({
          path: filepath
          // Note: quality option not supported for PNG format
        });
        
        componentCaptures.push({
          component: componentName,
          filename,
          filepath,
          description: componentConfig.description
        });
        
        console.log(`       ✅ Component captured: ${componentName}`);
        
      } catch (error) {
        console.log(`       ❌ Component failed: ${componentName} - ${error.message}`);
      }
    }
    
    return componentCaptures;
  }

  async removeCookieBanners(page) {
    // Common cookie banner and overlay selectors
    const overlaySelectors = [
      '[class*="cookie"]',
      '[id*="cookie"]',
      '[class*="consent"]',
      '[class*="banner"]',
      '[class*="popup"]',
      '[class*="modal"]',
      '.onetrust-banner-sdk',
      '#onetrust-consent-sdk'
    ];
    
    for (const selector of overlaySelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            await element.evaluate(el => el.style.display = 'none');
          }
        }
      } catch (error) {
        // Ignore errors - element might not exist
      }
    }
  }

  generateFilename(sourceName, viewport, type) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `${sourceName}_${viewport}_${type}_${timestamp}.png`;
  }

  async generateCaptureReport() {
    const report = {
      timestamp: new Date().toISOString(),
      total_captures: this.captureResults.length,
      successful_captures: this.captureResults.filter(r => r.success).length,
      failed_captures: this.errors.length,
      sources_processed: DESCARTES_SOURCES.references.length,
      viewports_tested: Object.keys(CAPTURE_CONFIG.viewports).length,
      
      capture_summary: this.captureResults.map(result => ({
        source: result.source,
        viewport: result.viewport,
        success: result.success,
        filename: result.filename,
        components: result.components?.length || 0
      })),
      
      errors: this.errors,
      
      quality_metrics: {
        success_rate: `${((this.captureResults.filter(r => r.success).length / this.captureResults.length) * 100).toFixed(1)}%`,
        avg_components_per_source: (this.captureResults.reduce((sum, r) => sum + (r.components?.length || 0), 0) / this.captureResults.length).toFixed(1)
      },
      
      next_steps: [
        'Review captured references in .claude/references/descartes/',
        'Run visual comparison: /descartes-compare',
        'Validate compliance: /descartes-validate',
        'Generate design fixes: /descartes-fix'
      ]
    };
    
    const reportPath = path.join(CAPTURE_CONFIG.directories.analysis, `capture_report_${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Console summary
    console.log('📋 Capture Session Complete!');
    console.log('============================');
    console.log(`📊 Total Captures: ${report.total_captures}`);
    console.log(`✅ Successful: ${report.successful_captures}`);
    console.log(`❌ Failed: ${report.failed_captures}`);
    console.log(`📈 Success Rate: ${report.quality_metrics.success_rate}`);
    console.log(`🔍 Components Found: ${this.captureResults.reduce((sum, r) => sum + (r.components?.length || 0), 0)} total`);
    console.log(`📁 Report saved: ${reportPath}`);
    
    if (this.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      this.errors.forEach(error => {
        console.log(`  • ${error.source} (${error.viewport}): ${error.error}`);
      });
    }
    
    console.log('\n💡 Next Steps:');
    report.next_steps.forEach(step => console.log(`  • ${step}`));
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'capture';
  
  console.log('🎨 Descartes Reference Capture System');
  console.log('=====================================');
  
  switch (command) {
    case 'capture':
      await runFullCapture();
      break;
      
    case 'quick':
      await runQuickCapture();
      break;
      
    case 'mobile':
      await runMobileOnlyCapture();
      break;
      
    case 'desktop':
      await runDesktopOnlyCapture();
      break;
      
    case 'list':
      listAvailableSources();
      break;
      
    default:
      showHelp();
  }
}

async function runFullCapture() {
  const capture = new DescartesReferenceCapture();
  
  try {
    const initialized = await capture.initialize();
    if (!initialized) {
      console.error('❌ Failed to initialize capture system');
      process.exit(1);
    }
    
    const results = await capture.captureAllReferences();
    console.log(`\n🎉 Capture complete! ${results.length} references captured.`);
    
  } catch (error) {
    console.error('❌ Capture failed:', error);
    process.exit(1);
  } finally {
    await capture.cleanup();
  }
}

async function runQuickCapture() {
  console.log('🚀 Quick Capture Mode - Desktop only, first 3 sources');
  
  // Temporarily modify sources for quick capture
  const originalSources = DESCARTES_SOURCES.references;
  DESCARTES_SOURCES.references = originalSources.slice(0, 3);
  
  const originalViewports = CAPTURE_CONFIG.viewports;
  CAPTURE_CONFIG.viewports = { desktop: originalViewports.desktop };
  
  await runFullCapture();
  
  // Restore original configuration
  DESCARTES_SOURCES.references = originalSources;
  CAPTURE_CONFIG.viewports = originalViewports;
}

async function runMobileOnlyCapture() {
  console.log('📱 Mobile Capture Mode - iPhone 15 only');
  
  const originalViewports = CAPTURE_CONFIG.viewports;
  CAPTURE_CONFIG.viewports = { mobile_iphone15: originalViewports.mobile_iphone15 };
  
  await runFullCapture();
  
  CAPTURE_CONFIG.viewports = originalViewports;
}

async function runDesktopOnlyCapture() {
  console.log('🖥️  Desktop Capture Mode - Desktop and Laptop only');
  
  const originalViewports = CAPTURE_CONFIG.viewports;
  CAPTURE_CONFIG.viewports = {
    desktop: originalViewports.desktop,
    laptop: originalViewports.laptop
  };
  
  await runFullCapture();
  
  CAPTURE_CONFIG.viewports = originalViewports;
}

function listAvailableSources() {
  console.log('📋 Available Descartes Reference Sources:\n');
  
  DESCARTES_SOURCES.references.forEach((source, index) => {
    console.log(`${index + 1}. ${source.name}`);
    console.log(`   URL: ${source.url}`);
    console.log(`   Components: ${source.components.join(', ')}`);
    console.log(`   Description: ${source.description}`);
    console.log('');
  });
  
  console.log('📱 Viewports:');
  Object.entries(CAPTURE_CONFIG.viewports).forEach(([name, config]) => {
    console.log(`  • ${name}: ${config.width}x${config.height}`);
  });
}

function showHelp() {
  console.log(`
📚 Descartes Reference Capture Commands:

  capture          Full capture - all sources, all viewports (default)
  quick           Quick capture - desktop only, first 3 sources  
  mobile          Mobile only - iPhone 15 viewport
  desktop         Desktop only - desktop and laptop viewports
  list            List available sources and viewports
  
Examples:
  node capture-descartes-references.js
  node capture-descartes-references.js quick
  node capture-descartes-references.js mobile
  
Integration with Design System:
  /descartes-capture    (runs this script via CLI)
  /descartes-compare    (compare with captured references)
  /descartes-validate   (full compliance check)
`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ System error:', error);
    process.exit(1);
  });
}

module.exports = {
  DescartesReferenceCapture,
  DESCARTES_SOURCES,
  CAPTURE_CONFIG
};