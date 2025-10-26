/**
 * Jorge's Service Configuration
 * Defines pricing, capacity, and service details for Jorge's Latin America services
 */

export const JORGE_SERVICES = {
  'supplier-vetting': {
    name: '🏭 Supplier Vetting Process',
    price: 750,
    currency: 'USD',
    unit: 'project',
    display_price: '$750 project fee',
    timeline: '5-7 business days',
    description: 'Complete supplier verification and risk assessment'
  },
  'market-entry': {
    name: '🌍 Market Entry Strategy',
    price: 400,
    currency: 'USD',
    unit: 'hour',
    display_price: '$400/hour consulting',
    timeline: 'Consultation based',
    description: 'Strategic guidance for Mexico market entry'
  },
  'partnership-intelligence': {
    name: '🤝 Partnership Intelligence',
    price: 300,
    currency: 'USD',
    unit: 'month',
    display_price: '$300/month subscription',
    timeline: 'Monthly delivery',
    description: 'Ongoing Mexico trade intelligence and opportunities'
  }
};

export const JORGE_WORKFLOW_STEPS = {
  'supplier-vetting': {
    1: '🔍 Initial Verification\n\n✓ Company registration verification\n✓ Tax ID and legal status check\n✓ Business license validation\n✓ Financial standing assessment\n✓ Regulatory compliance check\n✓ Initial risk flags identification\n\nNext: Due diligence investigation',
    2: '🔎 Due Diligence Investigation\n\n✓ Management team background checks\n✓ Financial statement analysis\n✓ Customer reference verification\n✓ Production capacity assessment\n✓ Quality system evaluation\n✓ Supply chain stability review\n\nNext: Site visit and verification',
    3: '🏭 Site Visit & Verification\n\n✓ Physical location verification\n✓ Production capability assessment\n✓ Quality control system audit\n✓ Worker conditions evaluation\n✓ Equipment and technology review\n✓ Environmental compliance check\n\nNext: Risk scoring and reporting',
    4: '📊 Risk Scoring & Report Generation\n\n✓ Calculate overall risk score (1-100)\n✓ Generate supplier profile report\n✓ Provide 3 verified supplier recommendations\n✓ Include risk mitigation strategies\n✓ Format professional deliverable\n\nDeliverable: $750 supplier vetting report ready for client'
  },
  'market-entry': {
    1: '📋 Market Research & Analysis\n\n✓ Mexico market size and opportunity assessment\n✓ Competitive landscape analysis\n✓ Regulatory requirements mapping\n✓ Cultural and business practice insights\n✓ Entry barrier identification\n✓ Initial strategy framework\n\nNext: Regulatory compliance planning',
    2: '📜 Regulatory Compliance Planning\n\n✓ Import/export requirements analysis\n✓ Product certification needs\n✓ Tax and duty structure planning\n✓ Legal entity formation options\n✓ Intellectual property protection\n✓ Compliance timeline development\n\nNext: Partnership strategy development',
    3: '🤝 Partnership & Distribution Strategy\n\n✓ Local partner identification\n✓ Distribution channel analysis\n✓ Partnership structure recommendations\n✓ Negotiation strategy development\n✓ Contract template preparation\n✓ Risk mitigation planning\n\nNext: Implementation roadmap creation',
    4: '🚀 Implementation Roadmap\n\n✓ Phase-by-phase implementation plan\n✓ Timeline and milestone definition\n✓ Resource requirement planning\n✓ Budget estimation and planning\n✓ Success metrics definition\n✓ Contingency planning\n\nDeliverable: $400/hour market entry strategy completed'
  },
  'partnership-intelligence': {
    1: '📊 Intelligence Gathering\n\n✓ Canada-Mexico trade data analysis\n✓ USMCA opportunity identification\n✓ Regulatory change monitoring\n✓ Market trend analysis\n✓ Partnership opportunity scanning\n✓ Competitive intelligence gathering\n\nNext: Analysis and filtering',
    2: '🔍 Analysis & Opportunity Filtering\n\n✓ Relevance scoring for client industry\n✓ Opportunity prioritization\n✓ Risk assessment for each opportunity\n✓ Timeline and feasibility analysis\n✓ Resource requirement estimation\n✓ ROI potential calculation\n\nNext: Report compilation',
    3: '📝 Monthly Briefing Compilation\n\n✓ Executive summary preparation\n✓ Detailed opportunity profiles\n✓ Actionable next steps\n✓ Contact information and leads\n✓ Market intelligence updates\n✓ Regulatory change impacts\n\nNext: Client distribution',
    4: '📬 Client Distribution\n\n✓ Personalized briefing customization\n✓ Client-specific opportunity matching\n✓ Automated delivery system setup\n✓ Follow-up call scheduling\n✓ Engagement tracking\n✓ Feedback collection\n\nDeliverable: $300/month intelligence service delivered'
  }
};

export const JORGE_CAPACITY_METRICS = {
  'supplier-vetting': {
    current: 3,
    monthly_target: 5,
    avg_timeline_days: 7
  },
  'market-entry': {
    current_hours: 45,
    monthly_target_hours: 80,
    avg_project_hours: 15
  },
  'partnership-intelligence': {
    current_subscribers: 12,
    monthly_target_subscribers: 20,
    monthly_reports_delivered: 12
  }
};

export const REVENUE_PROJECTIONS = {
  monthly_supplier_vetting: 750 * 4, // 4 projects per month
  monthly_market_entry: 400 * 60, // 60 hours per month average
  monthly_intelligence: 300 * 15, // 15 subscribers
  total_monthly: (750 * 4) + (400 * 60) + (300 * 15)
};