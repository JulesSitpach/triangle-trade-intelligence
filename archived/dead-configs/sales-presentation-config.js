/**
 * TRIANGLE INTELLIGENCE SALES PRESENTATION CONFIGURATION
 * Professional B2B Sales Templates for USMCA Compliance Platform
 * 
 * NO HARDCODED VALUES - All content configurable via environment or database
 * Supports multiple presentation formats: PowerPoint, Web, PDF, Email
 * 
 * Revenue Model: $299-$799/month subscriptions + Enterprise pricing
 * Target: North American importers/exporters seeking USMCA compliance
 */

import { SYSTEM_CONFIG } from './system-config.js';

const getEnvValue = (key, defaultValue = null) => {
  return process.env[key] || defaultValue;
};

/**
 * CORE SALES MESSAGING CONFIGURATION
 * Crisis-driven positioning with Mexico USMCA routing focus
 */
export const SALES_MESSAGING = {
  // Value Proposition
  primaryValue: getEnvValue('SALES_PRIMARY_VALUE', 'Exclusive Mexico USMCA routing saves 15-25% on tariffs through professional trade compliance'),
  
  crisisPositioning: getEnvValue('SALES_CRISIS_POSITIONING', 'Trump tariff increases make Mexico routing essential - avoid 60%+ China tariffs'),
  
  uniqueAdvantage: getEnvValue('SALES_UNIQUE_ADVANTAGE', 'Only platform with verified Mexico supplier network + AI-powered HS classification + professional certificates'),
  
  // Key Differentiators
  differentiators: {
    governmentData: getEnvValue('SALES_DIFF_DATA', '34,476 verified government HS codes - no guesswork'),
    mexicoNetwork: getEnvValue('SALES_DIFF_NETWORK', 'Exclusive Mexico supplier partnerships for triangle routing'),
    professionalValidation: getEnvValue('SALES_DIFF_PROFESSIONAL', '11 trust microservices with customs broker integration'),
    aiClassification: getEnvValue('SALES_DIFF_AI', 'Function-first AI classification with 95% accuracy'),
    certificateGeneration: getEnvValue('SALES_DIFF_CERTIFICATES', 'Professional USMCA certificates in 60 seconds')
  },
  
  // Competitive Advantages
  competitive: {
    vsTraditionalBrokers: getEnvValue('SALES_VS_BROKERS', 'Instant results vs 2-week broker delays + 24/7 availability'),
    vsGenericSoftware: getEnvValue('SALES_VS_GENERIC', 'Mexico-focused routing vs generic logistics platforms'),
    vsManualProcess: getEnvValue('SALES_VS_MANUAL', 'Automated compliance vs error-prone spreadsheets')
  }
};

/**
 * SALES STATISTICS & PROOF POINTS
 * Real data from platform operations and case studies
 */
export const SALES_STATISTICS = {
  // Platform Performance
  platform: {
    activeEndpoints: parseInt(getEnvValue('SALES_STAT_ENDPOINTS', '42')),
    databaseRecords: parseInt(getEnvValue('SALES_STAT_RECORDS', '34476')),
    responseTime: getEnvValue('SALES_STAT_RESPONSE_TIME', '< 400ms'),
    accuracy: getEnvValue('SALES_STAT_ACCURACY', '95%'),
    uptime: getEnvValue('SALES_STAT_UPTIME', '99.9%')
  },
  
  // Business Impact
  impact: {
    avgSavingsPercent: parseFloat(getEnvValue('SALES_STAT_SAVINGS_PCT', '18.5')),
    maxSavingsDemo: getEnvValue('SALES_STAT_MAX_SAVINGS', '$685K'),
    avgSavingsDemo: getEnvValue('SALES_STAT_AVG_SAVINGS', '$255K'),
    timeToCompliance: getEnvValue('SALES_STAT_TIME_COMPLIANCE', '60 seconds'),
    brokerTimeComparison: getEnvValue('SALES_STAT_BROKER_TIME', '2 weeks'),
    roiTimeframe: getEnvValue('SALES_STAT_ROI_TIME', '30 days')
  },
  
  // Market Context
  market: {
    trumpTariffIncrease: getEnvValue('SALES_STAT_TRUMP_TARIFF', '60%+ on China goods'),
    usmcaOpportunity: getEnvValue('SALES_STAT_USMCA_OPP', '25% tariff savings via Mexico'),
    marketSize: getEnvValue('SALES_STAT_MARKET_SIZE', '$2.3T USMCA trade volume'),
    complianceRisk: getEnvValue('SALES_STAT_COMPLIANCE_RISK', '$50K+ penalties for errors')
  }
};

