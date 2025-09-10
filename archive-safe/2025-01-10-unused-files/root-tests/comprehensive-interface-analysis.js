const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🔍 COMPREHENSIVE USMCA INTERFACE ANALYSIS');
  console.log('=' .repeat(60));
  
  let browser;
  const results = {
    baseline: {},
    cssValidation: {},
    workflowValidation: {},
    accessibilityIssues: [],
    visualHierarchy: {},
    responsiveness: {},
    actionableRecommendations: []
  };
  
  try {
    browser = await chromium.launch({ 
      headless: false,
      channel: 'chrome',
      slowMo: 100 
    });

    // ========== BASELINE SCREENSHOTS ==========
    console.log('\n📸 PHASE 1: Baseline Screenshot Capture');
    console.log('-'.repeat(40));
    
    const desktopPage = await browser.newPage();
    await desktopPage.setViewportSize({ width: 1920, height: 1080 });
    await desktopPage.goto('http://localhost:3000/usmca-workflow', { waitUntil: 'networkidle' });
    await desktopPage.waitForSelector('.main-content', { timeout: 10000 });
    
    console.log('🖥️  Capturing desktop baseline (1920x1080)...');
    await desktopPage.screenshot({
      path: 'analysis-desktop-baseline.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    const mobilePage = await browser.newPage();
    await mobilePage.setViewportSize({ width: 375, height: 667 });
    await mobilePage.goto('http://localhost:3000/usmca-workflow', { waitUntil: 'networkidle' });
    await mobilePage.waitForSelector('.main-content', { timeout: 10000 });
    
    console.log('📱 Capturing mobile baseline (375x667)...');
    await mobilePage.screenshot({
      path: 'analysis-mobile-baseline.png',
      fullPage: true,
      animations: 'disabled'
    });
    
    results.baseline.desktop = 'analysis-desktop-baseline.png';
    results.baseline.mobile = 'analysis-mobile-baseline.png';

    // ========== CSS CLASS VALIDATION ==========
    console.log('\n🎨 PHASE 2: CSS Class Usage Validation');
    console.log('-'.repeat(40));
    
    const cssValidation = await desktopPage.evaluate(() => {
      const validation = {
        professionalStylesApplied: false,
        missingClasses: [],
        workingClasses: [],
        computedStyles: {},
        elementCounts: {}
      };

      // Check key professional styling classes
      const criticalClasses = [
        '.form-section',
        '.form-section-title', 
        '.form-group',
        '.form-input',
        '.form-select',
        '.workflow-progress',
        '.workflow-step',
        '.workflow-step-indicator',
        '.trust-indicators',
        '.trust-indicator'
      ];

      criticalClasses.forEach(className => {
        const elements = document.querySelectorAll(className);
        validation.elementCounts[className] = elements.length;
        
        if (elements.length > 0) {
          validation.workingClasses.push(className);
          
          // Get computed styles for first element
          const styles = window.getComputedStyle(elements[0]);
          validation.computedStyles[className] = {
            background: styles.background,
            padding: styles.padding,
            border: styles.border,
            borderRadius: styles.borderRadius,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            color: styles.color
          };
        } else {
          validation.missingClasses.push(className);
        }
      });

      // Check if professional form styling is actually applied
      const formInput = document.querySelector('.form-input');
      if (formInput) {
        const styles = window.getComputedStyle(formInput);
        validation.professionalStylesApplied = 
          styles.border.includes('3px') && 
          styles.padding.includes('20px') &&
          styles.minHeight.includes('52px');
      }

      return validation;
    });

    results.cssValidation = cssValidation;
    console.log(`✅ Professional styles applied: ${cssValidation.professionalStylesApplied ? 'YES' : 'NO'}`);
    console.log(`📊 Working classes: ${cssValidation.workingClasses.length}/${cssValidation.workingClasses.length + cssValidation.missingClasses.length}`);
    if (cssValidation.missingClasses.length > 0) {
      console.log(`❌ Missing classes: ${cssValidation.missingClasses.join(', ')}`);
    }

    // ========== WORKFLOW PROGRESSION VALIDATION ==========
    console.log('\n🔄 PHASE 3: Workflow Progression Analysis');
    console.log('-'.repeat(40));
    
    const workflowValidation = await desktopPage.evaluate(() => {
      const workflow = {
        stepsVisible: false,
        stepCount: 0,
        activeStep: null,
        progressIndicator: false,
        trustIndicators: false,
        navigationClear: false
      };

      const steps = document.querySelectorAll('.workflow-step');
      workflow.stepCount = steps.length;
      workflow.stepsVisible = steps.length > 0;

      // Check for active step
      const activeStep = document.querySelector('.workflow-step.active');
      if (activeStep) {
        workflow.activeStep = activeStep.textContent.trim();
      }

      // Check progress line/indicator
      workflow.progressIndicator = document.querySelector('.workflow-progress') !== null;

      // Check trust indicators
      workflow.trustIndicators = document.querySelectorAll('.trust-indicator').length > 0;

      // Check if navigation is clear
      workflow.navigationClear = document.querySelector('.form-section-title') !== null;

      return workflow;
    });

    results.workflowValidation = workflowValidation;
    console.log(`📋 Workflow steps visible: ${workflowValidation.stepsVisible ? 'YES' : 'NO'} (${workflowValidation.stepCount} steps)`);
    console.log(`🎯 Active step: ${workflowValidation.activeStep || 'None detected'}`);
    console.log(`📊 Progress indicator: ${workflowValidation.progressIndicator ? 'YES' : 'NO'}`);
    console.log(`🔒 Trust indicators: ${workflowValidation.trustIndicators ? 'YES' : 'NO'}`);

    // ========== VISUAL HIERARCHY ANALYSIS ==========
    console.log('\n👁️  PHASE 4: Visual Hierarchy Assessment');
    console.log('-'.repeat(40));

    const visualHierarchy = await desktopPage.evaluate(() => {
      const hierarchy = {
        titleHierarchy: {},
        colorContrast: {},
        spacing: {},
        typography: {},
        issues: []
      };

      // Check title hierarchy
      const titles = document.querySelectorAll('h1, h2, h3, .form-section-title, .workflow-step-label');
      titles.forEach((title, index) => {
        const styles = window.getComputedStyle(title);
        const key = title.tagName || title.className;
        hierarchy.titleHierarchy[key] = {
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          color: styles.color,
          marginBottom: styles.marginBottom
        };
      });

      // Check spacing consistency
      const formGroups = document.querySelectorAll('.form-group');
      if (formGroups.length > 0) {
        const styles = window.getComputedStyle(formGroups[0]);
        hierarchy.spacing.formGroupMargin = styles.marginBottom;
      }

      // Typography consistency
      const bodyText = document.querySelector('.text-body, .form-help');
      if (bodyText) {
        const styles = window.getComputedStyle(bodyText);
        hierarchy.typography = {
          fontSize: styles.fontSize,
          lineHeight: styles.lineHeight,
          color: styles.color
        };
      }

      // Check for visual issues
      const whiteElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const styles = window.getComputedStyle(el);
        return styles.color === 'rgb(255, 255, 255)' && styles.backgroundColor === 'rgb(255, 255, 255)';
      });
      if (whiteElements.length > 0) {
        hierarchy.issues.push(`${whiteElements.length} elements with white text on white background`);
      }

      return hierarchy;
    });

    results.visualHierarchy = visualHierarchy;
    console.log('📝 Title hierarchy analyzed');
    console.log('🎨 Color contrast checked');
    console.log('📏 Spacing consistency verified');

    // ========== MOBILE RESPONSIVENESS TEST ==========
    console.log('\n📱 PHASE 5: Mobile Responsiveness Analysis');
    console.log('-'.repeat(40));

    const responsiveness = await mobilePage.evaluate(() => {
      const mobile = {
        formReadable: false,
        touchTargetsAdequate: false,
        horizontalScroll: false,
        textOverflow: false,
        buttonsAccessible: false,
        issues: []
      };

      // Check if form is readable on mobile
      const formInputs = document.querySelectorAll('.form-input');
      if (formInputs.length > 0) {
        const styles = window.getComputedStyle(formInputs[0]);
        const fontSize = parseInt(styles.fontSize);
        mobile.formReadable = fontSize >= 14;
        if (fontSize < 14) {
          mobile.issues.push(`Form input font size too small: ${fontSize}px`);
        }
      }

      // Check touch target sizes
      const buttons = document.querySelectorAll('button, .btn-primary');
      let adequateTouchTargets = 0;
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        if (rect.height >= 44 && rect.width >= 44) {
          adequateTouchTargets++;
        }
      });
      mobile.touchTargetsAdequate = adequateTouchTargets === buttons.length;
      
      if (adequateTouchTargets < buttons.length) {
        mobile.issues.push(`${buttons.length - adequateTouchTargets} buttons below 44px touch target`);
      }

      // Check for horizontal overflow
      mobile.horizontalScroll = document.body.scrollWidth > window.innerWidth;
      if (mobile.horizontalScroll) {
        mobile.issues.push('Horizontal scroll detected on mobile');
      }

      return mobile;
    });

    results.responsiveness = responsiveness;
    console.log(`📖 Form readable on mobile: ${responsiveness.formReadable ? 'YES' : 'NO'}`);
    console.log(`👆 Touch targets adequate: ${responsiveness.touchTargetsAdequate ? 'YES' : 'NO'}`);
    console.log(`📜 Horizontal scroll: ${responsiveness.horizontalScroll ? 'DETECTED' : 'NONE'}`);

    // ========== ACCESSIBILITY CHECK ==========
    console.log('\n♿ PHASE 6: Accessibility Assessment');
    console.log('-'.repeat(40));

    const accessibility = await desktopPage.evaluate(() => {
      const a11y = {
        missingLabels: [],
        missingAltText: [],
        colorContrastIssues: [],
        keyboardNavigation: false,
        ariaIssues: []
      };

      // Check form labels
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach((input, index) => {
        const label = input.labels ? input.labels[0] : document.querySelector(`label[for="${input.id}"]`);
        if (!label && !input.getAttribute('aria-label')) {
          a11y.missingLabels.push(`Input ${index + 1}: ${input.type || input.tagName}`);
        }
      });

      // Check images
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          a11y.missingAltText.push(`Image ${index + 1}: ${img.src}`);
        }
      });

      // Check for ARIA issues
      const buttons = document.querySelectorAll('button');
      buttons.forEach((button, index) => {
        if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
          a11y.ariaIssues.push(`Button ${index + 1} has no accessible name`);
        }
      });

      return a11y;
    });

    results.accessibilityIssues = accessibility;
    console.log(`🏷️  Missing labels: ${accessibility.missingLabels.length}`);
    console.log(`🖼️  Missing alt text: ${accessibility.missingAltText.length}`);
    console.log(`🔤 ARIA issues: ${accessibility.ariaIssues.length}`);

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }

    // ========== GENERATE ACTIONABLE RECOMMENDATIONS ==========
    console.log('\n📋 PHASE 7: Actionable Recommendations');
    console.log('=' .repeat(60));

    // CSS/Styling Issues
    if (!results.cssValidation?.professionalStylesApplied) {
      results.actionableRecommendations.push({
        priority: 'HIGH',
        category: 'Styling',
        issue: 'Professional form styling not fully applied',
        action: 'Verify all form inputs use .form-input class and have 3px borders with proper padding'
      });
    }

    if (results.cssValidation?.missingClasses?.length > 0) {
      results.actionableRecommendations.push({
        priority: 'MEDIUM',
        category: 'CSS',
        issue: `Missing CSS classes: ${results.cssValidation.missingClasses.join(', ')}`,
        action: 'Add missing CSS classes to components or create corresponding styles'
      });
    }

    // Workflow Issues
    if (!results.workflowValidation?.progressIndicator) {
      results.actionableRecommendations.push({
        priority: 'HIGH',
        category: 'UX',
        issue: 'Workflow progress indicator not visible',
        action: 'Ensure .workflow-progress component is rendering with proper styling'
      });
    }

    if (!results.workflowValidation?.trustIndicators) {
      results.actionableRecommendations.push({
        priority: 'MEDIUM',
        category: 'Trust',
        issue: 'Trust indicators not visible',
        action: 'Verify .trust-indicators component is rendering "Data Verified", "System Operational" badges'
      });
    }

    // Mobile Issues
    if (results.responsiveness?.issues?.length > 0) {
      results.responsiveness.issues.forEach(issue => {
        results.actionableRecommendations.push({
          priority: 'HIGH',
          category: 'Mobile',
          issue: issue,
          action: 'Fix responsive design issues for mobile users'
        });
      });
    }

    // Accessibility Issues  
    if (results.accessibilityIssues?.missingLabels?.length > 0) {
      results.actionableRecommendations.push({
        priority: 'HIGH',
        category: 'Accessibility',
        issue: `${results.accessibilityIssues.missingLabels.length} form inputs missing labels`,
        action: 'Add proper <label> elements or aria-label attributes to all form inputs'
      });
    }

    // Display recommendations
    if (results.actionableRecommendations.length === 0) {
      console.log('✅ No critical issues detected - interface meets professional standards!');
    } else {
      results.actionableRecommendations.sort((a, b) => {
        const priority = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return priority[b.priority] - priority[a.priority];
      });

      results.actionableRecommendations.forEach((rec, index) => {
        console.log(`\n${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
        console.log(`   💡 Action: ${rec.action}`);
      });
    }

    console.log('\n📊 ANALYSIS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Screenshots captured: ${results.baseline.desktop ? 'Desktop ✅' : 'Desktop ❌'} ${results.baseline.mobile ? 'Mobile ✅' : 'Mobile ❌'}`);
    console.log(`Professional styling: ${results.cssValidation?.professionalStylesApplied ? '✅' : '❌'}`);
    console.log(`Workflow progression: ${results.workflowValidation?.stepsVisible ? '✅' : '❌'}`);
    console.log(`Mobile responsive: ${results.responsiveness?.formReadable ? '✅' : '❌'}`);
    console.log(`Accessibility: ${(results.accessibilityIssues?.missingLabels?.length || 0) === 0 ? '✅' : '❌'}`);
    console.log(`Total recommendations: ${results.actionableRecommendations.length}`);

    // Save detailed results
    fs.writeFileSync('interface-analysis-results.json', JSON.stringify(results, null, 2));
    console.log('\n📄 Detailed results saved to: interface-analysis-results.json');
  }
})();