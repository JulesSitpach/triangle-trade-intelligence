/**
 * HS Code WCO Standards
 * Official World Customs Organization Harmonized System nomenclature
 * Used for correcting invalid classifications in the Database Intelligence Bridge
 */

import { logInfo, logError } from '../production-logger.js'

// Official WCO HS Code classifications for major codes
export const WCO_HS_CLASSIFICATIONS = {
  // Chapter 01: Live animals
  '010001': {
    description: 'Live horses, pure-bred breeding animals',
    chapter: '01',
    section: 'I',
    fullDescription: 'Live horses, asses, mules and hinnies - Horses - Pure-bred breeding animals',
    dutyRate: 'Free',
    category: 'Live Animals'
  },
  '010290': {
    description: 'Live bovine animals, other',
    chapter: '01', 
    section: 'I',
    fullDescription: 'Live bovine animals - Other',
    dutyRate: 'Free',
    category: 'Live Animals'
  },
  '010310': {
    description: 'Live swine, pure-bred breeding animals',
    chapter: '01',
    section: 'I', 
    fullDescription: 'Live swine - Pure-bred breeding animals',
    dutyRate: 'Free',
    category: 'Live Animals'
  },

  // Chapter 02: Meat and edible meat offal
  '020110': {
    description: 'Carcasses and half-carcasses of bovine animals, fresh or chilled',
    chapter: '02',
    section: 'I',
    fullDescription: 'Meat of bovine animals, fresh or chilled - Carcasses and half-carcasses',
    dutyRate: '4.4 cents/kg',
    category: 'Meat and Meat Products'
  },
  '020120': {
    description: 'Other cuts with bone in, of bovine animals, fresh or chilled',
    chapter: '02',
    section: 'I',
    fullDescription: 'Meat of bovine animals, fresh or chilled - Other cuts with bone in',
    dutyRate: '4.4 cents/kg',
    category: 'Meat and Meat Products'
  },

  // Chapter 84: Nuclear reactors, boilers, machinery and mechanical appliances
  '840991': {
    description: 'Parts suitable for use solely or principally with spark-ignition internal combustion piston engines',
    chapter: '84',
    section: 'XVI',
    fullDescription: 'Machinery and mechanical appliances; parts thereof - Parts of engines',
    dutyRate: '2.5%',
    category: 'Machinery'
  },
  '841989': {
    description: 'Machinery, plant and equipment for making hot drinks, other',
    chapter: '84',
    section: 'XVI',
    fullDescription: 'Machinery for making hot drinks or for cooking or heating food - Other',
    dutyRate: 'Free',
    category: 'Machinery'
  },

  // Chapter 85: Electrical machinery and equipment
  '851762': {
    description: 'Machines for the reception, conversion and transmission or regeneration of voice, images or other data, including switching and routing apparatus',
    chapter: '85',
    section: 'XVI',
    fullDescription: 'Electrical machinery and equipment - Telephone sets, including telephones for cellular networks or for other wireless networks - Other',
    dutyRate: 'Free',
    category: 'Electronics'
  },
  '854449': {
    description: 'Other electric conductors, for a voltage not exceeding 1,000 V, fitted with connectors',
    chapter: '85',
    section: 'XVI',
    fullDescription: 'Insulated wire, cable and other electric conductors - Other',
    dutyRate: '5.3%',
    category: 'Electronics'
  }
}

// HS Code format validation constants
export const HS_CODE_VALIDATION = {
  MIN_LENGTH: 6,
  MAX_LENGTH: 10,
  VALID_FORMAT_REGEX: /^[0-9]{6,10}$/,
  CHAPTER_REGEX: /^([0-9]{2})/,
  HEADING_REGEX: /^([0-9]{4})/,
  SUBHEADING_REGEX: /^([0-9]{6})/
}

