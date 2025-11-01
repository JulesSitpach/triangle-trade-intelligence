/**
 * Database Schema Definition
 *
 * This file defines the actual database schema to prevent silent failures
 * when code references non-existent columns or tables.
 *
 * CRITICAL: Keep this in sync with actual database schema!
 * Run this query to verify schema:
 *
 * SELECT table_name, column_name, data_type
 * FROM information_schema.columns
 * WHERE table_schema = 'public'
 * ORDER BY table_name, ordinal_position;
 *
 * Last verified: 2025-11-01
 */

const TABLES = {
  // Core workflow tables
  workflow_sessions: {
    columns: [
      'id', 'user_id', 'session_id', 'state', 'data', 'current_module_id',
      'created_at', 'expires_at', 'foundation_status', 'product_status',
      'routing_status', 'partnership_status', 'section_5_status',
      'section_6_status', 'section_7_status', 'hindsight_status',
      'alerts_status', 'americas_region', 'specific_state_province',
      'trade_corridor', 'applicable_trade_agreements', 'trade_agreement_benefits',
      'auto_populated_fields', 'user_entered_fields', 'americas_business_context',
      'regulatory_jurisdictions', 'stage_completion_status', 'usmca_optimization',
      'company_name', 'product_description', 'qualification_status',
      'qualification_percentage', 'compliance_gaps', 'completed_at',
      'hs_code', 'manufacturing_location', 'regional_content_percentage',
      'required_threshold', 'component_origins', 'business_type',
      'trade_volume', 'industry_sector', 'threshold_source',
      'threshold_reasoning', 'sourcing_interest', 'contact_consent',
      'budget_range', 'timeline', 'mexico_opportunity_score',
      'estimated_annual_savings', 'current_suppliers', 'supplier_pain_points',
      'replacement_candidates', 'marketplace_interest', 'data_quality_score',
      'verified_by_expert', 'destination_country', 'trade_flow_type',
      'tariff_cache_strategy', 'substantial_transformation', 'tax_id',
      'company_address', 'company_country', 'contact_person',
      'contact_phone', 'contact_email', 'supplier_country'
    ],
    jsonbColumns: ['data', 'state', 'component_origins'],
    commonMistakes: {
      'workflow_data': 'Use "data" instead (workflow_sessions has "data", not "workflow_data")',
      'workflow_id': 'Use "id" instead (no column called "workflow_id")'
    }
  },

  workflow_completions: {
    columns: [
      'id', 'user_id', 'workflow_type', 'product_description', 'hs_code',
      'classification_confidence', 'qualification_result', 'savings_amount',
      'completion_time_seconds', 'completed_at', 'steps_completed',
      'total_steps', 'step_timings', 'certificate_generated',
      'certificate_id', 'ip_address', 'user_agent', 'session_id',
      'email', 'workflow_name', 'status', 'total_savings',
      'estimated_duty_savings', 'compliance_cost_savings', 'workflow_data',
      'completion_time_minutes', 'created_at', 'updated_at',
      'company_name', 'business_type', 'trade_volume', 'supplier_country',
      'annual_savings', 'trust_score'
    ],
    jsonbColumns: ['workflow_data', 'qualification_result', 'step_timings'],
    commonMistakes: {
      'data': 'Use "workflow_data" instead (workflow_completions has "workflow_data", not "data")'
    }
  },

  crisis_alerts: {
    columns: [
      'id', 'user_id', 'alert_type', 'title', 'description', 'severity',
      'affected_hs_codes', 'affected_countries', 'impact_percentage',
      'relevant_industries', 'source_url', 'created_at', 'updated_at',
      'is_active'
    ],
    jsonbColumns: [],
    commonMistakes: {}
  },

  user_profiles: {
    columns: [
      'id', 'user_id', 'email', 'subscription_tier', 'trial_start_date',
      'trial_end_date', 'subscription_start_date', 'stripe_customer_id',
      'created_at', 'updated_at'
    ],
    jsonbColumns: [],
    commonMistakes: {}
  },

  tariff_intelligence_master: {
    columns: [
      'id', 'hts8', 'brief_description', 'mfn_ad_val_rate',
      'usmca_ad_val_rate', 'column_2_ad_val_rate', 'section_301',
      'section_232', 'begin_effect_date', 'data_source',
      'created_at', 'updated_at', 'mfn_text_rate'
    ],
    jsonbColumns: [],
    commonMistakes: {
      'hs_code': 'Use "hts8" instead (tariff_intelligence_master uses "hts8")'
    }
  },

  tariff_rates_cache: {
    columns: [
      'id', 'hs_code', 'destination_country', 'mfn_rate', 'usmca_rate',
      'section_301', 'section_232', 'total_rate', 'savings_percentage',
      'policy_adjustments', 'cached_at', 'expires_at', 'created_at',
      'updated_at', 'stale'
    ],
    jsonbColumns: ['policy_adjustments'],
    commonMistakes: {}
  },

  policy_tariffs_cache: {
    columns: [
      'id', 'hs_code', 'section_301', 'section_232', 'ieepa_reciprocal',
      'verified_date', 'expires_at', 'is_stale', 'created_at', 'updated_at'
    ],
    jsonbColumns: [],
    commonMistakes: {}
  }
};

