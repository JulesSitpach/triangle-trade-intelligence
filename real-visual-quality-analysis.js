const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('🎨 REAL VISUAL QUALITY ANALYSIS');
  console.log('Comparing against professional government portal standards');
  console.log('=' .repeat(70));
  
  let browser;
  const analysis = {
    overallScore: 0,
    professionalAppearance: {},
    designQuality: {},
    governmentStandards: {},
    userExperience: {},
    visualIssues: [],
    recommendations: []
  };
  
  try {
    browser = await chromium.launch({ 
      headless: false,
      channel: 'chrome',
      slowMo: 200 
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000/usmca-workflow', { waitUntil: 'networkidle' });
    await page.waitForSelector('.main-content', { timeout: 10000 });

    // Capture high-quality reference screenshot
    console.log('📸 Capturing high-resolution reference screenshot...');
    await page.screenshot({
      path: 'visual-quality-analysis.png',
      fullPage: true,
      animations: 'disabled'
    });

    // ========== PROFESSIONAL APPEARANCE ANALYSIS ==========
    console.log('\n🏛️  PROFESSIONAL APPEARANCE ASSESSMENT');
    console.log('-'.repeat(50));
    
    const professionalAnalysis = await page.evaluate(() => {
      const analysis = {
        colorProfessionalism: { score: 0, issues: [] },
        typographyQuality: { score: 0, issues: [] },
        layoutMaturity: { score: 0, issues: [] },
        brandConsistency: { score: 0, issues: [] }
      };

      // COLOR PROFESSIONALISM (0-25 points)
      const bodyStyles = window.getComputedStyle(document.body);
      const primaryElements = document.querySelectorAll('.form-section, .workflow-step, .trust-indicator');
      
      let professionalColors = 0;
      let amateurColors = 0;

      primaryElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        const borderColor = styles.borderColor;

        // Check for professional government colors (blues, grays, whites)
        if (bgColor.includes('255, 255, 255') || bgColor.includes('244, 245, 246') || 
            textColor.includes('1, 42, 73') || textColor.includes('19, 65, 105')) {
          professionalColors++;
        }
        
        // Check for amateur colors (bright colors, default blues)
        if (bgColor.includes('0, 0, 255') || textColor.includes('0, 0, 255') ||
            bgColor.includes('255, 0, 0') || textColor.includes('255, 0, 0')) {
          amateurColors++;
          analysis.colorProfessionalism.issues.push('Amateur bright colors detected');
        }
      });

      analysis.colorProfessionalism.score = Math.min(25, (professionalColors / Math.max(primaryElements.length, 1)) * 25);
      
      if (analysis.colorProfessionalism.score < 20) {
        analysis.colorProfessionalism.issues.push('Color scheme lacks government portal professionalism');
      }

      // TYPOGRAPHY QUALITY (0-25 points)
      const headings = document.querySelectorAll('h1, h2, h3, .form-section-title');
      const bodyText = document.querySelectorAll('.text-body, .form-help, p');
      
      let typographyScore = 0;
      
      // Check heading hierarchy
      if (headings.length > 0) {
        const firstHeading = window.getComputedStyle(headings[0]);
        const fontWeight = parseInt(firstHeading.fontWeight);
        const fontSize = parseFloat(firstHeading.fontSize);
        
        if (fontWeight >= 600 && fontSize >= 18) {
          typographyScore += 10;
        } else {
          analysis.typographyQuality.issues.push('Headings lack authority and hierarchy');
        }
        
        // Check for professional font family
        if (firstHeading.fontFamily.toLowerCase().includes('roboto') || 
            firstHeading.fontFamily.toLowerCase().includes('system')) {
          typographyScore += 10;
        } else {
          analysis.typographyQuality.issues.push('Non-professional font family detected');
        }
      }
      
      // Check body text readability
      if (bodyText.length > 0) {
        const bodyStyles = window.getComputedStyle(bodyText[0]);
        const fontSize = parseFloat(bodyStyles.fontSize);
        const lineHeight = parseFloat(bodyStyles.lineHeight);
        
        if (fontSize >= 14 && lineHeight >= 20) {
          typographyScore += 5;
        } else {
          analysis.typographyQuality.issues.push('Body text too small or cramped');
        }
      }

      analysis.typographyQuality.score = typographyScore;

      // LAYOUT MATURITY (0-25 points)
      const formSection = document.querySelector('.form-section');
      let layoutScore = 0;

      if (formSection) {
        const styles = window.getComputedStyle(formSection);
        const padding = parseFloat(styles.paddingTop);
        const borderRadius = parseFloat(styles.borderRadius);
        const boxShadow = styles.boxShadow;
        
        // Check for professional spacing
        if (padding >= 24) {
          layoutScore += 8;
        } else {
          analysis.layoutMaturity.issues.push('Insufficient padding - appears cramped');
        }
        
        // Check for modern border radius
        if (borderRadius >= 8) {
          layoutScore += 8;
        } else {
          analysis.layoutMaturity.issues.push('Sharp corners - lacks modern polish');
        }
        
        // Check for subtle shadows
        if (boxShadow && boxShadow !== 'none') {
          layoutScore += 9;
        } else {
          analysis.layoutMaturity.issues.push('No depth/shadow - appears flat');
        }
      }

      analysis.layoutMaturity.score = layoutScore;

      // BRAND CONSISTENCY (0-25 points)
      const trustIndicators = document.querySelectorAll('.trust-indicator');
      const workflowSteps = document.querySelectorAll('.workflow-step');
      
      let consistencyScore = 0;
      
      if (trustIndicators.length >= 3) {
        consistencyScore += 10;
      } else {
        analysis.brandConsistency.issues.push('Missing trust indicators for credibility');
      }
      
      if (workflowSteps.length === 3) {
        consistencyScore += 10;
      } else {
        analysis.brandConsistency.issues.push('Workflow steps inconsistent or missing');
      }
      
      // Check for consistent button styling
      const buttons = document.querySelectorAll('button, .btn-primary');
      if (buttons.length > 0) {
        const buttonStyle = window.getComputedStyle(buttons[0]);
        if (buttonStyle.backgroundColor && buttonStyle.borderRadius) {
          consistencyScore += 5;
        }
      }

      analysis.brandConsistency.score = consistencyScore;

      return analysis;
    });

    analysis.professionalAppearance = professionalAnalysis;

    // Calculate overall professional score
    const totalScore = 
      (professionalAnalysis.colorProfessionalism?.score || 0) +
      (professionalAnalysis.typographyQuality?.score || 0) +
      (professionalAnalysis.layoutMaturity?.score || 0) +
      (professionalAnalysis.brandConsistency?.score || 0);

    analysis.overallScore = Math.round(totalScore);

    // ========== VISUAL QUALITY ISSUES DETECTION ==========
    console.log('\n🔍 VISUAL QUALITY ISSUES DETECTION');
    console.log('-'.repeat(50));

    const visualIssues = await page.evaluate(() => {
      const issues = [];
      
      // Check for visual hierarchy problems
      const allElements = document.querySelectorAll('*');
      let whiteOnWhite = 0;
      let tinyText = 0;
      let cramped = 0;
      
      allElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        // White text on white background
        if (styles.color === 'rgb(255, 255, 255)' && 
            styles.backgroundColor === 'rgb(255, 255, 255)') {
          whiteOnWhite++;
        }
        
        // Text too small
        if (styles.fontSize && parseFloat(styles.fontSize) < 12 && el.textContent.trim()) {
          tinyText++;
        }
        
        // Elements too cramped
        if (rect.height > 0 && parseFloat(styles.paddingTop) < 4 && el.children.length > 0) {
          cramped++;
        }
      });
      
      if (whiteOnWhite > 0) {
        issues.push(`${whiteOnWhite} elements with invisible white text on white background`);
      }
      
      if (tinyText > 5) {
        issues.push(`${tinyText} text elements below readable size (12px)`);
      }
      
      if (cramped > 10) {
        issues.push(`${cramped} elements with insufficient padding - layout appears cramped`);
      }
      
      // Check for amateur design patterns
      const defaultBlueButtons = document.querySelectorAll('button[style*="background-color: rgb(0, 0, 255)"]');
      if (defaultBlueButtons.length > 0) {
        issues.push('Default browser blue buttons detected - lacks professional styling');
      }
      
      // Check form field organization
      const formInputs = document.querySelectorAll('.form-input');
      const formLabels = document.querySelectorAll('.form-label');
      
      if (formInputs.length > formLabels.length) {
        issues.push(`${formInputs.length - formLabels.length} form inputs missing proper labels`);
      }
      
      return issues;
    });

    analysis.visualIssues = visualIssues;

    // ========== GOVERNMENT STANDARDS COMPLIANCE ==========
    console.log('\n🏛️  GOVERNMENT PORTAL STANDARDS CHECK');
    console.log('-'.repeat(50));

    const governmentCompliance = await page.evaluate(() => {
      const compliance = {
        accessibilityScore: 0,
        securityIndicators: 0,
        professionalLayout: 0,
        trustSignals: 0,
        issues: []
      };
      
      // Accessibility indicators
      const labels = document.querySelectorAll('label');
      const inputs = document.querySelectorAll('input, select');
      const altTexts = document.querySelectorAll('img[alt]');
      const allImages = document.querySelectorAll('img');
      
      if (labels.length >= inputs.length) {
        compliance.accessibilityScore += 25;
      } else {
        compliance.issues.push('Form accessibility below government standards');
      }
      
      if (altTexts.length === allImages.length) {
        compliance.accessibilityScore += 25;
      }
      
      // Security/trust indicators
      const trustElements = document.querySelectorAll('.trust-indicator');
      if (trustElements.length >= 3) {
        compliance.securityIndicators = 50;
      } else {
        compliance.issues.push('Missing security/trust indicators expected in government portals');
      }
      
      // Professional layout elements
      const properSections = document.querySelectorAll('.form-section');
      const progressIndicators = document.querySelectorAll('.workflow-step');
      
      if (properSections.length > 0 && progressIndicators.length > 0) {
        compliance.professionalLayout = 50;
      } else {
        compliance.issues.push('Layout lacks professional government portal structure');
      }
      
      return compliance;
    });

    analysis.governmentStandards = governmentCompliance;

  } catch (error) {
    console.error('❌ Visual analysis error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }

    // ========== GENERATE PROFESSIONAL ASSESSMENT ==========
    console.log('\n📊 PROFESSIONAL QUALITY ASSESSMENT');
    console.log('=' .repeat(70));
    
    const grade = analysis.overallScore >= 90 ? 'A' :
                  analysis.overallScore >= 80 ? 'B' :
                  analysis.overallScore >= 70 ? 'C' :
                  analysis.overallScore >= 60 ? 'D' : 'F';
    
    console.log(`🎯 OVERALL PROFESSIONAL SCORE: ${analysis.overallScore}/100 (Grade: ${grade})`);
    console.log(`\n📋 DETAILED BREAKDOWN:`);
    console.log(`   Color Professionalism: ${Math.round(analysis.professionalAppearance?.colorProfessionalism?.score || 0)}/25`);
    console.log(`   Typography Quality: ${Math.round(analysis.professionalAppearance?.typographyQuality?.score || 0)}/25`);
    console.log(`   Layout Maturity: ${Math.round(analysis.professionalAppearance?.layoutMaturity?.score || 0)}/25`);
    console.log(`   Brand Consistency: ${Math.round(analysis.professionalAppearance?.brandConsistency?.score || 0)}/25`);
    
    if (analysis.overallScore < 80) {
      console.log(`\n⚠️  PROFESSIONAL APPEARANCE ISSUES:`);
      
      Object.values(analysis.professionalAppearance).forEach(category => {
        if (category.issues && category.issues.length > 0) {
          category.issues.forEach(issue => {
            console.log(`   ❌ ${issue}`);
          });
        }
      });
    }
    
    if (analysis.visualIssues.length > 0) {
      console.log(`\n🔍 VISUAL QUALITY ISSUES:`);
      analysis.visualIssues.forEach(issue => {
        console.log(`   ❌ ${issue}`);
      });
    }
    
    console.log(`\n💡 PRIORITY RECOMMENDATIONS FOR PROFESSIONAL UPGRADE:`);
    
    if (analysis.overallScore < 90) {
      if (analysis.professionalAppearance.colorProfessionalism.score < 20) {
        console.log(`   1. Upgrade color scheme to government portal standards (navy, grays, whites)`);
      }
      
      if (analysis.professionalAppearance.typographyQuality.score < 20) {
        console.log(`   2. Improve typography hierarchy with stronger headings and professional fonts`);
      }
      
      if (analysis.professionalAppearance.layoutMaturity.score < 20) {
        console.log(`   3. Add professional spacing, shadows, and modern border radius`);
      }
      
      if (analysis.governmentStandards.accessibilityScore < 50) {
        console.log(`   4. Fix accessibility issues to meet government compliance standards`);
      }
    } else {
      console.log(`   ✅ Interface meets professional government portal standards!`);
    }
    
    // Save comprehensive analysis
    fs.writeFileSync('visual-quality-assessment.json', JSON.stringify(analysis, null, 2));
    console.log(`\n📄 Complete analysis saved to: visual-quality-assessment.json`);
    console.log(`📸 High-quality reference screenshot: visual-quality-analysis.png`);
  }
})();