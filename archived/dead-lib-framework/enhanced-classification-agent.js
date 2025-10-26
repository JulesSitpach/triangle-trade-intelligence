import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export class EnhancedClassificationAgent {
  constructor() {
    this.name = 'enhanced-classification'
    this.version = '2.0.0'
  }

  async processRequest(request) {
    const { product_description, origin_country = 'MX', destination_country = 'US' } = request

    console.log(`[CLASSIFICATION] Processing: "${product_description}"`)

    try {
      // Step 1: Simple database lookup first
      const dbResult = await this.searchDatabase(product_description)

      if (dbResult.found) {
        console.log(`[CLASSIFICATION] Found in database: ${dbResult.hs_code}`)
        return this.formatResponse(dbResult, 'database')
      }

      // Step 2: Return "not found" for manual classification
      console.log(`[CLASSIFICATION] Not found in database`)
      return this.formatNotFoundResponse(product_description)

    } catch (error) {
      console.error('[CLASSIFICATION ERROR]', error)
      return this.formatErrorResponse(error)
    }
  }

  async searchDatabase(productDescription) {
    const keywords = this.extractKeywords(productDescription)
    console.log(`[DB SEARCH] Keywords: ${keywords.join(', ')}`)

    try {
      // Search hs_master_rebuild table
      const { data, error } = await supabase
        .from('hs_master_rebuild')
        .select('*')
        .or(keywords.map(kw => `description.ilike.%${kw}%`).join(','))
        .not('mfn_rate', 'is', null)
        .limit(5)

      if (error) {
        console.error('[DB ERROR]', error)
        return { found: false }
      }

      if (data && data.length > 0) {
        const bestMatch = this.selectBestMatch(data, keywords, productDescription)
        return {
          found: true,
          hs_code: bestMatch.hs_code,
          description: bestMatch.description,
          mfn_rate: parseFloat(bestMatch.mfn_rate || 0),
          usmca_rate: parseFloat(bestMatch.usmca_rate || 0),
          confidence: 85,
          source: 'database'
        }
      }

      return { found: false }

    } catch (error) {
      console.error('[DB SEARCH ERROR]', error)
      return { found: false }
    }
  }

  extractKeywords(description) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']

    const words = description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word))

    return [...new Set(words)].slice(0, 3) // Top 3 unique keywords
  }

  selectBestMatch(results, keywords, productDescription) {
    // Simple scoring: prefer items with tariff rates and keyword matches
    const scored = results.map(item => {
      let score = 0

      // Has tariff rates
      if (item.mfn_rate && parseFloat(item.mfn_rate) > 0) score += 20
      if (item.usmca_rate !== null) score += 10

      // Keyword matches
      const itemDesc = (item.description || '').toLowerCase()
      const matchedKeywords = keywords.filter(kw => itemDesc.includes(kw)).length
      score += matchedKeywords * 15

      return { ...item, score }
    })

    return scored.sort((a, b) => b.score - a.score)[0]
  }

  formatResponse(result, source) {
    const savings = this.calculateUSMCASavings(result.mfn_rate, result.usmca_rate, 100000)

    return {
      status: 'success',
      classification: {
        hs_code: result.hs_code,
        description: result.description,
        confidence: `${result.confidence}%`
      },
      tariff_analysis: {
        mfn_rate: `${result.mfn_rate}%`,
        usmca_rate: `${result.usmca_rate}%`,
        annual_savings: `$${savings.toLocaleString()}`,
        qualifies_for_usmca: result.usmca_rate < result.mfn_rate
      },
      data_source: source,
      agent_version: this.version
    }
  }

  formatNotFoundResponse(productDescription) {
    return {
      status: 'not_found',
      message: 'Product classification not found in database',
      product_description: productDescription,
      recommended_action: 'Expert classification needed',
      next_steps: [
        'Contact our classification experts',
        'Provide additional product details',
        'Request professional classification service'
      ],
      agent_version: this.version
    }
  }

  formatErrorResponse(error) {
    return {
      status: 'error',
      message: 'Classification service temporarily unavailable',
      error_details: error.message,
      recommended_action: 'Retry request or contact support',
      agent_version: this.version
    }
  }

  calculateUSMCASavings(mfnRate, usmcaRate, tradeVolume) {
    const mfnDuty = tradeVolume * (mfnRate / 100)
    const usmcaDuty = tradeVolume * (usmcaRate / 100)
    return Math.max(0, Math.round(mfnDuty - usmcaDuty))
  }
}

export default EnhancedClassificationAgent