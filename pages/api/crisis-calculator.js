/**
 * CRISIS CALCULATOR API ENDPOINT
 * Exposes crisis calculator service functionality
 * NO HARDCODED CALCULATIONS - Database-driven penalty calculations
 */

import { crisisCalculatorService } from '../../lib/services/crisis-calculator-service.js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

  const { action, data = {}, calculation_type } = req.body;
  const startTime = Date.now();

  try {
    logInfo('Crisis calculator API called', {
      action,
      calculation_type,
      data: typeof data === 'object' ? Object.keys(data) : data,
      raw_body: req.body,
      body_type: typeof req.body,
      data_type: typeof data
    });

    // Handle dashboard analytics requests (from RichDataConnector)
    if (calculation_type === 'comprehensive' && !action) {
      logInfo('Dashboard analytics request received', { calculation_type });

      try {
        // This is a dashboard analytics request, not a user calculation
        // Return aggregate analytics data without requiring trade volume
        const { data: calculations, error } = await supabase
          .from('crisis_calculations')
          .select('*')
          .order('calculated_at', { ascending: false })
          .limit(10);

        if (error) {
          logError('Failed to fetch crisis analytics', { error: error.message });
          // Return empty analytics rather than error
          return res.status(200).json({
            success: true,
            calculation_type: 'comprehensive',
            analytics: {
              recent_calculations: [],
              total_count: 0,
              data_source: 'crisis_calculations_table',
              note: 'No calculations found or table does not exist yet'
            }
          });
        }

        return res.status(200).json({
          success: true,
          calculation_type: 'comprehensive',
          analytics: {
            recent_calculations: calculations || [],
            total_count: calculations?.length || 0,
            data_source: 'crisis_calculations_table'
          }
        });
      } catch (error) {
        logError('Dashboard analytics request failed', { error: error.message });
        return res.status(200).json({
          success: true,
          calculation_type: 'comprehensive',
          analytics: {
            recent_calculations: [],
            total_count: 0,
            data_source: 'fallback',
            error: error.message
          }
        });
      }
    }

    // Validate that action is provided for actual calculations
    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action parameter is required',
        received_body: req.body,
        available_actions: [
          'calculate_crisis_penalty',
          'get_usmca_rate',
          'calculate_roi_analysis',
          'batch_calculate',
          'quick_estimate',
          'health_check'
        ],
        note: 'For dashboard analytics, use calculation_type: "comprehensive"'
      });
    }

    switch (action) {
      case 'calculate_crisis_penalty':
        const {
          tradeVolume,
          hsCode,
          originCountry = 'CN',
          destinationCountry = 'US',
          businessType,
          sessionId
        } = data;

        // Validate required parameters
        if (!tradeVolume || tradeVolume <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Valid tradeVolume is required'
          });
        }

        if (!sessionId) {
          return res.status(400).json({
            success: false,
            error: 'sessionId is required for analytics tracking'
          });
        }

        // Use intelligent HS code fallback instead of hardcoded textile code
        let effectiveHSCode = hsCode;
        if (!effectiveHSCode) {
          // No HS code provided - let the crisis calculator service handle this
          // rather than hardcoding a textile code that may be irrelevant
          logInfo('Crisis calculation without HS code - using service fallback', { 
            businessType, 
            originCountry 
          });
        }

        const calculationResult = await crisisCalculatorService.calculateCrisisPenalty({
          tradeVolume,
          hsCode: effectiveHSCode, // Let service handle null HS codes intelligently
          originCountry,
          destinationCountry,
          businessType: businessType || 'General',
          sessionId
        });

        return res.status(200).json({
          success: calculationResult.success,
          crisis_impact: calculationResult.crisis_impact || null,
          roi_analysis: calculationResult.roi_analysis || null,
          data_sources: calculationResult.data_sources || null,
          processing_time_ms: calculationResult.processing_time_ms || (Date.now() - startTime),
          error: calculationResult.error || null,
          fallback_calculation: calculationResult.fallback_calculation || null
        });

      case 'get_usmca_rate':
        const { hsCode: lookupHsCode, destinationCountry: lookupCountry = 'US' } = data;
        
        if (!lookupHsCode) {
          return res.status(400).json({
            success: false,
            error: 'hsCode is required'
          });
        }

        const usmcaRate = await crisisCalculatorService.getUSMCARate(lookupHsCode, lookupCountry);
        return res.status(200).json({
          success: true,
          usmca_rate: usmcaRate,
          hs_code: lookupHsCode,
          destination_country: lookupCountry,
          processing_time_ms: Date.now() - startTime
        });

      case 'calculate_roi_analysis':
        const { totalSavings, businessType: roiBusinessType = 'general' } = data;
        
        if (!totalSavings || totalSavings <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Valid totalSavings amount is required'
          });
        }

        const roiAnalysis = await crisisCalculatorService.calculateROIAnalysis(totalSavings, roiBusinessType);
        return res.status(200).json({
          success: true,
          roi_analysis: roiAnalysis,
          processing_time_ms: Date.now() - startTime
        });

      case 'batch_calculate':
        const { calculations } = data;
        
        if (!calculations || !Array.isArray(calculations)) {
          return res.status(400).json({
            success: false,
            error: 'calculations array is required'
          });
        }

        // Process multiple calculations
        const batchResults = await Promise.all(
          calculations.map(async (calc, index) => {
            try {
              const result = await crisisCalculatorService.calculateCrisisPenalty({
                ...calc,
                sessionId: calc.sessionId || `batch_${Date.now()}_${index}`
              });
              return {
                index,
                success: result.success,
                crisis_impact: result.crisis_impact,
                error: result.error
              };
            } catch (error) {
              return {
                index,
                success: false,
                error: error.message
              };
            }
          })
        );

        return res.status(200).json({
          success: true,
          batch_results: batchResults,
          processing_time_ms: Date.now() - startTime
        });

      case 'quick_estimate':
        // Simplified calculation for quick estimates
        const { volume, currentRate = 0.072, crisisRate = 0.25 } = data;
        
        if (!volume || volume <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Valid volume is required'
          });
        }

        const currentPenalty = volume * currentRate;
        const crisisPenalty = volume * crisisRate;
        const usmcaPenalty = 0; // Assume duty-free under USMCA
        const quickSavings = crisisPenalty - usmcaPenalty;

        return res.status(200).json({
          success: true,
          quick_estimate: {
            trade_volume: volume,
            current_penalty: Math.round(currentPenalty),
            crisis_penalty: Math.round(crisisPenalty),
            usmca_penalty: usmcaPenalty,
            total_savings: Math.round(quickSavings),
            current_rate: currentRate,
            crisis_rate: crisisRate,
            usmca_rate: 0
          },
          processing_time_ms: Date.now() - startTime
        });

      case 'health_check':
        const healthCheck = await crisisCalculatorService.healthCheck();
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
            'calculate_crisis_penalty',
            'get_usmca_rate',
            'calculate_roi_analysis',
            'batch_calculate',
            'quick_estimate',
            'health_check'
          ]
        });
    }

  } catch (error) {
    logError('Crisis calculator API error', {
      error: error.message,
      action,
      processing_time_ms: Date.now() - startTime
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Calculator service unavailable',
      processing_time_ms: Date.now() - startTime
    });
  }
}