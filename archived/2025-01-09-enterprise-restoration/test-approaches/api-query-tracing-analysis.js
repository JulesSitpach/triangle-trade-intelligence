#!/usr/bin/env node

/**
 * API-TO-DATABASE QUERY TRACING ANALYSIS
 * 
 * Trace exactly how each API queries the database
 * Map data flow from database through APIs to UI
 * Identify where real data gets replaced with fallbacks
 */

const fs = require('fs');
const path = require('path');

class APIQueryTracingAnalyzer {
  constructor() {
    this.analysis = {
      apis: {},
      queryPatterns: {},
      dataFlow: {},
      fallbackLogic: {},
      integrationPoints: {}
    };
  }

  async analyzeComplete() {
    console.log('🔍 API-TO-DATABASE QUERY TRACING ANALYSIS');
    console.log('Mapping complete data flow from database to UI\n');

    await this.discoverAllAPIs();
    await this.analyzeAPIQueries();
    await this.mapDataFlow();
    await this.identifyFallbackLogic();
    await this.analyzeIntegrationPoints();
    
    return this.generateDataFlowReport();
  }

  async discoverAllAPIs() {
    console.log('📋 DISCOVERING ALL API ENDPOINTS\n');
    
    const apiDir = path.join(__dirname, 'pages', 'api');
    const apiFiles = this.getAllAPIFiles(apiDir);
    
    console.log(`Found ${apiFiles.length} API files:`);
    apiFiles.forEach(file => {
      console.log(`   📄 ${file}`);
    });
    
    this.analysis.apis = apiFiles.reduce((acc, file) => {
      acc[file] = { path: file, queries: [], tables: [], fallbacks: [] };
      return acc;
    }, {});
    
    console.log('');
  }

