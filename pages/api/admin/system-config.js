/**
 * ADMIN API: System Configuration
 * GET /api/admin/system-config - Returns system configuration data
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetSystemConfig(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetSystemConfig(req, res) {
  try {
    // Return system configuration data
    const config = {
      environment: process.env.NODE_ENV || 'development',
      database_connected: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      features: {
        auth_enabled: true,
        admin_dashboard: true,
        api_endpoints: 54,
        rss_monitoring: true
      },
      version: '1.0.0',
      last_updated: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      config: config,
      data_status: {
        source: 'system_config',
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching system config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system config',
      message: error.message
    });
  }
}