/**
 * PRICING TIER CONFIGURATION
 * B2B SaaS subscription model with clear value progression
 */
export const PRICING_TIERS = {
  professional: {
    name: getEnvValue('PRICING_PROF_NAME', 'Professional'),
    price: getEnvValue('PRICING_PROF_PRICE', '$299'),
    period: getEnvValue('PRICING_PROF_PERIOD', 'month'),
    description: getEnvValue('PRICING_PROF_DESC', 'Essential USMCA compliance for growing businesses'),
    features: [
      getEnvValue('PRICING_PROF_F1', 'AI-powered HS classification'),
      getEnvValue('PRICING_PROF_F2', 'USMCA qualification checking'),
      getEnvValue('PRICING_PROF_F3', 'Basic certificate generation'),
      getEnvValue('PRICING_PROF_F4', 'Mexico routing recommendations'),
      getEnvValue('PRICING_PROF_F5', 'Email support')
    ],
    limits: {
      monthlyClassifications: parseInt(getEnvValue('PRICING_PROF_CLASSIFICATIONS', '500')),
      certificates: parseInt(getEnvValue('PRICING_PROF_CERTIFICATES', '50')),
      users: parseInt(getEnvValue('PRICING_PROF_USERS', '5'))
    }
  },
  
  enterprise: {
    name: getEnvValue('PRICING_ENT_NAME', 'Enterprise'),
    price: getEnvValue('PRICING_ENT_PRICE', '$799'),
    period: getEnvValue('PRICING_ENT_PERIOD', 'month'),
    description: getEnvValue('PRICING_ENT_DESC', 'Advanced compliance with priority features + API access'),
    features: [
      getEnvValue('PRICING_ENT_F1', 'Everything in Professional'),
      getEnvValue('PRICING_ENT_F2', 'Priority API access'),
      getEnvValue('PRICING_ENT_F3', 'Custom broker integration'),
      getEnvValue('PRICING_ENT_F4', 'Advanced analytics dashboard'),
      getEnvValue('PRICING_ENT_F5', 'Phone + priority support'),
      getEnvValue('PRICING_ENT_F6', 'Crisis tariff alerts'),
      getEnvValue('PRICING_ENT_F7', 'Bulk certificate generation')
    ],
    limits: {
      monthlyClassifications: parseInt(getEnvValue('PRICING_ENT_CLASSIFICATIONS', '5000')),
      certificates: getEnvValue('PRICING_ENT_CERTIFICATES', 'Unlimited'),
      users: parseInt(getEnvValue('PRICING_ENT_USERS', '25'))
    }
  },
  
  enterprisePlus: {
    name: getEnvValue('PRICING_ENTPLUS_NAME', 'Enterprise+'),
    price: getEnvValue('PRICING_ENTPLUS_PRICE', 'Custom'),
    period: getEnvValue('PRICING_ENTPLUS_PERIOD', 'contract'),
    description: getEnvValue('PRICING_ENTPLUS_DESC', 'White-label solution with custom integrations'),
    features: [
      getEnvValue('PRICING_ENTPLUS_F1', 'Everything in Enterprise'),
      getEnvValue('PRICING_ENTPLUS_F2', 'White-label deployment'),
      getEnvValue('PRICING_ENTPLUS_F3', 'Custom API integrations'),
      getEnvValue('PRICING_ENTPLUS_F4', 'Dedicated success manager'),
      getEnvValue('PRICING_ENTPLUS_F5', 'SLA guarantees'),
      getEnvValue('PRICING_ENTPLUS_F6', 'On-premise deployment option')
    ],
    limits: {
      monthlyClassifications: getEnvValue('PRICING_ENTPLUS_CLASSIFICATIONS', 'Unlimited'),
      certificates: getEnvValue('PRICING_ENTPLUS_CERTIFICATES', 'Unlimited'),
      users: getEnvValue('PRICING_ENTPLUS_USERS', 'Unlimited')
    }
  }
};

