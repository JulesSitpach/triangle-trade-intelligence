/**
 * DATA CONTRACTS - Single Source of Truth for All Field Names
 *
 * This file defines TypeScript interfaces that enforce field naming across the entire platform.
 * If you use a wrong field name, TypeScript will catch it at compile-time BEFORE deployment.
 *
 * CRITICAL RULE: All data must conform to these contracts.
 * Never use aliases or variant names in production code.
 * Use normalizeFormData() and normalizeComponent() utilities for input normalization only.
 */

/**
 * ============================================================================
 * FORM DATA CONTRACTS
 * ============================================================================
 * Data structure captured from user workflow forms (Step 1: Company, Step 2: Components)
 */

export interface CompanyInformation {
  /** Company legal name (required for certificate) */
  company_name: string;

  /** Company location country */
  company_country: string;

  /** Type of business (e.g., "Manufacturing", "Import/Export", "Distributor") */
  business_type: string;

  /** Company mailing address */
  company_address?: string;

  /** Company contact person */
  contact_person?: string;

  /** Company email */
  email?: string;

  /** Company phone */
  phone?: string;
}

export interface TradeProfile {
  /** Annual trade volume in USD (no commas) */
  trade_volume: number;

  /** Country where goods are being exported/imported FROM */
  supplier_country?: string;

  /** Destination country - MUST be US, CA, or MX for USMCA */
  destination_country: 'US' | 'CA' | 'MX';
}

export interface ProductInformation {
  /** HS code (10 digits, with dots: 8534.20.00) */
  hs_code: string;

  /** Product name/description */
  description: string;
}

export interface ComponentOrigin {
  /** Component description/name */
  description: string;

  /** Component type (if different from description) */
  component_type?: string;

  /** Percentage of total product value this component represents (0-100) */
  value_percentage: number;

  /** ALIAS for value_percentage (for backwards compatibility) */
  percentage?: number;

  /** Country where component originates */
  origin_country: string;

  /** 10-digit HS code for this component */
  hs_code: string;

  /** Manufacturing location (specific country, not "Does Not Apply") */
  manufacturing_location?: string;

  // === TARIFF RATES (populated after enrichment) ===
  /** Base Most Favored Nation rate (current 2025 policy) */
  mfn_rate: number;

  /** Base MFN rate before Section 301/232 (baseline) */
  base_mfn_rate: number;

  /** Section 301 tariff (China duties, if applicable) */
  section_301: number;

  /** Section 232 tariff (Steel/aluminum safeguards, if applicable) */
  section_232: number;

  /** Total rate = base_mfn_rate + section_301 + section_232 */
  total_rate: number;

  /** USMCA preferential rate (treaty rate) */
  usmca_rate: number;

  /** Savings from USMCA = mfn_rate - usmca_rate (percentage points) */
  savings_percentage: number;

  /** ALIAS for savings_percentage (for backwards compatibility) */
  savings_percent?: number;

  /** AI confidence in HS code classification (0-100) */
  ai_confidence?: number;

  /** ALIAS for ai_confidence (for backwards compatibility) */
  confidence?: number;

  /** Source of tariff data (openrouter, anthropic, database) */
  cache_source?: string;

  /** Policy adjustments applied (Section 301, Section 232, etc.) */
  policy_adjustments?: string[];

  /** When tariff cache expires (ISO timestamp) */
  expires_at?: string;
}

export interface USMCAWorkflowFormData {
  company: CompanyInformation;
  trade_profile: TradeProfile;
  product: ProductInformation;
  components: ComponentOrigin[];
}

/**
 * ============================================================================
 * API RESPONSE CONTRACTS
 * ============================================================================
 * Structure of data returned from API endpoints
 */

export interface NormalizedComponentData extends ComponentOrigin {
  /** Alias: both names always returned for backwards compatibility */
  classified_hs_code?: string;
}

export interface EnrichedComponentData extends NormalizedComponentData {
  /** Whether this component qualifies under USMCA */
  qualifies_under_usmca: boolean;

  /** Reason why it qualifies or doesn't qualify */
  qualification_reason?: string;
}

/**
 * ============================================================================
 * DATABASE CONTRACTS
 * ============================================================================
 * Exact structure of data stored in database tables
 */

export interface WorkflowSessionRow {
  id: string;
  user_id: string;
  workflow_type: string;

  // Company info
  company_name: string;
  company_country: string;
  company_address?: string;
  business_type: string;

  // Trade parameters
  destination_country: string;
  trade_volume: number; // DECIMAL in DB, number in TS

  // Product
  hs_code: string;
  product_description: string;

  // Components (stored as JSONB array)
  component_origins: ComponentOrigin[];

  // USMCA qualification
  qualification_status: 'QUALIFIED' | 'NOT_QUALIFIED' | 'CONDITIONAL';
  regional_content_percentage: number;
  required_threshold: number;

  // Enrichment data (stored as JSONB)
  workflow_data?: Record<string, any>;

  // Timestamps
  created_at: string;
  completed_at?: string;
  updated_at?: string;
}

export interface TariffRatesCacheRow {
  id: string;

  /** 10-digit HS code */
  hs_code: string;

  /** Destination country (US, CA, or MX) */
  destination_country: string;

  // === TARIFF RATES ===
  /** Current MFN rate (with 2025 policy applied) */
  mfn_rate: number;

  /** Base MFN rate (pre-policy, for reference) */
  base_mfn_rate: number;

  /** Section 301 tariff (China duties) */
  section_301: number;

  /** Section 232 tariff (Steel/aluminum) */
  section_232: number;