  getAllAPIFiles(dir, baseDir = dir) {
    let files = [];
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(this.getAllAPIFiles(fullPath, baseDir));
      } else if (item.endsWith('.js')) {
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        files.push(relativePath);
      }
    }
    
    return files;
  }

  async analyzeAPIQueries() {
    console.log('🔍 ANALYZING API DATABASE QUERIES\n');
    
    const coreAPIs = [
      'simple-classification.js',
      'simple-savings.js', 
      'simple-usmca-compliance.js',
      'context-classification.js',
      'crisis-solutions.js'
    ];

    for (const apiFile of coreAPIs) {
      await this.analyzeAPIFile(apiFile);
    }
  }

  async analyzeAPIFile(apiFile) {
    console.log(`🔧 ANALYZING: ${apiFile}`);
    
    const apiPath = path.join(__dirname, 'pages', 'api', apiFile);
    
    if (!fs.existsSync(apiPath)) {
      console.log(`   ❌ File not found: ${apiFile}\n`);
      return;
    }

    const content = fs.readFileSync(apiPath, 'utf8');
    
    // Find database queries
    const queries = this.extractDatabaseQueries(content);
    const tables = this.extractTableReferences(content);
    const fallbacks = this.extractFallbackLogic(content);
    
    console.log(`   📊 Database queries found: ${queries.length}`);
    console.log(`   📋 Tables referenced: ${tables.join(', ')}`);
    console.log(`   🔄 Fallback patterns: ${fallbacks.length}`);
    
    // Analyze specific query patterns
    queries.forEach((query, idx) => {
      console.log(`   Query ${idx + 1}:`);
      console.log(`     Table: ${query.table}`);
      console.log(`     Type: ${query.type}`);
      if (query.conditions.length > 0) {
        console.log(`     Conditions: ${query.conditions.join(', ')}`);
      }
    });

    // Analyze fallback logic
    fallbacks.forEach((fallback, idx) => {
      console.log(`   Fallback ${idx + 1}:`);
      console.log(`     Trigger: ${fallback.trigger}`);
      console.log(`     Action: ${fallback.action}`);
    });

    this.analysis.apis[apiFile] = {
      path: apiFile,
      queries: queries,
      tables: tables,
      fallbacks: fallbacks,
      usesRealData: this.determineRealDataUsage(tables, queries),
      queryStrategy: this.analyzeQueryStrategy(queries, fallbacks)
    };

    console.log(`   📈 Uses real data: ${this.analysis.apis[apiFile].usesRealData ? '✅' : '❌'}`);
    console.log(`   🎯 Query strategy: ${this.analysis.apis[apiFile].queryStrategy}\n`);
  }

  extractDatabaseQueries(content) {
    const queries = [];
    
    // Look for Supabase query patterns
    const supabasePatterns = [
      /\.from\(['"]([^'"]+)['"]\)/g,
      /supabase\s*\.\s*from\(['"]([^'"]+)['"]\)/g
    ];

    supabasePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const table = match[1];
        
        // Find the full query context
        const queryStart = content.lastIndexOf('const ', match.index);
        const queryEnd = content.indexOf(';', match.index);
        const queryContext = queryStart !== -1 && queryEnd !== -1 ? 
          content.substring(queryStart, queryEnd) : '';

        // Extract query details
        const query = {
          table: table,
          type: this.determineQueryType(queryContext),
          conditions: this.extractQueryConditions(queryContext),
          context: queryContext.substring(0, 200) + '...'
        };

        queries.push(query);
      }
    });

    return queries;
  }

  extractTableReferences(content) {
    const tables = new Set();
    
    // Common table names from our analysis
    const knownTables = [
      'hs_master_rebuild',
      'usmca_tariff_rates',
      'tariff_rates',
      'user_profiles',
      'workflow_completions',
      'company_profiles',
      'partner_suppliers',
      'crisis_solutions'
    ];

    knownTables.forEach(table => {
      if (content.includes(`'${table}'`) || content.includes(`"${table}"`)) {
        tables.add(table);
      }
    });

    return Array.from(tables);
  }

  extractFallbackLogic(content) {
    const fallbacks = [];
    
    // Look for fallback patterns
    const fallbackPatterns = [
      { trigger: 'empty_result', pattern: /if\s*\(\s*(!data|data\.length\s*===\s*0|!.*\.length)\s*\)/g },
      { trigger: 'error_condition', pattern: /catch\s*\([^)]*\)/g },
      { trigger: 'insufficient_results', pattern: /if\s*\([^)]*\.length\s*<\s*\d+\)/g },
      { trigger: 'sample_data_mode', pattern: /sample.*data|fallback.*data/gi }
    ];

    fallbackPatterns.forEach(({ trigger, pattern }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Get context around the match
        const contextStart = Math.max(0, match.index - 100);
        const contextEnd = Math.min(content.length, match.index + 200);
        const context = content.substring(contextStart, contextEnd);

        fallbacks.push({
          trigger: trigger,
          action: this.extractFallbackAction(context),
          context: context.replace(/\s+/g, ' ')
        });
      }
    });

    return fallbacks;
  }

  determineQueryType(queryContext) {
    if (queryContext.includes('.select(')) return 'select';
    if (queryContext.includes('.insert(')) return 'insert';
    if (queryContext.includes('.update(')) return 'update';
    if (queryContext.includes('.delete(')) return 'delete';
    return 'unknown';
  }

  extractQueryConditions(queryContext) {
    const conditions = [];
    
    // Look for common Supabase query conditions
    const conditionPatterns = [
      /\.eq\(['"]([^'"]+)['"], ?([^)]+)\)/g,
      /\.ilike\(['"]([^'"]+)['"], ?([^)]+)\)/g,
      /\.gt\(['"]([^'"]+)['"], ?([^)]+)\)/g,
      /\.lt\(['"]([^'"]+)['"], ?([^)]+)\)/g,
      /\.in\(['"]([^'"]+)['"], ?([^)]+)\)/g
    ];

    conditionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(queryContext)) !== null) {
        conditions.push(`${match[1]} ${pattern.source.includes('eq') ? '=' : 'condition'} ${match[2]}`);
      }
    });

    return conditions;
  }

  extractFallbackAction(context) {
    if (context.includes('hs_master')) return 'fallback_to_hs_master';
    if (context.includes('sample') || context.includes('demo')) return 'use_sample_data';
    if (context.includes('empty') || context.includes('null')) return 'return_empty';
    if (context.includes('error')) return 'handle_error';
    return 'unknown_action';
  }

  determineRealDataUsage(tables, queries) {
    // APIs that query real data tables (high-value data)
    const realDataTables = ['usmca_tariff_rates', 'tariff_rates'];
    return tables.some(table => realDataTables.includes(table));
  }

  analyzeQueryStrategy(queries, fallbacks) {
    const strategies = [];
    
    if (queries.some(q => q.table === 'usmca_tariff_rates')) {
      strategies.push('usmca_priority');
    }
    if (queries.some(q => q.table === 'tariff_rates')) {
      strategies.push('general_tariff');
    }
    if (queries.some(q => q.table === 'hs_master_rebuild')) {
      strategies.push('comprehensive_fallback');
    }
    if (fallbacks.length > 0) {
      strategies.push('intelligent_fallback');
    }

    return strategies.length > 0 ? strategies.join(' + ') : 'single_table';
  }

  async mapDataFlow() {
    console.log('🔄 MAPPING COMPLETE DATA FLOW\n');
    
    // Map how data flows from database to UI
    const dataFlowPaths = {
      'Product Classification': {
        userInput: 'Product description',
        apiEndpoint: 'simple-classification.js',
        databaseQueries: ['usmca_tariff_rates', 'hs_master_rebuild'],
        fallbackLogic: 'If insufficient results from USMCA data, use HS master',
        uiOutput: 'HS codes with rates and descriptions'
      },
      'Savings Calculator': {
        userInput: 'HS code + import value',
        apiEndpoint: 'simple-savings.js', 
        databaseQueries: ['tariff_rates'],
        fallbackLogic: 'Country-based averages if no exact match',
        uiOutput: 'Dollar savings calculations'
      },
      'USMCA Compliance': {
        userInput: 'HS code + component origins',
        apiEndpoint: 'simple-usmca-compliance.js',
        databaseQueries: ['tariff_rates via classifier'],
        fallbackLogic: 'Zero rates if no data found',
        uiOutput: 'Qualification status and requirements'
      }
    };

    Object.entries(dataFlowPaths).forEach(([workflow, flow]) => {
      console.log(`🎯 ${workflow.toUpperCase()} WORKFLOW:`);
      console.log(`   Input: ${flow.userInput}`);
      console.log(`   API: ${flow.apiEndpoint}`);
      console.log(`   Queries: ${flow.databaseQueries.join(', ')}`);
      console.log(`   Fallback: ${flow.fallbackLogic}`);
      console.log(`   Output: ${flow.uiOutput}\n`);
    });

    this.analysis.dataFlow = dataFlowPaths;
  }

  async identifyFallbackLogic() {
    console.log('🔄 ANALYZING FALLBACK LOGIC PATTERNS\n');
    
    const fallbackAnalysis = {
      'Insufficient Real Data': {
        trigger: 'Less than 5 results from primary data source',
        apis: ['simple-classification.js'],
        action: 'Query hs_master_rebuild for additional coverage',
        impact: 'Returns placeholder rates (mostly zeros)'
      },
      'Empty User Tables': {
        trigger: 'user_profiles table has 0 records',
        apis: ['admin/users.js'],
        action: 'Return sample user data for demo',
        impact: 'Admin dashboard shows demo users, not real data'
      },
      'Missing HS Code': {
        trigger: 'HS code not found in primary tables',
        apis: ['simple-savings.js'],
        action: 'Use country-based average rates',
        impact: 'Approximate savings calculations'
      },
      'API Error Handling': {
        trigger: 'Database connection or query errors',
        apis: ['All APIs'],
        action: 'Return error response or empty results',
        impact: 'Graceful degradation but no functionality'
      }
    };

    Object.entries(fallbackAnalysis).forEach(([pattern, details]) => {
      console.log(`❓ ${pattern}:`);
      console.log(`   Trigger: ${details.trigger}`);
      console.log(`   APIs: ${details.apis.join(', ')}`);
      console.log(`   Action: ${details.action}`);
      console.log(`   Impact: ${details.impact}\n`);
    });

    this.analysis.fallbackLogic = fallbackAnalysis;
  }

  async analyzeIntegrationPoints() {
    console.log('🔗 ANALYZING UI-TO-API INTEGRATION POINTS\n');
    
    // Check key UI components that call APIs
    const integrationPoints = {
      'ComponentOriginsStepEnhanced.js': {
        apis: ['simple-classification', 'simple-usmca-compliance'],
        dataFlow: 'User enters components → API classification → Display results',
        criticalPath: true
      },
      'WorkflowResults.js': {
        apis: ['simple-savings', 'trust/complete-certificate'],
        dataFlow: 'Show final results → Calculate savings → Generate certificate',
        criticalPath: true
      },
      'Admin Dashboards': {
        apis: ['admin/users', 'admin/suppliers', 'admin/rss-feeds'],
        dataFlow: 'Display management data → Fallback to samples if empty',
        criticalPath: false
      }
    };

    Object.entries(integrationPoints).forEach(([component, details]) => {
      console.log(`🔧 ${component}:`);
      console.log(`   APIs Called: ${details.apis.join(', ')}`);
      console.log(`   Data Flow: ${details.dataFlow}`);
      console.log(`   Critical: ${details.criticalPath ? '✅' : '❌'}\n`);
    });

    this.analysis.integrationPoints = integrationPoints;
  }

  generateDataFlowReport() {
    console.log('📋 COMPREHENSIVE DATA FLOW ANALYSIS REPORT\n');
    
    console.log('🗄️  API-TO-DATABASE MAPPING:');
    const realDataAPIs = Object.entries(this.analysis.apis)
      .filter(([name, api]) => api.usesRealData).length;
    const totalAPIs = Object.keys(this.analysis.apis).length;
    
    console.log(`  APIs using real data: ${realDataAPIs}/${totalAPIs}`);
    
    Object.entries(this.analysis.apis).forEach(([name, api]) => {
      console.log(`  ${api.usesRealData ? '✅' : '❌'} ${name}: ${api.queryStrategy}`);
      console.log(`     Tables: ${api.tables.join(', ')}`);
    });

    console.log('\n🔄 FALLBACK LOGIC ASSESSMENT:');
    const fallbackCount = Object.keys(this.analysis.fallbackLogic).length;
    console.log(`  Fallback patterns identified: ${fallbackCount}`);
    
    Object.entries(this.analysis.fallbackLogic).forEach(([pattern, details]) => {
      console.log(`  • ${pattern}: ${details.impact}`);
    });

    console.log('\n🎯 CRITICAL DATA FLOW PATHS:');
    const criticalPaths = Object.entries(this.analysis.integrationPoints)
      .filter(([name, point]) => point.criticalPath);
    
    console.log(`  Critical UI-to-API paths: ${criticalPaths.length}`);
    criticalPaths.forEach(([component, details]) => {
      console.log(`  🔧 ${component}: ${details.apis.join(' → ')}`);
    });

    console.log('\n🚨 IDENTIFIED ISSUES:');
    const issues = this.identifyDataFlowIssues();
    issues.forEach(issue => {
      console.log(`  ❌ ${issue}`);
    });

    return this.analysis;
  }

  identifyDataFlowIssues() {
    const issues = [];
    
    // Check for APIs still using placeholder data
    Object.entries(this.analysis.apis).forEach(([name, api]) => {
      if (api.tables.includes('hs_master_rebuild') && !api.usesRealData) {
        issues.push(`${name} relies primarily on placeholder data from hs_master_rebuild`);
      }
    });

    // Check for broken fallback chains
    const fallbackAPIs = Object.entries(this.analysis.apis)
      .filter(([name, api]) => api.fallbacks.length > 0);
    
    if (fallbackAPIs.length === 0) {
      issues.push('No APIs have proper fallback handling');
    }

    // Check for missing real data integration
    const realDataTables = ['usmca_tariff_rates', 'tariff_rates'];
    const apisUsingRealData = Object.entries(this.analysis.apis)
      .filter(([name, api]) => api.tables.some(table => realDataTables.includes(table)));
    
    if (apisUsingRealData.length < 3) {
      issues.push('Insufficient APIs accessing real tariff data');
    }

    return issues;
  }
}

async function main() {
  const analyzer = new APIQueryTracingAnalyzer();
  try {
    const analysis = await analyzer.analyzeComplete();
    console.log('\n✅ API query tracing analysis complete');
    
    // Save analysis results
    fs.writeFileSync('api-query-analysis.json', JSON.stringify(analysis, null, 2));
    console.log('📄 Analysis saved to api-query-analysis.json');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = APIQueryTracingAnalyzer;