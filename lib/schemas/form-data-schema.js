/**
 * FORM DATA CONTRACT
 * Single source of truth for USMCA workflow form data structure
 * Validates field names across all workflow steps
 *
 * CRITICAL: Prevents field name mismatches between:
 * - CompanyInformationStep (Step 1)
 * - ComponentOriginsStepEnhanced (Step 2)
 * - API (ai-usmca-complete-analysis.js)
 * - Results display (ExecutiveSummary, etc.)
 *
 * Example: If you change trade_volume anywhere, update it EVERYWHERE
 */

import { parseTradeVolume } from '../utils/parseTradeVolume.js';

/**
 * USMCA Workflow Form Data Schema
 * This is the contract that ALL workflow components must follow
 */
export const WORKFLOW_FORM_SCHEMA = {
  // ========== COMPANY INFORMATION (Step 1) ==========
  company_name: 'string',              // ✅ Company name
  company_country: 'string',           // ✅ Where company is located (NOT destination)
  company_address: 'string',           // ✅ Company address
  tax_id: 'string',                    // ✅ Tax identification number
  business_type: 'string',             // ✅ Role in supply chain (Importer/Exporter/Manufacturer/etc)
  industry_sector: 'string',           // ✅ Industry classification (from database dropdown)

  // Contact information (NO title field - that's in Step 4)
  contact_person: 'string',            // ✅ Contact person name
  contact_phone: 'string',             // ✅ Contact phone
  contact_email: 'string',             // ✅ Contact email

  // Trade parameters
  supplier_country: 'string',          // ✅ Primary supplier/origin country
  destination_country: 'string',       // ✅ Where product is going (US/CA/MX for USMCA)
  trade_volume: 'number|string',       // ✅ Annual trade volume in USD - CRITICAL FIELD
  manufacturing_location: 'string',    // ✅ Where manufacturing happens
  manufacturing_involves_substantial_transformation: 'boolean',  // ✅ Value-add checkbox

  // Product information
  product_description: 'string',       // ✅ Product description

  // ========== COMPONENT ORIGINS (Step 2) ==========
  component_origins: 'array',          // ✅ Array of components [{description, origin_country, value_percentage}]

  // ========== CERTIFICATE AUTHORIZATION (Step 4) ==========
  certifier_type: 'string',            // ✅ IMPORTER/EXPORTER/PRODUCER
  signatory_name: 'string',            // ✅ Who signs the certificate
  signatory_title: 'string',           // ✅ Title of signatory (from dropdown)
  signatory_email: 'string',           // ✅ Signatory email
  signatory_phone: 'string',           // ✅ Signatory phone
};

/**
 * CRITICAL: Field Name Aliases Mapping
 * Maps old/alternate field names to canonical names
 * Use this to normalize data before processing
 *
 * Example: If some code uses 'annual_trade_volume', map it to 'trade_volume'
 */
export const FIELD_ALIASES = {
  // Trade volume aliases (MOST COMMON BUG)
  'annual_trade_volume': 'trade_volume',
  'trade_amount': 'trade_volume',
  'annual_volume': 'trade_volume',
  'volume': 'trade_volume',

  // Company aliases
  'company': 'company_name',
  'name': 'company_name',
  'organization': 'company_name',

  // Country aliases
  'origin': 'supplier_country',
  'source_country': 'supplier_country',
  'supplier': 'supplier_country',
  'destination': 'destination_country',
  'export_destination': 'destination_country',

  // Contact aliases
  'contact': 'contact_person',
  'person': 'contact_person',
};

/**
 * Validate form data has all required fields
 * Prevents silent failures when fields are missing
 *
 * @param {Object} formData - Form data to validate
 * @param {string} context - Where validation is happening (for error messages)
 * @returns {Object} {valid: boolean, missing: string[], errors: string[]}
 */
