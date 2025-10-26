/**
 * SKILL DEFINITIONS
 * Configuration and input/output schemas for all 6 Skills
 *
 * Each Skill definition includes:
 * - skillId: Unique identifier
 * - description: What the Skill does
 * - inputSchema: Expected input format
 * - outputSchema: Expected output format
 * - purpose: Business use case
 */

export const USMCA_QUALIFICATION_ANALYZER = {
  skillId: 'usmca-qualification-analyzer',
  name: 'USMCA Qualification Analyzer',
  description: 'Analyzes USMCA qualification status with regional content calculation, de minimis rule application, and preference criterion assignment',
  purpose: 'Core tariff analysis - determines if products qualify for USMCA preferences',

  inputSchema: {
    company_name: 'string (required)',
    company_country: 'string (required) - Must be US, CA, or MX',
    destination_country: 'string (required) - Must be US, CA, or MX',
    industry_sector: 'string (required) - Electronics, Automotive, Machinery, Chemicals, Textiles',
    industry_rvc_threshold: 'number (required) - RVC % required for qualification (60-75%)',
    components: 'array of {hs_code, description, origin_country, value_percentage, value_usd} (required)',
    trade_volume: 'number (optional) - Annual trade volume in USD for cost calculations'
  },

  outputSchema: {
    qualified: 'boolean - USMCA qualification status',
    rvc_percentage: 'number - Calculated regional value content',
    north_american_content: 'number - Percentage of NA-origin content',
    non_north_american_content: 'number - Percentage of non-NA content',
    preference_criterion: 'string - A, B, C, or D (only if qualified=true)',
    de_minimis_applied: 'boolean - Whether 10% de minimis rule was used',
    analysis: 'object - {threshold_value, calculation_method, qualifying_components, non_qualifying_reason}',
    recommendations: 'array of strings - Strategic improvements to increase RVC if below threshold'
  },

  example: {
    input: {
      company_name: 'TechFlow Electronics',
      company_country: 'US',
      destination_country: 'US',
      industry_sector: 'Electronics',
      industry_rvc_threshold: 65,
      components: [
        {hs_code: '8542.31.00', description: 'Microprocessor', origin_country: 'CN', value_percentage: 35, value_usd: 2975000},
        {hs_code: '8517.62.00', description: 'Circuit Board Assembly', origin_country: 'US', value_percentage: 65, value_usd: 5525000}
      ],
      trade_volume: 8500000
    },
    output: {
      qualified: true,
      rvc_percentage: 82.5,
      north_american_content: 82.5,
      non_north_american_content: 17.5,
      preference_criterion: 'B',
      de_minimis_applied: false,
      analysis: {
        threshold_value: 65,
        calculation_method: 'Transaction value method with weighted origin scoring',
        qualifying_components: ['8517.62.00 - Circuit Board Assembly (US origin, 65%)'],
        why_qualified: 'Combined NA content (82.5%) exceeds threshold (65%). Preference Criterion B applies.'
      },
      recommendations: []
    }
  }
};

export const SECTION301_IMPACT_CALCULATOR = {
  skillId: 'section301-impact-calculator',
  name: 'Section 301 Impact Calculator',
  description: 'Calculates Section 301 tariff burden on China-origin components and ROI of Mexico nearshoring',
  purpose: 'Supply chain risk analysis - identify policy exposure and optimize sourcing',

  inputSchema: {
    destination_country: 'string (required) - US, CA, or MX',
    components: 'array of {hs_code, origin_country, value_usd, section_301_rate (optional)} (required)',
    trade_volume: 'number (required) - Annual trade volume in USD',
    company_industry: 'string (optional) - For Mexico sourcing lookup'
  },

  outputSchema: {
    has_section301_exposure: 'boolean - Whether product is subject to Section 301',
    exposed_components: 'array - {hs_code, description, origin_country, annual_volume_usd, section_301_rate, annual_burden}',
    total_annual_section301_burden: 'number - Total Section 301 tariff cost per year',
    policy_risk: 'string - Description of policy risk (rate can change with 30-day notice)',
    mexico_sourcing: {
      available: 'boolean - Can be sourced from Mexico',
      estimated_cost_increase: 'number - Additional input cost % (typically 1-3%)',
      annual_sourcing_cost: 'number - Dollar cost of switching suppliers',
      payback_months: 'number - How many months to recoup switching costs via Section 301 savings',
      recommendation: 'string - Specific action (switch supplier, trial shipment, gradual migration)'
    },
    strategic_options: 'array of {option, cost_impact, benefit, timeline, payback_months}'
  },

  example: {
    input: {
      destination_country: 'US',
      components: [
        {hs_code: '8542.31.00', origin_country: 'CN', value_usd: 2975000, section_301_rate: 0.25}
      ],
      trade_volume: 8500000,
      company_industry: 'Electronics'
    },
    output: {
      has_section301_exposure: true,
      exposed_components: [
        {
          hs_code: '8542.31.00',
          description: 'Microprocessor',
          origin_country: 'CN',
          annual_volume_usd: 2975000,
          section_301_rate: 0.25,
          annual_burden: 743750
        }
      ],
      total_annual_section301_burden: 743750,
      policy_risk: 'Section 301 rates can change with 30-day notice and have increased from 12.5% to 25% since 2018',
      mexico_sourcing: {
        available: true,
        estimated_cost_increase: 0.02,
        annual_sourcing_cost: 169500,
        payback_months: 2.7,
        recommendation: 'Switch to Mexican PCB supplier - 3-month ROI with tariff insulation'
      },
      strategic_options: [
        {
          option: 'Maintain China sourcing',
          cost_impact: '$743,750/year Section 301 burden',
          benefit: null,
          timeline: 'Immediate',
          payback_months: null
        },
        {
          option: 'Switch to Mexico supplier',
          cost_impact: '+$169,500/year (additional 2% input cost)',
          benefit: 'Eliminates $743,750 Section 301, qualifies for USMCA, increases RVC to 92%',
          timeline: '4-6 weeks for supplier qualification',
          payback_months: 2.7
        }
      ]
    }
  }
};

