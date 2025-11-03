/**
 * REPAIR SCRIPT: Populate 1,905 NULL RSS descriptions
 * Uses title as description where content is missing
 * This is temporary until RSS parser is fixed
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function repairEmptyDescriptions() {
  console.log('🔧 Repairing 1,905 RSS items with NULL descriptions...\n');

  try {
    // Get all items with NULL description
    const { data: emptyItems, error: fetchError } = await supabase
      .from('rss_feed_activities')
      .select('id, title')
      .is('description', null)
      .limit(2000);

    if (fetchError) throw fetchError;

    if (!emptyItems || emptyItems.length === 0) {
      console.log('✅ No items to repair - all descriptions populated!');
      return;
    }

    console.log(`📊 Found ${emptyItems.length} items with NULL descriptions\n`);

    // Update each item: use title as description
    let updated = 0;
    let failed = 0;

    for (const item of emptyItems) {
      try {
        const { error: updateError } = await supabase
          .from('rss_feed_activities')
          .update({
            description: item.title,  // Use title as fallback description
            link: `https://search.government.gov?q=${encodeURIComponent(item.title)}`,  // Generic link
            status: 'repaired'  // Mark as repaired
          })
          .eq('id', item.id);

        if (updateError) {
          console.error(`  ❌ [${updated + 1}/${emptyItems.length}] Failed:`, updateError.message);
          failed++;
        } else {
          updated++;
          if (updated % 100 === 0) {
            console.log(`  ✅ Updated ${updated}/${emptyItems.length} items...`);
          }
        }
      } catch (err) {
        console.error(`  ❌ Error updating item ${item.id}:`, err.message);
        failed++;
      }
    }

    console.log(`\n✅ Repair complete:`);
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Failed: ${failed}`);
    console.log(`   - Total: ${updated + failed}`);

    // Verify the repairs
    const { data: stillEmpty } = await supabase
      .from('rss_feed_activities')
      .select('id')
      .is('description', null);

    console.log(`\n📊 Remaining items with NULL description: ${stillEmpty?.length || 0}`);

    if (stillEmpty && stillEmpty.length === 0) {
      console.log('🎉 All RSS items now have descriptions!');
    }

  } catch (error) {
    console.error('❌ Repair failed:', error.message);
    process.exit(1);
  }
}

repairEmptyDescriptions();
