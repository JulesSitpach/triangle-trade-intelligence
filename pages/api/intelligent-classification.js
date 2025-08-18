/**
 * Intelligent Product Classification with Transparent Fallbacks
 * Returns: Industry classification + fallback intelligence + user improvement options
 */

import { classifyProductWithFallback, storeUserCorrection, getFallbackTradeData } from '../../lib/transparent-hs-classifier.js'
import DatabaseIntelligenceBridge from '../../lib/intelligence/database-intelligence-bridge.js'
import { logInfo, logError } from '../../lib/utils/production-logger.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      productDescription, 
      businessType = null,
      userHSCode = null,
      userCorrection = false 
    } = req.body

    logInfo('Intelligent classification request', {
      product: productDescription?.substring(0, 50),
      businessType,
      hasUserHS: !!userHSCode,
      isCorrection: userCorrection
    })

    // Handle user corrections
    if (userCorrection && userHSCode) {
      const correctionResult = await storeUserCorrection(
        productDescription,
        req.body.originalClassification,
        userHSCode,
        req.body.userIndustry
      )
      
      return res.json({
        success: true,
        message: correctionResult.message,
        userImprovement: true
      })
    }

    // Classify the product
    const classification = classifyProductWithFallback(productDescription, businessType)
    
    // Get fallback trade intelligence
    const fallbackData = getFallbackTradeData(classification.industry)
    
    // Try to get specific trade data if we have high confidence
    let specificTradeData = null
    if (classification.confidence === 'high' || userHSCode) {
      try {
        const hsCode = userHSCode || classification.hsCode
        specificTradeData = await DatabaseIntelligenceBridge.getTradeFlowsByHS(hsCode)
      } catch (error) {
        logError('Failed to fetch specific trade data', { error: error.message })
      }
    }

    // Build response
    const response = {
      // Classification results
      classification: {
        industry: classification.industry,
        confidence: classification.confidence,
        hsCode: classification.hsCode,
        hsCodeRange: classification.hsCodeRange,
        description: classification.description,
        message: classification.message,
        fallbackReason: classification.fallbackReason,
        matchedKeywords: classification.matchedKeywords
      },
      
      // Trade intelligence
      tradeIntelligence: specificTradeData || fallbackData,
      
      // User improvement options
      userOptions: {
        canImprove: classification.userCanImprove,
        hsCodeInput: !userHSCode,
        improvementMessage: classification.confidence === 'low' 
          ? "Know your exact HS code? Help us show you more precise data"
          : "Want to see data for a specific HS code?",
        placeholder: "Enter 4-6 digit HS code (e.g., 8517, 847130)"
      },
      
      // Transparency messaging
      transparency: {
        dataSource: specificTradeData ? 'specific' : 'fallback',
        accuracyNote: classification.confidence === 'high' 
          ? `High confidence match based on: ${classification.matchedKeywords.slice(0, 3).join(', ')}`
          : `Fallback classification - we found ${classification.score} keyword matches`,
        improvementNote: "This platform learns from user corrections to improve accuracy",
        tradeDataNote: specificTradeData 
          ? `Showing data for HS ${classification.hsCode} from our trade database`
          : `Showing ${classification.industry} industry overview with $${(fallbackData?.tradeValue / 1000000)?.toFixed(1)}M+ trade value`
      }
    }

    logInfo('Classification completed', {
      industry: classification.industry,
      confidence: classification.confidence,
      dataSource: response.transparency.dataSource,
      userCanImprove: classification.userCanImprove
    })

    res.json(response)

  } catch (error) {
    logError('Intelligent classification error', {
      error: error.message,
      stack: error.stack
    })

    res.status(500).json({
      error: 'Classification failed',
      message: 'Unable to classify product',
      fallback: {
        industry: 'Electronics',
        message: 'Showing electronics industry data as fallback',
        userCanImprove: true
      }
    })
  }
}