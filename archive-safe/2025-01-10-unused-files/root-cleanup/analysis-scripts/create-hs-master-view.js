#!/usr/bin/env node

/**
 * Create HS Master View
 * Simple, clean unified view that actually works with our data structure
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const { serverDatabaseService } = await import('./lib/database/supabase-client.js');

const createViewSQL = `
CREATE OR REPLACE VIEW hs_master AS
SELECT DISTINCT
    c.hs_code,
    c.product_description,
    c.product_category,
    COALESCE(tr.mfn_rate, utr.mfn_rate, 0) as mfn_rate,
    COALESCE(tr.usmca_rate, utr.usmca_rate, 0) as usmca_rate,
    LEFT(c.hs_code, 2)::INT as chapter,
    uqr.product_category as business_type,
    uqr.regional_content_threshold as minimum_regional_content,
    CASE 
        WHEN COALESCE(tr.usmca_rate, utr.usmca_rate, 0) < COALESCE(tr.mfn_rate, utr.mfn_rate, 0) 
        THEN true ELSE false 
    END as usmca_eligible
FROM comtrade_reference c
LEFT JOIN tariff_rates tr ON c.hs_code = tr.hs_code AND tr.country = 'US'
LEFT JOIN usmca_tariff_rates utr ON c.hs_code = utr.hs_code  
LEFT JOIN usmca_qualification_rules uqr ON LEFT(c.hs_code, 2) = uqr.hs_chapter::TEXT;
`;

async function createHSMasterView() {
  console.log('🚀 Creating HS Master View...');
  
  try {
    // Try to create the view using a raw SQL query approach
    console.log('📝 Executing SQL...');
    
    // Since we can't execute raw SQL directly, let's test if we can access the data
    // and then advise on manual creation
    
    // First, test basic connectivity
    const { data: testData, error: testError } = await serverDatabaseService.client
      .from('comtrade_reference')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Database connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('\n📋 Please execute this SQL manually in your Supabase dashboard:');
    console.log('─'.repeat(80));
    console.log(createViewSQL);
    console.log('─'.repeat(80));
    
    // After manual creation, test the view
    console.log('\n🧪 Testing HS Master view (after manual creation)...');
    
    const { data: viewData, error: viewError } = await serverDatabaseService.client
      .from('hs_master')
      .select('hs_code, product_description, mfn_rate, usmca_rate, usmca_eligible')
      .ilike('product_description', '%handbag%')
      .limit(5);
    
    if (viewError) {
      console.log('⚠️  View not created yet:', viewError.message);
      console.log('💡 Please create the view manually using the SQL above');
    } else {
      console.log('✅ HS Master view is working!');
      console.log(`📊 Found ${viewData.length} handbag products:`);
      viewData.forEach(item => {
        console.log(`  • ${item.hs_code}: ${item.product_description?.substring(0, 60)}...`);
        console.log(`    MFN: ${item.mfn_rate}%, USMCA: ${item.usmca_rate}%, Savings: ${item.usmca_eligible ? 'YES' : 'NO'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to create view:', error.message);
  }
}

// Execute
createHSMasterView();