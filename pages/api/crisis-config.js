/**
 * CRISIS CONFIGURATION API ENDPOINT
 * Exposes crisis configuration service functionality
 * NO HARDCODED VALUES - Database-driven configuration
 */

import { crisisConfigService } from '../../lib/services/crisis-config-service.js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed_methods: ['POST']
    });
  }

  const { action, data = {} } = req.body;
  const startTime = Date.now();

  try {
    logInfo('Crisis config API called', { action, data: Object.keys(data) });

    switch (action) {
      case 'get_crisis_rate':
        const crisisRate = await crisisConfigService.getCrisisRate(data.rateKey || 'trump_tariff_rate');
        return res.status(200).json({
          success: true,
          crisis_rate: crisisRate,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_all_config':
        const allConfig = await crisisConfigService.getAllCrisisConfig();
        return res.status(200).json({
          success: true,
          config: allConfig,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_validation_thresholds':
        const thresholds = await crisisConfigService.getValidationThresholds();
        return res.status(200).json({
          success: true,
          thresholds: thresholds,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_roi_params':
        const roiParams = await crisisConfigService.getROIParams();
        return res.status(200).json({
          success: true,
          roi_params: roiParams,
          processing_time_ms: Date.now() - startTime
        });

      case 'update_config':
        if (!data.configKey || !data.configValue) {
          return res.status(400).json({
            success: false,
            error: 'configKey and configValue are required'
          });
        }
        
        const updateResult = await crisisConfigService.updateConfig(
          data.configKey,
          data.configValue,
          data.configType || 'rates'
        );
        
        return res.status(200).json({
          success: updateResult.success,
          ...updateResult,
          processing_time_ms: Date.now() - startTime
        });

      case 'health_check':
        const healthCheck = await crisisConfigService.healthCheck();
        return res.status(200).json({
          success: true,
          health: healthCheck,
          processing_time_ms: Date.now() - startTime
        });

      default:
        return res.status(400).json({
          success: false,
          error: 'Unknown action',
          available_actions: [
            'get_crisis_rate',
            'get_all_config', 
            'get_validation_thresholds',
            'get_roi_params',
            'update_config',
            'health_check'
          ]
        });
    }

  } catch (error) {
    logError('Crisis config API error', {
      error: error.message,
      action,
      processing_time_ms: Date.now() - startTime
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Configuration service unavailable',
      processing_time_ms: Date.now() - startTime
    });
  }
}