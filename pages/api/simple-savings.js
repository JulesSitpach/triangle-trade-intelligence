// Simple volume-based savings calculator
// No database queries - just basic calculations with clear disclaimers

// Tariff rates by country (simplified estimates)
const TARIFF_RATES = {
  'CN': 0.25,  // 25% average tariff from China
  'IN': 0.20,  // 20% average tariff from India
  'VN': 0.15,  // 15% average tariff from Vietnam
  'TH': 0.12,  // 12% average tariff from Thailand
  'MY': 0.10,  // 10% average tariff from Malaysia
  'KR': 0.08,  // 8% average tariff from South Korea
  'JP': 0.05,  // 5% average tariff from Japan
  'TW': 0.15,  // 15% average tariff from Taiwan
  'SG': 0.05,  // 5% average tariff from Singapore
  'ID': 0.18,  // 18% average tariff from Indonesia
  'PH': 0.12,  // 12% average tariff from Philippines
  'BD': 0.22,  // 22% average tariff from Bangladesh
  'PK': 0.20,  // 20% average tariff from Pakistan
  'TR': 0.15,  // 15% average tariff from Turkey
  'MX': 0.00   // 0% USMCA partner (already duty-free)
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

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const {
      importVolume,
      supplierCountry,
      businessType = 'Manufacturing',
      products = [],
      destinationCountry = 'US'
    } = req.body
    
    // Basic validation
    if (!importVolume || !supplierCountry) {
      return res.status(400).json({
        error: 'Import volume and supplier country are required',
        disclaimer: 'ESTIMATE - NOT VERIFIED DATA'
      })
    }
    
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
    const currentTariffRate = TARIFF_RATES[supplierCountry] || 0.15
    const businessRisk = BUSINESS_RISK_FACTORS[businessType] || 1.0
    
    // Apply business type risk factor
    const adjustedTariffRate = currentTariffRate * businessRisk
    
    // Current route calculations
    const currentTariffCost = annualImportValue * adjustedTariffRate
    const currentTransitTime = TRANSIT_TIMES.direct[supplierCountry] || 30
    
    // Triangle route (through Mexico) calculations
    const triangleTariffRate = 0.0  // USMCA 0% tariff
    const triangleTariffCost = annualImportValue * triangleTariffRate
    const triangleTransitTime = TRANSIT_TIMES.triangle[supplierCountry] || 18
    
    // Additional costs for triangle routing (manufacturing/processing in Mexico)
    const mexicoProcessingCost = annualImportValue * 0.03  // 3% processing cost estimate
    const totalTriangleCost = triangleTariffCost + mexicoProcessingCost
    
    // Savings calculations
    const annualTariffSavings = currentTariffCost - totalTriangleCost
    const monthlyTariffSavings = annualTariffSavings / 12
    const transitTimeSaved = Math.max(0, currentTransitTime - triangleTransitTime)
    const savingsPercentage = ((annualTariffSavings / currentTariffCost) * 100) || 0
    
    // Confidence calculation based on data quality
    const baseConfidence = 80
    const volumeConfidence = importVolume === 'Under $500K' ? -5 : 
                           importVolume === 'Over $25M' ? 10 : 0
    const countryConfidence = ['CN', 'IN', 'VN'].includes(supplierCountry) ? 10 : 0
    
    const confidence = Math.min(95, Math.max(60, baseConfidence + volumeConfidence + countryConfidence))
    
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
        recommendation: annualTariffSavings > 50000 ? 
          'Strong candidate for triangle routing' : 
          annualTariffSavings > 10000 ?
          'Consider triangle routing for cost optimization' :
          'Limited savings potential - evaluate other factors',
        confidence: Math.round(confidence),
        implementationComplexity: getImplementationComplexity(),
        paybackPeriod: annualTariffSavings > 0 ? 
          `${Math.round((50000 / Math.max(annualTariffSavings, 1)) * 12)} months` : 
          'Not applicable'
      },
      
      riskFactors: {
        supplierCountryRisk: currentTariffRate > 0.2 ? 'High' : 
                           currentTariffRate > 0.1 ? 'Medium' : 'Low',
        businessTypeRisk: businessType === 'Medical' ? 'High - Regulatory' :
                         businessType === 'Electronics' ? 'Medium - Quality' : 'Low',
        volumeRisk: annualImportValue > 25000000 ? 'High - Large exposure' :
                   annualImportValue < 500000 ? 'Low - Small volume' : 'Medium'
      },
      
      nextSteps: [
        'Verify tariff rates with customs authorities',
        'Identify Mexico manufacturing/processing partners',
        'Calculate total landed cost including all fees',
        'Assess regulatory compliance requirements',
        'Pilot program with small volume'
      ],
      
      disclaimer: [
        'ESTIMATE ONLY - NOT VERIFIED DATA',
        'Actual tariff rates vary by specific HS codes',
        'Additional costs may apply (logistics, processing, compliance)',
        'Consult customs authorities and trade specialists',
        'Triangle routing requires Mexico manufacturing/processing setup'
      ].join(' • '),
      
      calculation: {
        importVolume,
        supplierCountry,
        businessType,
        baseTariffRate: currentTariffRate,
        adjustedTariffRate: Math.round(adjustedTariffRate * 1000) / 1000,
        businessRiskFactor: businessRisk
      },
      
      timestamp: new Date().toISOString()
    }
    
    res.status(200).json(response)
    
  } catch (error) {
    console.error('Simple savings calculation error:', error)
    
    // Fallback response
    res.status(200).json({
      savings: {
        annualTariffSavings: 0,
        monthlyTariffSavings: 0,
        totalSavingsUSD: 0,
        savingsPercentage: 0
      },
      analysis: {
        recommendation: 'Unable to calculate - please try again',
        confidence: 50,
        implementationComplexity: 'Unknown'
      },
      disclaimer: 'CALCULATION ERROR - ESTIMATES NOT AVAILABLE. Consult trade specialists.',
      error: true,
      timestamp: new Date().toISOString()
    })
  }
}