export const TARIFF_ENRICHMENT_ENGINE = {
  skillId: 'tariff-enrichment-engine',
  name: 'Tariff Enrichment Engine',
  description: 'Batch enriches components with complete tariff data from database cache',
  purpose: 'Efficient tariff lookups - single call to enrich multiple components',

  inputSchema: {
    components: 'array of {hs_code, description, origin_country, value_percentage, value_usd} (required)',
    destination_country: 'string (required) - US, CA, or MX',
    cache_lookup_required: 'boolean (optional, default=true) - Whether to query database cache',
    include_confidence: 'boolean (optional, default=true) - Include AI confidence scores'
  },

  outputSchema: {
    enriched_components: 'array of complete tariff objects',
    cache_hit_count: 'number - How many components were cached vs requiring API call',
    cache_hit_rate: 'number - Percentage of successful cache hits',
    total_mfn_rate: 'number - Average MFN rate across all components',
    total_usmca_rate: 'number - Average USMCA rate across all components',
    enrichment_summary: 'string - Summary of enrichment success/failures'
  },

  example: {
    input: {
      components: [
        {hs_code: '8542.31.00', description: 'Microprocessor', origin_country: 'CN', value_percentage: 35, value_usd: 2975000}
      ],
      destination_country: 'US',
      cache_lookup_required: true,
      include_confidence: true
    },
    output: {
      enriched_components: [
        {
          hs_code: '8542.31.00',
          description: 'Microprocessor',
          origin_country: 'CN',
          value_usd: 2975000,
          value_percentage: 35,
          mfn_rate: 0.068,
          base_mfn_rate: 0.068,
          section_301: 0.25,
          section_232: 0,
          total_rate: 0.318,
          usmca_rate: 0.068,
          savings_percentage: 0.7949,
          policy_adjustments: ['Section 301 China Tariffs'],
          ai_confidence: 0.92,
          cache_source: 'database',
          freshness: 'current'
        }
      ],
      cache_hit_count: 1,
      cache_hit_rate: 1.0,
      total_mfn_rate: 0.068,
      total_usmca_rate: 0.068,
      enrichment_summary: 'Successfully enriched 1/1 components from database cache'
    }
  }
};

export const HS_CODE_CLASSIFIER = {
  skillId: 'hs-code-classifier',
  name: 'HS Code Classifier',
  description: 'Classifies products to HS codes with confidence scoring and alternative classifications',
  purpose: 'Product classification - maps product descriptions to tariff codes',

  inputSchema: {
    product_description: 'string (required) - Detailed product description',
    industry_sector: 'string (optional) - Electronics, Automotive, etc.',
    company_type: 'string (optional) - Manufacturer, Importer, Retailer',
    unit_value: 'number (optional) - Unit cost in USD for guidance'
  },

  outputSchema: {
    primary_hs_code: 'string - Most likely HS code (10 digits)',
    primary_description: 'string - Official tariff description for this HS code',
    confidence_score: 'number - 0.0-1.0 confidence in classification',
    alternative_codes: 'array - {hs_code, description, confidence, reasoning}',
    key_characteristics: 'array of strings - Features that drove this classification',
    classification_reasoning: 'string - Detailed explanation of classification logic',
    requires_human_review: 'boolean - Flag if confidence < 0.8 for manual review'
  },

  example: {
    input: {
      product_description: 'Integrated circuit microprocessor, single-core, 64-bit architecture, used in consumer electronics',
      industry_sector: 'Electronics',
      company_type: 'Manufacturer'
    },
    output: {
      primary_hs_code: '8542.31.00',
      primary_description: 'Processors and controllers, other than those of heading 8521, with more than 10,000 transistors',
      confidence_score: 0.94,
      alternative_codes: [
        {hs_code: '8542.39.00', description: 'Other electronic integrated circuits', confidence: 0.05, reasoning: 'Less specific but possible'}
      ],
      key_characteristics: ['Integrated circuit', 'Microprocessor', 'Electronic component', 'Semiconductor'],
      classification_reasoning: 'Product is a discrete processor IC with >10k transistors, clearly falling under 8542.31.00',
      requires_human_review: false
    }
  }
};

