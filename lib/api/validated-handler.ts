/**
 * VALIDATED API HANDLER
 *
 * Wraps API endpoints to automatically validate request and response data
 * against data contracts. Ensures invalid data cannot enter or leave the system.
 *
 * Usage:
 * ```typescript
 * import { createValidatedHandler } from '@/lib/api/validated-handler';
 *
 * export default createValidatedHandler({
 *   validationSchema: {
 *     requestFields: ['user_profile'],
 *     responseContract: 'PersonalizedAlert[]'
 *   },
 *   handler: async (req, res) => {
 *     // Your handler code - request is pre-validated
 *     const { user_profile } = req.body;
 *
 *     // Validate response before returning
 *     return {
 *       success: true,
 *       alerts: alerts  // Will be validated before sending
 *     };
 *   }
 * });
 * ```
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  validateComponentOrigin,
  validateComponentsArray,
  validateTradeVolume,
  validateCompanyInformation,
  validateTariffRatesCache,
  validateWorkflowSession,
  reportValidationErrors,
  validateAndNormalizeComponents
} from '../validation/data-contract-validator';
import { DevIssue } from '../utils/logDevIssue';

interface ValidationSchema {
  /** Fields in request.body that should be validated */
  requestFields?: string[];

  /** Type of validation for each field */
  fieldValidators?: Record<string, (value: unknown, context: string) => ValidationResult>;

  /** Should handler wait for validation or fail fast? */
  failFast?: boolean;

  /** Log validation warnings? (default: true) */
  logWarnings?: boolean;

  /** Log validation errors to admin? (default: true) */
  logToAdmin?: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalized?: any;
}

/**
 * Create a validated API handler that enforces data contracts
 */
export function createValidatedHandler(
  schema: ValidationSchema,
  handler: (req: NextApiRequest, res: NextApiResponse, validated: Record<string, any>) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];
    const normalizedData: Record<string, any> = {};

    try {
      // Validate request fields
      if (schema.requestFields && schema.requestFields.length > 0) {
        for (const field of schema.requestFields) {
          const value = req.body?.[field];

          // Use custom validator if provided
          if (schema.fieldValidators?.[field]) {
            const result = schema.fieldValidators[field](value, `request.body.${field}`);
            if (!result.valid) {
              validationErrors.push(...result.errors);
              if (!schema.failFast) {
                validationWarnings.push(...result.warnings);
                normalizedData[field] = result.normalized || value;
              } else {
                break;
              }
            } else {
              validationWarnings.push(...result.warnings);
              normalizedData[field] = result.normalized || value;
            }
          } else {
            // Auto-detect validation based on field name
            let result;

            if (field === 'user_profile' || field === 'profile') {
              result = validateCompanyInformation(value?.company || value, `request.body.${field}.company`);
            } else if (field === 'component') {
              result = validateComponentOrigin(value, `request.body.${field}`);
            } else if (field === 'components' || field === 'component_origins') {
              result = validateComponentsArray(value, `request.body.${field}`);
            } else if (field === 'trade_volume') {
              result = validateTradeVolume(value, `request.body.${field}`);
            } else {
              // No auto-detection for this field - just pass through
              normalizedData[field] = value;
              continue;
            }

            if (!result.valid) {
              validationErrors.push(...result.errors);
              if (schema.failFast) break;
            } else {
              validationWarnings.push(...result.warnings);
              normalizedData[field] = result.normalized || value;
            }
          }
        }
      }

      // If there are errors and failFast is true, return error
      if (validationErrors.length > 0 && schema.failFast !== false) {
        const errorMsg = `Data contract validation failed: ${validationErrors.join('; ')}`;

        if (schema.logToAdmin !== false) {
          await DevIssue.validationError(
            'api_request_validation',
            errorMsg,
            {
              endpoint: req.url,
              method: req.method,
              errors: validationErrors,
              warnings: validationWarnings,
              receivedFields: Object.keys(req.body || {})
            }
          );
        }

        return res.status(400).json({
          success: false,
          message: 'Request data validation failed',
          errors: validationErrors,
          details: 'Invalid or missing required fields in request'
        });
      }

      // Log warnings
      if (validationWarnings.length > 0 && schema.logWarnings !== false) {
        console.warn(`⚠️ Data Contract Warnings in ${req.url}:`, validationWarnings);
      }

      // Call handler with validated data
      await handler(req, res, normalizedData);
    } catch (error) {
      console.error('❌ Error in validated handler:', error);

      if (schema.logToAdmin !== false) {
        await DevIssue.apiError(
          'validated_handler',
          req.url || '/api/unknown',
          error as Error,
          {
            endpoint: req.url,
            method: req.method,
            validationErrors,
            validationWarnings
          }
        );
      }

      return res.status(500).json({
        success: false,
        message: 'Server error during request handling',
        error: (error as Error).message
      });
    }
  };
}

