/**
 * Workflow Completion Data Validator
 *
 * Purpose: Prevent incomplete/corrupted workflows from being marked as QUALIFIED
 *
 * This validator ensures that ONLY workflows with complete, valid data can be saved
 * to workflow_completions table with qualification_status='QUALIFIED'.
 *
 * If validation fails, the workflow is rejected and NOT saved (fail loudly).
 *
 * Created: Nov 7, 2025
 * Updated: Nov 7, 2025 - Added financial calculation validations (trade_volume, API-enforced fields)
 * Context: Dashboard relies on JSONB workflow_data structure - if fields are missing,
 *          dashboard displays break silently. This validator prevents that.
 *
 * ========== VALIDATOR SEVERITY LEVELS ==========
 *
 * ERROR - Workflow cannot proceed without this field
 *   - Blocks form submission
 *   - User MUST fill in before proceeding
 *   - Examples: company_name, trade_volume, hs_code
 *
 * WARNING - Workflow can proceed but should be reviewed
 *   - Form can be submitted, but field is incomplete
 *   - User is informed but not blocked
 *   - Examples: business_type (has fallback)
 *
 * Field Sync Contract:
 *   - If API enforces field as required → Validator must return ERROR
 *   - If calculation uses field → Validator must return ERROR if missing
 *   - If field has safe fallback → Validator should return WARNING
 *   - If field is truly optional → Validator should not check it
 *
 * Sources of Truth:
 *   1. API validation (pages/api/ai-usmca-complete-analysis.js lines 609-641)
 *   2. Calculation dependencies (pages/api/ai-usmca-complete-analysis.js lines 1349-1391)
 *   3. Certificate requirements (lib/utils/certificate-type-templates.js)
 *   4. Data contracts (workflows expect all ERROR fields to be present)
 */

import { DevIssue } from '../utils/logDevIssue.js';

