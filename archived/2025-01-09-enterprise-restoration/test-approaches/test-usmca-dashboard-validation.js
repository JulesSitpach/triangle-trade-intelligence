/**
 * Comprehensive USMCA Dashboard Validation Test
 * Tests professional compliance form standards, CSS class usage, and accessibility
 * Captures screenshots for desktop (1920x1080) and mobile (iPhone 15)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  screenshotPath: './screenshots',
  timeout: 30000,
  viewports: {
    desktop: { width: 1920, height: 1080 },
    mobile: { width: 375, height: 667 } // iPhone 15
  }
};

// Expected CSS classes for validation
const EXPECTED_CSS_CLASSES = {
  layout: ['.dashboard-container', '.form-section', '.form-grid-2'],
  forms: ['.form-input', '.form-select', '.form-label', '.form-help'],
  actions: ['.dashboard-actions', '.btn-primary'],
  alerts: ['.alert', '.alert-info', '.alert-icon', '.alert-content'],
  progress: ['.workflow-progress', '.workflow-step', '.workflow-step-indicator'],
  trust: ['.trust-indicator', '.trust-icon', '.trust-title', '.trust-subtitle']
};

// Accessibility requirements for WCAG 2.1 AA
const ACCESSIBILITY_REQUIREMENTS = {
  minTouchTarget: 44, // 44px minimum touch target size
  minColorContrast: 4.5, // 4.5:1 minimum contrast ratio for AA
  requiredAttributes: ['aria-label', 'aria-describedby', 'for', 'id']
};

class USMCADashboardValidator {
  constructor() {
    this.browser = null;
    this.results = {
      screenshots: {},
      cssValidation: {},
      accessibility: {},
      professionalStandards: {},
      issues: [],
      summary: {}
    };
    
    // Ensure screenshot directory exists
    if (!fs.existsSync(TEST_CONFIG.screenshotPath)) {
      fs.mkdirSync(TEST_CONFIG.screenshotPath, { recursive: true });
    }
  }

  async initialize() {
    console.log('🚀 Initializing USMCA Dashboard Validation Suite...');
    this.browser = await chromium.launch({ 
      headless: false,
      slowMo: 100 
    });
  }

  async validateDashboard() {
    console.log('📊 Starting comprehensive dashboard validation...');
    
    try {
      // Test desktop viewport
      await this.testViewport('desktop', TEST_CONFIG.viewports.desktop);
      
      // Test mobile viewport  
      await this.testViewport('mobile', TEST_CONFIG.viewports.mobile);
      
      // Generate comprehensive report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      this.results.issues.push({
        type: 'CRITICAL_ERROR',
        message: error.message,
        impact: 'Test execution failed'
      });
    }
  }

  async testViewport(viewportName, viewport) {
    console.log(`\n🔍 Testing ${viewportName} viewport (${viewport.width}x${viewport.height})`);
    
    const context = await this.browser.newContext({ viewport });
    const page = await context.newPage();
    
    try {
      // Navigate to USMCA workflow
      console.log('📱 Navigating to USMCA workflow page...');
      await page.goto(`${TEST_CONFIG.baseURL}/usmca-workflow`, { 
        waitUntil: 'networkidle',
        timeout: TEST_CONFIG.timeout 
      });

      // Wait for page to be fully loaded
      await page.waitForSelector('.dashboard-container', { timeout: 10000 });
      await page.waitForTimeout(2000); // Allow CSS animations to complete

      // Capture full page screenshot
      const screenshotPath = path.join(TEST_CONFIG.screenshotPath, `usmca-dashboard-${viewportName}.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true,
        animations: 'disabled'
      });
      
      this.results.screenshots[viewportName] = {
        path: screenshotPath,
        viewport: viewport,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ Screenshot captured: ${screenshotPath}`);

      // Validate CSS class application
      await this.validateCSSClasses(page, viewportName);
      
      // Validate professional form standards
      await this.validateProfessionalStandards(page, viewportName);
      
      // Validate accessibility compliance
      await this.validateAccessibility(page, viewportName);

      // Test form interactions
      await this.testFormInteractions(page, viewportName);

    } catch (error) {
      console.error(`❌ Error testing ${viewportName} viewport:`, error);
      this.results.issues.push({
        type: 'VIEWPORT_ERROR',
        viewport: viewportName,
        message: error.message
      });
    } finally {
      await context.close();
    }
  }

  async validateCSSClasses(page, viewportName) {
    console.log(`🎨 Validating CSS classes for ${viewportName}...`);
    
    const cssResults = {
      applied: {},
      missing: [],
      score: 0
    };

    // Check each expected CSS class category
    for (const [category, classes] of Object.entries(EXPECTED_CSS_CLASSES)) {
      cssResults.applied[category] = [];
      
      for (const cssClass of classes) {
        try {
          const elements = await page.$$(cssClass);
          if (elements.length > 0) {
            cssResults.applied[category].push({
              class: cssClass,
              count: elements.length,
              found: true
            });
          } else {
            cssResults.missing.push(cssClass);
            this.results.issues.push({
              type: 'CSS_CLASS_MISSING',
              viewport: viewportName,
              class: cssClass,
              category: category,
              severity: 'HIGH'
            });
          }
        } catch (error) {
          cssResults.missing.push(cssClass);
          this.results.issues.push({
            type: 'CSS_VALIDATION_ERROR',
            viewport: viewportName,
            class: cssClass,
            error: error.message
          });
        }
      }
    }

    // Calculate CSS compliance score
    const totalClasses = Object.values(EXPECTED_CSS_CLASSES).flat().length;
    const appliedClasses = totalClasses - cssResults.missing.length;
    cssResults.score = Math.round((appliedClasses / totalClasses) * 100);

    this.results.cssValidation[viewportName] = cssResults;
    console.log(`📊 CSS Validation Score: ${cssResults.score}%`);
  }

  async validateProfessionalStandards(page, viewportName) {
    console.log(`🏢 Validating professional compliance standards for ${viewportName}...`);
    
    const standards = {
      formStructure: 'UNKNOWN',
      visualHierarchy: 'UNKNOWN', 
      dataIntegrity: 'UNKNOWN',
      brandConsistency: 'UNKNOWN',
      score: 0,
      details: []
    };

    try {
      // Check form structure (dashboard-container > form-section pattern)
      const dashboardContainers = await page.$$('.dashboard-container');
      const formSections = await page.$$('.form-section');
      
      if (dashboardContainers.length > 0 && formSections.length > 0) {
        standards.formStructure = 'EXCELLENT';
        standards.details.push('✅ Professional dashboard structure implemented');
      } else {
        standards.formStructure = 'POOR';
        standards.details.push('❌ Missing professional dashboard structure');
      }

      // Check visual hierarchy (proper heading structure)
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
        elements.map(el => ({ 
          tag: el.tagName.toLowerCase(), 
          text: el.textContent.trim(),
          classes: el.className 
        }))
      );
      
      const hasProperH1 = headings.some(h => h.tag === 'h1' && h.text.includes('USMCA'));
      const hasStructuredHeadings = headings.length >= 2;
      
      if (hasProperH1 && hasStructuredHeadings) {
        standards.visualHierarchy = 'EXCELLENT';
        standards.details.push('✅ Professional heading hierarchy established');
      } else {
        standards.visualHierarchy = 'NEEDS_IMPROVEMENT';
        standards.details.push('⚠️ Heading hierarchy could be improved');
      }

      // Check for information security alert (compliance requirement)
      const securityAlerts = await page.$$('.alert-info');
      const hasSecurityNote = await page.$eval('.alert-content', el => 
        el.textContent.includes('Information Security') || el.textContent.includes('encrypted')
      ).catch(() => false);
      
      if (securityAlerts.length > 0 && hasSecurityNote) {
        standards.dataIntegrity = 'EXCELLENT';
        standards.details.push('✅ Information security notice properly displayed');
      } else {
        standards.dataIntegrity = 'POOR';
        standards.details.push('❌ Missing required security information');
      }

      // Check brand consistency (fonts, colors, spacing)
      const computedStyles = await page.evaluate(() => {
        const body = document.body;
        const styles = window.getComputedStyle(body);
        return {
          fontFamily: styles.fontFamily,
          backgroundColor: styles.backgroundColor,
          color: styles.color
        };
      });
      
      const usesProfessionalFonts = computedStyles.fontFamily.includes('Roboto') || 
                                   computedStyles.fontFamily.includes('Inter');
      
      if (usesProfessionalFonts) {
        standards.brandConsistency = 'EXCELLENT';
        standards.details.push('✅ Professional typography system applied');
      } else {
        standards.brandConsistency = 'NEEDS_IMPROVEMENT';
        standards.details.push('⚠️ Typography system needs enhancement');
      }

      // Calculate overall professional standards score
      const scoreMapping = { 'EXCELLENT': 100, 'GOOD': 75, 'NEEDS_IMPROVEMENT': 50, 'POOR': 25, 'UNKNOWN': 0 };
      const scores = [standards.formStructure, standards.visualHierarchy, standards.dataIntegrity, standards.brandConsistency];
      standards.score = Math.round(scores.reduce((sum, rating) => sum + scoreMapping[rating], 0) / scores.length);

    } catch (error) {
      this.results.issues.push({
        type: 'PROFESSIONAL_STANDARDS_ERROR',
        viewport: viewportName,
        error: error.message
      });
    }

    this.results.professionalStandards[viewportName] = standards;
    console.log(`🏆 Professional Standards Score: ${standards.score}%`);
  }

  async validateAccessibility(page, viewportName) {
    console.log(`♿ Validating WCAG 2.1 AA accessibility for ${viewportName}...`);
    
    const a11y = {
      touchTargets: 'UNKNOWN',
      formLabels: 'UNKNOWN',
      focusManagement: 'UNKNOWN',
      semanticStructure: 'UNKNOWN',
      score: 0,
      details: []
    };

    try {
      // Check touch target sizes (minimum 44x44px for WCAG AA)
      const interactiveElements = await page.$$('button, input, select, a, [onclick], [role="button"]');
      let touchTargetIssues = 0;
      
      for (const element of interactiveElements) {
        const box = await element.boundingBox();
        if (box && (box.width < ACCESSIBILITY_REQUIREMENTS.minTouchTarget || 
                   box.height < ACCESSIBILITY_REQUIREMENTS.minTouchTarget)) {
          touchTargetIssues++;
        }
      }
      
      if (touchTargetIssues === 0) {
        a11y.touchTargets = 'EXCELLENT';
        a11y.details.push('✅ All interactive elements meet 44px minimum touch target');
      } else {
        a11y.touchTargets = 'NEEDS_IMPROVEMENT';
        a11y.details.push(`⚠️ ${touchTargetIssues} elements below 44px touch target size`);
      }

      // Check form labels and associations
      const formInputs = await page.$$('input, select, textarea');
      let unlabeledInputs = 0;
      
      for (const input of formInputs) {
        const hasLabel = await input.evaluate(el => {
          const id = el.id;
          const ariaLabel = el.getAttribute('aria-label');
          const ariaLabelledBy = el.getAttribute('aria-labelledby');
          const associatedLabel = id ? document.querySelector(`label[for="${id}"]`) : null;
          
          return !!(ariaLabel || ariaLabelledBy || associatedLabel);
        });
        
        if (!hasLabel) unlabeledInputs++;
      }
      
      if (unlabeledInputs === 0) {
        a11y.formLabels = 'EXCELLENT';
        a11y.details.push('✅ All form elements properly labeled');
      } else {
        a11y.formLabels = 'POOR';
        a11y.details.push(`❌ ${unlabeledInputs} form elements missing proper labels`);
      }

      // Check focus management
      const focusableElements = await page.$$('input, select, textarea, button, a[href]');
      let focusIssues = 0;
      
      for (const element of focusableElements.slice(0, 5)) { // Test first 5 elements
        try {
          await element.focus();
          const hasFocusStyle = await element.evaluate(el => {
            const styles = window.getComputedStyle(el, ':focus');
            return styles.outline !== 'none' || styles.boxShadow !== 'none';
          });
          
          if (!hasFocusStyle) focusIssues++;
        } catch (error) {
          focusIssues++;
        }
      }
      
      if (focusIssues === 0) {
        a11y.focusManagement = 'EXCELLENT';
        a11y.details.push('✅ Focus indicators properly implemented');
      } else {
        a11y.focusManagement = 'NEEDS_IMPROVEMENT';
        a11y.details.push(`⚠️ ${focusIssues} elements missing focus indicators`);
      }

      // Check semantic structure
      const hasHeadingStructure = await page.$('h1');
      const hasLandmarks = await page.$('main, nav, footer, section');
      const hasRequiredElements = await page.$('form');
      
      if (hasHeadingStructure && hasLandmarks && hasRequiredElements) {
        a11y.semanticStructure = 'EXCELLENT';
        a11y.details.push('✅ Semantic HTML structure implemented');
      } else {
        a11y.semanticStructure = 'NEEDS_IMPROVEMENT';
        a11y.details.push('⚠️ Semantic structure could be enhanced');
      }

      // Calculate accessibility score
      const scoreMapping = { 'EXCELLENT': 100, 'GOOD': 75, 'NEEDS_IMPROVEMENT': 50, 'POOR': 25, 'UNKNOWN': 0 };
      const scores = [a11y.touchTargets, a11y.formLabels, a11y.focusManagement, a11y.semanticStructure];
      a11y.score = Math.round(scores.reduce((sum, rating) => sum + scoreMapping[rating], 0) / scores.length);

    } catch (error) {
      this.results.issues.push({
        type: 'ACCESSIBILITY_ERROR',
        viewport: viewportName,
        error: error.message
      });
    }

    this.results.accessibility[viewportName] = a11y;
    console.log(`♿ Accessibility Score: ${a11y.score}%`);
  }

  async testFormInteractions(page, viewportName) {
    console.log(`🔄 Testing form interactions for ${viewportName}...`);
    
    try {
      // Test company name field
      const companyNameInput = await page.$('input[type="text"]');
      if (companyNameInput) {
        await companyNameInput.fill('TechFlow Electronics Inc');
        console.log('✅ Company name field interaction successful');
      }

      // Test business type dropdown
      const businessTypeSelect = await page.$('select[required]');
      if (businessTypeSelect) {
        // Wait for options to load
        await page.waitForSelector('select option:not([disabled])', { timeout: 5000 });
        const options = await page.$$('select option:not([disabled])');
        if (options.length > 1) {
          await businessTypeSelect.selectOption({ index: 1 });
          console.log('✅ Business type dropdown interaction successful');
        }
      }

      // Test country dropdown
      const countrySelect = await page.$('select');
      if (countrySelect) {
        const countryOptions = await countrySelect.$$('option');
        if (countryOptions.length > 1) {
          await countrySelect.selectOption({ index: 1 });
          console.log('✅ Country selection interaction successful');
        }
      }

      // Test continue button state
      const continueButton = await page.$('.btn-primary');
      if (continueButton) {
        const isEnabled = await continueButton.isEnabled();
        console.log(`✅ Continue button enabled state: ${isEnabled}`);
      }

    } catch (error) {
      this.results.issues.push({
        type: 'FORM_INTERACTION_ERROR',
        viewport: viewportName,
        error: error.message
      });
    }
  }

  async generateReport() {
    console.log('\n📋 Generating comprehensive validation report...');
    
    // Calculate overall scores
    const viewports = Object.keys(this.results.cssValidation);
    this.results.summary = {
      overallScore: 0,
      cssScore: 0,
      professionalScore: 0,
      accessibilityScore: 0,
      issueCount: this.results.issues.length,
      criticalIssues: this.results.issues.filter(i => i.severity === 'HIGH' || i.type.includes('CRITICAL')).length,
      viewportsTested: viewports.length,
      screenshotsCaptured: Object.keys(this.results.screenshots).length
    };

    // Average scores across viewports
    if (viewports.length > 0) {
      this.results.summary.cssScore = Math.round(
        viewports.reduce((sum, vp) => sum + (this.results.cssValidation[vp]?.score || 0), 0) / viewports.length
      );
      this.results.summary.professionalScore = Math.round(
        viewports.reduce((sum, vp) => sum + (this.results.professionalStandards[vp]?.score || 0), 0) / viewports.length
      );
      this.results.summary.accessibilityScore = Math.round(
        viewports.reduce((sum, vp) => sum + (this.results.accessibility[vp]?.score || 0), 0) / viewports.length
      );
      
      this.results.summary.overallScore = Math.round(
        (this.results.summary.cssScore + this.results.summary.professionalScore + this.results.summary.accessibilityScore) / 3
      );
    }

    // Write detailed report
    const reportPath = path.join(TEST_CONFIG.screenshotPath, 'usmca-dashboard-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate summary report
    const summaryPath = path.join(TEST_CONFIG.screenshotPath, 'validation-summary.txt');
    const summaryReport = this.generateSummaryReport();
    fs.writeFileSync(summaryPath, summaryReport);
    
    console.log(`📄 Detailed report saved: ${reportPath}`);
    console.log(`📊 Summary report saved: ${summaryPath}`);
    
    // Print console summary
    this.printConsoleSummary();
  }

  generateSummaryReport() {
    const { summary, screenshots, issues } = this.results;
    
    return `
USMCA DASHBOARD VALIDATION SUMMARY
Generated: ${new Date().toLocaleString()}
========================================

OVERALL ASSESSMENT
Overall Score: ${summary.overallScore}%
Status: ${summary.overallScore >= 90 ? 'EXCELLENT' : summary.overallScore >= 75 ? 'GOOD' : summary.overallScore >= 60 ? 'NEEDS IMPROVEMENT' : 'CRITICAL ISSUES'}

DETAILED SCORES
CSS Validation: ${summary.cssScore}%
Professional Standards: ${summary.professionalScore}%
Accessibility (WCAG 2.1 AA): ${summary.accessibilityScore}%

TEST COVERAGE
Viewports Tested: ${summary.viewportsTested} (Desktop 1920x1080, Mobile iPhone 15)
Screenshots Captured: ${summary.screenshotsCaptured}
Total Issues Found: ${summary.issueCount}
Critical Issues: ${summary.criticalIssues}

SCREENSHOTS CAPTURED
${Object.entries(screenshots).map(([vp, data]) => `${vp.toUpperCase()}: ${data.path} (${data.viewport.width}x${data.viewport.height})`).join('\n')}

KEY FINDINGS
${issues.length > 0 ? issues.slice(0, 10).map(issue => `- ${issue.type}: ${issue.message || issue.error || 'See detailed report'}`).join('\n') : '✅ No critical issues detected'}

RECOMMENDATIONS
${summary.overallScore < 90 ? `
- Review CSS class implementation for missing dashboard classes
- Enhance accessibility features for WCAG 2.1 AA compliance
- Improve professional form standards alignment
- Validate responsive behavior across all breakpoints
` : '✅ Dashboard meets professional compliance form standards'}

For detailed analysis, see usmca-dashboard-validation-report.json
`;
  }

  printConsoleSummary() {
    const { summary } = this.results;
    
    console.log('\n🎯 USMCA DASHBOARD VALIDATION SUMMARY');
    console.log('=====================================');
    console.log(`📊 Overall Score: ${summary.overallScore}% (${summary.overallScore >= 90 ? '🟢 EXCELLENT' : summary.overallScore >= 75 ? '🟡 GOOD' : summary.overallScore >= 60 ? '🟠 NEEDS IMPROVEMENT' : '🔴 CRITICAL ISSUES'})`);
    console.log(`🎨 CSS Validation: ${summary.cssScore}%`);
    console.log(`🏢 Professional Standards: ${summary.professionalScore}%`);
    console.log(`♿ Accessibility: ${summary.accessibilityScore}%`);
    console.log(`📱 Viewports Tested: ${summary.viewportsTested}`);
    console.log(`📸 Screenshots: ${summary.screenshotsCaptured}`);
    console.log(`⚠️  Issues Found: ${summary.issueCount} (${summary.criticalIssues} critical)`);
    console.log('\n✅ Validation complete! Check screenshots folder for results.');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Execute validation
async function runValidation() {
  const validator = new USMCADashboardValidator();
  
  try {
    await validator.initialize();
    await validator.validateDashboard();
  } catch (error) {
    console.error('❌ Validation suite failed:', error);
  } finally {
    await validator.cleanup();
  }
}

// Run if executed directly
if (require.main === module) {
  runValidation();
}

module.exports = { USMCADashboardValidator, runValidation };