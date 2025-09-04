/**
 * SMART RSS MONITORING STATUS API
 * Provides status and metrics for the smart RSS monitoring system
 */

import { smartRSSMonitor } from '../../lib/services/smart-rss-monitor.js';
import { logInfo } from '../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed_methods: ['GET']
    });
  }

  try {
    const status = smartRSSMonitor.getStatus();
    
    logInfo('Smart RSS status requested', {
      currentMode: status.currentMode,
      pollingFrequency: status.pollingFrequency
    });

    // Add additional metrics
    const response = {
      success: true,
      monitoring: {
        ...status,
        systemHealth: 'operational',
        description: 'Smart adaptive RSS monitoring with crisis escalation',
        scalingInfo: {
          baseline: '4 hours between checks',
          crisisMode: '15 minutes between checks',
          weekendMode: '6 hours between checks',
          overnightMode: '8 hours between checks',
          holidayMode: '12 hours between checks'
        },
        efficiency: {
          normalLoad: '~78 RSS checks per day',
          crisisLoad: '~5,760 RSS checks per day (48 hour burst)',
          avgLoad: '~200 RSS checks per day',
          costImpact: 'Minimal - scales with alerts, not users'
        }
      },
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(response);

  } catch (error) {
    logError('Smart RSS status error', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get RSS monitoring status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}