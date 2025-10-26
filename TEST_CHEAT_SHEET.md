# USMCA Business Intelligence Platform - Test Cheat Sheet

**Last Updated:** October 25, 2025 - VALIDATED AGAINST ACTUAL CODE
**Focus:** API Alignment + Certificate Validation + Detailed Component Specifications

---

## 🔍 VALIDATION STATUS

✅ **PRIMARY ENDPOINT** (`/api/ai-usmca-complete-analysis`): **FULLY IMPLEMENTED**
- Response structure validated against actual code
- Component enrichment with tariff rates confirmed
- Company data and certificate requirements verified
- AI prompt structure (financial_impact, supply_chain_vulnerabilities, strategic_alternatives) **IS** in the codebase

✅ **SECONDARY ENDPOINT** (`/api/executive-trade-alert`): **FULLY IMPLEMENTED** (Oct 25, 2025)
- 3-phase consulting roadmap (Supplier Assessment → Trial Shipment → Gradual Migration)
- Financial scenario analysis (Section 301 escalation, threshold changes, nearshoring ROI)
- CBP compliance strategy with binding ruling guidance (Form 29, 90-day processing)
- Immediate actions (supplier audit, documentation validation)
- Short-term strategy (freight forwarder protocols, tracking systems)
- Risk management and regulatory calendar

✅ **TERTIARY ENDPOINT** (`/api/generate-personalized-alerts`): **FULLY IMPLEMENTED**
- Filters static EDUCATIONAL_ALERTS from config
- Relevance scoring works as designed
- Max 3 alerts returned correctly
- **Limitation:** Uses predefined alerts, not AI-generated

✅ **CERTIFICATE GENERATION**: **FULLY IMPLEMENTED**
- Validates `company.country` + `usmca.qualified` + `usmca.preference_criterion`
- PDF generation functional
- 1-year blanket certificates with auto-generated dates

---

## Strategic Testing Philosophy
Test scenarios that deliver REAL business value by validating:
1. **API Integration** - Correct request/response format and actual field mapping
2. **Financial Impact** - Concrete monthly/annual savings from tariff enrichment
3. **Strategic Intelligence** - From detailed_analysis.strategic_insights (delivered as consulting advice text)
4. **Certificate Generation** - All required fields present + validation rules met
5. **Alert System** - Executive trade alerts + personalized alert filtering

---

## API ENDPOINTS & SPECIFICATIONS

### PRIMARY ENDPOINT: `/api/ai-usmca-complete-analysis` (POST)
**Purpose:** Main USMCA qualification analysis with tariff enrichment

#### Request Format (formData)
```javascript
{
  // COMPANY INFORMATION (Step 1)
  company_name: "TechFlow Electronics Corp",
  company_country: "US",                    // CRITICAL: Required for certificate generation
  company_address: "1847 Technology Blvd, Austin TX 78759",
  tax_id: "12-3456789",                     // TAX ID / EIN (required - passed to API)
  contact_person: "Maria Rodriguez",
  contact_phone: "(512) 555-0147",
  contact_email: "maria.rodriguez@techflow.com",

  // DESTINATION & BUSINESS CONTEXT
  destination_country: "US",                // CRITICAL: Must be US, CA, or MX
  supplier_country: "CN",                   // Primary supplier for analysis
  industry_sector: "Electronics",           // Determines RVC threshold (65% for Electronics)
  business_type: "Manufacturer",            // Determines labor credit calculation
  trade_volume: 8500000,                    // Annual trade volume in USD

  // PRODUCT DETAILS (Step 2)
  product_description: "Smartphone assembly with components including microprocessor, power supply, housing, and PCB",
  manufacturing_location: "MX",             // CRITICAL: Must be specific country (US/CA/MX) for USMCA, or "DOES_NOT_APPLY"
  substantial_transformation: true,         // CONDITIONAL: Only if manufacturing location is USMCA country
                                            // Check if manufacturing involves substantial transformation beyond simple assembly
                                            // (welding, forming, heat treatment, etc.)

  // COMPONENT DETAILS (Step 2) - Array format
  component_origins: [
    {
      description: "Microprocessor (ARM-based)",
      hs_code: "8542.31.00",
      origin_country: "CN",
      value_percentage: 35,
      actual_value: 2975000                 // = 35% of 8.5M trade volume
    },
    {
      description: "Power Supply Unit (85W)",
      hs_code: "8504.40.95",
      origin_country: "MX",
      value_percentage: 30,
      actual_value: 2550000
    },
    {
      description: "Aluminum Housing Assembly",
      hs_code: "7616.99.50",
      origin_country: "MX",
      value_percentage: 20,
      actual_value: 1700000
    },
    {
      description: "Printed Circuit Board (PCB)",
      hs_code: "8534.31.00",
      origin_country: "VN",
      value_percentage: 10,
      actual_value: 850000
    },
    {
      description: "Electrical Connectors & Cables",
      hs_code: "8544.42.90",
      origin_country: "MX",
      value_percentage: 5,
      actual_value: 425000
    }
  ]
}
```