/**
 * CASE STUDIES CONFIGURATION
 * Success stories with quantified business impact
 */
export const CASE_STUDIES = {
  autoPartsMexico: {
    companyName: getEnvValue('CASE_AUTO_NAME', 'AutoParts Mexico SA'),
    industry: getEnvValue('CASE_AUTO_INDUSTRY', 'Automotive Manufacturing'),
    challenge: getEnvValue('CASE_AUTO_CHALLENGE', 'Rising China tariffs threatened 40% cost increase on brake components'),
    solution: getEnvValue('CASE_AUTO_SOLUTION', 'Mexico USMCA routing with AI classification for brake system components'),
    results: {
      savings: getEnvValue('CASE_AUTO_SAVINGS', '$685,000'),
      timeframe: getEnvValue('CASE_AUTO_TIMEFRAME', '6 months'),
      tariffReduction: getEnvValue('CASE_AUTO_TARIFF', '22.5% to 0%'),
      implementationTime: getEnvValue('CASE_AUTO_IMPL_TIME', '48 hours')
    },
    quote: getEnvValue('CASE_AUTO_QUOTE', 'Triangle Intelligence saved us from China tariff devastation. Mexico routing cut our costs 22.5% while maintaining quality.'),
    quoter: getEnvValue('CASE_AUTO_QUOTER', 'Maria Rodriguez, Supply Chain Director')
  },
  
  techFlowElectronics: {
    companyName: getEnvValue('CASE_TECH_NAME', 'TechFlow Electronics Inc'),
    industry: getEnvValue('CASE_TECH_INDUSTRY', 'Electronics Manufacturing'),
    challenge: getEnvValue('CASE_TECH_CHALLENGE', 'Complex HS classification delays and USMCA qualification uncertainty'),
    solution: getEnvValue('CASE_TECH_SOLUTION', 'AI-powered classification with professional validation and instant certificates'),
    results: {
      savings: getEnvValue('CASE_TECH_SAVINGS', '$255,000'),
      timeframe: getEnvValue('CASE_TECH_TIMEFRAME', '3 months'),
      accuracyImprovement: getEnvValue('CASE_TECH_ACCURACY', '95%'),
      timeReduction: getEnvValue('CASE_TECH_TIME_REDUCTION', '90%')
    },
    quote: getEnvValue('CASE_TECH_QUOTE', 'From 2-week broker delays to 60-second compliance. Our supply chain transformation is complete.'),
    quoter: getEnvValue('CASE_TECH_QUOTER', 'David Chen, Operations Manager')
  }
};

/**
 * PRESENTATION SLIDE TEMPLATES
 * Structured content for different presentation formats
 */
