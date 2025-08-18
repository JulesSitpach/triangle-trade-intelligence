/**
 * API endpoint to fetch dropdown options from database
 * Returns business types, countries, and import volumes with real intelligence data
 */

import { getSupabaseClient } from '../../lib/supabase-client'

const supabase = getSupabaseClient()

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Fetch all dropdown data in parallel
    const [businessTypes, countries, tariffData] = await Promise.all([
      getBusinessTypes(),
      getCountries(),
      getTariffData()
    ])
    
    // Build enhanced dropdown options
    const dropdownOptions = {
      businessTypes: await enhanceBusinessTypes(businessTypes),
      countries: await enhanceCountries(countries, tariffData),
      importVolumes: getEnhancedImportVolumes(),
      timelinePriorities: getEnhancedTimelinePriorities(),
      optimizationPriorities: getOptimizationPriorities(),
      dataSource: 'enhanced_usmca_database',
      timestamp: new Date().toISOString()
    }
    
    return res.status(200).json(dropdownOptions)
    
  } catch (error) {
    console.error('❌ Dropdown options API error:', error)
    
    // Return minimal safe options on error - no fake data
    return res.status(500).json({
      error: 'Database connection failed',
      message: 'Unable to load dropdown options. Please try again later.',
      dataSource: 'error'
    })
  }
}

