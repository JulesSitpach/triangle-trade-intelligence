/**
 * SAMPLE DATA SEEDER
 * Populates the database with sample data for testing
 * This will make the dashboards show actual content
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedSampleData() {
  console.log('🌱 Seeding sample data for Triangle Intelligence...\n');

  try {
    // 1. Create sample users
    console.log('Creating sample users...');
    const users = [
      {
        email: 'john.smith@autoparts.com',
        full_name: 'John Smith',
        company_name: 'AutoParts Manufacturing Inc',
        subscription_tier: 'professional',
        subscription_status: 'active',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_login: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        workflows_completed: 45,
        certificates_generated: 38,
        total_savings_calculated: 2450000
      },
      {
        email: 'maria.garcia@electronics.mx',
        full_name: 'Maria Garcia',
        company_name: 'Electronics Mexico SA',
        subscription_tier: 'enterprise',
        subscription_status: 'active',
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        last_login: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        workflows_completed: 156,
        certificates_generated: 142,
        total_savings_calculated: 8750000
      },
      {
        email: 'david.chen@wiretech.ca',
        full_name: 'David Chen',
        company_name: 'WireTech Solutions',
        subscription_tier: 'professional',
        subscription_status: 'trial',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        last_login: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        workflows_completed: 8,
        certificates_generated: 5,
        total_savings_calculated: 125000
      },
      {
        email: 'sarah.johnson@textiles.com',
        full_name: 'Sarah Johnson',
        company_name: 'Premium Textiles USA',
        subscription_tier: 'basic',
        subscription_status: 'expired',
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        last_login: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        workflows_completed: 12,
        certificates_generated: 10,
        total_savings_calculated: 340000
      },
      {
        email: 'carlos.rodriguez@steelworks.mx',
        full_name: 'Carlos Rodriguez',
        company_name: 'SteelWorks Internacional',
        subscription_tier: 'enterprise',
        subscription_status: 'active',
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        last_login: new Date().toISOString(),
        workflows_completed: 234,
        certificates_generated: 198,
        total_savings_calculated: 15600000
      }
    ];

    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert(users, { onConflict: 'email' })
      .select();

    if (userError) {
      console.log('Note: Users table might not exist or have different schema');
      console.log('Continuing with other data...\n');
    } else {
      console.log(`✅ Created ${users.length} sample users\n`);
    }

    // 2. Create sample suppliers
    console.log('Creating sample suppliers...');
    const suppliers = [
      {
        name: 'Mexico Wire Solutions',
        location: 'Tijuana, Mexico',
        hs_codes_supported: ['8544', '8536', '8537'],
        risk_level: 'low',
        compliance_score: 98,
        active: true,
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Canadian Auto Parts Ltd',
        location: 'Toronto, Canada',
        hs_codes_supported: ['8708', '8409', '8483'],
        risk_level: 'low',
        compliance_score: 95,
        active: true,
        created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Electronics Manufacturing SA',
        location: 'Guadalajara, Mexico',
        hs_codes_supported: ['8541', '8542', '8543'],
        risk_level: 'medium',
        compliance_score: 88,
        active: true,
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Textile Innovations Inc',
        location: 'Monterrey, Mexico',
        hs_codes_supported: ['5208', '5209', '5407'],
        risk_level: 'low',
        compliance_score: 92,
        active: true,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Steel Components MX',
        location: 'Mexico City, Mexico',
        hs_codes_supported: ['7208', '7209', '7210'],
        risk_level: 'high',
        compliance_score: 78,
        active: false,
        created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: supplierData, error: supplierError } = await supabase
      .from('suppliers')
      .upsert(suppliers, { onConflict: 'name' })
      .select();

    if (supplierError) {
      console.log('Note: Suppliers table might not exist or have different schema');
      console.log('Continuing with other data...\n');
    } else {
      console.log(`✅ Created ${suppliers.length} sample suppliers\n`);
    }

    // 3. Create sample RSS feeds
    console.log('Creating sample RSS feeds...');
    const rssFeeds = [
      {
        name: 'USTR Trade Policy Updates',
        url: 'https://ustr.gov/rss/trade-policy.xml',
        status: 'active',
        priority: 'high',
        last_check: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        items_found: 12,
        crisis_alerts_triggered: 2,
        automated_response_triggered: true,
        user_notifications_sent: 45
      },
      {
        name: 'CBP Tariff Announcements',
        url: 'https://cbp.gov/rss/tariffs.xml',
        status: 'active',
        priority: 'high',
        last_check: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        items_found: 8,
        crisis_alerts_triggered: 1,
        automated_response_triggered: false,
        user_notifications_sent: 23
      },
      {
        name: 'Mexico Trade Ministry',
        url: 'https://economia.gob.mx/rss/trade.xml',
        status: 'active',
        priority: 'medium',
        last_check: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        items_found: 5,
        crisis_alerts_triggered: 0,
        automated_response_triggered: false,
        user_notifications_sent: 0
      },
      {
        name: 'Canada Trade Updates',
        url: 'https://international.gc.ca/rss/trade.xml',
        status: 'checking',
        priority: 'medium',
        last_check: new Date().toISOString(),
        items_found: 0,
        crisis_alerts_triggered: 0,
        automated_response_triggered: false,
        user_notifications_sent: 0
      },
      {
        name: 'Industry Trade News',
        url: 'https://tradenews.com/rss/usmca.xml',
        status: 'active',
        priority: 'low',
        last_check: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        items_found: 15,
        crisis_alerts_triggered: 0,
        automated_response_triggered: false,
        user_notifications_sent: 5
      }
    ];

    const { data: rssData, error: rssError } = await supabase
      .from('rss_feeds')
      .upsert(rssFeeds, { onConflict: 'url' })
      .select();

    if (rssError) {
      console.log('Note: RSS feeds table might not exist or have different schema');
      console.log('Continuing with other data...\n');
    } else {
      console.log(`✅ Created ${rssFeeds.length} sample RSS feeds\n`);
    }

    // 4. Create sample workflow analytics
    console.log('Creating sample workflow analytics...');
    const workflows = [];
    const now = Date.now();
    
    // Generate 30 days of workflow data
    for (let i = 0; i < 30; i++) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Fewer workflows on weekends
      const workflowCount = isWeekend ? 
        Math.floor(Math.random() * 5) + 2 : 
        Math.floor(Math.random() * 15) + 8;
      
      for (let j = 0; j < workflowCount; j++) {
        workflows.push({
          user_email: users[Math.floor(Math.random() * users.length)].email,
          started_at: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
          hs_code: ['8544429000', '8708999500', '8536909000', '7208390000'][Math.floor(Math.random() * 4)],
          qualified: Math.random() > 0.3,
          savings_calculated: Math.floor(Math.random() * 500000) + 10000,
          certificate_generated: Math.random() > 0.2,
          workflow_type: 'usmca_compliance'
        });
      }
    }

    const { data: workflowData, error: workflowError } = await supabase
      .from('workflow_analytics')
      .insert(workflows)
      .select();

    if (workflowError) {
      console.log('Note: Workflow analytics table might not exist or have different schema');
      console.log('Continuing...\n');
    } else {
      console.log(`✅ Created ${workflows.length} sample workflow records\n`);
    }

    // 5. Create sample crisis alerts
    console.log('Creating sample crisis alerts...');
    const alerts = [
      {
        title: 'New Automotive Tariffs Announced',
        description: 'USTR announces 10% additional tariffs on automotive electrical components from non-USMCA countries',
        type: 'tariff_change',
        severity: 'high',
        affected_hs_codes: ['8544', '8536', '8708'],
        automated_response: true,
        notifications_sent: 45,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'USMCA Certificate Requirements Update',
        description: 'CBP updates documentation requirements for USMCA certificates effective next month',
        type: 'compliance_change',
        severity: 'medium',
        affected_hs_codes: ['all'],
        automated_response: true,
        notifications_sent: 128,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Steel Products Under Review',
        description: 'Commerce Department initiating review of steel product classifications',
        type: 'classification_review',
        severity: 'low',
        affected_hs_codes: ['7208', '7209', '7210'],
        automated_response: false,
        notifications_sent: 12,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: alertData, error: alertError } = await supabase
      .from('crisis_alerts')
      .upsert(alerts, { onConflict: 'title' })
      .select();

    if (alertError) {
      console.log('Note: Crisis alerts table might not exist or have different schema');
      console.log('Continuing...\n');
    } else {
      console.log(`✅ Created ${alerts.length} sample crisis alerts\n`);
    }

    console.log('=' . repeat(60));
    console.log('✨ Sample data seeding complete!');
    console.log('Your dashboards should now display actual data.');
    console.log('=' . repeat(60));

  } catch (error) {
    console.error('Error seeding data:', error);
    console.log('\nNote: Some tables might not exist in your database.');
    console.log('The application will still work with the tables that do exist.');
  }
}

// Run the seeder
if (require.main === module) {
  seedSampleData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { seedSampleData };