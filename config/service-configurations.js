/**
 * Universal Service Configuration Objects
 * Defines how each service type uses the 4-stage workflow pattern
 */

export const SERVICE_CONFIGURATIONS = {
  // Jorge's Services
  'mexico-supplier-sourcing': {
    type: 'mexico-supplier-sourcing',
    name: 'Mexico Supplier Sourcing',
    icon: '🔍',
    description: 'Pre-screened Mexico supplier contacts with capabilities analysis',
    price: 500,
    monthlyCapacity: 8,
    avgCompletion: '3-5 days',
    defaultTemplate: 'supplier_sourcing_report',
    defaultDeliverable: 'supplier_contacts_report',

    stages: [
      {
        id: 1,
        name: 'Requirements',
        icon: '📋',
        description: 'Collect client supplier needs and specifications'
      },
      {
        id: 2,
        name: 'Research',
        icon: '🔍',
        description: 'Use Mexico network to identify potential suppliers'
      },
      {
        id: 3,
        name: 'Analysis',
        icon: '📊',
        description: 'Evaluate suppliers and prepare contact information'
      },
      {
        id: 4,
        name: 'Report',
        icon: '📄',
        description: 'Deliver supplier contacts report with recommendations'
      }
    ],

    reportTemplates: [
      {
        id: 'standard_sourcing',
        name: 'Standard Supplier Sourcing',
        icon: '📋',
        description: '5-7 pre-screened suppliers with contact details'
      },
      {
        id: 'industry_specific',
        name: 'Industry-Specific Sourcing',
        icon: '🏭',
        description: 'Suppliers focused on specific industry or product type'
      },
      {
        id: 'capacity_focused',
        name: 'Capacity-Focused Sourcing',
        icon: '📈',
        description: 'Suppliers capable of handling large volume requirements'
      }
    ],

    deliverableTypes: [
      { value: 'supplier_contacts_report', label: 'Supplier Contacts Report' },
      { value: 'supplier_comparison', label: 'Supplier Comparison Matrix' },
      { value: 'contact_facilitation', label: 'Introduction Facilitation Package' }
    ],

    contentSections: [
      {
        id: 'supplier_requirements',
        label: 'Supplier Requirements',
        placeholder: 'Product specifications, volume needs, quality requirements, certifications needed...',
        rows: 4
      },
      {
        id: 'sourcing_research',
        label: 'Sourcing Research Results',
        placeholder: 'Suppliers identified, capabilities assessment, contact information gathered...',
        rows: 5
      },
      {
        id: 'supplier_recommendations',
        label: 'Supplier Recommendations',
        placeholder: 'Top recommended suppliers with rationale, strengths, and initial assessment...',
        rows: 4
      },
      {
        id: 'next_steps',
        label: 'Next Steps & Introductions',
        placeholder: 'Recommended approach for contacting suppliers, introduction facilitation offers...',
        rows: 3
      }
    ]
  },

  'mexico-manufacturing-feasibility': {
    type: 'mexico-manufacturing-feasibility',
    name: 'Mexico Manufacturing Feasibility',
    icon: '🏭',
    description: 'Location recommendations, regulatory overview, cost analysis for Mexico manufacturing',
    price: 650,
    monthlyCapacity: 4,
    avgCompletion: '5-7 days',
    defaultTemplate: 'manufacturing_feasibility_report',
    defaultDeliverable: 'feasibility_analysis',

    stages: [
      {
        id: 1,
        name: 'Requirements',
        icon: '📋',
        description: 'Collect manufacturing requirements and specifications'
      },
      {
        id: 2,
        name: 'Research',
        icon: '🔍',
        description: 'Research locations, regulations, and cost factors'
      },
      {
        id: 3,
        name: 'Analysis',
        icon: '📊',
        description: 'Analyze feasibility and prepare recommendations'
      },
      {
        id: 4,
        name: 'Report',
        icon: '📄',
        description: 'Deliver feasibility report with actionable recommendations'
      }
    ],

    reportTemplates: [
      {
        id: 'location_analysis',
        name: 'Location Analysis',
        icon: '🏭',
        description: 'Focus on optimal manufacturing locations in Mexico'
      },
      {
        id: 'cost_analysis',
        name: 'Cost Analysis',
        icon: '💰',
        description: 'Detailed cost breakdown and ROI analysis'
      },
      {
        id: 'regulatory_focus',
        name: 'Regulatory Focus',
        icon: '📋',
        description: 'Emphasis on regulatory requirements and compliance'
      }
    ],

    deliverableTypes: [
      { value: 'feasibility_analysis', label: 'Manufacturing Feasibility Report' },
      { value: 'location_comparison', label: 'Location Comparison Matrix' },
      { value: 'implementation_roadmap', label: 'Implementation Roadmap' }
    ],

    contentSections: [
      {
        id: 'manufacturing_requirements',
        label: 'Manufacturing Requirements',
        placeholder: 'Product details, volume projections, quality standards, special requirements...',
        rows: 4
      },
      {
        id: 'location_analysis',
        label: 'Location Analysis',
        placeholder: 'Recommended locations, infrastructure assessment, proximity to suppliers/markets...',
        rows: 5
      },
      {
        id: 'regulatory_overview',
        label: 'Regulatory Overview',
        placeholder: 'Permits required, environmental regulations, labor laws, tax implications...',
        rows: 4
      },
      {
        id: 'cost_breakdown',
        label: 'Cost Analysis',
        placeholder: 'Setup costs, operational costs, labor costs, utilities, logistics...',
        rows: 4
      }
    ]
  },

  'mexico-market-entry': {
    type: 'mexico-market-entry',
    name: 'Mexico Market Entry',
    icon: '🚀',
    description: 'Regulatory requirements, cultural guidance, market entry strategy for Mexico',
    price: 400,
    monthlyCapacity: 6,
    avgCompletion: '3-5 days',
    defaultTemplate: 'market_entry_report',
    defaultDeliverable: 'entry_strategy',

    stages: [
      {
        id: 1,
        name: 'Research',
        icon: '📊',
        description: 'Market analysis and opportunity assessment'
      },
      {
        id: 2,
        name: 'Strategy',
        icon: '🎯',
        description: 'Entry strategy development'
      },
      {
        id: 3,
        name: 'Planning',
        icon: '📋',
        description: 'Implementation roadmap creation'
      },
      {
        id: 4,
        name: 'Delivery',
        icon: '🚀',
        description: 'Strategy presentation and documentation'
      }
    ],

    reportTemplates: [
      {
        id: 'full_strategy',
        name: 'Complete Market Entry',
        icon: '🎯',
        description: 'Comprehensive market entry strategy with roadmap'
      },
      {
        id: 'competitive_analysis',
        name: 'Competitive Analysis',
        icon: '⚔️',
        description: 'Focus on competitive landscape and positioning'
      },
      {
        id: 'regulatory_focus',
        name: 'Regulatory Strategy',
        icon: '⚖️',
        description: 'Regulatory requirements and compliance pathway'
      }
    ],

    deliverableTypes: [
      { value: 'strategy_document', label: 'Market Entry Strategy Document' },
      { value: 'implementation_plan', label: 'Implementation Roadmap' },
      { value: 'presentation', label: 'Strategy Presentation' }
    ],

    contentSections: [
      {
        id: 'market_analysis',
        label: 'Market Analysis',
        placeholder: 'Market size, growth trends, customer segments...',
        rows: 5
      },
      {
        id: 'competitive_landscape',
        label: 'Competitive Landscape',
        placeholder: 'Key competitors, market positioning, opportunities...',
        rows: 4
      },
      {
        id: 'entry_strategy',
        label: 'Entry Strategy',
        placeholder: 'Recommended approach, timeline, resource requirements...',
        rows: 4
      },
      {
        id: 'implementation_steps',
        label: 'Implementation Steps',
        placeholder: 'Specific actions, milestones, success metrics...',
        rows: 4
      }
    ]
  },

  'partnership-intelligence': {
    type: 'partnership-intelligence',
    name: 'Partnership Intelligence',
    icon: '🍁🇲🇽',
    description: 'Monthly intelligence on Canada-Mexico Comprehensive Strategic Partnership (2025-2028)',
    price: 300,
    monthlyCapacity: 40,
    avgCompletion: '2-3 days',
    defaultTemplate: 'partnership_report',
    defaultDeliverable: 'monthly_report',

    // Special feature: Live intelligence preview
    hasIntelligencePreview: true,
    intelligenceAreas: [
      { id: 'opportunities', name: 'Partnership Opportunities', icon: '🎯', description: 'Strategic bilateral opportunities from official government sources' },
      { id: 'executives', name: 'Executive Connections', icon: '👥', description: 'Key Canadian executives with Mexico operations' },
      { id: 'rail', name: 'CPKC Rail Network', icon: '🚂', description: 'Direct Canada-Mexico rail corridor developments' },
      { id: 'minerals', name: 'Critical Minerals', icon: '⚡', description: 'Energy transition materials trade opportunities' }
    ],

    stages: [
      {
        id: 1,
        name: 'Data Collection',
        icon: '📊',
        description: 'Gather Canada-Mexico trade and partnership data'
      },
      {
        id: 2,
        name: 'Analysis',
        icon: '🔍',
        description: 'Identify partnership opportunities and trends'
      },
      {
        id: 3,
        name: 'Report Generation',
        icon: '📄',
        description: 'Create monthly intelligence report'
      },
      {
        id: 4,
        name: 'Client Delivery',
        icon: '📧',
        description: 'Deliver report and schedule follow-up'
      }
    ],

    reportTemplates: [
      {
        id: 'monthly_standard',
        name: 'Monthly Standard Report',
        icon: '📊',
        description: 'Standard monthly partnership intelligence report'
      },
      {
        id: 'export_opportunities',
        name: 'Export Opportunities Focus',
        icon: '📈',
        description: 'Top 7 export sectors: Aerospace, Agriculture, Automotive, Clean Tech, ICT, Mining, Oil & Gas'
      },
      {
        id: 'trade_missions',
        name: 'Trade Missions & Events',
        icon: '🤝',
        description: 'Upcoming cleantech delegations, Pacific Alliance accelerator, trade events'
      },
      {
        id: 'opportunity_tracker',
        name: 'Opportunity Tracker',
        icon: '🎯',
        description: 'Focus on immediate partnership opportunities'
      }
    ],

    deliverableTypes: [
      { value: 'monthly_report', label: 'Monthly Intelligence Report' },
      { value: 'opportunity_brief', label: 'Partnership Opportunity Brief' },
      { value: 'trend_analysis', label: 'Trend Analysis Document' }
    ],

    contentSections: [
      {
        id: 'official_partnership_priorities',
        label: 'Official CMP 2024 Partnership Priorities',
        placeholder: 'Agri-business, energy, mining, forestry, environment, trade & innovation - 9 core collaboration sectors from official partnership framework...',
        rows: 5
      },
      {
        id: 'agriculture_foodsecurity',
        label: 'Agriculture & Food Security Initiatives',
        placeholder: 'Sustainable agriculture production, data innovation for food security, Seasonal Agricultural Worker Program developments, agri-tech partnerships...',
        rows: 4
      },
      {
        id: 'responsible_mining_energy',
        label: 'Responsible Mining & Energy Collaboration',
        placeholder: 'Responsible mining practices, water stewardship, climate change mitigation, environmental technology partnerships...',
        rows: 4
      },
      {
        id: 'cultural_creative_industries',
        label: 'Cultural & Creative Industries',
        placeholder: 'Indigenous artisan protection, audiovisual sector cooperation, creativity and culture initiatives...',
        rows: 3
      },
      {
        id: 'human_capital_mobility',
        label: 'Human Capital & Mobility Programs',
        placeholder: 'Indigenous higher education exchanges, student and researcher mobility, migration strategies, gender equality initiatives...',
        rows: 4
      },
      {
        id: 'environmental_forestry',
        label: 'Environment & Forestry Partnerships',
        placeholder: 'Biodiversity conservation, wildland fire management, forest carbon accounting, climate technology cooperation...',
        rows: 4
      },
      {
        id: 'trade_innovation_opportunities',
        label: 'Trade, Investment & Innovation',
        placeholder: 'North American trade block development, innovation exchanges, emerging business opportunities across partnership sectors...',
        rows: 4
      }
    ]
  },

  'compliance-crisis-assessment': {
    type: 'compliance-crisis-assessment',
    name: 'Compliance Crisis Assessment',
    icon: '🆘',
    description: 'Emergency response for rejected certificates, audit preparation, compliance crisis resolution',
    price: 400,
    monthlyCapacity: 6,
    avgCompletion: '24-48 hours',
    defaultTemplate: 'crisis_assessment_report',
    defaultDeliverable: 'crisis_action_plan',

    stages: [
      {
        id: 1,
        name: 'Assessment',
        icon: '🔍',
        description: 'Assess crisis situation and immediate impact'
      },
      {
        id: 2,
        name: 'Analysis',
        icon: '📊',
        description: 'Analyze root cause and identify solutions'
      },
      {
        id: 3,
        name: 'Action Plan',
        icon: '📋',
        description: 'Develop immediate action plan and fixes'
      },
      {
        id: 4,
        name: 'Resolution',
        icon: '✅',
        description: 'Deliver resolution report and prevention strategies'
      }
    ],

    reportTemplates: [
      {
        id: 'certificate_rejection',
        name: 'Certificate Rejection Response',
        icon: '🆘',
        description: 'Emergency response for rejected USMCA certificates'
      },
      {
        id: 'audit_preparation',
        name: 'Audit Preparation',
        icon: '📋',
        description: 'Prepare for customs audit or compliance review'
      },
      {
        id: 'compliance_gap',
        name: 'Compliance Gap Analysis',
        icon: '🔍',
        description: 'Identify and fix compliance gaps'
      }
    ],

    deliverableTypes: [
      { value: 'crisis_action_plan', label: 'Crisis Action Plan' },
      { value: 'corrected_documents', label: 'Corrected Compliance Documents' },
      { value: 'prevention_strategy', label: 'Prevention Strategy Report' }
    ],

    contentSections: [
      {
        id: 'crisis_description',
        label: 'Crisis Description',
        placeholder: 'Certificate rejection details, audit notice, compliance issue description...',
        rows: 4
      },
      {
        id: 'impact_assessment',
        label: 'Impact Assessment',
        placeholder: 'Business impact, financial exposure, timeline constraints, customer relationships...',
        rows: 3
      },
      {
        id: 'root_cause_analysis',
        label: 'Root Cause Analysis',
        placeholder: 'Why the issue occurred, documentation gaps, process failures...',
        rows: 4
      },
      {
        id: 'immediate_actions',
        label: 'Immediate Action Plan',
        placeholder: 'Emergency steps to resolve crisis, document corrections, contact strategies...',
        rows: 4
      },
      {
        id: 'prevention_measures',
        label: 'Prevention Measures',
        placeholder: 'Process improvements, training needs, systematic changes to prevent recurrence...',
        rows: 3
      }
    ]
  },

  // Cristina's Services
  'usmca-certificate': {
    type: 'usmca-certificate',
    name: 'USMCA Certificate Generation',
    icon: '📋',
    description: 'Official USMCA certificates with compliance verification',
    price: 200,
    monthlyCapacity: 40,
    avgCompletion: '24 hours',
    defaultTemplate: 'usmca_certificate',
    defaultDeliverable: 'certificate_pdf',

    stages: [
      {
        id: 1,
        name: 'Verification',
        icon: '✅',
        description: 'Verify product and company information'
      },
      {
        id: 2,
        name: 'Classification',
        icon: '📊',
        description: 'Confirm HS code and USMCA qualification'
      },
      {
        id: 3,
        name: 'Generation',
        icon: '📄',
        description: 'Generate official certificate document'
      },
      {
        id: 4,
        name: 'Delivery',
        icon: '📧',
        description: 'Deliver certificate and update records'
      }
    ],

    reportTemplates: [
      {
        id: 'standard_certificate',
        name: 'Standard USMCA Certificate',
        icon: '📋',
        description: 'Standard USMCA certificate of origin'
      },
      {
        id: 'detailed_certificate',
        name: 'Detailed Certificate',
        icon: '📄',
        description: 'Certificate with detailed qualification analysis'
      }
    ],

    deliverableTypes: [
      { value: 'certificate_pdf', label: 'PDF Certificate' },
      { value: 'certificate_package', label: 'Certificate with Supporting Documents' }
    ],

    contentSections: [
      {
        id: 'qualification_analysis',
        label: 'USMCA Qualification Analysis',
        placeholder: 'Details of how the product qualifies for USMCA benefits...',
        rows: 4
      },
      {
        id: 'compliance_notes',
        label: 'Compliance Notes',
        placeholder: 'Important compliance considerations and requirements...',
        rows: 3
      }
    ]
  },

  'hs-classification': {
    type: 'hs-classification',
    name: 'HS Code Classification',
    icon: '🏷️',
    description: 'Expert HS code classification with tariff analysis',
    price: 150,
    monthlyCapacity: 60,
    avgCompletion: '2-4 hours',
    defaultTemplate: 'classification_report',
    defaultDeliverable: 'classification_document',

    stages: [
      {
        id: 1,
        name: 'Product Analysis',
        icon: '🔍',
        description: 'Analyze product specifications and characteristics'
      },
      {
        id: 2,
        name: 'Classification',
        icon: '🏷️',
        description: 'Determine correct HS code classification'
      },
      {
        id: 3,
        name: 'Verification',
        icon: '✅',
        description: 'Verify classification and tariff implications'
      },
      {
        id: 4,
        name: 'Documentation',
        icon: '📄',
        description: 'Generate classification report and documentation'
      }
    ],

    reportTemplates: [
      {
        id: 'standard_classification',
        name: 'Standard Classification',
        icon: '🏷️',
        description: 'Standard HS code classification report'
      },
      {
        id: 'detailed_analysis',
        name: 'Detailed Analysis',
        icon: '📊',
        description: 'Detailed classification with tariff analysis'
      }
    ],

    deliverableTypes: [
      { value: 'classification_document', label: 'Classification Report' },
      { value: 'tariff_analysis', label: 'Tariff Analysis Document' }
    ],

    contentSections: [
      {
        id: 'classification_rationale',
        label: 'Classification Rationale',
        placeholder: 'Explanation of why this HS code was selected...',
        rows: 4
      },
      {
        id: 'tariff_implications',
        label: 'Tariff Implications',
        placeholder: 'Tariff rates and trade agreement benefits...',
        rows: 3
      },
      {
        id: 'alternative_classifications',
        label: 'Alternative Classifications',
        placeholder: 'Other potential HS codes considered and why they were rejected...',
        rows: 3
      }
    ]
  },

  'document-review': {
    type: 'document-review',
    name: 'Document Review & Validation',
    icon: '📋',
    description: 'Pre-submission document review and compliance validation',
    price: 250,
    monthlyCapacity: 25,
    avgCompletion: '1-2 days',
    defaultTemplate: 'document_review_report',
    defaultDeliverable: 'validated_documentation',

    stages: [
      {
        id: 1,
        name: 'Review',
        icon: '🔍',
        description: 'Comprehensive document review and analysis'
      },
      {
        id: 2,
        name: 'Validation',
        icon: '✅',
        description: 'Validate compliance and accuracy'
      },
      {
        id: 3,
        name: 'Correction',
        icon: '📝',
        description: 'Identify and suggest corrections'
      },
      {
        id: 4,
        name: 'Delivery',
        icon: '📧',
        description: 'Deliver clean documentation package'
      }
    ],

    reportTemplates: [
      {
        id: 'pre_audit_review',
        name: 'Pre-Audit Document Review',
        icon: '📋',
        description: 'Document review for upcoming customer audits'
      },
      {
        id: 'certificate_validation',
        name: 'Certificate Validation Review',
        icon: '✅',
        description: 'Review certificates before submission'
      }
    ],

    deliverableTypes: [
      { value: 'validated_documentation', label: 'Validated Documentation Package' },
      { value: 'correction_report', label: 'Document Correction Report' }
    ],

    contentSections: [
      {
        id: 'document_submission',
        label: 'Documents Submitted for Review',
        placeholder: 'List of certificates, invoices, and trade documents submitted for review...',
        rows: 3
      },
      {
        id: 'review_findings',
        label: 'Review Findings & Issues',
        placeholder: 'Compliance issues identified, accuracy concerns, missing information...',
        rows: 4
      },
      {
        id: 'corrections_needed',
        label: 'Corrections & Recommendations',
        placeholder: 'Specific corrections required, best practices, compliance improvements...',
        rows: 4
      }
    ]
  },

  'monthly-compliance-support': {
    type: 'monthly-compliance-support',
    name: 'Monthly Compliance Support',
    icon: '📞',
    description: 'Ongoing compliance guidance and Q&A support',
    price: 99,
    monthlyCapacity: 50,
    avgCompletion: 'Ongoing',
    defaultTemplate: 'monthly_support_log',
    defaultDeliverable: 'support_summary',
    isRecurring: true,

    stages: [
      {
        id: 1,
        name: 'Setup',
        icon: '⚙️',
        description: 'Setup support schedule and communication channels'
      },
      {
        id: 2,
        name: 'Support',
        icon: '💬',
        description: 'Provide ongoing Q&A and guidance'
      },
      {
        id: 3,
        name: 'Documentation',
        icon: '📝',
        description: 'Document support interactions and solutions'
      },
      {
        id: 4,
        name: 'Summary',
        icon: '📊',
        description: 'Monthly summary of support provided'
      }
    ],

    reportTemplates: [
      {
        id: 'office_hours',
        name: 'Compliance Office Hours',
        icon: '🕐',
        description: '2 hours monthly scheduled Q&A time'
      },
      {
        id: 'priority_email',
        name: 'Priority Email Support',
        icon: '📧',
        description: 'Priority response to compliance questions'
      }
    ],

    deliverableTypes: [
      { value: 'support_summary', label: 'Monthly Support Summary' },
      { value: 'guidance_log', label: 'Compliance Guidance Log' }
    ],

    contentSections: [
      {
        id: 'support_requests',
        label: 'Support Requests This Month',
        placeholder: 'Questions asked, issues addressed, guidance provided...',
        rows: 4
      },
      {
        id: 'solutions_provided',
        label: 'Solutions & Guidance Provided',
        placeholder: 'Answers given, problems solved, resources shared...',
        rows: 4
      },
      {
        id: 'recurring_issues',
        label: 'Recurring Issues & Patterns',
        placeholder: 'Common problems identified, training opportunities...',
        rows: 3
      }
    ]
  },

  'compliance-crisis-response': {
    type: 'compliance-crisis-response',
    name: 'Compliance Crisis Response',
    icon: '🆘',
    description: 'Emergency response for rejected certificates and compliance crises',
    price: 450,
    monthlyCapacity: 15,
    avgCompletion: '24-48 hours',
    defaultTemplate: 'crisis_response_report',
    defaultDeliverable: 'crisis_resolution',

    stages: [
      {
        id: 1,
        name: 'Assessment',
        icon: '📊',
        description: 'Assess crisis impact and urgency'
      },
      {
        id: 2,
        name: 'Response Plan',
        icon: '📋',
        description: 'Develop immediate response strategy'
      },
      {
        id: 3,
        name: 'Implementation',
        icon: '⚡',
        description: 'Execute crisis response actions'
      },
      {
        id: 4,
        name: 'Follow-up',
        icon: '📞',
        description: 'Monitor results and provide ongoing support'
      }
    ],

    reportTemplates: [
      {
        id: 'urgent_response',
        name: 'Urgent Response Plan',
        icon: '🚨',
        description: 'Immediate crisis response and action plan'
      },
      {
        id: 'mitigation_strategy',
        name: 'Mitigation Strategy',
        icon: '🛡️',
        description: 'Long-term crisis mitigation and prevention'
      }
    ],

    deliverableTypes: [
      { value: 'action_plan', label: 'Crisis Action Plan' },
      { value: 'status_update', label: 'Crisis Status Update' },
      { value: 'mitigation_report', label: 'Mitigation Strategy Report' }
    ],

    contentSections: [
      {
        id: 'crisis_assessment',
        label: 'Crisis Assessment',
        placeholder: 'Nature and scope of the trade crisis, immediate impacts...',
        rows: 4
      },
      {
        id: 'immediate_actions',
        label: 'Immediate Actions',
        placeholder: 'Urgent actions taken or recommended to address crisis...',
        rows: 4
      },
      {
        id: 'mitigation_strategy',
        label: 'Mitigation Strategy',
        placeholder: 'Long-term strategy to prevent similar crises...',
        rows: 3
      },
      {
        id: 'monitoring_plan',
        label: 'Monitoring Plan',
        placeholder: 'Ongoing monitoring and follow-up requirements...',
        rows: 3
      }
    ]
  }
};

// Helper function to get service configuration
export function getServiceConfig(serviceType) {
  return SERVICE_CONFIGURATIONS[serviceType] || null;
}

// Helper function to get all service types for a team member
export function getServicesForTeamMember(teamMember) {
  const servicesByMember = {
    jorge: ['mexico-supplier-sourcing', 'mexico-manufacturing-feasibility', 'mexico-market-entry'],
    cristina: ['usmca-certificate', 'hs-classification', 'document-review', 'monthly-compliance-support', 'compliance-crisis-response']
  };

  return servicesByMember[teamMember] || [];
}

// Helper function to get service metrics
export function getServiceMetrics(serviceType) {
  const config = getServiceConfig(serviceType);
  if (!config) return null;

  return {
    price: config.price,
    monthlyCapacity: config.monthlyCapacity,
    avgCompletion: config.avgCompletion,
    monthlyRevenue: config.price * config.monthlyCapacity
  };
}