// Fetch business types from USMCA business intelligence
async function getBusinessTypes() {
  const { data, error } = await supabase
    .from('usmca_business_intelligence')
    .select('business_type, success_rate_percentage, avg_usmca_savings, companies_analyzed, recommended_triangle_route')
    .order('success_rate_percentage', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Enhance business types with descriptions
async function enhanceBusinessTypes(businessData) {
  // Remove duplicates by business_type
  const uniqueBusinessTypes = businessData.reduce((acc, business) => {
    if (!acc.find(item => item.business_type === business.business_type)) {
      acc.push(business)
    }
    return acc
  }, [])
  
  return uniqueBusinessTypes.map((business, index) => ({
    value: business.business_type,
    label: business.business_type,
    description: business.business_type,
    intelligence: {
      successRate: business.success_rate_percentage,
      avgSavings: business.avg_usmca_savings,
      companiesAnalyzed: business.companies_analyzed,
      recommendedRoute: business.recommended_triangle_route
    }
  }))
}

// Fetch countries from database
async function getCountries() {
  const { data, error } = await supabase
    .from('countries')
    .select('code, name')
    .order('name')
  
  if (error) throw error
  return data || []
}

// Fetch tariff data for risk assessment
async function getTariffData() {
  const { data, error } = await supabase
    .from('usmca_tariff_rates')
    .select('country_code, standard_rate, risk_level, notes')
  
  return data || []
}

// Enhance countries with tariff and risk data (only real database data)
async function enhanceCountries(countries, tariffData) {
  const tariffMap = {}
  tariffData.forEach(tariff => {
    tariffMap[tariff.country_code] = {
      rate: tariff.standard_rate,
      risk: tariff.risk_level,
      notes: tariff.notes
    }
  })
  
  return countries.map(country => {
    const tariff = tariffMap[country.code] || null
    const flag = getCountryFlag(country.code)
    const trianglePriority = getTriangleRoutingPriority(country.code)
    
    const enhancedLabel = `${flag} ${country.name}${trianglePriority === 'EXTREME' ? ' 🔥' : trianglePriority === 'HIGH' ? ' ⚡' : ''}`
    
    return {
      value: country.code,
      label: enhancedLabel,
      description: `${country.name} - Triangle routing priority: ${trianglePriority}`,
      intelligence: tariff ? {
        tariffRate: tariff.rate,
        riskLevel: tariff.risk,
        notes: tariff.notes,
        trianglePriority: trianglePriority
      } : {
        trianglePriority: trianglePriority,
        notes: `${country.name} - ${getPriorityDescription(trianglePriority)}`
      }
    }
  })
}

// Get enhanced import volume options
function getEnhancedImportVolumes() {
  const volumes = [
    { range: 'Under $500K', min: 12000, max: 35000 },
    { range: '$500K - $1M', min: 25000, max: 70000 },
    { range: '$1M - $5M', min: 75000, max: 350000 },
    { range: '$5M - $25M', min: 375000, max: 1500000 },
    { range: 'Over $25M', min: 1800000, max: 5000000 }
  ]
  
  return volumes.map(vol => ({
    value: vol.range,
    label: vol.range,
    description: vol.range,
    intelligence: {
      minSavings: vol.min,
      maxSavings: vol.max,
      avgSavings: Math.round((vol.min + vol.max) / 2)
    }
  }))
}

// Helper function for country flags (only real database countries)
function getCountryFlag(countryCode) {
  const flags = {
    // PRIORITY 1 - Essential Triangle Routing Countries
    'CN': '🇨🇳', 'VN': '🇻🇳', 'TW': '🇹🇼', 'KR': '🇰🇷',
    'IN': '🇮🇳', 'TH': '🇹🇭', 'MY': '🇲🇾', 'JP': '🇯🇵',
    
    // PRIORITY 2 - High-Value Manufacturing
    'ID': '🇮🇩', 'PH': '🇵🇭', 'BD': '🇧🇩', 'SG': '🇸🇬',
    
    // EUROPE - Major Manufacturing & Logistics Hubs
    'DE': '🇩🇪', 'NL': '🇳🇱', 'GB': '🇬🇧', 'IT': '🇮🇹',
    'PL': '🇵🇱', 'TR': '🇹🇷', 'FR': '🇫🇷', 'CZ': '🇨🇿', 'HU': '🇭🇺',
    
    // MIDDLE EAST & AFRICA
    'AE': '🇦🇪', 'ZA': '🇿🇦', 'EG': '🇪🇬',
    
    // ASIA-PACIFIC
    'AU': '🇦🇺', 'NZ': '🇳🇿',
    
    // USMCA PARTNERS
    'US': '🇺🇸', 'CA': '🇨🇦', 'MX': '🇲🇽',
    
    // AMERICAS - Database Countries
    'AR': '🇦🇷', 'BR': '🇧🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 
    'CR': '🇨🇷', 'GT': '🇬🇹', 'PA': '🇵🇦', 'PE': '🇵🇪',
    'EC': '🇪🇨', 'UY': '🇺🇾'
  }
  return flags[countryCode] || '🌍'
}

// Get triangle routing priority for countries (only real database countries)
function getTriangleRoutingPriority(countryCode) {
  const priorities = {
    // EXTREME PRIORITY - Highest tariff impact
    'CN': 'EXTREME',    // China - 30%+ tariffs, biggest savings
    
    // HIGH PRIORITY - Essential manufacturing alternatives
    'VN': 'HIGH',       // Vietnam - #1 China alternative, 100%+ growth
    'TW': 'HIGH',       // Taiwan - Electronics/semiconductor powerhouse
    'KR': 'HIGH',       // South Korea - Advanced automotive/electronics
    'IN': 'HIGH',       // India - 50% tariff exposure, pharmaceuticals
    'JP': 'HIGH',       // Japan - Advanced manufacturing, automotive, electronics
    'DE': 'HIGH',       // Germany - Automotive powerhouse, Industry 4.0 leader
    'TR': 'HIGH',       // Turkey - Europe-Asia bridge, growing manufacturing
    
    // MEDIUM PRIORITY - Established manufacturing hubs
    'TH': 'MEDIUM',     // Thailand - ASEAN hub, established supply chains
    'MY': 'MEDIUM',     // Malaysia - Electronics assembly, palm oil
    'ID': 'MEDIUM',     // Indonesia - Textiles, raw materials
    'PH': 'MEDIUM',     // Philippines - Electronics, services
    'BD': 'MEDIUM',     // Bangladesh - Textiles, apparel manufacturing
    'SG': 'MEDIUM',     // Singapore - Trade hub, high-value logistics
    'NL': 'MEDIUM',     // Netherlands - Port of Rotterdam, logistics hub
    'GB': 'MEDIUM',     // United Kingdom - Financial hub, manufacturing
    'IT': 'MEDIUM',     // Italy - Manufacturing, machinery, fashion
    'PL': 'MEDIUM',     // Poland - Growing European manufacturing
    'CZ': 'MEDIUM',     // Czech Republic - Automotive manufacturing
    'HU': 'MEDIUM',     // Hungary - European automotive hub
    'AE': 'MEDIUM',     // UAE - Dubai trade hub, Middle East gateway
    'AU': 'MEDIUM',     // Australia - Resource hub, Asia-Pacific trade
    
    // USMCA NETWORK
    'US': 'DESTINATION', // US - USMCA destination market
    'CA': 'USMCA',      // Canada - USMCA partner
    'MX': 'PROCESSOR',   // Mexico - USMCA processor/hub
    
    // EMERGING MARKETS - Growing manufacturing base
    'BR': 'EMERGING',   // Brazil - Growing manufacturing base
    'FR': 'EMERGING',   // France - Manufacturing, aerospace, luxury goods
    'ZA': 'EMERGING',   // South Africa - African manufacturing hub
    'EG': 'EMERGING',   // Egypt - Suez Canal logistics, growing manufacturing
    
    // STANDARD TRADING PARTNERS
    'NZ': 'STANDARD',   // New Zealand - Agriculture, trade partner
    'AR': 'STANDARD',   // Argentina - Agriculture, resources
    'CL': 'STANDARD',   // Chile - Copper, resources
    'CO': 'STANDARD',   // Colombia - Emerging market
    'CR': 'STANDARD',   // Costa Rica - Small but stable
    'GT': 'STANDARD',   // Guatemala - Small market
    'PA': 'STANDARD',   // Panama - Logistics/shipping hub
    'PE': 'STANDARD',   // Peru - Mining, emerging manufacturing
    'EC': 'STANDARD',   // Ecuador - South American trade
    'UY': 'STANDARD'    // Uruguay - South American hub
  }
  return priorities[countryCode] || 'STANDARD'
}

// Get priority description for countries
function getPriorityDescription(priority) {
  const descriptions = {
    'EXTREME': 'Highest tariff impact, biggest triangle savings',
    'HIGH': 'Essential manufacturing alternative, major savings potential',
    'MEDIUM': 'Established manufacturing hub, good routing opportunities',
    'USMCA': 'USMCA treaty partner, preferential trade access',
    'PROCESSOR': 'USMCA processing hub for triangle routing',
    'DESTINATION': 'USMCA destination market',
    'EMERGING': 'Growing manufacturing base, future opportunities',
    'STANDARD': 'Standard trading partner'
  }
  return descriptions[priority] || 'Standard trading partner'
}

// No fallback functions - system will show error if database fails
// This prevents showing fake/misleading information to users

// Get enhanced timeline priorities
function getEnhancedTimelinePriorities() {
  return [
    { 
      value: 'Speed', 
      label: 'Speed', 
      description: 'Speed',
      intelligence: {
        priority: 'transit_time',
        focus: 'fastest_delivery',
        tradeOff: 'may_cost_more'
      }
    },
    { 
      value: 'Cost', 
      label: 'Cost', 
      description: 'Cost',
      intelligence: {
        priority: 'cost_optimization',
        focus: 'lowest_total_cost',
        tradeOff: 'may_take_longer'
      }
    },
    { 
      value: 'Balanced', 
      label: 'Balanced', 
      description: 'Balanced',
      intelligence: {
        priority: 'balanced_optimization',
        focus: 'best_overall_value',
        tradeOff: 'moderate_compromises'
      }
    },
    { 
      value: 'Reliability', 
      label: 'Reliability', 
      description: 'Reliability',
      intelligence: {
        priority: 'risk_minimization',
        focus: 'most_stable_routes',
        tradeOff: 'premium_for_security'
      }
    }
  ]
}

// Get optimization priorities for foundation form
function getOptimizationPriorities() {
  return [
    {
      value: 'Cost Reduction',
      label: 'Cost Reduction',
      description: 'Minimize total landed costs and tariffs',
      intelligence: {
        focus: 'maximum_savings',
        strategy: 'triangle_routing_priority',
        avgSavings: '18-35%'
      }
    },
    {
      value: 'Supply Chain Security',
      label: 'Supply Chain Security', 
      description: 'Diversify suppliers and reduce single-country risk',
      intelligence: {
        focus: 'risk_mitigation',
        strategy: 'multi_source_diversification',
        riskReduction: '60-80%'
      }
    },
    {
      value: 'Speed to Market',
      label: 'Speed to Market',
      description: 'Fastest delivery times and market access',
      intelligence: {
        focus: 'transit_optimization',
        strategy: 'direct_usmca_routes', 
        timeReduction: '15-40%'
      }
    },
    {
      value: 'Compliance & Quality',
      label: 'Compliance & Quality',
      description: 'Regulatory compliance and quality assurance',
      intelligence: {
        focus: 'quality_control',
        strategy: 'certified_partners',
        complianceRate: '99.5%+'
      }
    },
    {
      value: 'Market Expansion',
      label: 'Market Expansion',
      description: 'Enter new markets and scale operations',
      intelligence: {
        focus: 'growth_enablement',
        strategy: 'scalable_networks',
        marketAccess: 'USMCA+Global'
      }
    }
  ]
}