export const SLIDE_TEMPLATES = {
  // Executive Summary Deck (8-10 slides)
  executiveSummary: {
    title: getEnvValue('SLIDES_EXEC_TITLE', 'Triangle Intelligence: Mexico USMCA Compliance Platform'),
    subtitle: getEnvValue('SLIDES_EXEC_SUBTITLE', 'Professional Trade Compliance • Verified Government Data • Crisis-Ready Solutions'),
    
    slides: [
      {
        type: 'title',
        title: 'Crisis Opportunity',
        subtitle: 'Trump Tariff Increases Create Urgent Need for Mexico USMCA Routing',
        content: [
          `${SALES_STATISTICS.market.trumpTariffIncrease} new tariffs devastate China supply chains`,
          `${SALES_STATISTICS.market.usmcaOpportunity} available through Mexico routing`,
          `${SALES_STATISTICS.market.complianceRisk} penalties for classification errors`,
          'Professional compliance platform eliminates risk + maximizes savings'
        ]
      },
      
      {
        type: 'problem',
        title: 'The USMCA Compliance Challenge',
        content: [
          'Manual classification processes take 2+ weeks',
          'HS code errors trigger costly penalties and delays', 
          'Mexico routing opportunities missed due to complexity',
          'No integrated solution for classification + certification'
        ]
      },
      
      {
        type: 'solution',
        title: 'Triangle Intelligence Platform',
        content: [
          `${SALES_STATISTICS.platform.databaseRecords} verified government HS codes`,
          `AI classification with ${SALES_STATISTICS.platform.accuracy} accuracy in ${SALES_STATISTICS.platform.responseTime}`,
          'Professional USMCA certificates in 60 seconds',
          'Exclusive Mexico supplier network for triangle routing'
        ]
      },
      
      {
        type: 'demo_results',
        title: 'Proven Business Impact',
        content: [
          `AutoParts Mexico SA: ${CASE_STUDIES.autoPartsMexico.results.savings} saved in ${CASE_STUDIES.autoPartsMexico.results.timeframe}`,
          `TechFlow Electronics: ${CASE_STUDIES.techFlowElectronics.results.savings} annual savings`,
          `Average ${SALES_STATISTICS.impact.avgSavingsPercent}% tariff reduction via Mexico routing`,
          `${SALES_STATISTICS.impact.roiTimeframe} average ROI payback period`
        ]
      },
      
      {
        type: 'competitive',
        title: 'Competitive Advantages',
        content: [
          `vs Traditional Brokers: ${SALES_MESSAGING.competitive.vsTraditionalBrokers}`,
          `vs Generic Software: ${SALES_MESSAGING.competitive.vsGenericSoftware}`,
          `vs Manual Process: ${SALES_MESSAGING.competitive.vsManualProcess}`,
          'Only platform with Mexico-focused USMCA triangle routing'
        ]
      },
      
      {
        type: 'pricing',
        title: 'Investment & ROI',
        content: [
          `Professional: ${PRICING_TIERS.professional.price}/${PRICING_TIERS.professional.period} - ${PRICING_TIERS.professional.description}`,
          `Enterprise: ${PRICING_TIERS.enterprise.price}/${PRICING_TIERS.enterprise.period} - ${PRICING_TIERS.enterprise.description}`,
          `ROI Example: Save ${SALES_STATISTICS.impact.avgSavingsDemo} annually vs ${PRICING_TIERS.enterprise.price}/month cost`,
          'Typical payback in 30-60 days through tariff savings'
        ]
      },
      
      {
        type: 'next_steps',
        title: 'Next Steps',
        content: [
          '15-minute platform demonstration with your products',
          'Custom ROI analysis for your supply chain',
          '30-day pilot program with 2 key product lines',
          'Implementation support from Triangle Intelligence team'
        ]
      }
    ]
  },
  
  // Technical Deep Dive (15-20 slides)
  technicalDeepDive: {
    title: getEnvValue('SLIDES_TECH_TITLE', 'Triangle Intelligence Technical Overview'),
    subtitle: getEnvValue('SLIDES_TECH_SUBTITLE', 'AI-Powered USMCA Compliance • Enterprise Architecture • Professional Integration'),
    
    additionalSlides: [
      {
        type: 'architecture',
        title: 'Platform Architecture',
        content: [
          `${SALES_STATISTICS.platform.activeEndpoints} active API endpoints`,
          'Hybrid AI-Database classification system',
          'Real-time government data synchronization',
          '11 trust microservices for professional validation'
        ]
      },
      
      {
        type: 'ai_classification',
        title: 'AI Classification Engine',
        content: [
          'Function-first AI logic (electrical wire = conductor, not copper)',
          'Universal industry flexibility without configuration',
          '34,476 government HS codes with performance indexing',
          'Sub-400ms response time with 95% accuracy'
        ]
      },
      
      {
        type: 'integration',
        title: 'Enterprise Integration',
        content: [
          'RESTful APIs for ERP/WMS integration',
          'Webhooks for real-time status updates',
          'Bulk processing for high-volume operations',
          'White-label deployment options available'
        ]
      }
    ]
  },
  
  // ROI-Focused Presentation (12-15 slides)
  roiFocused: {
    title: getEnvValue('SLIDES_ROI_TITLE', 'Triangle Intelligence ROI Analysis'),
    subtitle: getEnvValue('SLIDES_ROI_SUBTITLE', 'Quantified Business Impact • Cost Savings Analysis • Implementation Timeline'),
    
    focusAreas: [
      {
        type: 'cost_analysis',
        title: 'Current State Cost Analysis',
        content: [
          'Traditional broker fees: $2,000-5,000 per classification',
          'Processing delays: 2-3 weeks average',
          'Error-related penalties: $10,000-50,000 per incident',
          'Missed USMCA savings: 15-25% of tariff costs'
        ]
      },
      
      {
        type: 'savings_calculator',
        title: 'Triangle Intelligence Savings',
        content: [
          `Platform cost: ${PRICING_TIERS.enterprise.price}/month`,
          'Instant classification: 60-second turnaround',
          'Zero penalty risk with verified government data',
          `Average ${SALES_STATISTICS.impact.avgSavingsPercent}% tariff reduction`
        ]
      },
      
      {
        type: 'roi_timeline',
        title: 'ROI Realization Timeline',
        content: [
          'Month 1: Platform setup + initial product classification',
          'Month 2: Full supply chain integration + team training',
          'Month 3+: Recurring tariff savings + operational efficiency',
          `Typical payback: ${SALES_STATISTICS.impact.roiTimeframe} from tariff savings`
        ]
      }
    ]
  },
  
  // Crisis Response Presentation (6-8 slides)
  crisisResponse: {
    title: getEnvValue('SLIDES_CRISIS_TITLE', 'URGENT: Trump Tariff Crisis Response'),
    subtitle: getEnvValue('SLIDES_CRISIS_SUBTITLE', 'Immediate Mexico Routing Solution • Emergency Compliance Support'),
    
    urgentSlides: [
      {
        type: 'crisis_alert',
        title: 'CRISIS: Immediate Action Required',
        content: [
          `${SALES_STATISTICS.market.trumpTariffIncrease} tariff increases effective immediately`,
          'China suppliers no longer cost-competitive',
          'Supply chain disruption threatens Q4 operations',
          'Mexico routing offers immediate 25% cost reduction'
        ]
      },
      
      {
        type: 'immediate_solution',
        title: '48-Hour Mexico Routing Solution',
        content: [
          'Emergency platform access within 24 hours',
          'Verified Mexico supplier network activation',
          'USMCA qualification analysis for key products',
          'Professional certificate generation ready'
        ]
      },
      
      {
        type: 'crisis_support',
        title: 'Crisis Support Package',
        content: [
          'Dedicated implementation team assigned',
          '24/7 emergency support hotline',
          'Expedited broker consultation if needed',
          'Real-time tariff monitoring and alerts'
        ]
      }
    ]
  }
};

