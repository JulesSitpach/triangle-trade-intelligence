/**
 * Direct Database Test - Bypass client wrappers to test raw connection
 */
import { createClient } from '@supabase/supabase-js';

async function testDirectConnection() {
  console.log('🔍 DIRECT DATABASE CONNECTION TEST');
  console.log('=====================================\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('1. Environment Variables:');
  console.log(`   URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Key: ${serviceKey ? '✅ Set (length: ' + serviceKey.length + ')' : '❌ Missing'}\n`);
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing required environment variables');
    return false;
  }
  
  try {
    console.log('2. Creating direct Supabase client...');
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Client created successfully\n');
    
    console.log('3. Testing basic query...');
    const { data, error, count } = await supabase
      .from('comtrade_reference')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Query failed:', error.message);
      console.log('   Error code:', error.code);
      console.log('   Error details:', error.details);
      console.log('   Error hint:', error.hint);
      return false;
    }
    
    console.log('✅ Query successful');
    console.log(`   Record count: ${count || 0}\n`);
    
    console.log('4. Testing table creation (if needed)...');
    
    // Check if table exists, if not create it
    const { data: tableData, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'comtrade_reference');
    
    if (tableError) {
      console.log('⚠️ Could not check table existence:', tableError.message);
    } else if (!tableData || tableData.length === 0) {
      console.log('📝 Table does not exist, attempting to create...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS comtrade_reference (
          id SERIAL PRIMARY KEY,
          hs_code VARCHAR(10) NOT NULL,
          product_description TEXT,
          product_category VARCHAR(100),
          hs_chapter VARCHAR(2),
          hs_section VARCHAR(5),
          usmca_eligible BOOLEAN DEFAULT true,
          usmca_tariff_rate DECIMAL(5,2) DEFAULT 0,
          base_tariff_rate DECIMAL(5,2),
          mfn_tariff_rate DECIMAL(5,2),
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_enhanced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          potential_annual_savings INTEGER,
          triangle_routing_success_rate INTEGER,
          route_optimization_priority INTEGER,
          UNIQUE(hs_code)
        );
        
        CREATE INDEX IF NOT EXISTS idx_comtrade_hs_code ON comtrade_reference(hs_code);
        CREATE INDEX IF NOT EXISTS idx_comtrade_category ON comtrade_reference(product_category);
        CREATE INDEX IF NOT EXISTS idx_comtrade_chapter ON comtrade_reference(hs_chapter);
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.log('❌ Table creation failed:', createError.message);
        // Try alternative approach - direct SQL execution may not be available
        console.log('⚠️ Attempting alternative table creation...');
        return false;
      } else {
        console.log('✅ Table created successfully');
      }
    } else {
      console.log('✅ Table exists');
    }
    
    console.log('\n5. Testing insert capability...');
    const testRecord = {
      hs_code: 'TEST999',
      product_description: 'Test Product for Connection Verification',
      product_category: 'Test Category'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('comtrade_reference')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
      console.log('   This might be due to table not existing or permission issues');
      return false;
    }
    
    console.log('✅ Insert test successful');
    
    // Clean up test record
    await supabase
      .from('comtrade_reference')
      .delete()
      .eq('hs_code', 'TEST999');
    
    console.log('✅ Test record cleaned up\n');
    
    console.log('🎉 ALL TESTS PASSED - Database is ready for data loading!');
    return true;
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testDirectConnection().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}