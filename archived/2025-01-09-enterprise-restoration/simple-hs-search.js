/**
 * Simple HS Code Search API
 * Now powered by intelligent AI classification with fallback to basic search
 */

import { intelligentHSClassifier } from '../../lib/classification/intelligent-hs-classifier.js';
import { findHSCodes } from '../../lib/classification/simple-hs-matcher';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { searchTerm, description, businessType, limit } = req.body;
  const productDescription = description || searchTerm;

  if (!productDescription || productDescription.length < 3) {
    return res.status(400).json({ 
      error: 'Product description required (minimum 3 characters)',
      results: [] 
    });
  }

  try {
    logInfo('Simple HS search request', { description: productDescription, businessType });

    // First try intelligent classification
    const intelligentResult = await intelligentHSClassifier.classifyProduct(productDescription, {
      limit: limit || 10,
      context: { businessType }
    });

    if (intelligentResult.success && intelligentResult.results.length > 0) {
      // Success with intelligent classifier
      return res.status(200).json({
        success: true,
        query: productDescription,
        businessType: businessType || 'general',
        resultsCount: intelligentResult.results.length,
        results: intelligentResult.results.map(result => ({
          hsCode: result.hsCode,
          description: result.description,
          confidence: result.confidence,
          matchType: result.matchType,
          mfnRate: result.mfnRate,
          usmcaRate: result.usmcaRate,
          country: result.country,
          displayText: result.displayText,
          confidenceText: result.confidenceText
        })),
        approach: 'intelligent_ai_classification',
        message: `Found ${intelligentResult.results.length} intelligently matched HS codes`,
        executionTime: intelligentResult.executionTime
      });
    }

    // Fallback to basic search if intelligent classification fails or returns no results
    logInfo('Falling back to basic HS search', { reason: 'Intelligent classification failed or no results' });
    
    const basicResults = await findHSCodes(productDescription, businessType);

    // Format basic results to match expected format
    const formattedResults = basicResults.map(result => ({
      hsCode: result.hsCode,
      description: result.description,
      confidence: result.confidence,
      matchType: result.matchType,
      mfnRate: result.mfnRate,
      usmcaRate: result.usmcaRate,
      country: result.country,
      displayText: result.displayText,
      confidenceText: result.confidenceText
    }));

    res.status(200).json({
      success: true,
      query: productDescription,
      businessType: businessType || 'general',
      resultsCount: formattedResults.length,
      results: formattedResults,
      approach: 'basic_keyword_search',
      message: formattedResults.length > 0 
        ? `Found ${formattedResults.length} matching HS codes using basic search`
        : 'No matching HS codes found. Try different keywords or be more specific.',
      note: intelligentResult.success 
        ? 'Intelligent classification returned no relevant results, using basic search'
        : 'Intelligent classification unavailable, using basic search'
    });

  } catch (error) {
    logError('HS search error', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message,
      results: []
    });
  }
}