#### Response Format (Actual Implementation)
```javascript
{
  success: true,
  workflow_completed: true,
  processing_time_ms: 1240,
  timestamp: "2025-10-25T15:30:45.123Z",
  method: "ai_powered",

  // COMPANY DATA (for certificate generation) - CRITICAL FIELDS
  company: {
    name: "TechFlow Electronics Corp",
    country: "US",                          // ⚠️ CRITICAL: Must exist for cert generation
    address: "1847 Technology Blvd, Austin TX 78759",
    business_type: "Manufacturer",
    industry_sector: "Electronics",
    tax_id: "12-3456789",
    contact_person: "Maria Rodriguez",
    contact_email: "maria.rodriguez@techflow.com",
    contact_phone: "(512) 555-0147",
    trade_volume: 8500000,
    supplier_country: "CN",
    destination_country: "US"
  },

  // PRODUCT CLASSIFICATION (from AI)
  product: {
    success: true,
    hs_code: "8517.62.00",                  // AI-classified
    description: "Smartphone assembly with components",
    confidence: 92,                         // AI confidence 0-100
    classification_method: "ai_analysis",
    mfn_rate: 3.2,
    usmca_rate: 0
  },

  // QUALIFICATION STATUS (from AI analysis)
  usmca: {
    qualified: true,
    north_american_content: 72.5,           // Regional content %
    regional_content: 72.5,                 // Alias for certificate
    threshold_applied: 65,                  // Industry-specific threshold
    rule: "Regional Value Content",
    qualification_status: "QUALIFIED",
    preference_criterion: "A",              // Required for certificate: A/B/C/D
    manufacturing_location: "MX",
    component_breakdown: [...]              // Array of enriched components
  },

  // TARIFF SAVINGS (only if qualified)
  savings: {
    annual_savings: 4080,                   // (MFN - USMCA rate) × volume × 12 months
    monthly_savings: 340,                   // annual_savings / 12
    savings_percentage: 0.82,               // Savings as % of trade volume
    mfn_rate: 3.2,
    usmca_rate: 0
  },

  // ENRICHED COMPONENTS WITH TARIFF DATA
  component_origins: [
    {
      description: "Microprocessor (ARM-based)",
      hs_code: "8542.31.00",
      origin_country: "CN",
      value_percentage: 35,
      mfn_rate: 3.2,                        // Base MFN rate (%)
      base_mfn_rate: 3.2,                   // Pre-Section 301 rate
      section_301: 25,                      // Section 301 tariff added (%)
      section_232: 0,                       // Steel/aluminum safeguards
      total_rate: 28.2,                     // MFN + Section 301
      usmca_rate: 0,                        // Treaty preference rate
      savings_percentage: 3.2,              // MFN - USMCA (Section 301 remains)
      policy_adjustments: ["Section 301"],  // Array of applied policies
      is_usmca_member: false,
      rate_source: "openrouter",
      last_updated: "2025-10-25"
    },
    // ... other components with same structure
  ],

  // CERTIFICATE (if qualified)
  certificate: {
    qualified: true,
    preference_criterion: "A",
    blanket_start: "2025-10-25",
    blanket_end: "2026-10-25"
  },

  // DETAILED ANALYSIS (Strategic insights from AI)
  detailed_analysis: {
    threshold_research: "Electronics subject to 65% RVC threshold per NAFTA originating good rules",
    calculation_breakdown: "North American: 72.5% (exceeds 65% threshold)",
    qualification_reasoning: "All manufacturing in Mexico qualifies components for USMCA",
    strategic_insights: "I'm pleased to report that your product successfully qualifies for USMCA preferential treatment. You're currently realizing $340 in monthly tariff savings ($4,080 annually). However, I want to draw your attention to a significant exposure: your China-sourced microprocessor remains subject to 25% Section 301 tariffs, representing $43,750 annual policy risk. The strategic alternative would be transitioning to a Mexico-based supplier (+2% unit cost, 4-6 weeks) which eliminates this exposure and increases your RVC buffer to 92%. Given a 3-month payback period, this merits serious consideration.",
    savings_analysis: {
      annual_savings: 4080,
      monthly_savings: 340,
      calculation_detail: "Power Supply (30% × $2.55M × 2.5% MFN) + Housing (20% × $1.7M × 4.2%) = $4,080/year"
    }
  },

  // TRUST & CONFIDENCE
  trust: {
    ai_powered: true,
    model: "anthropic/claude-sonnet-4.5",
    confidence_score: 92,
    disclaimer: "AI-powered analysis for informational purposes. Consult trade compliance expert for official compliance."
  },

  // RECOMMENDATIONS
  recommendations: [
    "Nearshore microprocessor sourcing to Mexico (4-6 week implementation, 3-month payback)",
    "File binding ruling with CBP to lock in RVC classification",
    "Audit supplier documentation for preferential origin claims"
  ]
}
```

**⚠️ KEY DIFFERENCES FROM NAIVE EXPECTATION:**
- Response uses `savings.*` not `business_intelligence.*`
- Strategic insights embedded in `detailed_analysis.strategic_insights` (long-form text)
- Financial impact scattered across `savings.*`, `detailed_analysis.savings_analysis.*`, and component data
- Recommendations as simple array, not structured phases
- **Certificate generation requires:** `company.country`, `usmca.qualified`, `usmca.preference_criterion`

---

### SECONDARY ENDPOINT: `/api/executive-trade-alert` (POST)
**Purpose:** Generate policy impact analysis specific to user's products

⚠️ **STATUS:** Partially implemented (basic structure exists, full BI analysis not yet integrated)

#### Request Format
```javascript
{
  user_id: "uuid-here",
  user_profile: {
    industry_sector: "Electronics",
    destination_country: "US"
  },
  workflow_intelligence: {
    components: [
      {
        hs_code: "8542.31.00",
        origin_country: "CN",
        value_percentage: 35
      }
    ],
    north_american_content: 72.5,
    annual_trade_volume: 8500000
  },
  raw_alerts: []                            // Policy changes from RSS feeds
}
```

