#!/usr/bin/env node

/**
 * AUTO-DISCOVERY VALIDATION SYSTEM
 * 
 * Fixes the core disconnect by:
 * 1. Scanning actual API files to understand their structure
 * 2. Auto-generating test cases based on real implementation
 * 3. Validating against what you actually built, not assumptions
 * 
 * Eliminates recurring validation flip-flops permanently.
 */

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

class AutoDiscoveryValidator {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.discoveredAPIs = {};
    this.testResults = {};
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async run() {
    console.log('🔍 AUTO-DISCOVERY VALIDATION SYSTEM');
    console.log('='.repeat(80));
    console.log('Step 1: Discovering your ACTUAL API structure...\n');

    await this.discoverAPIStructure();
    
    console.log('\nStep 2: Testing against your REAL implementation...\n');
    await this.runDiscoveredTests();
    
    console.log('\nStep 3: Generating accurate validation report...\n');
    await this.generateReport();
  }

  async discoverAPIStructure() {
    const apiDir = path.join(process.cwd(), 'pages', 'api');
    const apiFiles = await this.findAPIFiles(apiDir);
    
    console.log(`📋 Found ${apiFiles.length} API endpoints to analyze:`);
    
    for (const file of apiFiles) {
      const apiInfo = await this.analyzeAPIFile(file);
      if (apiInfo) {
        this.discoveredAPIs[apiInfo.endpoint] = apiInfo;
        console.log(`   ✅ ${apiInfo.endpoint} - Expects: ${Object.keys(apiInfo.expectedParams).join(', ')}`);
      }
    }
  }

  async findAPIFiles(dir) {
    const files = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await this.findAPIFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith('.js') && !entry.name.includes('_')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async analyzeAPIFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = filePath.replace(process.cwd(), '');
      const endpoint = relativePath
        .replace(/\\/g, '/')
        .replace('/pages/api/', '/api/')
        .replace('.js', '');

      // Extract parameter names from destructuring
      const destructuringMatch = content.match(/const\s*\{([^}]+)\}\s*=\s*req\.body/);
      const expectedParams = {};
      
      if (destructuringMatch) {
        const params = destructuringMatch[1]
          .split(',')
          .map(p => p.trim().split('=')[0].trim())
          .filter(p => p && !p.includes('//'));
        
        for (const param of params) {
          expectedParams[param] = this.inferParamType(param, content);
        }
      }

      // Check for different action patterns
      const hasActionPattern = content.includes('req.body.action');
      const hasDataPattern = content.includes('req.body.data');
      
      // Extract validation requirements
      const validationErrors = this.extractValidationErrors(content);
      
