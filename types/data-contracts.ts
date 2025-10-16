/**
 * DATA CONTRACTS - Single Source of Truth
 * TypeScript interfaces for all data structures in Triangle Intelligence Platform
 *
 * NAMING CONVENTION: snake_case to match database and API
 * This file defines the CORRECT structure - existing code should be updated to match
 *
 * Generated: January 2025
 */

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export interface User {
  id: string;
  email: string;
  isAdmin?: boolean;
  company_name?: string;
  subscription_tier: SubscriptionTier;
  created_at?: string;
}

export type SubscriptionTier = 'Trial' | 'Starter' | 'Professional' | 'Premium' | 'Enterprise';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  subscription_tier: SubscriptionTier;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  terms_accepted_at?: string;
  privacy_accepted_at?: string;
  email_notifications: boolean;
}

export interface AuthResponse {
  success: boolean;
  authenticated: boolean;
  user?: User;
  error?: string;
}

// ============================================================================
// WORKFLOW DATA STRUCTURES
// ============================================================================

export interface ComponentOrigin {
  country: string;
  percentage: number;
  value_percentage: number;
  component_type: string;
  description: string;
  origin_country?: string;

  // Enrichment fields (added by AI/database lookup)
  hs_code?: string;
  hs_description?: string;
  mfn_rate?: number;
  usmca_rate?: number;
  savings_amount?: number;
  savings_percentage?: number;
  ai_confidence?: number;
  enriched?: boolean;
  enrichment_timestamp?: string;
}

export interface WorkflowFormData {
  // Company Information (Step 1)
  company_name: string;
  business_type: string;          // Business role: Importer, Exporter, etc.
  industry_sector: string;        // Industry classification for HS codes
  trade_volume: string;
  manufacturing_location: string;
  supplier_country: string;
  destination_country?: string;

  // Certificate fields (optional)
  company_address?: string;
  tax_id?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;

  // Product Information (Step 2)
  product_description: string;
  component_origins: ComponentOrigin[];

  // Classification results (populated by AI)
  classified_hs_code?: string;
  hs_description?: string;
  classification_confidence?: number;

  // USMCA Results (populated by analysis)
  qualification_status?: QualificationStatus;
  qualification_level?: string;
  qualification_rule?: string;
  north_american_content?: number;
  calculated_savings?: number;
  current_tariff_rate?: number;
  usmca_tariff_rate?: number;
  monthly_savings?: number;

  // Authorization (Step 4)
  signatory_name?: string;
  signatory_title?: string;
  importer_name?: string;
  importer_address?: string;
  importer_country?: string;
  importer_tax_id?: string;
}

export type QualificationStatus = 'QUALIFIED' | 'NOT_QUALIFIED' | 'PARTIAL' | 'NEEDS_REVIEW';

export interface USMCAWorkflowResults {
  success: boolean;
  method: string;

  // Company data
  company: {
    name: string;
    business_type: string;
    trade_volume: string;
    manufacturing_location: string;
  };

  // Product data
  product: {
    description: string;
    hs_code: string;
    hs_description?: string;
  };

  // USMCA qualification
  usmca: {
    qualified: boolean;
    qualification_status: QualificationStatus;
    north_american_content: number;
    threshold_applied: number;
    component_breakdown: ComponentOrigin[];
  };

  // Savings calculation
  savings: {
    total_savings: number;
    mfn_rate: number;
    usmca_rate: number;
    savings_percentage: number;
    annual_savings: number;
  };

  // Certificate (if generated)
  certificate?: USMCACertificate;

  // Recommendations
  recommendations?: string[];

  // Trust/confidence metrics
  trust?: {
    confidence_score: number;
    data_source: string;
    validation_status: string;
  };
}

// ============================================================================
// CERTIFICATE DATA STRUCTURES
// ============================================================================

export interface USMCACertificate {
  certificate_id: string;
  certificate_number?: string;
  generated_at: string;

  // Exporter information
  exporter: {
    name: string;
    address: string;
    country: string;
    tax_id: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
  };

  // Importer information (optional)
  importer?: {
    name: string;
    address: string;
    country: string;
    tax_id?: string;
  };

  // Product information
  product: {
    description: string;
    hs_code: string;
    hs_description?: string;
  };

  // USMCA qualification
  preference_criterion: string;
  country_of_origin: string;
  regional_value_content?: number;

