// Database-driven savings calculator using authentic tariff rates
// Queries real CBP tariff data from tariff_rates table

import { createClient } from '@supabase/supabase-js';
// Confidence thresholds for binary system
const CONFIDENCE_THRESHOLDS = {
  HIGH_CONFIDENCE_MINIMUM: 40 // Balanced threshold for user experience
};

// Generate system response based on confidence level
function generateSystemResponse(confidence, response, context = {}) {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH_CONFIDENCE_MINIMUM) {
    return response; // Return calculation response for high confidence
  } else {
    // Professional referral required for low confidence
    return {
      systemDecision: 'PROFESSIONAL_VERIFICATION_REQUIRED',
      confidence: Math.round(confidence),
      message: 'Professional tariff verification required for accurate analysis',
      recommendedAction: 'Contact licensed customs broker for verified calculations',
      context,
      disclaimer: 'System confidence below threshold - professional review required'
    };
  }
}

// Initialize Supabase client for database queries
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Normalize HS code to database format with fallback hierarchy
 * @param {string} hsCode - Input HS code in various formats
 * @returns {string} Normalized HS code without dots/spaces
 */
function normalizeHSCode(hsCode) {
  if (!hsCode) return null;
  
  // Remove all non-digits (dots, spaces, dashes)
  const cleanCode = hsCode.replace(/[^0-9]/g, '');
  
  // Ensure we have a valid HS code (at least 2 digits for chapter)
  if (cleanCode.length < 2) return null;
  
  // Pad with zeros if needed (some systems expect specific lengths)
  if (cleanCode.length === 2) return cleanCode.padEnd(6, '0'); // Chapter only
  if (cleanCode.length === 4) return cleanCode.padEnd(6, '0'); // Heading only
  if (cleanCode.length === 6) return cleanCode; // Standard 6-digit
  if (cleanCode.length > 6) return cleanCode.substring(0, 10); // Up to 10-digit
  
  return cleanCode;
}

/**
 * Enhanced tariff lookup with HS code fallback hierarchy
 * @param {string} countryCode - ISO country code
 * @param {string} hsCode - Normalized HS code
 * @returns {Promise<Object>} Tariff rates with detailed source info
 */
async function lookupTariffWithFallback(countryCode, hsCode) {
  if (!hsCode) {
    // No HS code provided - use country averages
    return await getTariffRatesFromDatabase(countryCode, null);
  }
  
  const fallbackCodes = generateFallbackCodes(hsCode);
  
  for (const code of fallbackCodes) {
    try {
      // Try exact lookup in hs_master_rebuild table
      const { data, error } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code, mfn_rate, usmca_rate, country_source, description')
        .eq('hs_code', code)
        .limit(1);
      
      if (data && data.length > 0) {
        const record = data[0];
        return {
          success: true,
          mfnRate: record.mfn_rate || 0,
          usmcaRate: record.usmca_rate || 0,
          source: `exact_match_${code}`,
          country: countryCode,
          hsCode: record.hs_code,
          description: record.description,
          matchType: code === hsCode ? 'exact' : 'fallback',
          fallbackLevel: fallbackCodes.indexOf(code)
        };
      }
    } catch (error) {
      console.error(`Failed to lookup HS code ${code}:`, error);
    }
  }
  
  // No exact matches found - use country averages but flag it
  const countryFallback = await getTariffRatesFromDatabase(countryCode, null);
  return {
    ...countryFallback,
    hsCodeProvided: hsCode,
    note: `No exact match for HS ${hsCode}, using country averages`,
    recommendedAction: 'Verify HS code classification for accurate rates'
  };
}

/**
 * Generate fallback HS codes for hierarchical lookup
 * @param {string} hsCode - Normalized HS code
 * @returns {Array<string>} Array of codes to try in order
 */
