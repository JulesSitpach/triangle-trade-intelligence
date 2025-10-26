/**
 * Broker Configuration - No Hardcoded Values
 * All business logic configuration for Cristina's broker operations
 */

export const BROKER_CONFIG = {
  // Trade Compliance Expert Information
  professional_certification: {
    number: process.env.PROFESSIONAL_CERTIFICATION_NUMBER || '4601913',
    name: process.env.COMPLIANCE_EXPERT_NAME || 'Cristina',
    country: process.env.COMPLIANCE_EXPERT_COUNTRY || 'Mexico'
  },

  // Service type mappings
  service_types: {
    usmca_certification: {
      name: 'USMCA Qualification',
      base_fee_percentage: 0.025, // 2.5% of trade volume
      minimum_fee: 15000,
      timeline_days: 15
    },
    logistics_optimization: {
      name: 'Logistics Optimization',
      base_fee_percentage: 0.02,
      minimum_fee: 8000,
      timeline_days: 10
    },
    emergency_compliance: {
      name: 'Emergency Compliance',
      base_fee_percentage: 0.035,
      minimum_fee: 2500,
      timeline_days: 1
    },
    regulatory_audit: {
      name: 'Regulatory Audit',
      base_fee_percentage: 0.015,
      minimum_fee: 12000,
      timeline_days: 20
    }
  },

  // Revenue calculation thresholds
  revenue_tiers: {
    high_volume: {
      threshold: 5000000,
      fee_percentage: 0.05
    },
    medium_volume: {
      threshold: 1000000,
      fee_percentage: 0.03
    },
    small_volume: {
      threshold: 500000,
      fee_percentage: 0.025
    },
    minimum: {
      threshold: 0,
      fee_percentage: 0.02
    }
  },

  // Priority scoring factors
  priority_scoring: {
    trade_volume_weight: 0.4,
    certificates_weight: 0.3,
    workflow_activity_weight: 0.2,
    recent_login_weight: 0.1
  },

  // Status mappings
  status_mappings: {
    ready_for_service: 'Ready for Service',
    qualification_required: 'Qualification Required',
    initial_assessment: 'Initial Assessment',
    prospect_identified: 'Prospect Identified'
  },

  // Priority levels
  priority_levels: {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  }
};

export const SHIPMENT_CONFIG = {
  // Carrier mappings
  carriers: {
    ups: 'UPS',
    fedex: 'FedEx',
    dhl: 'DHL',
    usps: 'USPS'
  },

  // Status progression
  status_flow: [
    'Ready for Shipment',
    'In Transit',
    'Customs Review',
    'Out for Delivery',
    'Delivered'
  ],

  // Customs status options
  customs_statuses: [
    'Pre-cleared',
    'Pending',
    'Review Required',
    'Cleared',
    'Exception'
  ],

  // USMCA qualification statuses
  usmca_statuses: [
    'Qualified',
    'Under Review',
    'Pending Assessment',
    'Pending Verification'
  ]
};

export const ANALYTICS_CONFIG = {
  // Performance targets
  targets: {
    success_rate: 98.5,
    avg_clearance_days: 2.8,
    client_satisfaction: 95.0
  },

  // Time periods for analysis
  time_periods: {
    current_month: 30,
    quarter: 90,
    year: 365
  }
};