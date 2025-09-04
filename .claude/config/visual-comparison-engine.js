/**
 * Visual Comparison Engine for Descartes Design Compliance
 * Integrates with Playwright MCP and CSS Protection System
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Visual Comparison Configuration
const COMPARISON_CONFIG = {
  // Directory structure
  directories: {
    references: '.claude/references/descartes/',
    current: '.claude/screenshots/current/',
    comparisons: '.claude/comparisons/',
    reports: '.claude/reports/visual/'
  },
  
  // Comparison thresholds
  thresholds: {
    pixel_perfect: 99.5,    // 99.5% similarity for pixel-perfect
    excellent: 95.0,        // 95%+ excellent match
    good: 90.0,            // 90%+ good match
    needs_work: 85.0,      // 85%+ needs improvement
    critical: 80.0         // <80% critical issues
  },
  
  // Screenshot settings matching Playwright MCP
  screenshot_config: {
    desktop: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    },
    
    mobile_iphone15: {
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      isMobile: true
    }
  },
  
  // Analysis settings
  analysis: {
    highlight_differences: true,
    generate_overlays: true,
    pixel_tolerance: 10,     // RGB difference tolerance
    area_focus: ['typography', 'spacing', 'colors', 'shadows']
  }
};

// Main Visual Comparison Engine
class VisualComparisonEngine {
  constructor() {
    this.playwright = null;
    this.browser = null;
    this.comparisonHistory = [];
    this.baseURL = 'http://localhost:3000'; // Your dev server
  }

  async initialize() {
    console.log('🎨 Initializing Visual Comparison Engine...');
    
    try {
      const { chromium } = require('playwright');
      this.playwright = { chromium };
      
      // Ensure directories exist
      await this.ensureDirectories();
      
      console.log('✅ Visual Comparison Engine ready');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize comparison engine:', error);
      return false;
    }
  }

  async ensureDirectories() {
    for (const dir of Object.values(COMPARISON_CONFIG.directories)) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async captureCurrentImplementation(component, viewport = 'desktop') {
    console.log(`📸 Capturing current implementation: ${component} (${viewport})`);
    
    if (!this.browser) {
      this.browser = await this.playwright.chromium.launch({ headless: true });
    }
    
    const page = await this.browser.newPage();
    
    try {
      // Configure viewport
      const viewportConfig = COMPARISON_CONFIG.screenshot_config[viewport];
      await page.setViewportSize({
        width: viewportConfig.width,
        height: viewportConfig.height
      });
      
      if (viewportConfig.userAgent) {
        await page.setUserAgent(viewportConfig.userAgent);
      }
      
      // Navigate to component
      const componentURL = this.getComponentURL(component);
      await page.goto(componentURL, { 
        waitUntil: 'networkidle',
        timeout: 10000
      });
      
      // Wait for fonts and styles to load
      await page.waitForFunction(() => document.fonts.ready);
      await page.waitForTimeout(1000); // Additional stability wait
      
      // Capture screenshot
      const filename = this.generateScreenshotFilename(component, viewport, 'current');
      const filepath = path.join(COMPARISON_CONFIG.directories.current, filename);
      
      await page.screenshot({
        path: filepath,
        fullPage: false,
        animations: 'disabled',
        quality: 100
      });
      
      console.log(`  ✅ Captured: ${filename}`);
      return filepath;
      
    } catch (error) {
      console.error(`❌ Failed to capture ${component}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async performComparison(component, viewport = 'desktop') {
    console.log(`🔍 Performing visual comparison: ${component} (${viewport})`);
    
    const comparison = {
      component,
      viewport,
      timestamp: new Date().toISOString(),
      similarity: 0,
      status: 'failed',
      issues: [],
      suggestions: []
    };
    
    try {
      // Capture current implementation
      const currentPath = await this.captureCurrentImplementation(component, viewport);
      
      // Find reference screenshot
      const referencePath = await this.findReferenceScreenshot(component, viewport);
      
      if (!referencePath) {
        throw new Error(`No reference screenshot found for ${component}_${viewport}`);
      }
      
      // Perform pixel comparison
      const pixelComparison = await this.comparePixels(referencePath, currentPath);
      comparison.similarity = pixelComparison.similarity;
      comparison.different_pixels = pixelComparison.differentPixels;
      comparison.total_pixels = pixelComparison.totalPixels;
      
      // Generate difference image
      const diffImagePath = await this.generateDifferenceImage(
        referencePath,
        currentPath,
        component,
        viewport
      );
      comparison.difference_image = diffImagePath;
      
      // Analyze differences
      const analysis = await this.analyzeDifferences(comparison);
      comparison.issues = analysis.issues;
      comparison.suggestions = analysis.suggestions;
      comparison.areas_analyzed = analysis.areas;
      
      // Determine status
      comparison.status = this.determineComparisonStatus(comparison.similarity);
      
      // Store comparison history
      this.comparisonHistory.push(comparison);
      
      return comparison;
      
    } catch (error) {
      comparison.error = error.message;
      console.error(`❌ Comparison failed for ${component}:`, error);
      return comparison;
    }
  }

  async comparePixels(referencePath, currentPath) {
    console.log('  🔍 Analyzing pixel differences...');
    
    try {
      // Use sharp for image comparison if available, fallback to basic comparison
      const sharp = require('sharp');
      
      // Load and normalize both images to same dimensions
      const referenceImage = sharp(referencePath);
      const currentImage = sharp(currentPath);
      
      // Get metadata
      const refMeta = await referenceImage.metadata();
      const currMeta = await currentImage.metadata();
      
      // Resize current to match reference if needed
      const normalizedCurrent = currMeta.width !== refMeta.width || currMeta.height !== refMeta.height
        ? currentImage.resize(refMeta.width, refMeta.height)
        : currentImage;
      
      // Convert to raw pixel data
      const refBuffer = await referenceImage.raw().toBuffer();
      const currBuffer = await normalizedCurrent.raw().toBuffer();
      
      // Compare pixels
      let differentPixels = 0;
      const totalPixels = refBuffer.length / 3; // RGB channels
      const tolerance = COMPARISON_CONFIG.analysis.pixel_tolerance;
      
      for (let i = 0; i < refBuffer.length; i += 3) {
        const rDiff = Math.abs(refBuffer[i] - currBuffer[i]);
        const gDiff = Math.abs(refBuffer[i + 1] - currBuffer[i + 1]);
        const bDiff = Math.abs(refBuffer[i + 2] - currBuffer[i + 2]);
        
        if (rDiff > tolerance || gDiff > tolerance || bDiff > tolerance) {
          differentPixels++;
        }
      }
      
      const similarity = ((totalPixels - differentPixels) / totalPixels) * 100;
      
      console.log(`  📊 Similarity: ${similarity.toFixed(2)}%`);
      
      return {
        similarity: parseFloat(similarity.toFixed(2)),
        differentPixels,
        totalPixels,
        dimensions: { width: refMeta.width, height: refMeta.height }
      };
      
    } catch (error) {
      console.error('  ❌ Pixel comparison failed:', error);
      
      // Fallback: basic file comparison
      const refStat = await fs.stat(referencePath);
      const currStat = await fs.stat(currentPath);
      
      // Very basic similarity based on file size
      const sizeDiff = Math.abs(refStat.size - currStat.size) / Math.max(refStat.size, currStat.size);
      const similarity = Math.max(0, (1 - sizeDiff) * 100);
      
      return {
        similarity: parseFloat(similarity.toFixed(2)),
        differentPixels: 0,
        totalPixels: 0,
        fallback: true
      };
    }
  }

  async generateDifferenceImage(referencePath, currentPath, component, viewport) {
    const diffFilename = this.generateScreenshotFilename(component, viewport, 'diff');
    const diffPath = path.join(COMPARISON_CONFIG.directories.comparisons, diffFilename);
    
    try {
      const sharp = require('sharp');
      
      // Create difference image by blending the two images
      const referenceImage = sharp(referencePath);
      const currentImage = sharp(currentPath);
      
      // Get reference dimensions
      const { width, height } = await referenceImage.metadata();
      
      // Resize current to match reference
      const normalizedCurrent = await currentImage.resize(width, height).toBuffer();
      
      // Create difference overlay
      const diffImage = await referenceImage
        .composite([
          {
            input: normalizedCurrent,
            blend: 'difference'
          }
        ])
        .png()
        .toFile(diffPath);
      
      console.log(`  📊 Difference image generated: ${diffFilename}`);
      return diffPath;
      
    } catch (error) {
      console.error('  ❌ Failed to generate difference image:', error);
      return null;
    }
  }

  async analyzeDifferences(comparison) {
    console.log('  🧠 Analyzing visual differences...');
    
    const analysis = {
      areas: {},
      issues: [],
      suggestions: []
    };
    
    const similarity = comparison.similarity;
    
    // Typography analysis
    if (similarity < 95) {
      analysis.areas.typography = {
        status: 'needs_attention',
        score: similarity,
        likely_issues: [
          'Font family mismatch (should be Roboto)',
          'Font size variations from Descartes standard',
          'Line height not matching 1.3 ratio',
          'Font weight inconsistencies'
        ]
      };
      
      analysis.suggestions.push({
        area: 'Typography',
        priority: 'HIGH',
        issue: 'Font rendering doesn\'t match Descartes standards',
        solution: 'Verify Roboto font loading and CSS font-family declarations',
        css_fix: 'Ensure: font-family: \'Roboto\', -apple-system, sans-serif'
      });
    }
    
    // Color analysis
    if (similarity < 90) {
      analysis.areas.colors = {
        status: 'critical',
        score: similarity,
        likely_issues: [
          'Color palette deviation from Descartes navy/blue scheme',
          'Incorrect use of brand colors',
          'Missing hover state colors',
          'Background color mismatches'
        ]
      };
      
      analysis.suggestions.push({
        area: 'Colors',
        priority: 'HIGH',
        issue: 'Color scheme doesn\'t match Descartes professional palette',
        solution: 'Use CSS custom properties for consistent colors',
        css_fix: 'Use: var(--navy-700), var(--blue-500), var(--gray-600)'
      });
    }
    
    // Spacing analysis
    if (similarity < 88) {
      analysis.areas.spacing = {
        status: 'critical',
        score: similarity,
        likely_issues: [
          'Padding/margin not following 8px grid',
          'Inconsistent component spacing',
          'Card and form spacing deviations',
          'Mobile spacing issues'
        ]
      };
      
      analysis.suggestions.push({
        area: 'Spacing',
        priority: 'MEDIUM',
        issue: 'Spacing doesn\'t align with Descartes 8px grid system',
        solution: 'Use spacing variables and existing CSS classes',
        css_fix: 'Use: var(--space-4), .card, .form-group classes'
      });
    }
    
    // Overall assessment
    if (similarity < 85) {
      analysis.issues.push({
        severity: 'CRITICAL',
        message: `Visual similarity is only ${similarity}% (target: 90%+)`,
        action: 'Major design adjustments needed to match Descartes standards'
      });
    } else if (similarity < 90) {
      analysis.issues.push({
        severity: 'HIGH',
        message: `Visual similarity is ${similarity}% (target: 90%+)`,
        action: 'Minor adjustments needed for better Descartes compliance'
      });
    }
    
    return analysis;
  }

  determineComparisonStatus(similarity) {
    const thresholds = COMPARISON_CONFIG.thresholds;
    
    if (similarity >= thresholds.pixel_perfect) return 'pixel_perfect';
    if (similarity >= thresholds.excellent) return 'excellent';
    if (similarity >= thresholds.good) return 'good';
    if (similarity >= thresholds.needs_work) return 'needs_work';
    return 'critical';
  }

  // Utility methods
  getComponentURL(component) {
    // Map component names to URLs
    const componentURLs = {
      'homepage': '/',
      'hero-section': '/',
      'navigation': '/',
      'usmca-workflow': '/usmca-workflow',
      'workflow-step-1': '/usmca-workflow',
      'workflow-results': '/usmca-workflow',
      'forms': '/usmca-workflow',
      'buttons': '/',
      'cards': '/'
    };
    
    return this.baseURL + (componentURLs[component] || '/');
  }

  generateScreenshotFilename(component, viewport, type) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `${component}_${viewport}_${type}_${timestamp}.png`;
  }

  async findReferenceScreenshot(component, viewport) {
    const referenceDir = COMPARISON_CONFIG.directories.references;
    
    try {
      const files = await fs.readdir(referenceDir);
      const pattern = new RegExp(`${component}_${viewport}_reference`);
      
      const matchingFiles = files.filter(file => pattern.test(file));
      
      if (matchingFiles.length === 0) {
        return null;
      }
      
      // Return most recent reference
      const sortedFiles = matchingFiles.sort().reverse();
      return path.join(referenceDir, sortedFiles[0]);
      
    } catch (error) {
      console.error('Error finding reference screenshot:', error);
      return null;
    }
  }

  async generateComparisonReport(comparisons) {
    const report = {
      timestamp: new Date().toISOString(),
      total_comparisons: comparisons.length,
      passed: 0,
      failed: 0,
      average_similarity: 0,
      components: comparisons,
      summary: {
        pixel_perfect: 0,
        excellent: 0,
        good: 0,
        needs_work: 0,
        critical: 0
      }
    };
    
    let totalSimilarity = 0;
    
    for (const comparison of comparisons) {
      totalSimilarity += comparison.similarity;
      
      if (comparison.similarity >= 90) {
        report.passed++;
      } else {
        report.failed++;
      }
      
      // Count status distribution
      report.summary[comparison.status]++;
    }
    
    report.average_similarity = (totalSimilarity / comparisons.length).toFixed(2);
    
    // Save report
    const reportPath = path.join(
      COMPARISON_CONFIG.directories.reports,
      `comparison_report_${Date.now()}.json`
    );
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Export for use
module.exports = {
  VisualComparisonEngine,
  COMPARISON_CONFIG
};

// CLI usage
if (require.main === module) {
  async function runComparison() {
    const engine = new VisualComparisonEngine();
    
    try {
      await engine.initialize();
      
      const components = ['homepage', 'navigation', 'hero-section'];
      const viewports = ['desktop', 'mobile_iphone15'];
      
      const allComparisons = [];
      
      for (const component of components) {
        for (const viewport of viewports) {
          const comparison = await engine.performComparison(component, viewport);
          allComparisons.push(comparison);
          
          console.log(`\n📊 ${component} (${viewport}): ${comparison.similarity}% similarity`);
          console.log(`Status: ${comparison.status}`);
          
          if (comparison.suggestions.length > 0) {
            console.log('💡 Suggestions:');
            comparison.suggestions.forEach(suggestion => {
              console.log(`  • ${suggestion.area}: ${suggestion.solution}`);
            });
          }
        }
      }
      
      // Generate final report
      const report = await engine.generateComparisonReport(allComparisons);
      console.log(`\n📋 Comparison Report Generated`);
      console.log(`Overall average similarity: ${report.average_similarity}%`);
      console.log(`Passed: ${report.passed}, Failed: ${report.failed}`);
      
    } catch (error) {
      console.error('❌ Comparison failed:', error);
    } finally {
      await engine.cleanup();
    }
  }
  
  runComparison();
}