/**
 * Validates that workflow_data.qualification_result has all required fields
 * for dashboard display and certificate generation.
 *
 * @param {Object} workflowData - The complete workflow data object
 * @param {string} userId - User ID for error logging
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateWorkflowCompletionData(workflowData, userId = null) {
  const errors = [];
  const warnings = [];

  // ========================================
  // LEVEL 1: Top-level workflow data
  // ========================================
  if (!workflowData) {
    errors.push('workflow_data is null or undefined');
    return { valid: false, errors, warnings };
  }

  // Check for qualification_result object
  if (!workflowData.qualification_result) {
    errors.push('workflow_data.qualification_result is missing');
  }

  const qualResult = workflowData.qualification_result || {};

  // ========================================
  // LEVEL 2: qualification_result required fields
  // ========================================

  // 1. Component Origins (CRITICAL - dashboard relies on this)
  if (!qualResult.component_origins) {
    errors.push('qualification_result.component_origins is missing');
  } else if (!Array.isArray(qualResult.component_origins)) {
    errors.push('qualification_result.component_origins must be an array');
  } else if (qualResult.component_origins.length === 0) {
    errors.push('qualification_result.component_origins is empty (no components)');
  } else {
    // Validate each component
    qualResult.component_origins.forEach((component, idx) => {
      const prefix = `component_origins[${idx}]`;

      // Required: origin_country
      if (!component.origin_country) {
        errors.push(`${prefix}.origin_country is missing`);
      }

      // Required: value_percentage
      if (component.value_percentage === undefined || component.value_percentage === null) {
        errors.push(`${prefix}.value_percentage is missing`);
      } else if (typeof component.value_percentage !== 'number') {
        errors.push(`${prefix}.value_percentage must be a number (got: ${typeof component.value_percentage})`);
      }

      // Required: hs_code (for tariff analysis)
      if (!component.hs_code) {
        warnings.push(`${prefix}.hs_code is missing (component: ${component.description || 'unnamed'})`);
      }

      // Recommended: description
      if (!component.description) {
        warnings.push(`${prefix}.description is missing`);
      }

      // Recommended: tariff rates
      if (component.mfn_rate === undefined) {
        warnings.push(`${prefix}.mfn_rate is missing (dashboard won't show tariff data)`);
      }

      if (component.usmca_rate === undefined) {
        warnings.push(`${prefix}.usmca_rate is missing (savings calculation may fail)`);
      }
    });
  }

  // 2. Manufacturing Location (required for certificate)
  // Check multiple possible locations (top-level or inside qualification_result)
  const manufacturingLocation =
    qualResult.manufacturing_location ||  // Check qualification_result first
    workflowData.manufacturing_location;  // Fallback to top-level (where it's actually stored)

  if (!manufacturingLocation) {
    errors.push('manufacturing_location is missing (required for PDF certificate)');
  }

  // 3. Regional Content Percentage (required for qualification determination)
  if (qualResult.regional_content === undefined && qualResult.regional_content_percentage === undefined) {
    errors.push('qualification_result.regional_content/regional_content_percentage is missing');
  }

  // 4. Qualification Status (must be explicit)
  if (!qualResult.status) {
    errors.push('qualification_result.status is missing (must be "QUALIFIED" or "NOT_QUALIFIED")');
  } else if (qualResult.status !== 'QUALIFIED' && qualResult.status !== 'NOT_QUALIFIED') {
    errors.push(`qualification_result.status has invalid value: "${qualResult.status}" (must be QUALIFIED or NOT_QUALIFIED)`);
  }

  // 5. Required Threshold (for qualification calculation)
  if (qualResult.required_threshold === undefined) {
    warnings.push('qualification_result.required_threshold is missing (dashboard may use incorrect threshold)');
  }

  // ========================================
  // LEVEL 3: Company data (for certificate generation)
  // ========================================
  const company = workflowData.company || {};

  if (!company.company_name && !workflowData.company_name) {
    errors.push('company.company_name is missing (required for certificate)');
  }

  if (!company.company_country && !workflowData.company_country) {
    errors.push('company.company_country is missing (required for certificate)');
  }

  if (!company.destination_country && !workflowData.destination_country) {
    errors.push('company.destination_country is missing (USMCA requires destination)');
  }

  // ========================================
  // UPGRADE: industry_sector from WARNING to ERROR
  // Reason: Wrong industry = wrong RVC threshold = wrong qualification
  // ========================================
  if (!company.industry_sector && !workflowData.industry_sector) {
    errors.push('industry_sector is missing (required for RVC threshold - wrong threshold = wrong qualification)');
  }

  // ========================================
  // LEVEL 4: Product data
  // ========================================
  const product = workflowData.product || {};

  if (!product.hs_code && !workflowData.hs_code) {
    errors.push('product.hs_code is missing (required for tariff analysis)');
  }

  if (!product.description && !workflowData.product_description) {
    warnings.push('product.description is missing (dashboard may show "Product")');
  }

  // ========================================
  // LEVEL 5: FINANCIAL CALCULATION FIELDS
  // ========================================
  // These fields are CRITICAL for accurate savings calculations
  // If missing: all financial calculations show $0 (silent failure)

  // trade_volume - CRITICAL for all financial calculations
  const tradeVolume = workflowData.trade_volume || company.trade_volume;
  if (!tradeVolume) {
    errors.push('trade_volume is missing (required for savings calculation - without this, all savings show $0)');
  } else {
    const volumeNum = parseFloat(String(tradeVolume).replace(/[^0-9.-]+/g, ''));
    if (isNaN(volumeNum) || volumeNum <= 0) {
      errors.push(`trade_volume must be a number greater than 0 (got: "${tradeVolume}")`);
    }
  }

  // ========================================
  // LEVEL 6: API-ENFORCED FIELDS
  // ========================================
  // These fields are enforced by pages/api/ai-usmca-complete-analysis.js
  // Add to workflow validator to prevent user confusion
  // Otherwise: user completes form (validator passes) → API rejects (400 error)

  const apiRequiredFields = [
    { field: 'supplier_country', message: 'Supplier country is required for tariff analysis' },
    { field: 'tax_id', message: 'Tax ID is required for certificate generation' },
    { field: 'company_address', message: 'Company address is required for certificate' },
    { field: 'contact_person', message: 'Contact person is required' },
    { field: 'contact_phone', message: 'Contact phone is required' },
    { field: 'contact_email', message: 'Contact email is required' }
  ];

  for (const fieldCheck of apiRequiredFields) {
    const fieldValue = workflowData[fieldCheck.field] || company[fieldCheck.field];

    if (!fieldValue || fieldValue === '') {
      errors.push(`${fieldCheck.field} is missing (${fieldCheck.message})`);
    }
  }

  // ========================================
  // LEVEL 7: BUSINESS TYPE VALIDATION
  // ========================================
  // Used in industry classification (49 files use this)
  // Not blocking, but should warn if missing

  const businessType = workflowData.business_type || company.business_type;
  if (!businessType || businessType === '') {
    warnings.push('business_type is missing (may default to incorrect industry classification - used as fallback for industry_sector)');
  }

  // ========================================
  // FINAL VALIDATION
  // ========================================
  const valid = errors.length === 0;

  // Log validation results
  if (!valid) {
    console.error('❌ WORKFLOW VALIDATION FAILED:', {
      userId,
      errorCount: errors.length,
      errors: errors.slice(0, 5), // Show first 5 errors
      warningCount: warnings.length
    });

    // Log to dev_issues table
    if (userId) {
      DevIssue.validationError('workflow_completion', 'incomplete_workflow_data', {
        userId,
        errors: errors.slice(0, 10), // Log max 10 errors
        warnings: warnings.slice(0, 5),
        has_qualification_result: !!workflowData.qualification_result,
        has_component_origins: !!(qualResult.component_origins),
        component_count: qualResult.component_origins?.length || 0
      });
    }
  } else if (warnings.length > 0) {
    console.warn('⚠️ WORKFLOW VALIDATION WARNINGS:', {
      userId,
      warningCount: warnings.length,
      warnings: warnings.slice(0, 5)
    });
  } else {
    console.log('✅ WORKFLOW VALIDATION PASSED:', {
      userId,
      componentCount: qualResult.component_origins?.length || 0,
      status: qualResult.status
    });
  }

  return {
    valid,
    errors,
    warnings
  };
}

/**
 * Strict validation for QUALIFIED workflows only.
 * NOT_QUALIFIED workflows can have missing data, but QUALIFIED must be complete.
 *
 * @param {Object} workflowData - The complete workflow data object
 * @param {string} userId - User ID for error logging
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateQualifiedWorkflow(workflowData, userId = null) {
  const result = validateWorkflowCompletionData(workflowData, userId);

  // Additional strict checks for QUALIFIED workflows
  const qualResult = workflowData?.qualification_result || {};

  if (qualResult.status === 'QUALIFIED') {
    // QUALIFIED workflows MUST have savings data
    if (!qualResult.savings_calculation && !workflowData.savings?.annual_savings) {
      result.errors.push('QUALIFIED workflow missing savings_calculation (required for dashboard)');
      result.valid = false;
    }

    // QUALIFIED workflows MUST have all components with tariff data
    const componentsWithoutRates = (qualResult.component_origins || []).filter(c =>
      c.mfn_rate === undefined && c.base_mfn_rate === undefined
    );

    if (componentsWithoutRates.length > 0) {
      result.errors.push(`QUALIFIED workflow has ${componentsWithoutRates.length} components without tariff rates`);
      result.valid = false;
    }

    // QUALIFIED workflows MUST have RVC >= threshold
    const rvc = qualResult.regional_content || qualResult.regional_content_percentage || 0;
    const threshold = qualResult.required_threshold || 60;

    if (rvc < threshold) {
      result.errors.push(`QUALIFIED workflow has RVC (${rvc}%) below threshold (${threshold}%)`);
      result.valid = false;
    }
  }

  return result;
}

/**
 * Helper function to get detailed validation report (for debugging)
 */
export function getValidationReport(workflowData, userId = null) {
  const result = validateWorkflowCompletionData(workflowData, userId);

  return {
    ...result,
    summary: {
      status: result.valid ? 'PASS' : 'FAIL',
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      qualification: workflowData?.qualification_result?.status || 'UNKNOWN',
      componentCount: workflowData?.qualification_result?.component_origins?.length || 0
    }
  };
}