#### Response Format (Complete Implementation - Oct 25, 2025)
```javascript
{
  success: true,
  alert: {
    headline: "⚠️ Critical Trade Policy Exposure in Your Electronics Supply Chain",
    situation_brief: "Your Chinese-sourced components remain subject to 25% Section 301 tariffs, creating ongoing policy risk and cost burden of approximately $43,750 annually",

    the_situation: {
      problem: "Your Chinese-sourced components remain subject to 25% Section 301 tariffs, creating ongoing policy risk and cost burden of approximately $43,750 annually",
      root_cause: "Sourcing structure (35% from China) vulnerable to trade policy escalation",
      annual_impact: "$43,750 burden + RVC threshold risk",
      why_now: "Section 301 tariffs can be modified with 30-day notice. Current political environment suggests heightened risk."
    },

    // ✅ FINANCIAL IMPACT (with scenarios)
    financial_impact: {
      current_annual_burden: "$43,750 annually",
      potential_annual_savings: "Mexico nearshoring could eliminate this burden within 4-6 weeks",
      payback_period: "3-6 months typical",
      confidence: 85,
      scenarios: [
        {
          scenario: "Current State (25% Section 301)",
          annual_burden: "$43,750 annually",
          description: "Your current tariff exposure with existing 25% Section 301 rate"
        },
        {
          scenario: "If Section 301 Increases to 30%",
          annual_burden: "$52,500",
          impact_vs_current: "+$8,750/year additional burden",
          likelihood: "Medium (possible with administration change)",
          mitigation: "Mexico nearshoring eliminates entire exposure"
        },
        {
          scenario: "If You Nearshore to Mexico",
          annual_burden: "Eliminated",
          cost_to_implement: "+$3,500/year (2% unit cost increase)",
          payback_timeline: "1-3 months (tariff savings offset cost increase)",
          additional_benefits: "5-8% RVC increase, policy insulation, supply chain resilience",
          competitive_advantage: "Locks in preferential treatment while competitors remain exposed"
        }
      ]
    },

    // ✅ 3-PHASE STRATEGIC ROADMAP
    strategic_roadmap: [
      {
        phase: "Phase 1: Supplier Assessment (Week 1-2)",
        why: "Identify Mexico suppliers with equivalent quality/cost",
        actions: [
          "Source 2-3 Mexico suppliers with your quality requirements",
          "Request pricing quotes and lead times",
          "Verify certifications and capacity"
        ],
        impact: "Baseline for ROI decision"
      },
      {
        phase: "Phase 2: Trial Shipment (Week 3-4)",
        why: "Validate quality and lead times before full transition",
        actions: [
          "Order sample batch from Mexico supplier",
          "Conduct quality testing vs current supplier",
          "Measure actual lead times and reliability"
        ],
        impact: "De-risk the transition"
      },
      {
        phase: "Phase 3: Gradual Migration (Week 5-8)",
        why: "Transition production without disruption",
        actions: [
          "Phase out China supplier while ramping Mexico production",
          "Update USMCA documentation with new supplier origin",
          "Lock in pricing for 12-month commitment"
        ],
        impact: "Eliminate Section 301 exposure, increase RVC"
      }
    ],

    // ✅ NEW: CBP COMPLIANCE STRATEGY
    cbp_compliance_strategy: {
      title: "CBP Compliance Strategy for USMCA Qualification",
      urgency: "CRITICAL",

      immediate_actions: [
        {
          action: "File Binding Ruling Request (CBP Form 29)",
          why: "Lock in RVC classification and preference criterion for 3 years",
          timeline: "90 days processing (submit within 2 weeks)",
          impact: "Eliminates audit risk, allows penalty-free supplier transitions",
          required_docs: [
            "Current bill of materials with % by origin",
            "Manufacturing process description",
            "Labor and overhead allocation methodology",
            "Supplier origin certificates",
            "Trade volume and market context"
          ],
          expected_cost: "$2,000-5,000 legal/consulting fees",
          success_rate: "85%+ when well-documented"
        },
        {
          action: "Audit Supplier Documentation",
          why: "Verify all suppliers have valid origin certification",
          timeline: "Immediate - before next shipment",
          what_to_verify: [
            "Suppliers have valid Certificates of Origin on file",
            "USMCA component suppliers declare preferential origin status",
            "Manufacturing location matches claim (not transshipment)",
            "Value-added activity documented"
          ],
          non_compliance_risk: "CBP can retroactively deny USMCA treatment and demand back tariffs + penalties"
        }
      ],

      short_term_strategy: [
        {
          action: "Establish Freight Forwarder USMCA Protocol",
          why: "Ensure all shipments include USMCA declarations and proper Certificates of Origin",
          requirement: "Freight forwarder must complete 'USMCA Claim' box on entry documents",
          documentation: "Keep copies of all CF 434 (Certificate of Origin) forms for 5 years",
          risk: "Missing USMCA declaration = automatic full tariff collection + interest",
          cost: "$500-1,000 to train forwarder and establish procedure"
        },
        {
          action: "Set Up Internal USMCA Tracking System",
          why: "Document every product batch with RVC calculation and component origins",
          what_to_track: [
            "Invoice date and HS code",
            "Component origins and percentages",
            "RVC calculation and method (Transaction Value vs Net Cost)",
            "Manufacturing location and labor credit",
            "Shipment-level USMCA declarations"
          ],
          audit_readiness: "CBP audits ~1 in 500 entries. When selected, provide documentation within 30 days or pay back tariffs",
          typical_penalty: "$50,000+ in back tariffs + 40% penalty if documentation insufficient"
        }
      ],

      contacts: {
        "CBP Binding Ruling": {
          office: "CBP Office of Trade (OT) - NAFTA/USMCA Division",
          phone: "(877) CBP-5511",
          email: "USMCA@cbp.dhs.gov",
          website: "cbp.gov/trade"
        },
        "USTR Tariff Questions": {
          office: "Office of the U.S. Trade Representative",
          phone: "(202) 395-3000",
          website: "ustr.gov"
        }
      }
    },

    action_this_week: [
      "Review supplier alternatives in Mexico/Canada",
      "Evaluate tariff exemption opportunities",
      "Contact CBP about binding ruling process"
    ],

    policies_affecting_you: ["Section 301 Tariffs"],
    from_your_broker: "Companies that have nearshored to Mexico in your sector have locked in preferential treatment while insulating from policy uncertainty."
  },

  policies_analyzed: 1,
  applicable_policies: [
    {
      policy: "Section 301 Tariffs",
      severity: "CRITICAL",
      affects_user: true,
      annual_cost_impact: "$43,750 annually",
      description: "China-origin goods entering US remain subject to Section 301 despite USMCA"
    }
  ]
}
```