  // Validity period
  blanket_period?: {
    start_date: string;
    end_date: string;
  };

  // Authorization
  signatory_name: string;
  signatory_title: string;
  signature_date?: string;

  // Trust verification
  trust_verification?: {
    trust_level: string;
    overall_trust_score: number;
    expert_validation_required: boolean;
  };
}

// ============================================================================
// SERVICE REQUEST DATA STRUCTURES
// ============================================================================

export interface ServiceRequest {
  id: string;
  service_type: ServiceType;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  industry?: string;
  trade_volume: number;

  assigned_to: 'Jorge' | 'Cristina' | 'Jorge & Cristina';
  status: ServiceRequestStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';

  timeline?: string;
  budget_range?: string;

  created_at: string;
  updated_at: string;

  // Client consent
  data_storage_consent: boolean;
  consent_timestamp: string;
  privacy_policy_version: string;
  consent_ip_address?: string;
  consent_user_agent?: string;

  // Service-specific data (JSONB)
  service_details: Record<string, any>;

  // Complete USMCA workflow data (JSONB)
  workflow_data?: SubscriberWorkflowData;
  subscriber_data?: SubscriberWorkflowData;  // Alternative field name

  // Consultation tracking
  consultation_status?: 'pending_schedule' | 'scheduled' | 'completed';
  consultation_duration?: string;
  next_steps?: string;

  // Vulnerability analysis (joined from another table)
  vulnerability_analysis?: VulnerabilityAnalysis;
  total_analyses?: number;
}

export type ServiceType =
  | 'trade-health-check'
  | 'usmca-advantage'
  | 'supply-chain-optimization'
  | 'pathfinder'
  | 'supply-chain-resilience'
  | 'crisis-navigator';

export type ServiceRequestStatus =
  | 'pending_payment'
  | 'pending'
  | 'in_progress'
  | 'research_in_progress'
  | 'proposal_sent'
  | 'completed'
  | 'cancelled'
  | 'pending_schedule'
  | 'scheduled'
  | 'consultation_completed';

export interface SubscriberWorkflowData {
  // Company data
  company_name: string;
  business_type: string;
  trade_volume: string;
  manufacturing_location: string;
  supplier_country?: string;
  destination_country?: string;

  // Product data
  product_description: string;

  // Component breakdown
  component_origins: ComponentOrigin[];

  // USMCA qualification
  qualification_status: QualificationStatus;
  north_american_content?: number;

  // Tariff/savings data
  annual_tariff_cost?: number;
  potential_usmca_savings?: number;
  calculated_savings?: number;

  // Risk factors
  compliance_gaps?: string[];
  vulnerability_factors?: string[];

  // Additional context
  annual_trade_volume?: number;
  hs_code?: string;
}

export interface VulnerabilityAnalysis {
  id: string;
  user_id: string;
  created_at: string;

  component_origins: ComponentOrigin[];
  qualification_status: QualificationStatus;
  regional_content_percentage?: number;
  required_threshold?: number;
  usmca_threshold?: number;
  annual_trade_volume?: number;
  risk_score?: number;
}

// ============================================================================
// TARIFF DATA STRUCTURES
// ============================================================================

export interface HTSTariffRate {
  id: string;
  hts8: string;
  brief_description?: string;

  // MFN rates
  mfn_text_rate?: string;
  mfn_ad_val_rate: number;  // Decimal format: 0.068 = 6.8%
  mfn_specific_rate?: number;
  mfn_other_rate?: number;

  // USMCA rates
  usmca_indicator?: string;
  usmca_ad_val_rate: number;  // Decimal format: 0.00 = 0%
  usmca_specific_rate?: number;
  usmca_other_rate?: number;

  // Effective dates
  begin_effect_date?: string;
  end_effective_date?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  data_source: string;
}

export interface TariffSavings {
  hts8: string;
  brief_description: string;
  mfn_ad_val_rate: number;
  usmca_ad_val_rate: number;
  savings_rate: number;
  savings_percentage: number;
  savings_tier: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
}

// ============================================================================
// API RESPONSE STRUCTURES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardDataResponse {
  success: boolean;
  workflows: WorkflowHistory[];
  alerts: CrisisAlert[];
  summary: {
    total_workflows: number;
    total_alerts: number;
    active_alerts: number;
  };
}

