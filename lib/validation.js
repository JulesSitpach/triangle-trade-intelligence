/**
 * DATA VALIDATION - Zod Schemas for Runtime Validation
 * Validates data at every boundary (API, database, localStorage)
 *
 * USAGE:
 * - Import schemas and use .parse() or .safeParse()
 * - Add validation to ALL API endpoints before processing
 * - Validate data before database saves
 * - Validate data after database reads
 *
 * Generated: January 2025
 */

import { z } from 'zod';
import { logDevIssue, DevIssue } from './utils/logDevIssue.js';

// ============================================================================
// USER & AUTHENTICATION SCHEMAS
// ============================================================================

export const SubscriptionTierSchema = z.enum([
  'Trial',
  'Starter',
  'Professional',
  'Premium',
  'Enterprise'
]);

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  isAdmin: z.boolean().optional(),
  company_name: z.string().optional(),
  subscription_tier: SubscriptionTierSchema,
  created_at: z.string().optional()
});

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().optional(),
  company_name: z.string().optional(),
  subscription_tier: SubscriptionTierSchema,
  status: z.enum(['active', 'inactive', 'suspended']),
  created_at: z.string(),
  terms_accepted_at: z.string().optional(),
  privacy_accepted_at: z.string().optional(),
  email_notifications: z.boolean()
});

export const AuthResponseSchema = z.object({
  success: z.boolean(),
  authenticated: z.boolean(),
  user: UserSchema.optional(),
  error: z.string().optional()
});

// ============================================================================
// WORKFLOW DATA SCHEMAS
// ============================================================================

export const ComponentOriginSchema = z.object({
  country: z.string().min(2, 'Country is required'),
  percentage: z.number().min(0).max(100),
  value_percentage: z.number().min(0).max(100),
  component_type: z.string().min(1, 'Component type is required'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  origin_country: z.string().optional(),

  // Enrichment fields (optional)
  hs_code: z.string().optional(),
  hs_description: z.string().optional(),
  mfn_rate: z.number().min(0).max(1).optional(),
  usmca_rate: z.number().min(0).max(1).optional(),
  savings_amount: z.number().optional(),
  savings_percentage: z.number().optional(),
  ai_confidence: z.number().min(0).max(100).optional(),
  enriched: z.boolean().optional(),
  enrichment_timestamp: z.string().optional()
});

export const QualificationStatusSchema = z.enum([
  'QUALIFIED',
  'NOT_QUALIFIED',
  'PARTIAL',
  'NEEDS_REVIEW'
]);

export const WorkflowFormDataSchema = z.object({
  // Company Information (Step 1) - REQUIRED
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  business_type: z.string().min(1, 'Business type is required'),
  industry_sector: z.string().min(1, 'Industry sector is required'),
  trade_volume: z.string().min(1, 'Trade volume is required'),
  manufacturing_location: z.string().min(1, 'Manufacturing location is required'),
  supplier_country: z.string().min(2, 'Supplier country is required'),
  destination_country: z.string().optional(),

  // Certificate fields (optional)
  company_address: z.string().optional(),
  tax_id: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),

  // Product Information (Step 2) - REQUIRED
  product_description: z.string().min(10, 'Product description must be at least 10 characters'),
  component_origins: z.array(ComponentOriginSchema).min(1, 'At least one component origin is required'),

  // Classification results (populated by AI) - OPTIONAL
  classified_hs_code: z.string().optional(),
  hs_description: z.string().optional(),
  classification_confidence: z.number().min(0).max(100).optional(),

  // USMCA Results (populated by analysis) - OPTIONAL
  qualification_status: QualificationStatusSchema.optional(),
  qualification_level: z.string().optional(),
  qualification_rule: z.string().optional(),
  north_american_content: z.number().min(0).max(100).optional(),
  calculated_savings: z.number().optional(),
  current_tariff_rate: z.number().optional(),
  usmca_tariff_rate: z.number().optional(),
  monthly_savings: z.number().optional(),

  // Authorization (Step 4) - OPTIONAL
  signatory_name: z.string().optional(),
  signatory_title: z.string().optional(),
  importer_name: z.string().optional(),
  importer_address: z.string().optional(),
  importer_country: z.string().optional(),
  importer_tax_id: z.string().optional()
}).refine(
  (data) => {
    // Validate component percentages total 100%
    const total = data.component_origins.reduce(
      (sum, comp) => sum + (comp.value_percentage || comp.percentage),
      0
    );
    return Math.abs(total - 100) < 0.1;
  },
  {
    message: 'Component percentages must total 100%',
    path: ['component_origins']
  }
);