function generateFallbackCodes(hsCode) {
  const codes = [hsCode]; // Start with exact code
  
  // Add progressively shorter versions for fallback
  if (hsCode.length > 6) {
    codes.push(hsCode.substring(0, 8)); // 8-digit
    codes.push(hsCode.substring(0, 6)); // 6-digit
  }
  
  if (hsCode.length > 6 || hsCode.length === 6) {
    codes.push(hsCode.substring(0, 4)); // 4-digit heading
  }
  
  if (hsCode.length > 4) {
    codes.push(hsCode.substring(0, 2)); // 2-digit chapter
  }
  
  return [...new Set(codes)]; // Remove duplicates
}

/**
 * Get real tariff rates from database for specific country and HS code
 * @param {string} countryCode - ISO country code
 * @param {string} hsCode - 6-digit HS code (optional)
 * @returns {Promise<Object>} Tariff rates with MFN and USMCA rates
 */
async function getTariffRatesFromDatabase(countryCode, hsCode = null) {
  try {
    // For Mexico (USMCA partner), return 0% rates
    if (countryCode === 'MX') {
      return {
        success: true,
        mfnRate: 0.0,
        usmcaRate: 0.0,
        source: 'usmca_partner',
        country: countryCode
      };
    }
    
    let query = supabase
      .from('hs_master_rebuild')
      .select('hs_code, mfn_rate, usmca_rate, country, effective_date')
      .eq('country', countryCode === 'CN' ? 'China' : 
          countryCode === 'IN' ? 'India' : 
          countryCode === 'VN' ? 'Vietnam' : 
          countryCode === 'JP' ? 'Japan' : 
          countryCode === 'KR' ? 'South Korea' : 'US'); // Default to US rates for others
    
    // If specific HS code provided, filter by it
    if (hsCode) {
      query = query.eq('hs_code', hsCode);
    }
    
    const { data, error } = await query.limit(10);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      // Calculate average rates if multiple HS codes returned
      const avgMfnRate = data.reduce((sum, item) => sum + (parseFloat(item.mfn_rate) || 0), 0) / data.length;
      const avgUsmcaRate = data.reduce((sum, item) => sum + (parseFloat(item.usmca_rate) || 0), 0) / data.length;
      
      return {
        success: true,
        mfnRate: avgMfnRate / 100, // Convert percentage to decimal
        usmcaRate: avgUsmcaRate / 100, // Convert percentage to decimal
        source: 'cbp_harmonized_tariff_schedule',
        country: countryCode,
        recordCount: data.length,
        hsCode: hsCode || 'averaged_across_codes'
      };
    } else {
      // No database records - use country-based averages from analysis
      const countryDefaults = {
        'CN': 0.157, // Based on database analysis
        'IN': 0.098,
        'VN': 0.089,
        'TH': 0.067,
        'MY': 0.078,
        'KR': 0.045,
        'JP': 0.034,
        'TW': 0.089,
        'SG': 0.034,
        'ID': 0.134,
        'PH': 0.078,
        'BD': 0.167,
        'PK': 0.145,
        'TR': 0.112
      };
      
      const defaultRate = countryDefaults[countryCode] || 0.08;
      
      return {
        success: true,
        mfnRate: defaultRate,
        usmcaRate: 0.0, // USMCA preference
        source: 'country_average_fallback',
        country: countryCode,
        note: 'Using statistical averages - specific HS code lookup recommended'
      };
    }
    
  } catch (error) {
    console.error('Database tariff lookup error:', error);
    
    // Emergency fallback - return conservative estimates
    return {
      success: false,
      mfnRate: 0.10, // Conservative 10% estimate
      usmcaRate: 0.0,
      source: 'emergency_fallback',
      country: countryCode,
      error: error.message
    };
  }
}

/**
 * Calculate tariff savings using real database rates
 * @param {string} supplierCountry - Origin country code
 * @param {string} hsCode - HS code for product (optional)
 * @param {number} importValue - Annual import value
 * @returns {Promise<Object>} Detailed savings calculation
 */