export interface WorkflowHistory {
  id: string;
  user_id: string;
  company_data: Record<string, any>;
  product_data: Record<string, any>;
  component_origins: ComponentOrigin[];
  qualification_status: QualificationStatus;
  created_at: string;
}

export interface CrisisAlert {
  id: string;
  user_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact?: string;
  recommendations?: string[];
  created_at: string;
  resolved_at?: string;
}

// ============================================================================
// STRIPE/PAYMENT STRUCTURES
// ============================================================================

export interface ServiceCheckoutRequest {
  service_id: ServiceType;
  user_id?: string;
  subscriber_data?: SubscriberWorkflowData;
  success_url?: string;
  cancel_url?: string;
}

export interface ServicePricing {
  base_price: number;
  discount: number;
  discount_percentage: number;
  final_price: number;
  subscription_tier: SubscriptionTier;
}

// ============================================================================
// CONFIGURATION STRUCTURES
// ============================================================================

export interface ServiceConfiguration {
  type: ServiceType;
  name: string;
  icon: string;
  description: string;
  price: number;
  basePrice?: number;
  monthlyCapacity: number;
  avgCompletion: string;
  teamLead: string;
  cristinaEffort: number;
  jorgeEffort: number;
  defaultTemplate: string;
  defaultDeliverable: string;
  isRecurring?: boolean;
  stages: ServiceStage[];
}

export interface ServiceStage {
  id: number;
  name: string;
  icon: string;
  component: string;
  description: string;
}

// ============================================================================
// DROPDOWN OPTIONS (from database)
// ============================================================================

export interface DropdownOptions {
  businessTypes: DropdownOption[];
  countries: DropdownOption[];
  usmcaCountries: DropdownOption[];
  importVolumes: DropdownOption[];
}

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// LOCALSTORAGE KEYS (for type safety)
// ============================================================================

export const STORAGE_KEYS = {
  WORKFLOW_RESULTS: 'usmca_workflow_results',
  WORKFLOW_DATA: 'usmca_workflow_data',
  USER_DATA: 'triangleUserData',
  SESSION_ID: 'workflow_session_id',
} as const;

// ============================================================================
// ADMIN INTELLIGENCE METRICS
// ============================================================================

export interface AdminIntelligenceMetrics {
  total_with_analysis: number;
  low_confidence_hs_codes: number;
  high_tariff_exposure_count: number;
  total_tariff_opportunity: number;
  rvc_optimization_opportunities: number;
  top_opportunities: OpportunityProfile[];
}

export interface OpportunityProfile {
  company_name: string;
  request_id: string;
  low_confidence: boolean;
  high_tariff: boolean;
  tariff_opportunity: number;
  rvc_optimization: boolean;
  risk_score: number;
}

// ============================================================================
// TYPE GUARDS (for runtime validation)
// ============================================================================

export function isValidSubscriptionTier(tier: any): tier is SubscriptionTier {
  return ['Trial', 'Starter', 'Professional', 'Premium', 'Enterprise'].includes(tier);
}

export function isValidQualificationStatus(status: any): status is QualificationStatus {
  return ['QUALIFIED', 'NOT_QUALIFIED', 'PARTIAL', 'NEEDS_REVIEW'].includes(status);
}

export function isValidServiceType(type: any): type is ServiceType {
  return [
    'trade-health-check',
    'usmca-advantage',
    'supply-chain-optimization',
    'pathfinder',
    'supply-chain-resilience',
    'crisis-navigator'
  ].includes(type);
}

export function isComponentOrigin(obj: any): obj is ComponentOrigin {
  return (
    typeof obj === 'object' &&
    typeof obj.country === 'string' &&
    typeof obj.percentage === 'number' &&
    typeof obj.component_type === 'string' &&
    typeof obj.description === 'string'
  );
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Re-export for convenience
  User,
  UserProfile,
  AuthResponse,
  ComponentOrigin,
  WorkflowFormData,
  USMCAWorkflowResults,
  USMCACertificate,
  ServiceRequest,
  SubscriberWorkflowData,
  VulnerabilityAnalysis,
  HTSTariffRate,
  TariffSavings,
  APIResponse,
  DashboardDataResponse,
  WorkflowHistory,
  CrisisAlert,
  ServiceCheckoutRequest,
  ServicePricing,
  ServiceConfiguration,
  ServiceStage,
  DropdownOptions,
  DropdownOption,
  ValidationResult,
  AdminIntelligenceMetrics,
  OpportunityProfile,
};
