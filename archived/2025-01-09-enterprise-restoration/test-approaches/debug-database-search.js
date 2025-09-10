/**
 * DEBUG DATABASE SEARCH
 * Check what the database actually contains for electrical wire searches
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugDatabaseSearch() {
  console.log('🔍 DEBUGGING DATABASE SEARCH TERMS');
  console.log('==================================');
  
  const searchQueries = [
    'copper wire',
    'electrical wire',
    'wire',
    'cable',
    'copper',
    'electrical connector',
    'connector',
    'plastic connector'
  ];
  
  for (const query of searchQueries) {
    console.log(`\n🔍 Testing search: "${query}"`);
    console.log('---');
    
    // Test exact phrase search (like the API does)
    const { data: exactResults, error: exactError } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, mfn_rate, chapter')
      .ilike('description', `%${query}%`)
      .limit(5);
    
    if (exactError) {
      console.log('❌ Error:', exactError.message);
      continue;
    }
    
    if (exactResults && exactResults.length > 0) {
      console.log(`✅ Found ${exactResults.length} exact matches:`);
      exactResults.forEach((item, index) => {
        const subcategory = item.hs_code.substring(0, 4);
        console.log(`   ${index + 1}. ${item.hs_code} (${subcategory}, Ch.${item.chapter})`);
        console.log(`      ${item.description?.substring(0, 80)}...`);
        console.log(`      MFN: ${item.mfn_rate}%`);
      });
    } else {
      console.log('❌ No exact matches found');
      
      // Try text search as fallback
      const searchTerms = query.split(' ');
      const { data: textResults } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code, description, mfn_rate, chapter')
        .textSearch('description', searchTerms.join(' | '))
        .limit(3);
      
      if (textResults && textResults.length > 0) {
        console.log(`⚠️ Text search found ${textResults.length} matches:`);
        textResults.forEach((item, index) => {
          const subcategory = item.hs_code.substring(0, 4);
          console.log(`   ${index + 1}. ${item.hs_code} (${subcategory}, Ch.${item.chapter})`);
          console.log(`      ${item.description?.substring(0, 80)}...`);
        });
      }
    }
  }
  
  // Special test: Look for known cable codes
  console.log(`\n🎯 TESTING KNOWN CABLE CODES (Chapter 8544):`);
  const { data: cableResults } = await supabase
    .from('hs_master_rebuild')
    .select('hs_code, description, mfn_rate')
    .like('hs_code', '8544%')
    .limit(10);
  
  if (cableResults && cableResults.length > 0) {
    console.log(`✅ Found ${cableResults.length} cable codes (8544):`);
    cableResults.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.hs_code}: ${item.description?.substring(0, 80)}...`);
      console.log(`      MFN: ${item.mfn_rate}%`);
    });
  }
  
  console.log('\n==================================');
  console.log('🔍 DEBUG COMPLETE');
}

debugDatabaseSearch().catch(console.error);