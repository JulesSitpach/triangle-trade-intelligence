/**
 * PROFESSIONAL VALIDATION API ENDPOINT
 * Exposes professional validation service functionality
 * NO HARDCODED VALIDATORS - Database-driven professional validation
 */

import { professionalValidationService } from '../../lib/services/professional-validation-service.js';
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
    logInfo('Professional validation API called', { action, data: Object.keys(data) });

    switch (action) {
      case 'get_active_validators':
        const { specialization, availableForEmergency = false } = data;
        
        const validators = await professionalValidationService.getActiveValidators(
          specialization,
          availableForEmergency
        );
        
        return res.status(200).json({
          success: true,
          validators: validators,
          count: validators.length,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_primary_validator':
        const primaryValidator = await professionalValidationService.getPrimaryValidator();
        
        return res.status(200).json({
          success: !!primaryValidator,
          validator: primaryValidator,
          processing_time_ms: Date.now() - startTime
        });

      case 'request_validation':
        const validationRequest = {
          requestType: data.requestType,
          clientCompany: data.clientCompany,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone,
          urgencyLevel: data.urgencyLevel || 'normal',
          tradeVolume: data.tradeVolume,
          hsCodes: data.hsCodes || [],
          caseDescription: data.caseDescription,
          requestedValidatorId: data.requestedValidatorId,
          internalNotes: data.internalNotes || '',
          deadlineDate: data.deadlineDate
        };

        // Validate required fields
        if (!validationRequest.requestType) {
          return res.status(400).json({
            success: false,
            error: 'requestType is required'
          });
        }

        if (!validationRequest.clientCompany || !validationRequest.clientEmail) {
          return res.status(400).json({
            success: false,
            error: 'clientCompany and clientEmail are required'
          });
        }

        const requestResult = await professionalValidationService.requestValidation(validationRequest);
        
        return res.status(200).json({
          success: requestResult.success,
          request_id: requestResult.request_id || null,
          assigned_validator: requestResult.assigned_validator || null,
          estimation: requestResult.estimation || null,
          next_steps: requestResult.next_steps || [],
          status: requestResult.status || 'error',
          error: requestResult.error || null,
          fallback_recommendation: requestResult.fallback_recommendation || null,
          processing_time_ms: Date.now() - startTime
        });

      case 'update_validation_status':
        const { requestId, status, updates = {} } = data;
        
        if (!requestId || !status) {
          return res.status(400).json({
            success: false,
            error: 'requestId and status are required'
          });
        }

        const updateResult = await professionalValidationService.updateValidationStatus(
          requestId,
          status,
          updates
        );
        
        return res.status(200).json({
          success: updateResult.success,
          data: updateResult.data || null,
          error: updateResult.error || null,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_validation_status':
        const { requestId: statusRequestId } = data;
        
        if (!statusRequestId) {
          return res.status(400).json({
            success: false,
            error: 'requestId is required'
          });
        }

        const statusResult = await professionalValidationService.getValidationStatus(statusRequestId);
        
        return res.status(200).json({
          success: statusResult.success,
          request: statusResult.request || null,
          validator_info: statusResult.validator_info || null,
          error: statusResult.error || null,
          processing_time_ms: Date.now() - startTime
        });

      case 'estimate_validation_work':
        const {
          requestType: estimateRequestType,
          tradeVolume: estimateTradeVolume,
          hsCodes: estimateHsCodes = [],
          caseDescription: estimateCaseDescription
        } = data;
        
        if (!estimateRequestType) {
          return res.status(400).json({
            success: false,
            error: 'requestType is required for estimation'
          });
        }

        if (!estimateTradeVolume || estimateTradeVolume <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Valid tradeVolume is required for estimation'
          });
        }

        const estimationResult = await professionalValidationService.estimateValidationWork({
          requestType: estimateRequestType,
          tradeVolume: estimateTradeVolume,
          hsCodes: estimateHsCodes,
          caseComplexity: professionalValidationService.assessCaseComplexity(
            estimateCaseDescription,
            estimateHsCodes.length
          )
        });
        
        return res.status(200).json({
          success: true,
          estimation: estimationResult,
          processing_time_ms: Date.now() - startTime
        });

      case 'book_emergency_consultation':
        // Simplified emergency consultation booking
        const {
          clientCompany: emergencyCompany,
          clientEmail: emergencyEmail,
          clientPhone: emergencyPhone,
          urgentIssue,
          tradeVolume: emergencyVolume
        } = data;
        
        if (!emergencyCompany || !emergencyEmail || !urgentIssue) {
          return res.status(400).json({
            success: false,
            error: 'clientCompany, clientEmail, and urgentIssue are required'
          });
        }

        const emergencyRequest = {
          requestType: 'emergency_consultation',
          clientCompany: emergencyCompany,
          clientEmail: emergencyEmail,
          clientPhone: emergencyPhone,
          urgencyLevel: 'emergency',
          tradeVolume: emergencyVolume,
          caseDescription: urgentIssue,
          hsCodes: []
        };

        const emergencyResult = await professionalValidationService.requestValidation(emergencyRequest);
        
        return res.status(200).json({
          success: emergencyResult.success,
          emergency_booking: {
            request_id: emergencyResult.request_id,
            assigned_validator: emergencyResult.assigned_validator,
            estimated_response_time: emergencyResult.assigned_validator?.response_time_hours || 4,
            hourly_rate: emergencyResult.assigned_validator?.hourly_rate || 500,
            next_steps: emergencyResult.next_steps
          },
          error: emergencyResult.error || null,
          processing_time_ms: Date.now() - startTime
        });

      case 'get_validator_specializations':
        // Get all available specializations
        const allValidators = await professionalValidationService.getActiveValidators();
        const allSpecializations = [...new Set(
          allValidators.flatMap(validator => validator.specializations || [])
        )].sort();
        
        return res.status(200).json({
          success: true,
          specializations: allSpecializations,
          validator_count: allValidators.length,
          processing_time_ms: Date.now() - startTime
        });

      case 'health_check':
        const healthCheck = await professionalValidationService.healthCheck();
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
            'get_active_validators',
            'get_primary_validator',
            'request_validation',
            'update_validation_status',
            'get_validation_status',
            'estimate_validation_work',
            'book_emergency_consultation',
            'get_validator_specializations',
            'health_check'
          ]
        });
    }

  } catch (error) {
    logError('Professional validation API error', {
      error: error.message,
      action,
      processing_time_ms: Date.now() - startTime
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Validation service unavailable',
      processing_time_ms: Date.now() - startTime
    });
  }
}