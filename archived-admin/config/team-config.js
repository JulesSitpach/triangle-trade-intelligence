/**
 * TEAM CONFIGURATION
 * Dynamic team member configuration for trade risk recommendations
 * Data pulled from database with fallback configuration
 */

// Fallback team configuration (used when database is empty)
const FALLBACK_TEAM_CONFIG = {
  specialists: [
    {
      id: 'specialist_001',
      name: process.env.LATIN_AMERICA_SPECIALIST_NAME || 'Regional Specialist',
      role: 'Latin America Trade Specialist',
      specialties: ['Mexico partnerships', 'Latin America sourcing', 'USMCA compliance'],
      regions: ['Mexico', 'Latin America', 'Central America'],
      industries: ['Manufacturing', 'Electronics', 'Automotive'],
      contactTypes: ['supplier_vetting', 'market_entry', 'partnership_intelligence'],
      defaultMessage: 'Connect with our Latin America specialist for regional trade opportunities'
    },
    {
      id: 'specialist_002',
      name: process.env.LOGISTICS_SPECIALIST_NAME || 'Logistics Specialist',
      role: 'Customs & Logistics Specialist',
      specialties: ['Customs clearance', 'Triangle routing', 'Logistics optimization'],
      regions: ['North America', 'Cross-border operations'],
      industries: ['All industries'],
      contactTypes: ['customs_clearance', 'logistics_optimization', 'crisis_response'],
      defaultMessage: 'Connect with our logistics specialist for customs and routing solutions'
    }
  ],

  serviceTypes: {
    supplier_vetting: {
      name: 'Supplier Vetting & Introduction',
      price: parseInt(process.env.SUPPLIER_VETTING_PRICE || '750'),
      duration: process.env.SUPPLIER_VETTING_DURATION || '2-3 weeks',
      specialist: 'specialist_001'
    },
    market_entry: {
      name: 'Market Entry Strategy',
      price: parseInt(process.env.MARKET_ENTRY_PRICE || '400'),
      billing: 'hourly',
      minimum: '2 hours',
      specialist: 'specialist_001'
    },
    partnership_intelligence: {
      name: 'Partnership Intelligence Briefing',
      price: parseInt(process.env.PARTNERSHIP_INTEL_PRICE || '300'),
      billing: 'monthly',
      specialist: 'specialist_001'
    },
    customs_clearance: {
      name: 'Customs Clearance Support',
      price: parseInt(process.env.CUSTOMS_CLEARANCE_PRICE || '300'),
      billing: 'per shipment',
      specialist: 'specialist_002'
    },
    crisis_response: {
      name: 'Crisis Response',
      price: parseInt(process.env.CRISIS_RESPONSE_PRICE || '500'),
      billing: 'per incident',
      specialist: 'specialist_002'
    },
    hs_classification: {
      name: 'HS Code Classification',
      price: parseInt(process.env.HS_CLASSIFICATION_PRICE || '150'),
      billing: 'per product',
      specialist: 'specialist_002'
    }
  }
};

// Dynamic team data loading from database
export const loadTeamConfiguration = async () => {
  try {
    // Try to load from database first
    const response = await fetch('/api/admin/team-configuration');

    if (response.ok) {
      const teamData = await response.json();
      if (teamData.specialists && teamData.specialists.length > 0) {
        console.log('✅ Loaded team configuration from database');
        return teamData;
      }
    }
  } catch (error) {
    console.log('📋 Database team config unavailable, using fallback');
  }

  // Fallback to static configuration
  console.log('📋 Using fallback team configuration');
  return FALLBACK_TEAM_CONFIG;
};

// Get specialist by ID
export const getSpecialistById = (teamConfig, specialistId) => {
  return teamConfig.specialists.find(s => s.id === specialistId);
};

// Get specialist by specialty area
export const getSpecialistBySpecialty = (teamConfig, specialty) => {
  return teamConfig.specialists.find(s =>
    s.specialties.some(spec =>
      spec.toLowerCase().includes(specialty.toLowerCase())
    )
  );
};

// Get recommendations based on user profile
export const getTeamRecommendations = (teamConfig, userProfile) => {
  const recommendations = [];

  teamConfig.specialists.forEach(specialist => {
    // Check if specialist is relevant to user's industry
    const isIndustryRelevant = specialist.industries.includes('All industries') ||
      specialist.industries.some(industry =>
        userProfile.businessType?.toLowerCase().includes(industry.toLowerCase())
      );

    // Check if specialist is relevant to user's trade volume
    const isVolumeRelevant = userProfile.tradeVolume > 50000; // Minimum threshold

    if (isIndustryRelevant && isVolumeRelevant) {
      recommendations.push({
        specialist: specialist,
        relevance: calculateRelevance(specialist, userProfile),
        contactReason: generateContactReason(specialist, userProfile),
        recommendedServices: getRecommendedServices(teamConfig, specialist, userProfile)
      });
    }
  });

  return recommendations.sort((a, b) => b.relevance - a.relevance);
};

const calculateRelevance = (specialist, userProfile) => {
  let relevance = 0;

  // Industry match
  if (specialist.industries.includes('All industries')) {
    relevance += 50;
  } else {
    specialist.industries.forEach(industry => {
      if (userProfile.businessType?.toLowerCase().includes(industry.toLowerCase())) {
        relevance += 100;
      }
    });
  }

  // Trade volume relevance
  if (userProfile.tradeVolume > 1000000) {
    relevance += 30;
  } else if (userProfile.tradeVolume > 500000) {
    relevance += 20;
  } else if (userProfile.tradeVolume > 100000) {
    relevance += 10;
  }

  return relevance;
};

const generateContactReason = (specialist, userProfile) => {
  const baseMessage = specialist.defaultMessage;
  const industry = userProfile.businessType || 'your business';
  const volume = userProfile.tradeVolume || 0;

  if (specialist.role.includes('Latin America')) {
    return `${specialist.name} can help establish ${industry} partnerships to diversify your supply chain and reduce trade risks.`;
  } else if (specialist.role.includes('Logistics')) {
    return `${specialist.name} can design backup logistics strategies for your ${formatCurrency(volume)} annual trade volume.`;
  }

  return baseMessage;
};

const getRecommendedServices = (teamConfig, specialist, userProfile) => {
  const services = [];

  Object.entries(teamConfig.serviceTypes).forEach(([key, service]) => {
    if (service.specialist === specialist.id) {
      services.push({
        ...service,
        key: key,
        priority: calculateServicePriority(service, userProfile)
      });
    }
  });

  return services.sort((a, b) => b.priority - a.priority);
};

const calculateServicePriority = (service, userProfile) => {
  let priority = 0;

  // Higher trade volume = higher priority for expensive services
  if (userProfile.tradeVolume > 500000 && service.price > 500) {
    priority += 50;
  }

  // Certain services are always high priority
  if (service.name.includes('Crisis') || service.name.includes('Customs')) {
    priority += 30;
  }

  return priority;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default FALLBACK_TEAM_CONFIG;