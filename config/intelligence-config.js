/**
 * Intelligence System Configuration
 * Defines intelligence types, priorities, and briefing templates
 * Configuration-driven, no hardcoded business data
 */

export const INTELLIGENCE_TYPES = {
  SUPPLIER_DISCOVERY: {
    label: 'New Supplier Discovery',
    description: 'Newly identified suppliers in target industries',
    icon: '🏭',
    priority_weight: 0.8
  },
  REGULATORY_UPDATE: {
    label: 'Regulatory Update',
    description: 'Changes in trade regulations, USMCA rules, compliance requirements',
    icon: '📋',
    priority_weight: 0.9
  },
  MARKET_OPPORTUNITY: {
    label: 'Market Opportunity',
    description: 'Emerging market opportunities and business development prospects',
    icon: '📈',
    priority_weight: 0.7
  },
  PARTNERSHIP_ALERT: {
    label: 'Partnership Alert',
    description: 'Strategic partnership opportunities and business connections',
    icon: '🤝',
    priority_weight: 0.6
  },
  COST_ANALYSIS: {
    label: 'Cost Analysis Update',
    description: 'Changes in costs, tariffs, logistics expenses',
    icon: '💰',
    priority_weight: 0.5
  },
  RISK_ALERT: {
    label: 'Risk Alert',
    description: 'Supply chain risks, geopolitical changes, trade disruptions',
    icon: '⚠️',
    priority_weight: 1.0
  }
};

export const PRIORITY_LEVELS = {
  URGENT: {
    label: 'Urgent',
    color: '#dc2626',
    weight: 1.0,
    sla_hours: 4
  },
  HIGH: {
    label: 'High',
    color: '#ea580c',
    weight: 0.8,
    sla_hours: 12
  },
  MEDIUM: {
    label: 'Medium',
    color: '#ca8a04',
    weight: 0.6,
    sla_hours: 24
  },
  LOW: {
    label: 'Low',
    color: '#16a34a',
    weight: 0.4,
    sla_hours: 72
  }
};

export const INDUSTRY_CATEGORIES = {
  ELECTRONICS: {
    label: 'Electronics',
    keywords: ['electronics', 'semiconductor', 'component', 'technology'],
    usmca_threshold: 65.0
  },
  AUTOMOTIVE: {
    label: 'Automotive',
    keywords: ['automotive', 'vehicle', 'auto', 'parts'],
    usmca_threshold: 75.0
  },
  MANUFACTURING: {
    label: 'Manufacturing',
    keywords: ['manufacturing', 'industrial', 'machinery'],
    usmca_threshold: 62.5
  },
  TEXTILES: {
    label: 'Textiles',
    keywords: ['textile', 'fabric', 'apparel', 'clothing'],
    usmca_threshold: 62.5
  },
  FOOD_BEVERAGE: {
    label: 'Food & Beverage',
    keywords: ['food', 'beverage', 'agriculture', 'processing'],
    usmca_threshold: 60.0
  },
  CHEMICAL: {
    label: 'Chemical',
    keywords: ['chemical', 'pharmaceutical', 'materials'],
    usmca_threshold: 62.5
  },
  MACHINERY: {
    label: 'Machinery',
    keywords: ['machinery', 'equipment', 'tools'],
    usmca_threshold: 62.5
  }
};

export const BRIEFING_TEMPLATES = {
  EXECUTIVE_SUMMARY: {
    title: 'Executive Summary',
    sections: [
      'key_highlights',
      'actionable_insights',
      'immediate_opportunities',
      'risk_alerts'
    ]
  },
  SUPPLIER_FOCUS: {
    title: 'Supplier Intelligence Brief',
    sections: [
      'new_suppliers',
      'supplier_performance_updates',
      'capacity_changes',
      'quality_certifications'
    ]
  },
  MARKET_ANALYSIS: {
    title: 'Market Analysis Brief',
    sections: [
      'market_trends',
      'competitive_landscape',
      'pricing_analysis',
      'demand_forecasts'
    ]
  },
  REGULATORY_UPDATE: {
    title: 'Regulatory & Compliance Brief',
    sections: [
      'regulation_changes',
      'compliance_requirements',
      'tariff_updates',
      'usmca_developments'
    ]
  }
};

export const DELIVERY_FORMATS = {
  PDF_EMAIL: {
    label: 'PDF Report via Email',
    format: 'pdf',
    delivery: 'email',
    automated: true
  },
  PDF_PRESENTATION: {
    label: 'PDF + PowerPoint Presentation',
    format: 'pdf_ppt',
    delivery: 'email',
    automated: false
  },
  DASHBOARD_PORTAL: {
    label: 'Client Dashboard Portal',
    format: 'web',
    delivery: 'portal',
    automated: true
  },
  SCHEDULED_CALL: {
    label: 'Briefing Call + Report',
    format: 'verbal_pdf',
    delivery: 'call',
    automated: false
  }
};

export const BRIEFING_CONFIG = {
  MONTHLY_FEE: 500,
  MINIMUM_ENTRIES_PER_BRIEFING: 3,
  MAXIMUM_ENTRIES_PER_BRIEFING: 15,
  DELIVERY_SLA_DAYS: 3,
  BRIEFING_RETENTION_MONTHS: 12
};

export const SOURCE_TYPES = {
  RSS_FEED: {
    label: 'RSS Feed Analysis',
    automated: true,
    confidence: 0.7
  },
  MANUAL_RESEARCH: {
    label: 'Manual Research',
    automated: false,
    confidence: 0.9
  },
  CLIENT_REQUEST: {
    label: 'Client Request',
    automated: false,
    confidence: 0.8
  },
  PARTNER_NETWORK: {
    label: 'Partner Network',
    automated: false,
    confidence: 0.8
  },
  GOVERNMENT_SOURCE: {
    label: 'Government Publication',
    automated: true,
    confidence: 0.9
  }
};