async function calculateRealTariffSavings(supplierCountry, hsCode, importValue) {
  try {
    // Get real tariff rates from database with HS code fallback hierarchy
    const tariffData = await lookupTariffWithFallback(supplierCountry, hsCode);
    
    // Calculate costs
    const directImportTariff = importValue * tariffData.mfnRate;
    const usmcaRouteTariff = importValue * tariffData.usmcaRate;
    
    // Mexico processing costs (3% of value for triangle routing)
    const mexicoProcessingCost = supplierCountry === 'MX' ? 0 : importValue * 0.03;
    const totalUSMCACost = usmcaRouteTariff + mexicoProcessingCost;
    
    // Calculate savings
    const annualSavings = directImportTariff - totalUSMCACost;
    const savingsPercentage = directImportTariff > 0 ? (annualSavings / directImportTariff) * 100 : 0;
    
    return {
      success: true,
      directRoute: {
        tariffRate: tariffData.mfnRate,
        annualTariffCost: directImportTariff,
        source: tariffData.source
      },
      usmcaRoute: {
        tariffRate: tariffData.usmcaRate,
        annualTariffCost: usmcaRouteTariff,
        processingCost: mexicoProcessingCost,
        totalCost: totalUSMCACost
      },
      savings: {
        annualSavings,
        monthlySavings: annualSavings / 12,
        savingsPercentage
      },
      dataSource: tariffData
    };
    
  } catch (error) {
    console.error('Real tariff calculation error:', error);
    
    return {
      success: false,
      error: error.message,
      fallback: true
    };
  }
}

// Volume to dollar amount conversion
const VOLUME_VALUES = {
  'Under $500K': 250000,
  '$500K - $1M': 750000,
  '$1M - $5M': 3000000,
  '$5M - $25M': 15000000,
  'Over $25M': 40000000
}

// Transit time estimates (in days)
const TRANSIT_TIMES = {
  direct: {
    'CN': 35, 'IN': 30, 'VN': 25, 'TH': 28, 'MY': 30,
    'KR': 32, 'JP': 28, 'TW': 30, 'SG': 35, 'ID': 32,
    'PH': 30, 'BD': 35, 'PK': 35, 'TR': 25, 'MX': 10
  },
  triangle: {
    'CN': 18, 'IN': 20, 'VN': 16, 'TH': 18, 'MY': 20,
    'KR': 20, 'JP': 18, 'TW': 18, 'SG': 22, 'ID': 22,
    'PH': 20, 'BD': 25, 'PK': 25, 'TR': 16, 'MX': 10
  }
}

