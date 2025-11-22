import { getSupabaseServiceClient } from './lib/database/supabase-client.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = getSupabaseServiceClient();

async function findSteelCodes() {
  console.log('🔍 Searching for Chapter 73 codes matching our components...\n');

  // Search 1: Codes that might match "backing plate" or "shim"
  const { data: chapter73, error } = await supabase
    .from('tariff_intelligence_master')
    .select('hts8, brief_description, mfn_ad_val_rate, usmca_ad_val_rate')
    .like('hts8', '7326.90%')
    .order('hts8');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${chapter73.length} codes in 7326.90.XX range:\n`);

  chapter73.forEach(row => {
    console.log(`${row.hts8} - ${row.brief_description}`);
    console.log(`  MFN: ${row.mfn_ad_val_rate || 'Free'}, USMCA: ${row.usmca_ad_val_rate || 'Free'}\n`);
  });

  // Search 2: Friction materials (Chapter 68)
  console.log('\n🔍 Searching for Chapter 68 friction materials...\n');

  const { data: chapter68, error: err68 } = await supabase
    .from('tariff_intelligence_master')
    .select('hts8, brief_description, mfn_ad_val_rate, usmca_ad_val_rate')
    .like('hts8', '6813%')
    .order('hts8');

  if (!err68) {
    chapter68.forEach(row => {
      console.log(`${row.hts8} - ${row.brief_description}`);
      console.log(`  MFN: ${row.mfn_ad_val_rate || 'Free'}, USMCA: ${row.usmca_ad_val_rate || 'Free'}\n`);
    });
  }

  process.exit(0);
}

findSteelCodes().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
