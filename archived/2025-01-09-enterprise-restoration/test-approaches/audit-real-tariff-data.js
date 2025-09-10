#!/usr/bin/env node

/**
 * CRITICAL DATA INTEGRITY AUDIT
 * 
 * BUSINESS CONTEXT:
 * Sarah, Mike, and Lisa need defensible, accurate tariff data for strategic 
 * supplier partnership decisions worth $245K-$625K annually. We must identify
 * and properly access REAL government tariff data, not sample approximations.
 * 
 * Audit Objectives:
 * 1. Identify which tables contain official vs placeholder data
 * 2. Find where real tariff rates may be stored but not accessed
 * 3. Document data lineage and defensibility 
 * 4. Fix API integration to use real data sources
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class TariffDataIntegrityAuditor {
  constructor() {
    this.auditResults = {
      tables: {},
      dataQuality: {},
      integrationIssues: [],
      recommendations: []
    };
  }

  async auditAllTariffTables() {
    console.log('🔍 CRITICAL DATA INTEGRITY AUDIT\n');
    console.log('Business Context: Ensure tariff data is defensible for customer decisions\n');
    console.log('Audit Scope: All tariff-related tables for real vs placeholder data\n');

    // Get list of all tables to identify tariff-related ones
    const { data: tables, error } = await supabase.rpc('get_table_list');
    
    if (error) {
      console.log('Using known table list due to RPC limitation\n');
      await this.auditKnownTables();
    } else {
      const tariffTables = tables.filter(table => 
        table.includes('tariff') || 
        table.includes('hs_') || 
        table.includes('usmca') || 
        table.includes('trade')
      );
      
      for (const table of tariffTables) {
        await this.auditTable(table);
      }
    }

    await this.auditKnownTables();
    await this.analyzeDataIntegration();
    await this.generateIntegrityReport();
    
    return this.auditResults;
  }

  async auditKnownTables() {
    const knownTables = [
      'hs_master_rebuild',
      'comtrade_reference', 
      'usmca_tariff_rates',
      'tariff_rates'
    ];

    for (const tableName of knownTables) {
      await this.auditTable(tableName);
    }
  }

  async auditTable(tableName) {
    console.log(`📋 AUDITING TABLE: ${tableName}`);
    
    try {
      // Get basic table info
      const { data: tableData, error: tableError, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(5);

      if (tableError) {
        console.log(`   ❌ Table not accessible: ${tableError.message}\n`);
        this.auditResults.tables[tableName] = {
          exists: false,
          error: tableError.message
        };
        return;
      }

      if (!tableData || tableData.length === 0) {
        console.log(`   ⚠️  Table exists but empty (0 records)\n`);
        this.auditResults.tables[tableName] = {
          exists: true,
          recordCount: 0,
          isEmpty: true
        };
        return;
      }

      console.log(`   ✅ Records: ${count}`);
      console.log(`   📊 Columns: ${Object.keys(tableData[0]).join(', ')}`);

      // Analyze data quality for tariff-related fields
      const tariffAnalysis = await this.analyzeTariffFields(tableName, tableData[0]);
      
      this.auditResults.tables[tableName] = {
        exists: true,
        recordCount: count,
        sampleRecord: tableData[0],
        columns: Object.keys(tableData[0]),
        tariffAnalysis,
        isEmpty: false
      };

      console.log(`   ${tariffAnalysis.summary}\n`);

    } catch (error) {
      console.log(`   ❌ Error auditing table: ${error.message}\n`);
      this.auditResults.tables[tableName] = {
        exists: false,
        error: error.message
      };
    }
  }

  async analyzeTariffFields(tableName, sampleRecord) {
    const tariffFields = [
      'mfn_rate', 'mfn_tariff_rate', 'base_tariff_rate',
      'usmca_rate', 'usmca_tariff_rate', 
      'tariff_rate', 'duty_rate'
    ];

    const analysis = {
      hasRateFields: false,
      rateFields: [],
      nonZeroRates: false,
      dataQuality: 'unknown',
      summary: ''
    };

    // Check which rate fields exist
    for (const field of tariffFields) {
      if (sampleRecord.hasOwnProperty(field)) {
        analysis.rateFields.push(field);
        analysis.hasRateFields = true;
      }
    }

    if (!analysis.hasRateFields) {
      analysis.summary = '❌ No tariff rate fields found';
      return analysis;
    }

    // Check for non-zero rates in larger sample
    try {
      const { data: rateData } = await supabase
        .from(tableName)
        .select(analysis.rateFields.join(','))
        .limit(100);

      if (rateData && rateData.length > 0) {
        let hasNonZero = false;
        let nonZeroCount = 0;
        let totalChecked = 0;

        for (const record of rateData) {
          for (const field of analysis.rateFields) {
            const value = parseFloat(record[field] || 0);
            totalChecked++;
            if (value > 0) {
              hasNonZero = true;
              nonZeroCount++;
            }
          }
        }

        analysis.nonZeroRates = hasNonZero;
        analysis.nonZeroPercentage = Math.round((nonZeroCount / totalChecked) * 100);

        if (analysis.nonZeroPercentage === 0) {
          analysis.dataQuality = 'placeholder';
          analysis.summary = '🟡 Contains rate fields but all values are 0% (placeholder data)';
        } else if (analysis.nonZeroPercentage < 10) {
          analysis.dataQuality = 'sparse';
          analysis.summary = `🟡 Sparse real data (${analysis.nonZeroPercentage}% non-zero rates)`;
        } else {
          analysis.dataQuality = 'substantial';
          analysis.summary = `✅ Contains substantial rate data (${analysis.nonZeroPercentage}% non-zero rates)`;
        }
      }
    } catch (error) {
      analysis.summary = `❌ Could not analyze rate data: ${error.message}`;
    }

    return analysis;
  }

  async analyzeDataIntegration() {
    console.log('🔧 ANALYZING API INTEGRATION ISSUES\n');

    // Check which tables are actually used by the classification API
    console.log('📊 API Integration Analysis:');
    
    const integrationCheck = {
      primaryTable: null,
      backupTables: [],
      dataQualityIssues: [],
      accessIssues: []
    };

    // Identify best data source
    for (const [tableName, tableInfo] of Object.entries(this.auditResults.tables)) {
      if (!tableInfo.exists || tableInfo.isEmpty) {
        integrationCheck.accessIssues.push(`${tableName}: Not accessible or empty`);
        continue;
      }

      if (!tableInfo.tariffAnalysis.hasRateFields) {
        integrationCheck.accessIssues.push(`${tableName}: No tariff rate fields`);
        continue;
      }

      const quality = tableInfo.tariffAnalysis.dataQuality;
      
      if (quality === 'substantial') {
        integrationCheck.primaryTable = tableName;
        console.log(`   ✅ ${tableName}: HIGH QUALITY - ${tableInfo.tariffAnalysis.nonZeroPercentage}% real rates`);
      } else if (quality === 'sparse') {
        integrationCheck.backupTables.push(tableName);
        console.log(`   🟡 ${tableName}: SPARSE DATA - ${tableInfo.tariffAnalysis.nonZeroPercentage}% real rates`);
      } else {
        integrationCheck.dataQualityIssues.push(`${tableName}: ${quality} data quality`);
        console.log(`   ❌ ${tableName}: POOR QUALITY - ${quality} data`);
      }
    }

    this.auditResults.integrationIssues = integrationCheck;
    console.log('');
  }

  async generateIntegrityReport() {
    console.log('🎯 DATA INTEGRITY ASSESSMENT REPORT\n');

    const { integrationIssues } = this.auditResults;

    console.log('📊 DATA SOURCES SUMMARY:');
    console.log(`• Tables Audited: ${Object.keys(this.auditResults.tables).length}`);
    console.log(`• Accessible Tables: ${Object.values(this.auditResults.tables).filter(t => t.exists).length}`);
    console.log(`• Tables with Rate Fields: ${Object.values(this.auditResults.tables).filter(t => t.tariffAnalysis?.hasRateFields).length}`);
    console.log('');

    console.log('🎯 BUSINESS IMPACT ASSESSMENT:');
    
    if (integrationIssues.primaryTable) {
      console.log('✅ GOOD NEWS: High-quality tariff data source identified');
      console.log(`   • Primary source: ${integrationIssues.primaryTable}`);
      console.log(`   • Data quality: ${this.auditResults.tables[integrationIssues.primaryTable].tariffAnalysis.dataQuality}`);
      console.log(`   • Real rates: ${this.auditResults.tables[integrationIssues.primaryTable].tariffAnalysis.nonZeroPercentage}%`);
      console.log('   • Customer impact: Can provide defensible tariff data');
      
      this.auditResults.recommendations.push({
        priority: 'HIGH',
        action: 'Update classification API to use high-quality data source',
        table: integrationIssues.primaryTable,
        businessImpact: 'Enable Sarah, Mike, Lisa to make confident strategic decisions'
      });
    } else if (integrationIssues.backupTables.length > 0) {
      console.log('🟡 PARTIAL: Some real tariff data available but sparse');
      integrationIssues.backupTables.forEach(table => {
        const analysis = this.auditResults.tables[table].tariffAnalysis;
        console.log(`   • ${table}: ${analysis.nonZeroPercentage}% real rates`);
      });
      console.log('   • Customer impact: Limited value demonstration possible');
      
      this.auditResults.recommendations.push({
        priority: 'MEDIUM',
        action: 'Supplement sparse data with official government sources',
        businessImpact: 'Improve customer value demonstration'
      });
    } else {
      console.log('❌ CRITICAL: No substantial tariff data found');
      console.log('   • Customer impact: Cannot demonstrate USMCA value');
      console.log('   • Business risk: No trial conversion possible');
      
      this.auditResults.recommendations.push({
        priority: 'CRITICAL',
        action: 'Source official tariff data from government databases',
        businessImpact: 'Essential for platform viability'
      });
    }

    console.log('\n💼 PROFESSIONAL USER REQUIREMENTS:');
    console.log('• Sarah (Compliance): Needs audit-defensible, official tariff rates');
    console.log('• Mike (Procurement): Needs accurate rates for $180K-$625K sourcing decisions');
    console.log('• Lisa (Finance): Needs reliable rates for multi-year financial planning');

    console.log('\n🚀 RECOMMENDED ACTIONS:');
    this.auditResults.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.action}`);
      console.log(`   Business Impact: ${rec.businessImpact}`);
    });

    console.log('\n🛡️ DATA INTEGRITY REQUIREMENTS:');
    console.log('✅ Must use official government tariff sources');
    console.log('✅ Must document data lineage and update frequency'); 
    console.log('✅ Must provide confidence indicators for rate accuracy');
    console.log('✅ Must enable customer verification against official sources');

    return this.auditResults;
  }
}

async function main() {
  const auditor = new TariffDataIntegrityAuditor();
  
  try {
    const results = await auditor.auditAllTariffTables();
    
    if (results.integrationIssues.primaryTable) {
      console.log('\n✅ AUDIT COMPLETE: Real data source identified');
      console.log('Next step: Update API integration to use high-quality data');
    } else {
      console.log('\n⚠️ AUDIT COMPLETE: Data sourcing required');
      console.log('Next step: Source official tariff data from government databases');
    }
    
    return results;
  } catch (error) {
    console.error('❌ Data integrity audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TariffDataIntegrityAuditor;