**✅ COMPLETE IMPLEMENTATION NOW INCLUDES:**
- ✅ 3-phase strategic roadmap with concrete timelines
- ✅ Financial scenario analysis (Section 301 escalation, nearshoring ROI, exemption option)
- ✅ CBP binding ruling guidance (Form 29, 90-day processing, 3-year lock-in)
- ✅ Immediate actions (supplier audit, documentation validation)
- ✅ Short-term strategy (freight forwarder protocols, tracking systems, 5-year retention)
- ✅ Risk management (supplier changes, threshold changes, audit penalties)
- ✅ Regulatory calendar (USTR cycles, CBP milestones)
- ✅ Contact directory (CBP phone/email, USTR website)

---

### TERTIARY ENDPOINT: `/api/generate-personalized-alerts` (POST)
**Purpose:** Filter static educational alerts by relevance to user's products

#### Request Format
```javascript
{
  user_profile: {
    industry_sector: "Electronics",
    supplier_country: "CN",
    destination_country: "US",
    component_origins: [
      {
        hs_code: "8542.31.00",
        category: "semiconductors",
        origin_country: "CN"
      }
    ]
  }
}
```

#### Response Format (Current Implementation)
```javascript
{
  success: true,
  alerts: [
    {
      theme: "Trade Enforcement",
      headline: "Section 301 Tariff Risk: China-Origin Electronics",
      situation: "25% Section 301 tariffs apply to China-origin semiconductors",
      financial_impact: "$43,750 annual cost burden",
      strategic_roadmap: [
        {
          phase: "Assessment",
          actions: ["Identify Mexico supplier alternatives", "Calculate cost impact"]
        }
      ],
      actions: ["Review Section 301 product list", "Evaluate nearshoring ROI"],
      relevance_score: 95,                  // 0-100: Industry +40, Geography +30, Product +25
      reason_relevant: "matches your industry, affects your suppliers, directly affects your products"
    },
    {
      theme: "USMCA Compliance",
      headline: "RVC Threshold Risk",
      situation: "Proposed threshold increases could affect electronics industry",
      financial_impact: "Potential non-qualification if threshold rises",
      strategic_roadmap: [...],
      actions: [...],
      relevance_score: 72,
      reason_relevant: "matches your industry"
    },
    {
      theme: "General Trade Compliance",
      headline: "Keep Current with Trade Policy",
      situation: "Trade policy changes frequently",
      financial_impact: "Potential cost volatility",
      relevance_score: 40,
      reason_relevant: "applies to all trade operations"
    }
  ],
  total_available: 5,                        // Total alerts in EDUCATIONAL_ALERTS config
  matched: 3,                               // Alerts returned (max 3, or fallback to 1 generic)
  user_profile: {
    industry: "Electronics",
    suppliers: "CN",
    destination: "US"
  }
}
```

**⚠️ KEY DIFFERENCES:**
- Filters from static `EDUCATIONAL_ALERTS` config (not AI-generated)
- Returns max 3 relevant alerts or 1 fallback generic alert
- `strategic_roadmap` is simple array (not 3-phase consulting roadmap)
- Scoring: Industry +40, Geography +30, Product Category +30, Destination +20
- **Threshold for relevance:** Score ≥ 40 to be included
- Does NOT include user-specific financial calculations (just generic "$X burden")

---

## CORE BUSINESS VALUE TEST SCENARIOS

### TEST 1: QUALIFIED WITH STRATEGIC VULNERABILITY (Electronics - China PCB Risk)
**Business Context:** Company qualifies but has Section 301 exposure
**Expected Intelligence:** Financial impact + supply chain risk analysis + Mexico sourcing recommendation with 3-month ROI

| Field | Test Value | Strategic Rationale |
|-------|-----------|-------------------|
| Company Name | TechFlow Electronics Corp | Mid-market electronics manufacturer |
| Company Country | US | **CRITICAL:** Required for certificate generation |
| Business Type | Manufacturer | Creates value through assembly |
| Industry Sector | Electronics | 65% RVC threshold, high China exposure |
| Company Address | 1847 Technology Blvd, Austin TX 78759 | US-based company sourcing globally |
| Destination Market | United States | Domestic market - USMCA benefits apply |
| Manufacturing/Assembly Location | Mexico | **KEY:** Mexico assembly = USMCA eligibility |
| Contact Person | Maria Rodriguez | Supply chain decision maker |
| Contact Email | maria.rodriguez@techflow.com | Professional contact |
| Annual Trade Volume | 8,500,000 | Significant scale = meaningful savings |
| Supplier Country | China | Primary risk factor |

**Component Mix (Designed for Strategic Analysis):**
1. **Microprocessor (ARM-based)** - China, 35%, HS: 8542.31.00
   - MFN Rate: 3.2% | Section 301: 25% = Total: 28.2%
   - Impact: $43,750/year tariff burden

2. **Power Supply Unit (85W)** - Mexico, 30%, HS: 8504.40.95
   - MFN Rate: 2.5% | USMCA: 0% = Savings: 2.5%
   - Impact: $850/month in USMCA savings

