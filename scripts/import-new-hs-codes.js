/**
 * Import New HS Codes into Supabase Database
 * This script imports the 6,940 newly downloaded HS codes
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importNewCodes() {
  console.log('🔄 Starting HS codes import...');
  
  // Load the new HS codes from our generated file
  const newCodes = JSON.parse(fs.readFileSync('data/validated-hs-codes.json', 'utf8'));
  console.log(`📊 Loaded ${newCodes.length} new codes`);
  
  // Clear existing data first
  console.log('🗑️ Clearing existing comtrade_reference data...');
  const { error: deleteError } = await supabase
    .from('comtrade_reference')
    .delete()
    .neq('hs_code', '');
    
  if (deleteError) {
    console.error('Delete error:', deleteError);
    return;
  }
  console.log('✅ Existing data cleared');
  
  // Prepare data for insertion (match existing table structure)
  const dataToInsert = newCodes
    .filter(code => code.id !== 'TOTAL') // Skip the total row
    .map(code => ({
      hs_code: code.id,
      product_description: code.text,
      product_category: getProductCategory(code.id),
      usmca_eligible: true,
      mfn_tariff_rate: 0, // Will be populated later with real tariff data
      usmca_tariff_rate: 0,
      potential_annual_savings: 0,
      last_updated: new Date().toISOString()
    }));
  
  console.log(`📝 Prepared ${dataToInsert.length} records for insertion`);
  
  // Insert in batches to avoid timeout
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < dataToInsert.length; i += batchSize) {
    const batch = dataToInsert.slice(i, i + batchSize);
    const batchNum = Math.floor(i/batchSize) + 1;
    
    const { error: insertError } = await supabase
      .from('comtrade_reference')
      .insert(batch);
    
    if (insertError) {
      console.error(`Batch ${batchNum} error:`, insertError.message);
      errors++;
    } else {
      inserted += batch.length;
      console.log(`✅ Batch ${batchNum}: ${inserted}/${dataToInsert.length} codes inserted`);
    }
    
    // Small delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎯 Import Summary:');
  console.log(`✅ Successfully imported: ${inserted} codes`);
  console.log(`❌ Failed batches: ${errors}`);
  console.log(`📊 Success rate: ${((inserted / dataToInsert.length) * 100).toFixed(1)}%`);
  
  // Verify the import
  const { data: countData } = await supabase
    .from('comtrade_reference')
    .select('*', { count: 'exact', head: true });
    
  console.log(`🔍 Verification: ${countData?.length || 'Unknown'} codes now in database`);
}

function getProductCategory(hsCode) {
  if (!hsCode || hsCode.length < 2) return 'Other';
  
  const chapter = hsCode.substring(0, 2);
  const categories = {
    '01': 'Live Animals', '02': 'Meat and Edible Meat Offal', '03': 'Fish and Seafood',
    '04': 'Dairy Products', '05': 'Animal Products', '06': 'Live Trees and Plants',
    '07': 'Edible Vegetables', '08': 'Edible Fruits and Nuts', '09': 'Coffee, Tea, Spices',
    '10': 'Cereals', '11': 'Milling Products', '12': 'Oil Seeds and Fruits',
    '13': 'Vegetable Extracts', '14': 'Vegetable Plaiting Materials', '15': 'Animal or Vegetable Fats',
    '16': 'Prepared Foodstuffs', '17': 'Sugars and Sugar Confectionery', '18': 'Cocoa and Cocoa Preparations',
    '19': 'Prepared Cereals', '20': 'Prepared Vegetables and Fruits', '21': 'Miscellaneous Edible Preparations',
    '22': 'Beverages and Spirits', '23': 'Food Industry Residues', '24': 'Tobacco',
    '25': 'Salt, Sulphur, Earth and Stone', '26': 'Ores, Slag and Ash', '27': 'Mineral Fuels and Oils',
    '28': 'Inorganic Chemicals', '29': 'Organic Chemicals', '30': 'Pharmaceutical Products',
    '31': 'Fertilizers', '32': 'Tanning and Dyeing Extracts', '33': 'Essential Oils and Perfumes',
    '34': 'Soap and Cleaning Products', '35': 'Albuminoidal Substances', '36': 'Explosives',
    '37': 'Photographic Products', '38': 'Miscellaneous Chemical Products', '39': 'Plastics',
    '40': 'Rubber', '41': 'Raw Hides and Skins', '42': 'Leather Articles',
    '43': 'Furskins', '44': 'Wood and Wood Products', '45': 'Cork Products',
    '46': 'Basketwork', '47': 'Pulp and Paper Materials', '48': 'Paper and Paperboard',
    '49': 'Printed Books and Newspapers', '50': 'Silk', '51': 'Wool',
    '52': 'Raw Cotton', '53': 'Other Vegetable Textile Fibers', '54': 'Man-made Filaments',
    '55': 'Man-made Staple Fibers', '56': 'Wadding and Felt', '57': 'Carpets',
    '58': 'Special Woven Fabrics', '59': 'Impregnated Textile Fabrics', '60': 'Knitted Fabrics',
    '61': 'Knitted Apparel', '62': 'Woven Apparel', '63': 'Other Textile Articles',
    '64': 'Footwear', '65': 'Headgear', '66': 'Umbrellas and Walking Sticks',
    '67': 'Prepared Feathers', '68': 'Stone, Plaster, and Cement Articles', '69': 'Ceramic Products',
    '70': 'Glass and Glassware', '71': 'Pearls and Precious Stones', '72': 'Iron and Steel',
    '73': 'Iron and Steel Articles', '74': 'Copper', '75': 'Nickel',
    '76': 'Aluminum', '78': 'Lead', '79': 'Zinc',
    '80': 'Tin', '81': 'Other Base Metals', '82': 'Tools and Cutlery',
    '83': 'Miscellaneous Base Metal Articles', '84': 'Machinery', '85': 'Electronics & Technology',
    '86': 'Railway Equipment', '87': 'Vehicles and Parts', '88': 'Aircraft',
    '89': 'Ships and Boats', '90': 'Optical and Medical Instruments', '91': 'Clocks and Watches',
    '92': 'Musical Instruments', '93': 'Arms and Ammunition', '94': 'Furniture',
    '95': 'Toys and Games', '96': 'Miscellaneous Manufactured Articles', '97': 'Works of Art'
  };
  return categories[chapter] || 'Other';
}

// Run the import
importNewCodes().catch(console.error);