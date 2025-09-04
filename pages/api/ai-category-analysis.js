/**
 * AI Category Analysis API
 * Analyzes product descriptions and suggests appropriate categories
 * Database-driven with intelligent keyword matching and business type context
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

  if (!productDescription || productDescription.trim().length < 5) {
    return res.status(400).json({
      success: false,
      error: 'Product description must be at least 5 characters long'
    });
  }

  try {
    logInfo('AI category analysis request', {
      descriptionLength: productDescription.length,
      businessType: businessType || 'general'
    });

    // Get categories filtered by business type for better precision
    const { data: categories, error: categoriesError } = await getBusinessTypeFilteredCategories(businessType);

    if (categoriesError) {
      throw new Error(`Database error: ${categoriesError.message}`);
    }

    // STEP 1: Learn from user contributions first
    const userLearnings = await learnFromUserContributions(productDescription.trim(), businessType);

    // STEP 2: Analyze product description to find specific HS codes  
    const suggestions = await analyzeForSpecificHSCodes(
      productDescription.trim(),
      categories,
      businessType,
      req.body.selectedCategory, // User's category selection
      userLearnings // Pass user learnings to enhance suggestions
    );

    const processingTime = Date.now() - startTime;

    logPerformance('AI analysis complete', processingTime, {
      suggestionsFound: suggestions.length,
      topConfidence: suggestions[0]?.confidence || 0
    });

    return res.status(200).json({
      success: true,
      suggestions: suggestions.slice(0, 3), // Return top 3 suggestions
      processing_time_ms: processingTime,
      analysis_method: 'database_keyword_matching'
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logError('AI analysis failed', error?.message || 'Unknown error', {
      processingTimeMs: processingTime
    });

    return res.status(500).json({
      success: false,
      error: 'AI analysis failed',
      suggestions: [{
        category: 'classification_unavailable',
        confidence: 0,
        reason: 'AI classification service temporarily unavailable. Please try again or contact support.',
        isError: true
      }],
      processing_time_ms: processingTime
    });
  }
}

/**
 * Learn from user contributions to enhance suggestions
 */
async function learnFromUserContributions(productDescription, businessType) {
  try {
    // Query user contributions for similar products
    const { data: userContributions, error } = await supabase
      .from('user_contributed_hs_codes')
      .select('hs_code, product_description, business_type, user_confidence')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !userContributions) {
      return [];
    }

    // Find similar contributions using word overlap
    const productWords = productDescription.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const similar = [];

    userContributions.forEach(contrib => {
      const contribWords = contrib.product_description.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const overlap = productWords.filter(word => 
        contribWords.some(cWord => cWord.includes(word) || word.includes(cWord))
      ).length;
      
      const similarity = overlap / Math.max(productWords.length, contribWords.length);
      const businessMatch = !businessType || !contrib.business_type || 
        contrib.business_type.toLowerCase().includes(businessType.toLowerCase().split(' ')[0].toLowerCase());
      
      if (similarity > 0.15 && businessMatch) {
        similar.push({
          hs_code: contrib.hs_code,
          similarity: similarity,
          user_confidence: contrib.user_confidence,
          source_description: contrib.product_description
        });
      }
    });

    return similar.sort((a, b) => (b.similarity + b.user_confidence/10) - (a.similarity + a.user_confidence/10)).slice(0, 3);
  } catch (error) {
    logError('Error learning from user contributions', error.message);
    return [];
  }
}

/**
 * Analyze product description to find specific HS codes with detailed matching
 * Uses all user inputs: business type, description attributes, category selection, and user learnings
 */
