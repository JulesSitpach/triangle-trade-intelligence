/**
 * USMCA Postal Code Intelligence System
 * Enterprise-grade postal code validation and geographic intelligence
 * for United States, Canada, and Mexico
 */

import { getSupabaseClient } from '../supabase-client.js'
import { logDebug, logInfo, logError, logDBQuery, logPerformance } from '../utils/production-logger.js'

const supabase = getSupabaseClient()

/**
 * USMCA Postal Code Validation Patterns
 */
const POSTAL_PATTERNS = {
  US: {
    pattern: /^(\d{5})(-\d{4})?$/,
    name: 'US ZIP Code',
    examples: ['90210', '90210-1234'],
    format: 'NNNNN or NNNNN-NNNN'
  },
  CA: {
    pattern: /^([A-Z]\d[A-Z])\s?(\d[A-Z]\d)$/i,
    name: 'Canadian Postal Code',
    examples: ['K1A 0A6', 'M5V3A8'],
    format: 'ANA NAN'
  },
  MX: {
    pattern: /^(\d{5})$/,
    name: 'Mexican Postal Code (Código Postal)',
    examples: ['01000', '11000'],
    format: 'NNNNN'
  }
}

/**
 * US ZIP Code Geographic Intelligence (Major Metro Areas)
 */
const US_ZIP_INTELLIGENCE = {
  // West Coast - Primary USMCA Gateway
  '90': { state: 'CA', metro: 'Los Angeles', region: 'West Coast', ports: ['Los Angeles', 'Long Beach'], usmcaGateway: true },
  '91': { state: 'CA', metro: 'Los Angeles', region: 'West Coast', ports: ['Los Angeles', 'Long Beach'], usmcaGateway: true },
  '92': { state: 'CA', metro: 'San Diego', region: 'West Coast', ports: ['San Diego'], usmcaGateway: true },
  '93': { state: 'CA', metro: 'Central Valley', region: 'West Coast', ports: ['Los Angeles', 'Oakland'], usmcaGateway: true },
  '94': { state: 'CA', metro: 'San Francisco', region: 'West Coast', ports: ['Oakland', 'San Francisco'], usmcaGateway: true },
  '95': { state: 'CA', metro: 'Sacramento', region: 'West Coast', ports: ['Oakland', 'Sacramento'], usmcaGateway: true },
  '98': { state: 'WA', metro: 'Seattle', region: 'Pacific Northwest', ports: ['Seattle', 'Tacoma'], usmcaGateway: true },
  '97': { state: 'OR', metro: 'Portland', region: 'Pacific Northwest', ports: ['Portland'], usmcaGateway: true },
  
  // Southwest - Mexico Border States
  '85': { state: 'AZ', metro: 'Phoenix', region: 'Southwest', ports: ['Los Angeles', 'Long Beach'], mexicoBorder: true },
  '87': { state: 'NM', metro: 'Albuquerque', region: 'Southwest', ports: ['Houston'], mexicoBorder: true },
  '78': { state: 'TX', metro: 'San Antonio', region: 'South Texas', ports: ['Houston'], mexicoBorder: true, usmcaGateway: true },
  '79': { state: 'TX', metro: 'El Paso', region: 'West Texas', ports: ['Houston'], mexicoBorder: true, usmcaGateway: true },
  '77': { state: 'TX', metro: 'Houston', region: 'Gulf Coast', ports: ['Houston'], usmcaGateway: true },
  '75': { state: 'TX', metro: 'Dallas', region: 'North Texas', ports: ['Houston'], usmcaGateway: true },
  
  // East Coast - Traditional Trade Centers
  '10': { state: 'NY', metro: 'New York', region: 'Northeast', ports: ['New York', 'Newark'], usmcaGateway: true },
  '07': { state: 'NJ', metro: 'Newark', region: 'Northeast', ports: ['Newark', 'New York'], usmcaGateway: true },
  '11': { state: 'NY', metro: 'Brooklyn/Queens', region: 'Northeast', ports: ['New York', 'Newark'], usmcaGateway: true },
  '02': { state: 'MA', metro: 'Boston', region: 'Northeast', ports: ['Boston'], usmcaGateway: true },
  '19': { state: 'PA', metro: 'Philadelphia', region: 'Mid-Atlantic', ports: ['Philadelphia'], usmcaGateway: true },
  '33': { state: 'FL', metro: 'Miami', region: 'Southeast', ports: ['Miami', 'Port Everglades'], usmcaGateway: true },
  
  // Midwest - Industrial Centers
  '60': { state: 'IL', metro: 'Chicago', region: 'Midwest', ports: ['Chicago'], usmcaGateway: true },
  '48': { state: 'MI', metro: 'Detroit', region: 'Great Lakes', ports: ['Detroit'], canadaBorder: true, usmcaGateway: true },
  '44': { state: 'OH', metro: 'Cleveland', region: 'Great Lakes', ports: ['Cleveland'], canadaBorder: true },
  '55': { state: 'MN', metro: 'Minneapolis', region: 'Upper Midwest', ports: ['Duluth'], canadaBorder: true },
  
  // Additional Major Markets
  '80': { state: 'CO', metro: 'Denver', region: 'Mountain West', ports: ['Los Angeles', 'Houston'], usmcaGateway: false },
  '30': { state: 'GA', metro: 'Atlanta', region: 'Southeast', ports: ['Savannah'], usmcaGateway: true },
  '28': { state: 'NC', metro: 'Charlotte', region: 'Southeast', ports: ['Charleston', 'Norfolk'], usmcaGateway: true }
}

