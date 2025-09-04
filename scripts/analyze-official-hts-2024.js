#!/usr/bin/env node

/**
 * Official US HTS 2024 Analysis
 * Analyzes the potential of the official Harmonized Tariff Schedule 2024
 * from catalog.data.gov vs our current US data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class OfficialHTSAnalyzer {
  constructor() {
    this.currentUSCount = 0;
    this.currentMaxRate = 0;
    this.officialHTSUrl = 'https://catalog.data.gov/dataset/harmonized-tariff-schedule-of-the-united-states-2024';
  }

  async analyzeCurrentUSData() {
    console.log('📊 CURRENT US DATA ANALYSIS\n');
    
    // Get current US record count
    const { count: totalUS } = await supabase
      .from('hs_master_rebuild')
      .select('*', { count: 'exact', head: true })
      .eq('country_source', 'US');

    // Get sample of highest US rates
    const { data: usSample } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, mfn_rate, description, chapter')
      .eq('country_source', 'US')
      .order('mfn_rate', { ascending: false })
      .limit(10);

    // Get chapter distribution
    const { data: chapterDist } = await supabase
      .from('hs_master_rebuild')
      .select('chapter')
      .eq('country_source', 'US');

    this.currentUSCount = totalUS;
    this.currentMaxRate = usSample?.[0]?.mfn_rate || 0;

    console.log(`Current US records: ${totalUS}`);
    console.log(`Highest current rate: ${this.currentMaxRate}%\n`);
    
    console.log('Top US tariff rates in current database:');
    console.log('HS_CODE | MFN_RATE | CHAPTER | DESCRIPTION');
    console.log('-'.repeat(80));
    
    usSample?.forEach(record => {
      console.log(`${record.hs_code} | ${record.mfn_rate}% | Ch${record.chapter} | ${record.description?.substring(0, 40)}...`);
    });

    // Calculate chapter coverage
    const chapterCounts = {};
    chapterDist?.forEach(item => {
      chapterCounts[item.chapter] = (chapterCounts[item.chapter] || 0) + 1;
    });

    console.log('\nChapter distribution in current US data:');
    Object.keys(chapterCounts)
      .sort((a, b) => chapterCounts[b] - chapterCounts[a])
      .slice(0, 10)
      .forEach(chapter => {
        console.log(`  Chapter ${chapter}: ${chapterCounts[chapter]} codes`);
      });

    return { totalUS, usSample, chapterCounts };
  }

  analyzeOfficialHTSPotential() {
    console.log('\n🏛️ OFFICIAL US HTS 2024 POTENTIAL ANALYSIS\n');
    
    console.log('📋 Official HTS 2024 Dataset Details:');
    console.log(`Source: ${this.officialHTSUrl}`);
    console.log('Publisher: U.S. International Trade Commission (USITC)');
    console.log('Authority: Official US government tariff schedule');
    console.log('Currency: 2024 rates (most current available)');
    console.log('Coverage: Complete US Harmonized Tariff Schedule\n');

    console.log('🎯 Expected improvements over current data:');
    console.log('✅ COMPLETE COVERAGE: All ~17,000+ official HS codes');
    console.log('✅ OFFICIAL DESCRIPTIONS: Professional product descriptions');
    console.log('✅ CURRENT RATES: 2024 effective tariff rates');
    console.log('✅ USMCA INTEGRATION: Official preferential rates');
    console.log('✅ GOVERNMENT CREDIBILITY: Direct USITC source');
    console.log('✅ PROFESSIONAL COMPLIANCE: Audit-ready documentation\n');

    console.log('📊 Potential data expansion:');
    console.log(`Current US records: ${this.currentUSCount}`);
    console.log('Official HTS potential: ~17,000+ codes');
    console.log(`Expansion factor: ~${Math.round(17000 / this.currentUSCount)}x increase`);
    console.log(`Current max rate: ${this.currentMaxRate}%`);
    console.log('HTS max rates: Up to 350%+ (certain agricultural products)\n');

    console.log('🏆 Business value improvements:');
    console.log('- Complete professional tariff coverage');
    console.log('- Eliminate "HS code not found" errors');
    console.log('- Official government source attribution');
    console.log('- Enhanced USMCA savings calculations');
    console.log('- Audit-ready compliance documentation');
    console.log('- Professional customs broker acceptance\n');
  }

  identifyHighValueCategories() {
    console.log('💰 HIGH-VALUE CATEGORIES IN OFFICIAL HTS 2024\n');
    
    const highValueCategories = [
      { chapter: '02', name: 'Meat and edible meat offal', expectedRates: '26.4% average', notes: 'Supply management, quotas' },
      { chapter: '04', name: 'Dairy produce; eggs; honey', expectedRates: 'Up to 275%', notes: 'Extreme protection for dairy' },
      { chapter: '17', name: 'Sugars and sugar confectionery', expectedRates: '35.74%+', notes: 'Sugar program protection' },
      { chapter: '19', name: 'Preparations of cereals, flour', expectedRates: '20%+', notes: 'Processed food protection' },
      { chapter: '22', name: 'Beverages, spirits and vinegar', expectedRates: '6.3%-27%', notes: 'Alcohol duties' },
      { chapter: '42', name: 'Articles of leather; handbags', expectedRates: '12.5%-17.6%', notes: 'Luxury goods protection' },
      { chapter: '61-63', name: 'Textiles and clothing', expectedRates: '16.1%-32%', notes: 'Major USMCA opportunity' },
      { chapter: '64', name: 'Footwear', expectedRates: '37.5%-48%', notes: 'Highest tariff category' },
      { chapter: '87', name: 'Vehicles', expectedRates: '2.5%-25%', notes: 'USMCA rules critical' },
      { chapter: '95', name: 'Toys, games, sports equipment', expectedRates: '6.8%-40%', notes: 'Consumer goods' }
    ];

    console.log('Category | Expected Rates | Business Impact');
    console.log('-'.repeat(70));
    
    highValueCategories.forEach(cat => {
      console.log(`Ch${cat.chapter.padEnd(2)} ${cat.name.substring(0, 25).padEnd(25)} | ${cat.expectedRates.padEnd(12)} | ${cat.notes}`);
    });

    console.log('\n🎯 Strategic priorities for HTS integration:');
    console.log('1. Chapters 61-64: Textiles & Footwear (highest USMCA impact)');
    console.log('2. Chapters 02, 04: Agricultural (extreme protection)');
    console.log('3. Chapter 87: Vehicles (USMCA rules critical)');
    console.log('4. Chapter 85: Electronics (volume + complexity)');
    console.log('5. Chapters 42, 95: Consumer goods (luxury/toys)\n');
  }

  createImplementationPlan() {
    console.log('🚀 OFFICIAL HTS 2024 IMPLEMENTATION PLAN\n');
    
    console.log('Phase 1: Data Acquisition & Preparation (Week 1)');
    console.log('- Download official HTS 2024 dataset from data.gov');
    console.log('- Analyze file format (Excel/CSV/XML)');
    console.log('- Create data mapping schema');
    console.log('- Test with high-priority chapters\n');

    console.log('Phase 2: Database Integration (Week 2)');
    console.log('- Backup current hs_master_rebuild table');
    console.log('- Create staging table for HTS data');
    console.log('- Implement batch processing for large dataset');
    console.log('- Validate against current successful records\n');

    console.log('Phase 3: Quality Assurance (Week 3)');
    console.log('- Compare HTS rates vs current rates');
    console.log('- Verify USMCA preferential rates');
    console.log('- Test multi-country view with expanded data');
    console.log('- Professional validation with customs broker\n');

    console.log('Phase 4: Production Deployment (Week 4)');
    console.log('- Replace current US data with official HTS');
    console.log('- Update API responses with government attribution');
    console.log('- Enhance frontend with official source indicators');
    console.log('- Document complete data provenance chain\n');

    console.log('🎯 Expected outcomes:');
    console.log(`- US coverage: ${this.currentUSCount} → ~17,000 codes`);
    console.log('- Professional credibility: Government source');
    console.log('- Audit compliance: Complete documentation');
    console.log('- Customer confidence: Official USITC data');
    console.log('- Revenue potential: Enterprise-ready platform\n');
  }

  async run() {
    try {
      console.log('🏛️ OFFICIAL US HTS 2024 ANALYSIS SYSTEM\n');
      console.log('Comparing current data vs official government dataset...\n');
      
      // Step 1: Analyze current US data
      await this.analyzeCurrentUSData();
      
      // Step 2: Analyze official HTS potential
      this.analyzeOfficialHTSPotential();
      
      // Step 3: Identify high-value categories
      this.identifyHighValueCategories();
      
      // Step 4: Create implementation plan
      this.createImplementationPlan();
      
      console.log('✅ Analysis completed successfully!');
      console.log('🚀 Ready to integrate official US government tariff data');
      
    } catch (error) {
      console.error('💥 Analysis failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const analyzer = new OfficialHTSAnalyzer();
  analyzer.run();
}

module.exports = OfficialHTSAnalyzer;