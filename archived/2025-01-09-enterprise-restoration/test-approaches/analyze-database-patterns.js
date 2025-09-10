// Analyze actual database patterns for intelligent classification
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeClassificationPatterns() {
  console.log('🔍 ANALYZING DATABASE PATTERNS FOR CLASSIFICATION');
  console.log('=' .repeat(60));

  try {
    // Analyze electronics patterns
    console.log('\n📱 ELECTRONICS PATTERNS:');
    const { data: electronics } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, chapter, mfn_rate, usmca_rate')
      .ilike('description', '%smartphone%')
      .limit(10);
    
    if (electronics) {
      electronics.forEach(item => {
        console.log(`  ${item.hs_code} (Ch.${item.chapter}) - ${item.description.substring(0, 60)}... [${item.mfn_rate}% MFN]`);
      });
    }

    // Analyze automotive patterns  
    console.log('\n🚗 AUTOMOTIVE PATTERNS:');
    const { data: automotive } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, chapter, mfn_rate, usmca_rate')
      .or('description.ilike.%brake%,description.ilike.%automotive%,description.ilike.%vehicle%')
      .limit(10);
    
    if (automotive) {
      automotive.forEach(item => {
        console.log(`  ${item.hs_code} (Ch.${item.chapter}) - ${item.description.substring(0, 60)}... [${item.mfn_rate}% MFN]`);
      });
    }

    // Analyze chapter distribution
    console.log('\n📊 CHAPTER ANALYSIS:');
    const { data: chapterCounts } = await supabase
      .from('hs_master_rebuild')
      .select('chapter')
      .limit(1000);
    
    if (chapterCounts) {
      const chapters = {};
      chapterCounts.forEach(row => {
        chapters[row.chapter] = (chapters[row.chapter] || 0) + 1;
      });
      
      const topChapters = Object.entries(chapters)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
      
      console.log('Top 10 most common HS chapters in database:');
      topChapters.forEach(([chapter, count]) => {
        console.log(`  Chapter ${chapter}: ${count} codes`);
      });
    }

    // Analyze tariff rates patterns
    console.log('\n💰 TARIFF RATE PATTERNS:');
    const { data: highTariffs } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, chapter, mfn_rate, usmca_rate')
      .gt('mfn_rate', 10)
      .order('mfn_rate', { ascending: false })
      .limit(5);
    
    if (highTariffs) {
      console.log('Highest tariff rates in database (most important to classify correctly):');
      highTariffs.forEach(item => {
        console.log(`  ${item.hs_code}: ${item.mfn_rate}% MFN → ${item.usmca_rate}% USMCA = ${item.mfn_rate - item.usmca_rate}% savings`);
        console.log(`    ${item.description.substring(0, 80)}...`);
      });
    }

    // Analyze textile patterns
    console.log('\n👕 TEXTILE PATTERNS:');
    const { data: textiles } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, chapter, mfn_rate, usmca_rate')
      .or('description.ilike.%t-shirt%,description.ilike.%shirt%,description.ilike.%clothing%,description.ilike.%garment%')
      .limit(10);
    
    if (textiles) {
      textiles.forEach(item => {
        console.log(`  ${item.hs_code} (Ch.${item.chapter}) - ${item.description.substring(0, 60)}... [${item.mfn_rate}% MFN]`);
      });
    }

  } catch (error) {
    console.error('Analysis failed:', error.message);
  }
}

// Run analysis
analyzeClassificationPatterns();