/**
 * Canadian Postal Code Geographic Intelligence (First Letter = Province/Territory)
 */
const CANADIAN_POSTAL_INTELLIGENCE = {
  // Atlantic Canada
  'A': { province: 'NL', region: 'Atlantic Canada', metro: 'St. Johns', ports: ['Halifax'], usmcaGateway: true },
  'B': { province: 'NS', region: 'Atlantic Canada', metro: 'Halifax', ports: ['Halifax'], usmcaGateway: true },
  'C': { province: 'PE', region: 'Atlantic Canada', metro: 'Charlottetown', ports: ['Halifax'], usmcaGateway: true },
  'E': { province: 'NB', region: 'Atlantic Canada', metro: 'Moncton', ports: ['Halifax', 'Saint John'], usmcaGateway: true },
  
  // Quebec
  'G': { province: 'QC', region: 'Eastern Quebec', metro: 'Quebec City', ports: ['Montreal', 'Quebec'], usmcaGateway: true },
  'H': { province: 'QC', region: 'Montreal Area', metro: 'Montreal', ports: ['Montreal'], usmcaGateway: true },
  'J': { province: 'QC', region: 'Western Quebec', metro: 'Sherbrooke', ports: ['Montreal'], usmcaGateway: true },
  
  // Ontario - Major USMCA Hub
  'K': { province: 'ON', region: 'Eastern Ontario', metro: 'Ottawa', ports: ['Montreal'], usmcaGateway: true, usBorder: true },
  'L': { province: 'ON', region: 'Central Ontario', metro: 'Hamilton', ports: ['Toronto'], usmcaGateway: true, usBorder: true },
  'M': { province: 'ON', region: 'Toronto Area', metro: 'Toronto', ports: ['Toronto'], usmcaGateway: true, usBorder: true },
  'N': { province: 'ON', region: 'Southwestern Ontario', metro: 'London', ports: ['Toronto'], usmcaGateway: true, usBorder: true },
  'P': { province: 'ON', region: 'Northern Ontario', metro: 'Thunder Bay', ports: ['Thunder Bay'], usmcaGateway: true, usBorder: true },
  
  // Prairie Provinces
  'R': { province: 'MB', region: 'Manitoba', metro: 'Winnipeg', ports: ['Churchill'], usmcaGateway: true, usBorder: true },
  'S': { province: 'SK', region: 'Saskatchewan', metro: 'Regina', ports: ['Churchill'], usmcaGateway: true, usBorder: true },
  'T': { province: 'AB', region: 'Alberta', metro: 'Calgary', ports: ['Vancouver'], usmcaGateway: true, usBorder: true },
  
  // British Columbia - Pacific Gateway
  'V': { province: 'BC', region: 'British Columbia', metro: 'Vancouver', ports: ['Vancouver'], usmcaGateway: true, usBorder: true },
  
  // Territories
  'X': { province: 'NT/NU', region: 'Northwest Territories', metro: 'Yellowknife', ports: ['Churchill'], usmcaGateway: false },
  'Y': { province: 'YT', region: 'Yukon', metro: 'Whitehorse', ports: ['Vancouver'], usmcaGateway: false }
}

/**
 * Mexican Postal Code Geographic Intelligence (First 2 digits = State)
 */
