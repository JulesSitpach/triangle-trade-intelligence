/**
 * POPULATE LABOR CREDITS SCRIPT
 *
 * Uses AI to research and populate labor_percentage values in industry_thresholds table.
 *
 * Usage:
 *   node scripts/populate-labor-credits.js
 *
 * What it does:
 * 1. Fetches all industries from database
 * 2. Uses AI to research typical labor credit % for each industry
 * 3. Updates database with researched values
 * 4. Logs results for verification
 */

import { createClient } from '@supabase/supabase-js';
import { LaborCreditResearchAgent } from '../lib/agents/labor-credit-research-agent.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function populateLaborCredits() {
  console.log('🚀 Starting labor credit population...\n');

  // Step 1: Fetch all industries from database
  const { data: industries, error } = await supabase
    .from('industry_thresholds')
    .select('id, industry_key, rvc_percentage, labor_percentage')
    .order('industry_key');

  if (error) {
    console.error('❌ Error fetching industries:', error);
    process.exit(1);
  }

  console.log(`📋 Found ${industries.length} industries to research:\n`);
  industries.forEach(ind => {
    console.log(`   - ${ind.industry_key} (Current: ${ind.labor_percentage}%)`);
  });
  console.log('');

  // Step 2: Research labor credits using AI
  const agent = new LaborCreditResearchAgent();
  const results = [];

  for (const industry of industries) {
    console.log(`\n🔍 Researching ${industry.industry_key}...`);

    const research = await agent.researchLaborCredit(industry.industry_key, 'United States');

    if (research.success) {
      const laborPercent = research.data.labor_credit_percentage;
      const confidence = research.data.confidence;

      console.log(`   ✅ Recommended: ${laborPercent}% (Confidence: ${confidence}%)`);
      console.log(`   📝 Reasoning: ${research.data.reasoning}`);

      results.push({
        id: industry.id,
        industry_key: industry.industry_key,
        labor_percentage: laborPercent,
        confidence: confidence,
        reasoning: research.data.reasoning,
        processes: research.data.typical_processes
      });
    } else {
      console.log(`   ❌ Research failed: ${research.error}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Step 3: Display results summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RESEARCH RESULTS SUMMARY');
  console.log('='.repeat(80) + '\n');

  console.log('Industry                     | Labor % | Confidence | Status');
  console.log('-'.repeat(80));

  results.forEach(r => {
    const status = r.confidence >= 85 ? '✅ High' : r.confidence >= 70 ? '⚠️  Medium' : '❌ Low';
    console.log(`${r.industry_key.padEnd(28)} | ${String(r.labor_percentage + '%').padEnd(7)} | ${String(r.confidence + '%').padEnd(10)} | ${status}`);
  });

  // Step 4: Ask for confirmation before updating database
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  READY TO UPDATE DATABASE');
  console.log('='.repeat(80));
  console.log(`\nThis will update ${results.length} rows in industry_thresholds table.`);
  console.log('All values have been researched using AI based on USMCA Article 4.5 guidelines.\n');

  // Auto-proceed (manual confirmation removed for script automation)
  console.log('✅ Proceeding with database update...\n');

  // Step 5: Update database
  let successCount = 0;
  let errorCount = 0;

  for (const result of results) {
    const { error } = await supabase
      .from('industry_thresholds')
      .update({
        labor_percentage: result.labor_percentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', result.id);

    if (error) {
      console.error(`❌ Failed to update ${result.industry_key}:`, error.message);
      errorCount++;
    } else {
      console.log(`✅ Updated ${result.industry_key}: ${result.labor_percentage}%`);
      successCount++;
    }
  }

  // Step 6: Final summary
  console.log('\n' + '='.repeat(80));
  console.log('✅ POPULATION COMPLETE');
  console.log('='.repeat(80));
  console.log(`\nSuccessful updates: ${successCount}/${results.length}`);
  if (errorCount > 0) {
    console.log(`Failed updates: ${errorCount}`);
  }

  console.log('\n📋 Updated Industries:');
  for (const result of results) {
    console.log(`\n${result.industry_key}:`);
    console.log(`   Labor Credit: ${result.labor_percentage}%`);
    console.log(`   Confidence: ${result.confidence}%`);
    console.log(`   Typical Processes: ${result.processes.join(', ')}`);
    console.log(`   Reasoning: ${result.reasoning}`);
  }

  console.log('\n✅ Labor credit data is now populated and ready to use!\n');
  process.exit(0);
}

// Run the script
populateLaborCredits().catch(error => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});
