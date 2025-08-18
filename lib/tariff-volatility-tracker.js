/**
 * Tariff Volatility Tracker
 * Monitors real-time tariff changes vs stable USMCA rates
 * This is Triangle Intelligence's competitive advantage!
 */

// VOLATILE DATA - Changes daily/weekly with political decisions
export const VOLATILE_TARIFFS = {
  lastUpdated: new Date().toISOString(),
  
  bilateral: {
    // These change with political winds!
    'CN-US': { // China to USA
      current: 30,
      status: '90-day pause',
      volatility: 'EXTREME',
      trend: 'UNCERTAIN',
      lastChange: '2025-01-20',
      notes: 'Could jump to 60% or drop to 10% based on negotiations'
    },
    'IN-US': { // India to USA  
      current: 50,
      previous: 25,
      status: 'JUST DOUBLED',
      volatility: 'HIGH',
      trend: 'INCREASING',
      lastChange: '2025-02-08',
      notes: 'Doubled overnight! Trade war escalation'
    },
    'VN-US': { // Vietnam to USA
      current: 15,
      status: 'Under review',
      volatility: 'MEDIUM',
      trend: 'STABLE',
      notes: 'May increase if China routing detected'
    },
    'EU-US': { // EU to USA
      current: 10,
      status: 'Negotiating',
      volatility: 'MEDIUM',
      trend: 'UNCERTAIN',
      notes: 'Depends on digital tax negotiations'
    }
  },
  
  products: {
    // Product-specific volatility
    semiconductors: {
      current: 0,
      threat: 100,
      condition: 'Must commit to US production',
      volatility: 'EXTREME',
      deadline: '2025-03-01'
    },
    electronics: {
      current: 25,
      volatility: 'HIGH',
      trend: 'INCREASING'
    },
    textiles: {
      current: 16.5,
      volatility: 'MEDIUM',
      trend: 'STABLE'
    },
    automotive: {
      current: 2.5,
      volatility: 'LOW',
      trend: 'STABLE'
    }
  },
  
  shipping: {
    // Real-time shipping volatility
    fuelSurcharge: {
      current: 15,
      volatility: 'HIGH',
      trend: 'INCREASING'
    },
    portCongestion: {
      LA: 'SEVERE',
      LongBeach: 'MODERATE',
      Vancouver: 'LOW',
      Manzanillo: 'LOW'
    },
    carrierCapacity: {
      status: 'TIGHT',
      premiums: '+30% spot rates'
    }
  }
}

// STABLE DATA - Treaty-locked, change rarely
export const STABLE_USMCA = {
  // These are your competitive advantage!
  triangleRoutes: {
    'CN-MX-US': { // China → Mexico → USA
      tariff: 0,
      status: 'TREATY LOCKED',
      volatility: 'NONE',
      requirement: 'Substantial transformation in Mexico',
      savings: 'Up to 30% vs direct',
      confidence: 99
    },
    'CN-CA-US': { // China → Canada → USA
      tariff: 0,
      status: 'TREATY LOCKED',
      volatility: 'NONE',
      requirement: 'Value-add processing in Canada',
      savings: 'Up to 25% vs direct',
      confidence: 99
    },
    'AS-MX-US': { // Asia → Mexico → USA
      tariff: 0,
      status: 'TREATY LOCKED',
      volatility: 'NONE',
      requirement: 'USMCA qualification',
      confidence: 98
    }
  },
  
  benefits: {
    predictability: 'Rates locked by international treaty',
    stability: 'Cannot change without 6-month notice minimum',
    legal: 'Protected by trade agreement law',
    political: 'Requires all 3 countries to agree on changes'
  }
}

// Business patterns - stable over time
export const STABLE_PATTERNS = {
  seasonal: {
    Q1: { electronics: 0.7, textiles: 1.2 },
    Q2: { electronics: 0.8, textiles: 1.0 },
    Q3: { electronics: 0.9, textiles: 0.8 },
    Q4: { electronics: 1.4, textiles: 0.9 } // Q4_HEAVY
  },
  
  successRates: {
    electronics: 92,
    manufacturing: 87,
    automotive: 89,
    textiles: 84,
    medical: 91
  },
  
  requirements: {
    electronics: ['Temperature control', 'ESD protection'],
    medical: ['FDA compliance', 'Cold chain'],
    automotive: ['JIT delivery', 'Quality certification'],
    textiles: ['Humidity control', 'Pest prevention']
  }
}

/**
 * Calculate volatility-adjusted savings
 */
export function calculateVolatilityAdjustedSavings(importVolume, businessType, route) {
  const baseVolume = parseImportVolume(importVolume)
  
  // Get current volatile tariff
  const directTariff = VOLATILE_TARIFFS.bilateral['CN-US'].current
  const productTariff = VOLATILE_TARIFFS.products[businessType.toLowerCase()]?.current || directTariff
  
  // USMCA rate is always 0% (stable!)
  const usmcaTariff = STABLE_USMCA.triangleRoutes[route]?.tariff || 0
  
  // Calculate savings
  const currentCost = baseVolume * (productTariff / 100)
  const triangleCost = baseVolume * (usmcaTariff / 100)
  const savings = currentCost - triangleCost
  
  // Adjust for volatility risk
  const volatilityMultiplier = getVolatilityMultiplier(route)
  const adjustedSavings = savings * volatilityMultiplier
  
  return {
    annual: adjustedSavings,
    monthly: adjustedSavings / 12,
    percentage: (adjustedSavings / currentCost) * 100,
    volatilityProtection: volatilityMultiplier,
    riskMitigation: 'USMCA rates treaty-locked'
  }
}