// Tables that don't exist (common mistakes)
const NON_EXISTENT_TABLES = {
  'certificates': 'No "certificates" table - use workflow_completions.workflow_data.certificate instead',
  'dashboard_notifications': 'Check if this table still exists or was renamed'
};

/**
 * Validate table name exists
 */
function validateTable(tableName) {
  if (NON_EXISTENT_TABLES[tableName]) {
    return {
      valid: false,
      error: `Table "${tableName}" does not exist. ${NON_EXISTENT_TABLES[tableName]}`
    };
  }

  if (!TABLES[tableName]) {
    return {
      valid: false,
      error: `Table "${tableName}" not found in schema definition. Add it to lib/database/schema.js or verify it exists.`
    };
  }

  return { valid: true };
}

/**
 * Validate column exists in table
 */
function validateColumn(tableName, columnName) {
  const tableValidation = validateTable(tableName);
  if (!tableValidation.valid) {
    return tableValidation;
  }

  const table = TABLES[tableName];

  // Check if column exists
  if (!table.columns.includes(columnName)) {
    // Check for common mistakes
    if (table.commonMistakes[columnName]) {
      return {
        valid: false,
        error: `Column "${columnName}" does not exist in "${tableName}". ${table.commonMistakes[columnName]}`
      };
    }

    return {
      valid: false,
      error: `Column "${columnName}" does not exist in table "${tableName}". Available columns: ${table.columns.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Validate SELECT query columns
 */
function validateSelectColumns(tableName, selectString) {
  if (selectString === '*') {
    return { valid: true }; // SELECT * is always valid
  }

  const tableValidation = validateTable(tableName);
  if (!tableValidation.valid) {
    return tableValidation;
  }

  // Parse column names from select string (handles "col1, col2, col3")
  const columns = selectString
    .split(',')
    .map(col => col.trim())
    .filter(col => col.length > 0);

  const errors = [];
  for (const column of columns) {
    const validation = validateColumn(tableName, column);
    if (!validation.valid) {
      errors.push(validation.error);
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join('\n')
    };
  }

  return { valid: true };
}

/**
 * Validate UPDATE query columns
 */
function validateUpdateColumns(tableName, updateObject) {
  const tableValidation = validateTable(tableName);
  if (!tableValidation.valid) {
    return tableValidation;
  }

  const errors = [];
  for (const columnName in updateObject) {
    const validation = validateColumn(tableName, columnName);
    if (!validation.valid) {
      errors.push(validation.error);
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join('\n')
    };
  }

  return { valid: true };
}

module.exports = {
  TABLES,
  NON_EXISTENT_TABLES,
  validateTable,
  validateColumn,
  validateSelectColumns,
  validateUpdateColumns
};