// WCO chapter classifications
export const WCO_CHAPTERS = {
  '01': { title: 'Live animals', section: 'I', range: '01' },
  '02': { title: 'Meat and edible meat offal', section: 'I', range: '02' },
  '03': { title: 'Fish and crustaceans, molluscs and other aquatic invertebrates', section: 'I', range: '03' },
  '04': { title: 'Dairy produce; birds\' eggs; natural honey; edible products of animal origin, not elsewhere specified or included', section: 'I', range: '04' },
  '05': { title: 'Products of animal origin, not elsewhere specified or included', section: 'I', range: '05' },
  
  '06': { title: 'Live trees and other plants; bulbs, roots and the like; cut flowers and ornamental foliage', section: 'II', range: '06' },
  '07': { title: 'Edible vegetables and certain roots and tubers', section: 'II', range: '07' },
  '08': { title: 'Edible fruit and nuts; peel of citrus fruit or melons', section: 'II', range: '08' },
  '09': { title: 'Coffee, tea, maté and spices', section: 'II', range: '09' },
  '10': { title: 'Cereals', section: 'II', range: '10' },
  '11': { title: 'Products of the milling industry; malt; starches; inulin; wheat gluten', section: 'II', range: '11' },
  '12': { title: 'Oil seeds and oleaginous fruits; miscellaneous grains, seeds and fruit; industrial or medicinal plants; straw and fodder', section: 'II', range: '12' },
  '13': { title: 'Lac; gums, resins and other vegetable saps and extracts', section: 'II', range: '13' },
  '14': { title: 'Vegetable plaiting materials; vegetable products not elsewhere specified or included', section: 'II', range: '14' },

  '84': { title: 'Nuclear reactors, boilers, machinery and mechanical appliances; parts thereof', section: 'XVI', range: '84' },
  '85': { title: 'Electrical machinery and equipment and parts thereof; sound recorders and reproducers, television image and sound recorders and reproducers, and parts and accessories of such articles', section: 'XVI', range: '85' }
}

/**
 * HS Code Validation and Formatting
 */
export class HSCodeValidator {
  
  /**
   * Validate HS code format according to WCO standards
   */
  static validateFormat(hsCode) {
    if (!hsCode) {
      return {
        isValid: false,
        error: 'HS code is required',
        correctedCode: null
      }
    }

    // Clean the code - remove non-digits
    const cleanedCode = hsCode.toString().replace(/\D/g, '')
    
    // Check length
    if (cleanedCode.length < HS_CODE_VALIDATION.MIN_LENGTH) {
      return {
        isValid: false,
        error: `HS code must be at least ${HS_CODE_VALIDATION.MIN_LENGTH} digits`,
        correctedCode: null
      }
    }

    if (cleanedCode.length > HS_CODE_VALIDATION.MAX_LENGTH) {
      return {
        isValid: false,
        error: `HS code cannot exceed ${HS_CODE_VALIDATION.MAX_LENGTH} digits`,
        correctedCode: cleanedCode.substring(0, HS_CODE_VALIDATION.MAX_LENGTH)
      }
    }

    // Check format
    if (!HS_CODE_VALIDATION.VALID_FORMAT_REGEX.test(cleanedCode)) {
      return {
        isValid: false,
        error: 'HS code must contain only digits',
        correctedCode: cleanedCode
      }
    }

    return {
      isValid: true,
      error: null,
      correctedCode: cleanedCode,
      formattedCode: this.formatHSCode(cleanedCode)
    }
  }

  /**
   * Format HS code according to standard display format
   */
  static formatHSCode(hsCode) {
    const cleaned = hsCode.toString().replace(/\D/g, '')
    
    if (cleaned.length >= 6) {
      // Standard format: XXXX.XX or XXXX.XX.XX
      if (cleaned.length === 6) {
        return `${cleaned.substring(0, 4)}.${cleaned.substring(4, 6)}`
      } else if (cleaned.length === 8) {
        return `${cleaned.substring(0, 4)}.${cleaned.substring(4, 6)}.${cleaned.substring(6, 8)}`
      } else if (cleaned.length === 10) {
        return `${cleaned.substring(0, 4)}.${cleaned.substring(4, 6)}.${cleaned.substring(6, 8)}.${cleaned.substring(8, 10)}`
      }
    }
    
    return cleaned
  }