export function validateFormSchema(formData, context = 'Unknown') {
  const required = [
    'company_name',
    'company_country',
    'business_type',
    'industry_sector',
    'contact_person',
    'contact_email',
    'supplier_country',
    'destination_country',
    'trade_volume',
    'product_description',
    'component_origins'
  ];

  const missing = required.filter(field => {
    const value = formData[field];
    return value === undefined || value === null || value === '' ||
           (Array.isArray(value) && value.length === 0);
  });

  const errors = [];

  // Trade volume must be a number or parseable string
  if (formData.trade_volume !== undefined && formData.trade_volume !== null) {
    const parsed = parseTradeVolume(formData.trade_volume);
    if (parsed === null || parsed <= 0) {
      errors.push(`trade_volume must be a positive number, got: ${formData.trade_volume}`);
    }
  }

  // Destination country must be USMCA territory
  if (formData.destination_country) {
    const validDestinations = ['US', 'CA', 'MX'];
    if (!validDestinations.includes(formData.destination_country?.toUpperCase())) {
      errors.push(`destination_country must be US, CA, or MX for USMCA, got: ${formData.destination_country}`);
    }
  }

  // Component origins must have at least one component
  if (formData.component_origins && Array.isArray(formData.component_origins)) {
    const invalidComponents = formData.component_origins.filter(c => !c.description || !c.origin_country);
    if (invalidComponents.length > 0) {
      errors.push(`Found ${invalidComponents.length} components missing description or origin_country`);
    }
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
    context
  };
}

/**
 * Normalize form data by resolving field name aliases
 * Ensures 'annual_trade_volume' becomes 'trade_volume', etc.
 *
 * @param {Object} formData - Form data with possible aliases
 * @returns {Object} Normalized form data with canonical field names
 */
export function normalizeFormData(formData) {
  const normalized = { ...formData };

  // Check for field aliases and normalize them
  for (const [alias, canonical] of Object.entries(FIELD_ALIASES)) {
    if (normalized[alias] && !normalized[canonical]) {
      console.warn(`⚠️ [FORM SCHEMA] Field alias detected: '${alias}' → '${canonical}'`);
      normalized[canonical] = normalized[alias];
      delete normalized[alias];
    }
  }

  return normalized;
}

/**
 * Enforce single field name by logging warnings if aliases are used
 * Helps catch mismatches during development
 *
 * @param {Object} formData - Form data to check
 * @param {string} fieldName - The field to check (e.g., 'trade_volume')
 * @param {string} context - Where this is being called from
 */
export function validateSingleFieldName(formData, fieldName, context = 'Unknown') {
  const aliases = FIELD_ALIASES[fieldName] ? [] :
                  Object.entries(FIELD_ALIASES)
                    .filter(([alias, canonical]) => canonical === fieldName)
                    .map(([alias]) => alias);

  if (aliases.length > 0) {
    for (const alias of aliases) {
      if (formData[alias] !== undefined && formData[fieldName] !== undefined &&
          formData[alias] !== formData[fieldName]) {
        console.error(
          `❌ [FIELD MISMATCH] in ${context}: Found both '${fieldName}' and alias '${alias}' with different values!`,
          { [fieldName]: formData[fieldName], [alias]: formData[alias] }
        );
      }
    }
  }
}

/**
 * Log form data structure for debugging
 * Shows exactly which fields are present and which are missing
 */
export function logFormDataStructure(formData, context = 'Unknown') {
  console.log(`\n📋 Form Data Structure - ${context}`);
  console.log('Present fields:');
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const preview = Array.isArray(value) ? `[${value.length} items]` :
                      String(value).length > 50 ? String(value).substring(0, 50) + '...' :
                      value;
      console.log(`  ✅ ${key}: ${preview}`);
    }
  });

  const schemaKeys = Object.keys(WORKFLOW_FORM_SCHEMA);
  const missing = schemaKeys.filter(key => !(key in formData) || formData[key] === undefined);
  if (missing.length > 0) {
    console.log('\nMissing fields:');
    missing.forEach(key => console.log(`  ❌ ${key}`));
  }
}

export default {
  WORKFLOW_FORM_SCHEMA,
  FIELD_ALIASES,
  validateFormSchema,
  normalizeFormData,
  validateSingleFieldName,
  logFormDataStructure
};
