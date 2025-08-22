/**
 * Data Authenticity Validator
 * Runtime validation to ensure Triangle Intelligence uses authentic data sources
 * 
 * MISSION: Identify and flag fabricated metrics in business-critical calculations
 */

import { logWarn, logError, logInfo } from '../production-logger.js';

export class DataAuthenticityValidator {
  static FABRICATED_PATTERNS = {
    // Hardcoded percentage patterns that need validation
    PERCENTAGE_PATTERNS: [
      /\b(8[0-9]|9[0-9])%\b/g,  // High percentages (80-99%) often fabricated
      /reliability:\s*["'](\d+)%["']/g,  // Hardcoded reliability percentages
      /success_rate:\s*0\.\d+/g,  // Decimal success rates without source
      // SPECIFIC FABRICATED METRICS IDENTIFIED IN AUDIT:
      /88%/g, /92%/g, /85%/g, /86%/g, /87%/g, /91%/g,  // Static route reliability rates
    ],
    
    // Dollar amount patterns without calculation basis
    DOLLAR_PATTERNS: [
      /\$(\d+)K-\$(\d+)K annually/g,  // Annual savings ranges
      /\$(\d+)K\+/g,  // Plus savings indicators  
      /estimated.*\$(\d+)/gi,  // Estimated dollar amounts
      // SPECIFIC FABRICATED SAVINGS IDENTIFIED IN AUDIT:
      /\$180K-\$420K/g, /\$210K-\$480K/g, /\$150K-\$350K/g,  // Executive insight savings
      /\$245K/g,  // Marcus intelligence average savings
    ],
    
    // Hardcoded shipping cost patterns  
    SHIPPING_COST_PATTERNS: [
      /\$2\.[0-9]0-3\.[0-9]0/g,  // Shipping cost ranges like $2.80-3.20
      /costPerKg:\s*["\$]/g,  // Hardcoded cost per kg values
    ],
    
    // Hardcoded volatility and rates
    RATE_PATTERNS: [
      /volatility.*0\.\d+/g,  // Hardcoded volatility decimals
      /rate.*0\.\d+/g,  // Hardcoded rate decimals
      /'CN':\s*0\.\d+/g,  // China rates without API source
      /'IN':\s*0\.\d+/g,  // India rates without API source
      // SPECIFIC FABRICATED VOLATILITY RATES:
      /0\.85.*CN/g, /0\.75.*IN/g, /0\.65.*VN/g, /0\.55.*TH/g,  // Beast Master volatility
    ],
    
    // ROI and success rate fabrications  
    ROI_PATTERNS: [
      /roiMultiple:\s*\d+/g,  // Hardcoded ROI multiples
      /paybackPeriod:\s*['"](\d+-\d+|4-6)\s*months['\"]/g,  // Fabricated payback periods
      /25x?\s*ROI/g,  // Marcus intelligence ROI claims
    ],
    
    // Generic fabricated strings
    FABRICATED_STRINGS: [
      'Triangle routing via Mexico',
      '$245K',
      'significant cost savings',
      'proven success patterns',
      'similar successful companies',
      '92% success with similar implementations',
      '25x ROI within',
      '4-6 months'
    ]
  };
  
  static ACCEPTABLE_VALUES = {
    // Treaty-locked values that are acceptable
    USMCA_RATES: [0, 0.0, '0%'],
    TREATY_LOCKED_COUNTRIES: ['MX', 'CA', 'Mexico', 'Canada'],
    
    // Known authentic data sources
    AUTHENTIC_SOURCES: [
      'WCO_OFFICIAL',
      'AUTHENTIC_WCO_REFERENCE',
      'USMCA_TREATY',
      'DATABASE_QUERY_RESULT'
    ]
  };
  
  /**
   * Validate code file for fabricated data patterns
   */
  static async validateFile(filePath, fileContent) {
    const results = {
      filePath,
      fabricatedIssues: [],
      authenticDataFound: [],
      score: 100,
      recommendations: []
    };
    
    // Check for fabricated percentage patterns
    results.fabricatedIssues.push(...this.findFabricatedPatterns(fileContent));
    
    // Check for authentic data patterns
    results.authenticDataFound.push(...this.findAuthenticDataPatterns(fileContent));
    
    // Calculate authenticity score
    results.score = this.calculateAuthenticityScore(results);
    
    // Generate recommendations
    results.recommendations = this.generateRecommendations(results);
    
    return results;
  }
  
  /**
   * Find fabricated data patterns in code
   */
  static findFabricatedPatterns(content) {
    const issues = [];
    
    // Check percentage patterns
    this.FABRICATED_PATTERNS.PERCENTAGE_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            type: 'FABRICATED_PERCENTAGE',
            pattern: match,
            severity: 'HIGH',
            message: 'Hardcoded percentage without data source verification'
          });
        });
      }
    });
    
    // Check dollar amount patterns
    this.FABRICATED_PATTERNS.DOLLAR_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            type: 'FABRICATED_DOLLAR_AMOUNT',
            pattern: match,
            severity: 'CRITICAL',
            message: 'Dollar amount without calculation methodology'
          });
        });
      }
    });
    
    // Check shipping cost patterns
    this.FABRICATED_PATTERNS.SHIPPING_COST_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            type: 'FABRICATED_SHIPPING_COST',
            pattern: match,
            severity: 'HIGH',
            message: 'Hardcoded shipping cost without API integration'
          });
        });
      }
    });
    
    // Check ROI patterns
    this.FABRICATED_PATTERNS.ROI_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            type: 'FABRICATED_ROI',
            pattern: match,
            severity: 'CRITICAL',
            message: 'ROI calculation without verifiable methodology'
          });
        });
      }
    });
    
    // Check rate patterns
    this.FABRICATED_PATTERNS.RATE_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Skip if this is an acceptable USMCA rate
          if (!this.isAcceptableValue(match)) {
            issues.push({
              type: 'FABRICATED_RATE',
              pattern: match,
              severity: 'HIGH',
              message: 'Hardcoded rate without live data source'
            });
          }
        });
      }
    });
    
    // Check for fabricated strings
    this.FABRICATED_PATTERNS.FABRICATED_STRINGS.forEach(fabricatedString => {
      if (content.includes(fabricatedString)) {
        issues.push({
          type: 'FABRICATED_STRING',
          pattern: fabricatedString,
          severity: 'MEDIUM',
          message: 'Hardcoded string that should be calculated or sourced'
        });
      }
    });
    
    return issues;
  }
  
  /**
   * Find authentic data patterns in code
   */
  static findAuthenticDataPatterns(content) {
    const authentic = [];
    
    // Check for database queries
    if (content.includes('supabase') || content.includes('.from(')) {
      authentic.push({
        type: 'DATABASE_QUERY',
        pattern: 'Database query detected',
        confidence: 'HIGH'
      });
    }
    
    // Check for authentic data sources
    this.ACCEPTABLE_VALUES.AUTHENTIC_SOURCES.forEach(source => {
      if (content.includes(source)) {
        authentic.push({
          type: 'AUTHENTIC_SOURCE',
          pattern: source,
          confidence: 'HIGH'
        });
      }
    });
    
    // Check for proper logging
    if (content.includes('logDBQuery') || content.includes('logPerformance')) {
      authentic.push({
        type: 'PROPER_LOGGING',
        pattern: 'Production logging detected',
        confidence: 'MEDIUM'
      });
    }
    
    // Check for data validation
    if (content.includes('validateData') || content.includes('corruption') || content.includes('authentic')) {
      authentic.push({
        type: 'DATA_VALIDATION',
        pattern: 'Data validation logic detected',
        confidence: 'HIGH'
      });
    }
    
    // Check for authentic calculator integration
    if (content.includes('authentic-shipping-calculator') || content.includes('authentic-reliability-calculator') || content.includes('authentic-savings-calculator')) {
      authentic.push({
        type: 'AUTHENTIC_CALCULATOR',
        pattern: 'Authentic calculator integration detected',
        confidence: 'HIGH'
      });
    }
    
    // Check for calculation methodology transparency
    if (content.includes('CALCULATED_VIA') || content.includes('AUTHENTIC_DATA_SOURCE') || content.includes('methodology')) {
      authentic.push({
        type: 'METHODOLOGY_TRANSPARENCY',
        pattern: 'Calculation methodology documented',
        confidence: 'HIGH'
      });
    }
    
    // Check for data source transparency
    if (content.includes('dataSource') && (content.includes('confidence') || content.includes('lastVerified'))) {
      authentic.push({
        type: 'DATA_SOURCE_TRANSPARENCY',
        pattern: 'Data source and confidence tracking',
        confidence: 'HIGH'
      });
    }
    
    // Check for treaty-verified data (acceptable hardcoded values)
    if (content.includes('USMCA_TREATY') || content.includes('treaty-locked') || content.includes('TREATY_VERIFIED')) {
      authentic.push({
        type: 'TREATY_VERIFIED_DATA',
        pattern: 'Treaty-verified data source',
        confidence: 'HIGH'
      });
    }
    
    return authentic;
  }
  
  /**
   * Check if a value is acceptable (treaty-locked, etc.)
   */
  static isAcceptableValue(value) {
    // Check if it's a USMCA rate (0% is acceptable)
    if (value.includes('MX') || value.includes('CA') || value.includes('0.0') || value.includes('0%')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Calculate authenticity score
   */
  static calculateAuthenticityScore(results) {
    let score = 100;
    
    // Deduct points for fabricated issues
    results.fabricatedIssues.forEach(issue => {
      switch (issue.severity) {
        case 'CRITICAL':
          score -= 15;
          break;
        case 'HIGH':
          score -= 10;
          break;
        case 'MEDIUM':
          score -= 5;
          break;
        default:
          score -= 2;
      }
    });
    
    // Add points for authentic data patterns
    results.authenticDataFound.forEach(authentic => {
      switch (authentic.confidence) {
        case 'HIGH':
          score += 5;
          break;
        case 'MEDIUM':
          score += 2;
          break;
      }
    });
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Generate recommendations for improving data authenticity
   */
  static generateRecommendations(results) {
    const recommendations = [];
    
    // Critical issues
    const criticalIssues = results.fabricatedIssues.filter(issue => issue.severity === 'CRITICAL');
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: `Replace ${criticalIssues.length} critical fabricated values with database calculations`,
        impact: 'HIGH - Affects business decision accuracy'
      });
    }
    
    // High severity issues
    const highIssues = results.fabricatedIssues.filter(issue => issue.severity === 'HIGH');
    if (highIssues.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: `Connect ${highIssues.length} hardcoded values to live data sources`,
        impact: 'MEDIUM - Affects calculation reliability'
      });
    }
    
    // Missing database queries
    const hasDbQueries = results.authenticDataFound.some(auth => auth.type === 'DATABASE_QUERY');
    if (!hasDbQueries) {
      recommendations.push({
        priority: 'HIGH', 
        action: 'Add database queries for dynamic data instead of hardcoded values',
        impact: 'HIGH - Enable real-time intelligence'
      });
    }
    
    // Missing data validation
    const hasValidation = results.authenticDataFound.some(auth => auth.type === 'DATA_VALIDATION');
    if (!hasValidation && results.fabricatedIssues.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Add data validation to ensure authenticity at runtime',
        impact: 'MEDIUM - Prevent fabricated data in production'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Runtime validation for production use
   */
  static validateRuntimeData(data, context = {}) {
    const warnings = [];
    
    // Check for suspicious patterns in runtime data
    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        // Check for fabricated percentages
        if (typeof value === 'string' && value.match(/^(8[0-9]|9[0-9])%$/)) {
          warnings.push({
            type: 'SUSPICIOUS_PERCENTAGE',
            key,
            value,
            message: 'High percentage value without data source verification'
          });
        }
        
        // Check for fabricated dollar amounts
        if (typeof value === 'string' && value.match(/^\$\d+K-\$\d+K/)) {
          warnings.push({
            type: 'SUSPICIOUS_DOLLAR_RANGE',
            key,
            value,
            message: 'Dollar range without calculation basis'
          });
        }
        
        // Check for hardcoded success rates
        if (key.includes('success') && typeof value === 'number' && value > 0.8 && value < 1.0) {
          warnings.push({
            type: 'SUSPICIOUS_SUCCESS_RATE',
            key,
            value,
            message: 'High success rate without verification source'
          });
        }
      });
    }
    
    // Log warnings in production
    if (warnings.length > 0) {
      logWarn('DATA_AUTHENTICITY: Suspicious patterns detected', {
        context: context.source || 'unknown',
        warningCount: warnings.length,
        warnings: warnings.slice(0, 3) // Limit log size
      });
    }
    
    return {
      isAuthentic: warnings.length === 0,
      warnings,
      recommendedAction: warnings.length > 0 ? 'Review data sources for fabricated values' : null
    };
  }
  
  /**
   * Generate data authenticity report
   */
  static generateAuthenticityReport(fileResults) {
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: fileResults.length,
      summary: {
        authenticFiles: 0,
        fabricatedIssues: 0,
        criticalIssues: 0,
        averageScore: 0
      },
      recommendations: [],
      fileDetails: fileResults
    };
    
    // Calculate summary statistics
    fileResults.forEach(result => {
      if (result.score >= 90) report.summary.authenticFiles++;
      report.summary.fabricatedIssues += result.fabricatedIssues.length;
      report.summary.criticalIssues += result.fabricatedIssues.filter(i => i.severity === 'CRITICAL').length;
      report.summary.averageScore += result.score;
    });
    
    report.summary.averageScore = Math.round(report.summary.averageScore / fileResults.length);
    
    // Generate consolidated recommendations
    if (report.summary.criticalIssues > 0) {
      report.recommendations.push({
        priority: 1,
        action: `Address ${report.summary.criticalIssues} critical fabricated data issues immediately`,
        files: fileResults.filter(r => r.fabricatedIssues.some(i => i.severity === 'CRITICAL')).map(r => r.filePath)
      });
    }
    
    if (report.summary.fabricatedIssues > report.summary.criticalIssues) {
      report.recommendations.push({
        priority: 2,
        action: `Replace ${report.summary.fabricatedIssues - report.summary.criticalIssues} hardcoded values with database queries`,
        files: fileResults.filter(r => r.fabricatedIssues.length > 0).map(r => r.filePath)
      });
    }
    
    return report;
  }
}

/**
 * Convenience function for development use
 */
export async function validateFileAuthenticity(filePath, fileContent) {
  return await DataAuthenticityValidator.validateFile(filePath, fileContent);
}

/**
 * Runtime validation middleware
 */
export function validateDataAuthenticity(data, context) {
  return DataAuthenticityValidator.validateRuntimeData(data, context);
}

export default DataAuthenticityValidator;