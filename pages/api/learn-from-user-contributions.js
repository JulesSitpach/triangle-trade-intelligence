/**
 * Learn from User Contributions API
 * Uses user-contributed HS codes to improve AI suggestions
 * Simple approach for incorporating user intelligence
 */

import { getSupabaseServiceClient } from '../../lib/database/supabase-client.js';
import { logInfo, logError, logPerformance } from '../../lib/utils/production-logger.js';

const supabase = getSupabaseServiceClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed - use POST' 
    });
  }

  const startTime = Date.now();
  const { productDescription, businessType } = req.body;

  if (!productDescription || productDescription.length < 5) {
    return res.status(400).json({
      success: false,
      error: 'Product description must be at least 5 characters long'
    });
  }

  try {
    logInfo('Learning from user contributions request', {
      descriptionLength: productDescription.length,
      businessType: businessType || 'general'
    });

    // STEP 1: Find similar user-contributed products
    const { data: userContributions, error: userError } = await supabase
      .from('user_contributed_hs_codes')
      .select('hs_code, product_description, business_type, user_confidence')
      .eq('validated', false) // Include unvalidated for broader learning
      .order('created_at', { ascending: false })
      .limit(100); // Get recent contributions

    if (userError) {
      throw new Error(`User contributions query error: ${userError.message}`);
    }

    // STEP 2: Find matches using simple text similarity
    const productWords = productDescription.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const similarContributions = [];

    userContributions.forEach(contribution => {
      const contribWords = contribution.product_description.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      
      // Calculate word overlap similarity
      const overlap = productWords.filter(word => 
        contribWords.some(cWord => cWord.includes(word) || word.includes(cWord))
      ).length;
      
      const similarity = overlap / Math.max(productWords.length, contribWords.length);
      
      // Also check business type match
      const businessMatch = !businessType || !contribution.business_type || 
        contribution.business_type.toLowerCase().includes(businessType.toLowerCase().split(' ')[0].toLowerCase());
      
      if (similarity > 0.2 || (businessMatch && similarity > 0.1)) {
        similarContributions.push({
          hs_code: contribution.hs_code,
          product_description: contribution.product_description,
          similarity: similarity,
          user_confidence: contribution.user_confidence,
          business_type: contribution.business_type,
          source: 'user_contributed'
        });
      }
    });

    // STEP 3: Get official HS code details for the matches
    const hsCodesFound = [...new Set(similarContributions.map(c => c.hs_code))];
    let officialDetails = [];

    if (hsCodesFound.length > 0) {
      const { data: officialData, error: officialError } = await supabase
        .from('comtrade_reference')
        .select('hs_code, product_description')
        .in('hs_code', hsCodesFound);

      if (!officialError) {
        officialDetails = officialData || [];
      }
    }

    // STEP 4: Create enhanced suggestions combining user intelligence with official data
    const learnedSuggestions = similarContributions
      .sort((a, b) => (b.similarity + (b.user_confidence / 10)) - (a.similarity + (a.user_confidence / 10)))
      .slice(0, 5)
      .map(contrib => {
        const official = officialDetails.find(off => off.hs_code === contrib.hs_code);
        
        return {
          category: `${contrib.hs_code} - ${official ? official.product_description.substring(0, 60) + '...' : contrib.product_description.substring(0, 60) + '...'}`,
          hsCode: contrib.hs_code,
          confidence: Math.min(Math.round((contrib.similarity * 50) + (contrib.user_confidence * 8) + 35), 95),
          reason: `Similar to user input: "${contrib.product_description.substring(0, 40)}..."`,
          chapter: contrib.hs_code.substring(0, 2),
          source: 'user_contributed',
          user_confidence: contrib.user_confidence,
          similarity: Math.round(contrib.similarity * 100),
          business_type: contrib.business_type
        };
      });

    const processingTime = Date.now() - startTime;

    logPerformance('Learning from user contributions complete', processingTime, {
      userContributionsFound: userContributions.length,
      similarityMatches: similarContributions.length,
      suggestionsGenerated: learnedSuggestions.length,
      businessType: businessType
    });

    return res.status(200).json({
      success: true,
      suggestions: learnedSuggestions,
      user_contributions_analyzed: userContributions.length,
      similar_products_found: similarContributions.length,
      processing_time_ms: processingTime,
      learning_method: 'user_contribution_similarity'
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logError('Learning from user contributions failed', error?.message || 'Unknown error', {
      processingTimeMs: processingTime
    });

    return res.status(500).json({
      success: false,
      error: 'Learning from user contributions failed',
      processing_time_ms: processingTime
    });
  }
}