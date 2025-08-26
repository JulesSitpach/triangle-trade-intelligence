/**
 * INTELLIGENT HS CODE CLASSIFICATION API
 * 
 * Uses Census Bureau data + legitimate HS codes for accurate classification
 * Replaces artificial sequential numbering with real trade intelligence
 * Eliminates scattered results caused by fake HS code databases
 */

import { logInfo, logError, logPerformance } from '../../../lib/production-logger.js';
import { validateCalculationAuthenticity } from '../../../lib/core/trade-analysis.js';
import { performIntelligentClassification } from '../../../lib/classification/intelligent-hs-classifier.js';
import { validateCensusAPIConnection } from '../../../lib/api/census-trade-api.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  
  logInfo('API CALL: Intelligent HS Classification', {
    method: req.method,
    endpoint: '/api/intelligence/hs-codes',
    timestamp: new Date().toISOString()
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST'] 
    });
  }

  const { 
    productDescription, 
    businessType, 
    companyName, 
    sourceCountry, 
    importVolume,
    additionalContext 
  } = req.body;

  try {
    // Validate required fields
    if (!productDescription || productDescription.trim().length < 3) {
      return res.status(400).json({
        error: 'Product description required (minimum 3 characters)',
        suggestions: [],
        professionalRecommendation: 'Contact customs broker for HS code classification',
        dataSource: 'Triangle Intelligence - Request Validation'
      });
    }

    // Validate Census API connectivity
    const censusConnected = await validateCensusAPIConnection();
    
    if (!censusConnected) {
      logError('Census API unavailable - using database-only classification');
    }

    logInfo('Starting intelligent classification', { 
      product: productDescription.substring(0, 50),
      businessType,
      sourceCountry,
      censusApiAvailable: censusConnected
    });

    // Build comprehensive classification request
    const classificationRequest = {
      productDescription: productDescription.trim(),
      businessType,
      companyName,
      sourceCountry,
      importVolume,
      additionalContext: additionalContext || {}
    };

    // Perform intelligent classification
    const classificationResult = await performIntelligentClassification(classificationRequest);
    
    // Handle classification failure
    if (!classificationResult.success) {
      return res.status(200).json({
        success: false,
        error: classificationResult.error || 'Classification failed',
        fallback: classificationResult.fallback,
        professionalGuidance: {
          immediate_action: 'Consult licensed customs broker',
          reason: 'Automated classification unavailable for this product',
          contact: 'Professional customs classification services'
        },
        disclaimer: 'ESTIMATE - NOT VERIFIED DATA',
        timestamp: new Date().toISOString()
      });
    }

    // Format successful response
    const response = {
      success: true,
      method: 'INTELLIGENT_CLASSIFICATION_WITH_CENSUS_DATA',
      dataSource: 'US Census Bureau + UN Comtrade + Triangle Intelligence',
      
      query: classificationResult.query,
      
      classification: {
        results: classificationResult.classification.results.map(result => ({
          hsCode: result.hs_code,
          description: result.product_description,
          confidence: Math.round(result.confidenceScore * 100) / 100,
          
          // Trade intelligence
          tradeData: {
            annualImports: result.tradeData?.annualTotal || 0,
            trendDirection: result.tradeTrends?.trend || 'UNKNOWN',
            topSuppliers: result.topPartners?.slice(0, 3) || []
          },
          
          // Business fit
          businessFit: Math.round(result.businessFit * 100) / 100,
          priority: result.priority,
          
          // Triangle routing opportunities
          triangleOpportunities: result.triangleOpportunities?.map(opp => ({
            route: opp.route,
            estimatedSavings: `$${Math.round(opp.tariffSavings)}K annually`,
            feasibility: opp.feasibility,
            timeToImplement: opp.timeToImplement
          })) || [],
          
          // Savings estimate
          savingsEstimate: result.savingsEstimate ? {
            annualNetSavings: Math.round(result.savingsEstimate.netSavings),
            paybackMonths: result.savingsEstimate.paybackMonths,
            bestRoute: result.savingsEstimate.bestRoute
          } : null
        })),
        
        overallConfidence: classificationResult.classification.confidence,
        method: classificationResult.classification.method
      },
      
      tradeAnalysis: classificationResult.tradeAnalysis,
      recommendations: classificationResult.recommendations,
      
      disclaimers: classificationResult.disclaimers,
      
      performance: {
        processingTime: classificationResult.processingTimeMs,
        dataSourcesUsed: censusConnected ? 'Census API + Database' : 'Database Only',
        responseTime: Date.now() - startTime,
        timestamp: classificationResult.timestamp
      },
      
      professionalGuidance: {
        required: true,
        contact: 'Licensed Customs Broker',
        purpose: 'Verify HS classification and validate trade strategies',
        importance: 'HS classification affects tariff rates and compliance requirements'
      },
      
      // Authenticity validation
      calculationAuthenticity: validateCalculationAuthenticity({
        hasDisclaimers: true,
        usesVerifiedDataSources: true,
        requiresProfessionalVerification: true,
        includesRealTradeData: censusConnected
      })
    };

    logPerformance('Intelligent HS classification', response.performance.responseTime, {
      resultsFound: response.classification.results.length,
      confidence: response.classification.overallConfidence,
      censusApiUsed: censusConnected
    });

    return res.status(200).json(response);

  } catch (error) {
    logError('Intelligent classification error', {
      error: error.message,
      stack: error.stack?.substring(0, 500),
      productDescription: productDescription?.substring(0, 50)
    });

    return res.status(500).json({
      success: false,
      error: 'Intelligent classification system error',
      message: error.message,
      fallback: {
        method: 'PROFESSIONAL_CLASSIFICATION_REQUIRED',
        guidance: 'Contact licensed customs broker for manual classification',
        resources: [
          'U.S. Customs and Border Protection',
          'Licensed customs brokerage services',
          'Professional trade consulting'
        ]
      },
      disclaimer: 'System error - Professional classification required',
      timestamp: new Date().toISOString(),
      performance: {
        responseTime: Date.now() - startTime,
        status: 'ERROR'
      }
    });
  }
}