const MEXICAN_POSTAL_INTELLIGENCE = {
  // Mexico City Area
  '01': { state: 'CDMX', region: 'Mexico City', metro: 'Mexico City', ports: ['Veracruz', 'Manzanillo'], usmcaGateway: true },
  '02': { state: 'CDMX', region: 'Mexico City', metro: 'Mexico City', ports: ['Veracruz', 'Manzanillo'], usmcaGateway: true },
  '03': { state: 'CDMX', region: 'Mexico City', metro: 'Mexico City', ports: ['Veracruz', 'Manzanillo'], usmcaGateway: true },
  
  // Northern Border States - USMCA Hubs
  '21': { state: 'BCN', region: 'Baja California Norte', metro: 'Tijuana', ports: ['Ensenada'], usBorder: true, usmcaGateway: true },
  '22': { state: 'BCN', region: 'Baja California Norte', metro: 'Mexicali', ports: ['Ensenada'], usBorder: true, usmcaGateway: true },
  '23': { state: 'BCS', region: 'Baja California Sur', metro: 'La Paz', ports: ['La Paz'], usmcaGateway: true },
  '26': { state: 'SON', region: 'Sonora', metro: 'Hermosillo', ports: ['Guaymas'], usBorder: true, usmcaGateway: true },
  '31': { state: 'CHH', region: 'Chihuahua', metro: 'Chihuahua', ports: ['Manzanillo'], usBorder: true, usmcaGateway: true },
  '32': { state: 'CHH', region: 'Chihuahua', metro: 'Ciudad Juarez', ports: ['Manzanillo'], usBorder: true, usmcaGateway: true },
  '25': { state: 'COA', region: 'Coahuila', metro: 'Saltillo', ports: ['Altamira'], usBorder: true, usmcaGateway: true },
  '88': { state: 'TAM', region: 'Tamaulipas', metro: 'Nuevo Laredo', ports: ['Altamira'], usBorder: true, usmcaGateway: true },
  
  // Manufacturing Centers
  '64': { state: 'NLE', region: 'Nuevo León', metro: 'Monterrey', ports: ['Altamira'], usmcaGateway: true },
  '44': { state: 'JAL', region: 'Jalisco', metro: 'Guadalajara', ports: ['Manzanillo'], usmcaGateway: true },
  '45': { state: 'JAL', region: 'Jalisco', metro: 'Guadalajara', ports: ['Manzanillo'], usmcaGateway: true },
  '20': { state: 'AGS', region: 'Aguascalientes', metro: 'Aguascalientes', ports: ['Manzanillo'], usmcaGateway: true },
  
  // Central Manufacturing
  '76': { state: 'QRO', region: 'Querétaro', metro: 'Querétaro', ports: ['Veracruz', 'Manzanillo'], usmcaGateway: true },
  '36': { state: 'GTO', region: 'Guanajuato', metro: 'León', ports: ['Manzanillo'], usmcaGateway: true },
  '42': { state: 'HGO', region: 'Hidalgo', metro: 'Pachuca', ports: ['Veracruz'], usmcaGateway: true },
  '50': { state: 'MEX', region: 'Estado de México', metro: 'Toluca', ports: ['Veracruz', 'Manzanillo'], usmcaGateway: true },
  
  // Gulf Coast Ports
  '91': { state: 'VER', region: 'Veracruz', metro: 'Veracruz', ports: ['Veracruz'], usmcaGateway: true },
  '94': { state: 'VER', region: 'Veracruz', metro: 'Coatzacoalcos', ports: ['Coatzacoalcos'], usmcaGateway: true },
  
  // Pacific Ports
  '28': { state: 'COL', region: 'Colima', metro: 'Manzanillo', ports: ['Manzanillo'], usmcaGateway: true },
  '82': { state: 'SIN', region: 'Sinaloa', metro: 'Mazatlán', ports: ['Mazatlán'], usmcaGateway: true }
}

/**
 * Main USMCA Postal Intelligence Class
 */
export class USMCAPostalIntelligence {
  