export const POLICY_IMPACT_ANALYZER = {
  skillId: 'policy-impact-analyzer',
  name: 'Policy Impact Analyzer',
  description: 'Identifies which tariff policies affect user\'s specific products and calculates financial impact',
  purpose: 'Risk identification - determine policy exposure per product',

  inputSchema: {
    user_components: 'array of {hs_code, origin_country, value_usd, destination_country}',
    user_industry: 'string - Industry sector',
    user_destination: 'string - Destination country',
    available_policies: 'array of {policy_name, affected_origins, affected_hs_codes} (optional)',
    annual_trade_volume: 'number (optional) - For financial impact calculation'
  },

  outputSchema: {
    applicable_policies: 'array - Policies affecting this user',
    impact_ranking: 'array - Policies ranked by financial impact',
    total_policy_impact: 'number - Combined annual cost of all applicable policies',
    strategic_options: 'array - Mitigation strategies per policy'
  },

  example: {
    input: {
      user_components: [
        {hs_code: '8542.31.00', origin_country: 'CN', value_usd: 2975000, destination_country: 'US'}
      ],
      user_industry: 'Electronics',
      user_destination: 'US',
      annual_trade_volume: 8500000
    },
    output: {
      applicable_policies: [
        {
          policy: 'Section 301 Tariffs',
          severity: 'CRITICAL',
          description: 'Additional 25% tariff on China-origin goods entering US',
          affected_components: ['8542.31.00 (Microprocessor)'],
          annual_impact_usd: 743750
        }
      ],
      impact_ranking: [
        {policy: 'Section 301 Tariffs', annual_impact_usd: 743750, recommendation: 'Switch to Mexico supplier'}
      ],
      total_policy_impact: 743750,
      strategic_options: [
        {
          policy: 'Section 301',
          option: 'Mexico nearshoring',
          cost: '+$169,500/year',
          benefit: 'Save $743,750 Section 301 + qualify USMCA',
          timeline: '4-6 weeks'
        }
      ]
    }
  }
};

export const CERTIFICATE_VALIDATOR = {
  skillId: 'certificate-validator',
  name: 'Certificate Validator',
  description: 'Validates certificate data completeness and compliance before PDF generation',
  purpose: 'Quality assurance - ensure all required fields are present and valid',

  inputSchema: {
    company: '{name, country, address, contact_person} (required)',
    components: 'array of enriched components (required)',
    tariff_analysis: '{qualified, rvc_percentage, preference_criterion} (required)',
    destination_country: 'string (required)'
  },

  outputSchema: {
    is_valid: 'boolean - Certificate can be generated',
    validation_errors: 'array of {field, error, severity} - Critical issues blocking generation',
    validation_warnings: 'array of {field, warning, suggestion} - Non-blocking issues to address',
    completeness_score: 'number - 0-100% of required fields present',
    ready_for_generation: 'boolean - safe to generate PDF'
  },

  example: {
    input: {
      company: {name: 'TechFlow Electronics', country: 'US', address: '123 Main St', contact_person: 'John Doe'},
      components: [
        {hs_code: '8542.31.00', description: 'Microprocessor', mfn_rate: 0.068, usmca_rate: 0.068}
      ],
      tariff_analysis: {qualified: true, rvc_percentage: 82.5, preference_criterion: 'B'},
      destination_country: 'US'
    },
    output: {
      is_valid: true,
      validation_errors: [],
      validation_warnings: [],
      completeness_score: 100,
      ready_for_generation: true
    }
  }
};

export const ALL_SKILLS = [
  USMCA_QUALIFICATION_ANALYZER,
  SECTION301_IMPACT_CALCULATOR,
  TARIFF_ENRICHMENT_ENGINE,
  HS_CODE_CLASSIFIER,
  POLICY_IMPACT_ANALYZER,
  CERTIFICATE_VALIDATOR
];

export default {
  USMCA_QUALIFICATION_ANALYZER,
  SECTION301_IMPACT_CALCULATOR,
  TARIFF_ENRICHMENT_ENGINE,
  HS_CODE_CLASSIFIER,
  POLICY_IMPACT_ANALYZER,
  CERTIFICATE_VALIDATOR,
  ALL_SKILLS
};