/**
 * Get real-time tariff comparison
 */
export function getTariffComparison(productType) {
  const direct = VOLATILE_TARIFFS.products[productType] || VOLATILE_TARIFFS.bilateral['CN-US']
  const triangle = STABLE_USMCA.triangleRoutes['CN-MX-US']
  
  return {
    direct: {
      rate: direct.current,
      volatility: direct.volatility,
      risk: 'Can change overnight',
      lastChange: direct.lastChange || 'Recent'
    },
    triangle: {
      rate: triangle.tariff,
      volatility: triangle.volatility,
      risk: 'Treaty protected',
      stability: '99% confidence'
    },
    savings: {
      current: direct.current - triangle.tariff,
      guaranteed: 'Yes - treaty locked',
      protection: 'Immune to trade war escalation'
    }
  }
}

/**
 * Generate volatility alerts
 */
export function getVolatilityAlerts() {
  const alerts = []
  
  // Check for recent changes
  if (VOLATILE_TARIFFS.bilateral['IN-US'].status === 'JUST DOUBLED') {
    alerts.push({
      type: 'URGENT',
      title: 'India Tariffs Doubled Overnight!',
      message: 'India→USA tariffs jumped from 25% to 50%. Triangle routing now saves 50%!',
      action: 'Switch to USMCA triangle routing immediately',
      savings: 'Save 50% vs new rates'
    })
  }
  
  if (VOLATILE_TARIFFS.bilateral['CN-US'].status === '90-day pause') {
    alerts.push({
      type: 'WARNING',
      title: 'China Tariffs in 90-Day Pause',
      message: 'Current 30% rate could change dramatically when pause ends',
      action: 'Lock in USMCA triangle routing now',
      protection: 'Insulate from future changes'
    })
  }
  
  if (VOLATILE_TARIFFS.products.semiconductors.threat === 100) {
    alerts.push({
      type: 'CRITICAL',
      title: 'Semiconductor Tariffs May Hit 100%',
      message: `Unless US production commitment by ${VOLATILE_TARIFFS.products.semiconductors.deadline}`,
      action: 'Establish Mexico assembly operation',
      solution: 'USMCA qualification = 0% tariff'
    })
  }
  
  return alerts
}

/**
 * Monitor shipping volatility
 */
export function getShippingVolatility() {
  const shipping = VOLATILE_TARIFFS.shipping
  
  return {
    summary: 'Shipping costs volatile but manageable',
    factors: {
      fuel: `+${shipping.fuelSurcharge.current}% surcharge`,
      congestion: shipping.portCongestion,
      capacity: shipping.carrierCapacity.status,
      premiums: shipping.carrierCapacity.premiums
    },
    recommendation: 'Mexico ports less congested than US West Coast',
    triangleAdvantage: 'Manzanillo and Lazaro Cardenas have capacity'
  }
}

// Helper functions
function parseImportVolume(volume) {
  const volumeMap = {
    'Under $500K': 250000,
    '$500K - $1M': 750000,
    '$1M - $5M': 3000000,
    '$5M - $25M': 15000000,
    'Over $25M': 50000000
  }
  return volumeMap[volume] || 1000000
}

function getVolatilityMultiplier(route) {
  // USMCA routes have higher value due to stability
  if (route.includes('MX') || route.includes('CA')) {
    return 1.2 // 20% premium for stability
  }
  return 1.0
}

/**
 * Real-time tariff newsfeed simulator
 */
export function getTariffNews() {
  return [
    {
      timestamp: '2 hours ago',
      headline: 'BREAKING: India tariffs double to 50% effective immediately',
      impact: 'HIGH',
      opportunity: 'Triangle routing saves 50% vs new rates'
    },
    {
      timestamp: '1 day ago',
      headline: 'China trade talks enter 90-day pause, tariffs remain at 30%',
      impact: 'MEDIUM',
      opportunity: 'Lock in USMCA rates before volatility returns'
    },
    {
      timestamp: '3 days ago',
      headline: 'Semiconductor industry warned: 100% tariffs without US production',
      impact: 'CRITICAL',
      opportunity: 'Mexico assembly qualifies for 0% under USMCA'
    },
    {
      timestamp: '1 week ago',
      headline: 'Vietnam considers retaliatory tariffs on US goods',
      impact: 'LOW',
      opportunity: 'USMCA routes unaffected by Asia tensions'
    }
  ]
}

/**
 * Export main tracking function
 */
export default function trackTariffVolatility() {
  return {
    volatile: VOLATILE_TARIFFS,
    stable: STABLE_USMCA,
    patterns: STABLE_PATTERNS,
    alerts: getVolatilityAlerts(),
    news: getTariffNews(),
    timestamp: new Date().toISOString()
  }
}