  /**
   * Validate and derive geographic intelligence from postal code
   */
  static async deriveGeographicIntelligence(postalCode) {
    const startTime = Date.now()
    
    try {
      if (!postalCode || typeof postalCode !== 'string') {
        return { error: 'Invalid postal code provided', confidence: 0 }
      }

      const cleanCode = postalCode.trim().toUpperCase()
      
      // Step 1: Identify country and validate format
      const countryDetection = this.detectCountryAndValidate(cleanCode)
      if (!countryDetection.valid) {
        return { error: countryDetection.error, confidence: 0 }
      }

      // Step 2: Get geographic intelligence based on country
      let geographic
      switch (countryDetection.country) {
        case 'US':
          geographic = this.deriveUSIntelligence(cleanCode, countryDetection)
          break
        case 'CA':
          geographic = this.deriveCanadianIntelligence(cleanCode, countryDetection)
          break
        case 'MX':
          geographic = this.deriveMexicanIntelligence(cleanCode, countryDetection)
          break
        default:
          return { error: 'Unsupported country', confidence: 0 }
      }

      // Step 3: Enhance with database lookup (if available)
      try {
        const databaseEnhancement = await this.enhanceWithDatabase(cleanCode, geographic)
        if (databaseEnhancement) {
          geographic = { ...geographic, ...databaseEnhancement, enhanced: true }
        }
      } catch (dbError) {
        logError('Database enhancement failed', { postalCode: cleanCode, error: dbError })
        // Continue with static intelligence
      }

      // Step 4: Add USMCA context and trade intelligence
      geographic = this.addUSMCAContext(geographic)

      const duration = Date.now() - startTime
      logPerformance('USMCA Postal Intelligence', duration, { 
        postalCode: cleanCode, 
        country: countryDetection.country,
        confidence: geographic.confidence 
      })

      return geographic

    } catch (error) {
      logError('USMCA Postal Intelligence Error', { postalCode, error })
      return { 
        error: 'Failed to process postal code', 
        confidence: 0,
        fallback: true 
      }
    }
  }

  /**
   * Detect country and validate postal code format
   */
  static detectCountryAndValidate(postalCode) {
    for (const [country, config] of Object.entries(POSTAL_PATTERNS)) {
      const match = postalCode.match(config.pattern)
      if (match) {
        return {
          valid: true,
          country: country,
          formatted: postalCode,
          pattern: config.name,
          groups: match
        }
      }
    }

    return {
      valid: false,
      error: `Invalid postal code format. Supported: ${Object.values(POSTAL_PATTERNS).map(p => p.format).join(', ')}`
    }
  }

  /**
   * Derive US geographic intelligence
   */
  static deriveUSIntelligence(zipCode, detection) {
    const zipPrefix = zipCode.substring(0, 2)
    const intelligence = US_ZIP_INTELLIGENCE[zipPrefix]

    if (intelligence) {
      return {
        country: 'United States',
        countryCode: 'US',
        state: intelligence.state,
        metro: intelligence.metro,
        region: intelligence.region,
        ports: intelligence.ports,
        postalCode: zipCode,
        usmcaGateway: intelligence.usmcaGateway || false,
        mexicoBorder: intelligence.mexicoBorder || false,
        canadaBorder: intelligence.canadaBorder || false,
        confidence: 85,
        source: 'USMCA_US_Intelligence'
      }
    }

    // Fallback to regional analysis for unknown ZIP codes
    const zipNum = parseInt(zipCode.substring(0, 3))
    let region = 'Continental US'
    let ports = ['Various']
    let usmcaGateway = false

    if (zipNum >= 900) { region = 'West Coast'; ports = ['Los Angeles', 'Seattle']; usmcaGateway = true }
    else if (zipNum >= 800) { region = 'Mountain West'; ports = ['Los Angeles', 'Seattle'] }
    else if (zipNum >= 700) { region = 'South Central'; ports = ['Houston']; usmcaGateway = true }
    else if (zipNum >= 600) { region = 'Midwest'; ports = ['Chicago']; usmcaGateway = true }
    else if (zipNum >= 0) { region = 'East Coast'; ports = ['New York', 'Miami']; usmcaGateway = true }

    return {
      country: 'United States',
      countryCode: 'US',
      state: 'US',
      metro: region,
      region: region,
      ports: ports,
      postalCode: zipCode,
      usmcaGateway: usmcaGateway,
      confidence: 70,
      source: 'USMCA_US_Regional_Analysis'
    }
  }

