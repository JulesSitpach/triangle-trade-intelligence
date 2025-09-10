#!/usr/bin/env node

/**
 * COMPREHENSIVE DATABASE ANALYSIS
 * 
 * Definitive schema analysis, data quality assessment, and relationship mapping
 * No more assumptions - only documented facts about what data exists
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class ComprehensiveDatabaseAnalyzer {
  constructor() {
    this.analysis = {
      tables: {},
      relationships: [],
      dataQuality: {},
      dataSources: {},
      queryPatterns: {}
    };
  }

  async analyzeComplete() {
    console.log('🔍 COMPREHENSIVE DATABASE ANALYSIS');
    console.log('Establishing definitive data architecture understanding\n');

    await this.discoverAllTables();
    await this.sampleRealData();
    await this.mapDataSources();
    await this.identifyRelationships();
    await this.assessDataQuality();
    
    return this.generateComprehensiveReport();
  }

  async discoverAllTables() {
    console.log('📋 DISCOVERING ALL TABLES\n');
    
    // Get all tables in the database
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public');

    if (error) {
      console.log('Using known tables list due to schema access limitation');
      // Known tables from previous analysis
      const knownTables = [
        'hs_master_rebuild',
        'usmca_tariff_rates',
        'tariff_rates', 
        'user_profiles',
        'workflow_completions',
        'rss_feeds',
        'usmca_qualification_rules',
        'company_profiles',
        'partner_suppliers',
        'supplier_introduction_requests',
        'crisis_solutions'
      ];

      for (const tableName of knownTables) {
        await this.analyzeTable(tableName);
      }
    } else {
      console.log(`Found ${tables.length} tables in database`);
      for (const table of tables) {
        if (table.table_type === 'BASE TABLE') {
          await this.analyzeTable(table.table_name);
        }
      }
    }
  }

  async analyzeTable(tableName) {
    console.log(`\n🔍 ANALYZING TABLE: ${tableName}`);
    
    try {
      // Get table structure by sampling one record
      const { data: sample, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log(`   ❌ Cannot access table: ${sampleError.message}`);
        this.analysis.tables[tableName] = { 
          accessible: false, 
          error: sampleError.message 
        };
        return;
      }

      // Get record count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      const columns = sample && sample[0] ? Object.keys(sample[0]) : [];
      
      console.log(`   📊 Records: ${count || 0}`);
      console.log(`   📋 Columns (${columns.length}): ${columns.join(', ')}`);

      // Sample data types and values
      const dataTypes = {};
      const sampleValues = {};
      
      if (sample && sample[0]) {
        Object.entries(sample[0]).forEach(([key, value]) => {
          dataTypes[key] = typeof value;
          sampleValues[key] = value;
        });
      }

      this.analysis.tables[tableName] = {
        accessible: true,
        recordCount: count || 0,
        columns: columns,
        dataTypes: dataTypes,
        sampleRecord: sampleValues,
        isEmpty: !count || count === 0
      };

      // Special analysis for key tables
      await this.specializedTableAnalysis(tableName);

    } catch (error) {
      console.log(`   ❌ Analysis error: ${error.message}`);
      this.analysis.tables[tableName] = { 
        accessible: false, 
        error: error.message 
      };
    }
  }

  async specializedTableAnalysis(tableName) {
    // Specialized analysis for tariff data tables
    if (tableName.includes('tariff') || tableName.includes('hs_')) {
      await this.analyzeTariffData(tableName);
    }

    // Specialized analysis for user/workflow tables
    if (tableName.includes('user') || tableName.includes('workflow')) {
      await this.analyzeUserWorkflowData(tableName);
    }
  }

  async analyzeTariffData(tableName) {
    console.log(`   🔍 TARIFF DATA ANALYSIS:`);
    
    try {
      // Look for rate fields
      const rateFields = this.analysis.tables[tableName].columns.filter(col => 
        col.toLowerCase().includes('rate') || col.toLowerCase().includes('tariff')
      );
      
      console.log(`   📊 Rate fields: ${rateFields.join(', ')}`);

      if (rateFields.length > 0) {
        // Sample non-zero rates
        const sampleField = rateFields.find(field => 
          field.toLowerCase().includes('mfn') || 
          field.toLowerCase().includes('rate')
        ) || rateFields[0];

        const { data: nonZeroRates } = await supabase
          .from(tableName)
          .select(`hs_code, ${sampleField}`)
          .gt(sampleField, 0)
          .limit(5);

        const realRateCount = nonZeroRates ? nonZeroRates.length : 0;
        console.log(`   💰 Non-zero ${sampleField} samples: ${realRateCount}`);
        
        if (nonZeroRates && nonZeroRates.length > 0) {
          nonZeroRates.forEach(rate => {
            console.log(`     • ${rate.hs_code}: ${rate[sampleField]}%`);
          });

          // Get statistics on rate distribution
          const { data: rateStats } = await supabase
            .from(tableName)
            .select(`${sampleField}`)
            .gt(sampleField, 0);

          if (rateStats && rateStats.length > 0) {
            const rates = rateStats.map(r => parseFloat(r[sampleField]));
            const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
            const maxRate = Math.max(...rates);
            const minRate = Math.min(...rates);

            console.log(`   📈 Rate statistics: avg=${avgRate.toFixed(2)}%, min=${minRate}%, max=${maxRate}%`);
            
            this.analysis.dataQuality[tableName] = {
              hasRealRates: true,
              realRateCount: rateStats.length,
              totalRecords: this.analysis.tables[tableName].recordCount,
              realRatePercentage: (rateStats.length / this.analysis.tables[tableName].recordCount) * 100,
              avgRate: avgRate,
              rateRange: { min: minRate, max: maxRate }
            };
          }
        } else {
          console.log(`   ⚠️  No non-zero rates found`);
          this.analysis.dataQuality[tableName] = {
            hasRealRates: false,
            realRateCount: 0,
            issue: 'All rates are zero or null'
          };
        }
      }

      // Check for HS code patterns
      const hsCodeField = this.analysis.tables[tableName].columns.find(col => 
        col.toLowerCase().includes('hs_code') || col.toLowerCase() === 'hs_code'
      );

      if (hsCodeField) {
        const { data: hsCodeSamples } = await supabase
          .from(tableName)
          .select(hsCodeField)
          .not(hsCodeField, 'is', null)
          .limit(10);

        if (hsCodeSamples && hsCodeSamples.length > 0) {
          console.log(`   🔢 HS Code samples: ${hsCodeSamples.map(h => h[hsCodeField]).join(', ')}`);
          
          // Analyze HS code format patterns
          const patterns = hsCodeSamples.map(h => {
            const code = h[hsCodeField].toString();
            return {
              code: code,
              length: code.length,
              format: code.includes('.') ? 'dotted' : 'numeric'
            };
          });

          console.log(`   📋 HS Code formats: ${JSON.stringify(patterns[0])}`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Tariff analysis error: ${error.message}`);
    }
  }

  async analyzeUserWorkflowData(tableName) {
    console.log(`   🔍 USER/WORKFLOW DATA ANALYSIS:`);
    
    try {
      const count = this.analysis.tables[tableName].recordCount;
      
      if (count === 0) {
        console.log(`   ⚠️  Table is empty - using sample data mode`);
        this.analysis.dataQuality[tableName] = {
          dataMode: 'sample_fallback',
          reason: 'Empty table triggers sample data in APIs'
        };
      } else {
        console.log(`   ✅ Has real data: ${count} records`);
        
        // Sample recent records to understand data structure
        const { data: recentRecords } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (recentRecords && recentRecords.length > 0) {
          console.log(`   📋 Sample record keys: ${Object.keys(recentRecords[0]).join(', ')}`);
          this.analysis.dataQuality[tableName] = {
            dataMode: 'real_data',
            sampleRecordCount: recentRecords.length,
            latestRecord: recentRecords[0]
          };
        }
      }
    } catch (error) {
      console.log(`   ❌ User/workflow analysis error: ${error.message}`);
    }
  }

  async sampleRealData() {
    console.log('\n🎯 SAMPLING REAL DATA FROM EACH TABLE\n');
    
    for (const [tableName, tableInfo] of Object.entries(this.analysis.tables)) {
      if (!tableInfo.accessible || tableInfo.isEmpty) continue;
      
      console.log(`📋 ${tableName} data samples:`);
      
      try {
        const { data: samples } = await supabase
          .from(tableName)
          .select('*')
          .limit(3);

        if (samples && samples.length > 0) {
          samples.forEach((sample, idx) => {
            console.log(`   Record ${idx + 1}:`);
            Object.entries(sample).forEach(([key, value]) => {
              const displayValue = value !== null && value !== undefined ? 
                String(value).substring(0, 50) : 'null';
              console.log(`     ${key}: ${displayValue}`);
            });
          });
          
          this.analysis.dataSources[tableName] = {
            dataType: 'real_records',
            sampleCount: samples.length,
            fieldCount: Object.keys(samples[0]).length
          };
        }
      } catch (error) {
        console.log(`   ❌ Sampling error: ${error.message}`);
      }
      
      console.log('');
    }
  }

  async mapDataSources() {
    console.log('🗺️  MAPPING DATA SOURCES AND LINEAGE\n');
    
    const tableCategories = {
      tariffData: ['hs_master_rebuild', 'usmca_tariff_rates', 'tariff_rates'],
      businessData: ['company_profiles', 'user_profiles'],
      workflowData: ['workflow_completions'],
      supplierData: ['partner_suppliers', 'supplier_introduction_requests'],
      configData: ['usmca_qualification_rules', 'rss_feeds'],
      solutionData: ['crisis_solutions']
    };

    for (const [category, tables] of Object.entries(tableCategories)) {
      console.log(`📊 ${category.toUpperCase()}:`);
      
      tables.forEach(tableName => {
        const tableInfo = this.analysis.tables[tableName];
        if (tableInfo && tableInfo.accessible) {
          const recordCount = tableInfo.recordCount || 0;
          const status = recordCount > 0 ? '✅' : '❌';
          const dataQuality = this.analysis.dataQuality[tableName];
          
          console.log(`   ${status} ${tableName}: ${recordCount} records`);
          
          if (dataQuality) {
            if (dataQuality.hasRealRates) {
              console.log(`      💰 Real rates: ${dataQuality.realRateCount}/${recordCount} (${dataQuality.realRatePercentage.toFixed(1)}%)`);
            }
            if (dataQuality.dataMode) {
              console.log(`      🔧 Mode: ${dataQuality.dataMode}`);
            }
          }
        } else {
          console.log(`   ❌ ${tableName}: Not accessible`);
        }
      });
      console.log('');
    }
  }

  async identifyRelationships() {
    console.log('🔗 IDENTIFYING TABLE RELATIONSHIPS\n');
    
    // Analyze foreign key patterns
    const relationships = [];
    
    for (const [tableName, tableInfo] of Object.entries(this.analysis.tables)) {
      if (!tableInfo.accessible) continue;
      
      const columns = tableInfo.columns || [];
      
      // Look for foreign key patterns
      columns.forEach(column => {
        if (column.endsWith('_id') && column !== 'id') {
          const referencedTable = column.replace('_id', '');
          relationships.push({
            fromTable: tableName,
            fromColumn: column,
            toTable: referencedTable,
            type: 'foreign_key'
          });
        }
        
        // Look for HS code relationships
        if (column.toLowerCase().includes('hs_code')) {
          relationships.push({
            fromTable: tableName,
            fromColumn: column,
            toTable: 'tariff_data',
            type: 'hs_code_reference'
          });
        }
      });
    }

    console.log(`Found ${relationships.length} potential relationships:`);
    relationships.forEach(rel => {
      console.log(`   ${rel.fromTable}.${rel.fromColumn} → ${rel.toTable} (${rel.type})`);
    });

    this.analysis.relationships = relationships;
  }

  async assessDataQuality() {
    console.log('\n📊 DATA QUALITY ASSESSMENT\n');
    
    const qualityReport = {
      tablesWithRealData: 0,
      tablesWithPlaceholderData: 0,
      emptyTables: 0,
      totalTables: 0
    };

    for (const [tableName, tableInfo] of Object.entries(this.analysis.tables)) {
      if (!tableInfo.accessible) continue;
      
      qualityReport.totalTables++;
      
      if (tableInfo.isEmpty) {
        qualityReport.emptyTables++;
        console.log(`❌ ${tableName}: Empty (${tableInfo.recordCount} records)`);
      } else {
        const dataQuality = this.analysis.dataQuality[tableName];
        
        if (dataQuality && dataQuality.hasRealRates) {
          qualityReport.tablesWithRealData++;
          console.log(`✅ ${tableName}: Real data (${dataQuality.realRatePercentage.toFixed(1)}% real rates)`);
        } else if (dataQuality && dataQuality.hasRealRates === false) {
          qualityReport.tablesWithPlaceholderData++;
          console.log(`⚠️  ${tableName}: Placeholder data (${tableInfo.recordCount} records, no real rates)`);
        } else {
          // Non-tariff table with data
          qualityReport.tablesWithRealData++;
          console.log(`✅ ${tableName}: Real data (${tableInfo.recordCount} records)`);
        }
      }
    }

    console.log('\n📈 QUALITY SUMMARY:');
    console.log(`   Real data tables: ${qualityReport.tablesWithRealData}/${qualityReport.totalTables}`);
    console.log(`   Placeholder data tables: ${qualityReport.tablesWithPlaceholderData}/${qualityReport.totalTables}`);
    console.log(`   Empty tables: ${qualityReport.emptyTables}/${qualityReport.totalTables}`);

    this.analysis.dataQuality.summary = qualityReport;
  }

  generateComprehensiveReport() {
    console.log('\n📋 COMPREHENSIVE DATABASE ANALYSIS REPORT\n');
    
    console.log('🗄️  DATABASE ARCHITECTURE:');
    const accessibleTables = Object.values(this.analysis.tables).filter(t => t.accessible).length;
    const totalTables = Object.keys(this.analysis.tables).length;
    console.log(`  Tables: ${accessibleTables}/${totalTables} accessible`);
    
    const totalRecords = Object.values(this.analysis.tables)
      .filter(t => t.accessible)
      .reduce((sum, t) => sum + (t.recordCount || 0), 0);
    console.log(`  Total records: ${totalRecords.toLocaleString()}`);

    console.log('\n💰 TARIFF DATA STATUS:');
    const tariffTables = Object.entries(this.analysis.dataQuality)
      .filter(([name, quality]) => quality.hasRealRates !== undefined);
    
    tariffTables.forEach(([tableName, quality]) => {
      if (quality.hasRealRates) {
        console.log(`  ✅ ${tableName}: ${quality.realRateCount} real rates (${quality.realRatePercentage.toFixed(1)}%)`);
        console.log(`     Average rate: ${quality.avgRate.toFixed(2)}%, range: ${quality.rateRange.min}-${quality.rateRange.max}%`);
      } else {
        console.log(`  ❌ ${tableName}: No real rates - ${quality.issue || 'All zeros'}`);
      }
    });

    console.log('\n🔄 DATA READINESS FOR APIS:');
    const readyTables = Object.entries(this.analysis.dataQuality)
      .filter(([name, quality]) => quality.hasRealRates === true).length;
    const tariffTableCount = tariffTables.length;
    
    console.log(`  Tariff tables with real data: ${readyTables}/${tariffTableCount}`);
    console.log(`  System readiness: ${readyTables > 0 ? '✅ HAS REAL DATA' : '❌ NO REAL DATA'}`);

    return this.analysis;
  }
}

async function main() {
  const analyzer = new ComprehensiveDatabaseAnalyzer();
  try {
    const analysis = await analyzer.analyzeComplete();
    console.log('\n✅ Comprehensive database analysis complete');
    
    // Save analysis results
    const fs = require('fs');
    fs.writeFileSync('database-analysis-complete.json', JSON.stringify(analysis, null, 2));
    console.log('📄 Analysis saved to database-analysis-complete.json');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = ComprehensiveDatabaseAnalyzer;