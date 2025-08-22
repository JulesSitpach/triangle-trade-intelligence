import { getSupabaseClient } from './lib/supabase-client.js';

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection and Permissions');
  
  const supabase = getSupabaseClient();
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('comtrade_reference')
      .select('count(*)', { head: true, count: 'exact' });
    
    if (testError) {
      console.log('❌ Connection error:', testError.message);
      
      // Check if table exists by trying to describe it
      console.log('2. Checking if table exists...');
      const { data: tables, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'comtrade_reference' });
        
      if (tableError) {
        console.log('❌ Table check failed:', tableError.message);
      }
      
      return false;
    }
    
    console.log('✅ Connection successful');
    console.log('2. Testing permissions...');
    
    // Test insert permission
    const testRecord = {
      hs_code: 'TEST001',
      product_description: 'Test product for permission check',
      product_category: 'Test'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('comtrade_reference')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.log('❌ Insert permission failed:', insertError.message);
      return false;
    }
    
    console.log('✅ Insert permission successful');
    
    // Clean up test record
    await supabase
      .from('comtrade_reference')
      .delete()
      .eq('hs_code', 'TEST001');
    
    console.log('✅ Database connection and permissions verified');
    return true;
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

testDatabaseConnection().then(success => {
  if (success) {
    console.log('\n🎉 Database ready for data correction!');
    process.exit(0);
  } else {
    console.log('\n❌ Database not ready. Check connection and permissions.');
    process.exit(1);
  }
}).catch(console.error);