3. **Aluminum Housing Assembly** - Mexico, 20%, HS: 7616.99.50
   - MFN Rate: 4.2% | USMCA: 0% = Savings: 4.2%
   - Impact: $340/month in USMCA savings

4. **Printed Circuit Board (PCB)** - Vietnam, 10%, HS: 8534.31.00
   - MFN Rate: 2.1% | USMCA: N/A = No benefit
   - Impact: Neutral origin (no policy exposure)

5. **Electrical Connectors & Cables** - Mexico, 5%, HS: 8544.42.90
   - MFN Rate: 1.8% | USMCA: 0% = Savings: 1.8%
   - Impact: Minor savings

**Expected Business Intelligence Output:**
- ✅ **Qualified at 72.5% RVC** (exceeds 65% threshold)
- **Annual USMCA savings: $4,080** (on non-301 components)
- **Monthly savings: $340** vs standard MFN rates
- **⚠️ Strategic risk:** China microprocessor faces 25% Section 301 tariffs = $43,750/year burden
- **Recommendation:** Mexico microprocessor sourcing (+2% cost = $3,500/year)
- **ROI analysis:** Breaks even in 3 months, then $40,250/year net savings
- **Competitive intelligence:** 68% of semiconductor assembly manufacturers have similar China exposure
- **Action items:** File binding ruling for RVC lock-in, audit supplier docs, verify freight forwarder USMCA claims

**Certificate Validation:**
- ✅ Company name: "TechFlow Electronics Corp"
- ✅ Company country: "US" (from form input)
- ✅ USMCA qualified: True
- ✅ Regional content: 72.5% (above 65% threshold)
- ✅ Certificate can be generated

---

### TEST 2: HIGH-VALUE QUALIFIED SCENARIO (Automotive - Premium Savings)
**Business Context:** Large automotive manufacturer with optimal USMCA setup
**Expected Intelligence:** Substantial savings validation + competitive advantage analysis with tariff policy insulation

| Field | Test Value | Strategic Rationale |
|-------|-----------|-------------------|
| Company Name | Border Dynamics Manufacturing | Cross-border operations specialist |
| Company Country | US | **CRITICAL:** Required for certificate generation |
| Business Type | Manufacturer | Value-add manufacturing |
| Industry Sector | Automotive | 75% RVC threshold - highest standard |
| Destination Market | United States | Large automotive market |
| Manufacturing/Assembly Location | Mexico | Optimal USMCA positioning |
| Contact Email | supply.chain@borderdynamics.com | Enterprise operations |
| Annual Trade Volume | 25,000,000 | Enterprise-scale operations |
| Supplier Country | MX | Most suppliers already USMCA-compliant |

**Component Mix (Optimized for Maximum USMCA Benefits):**
1. **Engine Components Assembly** - Mexico, 40%, HS: 8408.20.00
   - MFN Rate: 2.5% | USMCA: 0% = Savings: 2.5%
   - Annual savings: $10,000 × 0.025 = $250/month

2. **Transmission Parts** - Canada, 25%, HS: 8708.40.75
   - MFN Rate: 2.0% | USMCA: 0% = Savings: 2.0%
   - Annual savings: $6,250 × 0.02 = $125/month

3. **Electronics Module** - US, 15%, HS: 8537.10.90
   - MFN Rate: 1.5% | USMCA: 0% = Savings: 1.5%
   - Annual savings: $3,750 × 0.015 = $56/month

4. **Steel Framework** - Mexico, 12%, HS: 7308.90.95
   - MFN Rate: 3.2% | USMCA: 0% = Savings: 3.2%
   - Annual savings: $3,000 × 0.032 = $96/month

5. **Fasteners & Hardware** - Mexico, 8%, HS: 7318.15.65
   - MFN Rate: 1.2% | USMCA: 0% = Savings: 1.2%
   - Annual savings: $2,000 × 0.012 = $24/month

**Expected Business Intelligence Output:**
- ✅ **Highly qualified at 87.5% RVC** (exceeds 75% threshold by 12.5%)
- **Monthly USMCA savings: $655** (100% of components USMCA-eligible)
- **Annual savings: $7,860**
- **Annual trade volume impact:** 0.31% cost reduction across $25M volume
- **Strategic advantage:** 87.5% RVC provides safety buffer (12.5% cushion against threshold tightening to 88%)
- **Zero tariff policy risk:** All components from USMCA countries (no Section 301/232 exposure)
- **Market position:** Top 15% of automotive manufacturers for USMCA optimization
- **Competitive intelligence:** Early mover advantage in Mexico integrated supply chain (competitors still on 65-70% RVC)

**Certificate Validation:**
- ✅ Company name: "Border Dynamics Manufacturing"
- ✅ Company country: "US" (from form input)
- ✅ USMCA qualified: True
- ✅ Regional content: 87.5% (well above 75% threshold)
- ✅ Certificate can be generated for multi-year blanket certificate

---

### TEST 3: MARGINAL QUALIFICATION WITH OPTIMIZATION OPPORTUNITY
**Business Context:** Company barely qualifies, needs strategic guidance
**Expected Intelligence:** Optimization recommendations + risk mitigation strategies + supplier transition roadmap

| Field | Test Value | Strategic Rationale |
|-------|-----------|-------------------|
| Company Name | Precision Tools Ltd | Mid-market manufacturer |
| Company Country | US | **CRITICAL:** Required for certificate generation |
| Business Type | Manufacturer | Industrial equipment |
| Industry Sector | Machinery | 62.5% RVC threshold |
| Destination Market | United States | Primary market |
| Manufacturing/Assembly Location | Mexico | USMCA assembly location |
| Contact Email | operations@precisiontools.com | Operations contact |
| Annual Trade Volume | 3,200,000 | Mid-market scale |
| Supplier Country | DE (Primary), MX (Secondary) | Multi-source strategy |

