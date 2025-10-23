/**
 * SERVICE CONFIGURATIONS - 6 Team Collaboration Services
 * Team collaboration model: Jorge & Cristina work together with different lead/support ratios
 * Aligned with CLAUDE.md and admin dashboard tabs
 * Updated: October 15, 2025
 */

export const SERVICE_CONFIGURATIONS = {
  // ========== SERVICE 1: TRADE HEALTH CHECK ($99) ==========
  'trade-health-check': {
    type: 'trade-health-check',
    name: 'Trade Health Check',
    icon: '🏥',
    description: 'Complete assessment with prioritized action plan',
    price: 99,
    monthlyCapacity: 20,
    avgCompletion: '1 week',
    teamLead: 'Jorge & Cristina', // 50/50 collaboration
    cristinaEffort: 50,
    jorgeEffort: 50,
    defaultTemplate: 'trade_health_check',
    defaultDeliverable: 'health_check_report',

    stages: [
      {
        id: 1,
        name: 'Client Onboarding',
        icon: '📋',
        component: 'JorgeClientIntakeStage',
        description: 'Jorge conducts intake call and gathers business context'
      },
      {
        id: 2,
        name: 'Document Review',
        icon: '📊',
        component: 'CristinaDocumentReviewStage',
        description: 'Cristina reviews documents and assesses compliance risks'
      },
      {
        id: 3,
        name: 'AI Analysis',
        icon: '🤖',
        component: 'AIAnalysisValidationStage',
        description: 'AI generates comprehensive analysis with expert guidance'
      },
      {
        id: 4,
        name: 'Report Generation',
        icon: '📄',
        component: 'ReportGenerationStage',
        description: 'Final report with prioritized recommendations'
      }
    ]
  },

  // ========== SERVICE 2: USMCA ADVANTAGE SPRINT ($175) ==========
  'usmca-advantage': {
    type: 'usmca-advantage',
    name: 'USMCA Advantage Sprint',
    icon: '📜',
    description: 'USMCA qualification assessment and optimization roadmap',
    price: 175,
    basePrice: 175,
    monthlyCapacity: 15,
    avgCompletion: '3-5 days',
    teamLead: 'Cristina', // Cristina leads 70%
    cristinaEffort: 70,
    jorgeEffort: 30,
    defaultTemplate: 'usmca_advantage',
    defaultDeliverable: 'usmca_roadmap',

    stages: [
      {
        id: 1,
        name: 'Client Onboarding',
        icon: '📋',
        component: 'JorgeClientIntakeStage',
        description: 'Jorge conducts intake and collects supply chain data'
      },
      {
        id: 2,
        name: 'Technical Review',
        icon: '📊',
        component: 'CristinaDocumentReviewStage',
        description: 'Cristina validates USMCA qualification requirements'
      },
      {
        id: 3,
        name: 'AI Analysis',
        icon: '🤖',
        component: 'AIAnalysisValidationStage',
        description: 'AI calculates regional content and qualification paths'
      },
      {
        id: 4,
        name: 'Optimization Roadmap',
        icon: '📄',
        component: 'ReportGenerationStage',
        description: 'Deliver USMCA optimization strategy and roadmap'
      }
    ]
  },

  // ========== SERVICE 3: SUPPLY CHAIN OPTIMIZATION ($275) ==========
  'supply-chain-optimization': {
    type: 'supply-chain-optimization',
    name: 'Supply Chain Optimization',
    icon: '🔧',
    description: 'Complete supply chain efficiency audit and cost reduction',
    price: 275,
    basePrice: 275,
    monthlyCapacity: 12,
    avgCompletion: '5-7 days',
    teamLead: 'Cristina', // Cristina leads 60%
    cristinaEffort: 60,
    jorgeEffort: 40,
    defaultTemplate: 'supply_chain_optimization',
    defaultDeliverable: 'optimization_report',

    stages: [
      {
        id: 1,
        name: 'Client Onboarding',
        icon: '📋',
        component: 'JorgeClientIntakeStage',
        description: 'Jorge gathers current supply chain details and pain points'
      },
      {
        id: 2,
        name: 'Process Analysis',
        icon: '📊',
        component: 'CristinaDocumentReviewStage',
        description: 'Cristina analyzes logistics processes and inefficiencies'
      },
      {
        id: 3,
        name: 'AI Analysis',
        icon: '🤖',
        component: 'AIAnalysisValidationStage',
        description: 'AI identifies optimization opportunities and cost savings'
      },
      {
        id: 4,
        name: 'Optimization Plan',
        icon: '📄',
        component: 'ReportGenerationStage',
        description: 'Deliver efficiency improvements and cost reduction plan'
      }
    ]
  },

  // ========== SERVICE 4: PATHFINDER MARKET ENTRY ($350) ==========
  'pathfinder': {
    type: 'pathfinder',
    name: 'Pathfinder Market Entry',
    icon: '🚀',
    description: 'Mexico market analysis and distribution strategy',
    price: 350,
    basePrice: 350,
    monthlyCapacity: 10,
    avgCompletion: '5-7 days',
    teamLead: 'Jorge', // Jorge leads 65%
    jorgeEffort: 65,
    cristinaEffort: 35,
    defaultTemplate: 'pathfinder_market_entry',
    defaultDeliverable: 'market_entry_strategy',

    stages: [
      {
        id: 1,
        name: 'Client Onboarding',
        icon: '📋',
        component: 'JorgeClientIntakeStage',
        description: 'Jorge conducts intake and defines market entry goals'
      },
      {
        id: 2,
        name: 'Compliance Review',
        icon: '📊',
        component: 'CristinaDocumentReviewStage',
        description: 'Cristina reviews regulatory requirements for Mexico market'
      },
      {
        id: 3,
        name: 'AI Analysis',
        icon: '🤖',
        component: 'AIAnalysisValidationStage',
        description: 'AI analyzes market opportunities and competitive landscape'
      },
      {
        id: 4,
        name: 'Entry Strategy',
        icon: '📄',
        component: 'ReportGenerationStage',
        description: 'Jorge delivers market entry strategy and distribution plan'
      }
    ]
  },

  // ========== SERVICE 5: SUPPLY CHAIN RESILIENCE ($450) ==========
  'supply-chain-resilience': {
    type: 'supply-chain-resilience',
    name: 'Supply Chain Resilience',
    icon: '🛡️',
    description: 'Alternative supplier research and USMCA qualification',
    price: 450,
    basePrice: 450,
    monthlyCapacity: 8,
    avgCompletion: '7-10 days',
    teamLead: 'Jorge', // Jorge leads 60%
    jorgeEffort: 60,
    cristinaEffort: 40,
    defaultTemplate: 'supply_chain_resilience',
    defaultDeliverable: 'resilience_plan',

    stages: [
      {
        id: 1,
        name: 'Client Onboarding',
        icon: '📋',
        component: 'JorgeClientIntakeStage',
        description: 'Jorge identifies supplier dependencies and risk factors'
      },
      {
        id: 2,
        name: 'Risk Assessment',
        icon: '📊',
        component: 'CristinaDocumentReviewStage',
        description: 'Cristina assesses compliance and USMCA qualification risks'
      },
      {
        id: 3,
        name: 'AI Analysis',
        icon: '🤖',
        component: 'AIAnalysisValidationStage',
        description: 'AI identifies alternative suppliers and diversification strategies'
      },
      {
        id: 4,
        name: 'Resilience Plan',
        icon: '📄',
        component: 'ReportGenerationStage',
        description: 'Jorge delivers supplier diversification and backup plan'
      }
    ]
  },

  // ========== SERVICE 6: CRISIS NAVIGATOR ($200) ==========
  'crisis-navigator': {
    type: 'crisis-navigator',
    name: 'Crisis Navigator',
    icon: '🆘',
    description: 'Priority emergency response for trade crises and compliance issues',
    price: 200,
    basePrice: 200,
    monthlyCapacity: 15,
    avgCompletion: '24-48 hours',
    teamLead: 'Cristina', // Cristina leads 60%
    cristinaEffort: 60,
    jorgeEffort: 40,
    defaultTemplate: 'crisis_navigator',
    defaultDeliverable: 'crisis_resolution',

    stages: [
      {
        id: 1,
        name: 'Crisis Assessment',
        icon: '🚨',
        component: 'JorgeClientIntakeStage',
        description: 'Jorge assesses crisis urgency and business impact'
      },
      {
        id: 2,
        name: 'Technical Analysis',
        icon: '📊',
        component: 'CristinaDocumentReviewStage',
        description: 'Cristina identifies root cause and compliance issues'
      },
      {
        id: 3,
        name: 'AI Analysis',
        icon: '🤖',
        component: 'AIAnalysisValidationStage',
        description: 'AI generates resolution strategy and alternatives'
      },
      {
        id: 4,
        name: 'Crisis Resolution',
        icon: '📄',
        component: 'ReportGenerationStage',
        description: 'Cristina delivers immediate action plan and prevention measures'
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
    jorge: [
      'trade-health-check',      // 50% Jorge
      'pathfinder',              // 65% Jorge lead
      'supply-chain-resilience'  // 60% Jorge lead
    ],
    cristina: [
      'trade-health-check',          // 50% Cristina
      'usmca-advantage',             // 70% Cristina lead
      'supply-chain-optimization',   // 60% Cristina lead
      'crisis-navigator'             // 60% Cristina lead
    ]
  };

  return servicesByMember[teamMember] || [];
}

// Helper function to get service metrics
export function getServiceMetrics(serviceType) {
  const config = getServiceConfig(serviceType);
  if (!config) return null;

  return {
    price: config.price,
    basePrice: config.basePrice || config.price,
    monthlyCapacity: config.monthlyCapacity,
    avgCompletion: config.avgCompletion,
    monthlyRevenue: config.price * config.monthlyCapacity,
    isRecurring: config.isRecurring || false,
    teamLead: config.teamLead,
    cristinaEffort: config.cristinaEffort,
    jorgeEffort: config.jorgeEffort
  };
}

// Helper function to calculate service price with subscription discounts
export function calculateServicePrice(serviceType, subscriptionTier) {
  const config = getServiceConfig(serviceType);
  if (!config) return null;

  const basePrice = config.price;

  // Subscription tier discounts
  const TIER_DISCOUNTS = {
    'Starter': 0,          // No discount
    'Professional': 0.15,  // 15% off
    'Premium': 0.25        // 25% off
  };

  const discount = TIER_DISCOUNTS[subscriptionTier] || 0;
  const finalPrice = discount > 0 ? Math.round(basePrice * (1 - discount)) : basePrice;

  return {
    basePrice,
    discount,
    discountPercentage: discount * 100,
    finalPrice,
    subscriptionTier
  };
}