async function analyzeForSpecificHSCodes(description, categories, businessType, selectedCategory, userLearnings = []) {
  const descLower = description.toLowerCase();
  const hsCodeMatches = new Map();

  // Learn attributes dynamically from database descriptions
  const learnedVocabulary = await learnAttributeVocabulary(categories);
  const attributes = extractAttributesIntelligently(descLower, learnedVocabulary);
  
  logInfo('Analyzing for specific HS codes', {
    attributes,
    selectedCategory,
    businessType,
    totalHSCodes: categories.length
  });

  // Score each HS code based on detailed attribute matching
  for (const item of categories) {
    if (!item.hs_code || !item.product_description) continue;

    const hsCode = item.hs_code;
    const productDesc = item.product_description.toLowerCase();
    
    let score = 0;
    let matchedAttributes = [];

    // Attribute-based scoring (much more precise than keyword matching)
    
    // Material matching (high importance)
    if (attributes.materials.length > 0) {
      for (const material of attributes.materials) {
        if (productDesc.includes(material)) {
          score += 10;
          matchedAttributes.push(`material:${material}`);
        }
      }
    }

    // Gender/demographic matching
    if (attributes.gender && productDesc.includes(attributes.gender)) {
      score += 8;
      matchedAttributes.push(`gender:${attributes.gender}`);
    }

    // Product type matching
    if (attributes.productType && productDesc.includes(attributes.productType)) {
      score += 8;
      matchedAttributes.push(`type:${attributes.productType}`);
    }

    // Construction/method matching
    if (attributes.construction.length > 0) {
      for (const method of attributes.construction) {
        if (productDesc.includes(method)) {
          score += 6;
          matchedAttributes.push(`construction:${method}`);
        }
      }
    }

    // Category selection boost (user explicitly selected this category)
    if (selectedCategory && item.product_category && 
        item.product_category.toLowerCase().includes(selectedCategory.toLowerCase().split(' ')[0])) {
      score += 15; // Strong boost for user's category choice
      matchedAttributes.push(`category:${selectedCategory}`);
    }

    // Business type alignment
    if (businessType && businessType !== 'general') {
      const businessWords = businessType.toLowerCase().split(/[\s&]+/);
      for (const bizWord of businessWords) {
        if (productDesc.includes(bizWord)) {
          score += 5;
          matchedAttributes.push(`business:${bizWord}`);
        }
      }
    }

    // Store the best matches for each HS code
    if (score > 0) {
      hsCodeMatches.set(hsCode, {
        score,
        matches: matchedAttributes,
        description: item.product_description,
        category: item.product_category,
        chapter: hsCode.substring(0, 2)
      });
    }
  }

  // STEP 1: Add user-contributed suggestions first (highest priority)
  const userSuggestions = userLearnings.map(learning => ({
    category: `${learning.hs_code} - User Contributed Match`,
    hsCode: learning.hs_code,
    confidence: Math.min(Math.round((learning.similarity * 50) + (learning.user_confidence * 8) + 30), 98),
    reason: `Similar to: "${learning.source_description.substring(0, 40)}..."`,
    chapter: learning.hs_code.substring(0, 2),
    fullDescription: learning.source_description,
    match_score: learning.similarity * 100,
    source: 'user_contributed',
    user_confidence: learning.user_confidence
  }));

  // STEP 2: Get database-driven suggestions  
  const databaseSuggestions = Array.from(hsCodeMatches.entries())
    .map(([hsCode, data]) => ({
      category: `${hsCode} - ${data.description.substring(0, 60)}...`,
      hsCode: hsCode,
      confidence: Math.min(Math.round((data.score / 20) * 10 + 65), 98),
      reason: `Matches: ${data.matches.slice(0, 4).join(', ')}`,
      chapter: data.chapter,
      fullDescription: data.description,
      match_score: data.score,
      source: 'database_analysis'
    }))
    .filter(suggestion => suggestion.confidence >= 60);

  // STEP 3: Combine and prioritize suggestions
  // User contributions get highest priority, then database matches
  const allSuggestions = [
    ...userSuggestions,
    ...databaseSuggestions
  ];

  // Remove duplicates (keep highest confidence version)
  const uniqueSuggestions = [];
  const seenHSCodes = new Set();

  allSuggestions
    .sort((a, b) => b.confidence - a.confidence)
    .forEach(suggestion => {
      if (!seenHSCodes.has(suggestion.hsCode)) {
        seenHSCodes.add(suggestion.hsCode);
        uniqueSuggestions.push(suggestion);
      }
    });

  return uniqueSuggestions.slice(0, 5); // Top 5 suggestions total
}

/**
 * Learn attribute vocabulary dynamically from database HS code descriptions
 * Self-improving system that grows with the database
 */
