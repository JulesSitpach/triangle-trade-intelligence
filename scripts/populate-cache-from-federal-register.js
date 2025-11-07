/**
 * ONE-TIME SCRIPT: Populate policy_tariffs_cache from Federal Register XML
 * Fetches all Section 301 documents with HS code tables from Sep 2024 onwards
 * and extracts rates directly from structured XML (no AI needed)
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const { federalRegisterSection301Sync } = await import('../lib/services/federal-register-section301-sync.js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('='.repeat(80));
console.log('FEDERAL REGISTER CACHE POPULATION');
console.log('='.repeat(80));

// Known documents with HS code tables (manually curated)
const documentsWithTables = [
  { document_number: '2024-21217', publication_date: '2024-09-18', title: 'China tariff modification (365 HS codes)' },
  { document_number: '2024-29462', publication_date: '2024-12-16', title: 'China tariff modification Dec 2024' },
  { document_number: '2025-19568', publication_date: '2025-10-16', title: 'Section 301 modification Oct 2025' },
  { document_number: '2025-10660', publication_date: '2025-06-12', title: 'Proposed modification June 2025' }
];

console.log(`\nProcessing ${documentsWithTables.length} documents with HS code tables...\n`);

let totalExtracted = 0;
let totalSaved = 0;

for (const doc of documentsWithTables) {
  console.log(`\n📄 Processing ${doc.document_number} (${doc.publication_date})`);
  console.log(`   ${doc.title}`);

  try {
    const rates = await federalRegisterSection301Sync.extractRatesFromDocument(doc);

    if (!rates || rates.length === 0) {
      console.log(`   ⚠️  No HS codes found (may be policy announcement, not rate list)`);
      continue;
    }

    console.log(`   ✅ Extracted ${rates.length} HS codes`);
    totalExtracted += rates.length;

    // Save to database
    await federalRegisterSection301Sync.updateCacheWithRates(rates, doc);
    totalSaved += rates.length;

    // Delay to avoid overwhelming database
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
  }
}

// Final count
const { count } = await supabase
  .from('policy_tariffs_cache')
  .select('*', { count: 'exact', head: true })
  .not('section_301', 'is', null);

console.log('\n' + '='.repeat(80));
console.log('RESULTS');
console.log('='.repeat(80));
console.log(`Extracted: ${totalExtracted} HS codes from ${documentsWithTables.length} documents`);
console.log(`Saved: ${totalSaved} rates to database`);
console.log(`Cache total: ${count} HS codes with Section 301 data`);
console.log('='.repeat(80));