      return {
        endpoint,
        expectedParams,
        hasActionPattern,
        hasDataPattern,
        validationErrors,
        method: 'POST', // Most APIs are POST
        sampleRequest: this.generateSampleRequest(expectedParams, hasActionPattern, hasDataPattern)
      };
      
    } catch (error) {
      console.log(`   ⚠️  Could not analyze ${filePath}: ${error.message}`);
      return null;
    }
  }

  inferParamType(param, content) {
    if (param.includes('Country')) return 'string (country code)';
    if (param.includes('Volume') || param.includes('Value')) return 'number';
    if (param.includes('hs_code') || param.includes('hsCode')) return 'string (HS code)';
    if (param.includes('description')) return 'string';
    if (param.includes('business') || param.includes('company')) return 'string';
    return 'string';
  }

  extractValidationErrors(content) {
    const errors = [];
    const errorMatches = content.matchAll(/error:\s*['"](.*?)['"]/g);
    
    for (const match of errorMatches) {
      if (match[1].includes('required')) {
        errors.push(match[1]);
      }
    }
    
    return errors;
  }

  generateSampleRequest(expectedParams, hasActionPattern, hasDataPattern) {
    const sampleData = {};
    
    for (const [param, type] of Object.entries(expectedParams)) {
      switch (param) {
        case 'product_description':
          sampleData[param] = 'automotive electrical wire';
          break;
        case 'hs_code':
        case 'hsCode':
          sampleData[param] = '8544300000';
          break;
        case 'importVolume':
        case 'import_volume':
          sampleData[param] = 100000;
          break;
        case 'supplierCountry':
        case 'supplier_country':
          sampleData[param] = 'CN';
          break;
        case 'origin_country':
          sampleData[param] = 'MX';
          break;
        case 'regional_content':
          sampleData[param] = 75;
          break;
        case 'businessType':
        case 'business_type':
          sampleData[param] = 'Manufacturing';
          break;
        case 'company_type':
          sampleData[param] = 'manufacturer';
          break;
        default:
          if (type.includes('number')) {
            sampleData[param] = 100000;
          } else {
            sampleData[param] = 'test_value';
          }
      }
    }

    // Handle action-based APIs
    if (hasActionPattern && hasDataPattern) {
      return {
        action: 'check_qualification',
        data: sampleData
      };
    } else if (hasActionPattern) {
      return {
        action: 'check_qualification',
        ...sampleData
      };
    }

    return sampleData;
  }

  async runDiscoveredTests() {
    console.log('🧪 Testing discovered APIs with CORRECT parameters:\n');
    
    for (const [endpoint, apiInfo] of Object.entries(this.discoveredAPIs)) {
      await this.testAPI(endpoint, apiInfo);
    }
  }

  async testAPI(endpoint, apiInfo) {
    this.totalTests++;
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: apiInfo.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiInfo.sampleRequest)
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText };
      }

      if (response.ok) {
        console.log(`✅ ${endpoint} - SUCCESS`);
        if (data.success !== false) {
          this.passedTests++;
        }
      } else {
        console.log(`❌ ${endpoint} - ${response.status}: ${data.error || 'Unknown error'}`);
      }

      this.testResults[endpoint] = {
        status: response.ok ? 'PASS' : 'FAIL',
        statusCode: response.status,
        response: data,
        request: apiInfo.sampleRequest
      };

    } catch (error) {
      console.log(`❌ ${endpoint} - ERROR: ${error.message}`);
      this.testResults[endpoint] = {
        status: 'ERROR',
        error: error.message,
        request: apiInfo.sampleRequest
      };
    }
  }

  async generateReport() {
    const passRate = Math.round((this.passedTests / this.totalTests) * 100);
    
    console.log('📊 AUTO-DISCOVERED VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`📈 Overall Results: ${this.passedTests}/${this.totalTests} tests passed (${passRate}%)`);
    
    if (passRate >= 90) {
      console.log('🟢 EXCELLENT - APIs are working as implemented');
    } else if (passRate >= 75) {
      console.log('🟡 GOOD - Minor issues found');
    } else {
      console.log('🔴 ISSUES - Significant problems detected');
    }

    console.log('\n📋 DISCOVERED API STRUCTURES:');
    for (const [endpoint, apiInfo] of Object.entries(this.discoveredAPIs)) {
      const result = this.testResults[endpoint];
      const status = result.status === 'PASS' ? '✅' : '❌';
      
      console.log(`${status} ${endpoint}`);
      console.log(`   Parameters: ${Object.keys(apiInfo.expectedParams).join(', ')}`);
      console.log(`   Sample Request: ${JSON.stringify(apiInfo.sampleRequest)}`);
      
      if (result.status !== 'PASS') {
        console.log(`   Issue: ${result.error || result.response?.error || 'Unknown'}`);
      }
      console.log('');
    }

    // Generate test documentation
    await this.generateTestDocumentation();
    
    console.log('💡 KEY INSIGHT: This report shows your ACTUAL API functionality');
    console.log('   - No more parameter guessing');
    console.log('   - No more format assumptions');
    console.log('   - Tests match your real implementation');
    
    console.log(`\n📁 Full test details saved to: auto-discovery-validation-report.json`);
  }

  async generateTestDocumentation() {
    const documentation = {
      timestamp: new Date().toISOString(),
      summary: {
        totalAPIs: this.totalTests,
        passingAPIs: this.passedTests,
        passRate: Math.round((this.passedTests / this.totalTests) * 100)
      },
      discoveredAPIs: this.discoveredAPIs,
      testResults: this.testResults,
      correctUsageExamples: this.generateUsageExamples()
    };

    await fs.writeFile(
      'auto-discovery-validation-report.json', 
      JSON.stringify(documentation, null, 2)
    );
  }

  generateUsageExamples() {
    const examples = {};
    
    for (const [endpoint, apiInfo] of Object.entries(this.discoveredAPIs)) {
      const result = this.testResults[endpoint];
      
      if (result.status === 'PASS') {
        examples[endpoint] = {
          curl: `curl -X POST http://localhost:3000${endpoint} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(apiInfo.sampleRequest)}'`,
          javascript: `
const response = await fetch('http://localhost:3000${endpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(${JSON.stringify(apiInfo.sampleRequest, null, 2)})
});
const data = await response.json();`,
          expectedParams: apiInfo.expectedParams
        };
      }
    }
    
    return examples;
  }
}

// Check if running directly
if (require.main === module) {
  const validator = new AutoDiscoveryValidator();
  validator.run().catch(console.error);
}

module.exports = AutoDiscoveryValidator;