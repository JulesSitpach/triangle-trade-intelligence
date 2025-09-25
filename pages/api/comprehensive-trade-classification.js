// Comprehensive Trade Classification System using existing Supabase data
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { product_description, origin_country, destination_country, trade_volume = 0 } = req.body

  if (!product_description) {
    return res.status(400).json({ error: 'Product description is required' })
  }

  try {
    console.log(`[CLASSIFICATION] Processing: "${product_description}" from ${origin_country} to ${destination_country}`)

    // Step 1: Find HS code using hs_master_rebuild (34,476 current records)
    const hsSearchResult = await findHSCode(product_description)

    if (!hsSearchResult.found) {
      return res.status(404).json({
        error: 'HS code not found',
        suggestions: hsSearchResult.suggestions
      })
    }

    // Step 2: Get current tariff rates from multiple tables
    const tariffData = await getTariffRates(hsSearchResult.hs_code, origin_country, destination_country)

    // Step 3: Check USMCA qualification and benefits
    const usmcaData = await checkUSMCABenefits(hsSearchResult.hs_code, hsSearchResult.chapter, origin_country, destination_country)

    // Step 4: Calculate savings potential
    const savingsCalculation = calculateTariffSavings(tariffData, usmcaData, trade_volume)

    // Step 5: Get trade intelligence from comtrade_reference
    const tradeIntelligence = await getTradeIntelligence(hsSearchResult.hs_code)

    const response = {
      status: 'success',
      timestamp: new Date().toISOString(),
      query: {
        product: product_description,
        origin: origin_country,
        destination: destination_country,
        trade_volume: trade_volume
      },
      classification: {
        hs_code: hsSearchResult.hs_code,
        description: hsSearchResult.description,
        chapter: hsSearchResult.chapter,
        confidence: hsSearchResult.confidence,
        data_source: 'hs_master_rebuild',
        effective_date: hsSearchResult.effective_date
      },
      tariff_analysis: {
        mfn_rate: tariffData.mfn_rate,
        usmca_rate: tariffData.usmca_rate,
        current_duty: savingsCalculation.current_duty,
        usmca_duty: savingsCalculation.usmca_duty,
        annual_savings: savingsCalculation.annual_savings,
        savings_percentage: savingsCalculation.savings_percentage
      },
      usmca_qualification: usmcaData,
      trade_intelligence: tradeIntelligence,
      recommendations: generateRecommendations(tariffData, usmcaData, savingsCalculation)
    }

    console.log(`[SUCCESS] Classification complete for ${hsSearchResult.hs_code}: $${savingsCalculation.annual_savings} potential savings`)

    return res.status(200).json(response)

  } catch (error) {
    console.error('[ERROR] Classification failed:', error)
    return res.status(500).json({
      error: 'Classification failed',
      details: error.message
    })
  }
}

// Find HS code using the comprehensive hs_master_rebuild table
async function findHSCode(productDescription) {
  try {
    // First, try exact match search
    const exactMatch = await supabase
      .from('hs_master_rebuild')
      .select('*')
      .ilike('description', `%${productDescription}%`)
      .limit(5)

    if (exactMatch.data && exactMatch.data.length > 0) {
      const best = exactMatch.data[0]
      return {
        found: true,
        hs_code: best.hs_code,
        description: best.description,
        chapter: best.chapter,
        confidence: 0.95,
        effective_date: best.effective_date,
        mfn_rate: best.mfn_rate,
        usmca_rate: best.usmca_rate
      }
    }

    // Try keyword-based search
    const keywords = productDescription.toLowerCase().split(' ')
    const keywordResults = []

    for (const keyword of keywords) {
      if (keyword.length > 3) {
        const result = await supabase
          .from('hs_master_rebuild')
          .select('*')
          .ilike('description', `%${keyword}%`)
          .limit(3)

        if (result.data) {
          keywordResults.push(...result.data)
        }
      }
    }

    if (keywordResults.length > 0) {
      const best = keywordResults[0]
      return {
        found: true,
        hs_code: best.hs_code,
        description: best.description,
        chapter: best.chapter,
        confidence: 0.75,
        effective_date: best.effective_date,
        mfn_rate: best.mfn_rate,
        usmca_rate: best.usmca_rate
      }
    }

    // Get suggestions for similar products
    const suggestions = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description')
      .limit(10)

    return {
      found: false,
      suggestions: suggestions.data || []
    }

  } catch (error) {
    console.error('HS Code search failed:', error)
    return { found: false, suggestions: [] }
  }
}

