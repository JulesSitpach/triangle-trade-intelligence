/**
 * Pre-cache Missing Customer HS Codes
 *
 * Runs AI research on the 11 codes that customers queried but aren't in database
 * Caches results to tariff_intelligence_master for instant future lookups
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { BaseAgent } from './lib/agents/base-agent.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// The 11 codes that are missing from database but customers are querying
const MISSING_CODES = [
  { code: '2002.90.00', desc: 'Tomatoes (other than whole/pieces)' },
  { code: '5907.00.90', desc: 'Textile fabrics impregnated' },
  { code: '8507.80.00', desc: 'Electric accumulators (batteries)' },
  { code: '85342900', desc: 'Multilayer PCBs' },
  { code: '8534.30.00', desc: 'PCBs with passive elements' },
  { code: '8534.31.00', desc: 'PCB with components (multilayer)' },
  { code: '8541.40.20', desc: 'Photosensitive semiconductor devices (LEDs)' },
  { code: '8542.31.00', desc: 'Processors/controllers' },
  { code: '9018.12.10', desc: 'Ultrasonic scanning' },
  { code: '9018.12.80', desc: 'Other ultrasound equipment' },
  { code: '90181500', desc: 'Ophthalmologic instruments' }
];

console.log('================================================================================');
console.log('PRE-CACHE MISSING CUSTOMER HS CODES');
console.log(`Researching and caching ${MISSING_CODES.length} codes using AI`);
console.log('================================================================================\n');

let successCount = 0;
let errorCount = 0;
const results = [];

for (const item of MISSING_CODES) {
  const normalizedCode = item.code.replace(/\./g, '').substring(0, 8);

  console.log(`\n🔍 [${successCount + errorCount + 1}/${MISSING_CODES.length}] Researching: ${item.code}`);
  console.log(`   Description: ${item.desc}`);

  try {
    // Build AI prompt to research tariff rates
    const prompt = `You are a customs tariff specialist. Research the official US tariff rates for this product:

HS Code: ${normalizedCode}
Description: ${item.desc}

Provide the following information:
1. Official 8-digit HTS code (US tariff schedule)
2. Brief product description from HTS schedule
3. MFN (Most Favored Nation) tariff rate as decimal (e.g., 0.057 for 5.7%)
4. USMCA preferential tariff rate as decimal (usually 0.0 for duty-free)
5. Confidence level (0.0 to 1.0)

Respond ONLY with valid JSON in this exact format:
{
  "hts8": "85343100",
  "description": "Multilayer printed circuits",
  "mfn_rate": 0.0,
  "usmca_rate": 0.0,
  "confidence": 0.88
}`;

    const agent = new BaseAgent({
      model: 'anthropic/claude-haiku-4.5',
      maxTokens: 1000
    });

    console.log('   🤖 Calling AI...');
    const response = await agent.execute(prompt, { temperature: 0.1 });

    if (!response.success || !response.data) {
      throw new Error('AI response failed');
    }

    const aiData = response.data;

    // Validate response
    if (!aiData.hts8 || aiData.mfn_rate === undefined) {
      throw new Error('AI response missing required fields');
    }

    console.log(`   ✅ AI Response: ${aiData.hts8} - MFN ${(aiData.mfn_rate * 100).toFixed(1)}%, USMCA ${(aiData.usmca_rate * 100).toFixed(1)}%`);
    console.log(`   📝 Description: ${aiData.description}`);
    console.log(`   🎯 Confidence: ${(aiData.confidence * 100).toFixed(0)}%`);

    // Save to database
    console.log('   💾 Saving to tariff_intelligence_master...');

    const { error: dbError } = await supabase
      .from('tariff_intelligence_master')
      .upsert({
        hts8: aiData.hts8,
        brief_description: aiData.description,
        mfn_ad_val_rate: aiData.mfn_rate,
        usmca_ad_val_rate: aiData.usmca_rate,
        data_source: 'AI Research (Pre-cache)',
        begin_effect_date: '2025-01-01',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'hts8'
      });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log(`   ✅ CACHED - Future lookups will be instant!`);

    successCount++;
    results.push({
      code: item.code,
      status: 'success',
      hts8: aiData.hts8,
      mfn_rate: aiData.mfn_rate,
      confidence: aiData.confidence
    });

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    console.error(`   ❌ ERROR: ${error.message}`);
    errorCount++;
    results.push({
      code: item.code,
      status: 'error',
      error: error.message
    });
  }
}

console.log('\n================================================================================');
console.log('CACHE COMPLETION SUMMARY');
console.log('================================================================================');
console.log(`✅ Successfully cached: ${successCount}/${MISSING_CODES.length}`);
console.log(`❌ Errors: ${errorCount}/${MISSING_CODES.length}`);
console.log(`💰 Estimated cost: $${(successCount * 0.02).toFixed(2)}`);
console.log('\n📊 Results:');
results.forEach((r, i) => {
  if (r.status === 'success') {
    console.log(`   ${i + 1}. ${r.code} → ${r.hts8} (${(r.confidence * 100).toFixed(0)}% confidence)`);
  } else {
    console.log(`   ${i + 1}. ${r.code} → ERROR: ${r.error}`);
  }
});

console.log('\n🎯 IMPACT:');
console.log(`   Database hit rate: 62% → ${Math.round((18 + successCount) / (18 + successCount + (11 - successCount)) * 100)}%`);
console.log(`   Customers now get instant lookups for all ${successCount} previously-slow codes!`);
console.log('\n================================================================================');