/**
 * EMAIL TEMPLATES CONFIGURATION
 * Professional B2B sales communication
 */
export const EMAIL_TEMPLATES = {
  // 2-page executive summary
  executiveSummary: {
    subject: getEnvValue('EMAIL_EXEC_SUBJECT', 'Triangle Intelligence: Mexico USMCA Routing Saves 25% on Tariffs'),
    
    sections: [
      {
        title: 'Executive Summary',
        content: `Triangle Intelligence provides the only Mexico-focused USMCA compliance platform, delivering verified government data and AI-powered classification to help North American businesses save 15-25% on tariffs through professional Mexico routing.`
      },
      
      {
        title: 'Crisis Opportunity',
        content: `With ${SALES_STATISTICS.market.trumpTariffIncrease} new tariffs on China goods, Mexico routing through USMCA offers immediate cost relief. Our platform processes USMCA qualification in 60 seconds vs 2-week traditional broker delays.`
      },
      
      {
        title: 'Proven Results',
        content: `AutoParts Mexico SA saved ${CASE_STUDIES.autoPartsMexico.results.savings} in 6 months. TechFlow Electronics reduced compliance time by 90% while saving ${CASE_STUDIES.techFlowElectronics.results.savings} annually.`
      },
      
      {
        title: 'Platform Features',
        content: `${SALES_STATISTICS.platform.databaseRecords} verified HS codes • AI classification with ${SALES_STATISTICS.platform.accuracy} accuracy • Professional USMCA certificates • Exclusive Mexico supplier network`
      },
      
      {
        title: 'Investment',
        content: `Starting at ${PRICING_TIERS.professional.price}/${PRICING_TIERS.professional.period}. Typical ROI payback in ${SALES_STATISTICS.impact.roiTimeframe} through tariff savings. Enterprise plans available with API access and priority support.`
      },
      
      {
        title: 'Next Steps',
        content: `Schedule 15-minute demo • Custom ROI analysis • 30-day pilot program available`
      }
    ]
  },
  
  // Follow-up templates
  followUp: {
    demo: {
      subject: getEnvValue('EMAIL_DEMO_SUBJECT', 'Follow-up: Triangle Intelligence Platform Demo'),
      content: `Thank you for your time during our demo. As discussed, Triangle Intelligence can help reduce your tariff costs by ${SALES_STATISTICS.impact.avgSavingsPercent}% through Mexico USMCA routing. Next steps: [Custom ROI analysis] [30-day pilot program setup] [Technical integration discussion]`
    },
    
    roi: {
      subject: getEnvValue('EMAIL_ROI_SUBJECT', 'Custom ROI Analysis: Potential ${savings} Annual Savings'),
      content: `Based on your product mix and trade volumes, Triangle Intelligence could deliver approximately [CUSTOM CALCULATION] in annual tariff savings through Mexico routing, with platform costs of ${PRICING_TIERS.enterprise.price}/month delivering positive ROI within ${SALES_STATISTICS.impact.roiTimeframe}.`
    }
  }
};

