/**
 * Sales Configuration - No Hardcoded Values
 * All business logic configuration for Jorge's sales operations
 */

export const SALES_CONFIG = {
  // Sales representative information
  representative: {
    name: process.env.SALES_REP_NAME || 'Jorge',
    territory: process.env.SALES_TERRITORY || 'Latin America',
    email: process.env.SALES_EMAIL || 'triangleintel@gmail.com'
  },

  // Deal size calculation based on trade volume
  deal_tiers: {
    enterprise: {
      threshold: 10000000,
      percentage: 0.08,
      minimum_fee: 500000
    },
    large: {
      threshold: 5000000,
      percentage: 0.05,
      minimum_fee: 250000
    },
    medium: {
      threshold: 1000000,
      percentage: 0.03,
      minimum_fee: 50000
    },
    small: {
      threshold: 500000,
      percentage: 0.025,
      minimum_fee: 25000
    },
    starter: {
      threshold: 0,
      percentage: 0.02,
      minimum_fee: 15000
    }
  },

  // Lead scoring weights
  lead_scoring: {
    trade_volume_weight: 0.35,
    workflow_completions_weight: 0.25,
    certificates_generated_weight: 0.20,
    recent_activity_weight: 0.15,
    industry_fit_weight: 0.05
  },

  // Pipeline stages
  pipeline_stages: {
    prospect: {
      name: 'Prospect',
      probability: 0.10,
      actions: ['Initial Contact', 'Qualification Call']
    },
    qualified: {
      name: 'Qualified Lead',
      probability: 0.25,
      actions: ['Needs Assessment', 'Demo Scheduled']
    },
    proposal: {
      name: 'Proposal Sent',
      probability: 0.50,
      actions: ['Follow Up', 'Negotiation']
    },
    negotiation: {
      name: 'Negotiation',
      probability: 0.75,
      actions: ['Contract Review', 'Final Terms']
    },
    closed_won: {
      name: 'Closed Won',
      probability: 1.00,
      actions: ['Onboarding', 'Success Planning']
    },
    closed_lost: {
      name: 'Closed Lost',
      probability: 0.00,
      actions: ['Follow Up Later', 'Archive']
    }
  },

  // Priority calculation factors
  priority_factors: {
    high_volume_threshold: 5000000,
    recent_activity_days: 7,
    certificate_threshold: 1,
    workflow_threshold: 3
  },

  // Conversion targets
  targets: {
    monthly_revenue: 2000000,
    quarterly_deals: 15,
    lead_conversion_rate: 0.25,
    proposal_win_rate: 0.60
  }
};

export const GOOGLE_APPS_CONFIG = {
  // Google Workspace integration
  workspace: {
    domain: process.env.GOOGLE_WORKSPACE_DOMAIN || 'triangleintel.com',
    calendar_id: process.env.GOOGLE_CALENDAR_ID,
    drive_folder: process.env.GOOGLE_DRIVE_FOLDER
  },

  // Document templates
  templates: {
    proposal: process.env.PROPOSAL_TEMPLATE_ID,
    contract: process.env.CONTRACT_TEMPLATE_ID,
    assessment: process.env.ASSESSMENT_TEMPLATE_ID
  },

  // Integration endpoints
  endpoints: {
    gmail_api: 'https://gmail.googleapis.com/gmail/v1',
    calendar_api: 'https://www.googleapis.com/calendar/v3',
    docs_api: 'https://docs.googleapis.com/v1',
    drive_api: 'https://www.googleapis.com/drive/v3'
  }
};

export const MARKET_INTELLIGENCE_CONFIG = {
  // Industry segments
  industries: {
    electronics: {
      name: 'Electronics & Technology',
      avg_deal_size: 750000,
      conversion_rate: 0.32,
      growth_rate: 0.15
    },
    automotive: {
      name: 'Automotive Manufacturing',
      avg_deal_size: 450000,
      conversion_rate: 0.28,
      growth_rate: 0.12
    },
    textiles: {
      name: 'Textiles & Apparel',
      avg_deal_size: 300000,
      conversion_rate: 0.35,
      growth_rate: 0.08
    },
    manufacturing: {
      name: 'General Manufacturing',
      avg_deal_size: 400000,
      conversion_rate: 0.30,
      growth_rate: 0.10
    }
  },

  // Market analysis periods
  analysis_periods: {
    weekly: 7,
    monthly: 30,
    quarterly: 90,
    yearly: 365
  }
};