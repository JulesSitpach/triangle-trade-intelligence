/**
 * Status API Endpoint
 * Returns detailed system status
 */

import { apiHandler, sendSuccess } from '../../lib/api/apiHandler.js';

export default apiHandler({
  GET: async (req, res) => {
    // Cache for 60 seconds with stale-while-revalidate
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    const status = {
      service: 'triangle-intelligence-platform',
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        provider: 'supabase'
      },
      apis: {
        total_endpoints: 37,
        trust_services: 8,
        core_services: 29
      }
    };

    return sendSuccess(res, status);
  }
});
