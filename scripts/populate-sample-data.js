/**
 * Populate Database with Sample Service Requests
 * Creates realistic test data for both Jorge and Cristina's services
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sample data for Cristina's USMCA Certificate services
const cristinaServiceRequests = [
  {
    id: 'CR001',
    service_type: 'USMCA Certificates',
    company_name: 'AutoParts Manufacturing Corp',
    contact_name: 'Mike Rodriguez',
    email: 'mike.rodriguez@autoparts.com',
    phone: '+1-214-555-0123',
    industry: 'Automotive Manufacturing',
    trade_volume: 3500000,
    status: 'pending',
    assigned_to: 'Cristina',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago

    // Complete workflow data from USMCA analysis
    workflow_data: {
      company_name: 'AutoParts Manufacturing Corp',
      contact_person: 'Mike Rodriguez',
      contact_email: 'mike.rodriguez@autoparts.com',
      business_type: 'Automotive Parts Manufacturer',
      annual_trade_volume: 3500000,
      product_description: 'Automotive brake components including electronic sensors, control units, and assembled brake systems',
      classified_hs_code: '8708.30.50',
      hs_code_description: 'Mounted brake linings for vehicles',
      classification_method: 'AI-enhanced with web search verification',
      hs_code_confidence: 92,
      manufacturing_location: 'Detroit, Michigan',
      component_origins: [
        {
          origin_country: 'CN',
          value_percentage: 45,
          description: 'Electronic sensors and control units',
          hs_code: '8537.10.90',
          usmca_qualification: {
            qualifies: false,
            reason: 'Made in China - non-USMCA country'
          },
          cost_analysis: {
            annual_duty_cost: 78750
          }
        },
        {
          origin_country: 'MX',
          value_percentage: 35,
          description: 'Assembled brake components',
          hs_code: '8708.30.50',
          usmca_qualification: {
            qualifies: true,
            reason: 'Manufactured in Mexico - USMCA member'
          },
          cost_analysis: {
            annual_duty_cost: 0
          }
        },
        {
          origin_country: 'US',
          value_percentage: 20,
          description: 'Raw materials and metal components',
          hs_code: '7208.51.00',
          usmca_qualification: {
            qualifies: true,
            reason: 'Made in USA - USMCA member'
          },
          cost_analysis: {
            annual_duty_cost: 0
          }
        }
      ],
      qualification_status: 'USMCA Qualified',
      north_american_content: 55,
      annual_tariff_savings: 122400,
      qualification_analysis: {
        current_status: 'USMCA Qualified with risk factors',
        risk_factors: ['High China dependency (45%) creates USMCA qualification risk']
      },

      // Certificate data from workflow
      certificate: {
        certificate_number: 'USMCA-2024-001',
        exporter_name: 'AutoParts Manufacturing Corp',
        exporter_address: '1234 Manufacturing Blvd, Detroit, MI 48201',
        exporter_tax_id: '12-3456789',
        product_description: 'Automotive brake components including electronic sensors and control units',
        hs_tariff_classification: '8708.30.50',
        country_of_origin: 'United States',
        preference_criterion: 'A',
        blanket_start: '2024-01-01',
        blanket_end: '2024-12-31'
      }
    },

    service_details: {
      product_description: 'Automotive brake components including electronic sensors, control units, and assembled brake systems',
      current_hs_code: '8708.30.50',
      component_origins: [
        { country: 'CN', percentage: 45, component_type: 'Electronic sensors' },
        { country: 'MX', percentage: 35, component_type: 'Brake assemblies' },
        { country: 'US', percentage: 20, component_type: 'Raw materials' }
      ],
      component_count: 3,
      qualification_status: 'USMCA Qualified with risk factors'
    }
  },

  {
    id: 'CR002',
    service_type: 'USMCA Certificates',
    company_name: 'TechElectronics Inc',
    contact_name: 'Sarah Chen',
    email: 'sarah.chen@techelectronics.com',
    phone: '+1-408-555-0189',
    industry: 'Electronics Manufacturing',
    trade_volume: 8200000,
    status: 'pending',
    assigned_to: 'Cristina',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago

    workflow_data: {
      company_name: 'TechElectronics Inc',
      contact_person: 'Sarah Chen',
      contact_email: 'sarah.chen@techelectronics.com',
      business_type: 'Consumer Electronics Manufacturer',
      annual_trade_volume: 8200000,
      product_description: 'Wireless communication devices including smartphones, tablets, and networking equipment',
      classified_hs_code: '8517.12.00',
      hs_code_description: 'Telephones for cellular networks',
      classification_method: 'Professional customs broker review',
      hs_code_confidence: 98,
      manufacturing_location: 'Tijuana, Mexico',
      component_origins: [
        {
          origin_country: 'CN',
          value_percentage: 60,
          description: 'Semiconductor chips and processors',
          hs_code: '8542.31.00',
          usmca_qualification: {
            qualifies: false,
            reason: 'Made in China - exceeds allowable non-USMCA content'
          }
        },
        {
          origin_country: 'MX',
          value_percentage: 25,
          description: 'Assembly and packaging',
          hs_code: '8517.12.00',
          usmca_qualification: {
            qualifies: true,
            reason: 'Assembled in Mexico with substantial transformation'
          }
        },
        {
          origin_country: 'US',
          value_percentage: 15,
          description: 'Software and design components',
          hs_code: '8523.49.40',
          usmca_qualification: {
            qualifies: true,
            reason: 'US intellectual property and design'
          }
        }
      ],
      qualification_status: 'NOT QUALIFIED',
      north_american_content: 40,
      qualification_analysis: {
        current_status: 'Does not meet USMCA requirements',
        risk_factors: ['Excessive China content (60%) prevents USMCA qualification']
      }
    },

    service_details: {
      product_description: 'Wireless communication devices including smartphones, tablets, and networking equipment',
      current_hs_code: '8517.12.00',
      component_count: 8,
      qualification_status: 'NOT QUALIFIED - needs sourcing changes'
    }
  },

  {
    id: 'CR003',
    service_type: 'HS Classification',
    company_name: 'IndustrialParts Ltd',
    contact_name: 'David Kim',
    email: 'david.kim@industrialparts.com',
    phone: '+1-312-555-0167',
    industry: 'Industrial Equipment',
    trade_volume: 2100000,
    status: 'pending',
    assigned_to: 'Cristina',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago

    service_details: {
      product_description: 'Specialized industrial pumps with electronic control systems',
      current_hs_code: 'Needs Classification',
      product_specifications: 'Centrifugal pumps, 50-500 GPM capacity, with integrated IoT monitoring',
      classification_urgency: 'High - customs audit pending'
    }
  }
];

// Sample data for Jorge's Mexico services
const jorgeServiceRequests = [
  {
    id: 'JR001',
    service_type: 'Supplier Sourcing',
    company_name: 'MedDevice Solutions',
    contact_name: 'Lisa Martinez',
    email: 'lisa.martinez@meddevice.com',
    phone: '+1-858-555-0145',
    industry: 'Medical Device Manufacturing',
    trade_volume: 12000000,
    status: 'pending',
    assigned_to: 'Jorge',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),

    service_details: {
      product_description: 'Medical diagnostic equipment and surgical instruments',
      current_suppliers: 'Germany (40%), China (35%), USA (25%)',
      sourcing_goals: 'Diversify supply chain and achieve USMCA compliance',
      volume_requirements: '$12M annually',
      quality_standards: 'ISO 13485, FDA approved facilities'
    }
  },

  {
    id: 'JR002',
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
      current_location: 'Portland, Oregon',
      consideration_factors: 'Lower labor costs, USMCA benefits, supply chain proximity',
      investment_budget: '$5-10M for initial setup'
    }
  },

  {
    id: 'JR003',
    service_type: 'Market Entry',
    company_name: 'ConsumerGoods Plus',
    contact_name: 'Maria Gonzalez',
    email: 'maria.gonzalez@consumergoods.com',
    phone: '+1-713-555-0134',
    industry: 'Consumer Products',
    trade_volume: 6800000,
    status: 'pending',
    assigned_to: 'Jorge',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),

    service_details: {
      product_description: 'Home appliances and kitchen equipment',
      target_markets: 'Mexico, Central America',
      market_entry_goals: 'Establish distribution network, local partnerships',
      timeline: '6-12 months for initial market entry'
    }
  }
];

async function populateDatabase() {
  console.log('🚀 Starting database population...');

  try {
    // Clear existing sample data (optional)
    console.log('🧹 Clearing existing sample data...');
    await supabase
      .from('service_requests')
      .delete()
      .in('id', [...cristinaServiceRequests.map(r => r.id), ...jorgeServiceRequests.map(r => r.id)]);

    // Insert Cristina's service requests
    console.log('📜 Adding Cristina\'s service requests...');
    const { data: cristinaData, error: cristinaError } = await supabase
      .from('service_requests')
      .insert(cristinaServiceRequests);

    if (cristinaError) {
      console.error('❌ Error inserting Cristina requests:', cristinaError);
    } else {
      console.log(`✅ Added ${cristinaServiceRequests.length} requests for Cristina`);
    }

    // Insert Jorge's service requests
    console.log('🏭 Adding Jorge\'s service requests...');
    const { data: jorgeData, error: jorgeError } = await supabase
      .from('service_requests')
      .insert(jorgeServiceRequests);

    if (jorgeError) {
      console.error('❌ Error inserting Jorge requests:', jorgeError);
    } else {
      console.log(`✅ Added ${jorgeServiceRequests.length} requests for Jorge`);
    }

    // Verify insertion
    const { data: allData, error: verifyError } = await supabase
      .from('service_requests')
      .select('id, service_type, company_name, assigned_to')
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError);
    } else {
      console.log('\n📊 Database Contents:');
      allData.forEach(req => {
        console.log(`  ${req.id}: ${req.service_type} - ${req.company_name} (${req.assigned_to})`);
      });
    }

    console.log('\n🎉 Database population completed successfully!');
    console.log('\n🔗 Now you can test:');
    console.log('  • Cristina Dashboard: http://localhost:3000/admin/broker-dashboard');
    console.log('  • Jorge Dashboard: http://localhost:3000/admin/jorge-dashboard');

  } catch (error) {
    console.error('❌ Database population failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  populateDatabase();
}

module.exports = { populateDatabase, cristinaServiceRequests, jorgeServiceRequests };