  /**
   * Get official WCO classification for HS code
   */
  static getWCOClassification(hsCode) {
    const cleaned = hsCode.toString().replace(/\D/g, '')
    
    // Check exact match first
    if (WCO_HS_CLASSIFICATIONS[cleaned]) {
      return {
        found: true,
        classification: WCO_HS_CLASSIFICATIONS[cleaned],
        matchType: 'exact',
        confidence: 100
      }
    }

    // Check by chapter
    const chapter = cleaned.substring(0, 2)
    if (WCO_CHAPTERS[chapter]) {
      return {
        found: true,
        classification: {
          description: `${WCO_CHAPTERS[chapter].title} (Chapter ${chapter})`,
          chapter: chapter,
          section: WCO_CHAPTERS[chapter].section,
          fullDescription: WCO_CHAPTERS[chapter].title,
          category: this.getCategoryFromChapter(chapter)
        },
        matchType: 'chapter',
        confidence: 75
      }
    }

    return {
      found: false,
      classification: null,
      matchType: 'none',
      confidence: 0
    }
  }

  /**
   * Calculate confidence based on database matches and WCO compliance
   */
  static calculateConfidence(hsCode, productDescription, databaseMatch = null) {
    let confidence = 50 // Base confidence

    // WCO classification match
    const wcoClassification = this.getWCOClassification(hsCode)
    if (wcoClassification.found) {
      confidence += wcoClassification.confidence * 0.4 // 40% weight for WCO match
    }

    // Format validation
    const validation = this.validateFormat(hsCode)
    if (validation.isValid) {
      confidence += 20 // 20% for valid format
    }

    // Database match quality
    if (databaseMatch) {
      if (databaseMatch.exact_match) {
        confidence += 30 // 30% for exact database match
      } else if (databaseMatch.partial_match) {
        confidence += 15 // 15% for partial match
      }
    }

    // Product description alignment
    if (productDescription && wcoClassification.found) {
      const descriptionWords = productDescription.toLowerCase().split(/\W+/)
      const classificationWords = wcoClassification.classification.description.toLowerCase().split(/\W+/)
      
      const commonWords = descriptionWords.filter(word => 
        word.length > 3 && classificationWords.some(cWord => cWord.includes(word))
      )
      
      if (commonWords.length > 0) {
        confidence += Math.min(15, commonWords.length * 5) // Up to 15% for description alignment
      }
    }

    return Math.min(100, Math.max(0, Math.round(confidence)))
  }

