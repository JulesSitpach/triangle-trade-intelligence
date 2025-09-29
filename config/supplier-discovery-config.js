/**
 * Supplier Discovery Configuration
 * All hardcoded values extracted to configuration
 */

export const SUPPLIER_DISCOVERY_CONFIG = {
  // Scoring weights for supplier evaluation
  scoring: {
    productMatch: 0.3,
    qualityAlignment: 0.25,
    volumeCapability: 0.20,
    paymentCompatibility: 0.15,
    usmcaAdvantage: 0.10
  },

  // Cost estimation multipliers
  costMultipliers: {
    competitive: 0.85,
    market: 0.90,
    premium: 0.95
  },

  // Volume capacity multipliers
  volumeMultipliers: {
    standard: 1.5,
    high: 2.0,
    premium: 3.0
  },

  // Mexico manufacturing regions with characteristics
  manufacturingRegions: [
    {
      city: 'Tijuana',
      state: 'Baja California',
      characteristics: ['border_proximity', 'us_logistics', 'maquiladora_zone'],
      specialties: ['electronics', 'automotive', 'medical_devices'],
      urgency_priority: true
    },
    {
      city: 'Guadalajara',
      state: 'Jalisco',
      characteristics: ['manufacturing_hub', 'tech_center', 'infrastructure'],
      specialties: ['electronics', 'aerospace', 'automotive'],
      urgency_priority: false
    },
    {
      city: 'Monterrey',
      state: 'Nuevo Leon',
      characteristics: ['industrial_center', 'automotive_hub', 'skilled_workforce'],
      specialties: ['automotive', 'steel', 'machinery'],
      urgency_priority: false
    },
    {
      city: 'Juarez',
      state: 'Chihuahua',
      characteristics: ['border_proximity', 'maquiladora_zone', 'cost_effective'],
      specialties: ['electronics', 'automotive', 'textiles'],
      urgency_priority: true
    }
  ],

  // USMCA member countries
  usmcaCountries: ['US', 'Canada', 'Mexico'],

  // Tariff advantage data (should eventually come from database)
  tariffAdvantages: {
    'China': {
      percentage: 25,
      description: 'tariff savings vs China suppliers'
    },
    'Europe': {
      percentage: 15,
      description: 'Reduced shipping time and costs'
    }
  },

  // Quality certifications mapping
  certifications: {
    'iso_9001': 'ISO 9001',
    'iso_14001': 'ISO 14001',
    'fda': 'FDA Registered',
    'iatf_16949': 'IATF 16949',
    'ce': 'CE Marking'
  },

  // Default payment terms
  defaultPaymentTerms: 'NET 30',

  // Database default values
  databaseDefaults: {
    country: 'Mexico',
    verificationStatus: 'pending',
    partnershipLevel: 'basic'
  },

  // Risk assessment templates
  riskFactors: {
    immediate_timeline: 'Setup timeline may be tight',
    no_iso_certification: 'Quality certification verification needed',
    language_coordination: 'Language coordination requirements'
  },

  // Search time simulation (for demo)
  searchTimeRange: {
    min: 2.0,
    max: 4.5
  },

  // Sources for discovery logging
  searchSources: [
    'Mexico Trade Directory',
    'USMCA Supplier Database',
    'Manufacturing Directory',
    'Industry Associations'
  ]
};

// Helper function to get region by city name
export function getRegionByCity(cityName) {
  return SUPPLIER_DISCOVERY_CONFIG.manufacturingRegions.find(
    region => region.city.toLowerCase() === cityName.toLowerCase()
  );
}

// Helper function to get urgent regions
export function getUrgentRegions() {
  return SUPPLIER_DISCOVERY_CONFIG.manufacturingRegions
    .filter(region => region.urgency_priority)
    .map(region => region.city);
}

// Helper function to calculate cost estimate
export function calculateCostEstimate(targetCost, tier = 'market') {
  if (!targetCost) return 'Competitive pricing';
  const multiplier = SUPPLIER_DISCOVERY_CONFIG.costMultipliers[tier] || 0.90;
  return targetCost * multiplier;
}

// Helper function to get tariff advantage
export function getTariffAdvantage(currentSupplierCountry) {
  return SUPPLIER_DISCOVERY_CONFIG.tariffAdvantages[currentSupplierCountry] || null;
}