async function learnAttributeVocabulary(categories) {
  const vocabulary = {
    materials: new Map(),
    genderIndicators: new Map(),
    productTypes: new Map(),
    constructions: new Map(),
    features: new Map()
  };

  // Analyze all HS code descriptions to learn patterns
  categories.forEach(item => {
    if (!item.product_description) return;
    
    const desc = item.product_description.toLowerCase();
    const words = desc.split(/[,\s\-\.]+/).filter(w => w.length > 2);
    
    words.forEach(word => {
      // Learn materials (words that commonly appear with material indicators)
      if (desc.includes('of ' + word) || desc.includes('made of ' + word) || 
          desc.includes(word + ' fabric') || desc.includes(word + ' material')) {
        vocabulary.materials.set(word, (vocabulary.materials.get(word) || 0) + 1);
      }
      
      // Learn gender indicators
      if (word.includes('men') || word.includes('women') || word.includes('boy') || word.includes('girl')) {
        vocabulary.genderIndicators.set(word, (vocabulary.genderIndicators.get(word) || 0) + 1);
      }
      
      // Learn construction methods (words that appear with construction contexts)
      if (desc.includes(word + 'ed') || desc.includes(word + 'ing') || 
          desc.includes('method') || desc.includes('process')) {
        vocabulary.constructions.set(word, (vocabulary.constructions.get(word) || 0) + 1);
      }
      
      // Learn product types (nouns that appear frequently)
      if (words.indexOf(word) > 0 && words.indexOf(word) < words.length - 1) {
        vocabulary.productTypes.set(word, (vocabulary.productTypes.get(word) || 0) + 1);
      }
    });
  });

  // Filter to most common/relevant terms (dynamic thresholds)
  const filterTop = (map, minCount = 2) => {
    return Array.from(map.entries())
      .filter(([word, count]) => count >= minCount && word.length > 2)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  };

  return {
    materials: filterTop(vocabulary.materials, 2),
    genderIndicators: filterTop(vocabulary.genderIndicators, 1),
    productTypes: filterTop(vocabulary.productTypes, 3),
    constructions: filterTop(vocabulary.constructions, 1),
    commonWords: filterTop(vocabulary.features, 1)
  };
}

/**
 * Extract attributes intelligently using learned vocabulary
 */
function extractAttributesIntelligently(description, learnedVocabulary) {
  const attributes = {
    materials: [],
    gender: null,
    productType: null,
    construction: [],
    features: []
  };


  // Use learned materials vocabulary
  learnedVocabulary.materials.forEach(material => {
    if (description.includes(material)) {
      attributes.materials.push(material);
    }
  });

  // Use learned gender indicators
  for (const indicator of learnedVocabulary.genderIndicators) {
    if (description.includes(indicator)) {
      if (indicator.includes('men') || indicator.includes('boy')) {
        attributes.gender = indicator.includes('women') ? 'women' : 'men';
      } else if (indicator.includes('women') || indicator.includes('girl')) {
        attributes.gender = 'women';
      }
      break;
    }
  }

  // Use learned product types
  for (const type of learnedVocabulary.productTypes) {
    if (description.includes(type)) {
      attributes.productType = type;
      break;
    }
  }

  // Use learned construction methods
  learnedVocabulary.constructions.forEach(method => {
    if (description.includes(method)) {
      attributes.construction.push(method);
    }
  });

  return attributes;
}

/**
 * Get categories filtered by business type for precision targeting
 * Database-driven approach - no hardcoded mappings
 */
async function getBusinessTypeFilteredCategories(businessType) {
  let query = supabase
    .from('comtrade_reference')
    .select('product_category, product_description, hs_code')
    .not('product_category', 'is', null);

  // Apply intelligent filtering based on business type keywords
  if (businessType && businessType !== 'general') {
    // Extract keywords from business type for fuzzy matching
    const businessKeywords = businessType.toLowerCase().split(/[\s&]+/).filter(word => word.length > 2);
    
    if (businessKeywords.length > 0) {
      // Use database search to find categories that match business type keywords
      const categorySearchConditions = businessKeywords.map(keyword => 
        `product_category.ilike.%${keyword}%`
      ).join(',');
      
      query = query.or(categorySearchConditions);
      
      logInfo(`AI filtering by business type keywords: ${businessType}`, {
        keywords: businessKeywords,
        filterApplied: true
      });
    }
  }

  // Always limit to prevent excessive data
  query = query.limit(500);

  const { data, error } = await query;
  
  if (error) {
    logError('Business type filtering failed', error.message);
    // Fallback to general query
    return await supabase
      .from('comtrade_reference')
      .select('product_category, product_description, hs_code')
      .not('product_category', 'is', null)
      .limit(1000);
  }

  // Only supplement if we have very few results and business type filtering was meaningful
  if (data && data.length < 10 && businessType !== 'general') {
    logInfo('Supplementing filtered results - very low category match', {
      filteredCount: data.length,
      businessType
    });
    
    // Get only the most relevant general categories, not everything
    const { data: generalData } = await supabase
      .from('comtrade_reference')
      .select('product_category, product_description, hs_code')
      .not('product_category', 'is', null)
      .limit(100);
    
    // Combine and deduplicate
    const combined = [...data, ...(generalData || [])];
    const uniqueItems = combined.filter((item, index, self) => 
      index === self.findIndex(t => t.hs_code === item.hs_code)
    );
    
    return { data: uniqueItems, error: null };
  }

  return { data, error: null };
}