  /**
   * Derive Canadian geographic intelligence
   */
  static deriveCanadianIntelligence(postalCode, detection) {
    const firstLetter = postalCode.charAt(0)
    const intelligence = CANADIAN_POSTAL_INTELLIGENCE[firstLetter]

    if (intelligence) {
      return {
        country: 'Canada',
        countryCode: 'CA',
        province: intelligence.province,
        metro: intelligence.metro,
        region: intelligence.region,
        ports: intelligence.ports,
        postalCode: postalCode,
        usmcaGateway: intelligence.usmcaGateway,
        usBorder: intelligence.usBorder || false,
        confidence: 90,
        source: 'USMCA_CA_Intelligence'
      }
    }

    return {
      country: 'Canada',
      countryCode: 'CA',
      province: 'CA',
      metro: 'Canadian Location',
      region: 'Canada',
      ports: ['Halifax', 'Vancouver'],
      postalCode: postalCode,
      usmcaGateway: true,
      confidence: 60,
      source: 'USMCA_CA_Fallback'
    }
  }

  /**
   * Derive Mexican geographic intelligence
   */
  static deriveMexicanIntelligence(postalCode, detection) {
    const statePrefix = postalCode.substring(0, 2)
    const intelligence = MEXICAN_POSTAL_INTELLIGENCE[statePrefix]

    if (intelligence) {
      return {
        country: 'Mexico',
        countryCode: 'MX',
        state: intelligence.state,
        metro: intelligence.metro,
        region: intelligence.region,
        ports: intelligence.ports,
        postalCode: postalCode,
        usmcaGateway: intelligence.usmcaGateway,
        usBorder: intelligence.usBorder || false,
        confidence: 85,
        source: 'USMCA_MX_Intelligence'
      }
    }

    return {
      country: 'Mexico',
      countryCode: 'MX',
      state: 'MX',
      metro: 'Mexican Location',
      region: 'Mexico',
      ports: ['Veracruz', 'Manzanillo'],
      postalCode: postalCode,
      usmcaGateway: true,
      confidence: 70,
      source: 'USMCA_MX_Fallback'
    }
  }

  /**
   * Enhance with database lookup (if postal_intelligence table exists)
   */
  static async enhanceWithDatabase(postalCode, geographic) {
    try {
      const { data, error } = await supabase
        .from('postal_intelligence')
        .select('*')
        .eq('postal_code', postalCode)
        .limit(1)

      if (error) {
        logDebug('Postal database lookup failed (table may not exist)', { error })
        return null
      }

      if (data && data.length > 0) {
        const dbData = data[0]
        logDebug('Enhanced postal intelligence from database', { postalCode })
        
        return {
          // Override with database data
          metro: dbData.city || geographic.metro,
          region: dbData.region || geographic.region,
          ports: dbData.nearest_ports || geographic.ports,
          shippingZone: dbData.shipping_zone,
          taxJurisdiction: dbData.tax_jurisdiction,
          economicZone: dbData.economic_zone,
          confidence: Math.min(95, geographic.confidence + 10)
        }
      }

      return null
    } catch (error) {
      logError('Database enhancement error', { error })
      return null
    }
  }

  /**
   * Add USMCA trade context
   */
  static addUSMCAContext(geographic) {
    const usmcaContext = {
      tradeAdvantages: [],
      triangleRoutingPotential: 'Medium',
      preferentialTariffs: false
    }

    if (geographic.usmcaGateway) {
      usmcaContext.preferentialTariffs = true
      usmcaContext.tradeAdvantages.push('USMCA 0% tariff eligibility')
      usmcaContext.triangleRoutingPotential = 'High'
    }

    if (geographic.usBorder || geographic.mexicoBorder || geographic.canadaBorder) {
      usmcaContext.tradeAdvantages.push('Cross-border logistics hub')
      usmcaContext.triangleRoutingPotential = 'Very High'
    }

    if (geographic.ports && geographic.ports.length > 0) {
      usmcaContext.tradeAdvantages.push('Direct port access')
    }

    return {
      ...geographic,
      usmcaContext,
      confidence: Math.min(100, geographic.confidence + (usmcaContext.preferentialTariffs ? 5 : 0))
    }
  }

  /**
   * Validate multiple postal codes (batch processing)
   */
  static async validateBatch(postalCodes) {
    const results = []
    
    for (const code of postalCodes) {
      const result = await this.deriveGeographicIntelligence(code)
      results.push({ postalCode: code, ...result })
    }

    return results
  }

  /**
   * Get supported countries and formats
   */
  static getSupportedFormats() {
    return POSTAL_PATTERNS
  }
}

export default USMCAPostalIntelligence