  /** Total rate = base_mfn_rate + section_301 + section_232 */
  total_rate: number;

  /** USMCA preferential rate */
  usmca_rate: number;

  /** Savings from USMCA qualification */
  savings_percentage: number;

  /** Policy adjustments applied (array of policy names) */
  policy_adjustments: string[];

  /** AI model confidence in rates (0.0 to 1.0) */
  ai_confidence: number;

  /** Where did rates come from (openrouter, anthropic, database) */
  cache_source: string;

  /** When cache expires */
  expires_at: string;

  /** Last updated timestamp */
  last_updated: string;

  // Timestamps
  created_at: string;
  updated_at?: string;
}

export interface WorkflowCompletionRow {
  id: string;
  user_id: string;

  // Product info
  hs_code: string;
  product_description: string;

  // Full workflow data (JSONB)
  workflow_data: {
    company: CompanyInformation;
    product: ProductInformation;
    components: ComponentOrigin[];
    qualification_result: {
      status: string;
      regional_content: number;
      required_threshold: number;
    };
    // ... other analysis fields
  };

  certificate_generated: boolean;
  certificate_data?: Record<string, any>;

  completed_at: string;
  created_at: string;
  updated_at?: string;
}

/**
 * ============================================================================
 * ALERT DATA CONTRACTS
 * ============================================================================
 * Structure of alert data across the system
 */

export interface PersonalizedAlert {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  affected_countries: string[];
  affected_hs_codes: string[];
  effective_date: string;
  relevance_score: number;
  urgency: string;
  mexico_opportunity?: string;
  action_required: string;
  source_context: string;
}

export interface ConsolidatedAlert {
  id: string;
  title: string;
  broker_summary: string;
  urgency: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  timeline: string;
  effective_date: string;
  urgency_reasoning: string;

  affected_components: Array<{
    component: string;
    percentage: number;
    origin: string;
    hs_code: string;
  }>;

  consolidated_impact: {
    total_annual_cost: string;
    confidence: 'high' | 'medium' | 'low';
    confidence_explanation: string;
    breakdown: string;
    stack_explanation?: string;
  };

  mitigation_scenarios: Array<{
    title: string;
    cost_impact: string;
    timeline: string;
    benefit: string;
    tradeoffs: string[];
    recommended: boolean;
  }>;

  explanation: string;
  what_you_know: string[];
  what_you_might_not_know: string[];
  specific_action_items: string[];
  related_alerts: string[];
  original_alert_count: number;
}

/**
 * ============================================================================
 * UNIFIED USER PROFILE CONTRACT
 * ============================================================================
 * The data structure used when loading user profile from any source
 */

export interface UserTradeProfile {
  // Company
  company_name: string;
  business_type: string;

  // Trade parameters
  trade_volume: number;
  destination_country: string;

  // Product
  hs_code: string;
  product_description: string;

  // Components
  component_origins: ComponentOrigin[];

  // USMCA
  qualification_status: string;
  regional_content_percentage?: number;

  // AI Analysis (optional premium content)
  recommendations?: string[];
  detailed_analysis?: Record<string, any>;
  compliance_roadmap?: Record<string, any>;
  risk_mitigation?: Record<string, any>;
  confidence_score?: number;
  confidence_factors?: Record<string, any>;
}

/**
 * ============================================================================
 * VALIDATION & TRANSFORMATION UTILITIES
 * ============================================================================
 * Type guards to enforce contracts at runtime
 */

/**
 * Type guard: Is this a valid ComponentOrigin?
 */
export function isComponentOrigin(obj: unknown): obj is ComponentOrigin {
  if (typeof obj !== 'object' || obj === null) return false;
  const comp = obj as Record<string, any>;
  return (
    typeof comp.description === 'string' &&
    typeof comp.hs_code === 'string' &&
    typeof comp.origin_country === 'string' &&
    (typeof comp.value_percentage === 'number' || typeof comp.percentage === 'number')
  );
}

/**
 * Type guard: Is this a valid WorkflowSessionRow?
 */
export function isWorkflowSession(obj: unknown): obj is WorkflowSessionRow {
  if (typeof obj !== 'object' || obj === null) return false;
  const row = obj as Record<string, any>;
  return (
    typeof row.id === 'string' &&
    typeof row.user_id === 'string' &&
    typeof row.company_name === 'string' &&
    typeof row.trade_volume === 'number' &&
    Array.isArray(row.component_origins)
  );
}

/**
 * Type guard: Is this a valid TariffRatesCacheRow?
 */
export function isTariffRatesCache(obj: unknown): obj is TariffRatesCacheRow {
  if (typeof obj !== 'object' || obj === null) return false;
  const row = obj as Record<string, any>;
  return (
    typeof row.hs_code === 'string' &&
    typeof row.destination_country === 'string' &&
    typeof row.mfn_rate === 'number' &&
    typeof row.total_rate === 'number' &&
    typeof row.usmca_rate === 'number'
  );
}

/**
 * ============================================================================
 * MIGRATION PATH FOR EXISTING CODE
 * ============================================================================
 * Use these types by importing:
 *
 * import type {
 *   ComponentOrigin,
 *   UserTradeProfile,
 *   WorkflowSessionRow,
 *   TariffRatesCacheRow
 * } from '@/lib/types/data-contracts';
 *
 * Then annotate your variables:
 *
 * const component: ComponentOrigin = normalizeComponent(rawData);
 * const profile: UserTradeProfile = buildProfile(workflow);
 * const cached: TariffRatesCacheRow = await fetchFromDatabase();
 */

export default {
  isComponentOrigin,
  isWorkflowSession,
  isTariffRatesCache
};
