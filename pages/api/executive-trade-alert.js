/**
 * EXECUTIVE TRADE ALERT API
 * Generates strategic business intelligence for tariff policy impacts
 *
 * Takes user's product data and identifies which tariff policies affect them specifically.
 * Returns ONE cohesive executive advisory (not generic policy announcements).
 *
 * Input:
 * - user_profile: Company info, subscription tier
 * - workflow_intelligence: Their products and tariff analysis
 * - raw_alerts: Policy changes from RSS feeds
 *
 * Output:
 * - Executive advisory with policy impact on THEIR products
 * - Strategic options to mitigate risk
 * - Financial implications
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_profile, workflow_intelligence, raw_alerts, user_id } = req.body;

    // Validate input
    if (!user_profile || !workflow_intelligence) {
      return res.status(400).json({
        error: 'Missing user_profile or workflow_intelligence',
        success: false
      });
    }

    // ========== STEP 1: Identify Which Policies Affect User's Products ==========

    // Get their HS codes
    const userHSCodes = (workflow_intelligence.components || [])
      .map(c => c.hs_code)
      .filter(Boolean);

    const userIndustry = user_profile.industry_sector || 'electronics';
    const userDestination = user_profile.destination_country || 'US';
    const hasChineseComponents = (workflow_intelligence.components || [])
      .some(c => c.origin_country === 'China' || c.origin_country === 'CN');

    // Map of policies and which industries/origins they affect
    const applicablePolicies = [];

    // Section 301: China + US destination
    if (hasChineseComponents && userDestination === 'US') {
      applicablePolicies.push({
        policy: 'Section 301 Tariffs',
        severity: 'CRITICAL',
        affects_user: true,
        impact: '25% additional tariff on Chinese-origin components',
        annual_cost_impact: calculateSection301Impact(
          workflow_intelligence.components,
          user_profile.annual_trade_volume || 0
        ),
        description: 'China-origin goods entering the US remain subject to Section 301 tariffs despite USMCA qualification.',
        strategic_options: [
          {
            option: 'Nearshoring to Mexico',
            benefit: 'Eliminates Section 301 exposure, increases USMCA RVC buffer',
            timeline: '4-6 weeks for supplier qualification',
            cost_impact: '+2% unit cost (typically offset by tariff savings within 3 months)'
          },
          {
            option: 'Request tariff exemption',
            benefit: 'Potential 100% tariff elimination for specific HS codes',
            timeline: '2-4 months for exemption application',
            cost_impact: 'Application fee ~$1,000-5,000'
          }
        ]
      });
    }

    // Generic: USMCA threshold concerns
    if (workflow_intelligence.north_american_content &&
        workflow_intelligence.north_american_content < 70) {
      applicablePolicies.push({
        policy: 'USMCA Qualification Risk',
        severity: 'HIGH',
        affects_user: true,
        impact: 'Low RVC buffer could cause disqualification with threshold changes',
        annual_cost_impact: calculateRiskImpact(workflow_intelligence),
        description: `Your current RVC (${workflow_intelligence.north_american_content}%) exceeds the requirement but has limited buffer. Proposed rule changes could raise thresholds to 70%+.`,
        strategic_options: [
          {
            option: 'Increase USMCA content',
            benefit: 'Build RVC buffer, insulate from policy changes',
            timeline: '6-12 months for supplier transition',
            cost_impact: '+1-3% input costs typically'
          },
          {
            option: 'Monitor regulatory changes',
            benefit: 'Early warning for planned threshold increases',
            timeline: 'Ongoing',
            cost_impact: 'None (included with subscription)'
          }
        ]
      });
    }

    // ========== STEP 2: Generate ONE Executive Advisory ==========

    const headline = generateHeadline(applicablePolicies, userIndustry);
    const executiveAdvisory = generateExecutiveAdvisory(
      applicablePolicies,
      workflow_intelligence,
      user_profile
    );

    // ========== STEP 3: Format Response ==========

    const alertStructure = {
      headline: headline,
      situation_brief: executiveAdvisory.situation_brief,
      the_situation: {
        problem: executiveAdvisory.problem,
        root_cause: executiveAdvisory.root_cause,
        annual_impact: executiveAdvisory.annual_impact,
        why_now: executiveAdvisory.why_now
      },
      financial_impact: {
        current_annual_burden: executiveAdvisory.current_burden,
        potential_annual_savings: executiveAdvisory.potential_savings,
        payback_period: executiveAdvisory.payback_period,
        confidence: executiveAdvisory.confidence
      },
      strategic_roadmap: executiveAdvisory.strategic_roadmap || [],
      action_this_week: executiveAdvisory.action_items || [],
      policies_affecting_you: applicablePolicies.map(p => p.policy),
      from_your_broker: executiveAdvisory.broker_insights || 'Positioning your supply chain for trade policy resilience.',
      email_trigger_config: {
        should_email: true,
        trigger_level: highestSeverity(applicablePolicies),
        frequency: 'weekly'
      }
    };

    return res.status(200).json({
      success: true,
      alert: alertStructure,
      policies_analyzed: applicablePolicies.length,
      applicable_policies: applicablePolicies
    });

  } catch (error) {
    console.error('❌ Executive alert generation failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ============ HELPER FUNCTIONS ============

function calculateSection301Impact(components, tradeVolume) {
  if (!tradeVolume || tradeVolume === 0) return 'Unable to calculate without trade volume';

  const chineseComponents = components.filter(c =>
    c.origin_country === 'China' || c.origin_country === 'CN'
  );

  const totalChineseValue = chineseComponents.reduce((sum, c) =>
    sum + (c.value_percentage || 0), 0
  );

  // Assume 25% Section 301 rate on Chinese content
  const annualCost = (tradeVolume * totalChineseValue / 100 * 0.25);

  return `$${Math.round(annualCost).toLocaleString()} annually`;
}

function calculateRiskImpact(workflow) {
  // Risk is proportional to how close they are to minimum threshold
  const buffer = (workflow.north_american_content || 0) - (workflow.threshold_applied || 60);
  if (buffer < 5) return '$50,000+ if disqualified';
  if (buffer < 15) return '$30,000+ if disqualified';
  return 'Moderate (adequate buffer exists)';
}

function generateHeadline(policies, industry) {
  if (policies.some(p => p.severity === 'CRITICAL')) {
    return `⚠️ Critical Trade Policy Exposure in Your ${industry} Supply Chain`;
  }
  if (policies.length > 0) {
    return `📊 Your Supply Chain is Affected by ${policies.length} Active Tariff Policies`;
  }
  return '✓ Your Supply Chain Has Favorable Policy Positioning';
}

function highestSeverity(policies) {
  if (policies.some(p => p.severity === 'CRITICAL')) return 'CRITICAL';
  if (policies.some(p => p.severity === 'HIGH')) return 'HIGH';
  return 'MEDIUM';
}

function generateExecutiveAdvisory(policies, workflow, profile) {
  const section301Policy = policies.find(p => p.policy === 'Section 301 Tariffs');
  const rvcPolicy = policies.find(p => p.policy === 'USMCA Qualification Risk');

  let advisory = {
    situation_brief: 'Trade policy exposure analysis for your products',
    problem: 'Your supply chain is affected by tariff policies that impact your margins',
    root_cause: 'Sourcing structure and policy landscape',
    annual_impact: 'TBD',
    why_now: 'Trade policy remains volatile with potential changes in 2025',
    current_burden: 'Calculating...',
    potential_savings: 'Subject to strategy implementation',
    payback_period: '3-6 months typical',
    confidence: 85,
    strategic_roadmap: [],
    action_items: [
      'Review supplier alternatives in Mexico/Canada',
      'Evaluate tariff exemption opportunities',
      'Monitor regulatory calendar for policy changes'
    ],
    broker_insights: 'Companies that have nearshored to Mexico in your sector have locked in preferential treatment while insulating from policy uncertainty.'
  };

  // Add Section 301 context if applicable
  if (section301Policy) {
    advisory.problem = `Your Chinese-sourced components remain subject to 25% Section 301 tariffs, creating ongoing policy risk and cost burden of approximately ${section301Policy.annual_cost_impact}.`;
    advisory.current_burden = section301Policy.annual_cost_impact;
    advisory.potential_savings = 'Mexico nearshoring could eliminate this burden within 4-6 weeks';
    advisory.why_now = 'Section 301 tariffs can be modified with 30-day notice. Current political environment suggests heightened risk.';

    advisory.strategic_roadmap = [
      {
        phase: 'Phase 1: Supplier Assessment (Week 1-2)',
        why: 'Identify Mexico suppliers with equivalent quality/cost',
        actions: [
          'Source 2-3 Mexico suppliers with your quality requirements',
          'Request pricing quotes and lead times',
          'Verify certifications and capacity'
        ],
        impact: 'Baseline for ROI decision'
      },
      {
        phase: 'Phase 2: Trial Shipment (Week 3-4)',
        why: 'Validate quality and lead times before full transition',
        actions: [
          'Order sample batch from Mexico supplier',
          'Conduct quality testing vs current supplier',
          'Measure actual lead times and reliability'
        ],
        impact: 'De-risk the transition'
      },
      {
        phase: 'Phase 3: Gradual Migration (Week 5-8)',
        why: 'Transition production without disruption',
        actions: [
          'Phase out China supplier while ramping Mexico production',
          'Update USMCA documentation with new supplier origin',
          'Lock in pricing for 12-month commitment'
        ],
        impact: 'Eliminate Section 301 exposure, increase RVC'
      }
    ];
  }

  // Add RVC context if applicable
  if (rvcPolicy) {
    advisory.situation_brief = 'Your USMCA qualification has limited buffer against potential rule changes';
    advisory.strategic_roadmap.push({
      phase: 'Build RVC Buffer',
      why: 'Proposed rules could raise thresholds to 70%+; current buffer is thin',
      actions: [
        'Prioritize transitioning highest-cost components to USMCA sources',
        'Evaluate Mexico nearshoring for maximum RVC impact',
        'Document manufacturing value-added in USMCA countries'
      ],
      impact: 'Insulate from policy changes'
    });
  }

  return advisory;
}
