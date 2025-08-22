import { getSupabaseClient } from './lib/supabase-client.js';

async function auditComtradeTable() {
  const supabase = getSupabaseClient();
  
  console.log('🔍 AUDITING COMTRADE_REFERENCE TABLE FOR CORRUPTION');
  
  try {
    // Check total records
    const { count } = await supabase
      .from('comtrade_reference')
      .select('id', { count: 'exact', head: true });
    
    console.log(`Total records: ${count}`);
    
    // Check for generic classifications
    const { data: genericEntries } = await supabase
      .from('comtrade_reference')
      .select('hs_code, product_description, product_category')
      .eq('product_description', 'Agricultural and food products')
      .limit(10);
      
    console.log('\n❌ CORRUPTION DETECTED - Generic Agricultural classifications:');
    if (genericEntries && genericEntries.length > 0) {
      genericEntries.forEach(entry => {
        console.log(`HS Code: ${entry.hs_code} -> "${entry.product_description}" (Category: ${entry.product_category})`);
      });
    } else {
      console.log('No generic "Agricultural and food products" entries found');
    }
    
    // Check known specific HS codes  
    const testCodes = ['010001', '020110', '010290'];
    console.log('\n🧪 TESTING KNOWN HS CODES:');
    
    const expectedDescriptions = {
      '010001': 'Live horses, pure-bred breeding animals',
      '020110': 'Bovine carcasses and half-carcasses, fresh or chilled', 
      '010290': 'Live bovine animals (other than pure-bred breeding animals)'
    };
    
    for (const code of testCodes) {
      const { data } = await supabase
        .from('comtrade_reference')
        .select('hs_code, product_description, product_category')
        .eq('hs_code', code)
        .limit(1);
        
      if (data && data.length > 0) {
        const entry = data[0];
        const expected = expectedDescriptions[code];
        const actual = entry.product_description;
        const isCorrect = actual === expected;
        
        console.log(`${code}: ${isCorrect ? '✅' : '❌'} Expected: "${expected}" | Actual: "${actual}"`);
      } else {
        console.log(`${code}: ❌ NOT FOUND`);
      }
    }
    
    // Check for invalid HS code formats
    const { data: invalidFormats } = await supabase
      .from('comtrade_reference')
      .select('hs_code, product_description')
      .like('hs_code', '%.%')
      .limit(10);
      
    console.log('\n🔍 INVALID HS CODE FORMATS (containing decimals):');
    if (invalidFormats && invalidFormats.length > 0) {
      invalidFormats.forEach(entry => {
        console.log(`Invalid: ${entry.hs_code} -> "${entry.product_description}"`);
      });
    } else {
      console.log('No decimal formats found');
    }
    
    // Sample diverse entries to check patterns
    const { data: sample } = await supabase
      .from('comtrade_reference')
      .select('hs_code, product_description, product_category')
      .limit(20);
      
    console.log('\n📊 SAMPLE ENTRIES:');
    if (sample) {
      sample.forEach(entry => {
        console.log(`${entry.hs_code} | ${entry.product_description} | ${entry.product_category}`);
      });
    }
    
    // Check for duplicated generic descriptions
    const { data: duplicateCheck } = await supabase
      .from('comtrade_reference')
      .select('product_description, count(*)')
      .eq('product_description', 'Agricultural and food products');
      
    console.log('\n📈 CHECKING FOR PATTERN DUPLICATES:');
    console.log('Generic "Agricultural and food products" count:', duplicateCheck?.length || 0);
    
  } catch (error) {
    console.error('Error during audit:', error);
  }
}

auditComtradeTable();