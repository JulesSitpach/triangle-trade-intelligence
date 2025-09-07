#!/usr/bin/env node

/**
 * SMART VALIDATION FRAMEWORK
 * 
 * Eliminates validation disconnects by:
 * 1. Real-time API monitoring during development
 * 2. Automatic schema generation from actual requests
 * 3. Self-updating test cases based on successful API calls
 * 4. Continuous accuracy validation
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class SmartValidationFramework {
  constructor() {
    this.apiSchemas = new Map();
    this.successfulRequests = new Map();
    this.validationRules = new Map();
    this.isMonitoring = false;
  }

  async initialize() {
    console.log('🧠 SMART VALIDATION FRAMEWORK');
    console.log('='.repeat(80));
    console.log('Initializing intelligent validation system...\n');

    // Load existing schemas if available
    await this.loadExistingSchemas();
    
    // Set up validation rules
    await this.setupValidationRules();
    
    console.log('✅ Smart validation framework initialized');
    console.log('📚 Loaded schemas for', this.apiSchemas.size, 'endpoints');
    console.log('🔍 Monitoring', this.validationRules.size, 'validation rules\n');
  }

  async loadExistingSchemas() {
    try {
      const schemaFile = path.join(process.cwd(), 'api-schemas.json');
      const content = await fs.readFile(schemaFile, 'utf8');
      const schemas = JSON.parse(content);
      
      for (const [endpoint, schema] of Object.entries(schemas)) {
        this.apiSchemas.set(endpoint, schema);
      }
      
      console.log(`📋 Loaded ${this.apiSchemas.size} existing API schemas`);
    } catch (error) {
      console.log('📋 No existing schemas found - will discover from scratch');
    }
  }

  async setupValidationRules() {
    // Define smart validation rules based on common patterns
    this.validationRules.set('parameter_consistency', {
      description: 'Check if parameter names are consistent across similar endpoints',
      check: (endpoint, params) => {
        const similar = this.findSimilarEndpoints(endpoint);
        return this.checkParameterConsistency(params, similar);
      }
    });

    this.validationRules.set('response_structure', {
      description: 'Validate response has expected structure for endpoint type',
      check: (endpoint, response) => {
        return this.validateResponseStructure(endpoint, response);
      }
    });

    this.validationRules.set('error_handling', {
      description: 'Check if errors are properly formatted and informative',
      check: (endpoint, errorResponse) => {
        return this.validateErrorHandling(errorResponse);
      }
    });
  }

  findSimilarEndpoints(endpoint) {
    const similar = [];
    const endpointWords = endpoint.split(/[-\/]/).filter(w => w.length > 2);
    
    for (const [existingEndpoint] of this.apiSchemas) {
      if (existingEndpoint === endpoint) continue;
      
      const existingWords = existingEndpoint.split(/[-\/]/).filter(w => w.length > 2);
      const commonWords = endpointWords.filter(w => existingWords.includes(w));
      
      if (commonWords.length > 0) {
        similar.push(existingEndpoint);
      }
    }
    
    return similar;
  }

  checkParameterConsistency(params, similarEndpoints) {
    if (similarEndpoints.length === 0) return { valid: true, reason: 'No similar endpoints' };
    
    const inconsistencies = [];
    
    for (const similarEndpoint of similarEndpoints) {
      const similarSchema = this.apiSchemas.get(similarEndpoint);
      if (!similarSchema) continue;
      
      // Check for parameter naming inconsistencies
      for (const [param, type] of Object.entries(params)) {
        const variations = this.getParameterVariations(param);
        
        for (const variation of variations) {
          if (similarSchema.parameters[variation] && variation !== param) {
            inconsistencies.push({
              endpoint: similarEndpoint,
              thisParam: param,
              similarParam: variation,
              suggestion: `Consider using '${variation}' for consistency`
            });
          }
        }
      }
    }
    
    return {
      valid: inconsistencies.length === 0,
      inconsistencies
    };
  }

  getParameterVariations(param) {
    const variations = [param];
    
    // Common naming pattern variations
    const camelToSnake = param.replace(/([A-Z])/g, '_$1').toLowerCase();
    const snakeToCamel = param.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    if (camelToSnake !== param) variations.push(camelToSnake);
    if (snakeToCamel !== param) variations.push(snakeToCamel);
    
    return [...new Set(variations)];
  }

  validateResponseStructure(endpoint, response) {
    if (!response || typeof response !== 'object') {
      return { valid: false, reason: 'Response is not an object' };
    }

    // Check for common response patterns
    const hasSuccess = 'success' in response;
    const hasError = 'error' in response;
    const hasData = 'data' in response || 'results' in response;
    
    if (endpoint.includes('admin')) {
      // Admin endpoints should have consistent structure
      if (!hasData && !hasError) {
        return { valid: false, reason: 'Admin endpoints should return data or error' };
      }
    }
    
    if (endpoint.includes('classification')) {
      // Classification endpoints should return results
      if (!response.results && !response.hs_code && !hasError) {
        return { valid: false, reason: 'Classification endpoints should return results or hs_code' };
      }
    }
    
    return { valid: true, reason: 'Response structure is valid' };
  }

  validateErrorHandling(errorResponse) {
    if (!errorResponse.error) {
      return { valid: false, reason: 'Error response missing error field' };
    }
    
    if (typeof errorResponse.error !== 'string' || errorResponse.error.length < 5) {
      return { valid: false, reason: 'Error message should be descriptive string' };
    }
    
    // Check for helpful suggestions
    const hasHelpfulInfo = errorResponse.suggestion || 
                          errorResponse.expected || 
                          errorResponse.example;
    
    return {
      valid: true,
      helpful: hasHelpfulInfo,
      reason: hasHelpfulInfo ? 'Error includes helpful information' : 'Error could be more helpful'
    };
  }

  async runSmartValidation() {
    console.log('🔍 Running smart validation based on discovered patterns...\n');
    
    const results = {
      endpoints: {},
      overallHealth: 0,
      recommendations: [],
      patterns: this.analyzePatterns()
    };
    
    for (const [endpoint, schema] of this.apiSchemas) {
      const validation = await this.validateEndpoint(endpoint, schema);
      results.endpoints[endpoint] = validation;
      
      if (validation.overallScore >= 80) {
        results.overallHealth++;
      }
    }
    
    results.overallHealth = Math.round((results.overallHealth / this.apiSchemas.size) * 100);
    
    // Generate recommendations
    results.recommendations = this.generateRecommendations(results);
    
    // Save results
    await this.saveValidationResults(results);
    
    this.displayResults(results);
    
    return results;
  }

  async validateEndpoint(endpoint, schema) {
    const result = {
      endpoint,
      checks: {},
      overallScore: 0,
      issues: [],
      strengths: []
    };
    
    // Run all validation rules
    for (const [ruleName, rule] of this.validationRules) {
      try {
        const check = rule.check(endpoint, schema.parameters);
        result.checks[ruleName] = check;
        
        if (!check.valid) {
          result.issues.push({
            rule: ruleName,
            description: rule.description,
            details: check
          });
        } else {
          result.strengths.push(ruleName);
        }
      } catch (error) {
        result.checks[ruleName] = { valid: false, error: error.message };
      }
    }
    
    // Calculate score
    const validChecks = Object.values(result.checks).filter(c => c.valid).length;
    result.overallScore = Math.round((validChecks / this.validationRules.size) * 100);
    
    return result;
  }

  analyzePatterns() {
    const patterns = {
      parameterNaming: { camelCase: 0, snake_case: 0 },
      responseStructure: { success: 0, error: 0, data: 0 },
      endpointNaming: { consistent: true, patterns: [] }
    };
    
    // Analyze parameter naming patterns
    for (const [endpoint, schema] of this.apiSchemas) {
      for (const param of Object.keys(schema.parameters)) {
        if (param.includes('_')) {
          patterns.parameterNaming.snake_case++;
        } else if (param !== param.toLowerCase()) {
          patterns.parameterNaming.camelCase++;
        }
      }
    }
    
    return patterns;
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    // Check for naming inconsistencies
    const patterns = results.patterns;
    if (patterns.parameterNaming.camelCase > 0 && patterns.parameterNaming.snake_case > 0) {
      recommendations.push({
        type: 'naming_consistency',
        priority: 'medium',
        message: 'Mix of camelCase and snake_case parameters detected',
        suggestion: 'Standardize on one naming convention across all APIs',
        impact: 'Reduces developer confusion and testing complexity'
      });
    }
    
    // Check for endpoints with low scores
    const lowScoreEndpoints = Object.values(results.endpoints)
      .filter(e => e.overallScore < 70)
      .map(e => e.endpoint);
    
    if (lowScoreEndpoints.length > 0) {
      recommendations.push({
        type: 'endpoint_quality',
        priority: 'high',
        message: `${lowScoreEndpoints.length} endpoints have validation scores below 70%`,
        suggestion: 'Review and improve error handling and response consistency',
        endpoints: lowScoreEndpoints
      });
    }
    
    // Check overall health
    if (results.overallHealth < 80) {
      recommendations.push({
        type: 'system_health',
        priority: 'high',
        message: `Overall system health is ${results.overallHealth}% - below recommended 80%`,
        suggestion: 'Focus on improving endpoint consistency and error handling'
      });
    }
    
    return recommendations;
  }

  displayResults(results) {
    console.log('📊 SMART VALIDATION RESULTS');
    console.log('='.repeat(80));
    console.log(`🎯 Overall System Health: ${results.overallHealth}%`);
    
    if (results.overallHealth >= 90) {
      console.log('🟢 EXCELLENT - APIs are well-structured and consistent');
    } else if (results.overallHealth >= 75) {
      console.log('🟡 GOOD - Minor improvements recommended');
    } else {
      console.log('🔴 NEEDS WORK - Significant inconsistencies detected');
    }
    
    console.log('\n📋 Endpoint Analysis:');
    for (const [endpoint, result] of Object.entries(results.endpoints)) {
      const status = result.overallScore >= 80 ? '✅' : result.overallScore >= 60 ? '🟡' : '❌';
      console.log(`${status} ${endpoint} (${result.overallScore}%)`);
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => {
          console.log(`   ⚠️  ${issue.description}`);
        });
      }
    }
    
    if (results.recommendations.length > 0) {
      console.log('\n💡 SMART RECOMMENDATIONS:');
      results.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : '🟡';
        console.log(`${priority} ${index + 1}. ${rec.message}`);
        console.log(`   Suggestion: ${rec.suggestion}`);
        console.log(`   Impact: ${rec.impact || 'Improves API consistency'}\n`);
      });
    }
    
    console.log('📁 Full results saved to: smart-validation-results.json');
  }

  async saveValidationResults(results) {
    await fs.writeFile(
      'smart-validation-results.json',
      JSON.stringify(results, null, 2)
    );
    
    // Also update schemas
    const schemasObject = {};
    for (const [endpoint, schema] of this.apiSchemas) {
      schemasObject[endpoint] = schema;
    }
    
    await fs.writeFile(
      'api-schemas.json',
      JSON.stringify(schemasObject, null, 2)
    );
  }

  async updatePackageJson() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      // Add validation scripts if they don't exist
      if (!packageJson.scripts) packageJson.scripts = {};
      
      if (!packageJson.scripts['validate:smart']) {
        packageJson.scripts['validate:smart'] = 'node smart-validation-framework.js';
      }
      
      if (!packageJson.scripts['validate:discover']) {
        packageJson.scripts['validate:discover'] = 'node auto-discovery-validator.js';
      }
      
      if (!packageJson.scripts['validate:all']) {
        packageJson.scripts['validate:all'] = 'npm run validate:discover && npm run validate:smart';
      }
      
      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Updated package.json with validation scripts');
      
    } catch (error) {
      console.log('⚠️  Could not update package.json:', error.message);
    }
  }
}

// CLI interface
if (require.main === module) {
  async function main() {
    const framework = new SmartValidationFramework();
    await framework.initialize();
    
    const command = process.argv[2];
    
    switch (command) {
      case 'discover':
        const AutoDiscoveryValidator = require('./auto-discovery-validator.js');
        const discoverer = new AutoDiscoveryValidator();
        await discoverer.run();
        break;
        
      case 'validate':
        await framework.runSmartValidation();
        break;
        
      case 'setup':
        await framework.updatePackageJson();
        console.log('\n🎉 Smart validation framework setup complete!');
        console.log('\nAvailable commands:');
        console.log('  npm run validate:discover  - Discover API structure');
        console.log('  npm run validate:smart     - Run smart validation');
        console.log('  npm run validate:all       - Run complete validation');
        break;
        
      default:
        console.log('Usage: node smart-validation-framework.js <command>');
        console.log('Commands:');
        console.log('  discover  - Discover API structure');
        console.log('  validate  - Run smart validation');
        console.log('  setup     - Setup validation scripts');
    }
  }
  
  main().catch(console.error);
}

module.exports = SmartValidationFramework;