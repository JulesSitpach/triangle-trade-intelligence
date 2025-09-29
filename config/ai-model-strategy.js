/**
 * AI Model Strategy Configuration
 * Tiered approach: Flash Light for research, premium models for customer-facing analysis
 */

export const AI_MODEL_STRATEGY = {
  // Research & Discovery Tasks - TESTED: Flash Light insufficient quality
  RESEARCH: {
    model: "google/gemini-flash-1.5",
    provider: "openrouter",
    cost_tier: "ultra_low",
    use_cases: [
      "web_scraping",
      "data_extraction",
      "regulatory_research",
      "preliminary_market_research"
    ],
    context_window: "1M tokens",
    benefits: "Large context for data processing",
    limitations: "TESTED: Failed supplier discovery - insufficient for professional services"
  },

  // Supplier Discovery - Requires reliable results for $500 professional service
  SUPPLIER_DISCOVERY: {
    model: "anthropic/claude-3.5-sonnet",
    provider: "openrouter",
    cost_tier: "high",
    use_cases: [
      "supplier_discovery",
      "company_research",
      "contact_validation"
    ],
    context_window: "200K tokens",
    benefits: "Reliable real company discovery with contact details",
    test_results: "Found 5 real suppliers vs Flash Light 0 suppliers"
  },

  // Analysis & Validation - Balanced cost/quality
  ANALYSIS: {
    model: "claude-3-haiku-20240307",
    provider: "anthropic",
    cost_tier: "low",
    use_cases: [
      "market_analysis",
      "feasibility_studies",
      "crisis_analysis",
      "data_processing",
      "content_generation"
    ],
    context_window: "200K tokens",
    benefits: "Fast, reliable for structured analysis tasks"
  },

  // Customer-Facing & Expert Validation - Premium quality
  PREMIUM: {
    model: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    cost_tier: "high",
    use_cases: [
      "customer_reports",
      "final_recommendations",
      "complex_compliance_analysis",
      "expert_validation_support",
      "critical_decisions"
    ],
    context_window: "200K tokens",
    benefits: "Highest quality for professional deliverables"
  },

  // Classification & Technical Tasks - Specialized
  CLASSIFICATION: {
    model: "enhanced-classification-agent",
    provider: "custom",
    cost_tier: "medium",
    use_cases: [
      "hs_code_classification",
      "tariff_analysis",
      "compliance_checking",
      "technical_validation"
    ],
    context_window: "Variable",
    benefits: "Specialized for trade classification with web search"
  }
};

/**
 * Get appropriate model for a specific task
 */
export function getModelForTask(taskType) {
  const taskMappings = {
    // Supplier discovery -> Sonnet 3.5 (TESTED: Flash Light insufficient)
    'supplier_discovery': AI_MODEL_STRATEGY.SUPPLIER_DISCOVERY,
    'company_research': AI_MODEL_STRATEGY.SUPPLIER_DISCOVERY,

    // Research tasks -> Flash Light (only for data processing)
    'web_scraping': AI_MODEL_STRATEGY.RESEARCH,
    'data_extraction': AI_MODEL_STRATEGY.RESEARCH,
    'regulatory_research': AI_MODEL_STRATEGY.RESEARCH,

    // Analysis tasks -> Haiku
    'market_analysis': AI_MODEL_STRATEGY.ANALYSIS,
    'feasibility_analysis': AI_MODEL_STRATEGY.ANALYSIS,
    'crisis_analysis': AI_MODEL_STRATEGY.ANALYSIS,

    // Customer-facing -> Sonnet 3.5
    'final_recommendations': AI_MODEL_STRATEGY.PREMIUM,
    'customer_reports': AI_MODEL_STRATEGY.PREMIUM,
    'expert_validation': AI_MODEL_STRATEGY.PREMIUM,

    // Classification -> Custom agent
    'hs_classification': AI_MODEL_STRATEGY.CLASSIFICATION,
    'tariff_analysis': AI_MODEL_STRATEGY.CLASSIFICATION
  };

  return taskMappings[taskType] || AI_MODEL_STRATEGY.ANALYSIS;
}

/**
 * Cost estimates per task type
 */
export const COST_ESTIMATES = {
  supplier_discovery: "$0.50-1.00", // Sonnet 3.5 (TESTED: Required for quality)
  market_analysis: "$0.10-0.30",    // Haiku
  final_report: "$0.50-1.00",       // Sonnet 3.5
  hs_classification: "$0.20-0.40",  // Custom agent
  data_processing: "$0.01-0.05"     // Flash Light (limited use cases)
};

/**
 * Quality assurance strategy
 */
export const QUALITY_STRATEGY = {
  research_validation: "Human expert validates all AI research findings",
  cost_optimization: "Use cheapest model that meets quality threshold",
  escalation_path: "Upgrade to premium model if initial results inadequate",
  human_oversight: "Jorge/Cristina validate all customer deliverables",

  // Test-based decisions
  flash_light_findings: {
    tested_date: "2025-09-27",
    supplier_discovery_test: "FAILED - 0 suppliers found vs Sonnet 5 suppliers",
    decision: "Keep Sonnet 3.5 for supplier discovery despite 48x cost increase",
    business_justification: "$0.50-1.00 per query acceptable for $500 service (0.1-0.2% revenue)",
    quality_threshold: "Professional services require reliable supplier data for Jorge validation"
  },

  future_testing: "Re-test Flash Light quarterly as model improves",
  cost_vs_quality: "Quality takes precedence for customer-facing professional services"
};