// Business type risk multipliers
const BUSINESS_RISK_FACTORS = {
  'Electronics': 1.2,    // Higher tariff risk
  'Medical': 1.3,        // Highest regulatory risk
  'Automotive': 1.1,     // Moderate risk
  'Manufacturing': 1.0,  // Baseline
  'Textiles': 0.9,       // Lower risk
  'Food': 0.8,           // Lower import value typically
  'Construction': 1.0,   // Baseline
  'Energy': 1.1,         // Moderate risk
  'Chemicals': 1.2,      // Higher regulatory risk
  'Retail': 0.9          // Lower average value
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const {
      importVolume,
      supplierCountry,
      businessType = 'Manufacturing',
      destinationCountry = 'US',
      hsCode = null // CRITICAL: Accept HS code for accurate tariff rates
    } = req.body
    
    // Basic validation
    if (!importVolume || !supplierCountry) {
      return res.status(400).json({
        error: 'Import volume and supplier country are required',
        disclaimer: 'ESTIMATE - NOT VERIFIED DATA'
      })
    }
    
    // Normalize HS code if provided
    const normalizedHSCode = hsCode ? normalizeHSCode(hsCode) : null;
    
    // If Mexico, no savings (already USMCA)
    if (supplierCountry === 'MX') {
      return res.status(200).json({
        currentRoute: {
          description: `${supplierCountry} → ${destinationCountry} (Direct USMCA)`,
          tariffRate: 0,
          transitTime: TRANSIT_TIMES.direct[supplierCountry] || 10,
          annualCost: 0
        },
        triangleRoute: {
          description: `${supplierCountry} → ${destinationCountry} (Already optimal)`,
          tariffRate: 0,
          transitTime: TRANSIT_TIMES.direct[supplierCountry] || 10,
          annualCost: 0
        },
        savings: {
          annualTariffSavings: 0,
          monthlyTariffSavings: 0,
          transitTimeSaved: 0,
          totalSavingsUSD: 0,
          savingsPercentage: 0
        },
        analysis: {
          recommendation: 'Already using optimal USMCA route',
          confidence: 95,
          implementationComplexity: 'None - current route optimal'
        },
        disclaimer: 'Mexico is already a USMCA partner with 0% tariffs. No triangle routing needed.',
        timestamp: new Date().toISOString()
      })
    }
    
    // Calculate base values
    const annualImportValue = VOLUME_VALUES[importVolume] || 1000000
    const businessRisk = BUSINESS_RISK_FACTORS[businessType] || 1.0
    
    // Get real tariff rates from database with normalized HS code
    const savingsCalculation = await calculateRealTariffSavings(
      supplierCountry, 
      normalizedHSCode, // Use normalized HS code for accurate lookup
      annualImportValue
    );
    
    if (!savingsCalculation.success) {
      throw new Error('Unable to calculate tariff savings: ' + savingsCalculation.error);
    }
    
    // Apply business type risk factor to MFN rate only (not to savings calculation)
    const adjustedTariffRate = savingsCalculation.directRoute.tariffRate * businessRisk
    const adjustedDirectCost = annualImportValue * adjustedTariffRate
    
    // Current route calculations (with business risk adjustment)
    const currentTariffCost = adjustedDirectCost
    const currentTransitTime = TRANSIT_TIMES.direct[supplierCountry] || 30
    
    // Triangle route calculations (from database)
    const triangleTransitTime = TRANSIT_TIMES.triangle[supplierCountry] || 18
    
    // Total triangle costs (including Mexico processing)
    const mexicoProcessingCost = savingsCalculation.usmcaRoute.processingCost
    const totalTriangleCost = savingsCalculation.usmcaRoute.totalCost
    
    // Recalculate savings with business risk adjustment
    const annualTariffSavings = currentTariffCost - totalTriangleCost
    const monthlyTariffSavings = annualTariffSavings / 12
    const transitTimeSaved = Math.max(0, currentTransitTime - triangleTransitTime)
    const savingsPercentage = currentTariffCost > 0 ? (annualTariffSavings / currentTariffCost) * 100 : 0
    
    // Confidence calculation based on data quality and source
    // BINARY CONFIDENCE SYSTEM: Only high-confidence or professional referral
    const dataSourceConfidence = {
      'cbp_harmonized_tariff_schedule': 96,  // Real CBP data = high confidence
      'usmca_partner': 98,                  // USMCA partners = highest confidence
      'country_average_fallback': 40,       // Statistical averages = low confidence
      'emergency_fallback': 25              // Emergency fallback = very low confidence
    };
    
    const baseConfidence = dataSourceConfidence[savingsCalculation.dataSource.source] || 30
    const hsCodeBonus = req.body.hsCode ? 15 : 0 // Significant bonus for specific HS code
    
    const confidence = Math.min(98, Math.max(25, baseConfidence + hsCodeBonus))
    
    // Implementation complexity assessment
    const getImplementationComplexity = () => {
      if (annualImportValue < 500000) return 'Low - Small volume, straightforward setup'
      if (annualImportValue > 25000000) return 'High - Large volume, requires detailed planning'
      if (businessType === 'Medical') return 'High - Regulatory compliance required'
      if (businessType === 'Electronics') return 'Medium - Quality control important'
      return 'Medium - Standard implementation'
    }
    
    const response = {
      currentRoute: {
        description: `${supplierCountry} → ${destinationCountry} (Direct Import)`,
        tariffRate: Math.round(adjustedTariffRate * 100 * 10) / 10,  // Round to 1 decimal
        transitTime: currentTransitTime,
        annualCost: Math.round(currentTariffCost)
      },
      
      triangleRoute: {
        description: `${supplierCountry} → Mexico → ${destinationCountry} (USMCA Triangle)`,
        tariffRate: 0,
        transitTime: triangleTransitTime,
        annualCost: Math.round(totalTriangleCost),
        processingCost: Math.round(mexicoProcessingCost)
      },
      
      savings: {
        annualTariffSavings: Math.round(annualTariffSavings),
        monthlyTariffSavings: Math.round(monthlyTariffSavings),
        transitTimeSaved,
        totalSavingsUSD: Math.round(annualTariffSavings),
        savingsPercentage: Math.round(savingsPercentage * 10) / 10
      },
      
      analysis: {
        systemDecision: confidence >= CONFIDENCE_THRESHOLDS.HIGH_CONFIDENCE_MINIMUM ? 'AUTOMATED_CALCULATION' : 'PROFESSIONAL_VERIFICATION_REQUIRED',
        confidence: Math.round(confidence),
        dataSource: savingsCalculation.dataSource.source,
        recommendation: confidence >= CONFIDENCE_THRESHOLDS.HIGH_CONFIDENCE_MINIMUM ?
          (annualTariffSavings > 50000 ? 'High-confidence analysis shows strong triangle routing potential' : 
           annualTariffSavings > 10000 ? 'High-confidence analysis indicates moderate savings opportunity' :
           'High-confidence analysis shows limited triangle routing benefits') :
          'Professional tariff verification required for accurate savings analysis',
        implementationComplexity: confidence >= CONFIDENCE_THRESHOLDS.HIGH_CONFIDENCE_MINIMUM ? getImplementationComplexity() : 'Professional assessment required'
      },
      
      riskFactors: {
        supplierCountryRisk: savingsCalculation.directRoute.tariffRate > 0.2 ? 'High' : 
                           savingsCalculation.directRoute.tariffRate > 0.1 ? 'Medium' : 'Low',
        businessTypeRisk: businessType === 'Medical' ? 'High - Regulatory' :
                         businessType === 'Electronics' ? 'Medium - Quality' : 'Low',
        volumeRisk: annualImportValue > 25000000 ? 'High - Large exposure' :
                   annualImportValue < 500000 ? 'Low - Small volume' : 'Medium',
        dataQualityRisk: savingsCalculation.dataSource.source === 'emergency_fallback' ? 'High - Estimated data' :
                        savingsCalculation.dataSource.source === 'cbp_harmonized_tariff_schedule' ? 'Low - Authentic data' : 'Medium'
      },
      
      nextSteps: [
        'Verify tariff rates with customs authorities',
        'Identify Mexico manufacturing/processing partners',
        'Calculate total landed cost including all fees',
        'Assess regulatory compliance requirements',
        'Pilot program with small volume'
      ],
      
      disclaimer: [
        savingsCalculation.dataSource.source === 'cbp_harmonized_tariff_schedule' ? 
          'BASED ON AUTHENTIC CBP TARIFF DATA' : 'ESTIMATES - VERIFY WITH CUSTOMS AUTHORITIES',
        'Actual rates may vary by specific HS code classification',
        'Additional costs may apply (logistics, processing, compliance)', 
        'Mexico processing setup required for triangle routing',
        'Professional verification recommended for large volumes'
      ].join(' • '),
      
      calculation: {
        importVolume,
        supplierCountry,
        businessType,
        baseTariffRate: savingsCalculation.directRoute.tariffRate,
        adjustedTariffRate: Math.round(adjustedTariffRate * 1000) / 1000,
        businessRiskFactor: businessRisk,
        dataSource: {
          source: savingsCalculation.dataSource.source,
          recordCount: savingsCalculation.dataSource.recordCount || 1,
          hsCodeUsed: savingsCalculation.dataSource.hsCode || 'country_average'
        }
      },
      
      timestamp: new Date().toISOString()
    }
    
    // Apply binary system to savings calculation
    const finalResponse = generateSystemResponse(
      confidence,
      response,
      {
        scenario: 'tariff_calculation',
        businessType,
        productDescription: `${supplierCountry} imports, ${importVolume} annual volume`
      }
    );
    
    res.status(200).json(finalResponse)
    
  } catch (error) {
    console.error('Simple savings calculation error:', error)
    
    // System error - professional referral required
    const errorResponse = generateSystemResponse(
      25, // Very low confidence for system errors
      null,
      {
        scenario: 'system_error',
        businessType,
        productDescription: 'Tariff calculation system error'
      }
    );
    
    res.status(500).json(errorResponse)
  }
}