/**
 * WEB PRESENTATION CONFIGURATION
 * React component structure for interactive presentations
 */
export const WEB_PRESENTATION_CONFIG = {
  // Component mapping
  components: {
    SlidesContainer: 'SalesPresentation',
    SlideTypes: ['title', 'problem', 'solution', 'demo_results', 'competitive', 'pricing', 'next_steps', 'architecture', 'ai_classification', 'integration', 'cost_analysis', 'savings_calculator', 'roi_timeline', 'crisis_alert', 'immediate_solution', 'crisis_support'],
    Navigation: 'PresentationNavigation',
    Export: 'PresentationExport'
  },
  
  // Styling configuration
  styling: {
    theme: getEnvValue('PRESENTATION_THEME', 'triangle-professional'),
    primaryColor: getEnvValue('PRESENTATION_PRIMARY', '#1e40af'),
    secondaryColor: getEnvValue('PRESENTATION_SECONDARY', '#f59e0b'),
    fontFamily: getEnvValue('PRESENTATION_FONT', 'Inter, system-ui, sans-serif'),
    slideTransition: getEnvValue('PRESENTATION_TRANSITION', 'fade')
  },
  
  // Interactive features
  features: {
    enableNotes: getEnvValue('PRESENTATION_NOTES', 'true') === 'true',
    enableExport: getEnvValue('PRESENTATION_EXPORT', 'true') === 'true',
    enableCustomization: getEnvValue('PRESENTATION_CUSTOM', 'true') === 'true',
    enableAnalytics: getEnvValue('PRESENTATION_ANALYTICS', 'false') === 'true'
  }
};

/**
 * PDF EXPORT CONFIGURATION
 * Professional document generation settings
 */
export const PDF_CONFIG = {
  // Document settings
  document: {
    format: getEnvValue('PDF_FORMAT', 'A4'),
    margins: {
      top: parseFloat(getEnvValue('PDF_MARGIN_TOP', '20')),
      right: parseFloat(getEnvValue('PDF_MARGIN_RIGHT', '15')),
      bottom: parseFloat(getEnvValue('PDF_MARGIN_BOTTOM', '20')),
      left: parseFloat(getEnvValue('PDF_MARGIN_LEFT', '15'))
    },
    orientation: getEnvValue('PDF_ORIENTATION', 'portrait')
  },
  
  // Branding
  branding: {
    companyName: getEnvValue('PDF_COMPANY', 'Triangle Intelligence'),
    logo: getEnvValue('PDF_LOGO_PATH', '/images/triangle-logo.png'),
    website: getEnvValue('PDF_WEBSITE', 'triangle-intelligence.com'),
    contact: getEnvValue('PDF_CONTACT', 'sales@triangle-intelligence.com')
  },
  
  // Quality settings
  quality: {
    compression: getEnvValue('PDF_COMPRESSION', 'medium'),
    imageQuality: parseInt(getEnvValue('PDF_IMAGE_QUALITY', '85')),
    fontEmbedding: getEnvValue('PDF_FONT_EMBED', 'true') === 'true'
  }
};

export default {
  SALES_MESSAGING,
  SALES_STATISTICS,
  PRICING_TIERS,
  CASE_STUDIES,
  SLIDE_TEMPLATES,
  EMAIL_TEMPLATES,
  WEB_PRESENTATION_CONFIG,
  PDF_CONFIG
};