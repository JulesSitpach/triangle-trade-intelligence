/**
 * Populate COMPLETE Test Data with workflow_data for ALL Services
 * This ensures all dashboard tabs have realistic data to display
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Complete test data with workflow_data for all services
const completeTestData = [
  // ===== CRISTINA'S SERVICES =====

  // 1. USMCA Certificates (Already has complete data in main script)
  {
    id: 'TEST_USMCA_001',
    service_type: 'USMCA Certificates',
    company_name: 'AutoParts Manufacturing Corp',
    contact_name: 'Mike Rodriguez',
    email: 'mike.rodriguez@autoparts.com',
    phone: '+1-214-555-0123',
    industry: 'Automotive Manufacturing',
    trade_volume: 3500000,
    status: 'pending',
    assigned_to: 'Cristina',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),

    service_details: {
      product_description: 'Automotive brake components',
      trade_volume: 3500000
    },

    workflow_data: {
      company_name: 'AutoParts Manufacturing Corp',
      contact_person: 'Mike Rodriguez',
      contact_email: 'mike.rodriguez@autoparts.com',
      business_type: 'Automotive Parts Manufacturer',
      annual_trade_volume: 3500000,
      trade_volume: 3500000,
      product_description: 'Automotive brake components including electronic sensors',
      manufacturing_location: 'Detroit, Michigan',
      component_origins: [
        {
          origin_country: 'CN',
          country: 'China',
          value_percentage: 45,
          percentage: 45,
          description: 'Electronic sensors and control units',
          component_type: 'Electronics',
          hs_code: '8537.10.90'
        },
        {
          origin_country: 'MX',
          country: 'Mexico',
          value_percentage: 35,
          percentage: 35,
          description: 'Assembled brake components',
          component_type: 'Mechanical',
          hs_code: '8708.30.50'
        },
        {
          origin_country: 'US',
          country: 'United States',
          value_percentage: 20,
          percentage: 20,
          description: 'Raw materials and metal components',
          component_type: 'Materials',
          hs_code: '7208.51.00'
        }
      ],
      qualification_status: 'QUALIFIED',
      north_american_content: 55
    }
  },

  // 2. HS Classification with COMPLETE workflow_data
  {
    id: 'TEST_HS_001',
    service_type: 'HS Classification',
    company_name: 'ElectroTech Solutions',
    contact_name: 'Lisa Chen',
    email: 'lisa.chen@electrotech.com',
    phone: '+1-408-555-0176',
    industry: 'Electronics',
    trade_volume: 2100000,
    status: 'pending',
    assigned_to: 'Cristina',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),

    service_details: {
      product_description: 'Smart home IoT devices and controllers',
      current_hs_code: 'To be determined',
      trade_volume: 2100000
    },

    workflow_data: {
      company_name: 'ElectroTech Solutions',
      contact_person: 'Lisa Chen',
      contact_email: 'lisa.chen@electrotech.com',
      business_type: 'Electronics Manufacturer',
      annual_trade_volume: 2100000,
      trade_volume: 2100000,
      product_description: 'Smart home IoT devices and controllers',
      manufacturing_location: 'Shenzhen, China',
      component_origins: [
        {
          origin_country: 'CN',
          country: 'China',
          value_percentage: 55,
          percentage: 55,
          description: 'Microcontrollers and circuit boards',
          component_type: 'Electronics'
        },
        {
          origin_country: 'TW',
          country: 'Taiwan',
          value_percentage: 25,
          percentage: 25,
          description: 'Display panels and sensors',
          component_type: 'Displays'
        },
        {
          origin_country: 'MX',
          country: 'Mexico',
          value_percentage: 20,
          percentage: 20,
          description: 'Assembly and plastic housing',
          component_type: 'Housing'
        }
      ],
      qualification_status: 'PARTIALLY_QUALIFIED',
      north_american_content: 20
    }
  },

  // 3. Crisis Response with COMPLETE workflow_data
  {
    id: 'TEST_CRISIS_001',
    service_type: 'Crisis Response',
    company_name: 'Global Trade Industries',
    contact_name: 'David Kim',
    email: 'david.kim@globaltrade.com',
    phone: '+1-713-555-0198',
    industry: 'Import/Export',
    trade_volume: 5800000,
    status: 'pending',
    assigned_to: 'Cristina',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),

    service_details: {
      product_description: 'Consumer electronics and accessories',
      crisis_type: 'Sudden tariff increase',
      trade_volume: 5800000
    },

    workflow_data: {
      company_name: 'Global Trade Industries',
      contact_person: 'David Kim',
      contact_email: 'david.kim@globaltrade.com',
      business_type: 'Import/Export Trading Company',
      annual_trade_volume: 5800000,
      trade_volume: 5800000,
      product_description: 'Consumer electronics and accessories',
      manufacturing_location: 'Various Asia locations',
      component_origins: [
        {
          origin_country: 'CN',
          country: 'China',
          value_percentage: 70,
          percentage: 70,
          description: 'Electronics manufacturing',
          component_type: 'Finished Goods'
        },
        {
          origin_country: 'VN',
          country: 'Vietnam',
          value_percentage: 20,
          percentage: 20,
          description: 'Accessories production',
          component_type: 'Accessories'
        },
        {
          origin_country: 'US',
          country: 'United States',
          value_percentage: 10,
          percentage: 10,
          description: 'Packaging and distribution',
          component_type: 'Packaging'
        }
      ],
      qualification_status: 'NOT_QUALIFIED',
      north_american_content: 10
    }
  },

  // ===== JORGE'S SERVICES =====

  // 4. Supplier Sourcing with COMPLETE workflow_data
  {
    id: 'TEST_SUPPLIER_001',
    service_type: 'Supplier Sourcing',
    company_name: 'MedDevice Solutions',
    contact_name: 'Maria Martinez',
    email: 'maria.martinez@meddevice.com',
    phone: '+1-858-555-0145',
    industry: 'Medical Device Manufacturing',
    trade_volume: 8500000,
    status: 'pending',
    assigned_to: 'Jorge',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),

    service_details: {
      product_description: 'Medical diagnostic equipment',
      sourcing_goals: 'Find Mexico-based suppliers',
      trade_volume: 8500000
    },

    workflow_data: {
      company_name: 'MedDevice Solutions',
      contact_person: 'Maria Martinez',
      contact_email: 'maria.martinez@meddevice.com',
      business_type: 'Medical Device Manufacturer',
      annual_trade_volume: 8500000,
      trade_volume: 8500000,
      product_description: 'Medical diagnostic equipment and surgical instruments',
      manufacturing_location: 'San Diego, California',
      component_origins: [
        {
          origin_country: 'DE',
          country: 'Germany',
          value_percentage: 40,
          percentage: 40,
          description: 'Precision components',
          component_type: 'Medical Components'
        },
        {
          origin_country: 'CN',
          country: 'China',
          value_percentage: 35,
          percentage: 35,
          description: 'Electronic components',
          component_type: 'Electronics'
        },
        {
          origin_country: 'US',
          country: 'United States',
          value_percentage: 25,
          percentage: 25,
          description: 'Final assembly',
          component_type: 'Assembly'
        }
      ],
      qualification_status: 'PARTIALLY_QUALIFIED',
      north_american_content: 25
    }
  },

  // 5. Manufacturing Feasibility with COMPLETE workflow_data
  {
    id: 'TEST_MFG_001',
    service_type: 'Manufacturing Feasibility',
    company_name: 'GreenTech Manufacturing',
    contact_name: 'Robert Johnson',
    email: 'robert.johnson@greentech.com',
    phone: '+1-503-555-0198',
    industry: 'Renewable Energy Equipment',
    trade_volume: 18500000,
    status: 'pending',
    assigned_to: 'Jorge',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),

    service_details: {
      product_description: 'Solar panel components and wind turbine parts',
      manufacturing_requirements: 'Evaluate Mexico manufacturing',
      trade_volume: 18500000
    },

    workflow_data: {
      company_name: 'GreenTech Manufacturing',
      contact_person: 'Robert Johnson',
      contact_email: 'robert.johnson@greentech.com',
      business_type: 'Renewable Energy Manufacturer',
      annual_trade_volume: 18500000,
      trade_volume: 18500000,
      product_description: 'Solar panel components and wind turbine parts',
      manufacturing_location: 'Portland, Oregon',
      component_origins: [
        {
          origin_country: 'CN',
          country: 'China',
          value_percentage: 50,
          percentage: 50,
          description: 'Solar cells and electronics',
          component_type: 'Solar Components'
        },
        {
          origin_country: 'MX',
          country: 'Mexico',
          value_percentage: 30,
          percentage: 30,
          description: 'Aluminum frames and assembly',
          component_type: 'Structural'
        },
        {
          origin_country: 'US',
          country: 'United States',
          value_percentage: 20,
          percentage: 20,
          description: 'Inverters and control systems',
          component_type: 'Electronics'
        }
      ],
      qualification_status: 'QUALIFIED',
      north_american_content: 50
    }
  },

  // 6. Market Entry with COMPLETE workflow_data
  {
    id: 'TEST_MARKET_001',
    service_type: 'Market Entry',
    company_name: 'ConsumerGoods Plus',
    contact_name: 'Jennifer Gonzalez',
    email: 'jennifer.gonzalez@consumergoods.com',
    phone: '+1-713-555-0134',
    industry: 'Consumer Products',
    trade_volume: 6800000,
    status: 'pending',
    assigned_to: 'Jorge',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),

    service_details: {
      product_description: 'Home appliances and kitchen equipment',
      target_markets: 'Mexico, Central America',
      trade_volume: 6800000
    },

    workflow_data: {
      company_name: 'ConsumerGoods Plus',
      contact_person: 'Jennifer Gonzalez',
      contact_email: 'jennifer.gonzalez@consumergoods.com',
      business_type: 'Consumer Products Distributor',
      annual_trade_volume: 6800000,
      trade_volume: 6800000,
      product_description: 'Home appliances and kitchen equipment',
      manufacturing_location: 'Various Asia Manufacturing',
      component_origins: [
        {
          origin_country: 'CN',
          country: 'China',
          value_percentage: 65,
          percentage: 65,
          description: 'Appliance manufacturing',
          component_type: 'Appliances'
        },
        {
          origin_country: 'MX',
          country: 'Mexico',
          value_percentage: 25,
          percentage: 25,
          description: 'Regional distribution',
          component_type: 'Distribution'
        },
        {
          origin_country: 'US',
          country: 'United States',
          value_percentage: 10,
          percentage: 10,
          description: 'Brand and design',
          component_type: 'Design'
        }
      ],
      qualification_status: 'PARTIALLY_QUALIFIED',
      north_american_content: 35,
      current_markets: ['United States'],
      target_markets: ['Mexico', 'Guatemala', 'Costa Rica']
    }
  }
];

async function populateCompleteTestData() {
  console.log('🚀 Populating COMPLETE test data with workflow_data for ALL services...\n');

  try {
    // Clear existing test data
    console.log('🧹 Clearing existing test data...');
    const testIds = completeTestData.map(r => r.id);
    await supabase
      .from('service_requests')
      .delete()
      .in('id', testIds);

    console.log('✅ Cleared old test data\n');

    // Insert complete test data
    console.log('📝 Inserting complete test data...');
    const { data, error } = await supabase
      .from('service_requests')
      .insert(completeTestData);

    if (error) {
      console.error('❌ Error inserting test data:', error.message);
      return;
    }

    console.log('✅ Successfully inserted test data\n');

    // Verify data
    console.log('🔍 Verifying inserted data...\n');

    for (const service of completeTestData) {
      const { data: check, error: checkError } = await supabase
        .from('service_requests')
        .select('id, company_name, service_type, workflow_data')
        .eq('id', service.id)
        .single();

      if (checkError) {
        console.error(`❌ Error checking ${service.id}:`, checkError.message);
        continue;
      }

      const hasWorkflowData = check.workflow_data && Object.keys(check.workflow_data).length > 0;
      const hasComponentOrigins = check.workflow_data?.component_origins?.length > 0;
      const hasTradeVolume = check.workflow_data?.trade_volume || check.workflow_data?.annual_trade_volume;

      console.log(`📋 ${check.service_type} - ${check.company_name}`);
      console.log(`   workflow_data: ${hasWorkflowData ? '✅' : '❌'}`);
      console.log(`   component_origins: ${hasComponentOrigins ? `✅ (${check.workflow_data.component_origins.length} items)` : '❌'}`);
      console.log(`   trade_volume: ${hasTradeVolume ? `✅ ($${hasTradeVolume.toLocaleString()})` : '❌'}`);
      console.log('');
    }

    console.log('\n✅ Database population complete!');
    console.log('\n📊 Summary:');
    console.log(`   Total records: ${completeTestData.length}`);
    console.log(`   Cristina's services: 3 (USMCA, HS Classification, Crisis Response)`);
    console.log(`   Jorge's services: 3 (Supplier Sourcing, Manufacturing Feasibility, Market Entry)`);
    console.log('\n🎯 All records have complete workflow_data with:');
    console.log('   - component_origins arrays');
    console.log('   - trade_volume numbers');
    console.log('   - qualification_status');
    console.log('   - All business context fields');
    console.log('\n✅ Ready for testing dashboards!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
populateCompleteTestData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });