/**
 * MEXICO SOURCING AGENT
 * Dynamic cost premium and payback calculation for Mexico nearshoring
 *
 * REPLACES: Hardcoded +2% cost premium, $3,500/year, 3-month payback
 *
 * Cost premiums vary by:
 * - Industry (electronics: 1-3%, textiles: 0-2%, automotive: 2-4%)
 * - Product complexity (simple assembly vs advanced manufacturing)
 * - Volume (higher volume = lower premium due to economies of scale)
 * - Current supplier country (China vs other Asian countries)
 *
 * Payback calculation:
 * payback_months = (setup_cost + annual_premium) / (annual_section_301_savings)
 */

import { BaseAgent } from './base-agent.js';

export class MexicoSourcingAgent extends BaseAgent {
  constructor() {
    super({
      name: 'MexicoSourcingAgent',
      model: 'anthropic/claude-haiku-4.5',
      maxTokens: 2000
    });
  }

  /**
   * Estimate Mexico sourcing cost premium
   * @param {Object} params - { industry, product_complexity, annual_volume, current_origin }
   * @returns {Promise<Object>} { premium_percent, annual_cost_increase, timeline, confidence }
   */
  async estimateMexicoCostPremium(params) {
    const {
      industry_sector,
      product_complexity = 'medium',
      annual_trade_volume = 0,
      current_origin = 'China'
    } = params;

    const prompt = this.buildCostPremiumPrompt(
      industry_sector,
      product_complexity,
      annual_trade_volume,
      current_origin
    );

    const result = await this.execute(prompt, { temperature: 0 });

    if (!result.success) {
      console.error('[MexicoSourcingAgent] Cost premium estimation failed:', result.error);

      // Fallback: Use industry-specific defaults
      return this.getIndustryDefaultPremium(industry_sector, annual_trade_volume);
    }

    return result;
  }

  /**
   * Calculate payback period for Mexico nearshoring
   * @param {Object} params - { current_tariff_burden, mexico_premium, annual_volume, setup_cost }
   * @returns {Object} { payback_months, roi_percentage, break_even_date }
   */
  calculatePaybackPeriod(params) {
    const {
      current_tariff_annual_burden,
      mexico_cost_premium_percent,
      annual_trade_volume,
      setup_cost
    } = params;

    // Extract dollar amount from burden (could be "$43,750 annually" format)
    const burden = typeof current_tariff_annual_burden === 'string'
      ? this.extractDollarAmount(current_tariff_annual_burden)
      : current_tariff_annual_burden;

    if (!burden || burden === 0) {
      return {
        payback_months: null,
        roi_percentage: null,
        message: 'Unable to calculate payback without tariff burden data'
      };
    }

    // Calculate annual cost increase from Mexico premium
    const annualPremiumCost = annual_trade_volume * (mexico_cost_premium_percent / 100);

    // Calculate net annual savings
    const netAnnualSavings = burden - annualPremiumCost;

    if (netAnnualSavings <= 0) {
      return {
        payback_months: null,
        roi_percentage: (netAnnualSavings / burden) * 100,
        message: 'Mexico sourcing does not provide positive ROI (premium exceeds tariff savings)',
        annual_net_impact: netAnnualSavings
      };
    }

    // Setup cost must be provided - no hardcoded fallback
    if (!setup_cost) {
      console.warn('⚠️ [MexicoSourcingAgent] Setup cost not provided - payback calculation requires this parameter');
      return {
        payback_months: null,
        roi_percentage: Math.round((netAnnualSavings / annualPremiumCost) * 100),
        annual_net_savings: Math.round(netAnnualSavings),
        monthly_net_savings: Math.round(netAnnualSavings / 12),
        setup_cost: null,
        message: '⚠️ Setup cost required for payback calculation - contact support'
      };
    }

    // Payback period = setup cost / monthly net savings
    const monthlyNetSavings = netAnnualSavings / 12;
    const paybackMonths = Math.ceil(setup_cost / monthlyNetSavings);

    // ROI = (annual savings - annual cost) / annual cost
    const roi = (netAnnualSavings / annualPremiumCost) * 100;

    return {
      payback_months: paybackMonths,
      payback_years: Math.round((paybackMonths / 12) * 10) / 10,
      roi_percentage: Math.round(roi),
      annual_net_savings: Math.round(netAnnualSavings),
      monthly_net_savings: Math.round(monthlyNetSavings),
      setup_cost: setup_cost,
      break_even_date: this.calculateBreakEvenDate(paybackMonths)
    };
  }

  /**
   * Estimate setup cost for supplier transition
   * @param {Object} params - { industry, product_complexity, requires_tooling }
   * @returns {Promise<number>} Setup cost in dollars
   */
  async estimateSetupCost(params) {
    const {
      industry_sector,
      product_complexity = 'medium',
      requires_tooling = false
    } = params;

    const prompt = `Estimate one-time setup cost for transitioning to Mexico supplier.

===== CONTEXT =====
Industry: ${industry_sector}
Product Complexity: ${product_complexity}
Custom Tooling Required: ${requires_tooling ? 'Yes' : 'No'}

===== YOUR TASK =====
Estimate the one-time setup cost for supplier transition, including:
1. Supplier qualification and audits
2. Sample production and testing
3. Tooling and equipment (if required)
4. Initial documentation and compliance setup
5. Training and process validation

Industry-Specific Setup Costs:
- Electronics: $10,000-15,000 (PCB setup, testing equipment)
- Automotive: $20,000-30,000 (quality certifications, tooling)
- Textiles: $3,000-5,000 (simple machinery, pattern setup)
- Medical Devices: $15,000-25,000 (FDA validation, cleanroom)
- Machinery: $12,000-20,000 (precision tooling, CAD setup)

Complexity Impact:
- Simple: Lower end of range
- Medium: Mid-range
- High/Complex: Upper end or higher

Tooling Impact:
- If custom tooling required: Add $5,000-15,000

===== RESPONSE FORMAT =====
Return ONLY valid JSON:
{
  "setup_cost": 12500,
  "setup_cost_range_low": 10000,
  "setup_cost_range_high": 15000,
  "confidence": "high",
  "breakdown": [
    "Supplier qualification: $2,000",
    "Sample production: $3,500",
    "Testing equipment: $4,000",
    "Documentation: $1,500",
    "Training: $1,500"
  ],
  "caveats": [
    "Assumes standard supplier capabilities",
    "May vary by specific product requirements"
  ]
}`;

    const result = await this.execute(prompt, { temperature: 0 });

    if (!result.success) {
      console.error('[MexicoSourcingAgent] Setup cost estimation failed:', result.error);

      // Fallback: Industry-based defaults
      return this.getIndustryDefaultSetupCost(industry_sector, product_complexity, requires_tooling);
    }

    return result.data?.setup_cost || this.getIndustryDefaultSetupCost(industry_sector, product_complexity, requires_tooling);
  }

  /**
   * Estimate implementation timeline
   * @param {Object} params - { industry, product_complexity }
   * @returns {Promise<Object>} { timeline_weeks, timeline_description, phases }
   */
  async estimateImplementationTimeline(params) {
    const { industry_sector, product_complexity = 'medium' } = params;

    const prompt = this.buildTimelinePrompt(industry_sector, product_complexity);

    const result = await this.execute(prompt, { temperature: 0 });

    if (!result.success) {
      console.error('[MexicoSourcingAgent] Timeline estimation failed:', result.error);

      // Fallback: Use complexity-based defaults
      return this.getDefaultTimeline(product_complexity);
    }

    return result;
  }

  /**
   * Build cost premium estimation prompt
   */
  buildCostPremiumPrompt(industry, complexity, volume, origin) {
    return `Estimate Mexico nearshoring cost premium for supply chain transition.

===== PRODUCT CONTEXT =====
Industry: ${industry}
Product Complexity: ${complexity}
Annual Trade Volume: $${volume.toLocaleString()}
Current Origin: ${origin}

===== YOUR TASK =====
Estimate the cost premium (percentage increase) for transitioning from ${origin} to Mexico suppliers.

Consider:
1. Labor cost differential (Mexico vs ${origin})
2. Input material costs (Mexico vs ${origin})
3. Logistics costs (Mexico → US vs ${origin} → US)
4. Quality/certification requirements
5. Economies of scale at this volume

Industry-Specific Context:
- Electronics: Mexico has strong electronics manufacturing (Guadalajara, Tijuana)
- Automotive: Established supply chain in northern Mexico
- Textiles: Competitive with Asia due to USMCA yarn-forward rules
- Medical Devices: Growing sector with FDA-compliant facilities
- Machinery: Mixed - some components cheaper, some more expensive

Complexity Impact:
- Simple assembly: Lower premium (0-2%)
- Standard manufacturing: Medium premium (1-3%)
- Complex/high-precision: Higher premium (2-5%)

Volume Impact:
- High volume (>$500K/year): Lower premium due to scale
- Medium volume ($100K-500K): Standard premium
- Low volume (<$100K): Higher premium due to setup costs

===== RESPONSE FORMAT =====
Return ONLY valid JSON:
{
  "premium_percent": 2.5,
  "annual_cost_increase": 4375,
  "premium_range_low": 1.5,
  "premium_range_high": 3.5,
  "confidence": "high",
  "reasoning": "Detailed explanation of cost drivers",
  "key_factors": [
    "Labor cost in Mexico is 15% higher than China for electronics",
    "Logistics cost reduced by 30% (shorter supply chain)",
    "Net premium: +2.5% unit cost"
  ],
  "caveats": [
    "Premium assumes similar quality standards",
    "May vary by specific supplier and location within Mexico"
  ]
}

CRITICAL: Return realistic premium based on THIS specific industry and volume, not generic estimates.`;
  }

  /**
   * Build implementation timeline prompt
   */
  buildTimelinePrompt(industry, complexity) {
    return `Estimate implementation timeline for Mexico nearshoring transition.

===== CONTEXT =====
Industry: ${industry}
Product Complexity: ${complexity}

===== YOUR TASK =====
Estimate realistic timeline for transitioning to Mexico supplier.

Phases to Consider:
1. Supplier identification and vetting
2. Sample production and quality testing
3. Tooling and setup
4. Initial production ramp-up
5. Full-scale transition

Industry-Specific Factors:
- Electronics: 6-12 weeks (established supplier base)
- Automotive: 8-16 weeks (stringent quality requirements)
- Textiles: 4-8 weeks (simpler transition)
- Medical Devices: 12-24 weeks (FDA compliance, validation)
- Machinery: 8-16 weeks (depends on part complexity)

Complexity Impact:
- Simple: Faster transition (4-8 weeks)
- Medium: Standard timeline (6-12 weeks)
- Complex: Extended timeline (12-20 weeks)

===== RESPONSE FORMAT =====
Return ONLY valid JSON:
{
  "timeline_weeks": 8,
  "timeline_weeks_range": "6-10 weeks",
  "timeline_description": "6-10 weeks for supplier qualification and initial production",
  "confidence": "high",
  "phases": [
    {
      "phase": "Supplier Sourcing",
      "duration_weeks": 2,
      "description": "Identify and qualify 2-3 Mexico suppliers"
    },
    {
      "phase": "Sample Production",
      "duration_weeks": 3,
      "description": "Order sample batch, conduct quality testing"
    },
    {
      "phase": "Production Ramp-up",
      "duration_weeks": 3,
      "description": "Gradual transition while maintaining China supply"
    }
  ],
  "risk_factors": [
    "Supplier capacity constraints",
    "Quality validation timeline",
    "Logistics setup (freight forwarders, customs)"
  ]
}`;
  }

  /**
   * Industry-based fallback when AI unavailable
   */
  getIndustryDefaultPremium(industry, volume) {
    const defaults = {
      'electronics': { premium: 2.0, range: [1.0, 3.0] },
      'automotive': { premium: 3.0, range: [2.0, 4.0] },
      'textiles': { premium: 1.0, range: [0, 2.0] },
      'medical-devices': { premium: 2.5, range: [1.5, 3.5] },
      'machinery': { premium: 2.5, range: [1.5, 4.0] },
      'default': { premium: 2.0, range: [1.0, 3.0] }
    };

    const industryData = defaults[industry] || defaults['default'];

    return {
      success: true,
      data: {
        premium_percent: industryData.premium,
        annual_cost_increase: volume * (industryData.premium / 100),
        premium_range_low: industryData.range[0],
        premium_range_high: industryData.range[1],
        confidence: 'medium',
        reasoning: 'Industry average (AI unavailable)',
        key_factors: [
          `Industry average premium: ${industryData.premium}%`,
          'Fallback estimate - actual premium may vary'
        ],
        caveats: [
          '⚠️ AI estimation unavailable - using industry averages',
          'Actual premium depends on specific supplier and product'
        ]
      },
      metadata: {
        source: 'fallback_industry_defaults'
      }
    };
  }

  /**
   * Industry-based setup cost fallback when AI unavailable
   */
  getIndustryDefaultSetupCost(industry, complexity, requires_tooling) {
    const baseSetupCosts = {
      'electronics': { low: 8000, medium: 12500, high: 18000 },
      'automotive': { low: 15000, medium: 25000, high: 35000 },
      'textiles': { low: 2500, medium: 4000, high: 6000 },
      'medical-devices': { low: 12000, medium: 20000, high: 30000 },
      'machinery': { low: 10000, medium: 16000, high: 24000 },
      'aerospace': { low: 25000, medium: 40000, high: 60000 },
      'default': { low: 8000, medium: 12000, high: 18000 }
    };

    const complexityMap = {
      'low': 'low',
      'simple': 'low',
      'medium': 'medium',
      'standard': 'medium',
      'high': 'high',
      'complex': 'high'
    };

    const industryData = baseSetupCosts[industry] || baseSetupCosts['default'];
    const complexityLevel = complexityMap[complexity] || 'medium';
    let setupCost = industryData[complexityLevel];

    // Add tooling cost if required
    if (requires_tooling) {
      setupCost += 10000; // Average tooling cost
    }

    console.warn(`⚠️ [MexicoSourcingAgent] Using fallback setup cost: $${setupCost.toLocaleString()} (AI unavailable)`);

    return setupCost;
  }

  /**
   * Complexity-based timeline fallback
   */
  getDefaultTimeline(complexity) {
    const defaults = {
      'low': { weeks: 6, range: '4-8 weeks' },
      'medium': { weeks: 8, range: '6-12 weeks' },
      'high': { weeks: 12, range: '10-16 weeks' },
      'default': { weeks: 8, range: '6-12 weeks' }
    };

    const timelineData = defaults[complexity] || defaults['default'];

    return {
      success: true,
      data: {
        timeline_weeks: timelineData.weeks,
        timeline_weeks_range: timelineData.range,
        timeline_description: `${timelineData.range} for supplier qualification and initial production`,
        confidence: 'medium',
        phases: [
          {
            phase: 'Supplier Sourcing',
            duration_weeks: Math.floor(timelineData.weeks * 0.25),
            description: 'Identify and qualify Mexico suppliers'
          },
          {
            phase: 'Sample Production',
            duration_weeks: Math.floor(timelineData.weeks * 0.375),
            description: 'Sample batch and quality testing'
          },
          {
            phase: 'Production Ramp-up',
            duration_weeks: Math.ceil(timelineData.weeks * 0.375),
            description: 'Gradual transition to full production'
          }
        ],
        risk_factors: [
          '⚠️ AI estimation unavailable - using complexity-based averages',
          'Actual timeline depends on supplier capacity and product requirements'
        ]
      },
      metadata: {
        source: 'fallback_complexity_defaults'
      }
    };
  }

  /**
   * Helper: Extract dollar amount from formatted string
   */
  extractDollarAmount(str) {
    if (typeof str !== 'string') return null;
    const match = str.match(/\$(\d+(?:,\d{3})*)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''), 10);
    }
    return null;
  }

  /**
   * Helper: Calculate break-even date
   */
  calculateBreakEvenDate(paybackMonths) {
    const today = new Date();
    const breakEven = new Date(today);
    breakEven.setMonth(breakEven.getMonth() + paybackMonths);

    return breakEven.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}

export default MexicoSourcingAgent;
