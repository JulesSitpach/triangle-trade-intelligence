/**
 * Descartes Visual Compliance Validation System
 * Professional B2B compliance form comparison and analysis
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class DescartesValidationSystem {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.outputDir = './descartes-validation-results';
    this.browser = null;
    this.page = null;
    
    // Professional compliance standards (based on Descartes Visual Compliance)
    this.professionalStandards = {
      typography: {
        primaryFont: ['Inter', 'Roboto', '-apple-system', 'BlinkMacSystemFont'],
        headingSizes: ['1.5rem', '1.25rem', '1.125rem'], // Professional, not oversized
        bodySize: '0.875rem', // 14px for business applications
        lineHeight: 1.5,
        fontWeights: [400, 500, 600, 700]
      },
      colors: {
        primary: ['#2563eb', '#1d4ed8', '#1e40af'], // Professional blues
        secondary: ['#64748b', '#475569', '#334155'], // Neutral grays
        success: ['#059669', '#047857', '#065f46'], // Subtle greens
        warning: ['#d97706', '#b45309', '#92400e'], // Professional oranges
        error: ['#dc2626', '#b91c1c', '#991b1b'], // Controlled reds
        background: ['#f8fafc', '#f1f5f9', '#ffffff'],
        borders: ['#e2e8f0', '#cbd5e1', '#94a3b8']
      },
      spacing: {
        baseUnit: 8, // 8px grid system
        formSpacing: [12, 16, 20, 24], // Professional form spacing
        sectionSpacing: [24, 32, 48], // Between sections
        containerPadding: [16, 20, 24, 32]
      },
      layout: {
        maxWidth: '1200px',
        formMaxWidth: '600px',
        inputHeight: '40px',
        borderRadius: ['4px', '6px', '8px'], // Subtle, professional
        shadows: [
          'rgba(0, 0, 0, 0.05)',
          'rgba(0, 0, 0, 0.1)',
          'rgba(0, 0, 0, 0.15)'
        ]
      },
      forms: {
        labelPosition: 'top', // Professional forms use top labels
        requiredIndicator: '*',
        errorDisplay: 'below-field',
        fieldGrouping: 'logical',
        progressIndicator: 'subtle'
      }
    };
  }

  async initialize() {
    await fs.mkdir(this.outputDir, { recursive: true });
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    
    // Set professional viewport (common business screen size)
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async captureUsmcaDashboard() {
    console.log('🎯 Capturing USMCA Dashboard for Descartes comparison...');
    
    const scenarios = [
      {
        name: 'homepage_professional',
        url: this.baseURL,
        description: 'Landing page with professional B2B styling'
      },
      {
        name: 'usmca_workflow_desktop',
        url: `${this.baseURL}/usmca-workflow`,
        description: 'Main USMCA compliance workflow - desktop view'
      }
    ];

    const results = {};

    for (const scenario of scenarios) {
      console.log(`📸 Capturing: ${scenario.description}`);
      
      try {
        await this.page.goto(scenario.url, { waitUntil: 'networkidle' });
        
        // Wait for form elements to load
        await this.page.waitForSelector('form, .workflow-container, .card', { timeout: 10000 });
        
        // Capture full page screenshot
        const screenshotPath = path.join(this.outputDir, `${scenario.name}_full.png`);
        await this.page.screenshot({
          path: screenshotPath,
          fullPage: true
        });

        // Capture Company Information section specifically
        const companySection = await this.page.locator('.company-information, .form-group, [data-testid="company-form"]').first();
        if (await companySection.count() > 0) {
          const companySectionPath = path.join(this.outputDir, `${scenario.name}_company_section.png`);
          await companySection.screenshot({ path: companySectionPath });
        }

        // Analyze the page structure and styling
        const analysis = await this.analyzePageProfessionalism();
        
        results[scenario.name] = {
          ...scenario,
          screenshotPath,
          analysis,
          timestamp: new Date().toISOString()
        };

        console.log(`✅ Captured: ${scenario.name}`);
        
      } catch (error) {
        console.error(`❌ Error capturing ${scenario.name}:`, error.message);
        results[scenario.name] = {
          ...scenario,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    return results;
  }

  async analyzePageProfessionalism() {
    console.log('🔍 Analyzing professional compliance standards...');
    
    const analysis = {
      typography: await this.analyzeTypography(),
      colors: await this.analyzeColorPalette(),
      spacing: await this.analyzeSpacing(),
      forms: await this.analyzeFormDesign(),
      layout: await this.analyzeLayoutStructure(),
      trustIndicators: await this.analyzeTrustElements()
    };

    // Calculate overall professional score
    const scores = Object.values(analysis).map(category => category.score).filter(Boolean);
    analysis.overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    return analysis;
  }

  async analyzeTypography() {
    const typography = await this.page.evaluate(() => {
      const elements = {
        headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')),
        body: Array.from(document.querySelectorAll('p, div, span, label')),
        forms: Array.from(document.querySelectorAll('input, select, textarea'))
      };

      const getComputedStyles = (element) => {
        const computed = getComputedStyle(element);
        return {
          fontSize: computed.fontSize,
          fontFamily: computed.fontFamily,
          fontWeight: computed.fontWeight,
          lineHeight: computed.lineHeight,
          color: computed.color
        };
      };

      return {
        headings: elements.headings.slice(0, 5).map(el => ({
          tag: el.tagName.toLowerCase(),
          text: el.textContent.slice(0, 50),
          styles: getComputedStyles(el)
        })),
        body: elements.body.slice(0, 10).map(el => ({
          styles: getComputedStyles(el)
        })),
        forms: elements.forms.slice(0, 5).map(el => ({
          type: el.type || el.tagName.toLowerCase(),
          styles: getComputedStyles(el)
        }))
      };
    });

    // Analyze against professional standards
    const issues = [];
    let score = 100;

    // Check heading sizes (shouldn't be too large for B2B)
    typography.headings.forEach(heading => {
      const fontSize = parseFloat(heading.styles.fontSize);
      if (fontSize > 36) { // 2.25rem
        issues.push(`Heading too large for B2B: ${fontSize}px (max recommended: 36px)`);
        score -= 15;
      }
    });

    // Check font consistency
    const fontFamilies = new Set();
    [...typography.headings, ...typography.body].forEach(el => {
      fontFamilies.add(el.styles.fontFamily);
    });

    if (fontFamilies.size > 2) {
      issues.push(`Too many font families: ${fontFamilies.size} (recommended: 1-2)`);
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      issues,
      data: typography,
      recommendations: this.generateTypographyRecommendations(issues)
    };
  }

  async analyzeColorPalette() {
    const colors = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const colorData = {
        backgrounds: new Set(),
        textColors: new Set(),
        borderColors: new Set(),
        buttonColors: new Set()
      };

      elements.forEach(el => {
        const computed = getComputedStyle(el);
        
        if (computed.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          colorData.backgrounds.add(computed.backgroundColor);
        }
        if (computed.color) {
          colorData.textColors.add(computed.color);
        }
        if (computed.borderColor && computed.borderColor !== 'rgba(0, 0, 0, 0)') {
          colorData.borderColors.add(computed.borderColor);
        }
        
        if (el.tagName === 'BUTTON' || el.classList.contains('btn')) {
          colorData.buttonColors.add(computed.backgroundColor);
        }
      });

      return {
        backgrounds: Array.from(colorData.backgrounds).slice(0, 10),
        textColors: Array.from(colorData.textColors).slice(0, 10),
        borderColors: Array.from(colorData.borderColors).slice(0, 10),
        buttonColors: Array.from(colorData.buttonColors).slice(0, 5)
      };
    });

    const issues = [];
    let score = 100;

    // Check for too many colors (unprofessional)
    const totalColors = colors.backgrounds.length + colors.textColors.length;
    if (totalColors > 15) {
      issues.push(`Too many colors used: ${totalColors} (recommended: <15 for B2B)`);
      score -= 20;
    }

    // Check for bright/unprofessional colors
    const brightColorPatterns = [/rgb\(255, 0, 0\)/, /rgb\(0, 255, 0\)/, /rgb\(255, 255, 0\)/];
    const allColors = [...colors.backgrounds, ...colors.textColors, ...colors.buttonColors];
    
    allColors.forEach(color => {
      brightColorPatterns.forEach(pattern => {
        if (pattern.test(color)) {
          issues.push(`Unprofessional bright color detected: ${color}`);
          score -= 15;
        }
      });
    });

    return {
      score: Math.max(0, score),
      issues,
      data: colors,
      recommendations: this.generateColorRecommendations(issues)
    };
  }

  async analyzeSpacing() {
    const spacing = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('form, .form-group, .card, input, button'));
      
      return elements.slice(0, 20).map(el => {
        const computed = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        return {
          element: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : ''),
          padding: computed.padding,
          margin: computed.margin,
          width: rect.width,
          height: rect.height
        };
      });
    });

    const issues = [];
    let score = 100;

    // Check for consistent spacing (should follow 8px grid)
    spacing.forEach(el => {
      const paddingValues = el.padding.match(/\d+/g) || [];
      paddingValues.forEach(value => {
        const px = parseInt(value);
        if (px > 0 && px % 4 !== 0) {
          issues.push(`Non-grid spacing detected: ${px}px (should be multiple of 4)`);
          score -= 5;
        }
      });
    });

    return {
      score: Math.max(0, score),
      issues,
      data: spacing,
      recommendations: ['Use 8px grid system (4px, 8px, 12px, 16px, 24px, 32px)', 'Maintain consistent spacing between form elements']
    };
  }

  async analyzeFormDesign() {
    const forms = await this.page.evaluate(() => {
      const formElements = Array.from(document.querySelectorAll('form, input, select, textarea, label'));
      
      return {
        formCount: document.querySelectorAll('form').length,
        inputCount: document.querySelectorAll('input').length,
        selectCount: document.querySelectorAll('select').length,
        labelCount: document.querySelectorAll('label').length,
        elements: formElements.slice(0, 15).map(el => {
          const computed = getComputedStyle(el);
          return {
            tag: el.tagName.toLowerCase(),
            type: el.type || 'n/a',
            placeholder: el.placeholder || '',
            height: computed.height,
            borderRadius: computed.borderRadius,
            border: computed.border,
            hasLabel: el.labels?.length > 0 || el.previousElementSibling?.tagName === 'LABEL'
          };
        })
      };
    });

    const issues = [];
    let score = 100;

    // Check input heights (should be professional, not too small or large)
    forms.elements.forEach(el => {
      if (['input', 'select', 'textarea'].includes(el.tag)) {
        const height = parseFloat(el.height);
        if (height < 32 || height > 56) {
          issues.push(`Input height not professional: ${height}px (recommended: 40-48px)`);
          score -= 10;
        }
      }
    });

    // Check label association
    const inputsWithoutLabels = forms.elements.filter(el => 
      ['input', 'select', 'textarea'].includes(el.tag) && !el.hasLabel
    ).length;

    if (inputsWithoutLabels > 0) {
      issues.push(`${inputsWithoutLabels} form inputs missing labels (accessibility issue)`);
      score -= 20;
    }

    return {
      score: Math.max(0, score),
      issues,
      data: forms,
      recommendations: this.generateFormRecommendations(issues)
    };
  }

  async analyzeLayoutStructure() {
    const layout = await this.page.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('.container, .wrapper, .content, main'));
      const cards = Array.from(document.querySelectorAll('.card, .panel, .section'));
      
      return {
        hasMaxWidth: containers.some(el => {
          const computed = getComputedStyle(el);
          return computed.maxWidth && computed.maxWidth !== 'none';
        }),
        cardCount: cards.length,
        hasGrid: !!document.querySelector('[style*="grid"], .grid, [class*="grid"]'),
        hasFlex: !!document.querySelector('[style*="flex"], .flex, [class*="flex"]'),
        containers: containers.slice(0, 5).map(el => ({
          className: el.className,
          maxWidth: getComputedStyle(el).maxWidth,
          margin: getComputedStyle(el).margin
        }))
      };
    });

    let score = 100;
    const issues = [];

    if (!layout.hasMaxWidth) {
      issues.push('No max-width container found (content may be too wide on large screens)');
      score -= 25;
    }

    if (layout.cardCount === 0) {
      issues.push('No card/panel components found (may lack visual organization)');
      score -= 15;
    }

    return {
      score,
      issues,
      data: layout,
      recommendations: ['Implement max-width containers', 'Use card/panel components for content organization', 'Ensure responsive layout']
    };
  }

  async analyzeTrustElements() {
    const trust = await this.page.evaluate(() => {
      const trustSelectors = [
        '.trust', '.security', '.ssl', '.verified', '.certified',
        '[alt*="secure"]', '[alt*="verified"]', '[alt*="certified"]',
        '.badge', '.seal', '.guarantee', '.compliance'
      ];

      const trustElements = [];
      trustSelectors.forEach(selector => {
        const elements = Array.from(document.querySelectorAll(selector));
        trustElements.push(...elements);
      });

      return {
        trustElementCount: trustElements.length,
        hasSSLIndicator: !!document.querySelector('[alt*="ssl"], [alt*="secure"]'),
        hasComplianceBadge: !!document.querySelector('[alt*="compliance"], [alt*="certified"]'),
        hasSecurityText: document.body.textContent.toLowerCase().includes('secure') ||
                        document.body.textContent.toLowerCase().includes('encrypted'),
        elements: trustElements.slice(0, 5).map(el => ({
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.slice(0, 100) || '',
          alt: el.alt || '',
          className: el.className
        }))
      };
    });

    let score = 100;
    const issues = [];

    if (trust.trustElementCount === 0) {
      issues.push('No trust indicators found (important for B2B compliance applications)');
      score -= 30;
    }

    if (!trust.hasSecurityText) {
      issues.push('No security/encryption messaging found');
      score -= 15;
    }

    return {
      score,
      issues,
      data: trust,
      recommendations: ['Add trust badges/seals', 'Include security messaging', 'Display compliance certifications']
    };
  }

  generateTypographyRecommendations(issues) {
    const recs = ['Use professional font stack (Inter, Roboto, system fonts)'];
    
    if (issues.some(i => i.includes('too large'))) {
      recs.push('Reduce heading sizes for B2B professional appearance (max 36px)');
    }
    
    if (issues.some(i => i.includes('font families'))) {
      recs.push('Limit to 1-2 font families maximum');
    }
    
    recs.push('Use 14px+ for body text', 'Maintain 1.5 line height for readability');
    return recs;
  }

  generateColorRecommendations(issues) {
    const recs = ['Use professional color palette (blues, grays, subtle accents)'];
    
    if (issues.some(i => i.includes('too many'))) {
      recs.push('Limit color palette to 8-12 colors maximum');
    }
    
    if (issues.some(i => i.includes('bright color'))) {
      recs.push('Replace bright colors with professional alternatives');
    }
    
    recs.push('Ensure 4.5:1 contrast ratio minimum', 'Use neutral grays for text and borders');
    return recs;
  }

  generateFormRecommendations(issues) {
    const recs = ['Use 40-48px input height for professional forms'];
    
    if (issues.some(i => i.includes('labels'))) {
      recs.push('Associate all form inputs with labels for accessibility');
    }
    
    recs.push(
      'Position labels above inputs (not beside)',
      'Use subtle border radius (4-8px)',
      'Implement clear error states',
      'Group related fields logically'
    );
    return recs;
  }

  async generateComparisonReport(captureResults) {
    console.log('📋 Generating Descartes compliance comparison report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPages: Object.keys(captureResults).length,
        avgProfessionalScore: 0,
        criticalIssues: 0,
        passedPages: 0
      },
      pages: {},
      recommendations: {
        high_priority: [],
        medium_priority: [],
        low_priority: []
      },
      descartesComparison: {
        overallSimilarity: 0,
        matchingAreas: [],
        improvementAreas: []
      }
    };

    let totalScore = 0;
    let pageCount = 0;

    // Process each captured page
    for (const [pageName, pageData] of Object.entries(captureResults)) {
      if (pageData.error) {
        report.pages[pageName] = { error: pageData.error };
        continue;
      }

      const analysis = pageData.analysis;
      const pageScore = analysis.overallScore;
      totalScore += pageScore;
      pageCount++;

      report.pages[pageName] = {
        url: pageData.url,
        description: pageData.description,
        professionalScore: Math.round(pageScore),
        passedCompliance: pageScore >= 85,
        categories: {
          typography: {
            score: Math.round(analysis.typography.score),
            issues: analysis.typography.issues,
            recommendations: analysis.typography.recommendations
          },
          colors: {
            score: Math.round(analysis.colors.score),
            issues: analysis.colors.issues,
            recommendations: analysis.colors.recommendations
          },
          spacing: {
            score: Math.round(analysis.spacing.score),
            issues: analysis.spacing.issues,
            recommendations: analysis.spacing.recommendations
          },
          forms: {
            score: Math.round(analysis.forms.score),
            issues: analysis.forms.issues,
            recommendations: analysis.forms.recommendations
          },
          layout: {
            score: Math.round(analysis.layout.score),
            issues: analysis.layout.issues,
            recommendations: analysis.layout.recommendations
          },
          trustIndicators: {
            score: Math.round(analysis.trustIndicators.score),
            issues: analysis.trustIndicators.issues,
            recommendations: analysis.trustIndicators.recommendations
          }
        }
      };

      // Collect critical issues
      Object.values(analysis).forEach(category => {
        if (category.score < 70) {
          report.summary.criticalIssues++;
        }
      });

      if (pageScore >= 85) {
        report.summary.passedPages++;
      }
    }

    // Calculate averages
    if (pageCount > 0) {
      report.summary.avgProfessionalScore = Math.round(totalScore / pageCount);
    }

    // Generate Descartes similarity assessment
    report.descartesComparison = this.assessDescartesCompliance(report);

    // Generate prioritized recommendations
    report.recommendations = this.generatePrioritizedRecommendations(report);

    // Save report
    const reportPath = path.join(this.outputDir, 'descartes_compliance_report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(this.outputDir, 'descartes_compliance_report.html');
    await fs.writeFile(htmlPath, htmlReport);

    console.log(`✅ Report generated: ${htmlPath}`);
    return report;
  }

  assessDescartesCompliance(report) {
    const avgScore = report.summary.avgProfessionalScore;
    
    let overallSimilarity = avgScore;
    const matchingAreas = [];
    const improvementAreas = [];

    // Assess against Descartes standards
    if (avgScore >= 90) {
      matchingAreas.push('Professional typography and spacing');
      matchingAreas.push('Sophisticated color palette');
      matchingAreas.push('Enterprise-grade form design');
    }

    if (avgScore >= 85) {
      matchingAreas.push('Consistent visual hierarchy');
      matchingAreas.push('Responsive layout structure');
    } else {
      improvementAreas.push('Visual hierarchy needs refinement');
      improvementAreas.push('Layout structure requires improvement');
    }

    if (report.summary.criticalIssues > 2) {
      improvementAreas.push('Multiple critical design issues need addressing');
      overallSimilarity -= 10;
    }

    // Check specific compliance areas
    const hasGoodTypography = Object.values(report.pages).every(page => 
      !page.error && page.categories?.typography?.score >= 80
    );
    
    if (!hasGoodTypography) {
      improvementAreas.push('Typography doesn\'t match Descartes professional standards');
      overallSimilarity -= 15;
    }

    return {
      overallSimilarity: Math.max(0, Math.round(overallSimilarity)),
      matchingAreas,
      improvementAreas,
      descartesLevel: overallSimilarity >= 90 ? 'Enterprise' : 
                     overallSimilarity >= 75 ? 'Professional' : 
                     'Needs Development'
    };
  }

  generatePrioritizedRecommendations(report) {
    const high = [];
    const medium = [];
    const low = [];

    // High priority: Critical compliance issues
    if (report.summary.avgProfessionalScore < 70) {
      high.push('CRITICAL: Overall professional score below 70% - major redesign needed');
    }

    if (report.summary.criticalIssues >= 3) {
      high.push('CRITICAL: Multiple critical design issues - prioritize immediate fixes');
    }

    // Analyze common issues across pages
    const commonIssues = this.findCommonIssues(report);
    
    commonIssues.critical.forEach(issue => high.push(`CRITICAL: ${issue}`));
    commonIssues.important.forEach(issue => medium.push(`IMPORTANT: ${issue}`));
    commonIssues.minor.forEach(issue => low.push(`MINOR: ${issue}`));

    return { high_priority: high, medium_priority: medium, low_priority: low };
  }

  findCommonIssues(report) {
    const issueCategories = {
      critical: [],
      important: [],
      minor: []
    };

    const pageEntries = Object.entries(report.pages).filter(([_, page]) => !page.error);
    
    // Check typography issues
    const typographyIssues = pageEntries.filter(([_, page]) => 
      page.categories?.typography?.score < 70
    ).length;
    
    if (typographyIssues >= pageEntries.length * 0.7) {
      issueCategories.critical.push('Typography doesn\'t meet professional standards across most pages');
    }

    // Check form design issues  
    const formIssues = pageEntries.filter(([_, page]) => 
      page.categories?.forms?.score < 80
    ).length;
    
    if (formIssues > 0) {
      issueCategories.important.push('Form design needs improvement for professional B2B appearance');
    }

    // Check trust indicators
    const trustIssues = pageEntries.filter(([_, page]) => 
      page.categories?.trustIndicators?.score < 70
    ).length;
    
    if (trustIssues >= pageEntries.length * 0.5) {
      issueCategories.important.push('Add more trust indicators and security messaging for B2B compliance');
    }

    return issueCategories;
  }

  generateHTMLReport(report) {
    const descartesLevel = report.descartesComparison.descartesLevel;
    const levelColor = descartesLevel === 'Enterprise' ? '#059669' : 
                      descartesLevel === 'Professional' ? '#d97706' : '#dc2626';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Descartes Visual Compliance Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #334155;
            background: #f8fafc;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .header { 
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white; 
            padding: 32px 24px; 
            border-radius: 12px;
            margin-bottom: 32px;
        }
        .header h1 { font-size: 2rem; font-weight: 700; margin-bottom: 8px; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
        }
        .summary-card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-left: 4px solid #2563eb;
        }
        .summary-card h3 { color: #1e293b; margin-bottom: 12px; }
        .summary-card .value { 
            font-size: 2rem; 
            font-weight: 700; 
            color: #2563eb; 
            margin-bottom: 4px;
        }
        .summary-card .label { color: #64748b; font-size: 0.9rem; }
        
        .descartes-level {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 24px;
            font-weight: 600;
            color: white;
            background: ${levelColor};
        }
        
        .section { 
            background: white; 
            padding: 32px; 
            border-radius: 12px; 
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .section h2 { 
            color: #1e293b; 
            margin-bottom: 20px; 
            font-size: 1.5rem;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 12px;
        }
        
        .page-analysis {
            display: grid;
            gap: 24px;
        }
        .page-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            background: #fafbfc;
        }
        .page-title {
            font-weight: 600;
            font-size: 1.2rem;
            color: #1e293b;
            margin-bottom: 8px;
        }
        .page-score {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 16px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .score-excellent { background: #dcfce7; color: #166534; }
        .score-good { background: #fef3c7; color: #92400e; }
        .score-poor { background: #fecaca; color: #991b1b; }
        
        .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 16px;
        }
        .category-item {
            padding: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            background: white;
        }
        .category-name { font-weight: 600; margin-bottom: 4px; }
        .category-score { font-size: 1.1rem; font-weight: 700; }
        
        .recommendations {
            margin-top: 24px;
        }
        .rec-section {
            margin-bottom: 20px;
        }
        .rec-section h4 {
            color: #374151;
            margin-bottom: 8px;
            font-size: 1.1rem;
        }
        .rec-list {
            list-style: none;
            padding-left: 0;
        }
        .rec-list li {
            padding: 8px 12px;
            margin-bottom: 4px;
            border-left: 3px solid;
            background: #f9fafb;
        }
        .rec-high { border-left-color: #dc2626; background: #fef2f2; }
        .rec-medium { border-left-color: #d97706; background: #fffbeb; }
        .rec-low { border-left-color: #059669; background: #f0fdfa; }
        
        .footer {
            text-align: center;
            padding: 24px;
            color: #64748b;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Descartes Visual Compliance Report</h1>
            <p>Professional B2B Compliance Form Standards Analysis</p>
            <div style="margin-top: 16px;">
                <span class="descartes-level">${descartesLevel} Level (${report.descartesComparison.overallSimilarity}% similarity)</span>
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <h3>Overall Professional Score</h3>
                <div class="value">${report.summary.avgProfessionalScore}%</div>
                <div class="label">Average across all pages</div>
            </div>
            <div class="summary-card">
                <h3>Pages Analyzed</h3>
                <div class="value">${report.summary.totalPages}</div>
                <div class="label">USMCA compliance pages</div>
            </div>
            <div class="summary-card">
                <h3>Compliance Passed</h3>
                <div class="value">${report.summary.passedPages}</div>
                <div class="label">Pages meeting 85%+ standard</div>
            </div>
            <div class="summary-card">
                <h3>Critical Issues</h3>
                <div class="value">${report.summary.criticalIssues}</div>
                <div class="label">Requiring immediate attention</div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Page-by-Page Analysis</h2>
            <div class="page-analysis">
                ${Object.entries(report.pages).map(([pageName, pageData]) => {
                  if (pageData.error) return '';
                  
                  const scoreClass = pageData.professionalScore >= 85 ? 'score-excellent' :
                                   pageData.professionalScore >= 70 ? 'score-good' : 'score-poor';
                  
                  return `
                    <div class="page-card">
                        <div class="page-title">${pageData.description}</div>
                        <div class="page-score ${scoreClass}">${pageData.professionalScore}% Professional</div>
                        
                        <div class="category-grid">
                            ${Object.entries(pageData.categories).map(([catName, catData]) => `
                                <div class="category-item">
                                    <div class="category-name">${catName.charAt(0).toUpperCase() + catName.slice(1)}</div>
                                    <div class="category-score" style="color: ${catData.score >= 85 ? '#059669' : catData.score >= 70 ? '#d97706' : '#dc2626'}">${catData.score}%</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>

        <div class="section">
            <h2>🎯 Descartes Compliance Assessment</h2>
            <div style="margin-bottom: 20px;">
                <strong>Overall Similarity to Descartes Professional Standards:</strong> ${report.descartesComparison.overallSimilarity}%
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div>
                    <h4 style="color: #059669; margin-bottom: 12px;">✅ Areas Matching Descartes Quality</h4>
                    <ul style="color: #374151;">
                        ${report.descartesComparison.matchingAreas.map(area => `<li style="margin-bottom: 6px;">${area}</li>`).join('')}
                    </ul>
                </div>
                <div>
                    <h4 style="color: #dc2626; margin-bottom: 12px;">⚠️ Areas Needing Improvement</h4>
                    <ul style="color: #374151;">
                        ${report.descartesComparison.improvementAreas.map(area => `<li style="margin-bottom: 6px;">${area}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>🚀 Prioritized Recommendations</h2>
            <div class="recommendations">
                ${report.recommendations.high_priority.length > 0 ? `
                    <div class="rec-section">
                        <h4 style="color: #dc2626;">🔥 High Priority (Fix Immediately)</h4>
                        <ul class="rec-list">
                            ${report.recommendations.high_priority.map(rec => `<li class="rec-high">${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${report.recommendations.medium_priority.length > 0 ? `
                    <div class="rec-section">
                        <h4 style="color: #d97706;">⚡ Medium Priority (Fix Soon)</h4>
                        <ul class="rec-list">
                            ${report.recommendations.medium_priority.map(rec => `<li class="rec-medium">${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${report.recommendations.low_priority.length > 0 ? `
                    <div class="rec-section">
                        <h4 style="color: #059669;">💡 Low Priority (Polish)</h4>
                        <ul class="rec-list">
                            ${report.recommendations.low_priority.map(rec => `<li class="rec-low">${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        </div>

        <div class="footer">
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
            <p>Descartes Visual Compliance Validation System v1.0</p>
        </div>
    </div>
</body>
</html>`;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI execution
async function runValidation() {
  const validator = new DescartesValidationSystem();
  
  try {
    console.log('🚀 Initializing Descartes Visual Compliance Validation...');
    await validator.initialize();
    
    console.log('📸 Capturing USMCA Dashboard screenshots...');
    const captureResults = await validator.captureUsmcaDashboard();
    
    console.log('📋 Generating compliance comparison report...');
    const report = await validator.generateComparisonReport(captureResults);
    
    console.log('\n🎯 DESCARTES COMPLIANCE VALIDATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`Overall Professional Score: ${report.summary.avgProfessionalScore}%`);
    console.log(`Descartes Similarity: ${report.descartesComparison.overallSimilarity}%`);
    console.log(`Compliance Level: ${report.descartesComparison.descartesLevel}`);
    console.log(`Pages Passed: ${report.summary.passedPages}/${report.summary.totalPages}`);
    console.log(`Critical Issues: ${report.summary.criticalIssues}`);
    
    if (report.recommendations.high_priority.length > 0) {
      console.log('\n🔥 HIGH PRIORITY ISSUES:');
      report.recommendations.high_priority.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    console.log('\n📊 View detailed report: ./descartes-validation-results/descartes_compliance_report.html');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    await validator.cleanup();
  }
}

// Export for programmatic use
module.exports = { DescartesValidationSystem };

// Run if called directly
if (require.main === module) {
  runValidation();
}