/**
 * Validate response data before returning from API
 *
 * Usage in handler:
 * ```typescript
 * const alerts = [...];
 * const validated = validateResponseData('PersonalizedAlert[]', alerts);
 * if (!validated.valid) {
 *   return res.status(500).json({ error: 'Response validation failed' });
 * }
 * return res.status(200).json({ alerts: validated.normalized });
 * ```
 */
export async function validateResponseData(
  dataType: string,
  data: unknown,
  context = 'API Response'
): Promise<ValidationResult> {
  if (dataType === 'ComponentOrigin') {
    return validateComponentOrigin(data, context);
  } else if (dataType === 'ComponentOrigin[]') {
    return validateComponentsArray(data, context);
  } else if (dataType === 'TariffRatesCache') {
    return validateTariffRatesCache(data, context);
  } else if (dataType === 'WorkflowSession') {
    return validateWorkflowSession(data, context);
  } else {
    // For unknown types, just pass through
    return {
      valid: true,
      errors: [],
      warnings: [`Unknown response type "${dataType}" - skipping validation`],
      normalized: data
    };
  }
}

/**
 * Quick validation for common patterns
 */

export function validateComponentsForDisplay(components: unknown) {
  const { components: validated, errors } = validateAndNormalizeComponents(components, 'Display');

  if (errors.length > 0) {
    console.error('❌ Component validation failed:', errors);
    return {
      valid: false,
      components: [],
      errors
    };
  }

  return {
    valid: true,
    components: validated,
    errors: []
  };
}

/**
 * Middleware for Next.js API routes that auto-validates common patterns
 */
export function withDataValidation(
  handler: (req: NextApiRequest, res: NextApiResponse, validated: Record<string, any>) => Promise<void>
) {
  return createValidatedHandler(
    {
      requestFields: ['user_profile', 'components', 'component_origins', 'trade_volume'],
      failFast: false,
      logWarnings: true,
      logToAdmin: true
    },
    handler
  );
}

/**
 * Type-safe response builder
 *
 * Usage:
 * ```typescript
 * const response = new ApiResponse(res);
 * response.success(200, { alerts: [...] });
 * // OR
 * response.error(400, 'Validation failed', validationErrors);
 * ```
 */
export class ApiResponse {
  constructor(private res: NextApiResponse) {}

  success(statusCode: number, data: Record<string, any>) {
    return this.res.status(statusCode).json({
      success: true,
      ...data
    });
  }

  error(statusCode: number, message: string, details?: Record<string, any>) {
    return this.res.status(statusCode).json({
      success: false,
      message,
      ...details
    });
  }

  validationError(errors: string[]) {
    return this.res.status(400).json({
      success: false,
      message: 'Data validation failed',
      errors,
      details: 'One or more fields do not meet data contract requirements'
    });
  }

  serverError(message: string, error?: Error) {
    return this.res.status(500).json({
      success: false,
      message,
      error: error?.message || 'Unknown error'
    });
  }
}

/**
 * Extension to DevIssue for logging validation errors
 */
declare global {
  namespace NodeJS {
    interface Global {
      DevIssue: {
        validationError: (
          component: string,
          message: string,
          context: Record<string, any>
        ) => Promise<void>;
      };
    }
  }
}

export default {
  createValidatedHandler,
  validateResponseData,
  validateComponentsForDisplay,
  withDataValidation,
  ApiResponse
};