export const USMCAWorkflowResultsSchema = z.object({
  success: z.boolean(),
  method: z.string(),

  company: z.object({
    name: z.string(),
    business_type: z.string(),
    trade_volume: z.string(),
    manufacturing_location: z.string()
  }),

  product: z.object({
    description: z.string(),
    hs_code: z.string(),
    hs_description: z.string().optional()
  }),

  usmca: z.object({
    qualified: z.boolean(),
    qualification_status: QualificationStatusSchema,
    north_american_content: z.number(),
    threshold_applied: z.number(),
    component_breakdown: z.array(ComponentOriginSchema)
  }),

  savings: z.object({
    total_savings: z.number(),
    mfn_rate: z.number(),
    usmca_rate: z.number(),
    savings_percentage: z.number(),
    annual_savings: z.number()
  }),

  certificate: z.any().optional(),  // USMCACertificate schema
  recommendations: z.array(z.string()).optional(),
  trust: z.object({
    confidence_score: z.number(),
    data_source: z.string(),
    validation_status: z.string()
  }).optional()
});

// ============================================================================
// SERVICE REQUEST SCHEMAS
// ============================================================================

export const ServiceTypeSchema = z.enum([
  'trade-health-check',
  'usmca-advantage',
  'supply-chain-optimization',
  'pathfinder',
  'supply-chain-resilience',
  'crisis-navigator'
]);

export const ServiceRequestStatusSchema = z.enum([
  'pending_payment',
  'pending',
  'in_progress',
  'research_in_progress',
  'proposal_sent',
  'completed',
  'cancelled',
  'pending_schedule',
  'scheduled',
  'consultation_completed'
]);

export const SubscriberWorkflowDataSchema = z.object({
  company_name: z.string().min(2),
  business_type: z.string(),
  trade_volume: z.string(),
  manufacturing_location: z.string(),
  supplier_country: z.string().optional(),
  destination_country: z.string().optional(),

  product_description: z.string(),
  component_origins: z.array(ComponentOriginSchema),

  qualification_status: QualificationStatusSchema,
  north_american_content: z.number().optional(),

  annual_tariff_cost: z.number().optional(),
  potential_usmca_savings: z.number().optional(),
  calculated_savings: z.number().optional(),

  compliance_gaps: z.array(z.string()).optional(),
  vulnerability_factors: z.array(z.string()).optional(),

  annual_trade_volume: z.number().optional(),
  hs_code: z.string().optional()
});

export const ServiceRequestSchema = z.object({
  id: z.string(),
  service_type: ServiceTypeSchema,
  company_name: z.string().min(2),
  contact_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  trade_volume: z.number(),

  assigned_to: z.enum(['Jorge', 'Cristina', 'Jorge & Cristina']),
  status: ServiceRequestStatusSchema,
  priority: z.enum(['low', 'medium', 'high', 'urgent']),

  timeline: z.string().optional(),
  budget_range: z.string().optional(),

  created_at: z.string(),
  updated_at: z.string(),

  // Client consent
  data_storage_consent: z.boolean(),
  consent_timestamp: z.string(),
  privacy_policy_version: z.string(),
  consent_ip_address: z.string().optional(),
  consent_user_agent: z.string().optional(),

  // Service-specific data (flexible JSONB)
  service_details: z.record(z.any()),

  // Workflow data (JSONB)
  workflow_data: SubscriberWorkflowDataSchema.optional(),
  subscriber_data: SubscriberWorkflowDataSchema.optional(),

  // Consultation tracking
  consultation_status: z.enum(['pending_schedule', 'scheduled', 'completed']).optional(),
  consultation_duration: z.string().optional(),
  next_steps: z.string().optional()
});