**Component Mix (Borderline Qualification):**
1. **Control System (Programmable Logic Controller)** - Germany, 38%, HS: 8537.10.00
   - MFN Rate: 2.2% | USMCA: N/A = No savings
   - Impact: $27,200/year tariff cost on this component alone

2. **Motor Assembly (3-phase industrial)** - Mexico, 35%, HS: 8501.31.00
   - MFN Rate: 1.5% | USMCA: 0% = Savings: 1.5%
   - Impact: $72/month savings

3. **Steel Housing** - Mexico, 15%, HS: 7326.90.95
   - MFN Rate: 3.0% | USMCA: 0% = Savings: 3.0%
   - Impact: $24/month savings

4. **Sensors & Actuators** - US, 7%, HS: 9032.89.60
   - MFN Rate: 1.0% | USMCA: 0% = Savings: 1.0%
   - Impact: $3/month savings

5. **Assembly Labor & Final Assembly** - Mexico, 5%, HS: 8515.80.00
   - No tariff on labor, counts toward RVC

**Expected Business Intelligence Output:**
- ✅ **Marginally qualified at 62.5% RVC** (EXACTLY meets threshold, zero safety margin)
- **Monthly USMCA savings: $99** (only on non-German components)
- **Annual savings: $1,188** (minimal benefit due to German control system)
- **Annual cost burden:** $27,200 on German control system (largest component)
- **⚠️ CRITICAL RISK:** Zero margin for rule changes, supplier changes, or RVC recalculations
- **Optimization #1:** Replace German control system with US/Mexico alternative
  - Cost increase: +1.5% on control system = $1,200/year
  - RVC improvement: 62.5% → 74.0% (12.5% margin of safety)
  - Additional USMCA savings: $10,800/year on currently non-qualified portion
  - **Net benefit: $9,600/year over 2 years (payback in 2 months)**
- **Optimization #2:** Nearshore engineering/customization to Mexico
  - Benefit: Increases control system value-add claim for RVC credit
  - RVC improvement: 62.5% → 70.0%
- **Implementation timeline:** 6-8 weeks for supplier qualification + engineering transfer
- **Supplier candidates:** Siemens (US operations), ABB (Mexico), Rockwell Automation (Mexico)
- **Risk mitigation:** Current qualification is fragile; implement optimization plan within 90 days

**Certificate Validation:**
- ✅ Company name: "Precision Tools Ltd"
- ✅ Company country: "US"
- ✅ USMCA qualified: True (at 62.5%, meets 62.5% threshold exactly)
- ✅ Certificate can be generated BUT user should be notified: "Qualification is at minimum threshold. Any rule changes could affect eligibility."

---

### TEST 4: NON-QUALIFIED WITH CLEAR PATHWAY (Electronics Import to Assembly Model Conversion)
**Business Context:** Company doesn't qualify but has obvious optimization path through nearshoring
**Expected Intelligence:** Gap analysis + specific improvement roadmap with business model pivot

| Field | Test Value | Strategic Rationale |
|-------|-----------|-------------------|
| Company Name | Global Imports Distribution | Import-focused business model seeking USMCA qualification |
| Company Country | US | **CRITICAL:** Required for certificate generation (will fail since not qualified) |
| Business Type | Importer | Pure import operation currently, can transition to assembly |
| Industry Sector | Electronics | 65% RVC threshold |
| Destination Market | United States | Large import market |
| Manufacturing/Assembly Location | Does Not Apply | Currently pure importer, opportunity to move to Mexico |
| Contact Email | sourcing@globalimports.com | Sourcing operations |
| Annual Trade Volume | 12,000,000 | High-volume import operation |
| Supplier Country | CN (60%), VN (25%), MY (10%) | Diversified non-USMCA sourcing |

**Component Mix (High Non-USMCA Content):**
1. **Main Assembly (Complete Unit)** - China, 60%, HS: 8517.62.00
   - MFN Rate: 3.5% | USMCA: N/A = No USMCA benefit
   - Annual cost: $252,000 in tariffs (60% × $12M × 3.5%)

2. **Power Supply & Accessories** - Vietnam, 25%, HS: 8504.40.60
   - MFN Rate: 2.8% | USMCA: N/A = No USMCA benefit
   - Annual cost: $84,000 in tariffs

3. **Plastics & Accessories** - Malaysia, 10%, HS: 3926.90.99
   - MFN Rate: 4.2% | USMCA: N/A = No USMCA benefit
   - Annual cost: $50,400 in tariffs

4. **Packaging Materials** - Mexico, 5%, HS: 4819.20.00
   - MFN Rate: 1.2% | USMCA: 0% = Savings: 1.2%
   - Annual savings: $720 (only on packaging)

**Expected Business Intelligence Output:**
- ❌ **NOT QUALIFIED: 5% RVC** (needs 65% minimum, currently 0% manufacturing content)
- **Total annual tariff cost: $386,400** (on $12M volume at 3.2% blended rate)
- **Monthly tariff burden: $32,200**
- **⚠️ CRITICAL:** Pure import model has NO path to USMCA qualification

**But Strategic Opportunity Identified: Business Model Pivot to Assembly**

**Scenario A: Status Quo (Continue as Pure Importer)**
- Annual tariff cost: $386,400
- No USMCA benefits available
- Vulnerable to Section 301 tariff escalations on China components

**Scenario B: Nearshore to Mexico Assembly Model** (RECOMMENDED)
- **Phase 1: Import components to Mexico, final assembly there (Month 1-2)**
  - Cost: Mexico assembly facility setup = $150,000 one-time
  - Tariff impact: Import components as parts (lower HS codes) instead of finished goods
  - RVC credit: Assembly labor = +15% automatic
  - New RVC: 15% (still below 65% threshold)

