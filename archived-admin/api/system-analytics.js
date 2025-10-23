/**
 * ADMIN API: System Analytics
 * GET /api/admin/system-analytics - Returns system performance analytics
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetSystemAnalytics(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetSystemAnalytics(req, res) {
  try {
    // Return basic system analytics
    const analytics = {
      uptime: Math.floor(process.uptime()),
      memory_usage: process.memoryUsage(),
      platform: process.platform,
      node_version: process.version,
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      analytics: analytics,
      data_status: {
        source: 'system_metrics',
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching system analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system analytics',
      message: error.message
    });
  }
}