// Get tariff rates from multiple sources
async function getTariffRates(hsCode, originCountry, destinationCountry) {
  try {
    // Check specific tariff_rates table first
    const specificRates = await supabase
      .from('tariff_rates')
      .select('*')
      .eq('hs_code', hsCode.replace(/\./g, ''))
      .in('country', [destinationCountry, 'US', 'CA', 'MX'])

    if (specificRates.data && specificRates.data.length > 0) {
      const rate = specificRates.data[0]
      return {
        source: 'tariff_rates_table',
        mfn_rate: parseFloat(rate.mfn_rate || 0),
        usmca_rate: parseFloat(rate.usmca_rate || 0),
        effective_date: rate.effective_date,
        data_freshness: 'current'
      }
    }

    // Fallback to hs_master_rebuild rates
    const hsRates = await supabase
      .from('hs_master_rebuild')
      .select('*')
      .eq('hs_code', hsCode)
      .eq('country_source', destinationCountry || 'US')

    if (hsRates.data && hsRates.data.length > 0) {
      const rate = hsRates.data[0]
      return {
        source: 'hs_master_rebuild',
        mfn_rate: parseFloat(rate.mfn_rate || 0),
        usmca_rate: parseFloat(rate.usmca_rate || 0),
        effective_date: rate.effective_date,
        data_freshness: 'current_2025'
      }
    }

    return {
      source: 'default',
      mfn_rate: 0,
      usmca_rate: 0,
      data_freshness: 'unknown'
    }

  } catch (error) {
    console.error('Tariff rate lookup failed:', error)
    return {
      source: 'error',
      mfn_rate: 0,
      usmca_rate: 0,
      data_freshness: 'unknown'
    }
  }
}

// Check USMCA benefits using qualification rules
async function checkUSMCABenefits(hsCode, chapter, originCountry, destinationCountry) {
  try {
    // Check specific USMCA tariff rates table
    const usmcaTariffs = await supabase
      .from('usmca_tariff_rates')
      .select('*')
      .eq('hs_code', hsCode)
      .eq('origin_country', originCountry)
      .eq('destination_country', destinationCountry)

    if (usmcaTariffs.data && usmcaTariffs.data.length > 0) {
      const rate = usmcaTariffs.data[0]
      return {
        eligible: true,
        triangle_eligible: rate.triangle_eligible,
        savings_percentage: parseFloat(rate.savings_percentage || 0),
        triangle_savings_potential: parseFloat(rate.triangle_savings_potential || 0),
        rule_of_origin: rate.rule_of_origin,
        minimum_regional_content: parseFloat(rate.minimum_regional_content || 0),
        certificate_required: rate.certificate_required,
        source: 'usmca_tariff_rates'
      }
    }

    // Check qualification rules by chapter
    const qualificationRules = await supabase
      .from('usmca_qualification_rules')
      .select('*')
      .eq('hs_chapter', chapter.toString())

    if (qualificationRules.data && qualificationRules.data.length > 0) {
      const rule = qualificationRules.data[0]
      return {
        eligible: true,
        triangle_eligible: false,
        rule_type: rule.rule_type,
        regional_content_threshold: parseFloat(rule.regional_content_threshold || 0),
        required_documentation: rule.required_documentation,
        source: 'usmca_qualification_rules'
      }
    }

    return {
      eligible: false,
      reason: 'No USMCA benefits found for this product/route',
      source: 'none'
    }

  } catch (error) {
    console.error('USMCA qualification check failed:', error)
    return {
      eligible: false,
      reason: 'USMCA check failed',
      source: 'error'
    }
  }
}

// Calculate tariff savings
function calculateTariffSavings(tariffData, usmcaData, tradeVolume) {
  const mfnRate = tariffData.mfn_rate / 100
  const usmcaRate = tariffData.usmca_rate / 100

  const currentDuty = tradeVolume * mfnRate
  const usmcaDuty = tradeVolume * usmcaRate
  const annualSavings = currentDuty - usmcaDuty

  const savingsPercentage = mfnRate > 0 ? ((mfnRate - usmcaRate) / mfnRate) * 100 : 0

  return {
    current_duty: Math.round(currentDuty),
    usmca_duty: Math.round(usmcaDuty),
    annual_savings: Math.round(annualSavings),
    savings_percentage: Math.round(savingsPercentage * 100) / 100
  }
}

// Get trade intelligence from comtrade_reference
async function getTradeIntelligence(hsCode) {
  try {
    const intel = await supabase
      .from('comtrade_reference')
      .select('*')
      .ilike('commodity_code', `%${hsCode.slice(0, 6)}%`)
      .limit(3)

    return intel.data || []
  } catch (error) {
    console.error('Trade intelligence lookup failed:', error)
    return []
  }
}

// Generate actionable recommendations
function generateRecommendations(tariffData, usmcaData, savingsCalculation) {
  const recommendations = []

  if (savingsCalculation.annual_savings > 1000) {
    recommendations.push({
      type: 'savings_opportunity',
      priority: 'high',
      message: `Potential annual savings of $${savingsCalculation.annual_savings.toLocaleString()} through USMCA qualification`
    })
  }

  if (usmcaData.eligible && usmcaData.certificate_required) {
    recommendations.push({
      type: 'certification_required',
      priority: 'medium',
      message: 'USMCA certificate required for preferential treatment'
    })
  }

  if (usmcaData.triangle_eligible) {
    recommendations.push({
      type: 'triangle_routing',
      priority: 'high',
      message: 'Triangle routing eligible - consider Mexico routing for additional savings'
    })
  }

  if (tariffData.data_freshness !== 'current_2025') {
    recommendations.push({
      type: 'data_verification',
      priority: 'medium',
      message: 'Tariff rates may need verification with current CBP schedules'
    })
  }

  return recommendations
}