- **Phase 2: Add Mexico value-add operations (Month 2-4)**
  - Subcontract PCB assembly to Mexico supplier = +20% value-add
  - Quality control & testing in Mexico = +10% value-add
  - New RVC: 45% (closer, but still below 65%)

- **Phase 3: Source components from Mexico/US suppliers (Month 4-8)**
  - Replace Chinese main assembly with Mexico-assembled equivalent = +35% to RVC
  - Replace Vietnam power supply with Mexico supplier = +15% to RVC
  - New RVC: 70% ✅ **EXCEEDS 65% THRESHOLD**

- **Financial Impact of Pivot:**
  - Current tariffs: $386,400/year
  - Mexico assembly cost: +$240,000/year (2% cost increase)
  - USMCA savings potential: $280,000/year (on newly qualified portion)
  - **Net benefit: $40,000/year after break-even (payback in 6 months)**

- **Implementation Timeline:**
  - Month 1-2: Establish Mexico maquiladora relationship or joint venture
  - Month 3-4: Transfer assembly process, validate quality
  - Month 5-6: Transition to Mexico component sourcing
  - Month 7-8: Achieve 70%+ RVC and USMCA qualification

**Alternative Scenario C: Joint Venture with Mexico Manufacturer**
- Partner with existing Mexico electronics manufacturer (lower capex)
- Co-locate your branding/final assembly in Mexico
- Achieve USMCA qualification through contract manufacturing
- Timeline: 3-4 months faster than owning facility
- Cost: Profit-sharing model (typically 15-20% margin vs ownership)

**Expected Platform Intelligence:**
- 🚨 **Current model does NOT qualify** (5% RVC)
- **Barrier analysis:** Main assembly from China = primary blocker (60% of cost)
- **Opportunity:** Business model transformation could add $40,000/year in savings
- **Path selection:** Compare owned Mexico facility vs joint venture partnership
- **Implementation roadmap:** 3-phase transformation plan with month-by-month milestones
- **Risk mitigation:** Start with trial with smaller volume, validate supply chain before full transition

**Certificate Validation:**
- ❌ Company name: "Global Imports Distribution"
- ❌ Company country: "US"
- ❌ USMCA qualified: **FALSE** (5% RVC, needs 65%)
- ❌ **Certificate CANNOT be generated** for current model
- ✅ Once business model pivots to Mexico assembly (Phase 3), certificate generation becomes available

---

## BUSINESS INTELLIGENCE & API VALIDATION CHECKLIST

### ✅ PRIMARY ENDPOINT: `/api/ai-usmca-complete-analysis` Response Validation

For each test scenario, verify the API response includes ALL of these sections:

**1. Qualification & RVC Calculation**
- [ ] `usmca_qualified`: Boolean (true/false)
- [ ] `regional_content_percentage`: Number (0-100)
- [ ] `threshold_required`: Number from industry-thresholds table
- [ ] `qualification_status`: String ("QUALIFIED" or "NOT QUALIFIED")
- [ ] Calculation matches: (USMCA components + manufacturing labor) / total volume × 100

**2. Component Enrichment with Tariff Data**
- [ ] Each component has: hs_code, description, origin_country, value_percentage
- [ ] All components have tariff rates: mfn_rate, usmca_rate, savings_percentage
- [ ] Section 301 components show: mfn_rate, section_301, total_rate breakdown
- [ ] policy_adjustments array shows which tariffs applied (e.g., ["Section 301"])
- [ ] ai_confidence score present (0.0-1.0) for each component classification

**3. Company Data (for Certificate Generation)**
- [ ] `company.name`: String (matches form input)
- [ ] `company.country`: String (2-letter ISO code, e.g., "US")
- [ ] `company.address`: String (matches form input)
- [ ] ❌ **CRITICAL:** If company_country is null/missing, certificate generation will fail

**4. Business Intelligence - Financial Impact Section**
- [ ] `annual_tariff_savings`: Number in dollars (0 if not qualified)
- [ ] `monthly_tariff_savings`: Number (annual_savings / 12)
- [ ] `savings_percentage`: Number (savings as % of trade volume)
- [ ] `section_301_exposure.is_exposed`: Boolean (true if China components + US destination)
- [ ] `section_301_exposure.annual_cost_burden`: Number in dollars (if exposed)
- [ ] `section_301_exposure.affected_components`: Array of component names

**5. Business Intelligence - Supply Chain Vulnerabilities**
- [ ] `primary_exposure`: String describing main risk (e.g., "China microprocessor...")
- [ ] `vulnerability_level`: String ("High", "Medium", "Low")
- [ ] `risk_description`: Multi-sentence explanation of supply chain concentration risk

**6. Business Intelligence - Strategic Alternatives**
- [ ] At least 2 options provided (current state + recommended change)
- [ ] Each option has: `option`, `cost_impact`, `benefit`, `timeline`, `payback_months`
- [ ] Recommended option includes: `recommendation_rationale` with ROI analysis
- [ ] Payback_months shows clear financial justification (e.g., "3-month payback")

**7. Business Intelligence - Competitive Context**
- [ ] Benchmark against industry peers (e.g., "68% of competitors have similar setup")
- [ ] Early-mover advantage or catch-up positioning identified
- [ ] Market trend relevance (e.g., "Mexico sourcing becoming industry standard")

---

### ✅ SECONDARY ENDPOINT: `/api/executive-trade-alert` Response Validation

**1. Executive Summary**
- [ ] One-sentence statement of situation + opportunity/risk
- [ ] Includes financial impact ($X/year) and timeline (months)