// ============================================================================
// TARIFF DATA SCHEMAS
// ============================================================================

export const HTSTariffRateSchema = z.object({
  id: z.string().uuid(),
  hts8: z.string().length(8, 'HS code must be 8 digits'),
  brief_description: z.string().optional(),

  mfn_text_rate: z.string().optional(),
  mfn_ad_val_rate: z.number().min(0).max(1),
  mfn_specific_rate: z.number().optional(),
  mfn_other_rate: z.number().optional(),

  usmca_indicator: z.string().optional(),
  usmca_ad_val_rate: z.number().min(0).max(1),
  usmca_specific_rate: z.number().optional(),
  usmca_other_rate: z.number().optional(),

  begin_effect_date: z.string().optional(),
  end_effective_date: z.string().optional(),

  created_at: z.string(),
  updated_at: z.string(),
  data_source: z.string()
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional()
});

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validate workflow form data
 * @param {any} data - Data to validate
 * @returns {ValidationResult} Validation result with errors
 */
export function validateWorkflowFormData(data) {
  try {
    WorkflowFormDataSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });

      logDevIssue({
        type: 'validation_error',
        severity: 'high',
        component: 'validation',
        message: 'Workflow form data validation failed',
        data: {
          errors,
          companyName: data?.company_name,
          businessType: data?.business_type,
          failedFields: error.errors.map(e => e.path.join('.'))
        }
      }).catch(() => {}); // Non-blocking

      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate component origin data
 * @param {any} data - Component data to validate
 * @returns {ValidationResult} Validation result with errors
 */
export function validateComponentOrigin(data) {
  try {
    ComponentOriginSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate subscriber workflow data
 * @param {any} data - Subscriber data to validate
 * @returns {ValidationResult} Validation result with errors
 */
export function validateSubscriberData(data) {
  try {
    SubscriberWorkflowDataSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);

      logDevIssue({
        type: 'validation_error',
        severity: 'high',
        component: 'validation',
        message: 'Subscriber workflow data validation failed',
        data: {
          errors,
          companyName: data?.company_name,
          qualificationStatus: data?.qualification_status,
          failedFields: error.errors.map(e => e.path.join('.'))
        }
      }).catch(() => {}); // Non-blocking

      console.error('❌ Subscriber data validation failed:', errors);
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate service request data
 * @param {any} data - Service request data to validate
 * @returns {ValidationResult} Validation result with errors
 */
export function validateServiceRequest(data) {
  try {
    ServiceRequestSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);

      logDevIssue({
        type: 'validation_error',
        severity: 'high',
        component: 'validation',
        message: 'Service request data validation failed',
        data: {
          errors,
          serviceType: data?.service_type,
          companyName: data?.company_name,
          failedFields: error.errors.map(e => e.path.join('.'))
        }
      }).catch(() => {}); // Non-blocking

      console.error('❌ Service request validation failed:', errors);
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate user authentication response
 * @param {any} data - Auth response data
 * @returns {ValidationResult} Validation result with errors
 */
export function validateAuthResponse(data) {
  try {
    AuthResponseSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Safe parse with logging
 * @param {z.ZodSchema} schema - Zod schema to use
 * @param {any} data - Data to validate
 * @param {string} context - Context for logging
 * @returns {Object} Parsed data or null
 */
export function safeValidate(schema, data, context = 'unknown') {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error(`❌ Validation failed [${context}]:`, result.error.errors);
    return null;
  }

  console.log(`✅ Validation passed [${context}]`);
  return result.data;
}

/**
 * Validate and throw on error (for critical validations)
 * @param {z.ZodSchema} schema - Zod schema to use
 * @param {any} data - Data to validate
 * @param {string} context - Context for error message
 * @throws {Error} If validation fails
 * @returns {Object} Parsed data
 */
export function validateOrThrow(schema, data, context = 'unknown') {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      const errorMessage = `Validation failed [${context}]: ${errors.join(', ')}`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
    throw error;
  }
}

// ============================================================================
// EXPORT ALL SCHEMAS AND VALIDATORS
// ============================================================================

export {
  // Export schemas for use in other files
  z,  // Re-export zod for convenience
};
