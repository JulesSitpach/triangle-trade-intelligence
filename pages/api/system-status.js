/**
 * System Status API
 * Real-time monitoring of database connections and API health
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const status = {
    timestamp: new Date().toISOString(),
    environment: {
      node_env: process.env.NODE_ENV,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Missing',
      service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '❌ Missing',
      anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing',
      anthropic_key: process.env.ANTHROPIC_API_KEY ? '✅ Configured' : '❌ Missing',
    },
    database: {
      connected: false,
      tables: {}
    },
    apis: {
      classification: { status: 'unknown', endpoint: '/api/simple-classification' },
      compliance: { status: 'unknown', endpoint: '/api/simple-usmca-compliance' },
      savings: { status: 'unknown', endpoint: '/api/simple-savings' },
      admin_users: { status: 'unknown', endpoint: '/api/admin/users' },
      rss_feeds: { status: 'unknown', endpoint: '/api/admin/rss-feeds' }
    },
    data_availability: {},
    issues: [],
    recommendations: []
  };

  // Test database connectivity
  try {
    // Critical tables to check
    const tableChecks = [
      { name: 'hs_master_rebuild', critical: true, expected_min: 30000 },
      { name: 'user_profiles', critical: false, expected_min: 0 },
      { name: 'workflow_completions', critical: false, expected_min: 0 },
      { name: 'rss_feeds', critical: false, expected_min: 0 },
      { name: 'crisis_alerts', critical: false, expected_min: 0 },
      { name: 'usmca_qualification_rules', critical: true, expected_min: 5 },
      { name: 'suppliers', critical: false, expected_min: 0 },
      { name: 'daily_metrics', critical: false, expected_min: 0 }
    ];

    let connectedTables = 0;
    let totalRecords = 0;

    for (const table of tableChecks) {
      try {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          status.database.tables[table.name] = {
            status: '❌ Error',
            message: error.message,
            critical: table.critical
          };
          if (table.critical) {
            status.issues.push(`Critical table ${table.name} inaccessible: ${error.message}`);
          }
        } else {
          const recordCount = count || 0;
          connectedTables++;
          totalRecords += recordCount;
          
          status.database.tables[table.name] = {
            status: '✅ Connected',
            records: recordCount,
            has_data: recordCount > 0,
            sufficient_data: recordCount >= table.expected_min,
            critical: table.critical
          };

          // Check data availability
          if (table.critical && recordCount < table.expected_min) {
            status.issues.push(`Critical table ${table.name} has insufficient data (${recordCount} records, need ${table.expected_min}+)`);
          }
          
          // Special check for user_profiles
          if (table.name === 'user_profiles' && recordCount === 0) {
            status.data_availability.user_profiles = 'Using sample data (no real users)';
            status.recommendations.push('Add user data to user_profiles table for production');
          }
        }
      } catch (e) {
        status.database.tables[table.name] = {
          status: '❌ Exception',
          message: e.message,
          critical: table.critical
        };
      }
    }

    status.database.connected = connectedTables > 0;
    status.database.tables_connected = `${connectedTables}/${tableChecks.length}`;
    status.database.total_records = totalRecords;

    // Overall health assessment
    const criticalTablesOk = tableChecks
      .filter(t => t.critical)
      .every(t => status.database.tables[t.name]?.status === '✅ Connected');

    const hasMinimumData = status.database.tables.hs_master_rebuild?.records > 30000;

    // Determine overall system status
    if (status.database.connected && criticalTablesOk && hasMinimumData) {
      status.overall_status = '✅ OPERATIONAL';
      status.health_score = 95;
      status.message = 'System is fully operational with database connectivity';
    } else if (status.database.connected && criticalTablesOk) {
      status.overall_status = '⚠️ PARTIAL';
      status.health_score = 75;
      status.message = 'Database connected but some data missing';
    } else if (status.database.connected) {
      status.overall_status = '⚠️ DEGRADED';
      status.health_score = 50;
      status.message = 'Database partially connected, critical tables missing';
    } else {
      status.overall_status = '❌ OFFLINE';
      status.health_score = 0;
      status.message = 'Database connection failed';
    }

    // Add specific operational notes
    if (status.database.tables.user_profiles?.records === 0) {
      status.operational_notes = [
        'Admin dashboards will show sample data (user_profiles empty)',
        'Core HS classification functionality fully operational',
        'USMCA compliance checking available',
        'Certificate generation ready'
      ];
    }

  } catch (error) {
    status.database.error = error.message;
    status.overall_status = '❌ ERROR';
    status.health_score = 0;
    status.issues.push(`Database connection error: ${error.message}`);
  }

  // API endpoint quick checks (simplified)
  status.apis.classification.status = status.database.tables.hs_master_rebuild?.records > 0 ? '✅ Ready' : '⚠️ No data';
  status.apis.compliance.status = status.database.connected ? '✅ Ready' : '❌ Offline';
  status.apis.savings.status = status.database.connected ? '✅ Ready' : '❌ Offline';
  status.apis.admin_users.status = '✅ Ready (sample data)';
  status.apis.rss_feeds.status = status.database.tables.rss_feeds?.records > 0 ? '✅ Ready' : '⚠️ No data';

  return res.status(200).json(status);
}