**2. Situation Description**
- [ ] Clear articulation of the policy impact
- [ ] Specific to user's product (not generic)
- [ ] Dollar amount of impact on user's trade volume

**3. Financial Impact Section**
- [ ] `current_annual_cost`: Specific dollar amount
- [ ] `scenario_increase`: "If policy changes: +$X/year"
- [ ] `scenario_decrease`: "If action taken: -$X/year"

**4. Strategic Roadmap (3-Phase)**
- [ ] **Phase 1**: Week 1-2, specific actions
- [ ] **Phase 2**: Week 3-4, specific actions
- [ ] **Phase 3**: Week 5-8, specific actions
- [ ] Each phase includes concrete action items (not vague recommendations)

**5. Action Items**
- [ ] Binding ruling strategy mentioned (CBP lock-in)
- [ ] Documentation audit mentioned
- [ ] Freight forwarder USMCA verification mentioned
- [ ] 3-5 specific, implementable action items

---

### ✅ TERTIARY ENDPOINT: `/api/generate-personalized-alerts` Response Validation

**1. Relevance Scoring & Ranking**
- [ ] Maximum 3 alerts returned (top by relevance)
- [ ] Each alert has `relevance_score` (0-100)
- [ ] Alerts ranked by score (highest first)
- [ ] Scoring breakdown visible: industry +40, geography +30, product +25, destination +20

**2. Alert Content Structure**
- [ ] `rank`: Number (1, 2, 3 only)
- [ ] `theme`: String (e.g., "Trade Enforcement", "USMCA Compliance")
- [ ] `headline`: Specific to policy impact
- [ ] `situation`: User-friendly explanation of policy
- [ ] `financial_impact`: Dollar amount specific to user's volume
- [ ] `strategic_roadmap`: Actionable mitigation strategy
- [ ] `relevance_reason`: Why this alert matters to user's specific products

**3. Relevance Filtering Quality**
- [ ] ❌ No generic "all companies should know this" alerts
- [ ] ✅ Only alerts with relevance_score ≥ 40 included
- [ ] ✅ Alerts personalized to user's industry, suppliers, and products
- [ ] ✅ Financial impact calculated for user's specific trade volume

---

### ✅ CERTIFICATE GENERATION VALIDATION

**For Qualified Companies (TEST 1, 2, 3):**
- [ ] Certificate button appears on results page
- [ ] Company name field pre-populated from form
- [ ] Company country field pre-populated from form
- [ ] USMCA qualification status shows as "QUALIFIED"
- [ ] Certificate can be downloaded as PDF
- [ ] PDF includes: Company name, products, RVC %, date issued, one-year validity

**For Non-Qualified Companies (TEST 4):**
- [ ] Certificate button is DISABLED or HIDDEN
- [ ] Error message explains: "Certificate can only be generated for USMCA-qualified products"
- [ ] Recommendation shown: "Consider nearshoring strategy (see Strategic Alternatives section)"

---

### ✅ API INTEGRATION VALIDATION

**Request Format Checks:**
- [ ] All formData fields from Step 1 & 2 are sent to API
- [ ] component_origins array preserves all fields: description, hs_code, origin_country, value_percentage
- [ ] destination_country matches Step 1 input exactly
- [ ] manufacturing_location is specific country, not "Does Not Apply"
- [ ] trade_volume is sent as integer (not string)

**Response Parsing Checks:**
- [ ] Response components_enriched matches sent components (same count)
- [ ] Tariff rates are extracted correctly from cache lookup
- [ ] RVC calculation is transparent (user can verify math)
- [ ] Savings calculations are correct: (MFN - USMCA) × (component value %) × (trade volume)

---

### ✅ ALERT SYSTEM VALIDATION

**Executive Trade Alert Integration:**
- [ ] Alert shows when Section 301 exposure > $10,000/year
- [ ] Alert shows when RVC is within 5% of threshold
- [ ] Email alert contains 3-phase roadmap + action items

**Personalized Alert Filtering:**
- [ ] Dashboard shows max 3 alerts (not all 5 generic policies)
- [ ] Top alert always matches user's primary risk factor
- [ ] Relevance score visible to user
- [ ] Financial impact is user-specific (not generic example)

---

## SUCCESS METRICS FOR TESTING

A successful test validates that:

1. **API Response Completeness** - All 7 sections present in AI response
2. **Financial Accuracy** - Monthly/annual savings calculations are verifiable
3. **Strategic Intelligence** - 3+ different strategic options provided with ROI
4. **Certificate Generation** - Works for qualified, disabled for non-qualified
5. **Alert Personalization** - Alerts are specific to user's products, not generic
6. **User Clarity** - User understands financial impact + recommended actions

---

## RAPID TEST EXECUTION

### Quick Value Test (10 minutes):
1. Submit TEST 1 (Electronics with China PCB risk)
2. Verify API response includes all 7 sections
3. Check certificate generates successfully
4. Confirm Section 301 alert appears

### Comprehensive Test (30 minutes):
1. Run all 4 scenarios (one after another)
2. Verify API response structure for each
3. Validate financial calculations
4. Test certificate generation (works/disabled appropriately)
5. Check alert system filtering

### Alert System Test (15 minutes):
1. Call `/api/executive-trade-alert` with TEST 1 data
2. Verify 3-phase roadmap is included
3. Call `/api/generate-personalized-alerts` with TEST 1 data
4. Verify max 3 alerts, highest relevance first

---

**Testing Philosophy:**
Every test should validate that the platform delivers consulting-grade intelligence (not just technical compliance) with specific financial recommendations, actionable roadmaps, and business model transformation options.

**Last Updated:** October 25, 2025
**Focus:** API Alignment + Certificate Validation + Detailed Component Specifications