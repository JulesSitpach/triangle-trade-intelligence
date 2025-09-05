const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Viewport configurations
const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 }
];

// Pages to capture
const pages = [
  { path: '/', name: 'homepage' },
  { path: '/usmca-workflow', name: 'usmca_workflow' },
  { path: '/solutions', name: 'solutions' }
];

const baseUrl = 'http://localhost:3002';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outputDir = path.join(__dirname, '.claude', 'baselines', `phase1_baseline_${timestamp}`);

async function captureBaselineScreenshots() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const results = [];

  console.log(`📸 Starting baseline screenshot capture...`);
  console.log(`📁 Output directory: ${outputDir}`);

  for (const viewport of viewports) {
    console.log(`\n🖥️  Capturing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.name === 'mobile' ? 2 : 1
    });
    
    const page = await context.newPage();

    for (const pageInfo of pages) {
      const url = `${baseUrl}${pageInfo.path}`;
      console.log(`  📷 Capturing ${pageInfo.name} at ${url}`);
      
      try {
        // Navigate to page and wait for it to load
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Wait for any animations to complete
        await page.waitForTimeout(2000);
        
        // Wait for key elements to load
        if (pageInfo.path === '/') {
          await page.waitForSelector('.hero-section', { timeout: 10000 });
        } else if (pageInfo.path === '/usmca-workflow') {
          await page.waitForSelector('.workflow-container', { timeout: 10000 });
        } else if (pageInfo.path === '/solutions') {
          await page.waitForSelector('.solutions-container', { timeout: 10000 });
        }
        
        // Capture full page screenshot
        const filename = `${pageInfo.name}_${viewport.name}_baseline.png`;
        const filepath = path.join(outputDir, filename);
        
        await page.screenshot({
          path: filepath,
          fullPage: true,
          animations: 'disabled'
        });
        
        results.push({
          page: pageInfo.name,
          viewport: viewport.name,
          filename,
          filepath,
          url,
          timestamp: new Date().toISOString(),
          status: 'success'
        });
        
        console.log(`    ✅ Saved: ${filename}`);
        
      } catch (error) {
        console.error(`    ❌ Error capturing ${pageInfo.name} (${viewport.name}):`, error.message);
        results.push({
          page: pageInfo.name,
          viewport: viewport.name,
          url,
          timestamp: new Date().toISOString(),
          status: 'error',
          error: error.message
        });
      }
    }
    
    await context.close();
  }

  await browser.close();

  // Generate metadata file
  const metadataPath = path.join(outputDir, 'baseline_metadata.json');
  const metadata = {
    capture_timestamp: new Date().toISOString(),
    purpose: 'CSS Refactoring Phase 1 Baseline',
    server_url: baseUrl,
    total_screenshots: results.filter(r => r.status === 'success').length,
    pages_captured: pages.length,
    viewports_tested: viewports.length,
    results: results,
    notes: [
      'Captured before CSS color standardization and consolidation',
      'Use for visual regression testing after Phase 1 changes',
      'Focus areas: colors, typography, layout structure, navigation'
    ]
  };
  
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  
  console.log(`\n📊 Capture Summary:`);
  console.log(`   Total screenshots: ${results.filter(r => r.status === 'success').length}/${results.length}`);
  console.log(`   Output directory: ${outputDir}`);
  console.log(`   Metadata file: ${metadataPath}`);
  console.log(`\n✅ Baseline screenshots capture complete!`);
  
  return {
    outputDir,
    metadata,
    results
  };
}

if (require.main === module) {
  captureBaselineScreenshots()
    .then((result) => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Screenshot capture failed:', error);
      process.exit(1);
    });
}

module.exports = { captureBaselineScreenshots };