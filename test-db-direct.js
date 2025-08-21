import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { getSupabaseClient } from './lib/supabase-client.js';

async function testDatabaseDirect() {
  try {
    console.log('Environment check:');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
    
    const supabase = getSupabaseClient();
    console.log('Supabase client created');
    
    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .limit(5);
      
    console.log('Query result:');
    console.log('Data count:', data?.length || 0);
    console.log('Error:', error?.message || 'None');
    
    if (data && data.length > 0) {
      console.log('Sample translation:', data[0]);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testDatabaseDirect();