  /**
   * Get category from chapter number
   */
  static getCategoryFromChapter(chapter) {
    const chapterNum = parseInt(chapter)
    
    if (chapterNum >= 1 && chapterNum <= 5) return 'Live Animals & Animal Products'
    if (chapterNum >= 6 && chapterNum <= 14) return 'Vegetable Products'
    if (chapterNum >= 15 && chapterNum <= 15) return 'Animal or Vegetable Fats and Oils'
    if (chapterNum >= 16 && chapterNum <= 24) return 'Prepared Foodstuffs'
    if (chapterNum >= 25 && chapterNum <= 27) return 'Mineral Products'
    if (chapterNum >= 28 && chapterNum <= 38) return 'Chemical Products'
    if (chapterNum >= 39 && chapterNum <= 40) return 'Plastics and Rubber'
    if (chapterNum >= 41 && chapterNum <= 43) return 'Raw Hides and Skins, Leather'
    if (chapterNum >= 44 && chapterNum <= 46) return 'Wood and Wood Products'
    if (chapterNum >= 47 && chapterNum <= 49) return 'Pulp, Paper and Paperboard'
    if (chapterNum >= 50 && chapterNum <= 63) return 'Textiles and Textile Articles'
    if (chapterNum >= 64 && chapterNum <= 67) return 'Footwear, Headgear, Umbrellas'
    if (chapterNum >= 68 && chapterNum <= 70) return 'Stone, Plaster, Ceramic, Glass'
    if (chapterNum >= 71 && chapterNum <= 71) return 'Pearls, Precious Stones, Metals'
    if (chapterNum >= 72 && chapterNum <= 83) return 'Base Metals and Articles'
    if (chapterNum >= 84 && chapterNum <= 85) return 'Machinery and Electrical Equipment'
    if (chapterNum >= 86 && chapterNum <= 89) return 'Transportation Equipment'
    if (chapterNum >= 90 && chapterNum <= 92) return 'Optical, Medical, Musical Instruments'
    if (chapterNum >= 93 && chapterNum <= 93) return 'Arms and Ammunition'
    if (chapterNum >= 94 && chapterNum <= 96) return 'Miscellaneous Manufactured Articles'
    if (chapterNum >= 97 && chapterNum <= 99) return 'Special Classification Provisions'
    
    return 'Unclassified'
  }
}

/**
 * Enhanced HS Code Intelligence with WCO Standards
 */
export class EnhancedHSCodeIntelligence {
  
  /**
   * Get enhanced classification with WCO compliance
   */
  static async getEnhancedClassification(hsCode, productDescription, businessType) {
    try {
      logInfo('Getting enhanced HS code classification with WCO standards', { 
        hsCode, 
        productDescription: productDescription?.substring(0, 50) 
      })

      // Step 1: Validate format
      const validation = HSCodeValidator.validateFormat(hsCode)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          suggestion: validation.correctedCode
        }
      }

      // Step 2: Get WCO classification
      const wcoClassification = HSCodeValidator.getWCOClassification(validation.correctedCode)
      
      // Step 3: Calculate enhanced confidence
      const confidence = HSCodeValidator.calculateConfidence(
        validation.correctedCode, 
        productDescription,
        null // Database match to be added later
      )

      // Step 4: Build enhanced result
      const result = {
        success: true,
        hsCode: validation.correctedCode,
        formattedCode: validation.formattedCode,
        classification: wcoClassification.classification,
        confidence: confidence,
        wcoCompliant: wcoClassification.found,
        matchType: wcoClassification.matchType,
        validationDetails: {
          formatValid: validation.isValid,
          wcoStandard: wcoClassification.found,
          confidenceFactors: this.getConfidenceFactors(confidence, wcoClassification, validation)
        },
        source: 'WCO_ENHANCED_CLASSIFICATION'
      }

      logInfo('Enhanced HS code classification completed', {
        hsCode: validation.correctedCode,
        confidence: confidence,
        wcoCompliant: wcoClassification.found
      })

      return result

    } catch (error) {
      logError('Enhanced HS code classification failed', { hsCode, error })
      return {
        success: false,
        error: 'Classification system error',
        fallback: true
      }
    }
  }

  /**
   * Get confidence calculation factors for transparency
   */
  static getConfidenceFactors(confidence, wcoClassification, validation) {
    const factors = []
    
    if (validation.isValid) {
      factors.push({ factor: 'Valid HS code format', points: 20, description: 'Code follows WCO format standards' })
    }
    
    if (wcoClassification.found) {
      const points = wcoClassification.confidence * 0.4
      factors.push({ 
        factor: `WCO ${wcoClassification.matchType} match`, 
        points: Math.round(points), 
        description: 'Official World Customs Organization classification' 
      })
    }
    
    factors.push({ 
      factor: 'Base confidence', 
      points: 50, 
      description: 'Minimum confidence for all classifications' 
    })

    return factors
  }
}

export default HSCodeValidator