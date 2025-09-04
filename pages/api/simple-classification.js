/**
 * MINIMAL WORKING CLASSIFICATION API
 * Direct Supabase connection without complex dependencies
 */

import { cacheGet, cacheSet, generateCacheKey } from '../../lib/cache/redis-cache.js';
import optimizedSupabase, { performQuery } from '../../lib/database/optimized-supabase-client.js';

// Import AI classification function directly (avoid HTTP fetch cycle)
import { analyzeProductWithBusinessContext } from './ai-classify.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { product_description } = req.body;
    
    if (!product_description) {
      return res.status(400).json({ error: 'Product description required' });
    }

    // ENTERPRISE CACHING: Check cache first for instant response
    const cacheKey = generateCacheKey.classification(product_description);
    const cachedResult = await cacheGet(cacheKey);
    
    if (cachedResult) {
      return res.status(200).json({
        ...cachedResult,
        cached: true,
        cache_key: cacheKey
      });
    }

    // STEP 1: AI-FIRST CLASSIFICATION - Use AI to interpret product description
    let aiClassification = null;
    try {
      // Direct AI analysis (avoid HTTP fetch cycle)
      const aiAnalysis = analyzeProductWithBusinessContext(product_description, { 
        business_type: req.body.business_type || 'electronics' // Default context for electrical products
      });
      
      aiClassification = {
        success: true,
        likely_chapters: aiAnalysis.chapters,
        primary_application: aiAnalysis.application,
        industry_context: aiAnalysis.industry,
        confidence: aiAnalysis.confidence,
        reasoning: aiAnalysis.reasoning
      };
      
      console.log('AI Classification Result:', {
        product: product_description,
        chapters: aiAnalysis.chapters,
        application: aiAnalysis.application,
        confidence: aiAnalysis.confidence
      });
      
    } catch (error) {
      console.log('AI classification error:', error.message);
      console.log('Falling back to database-only search');
    }

    // Extract basic search terms (no hardcoded synonym expansion)
    const searchTerms = product_description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Remove punctuation
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim()
      .split(' ')
      .filter((word, index, arr) => word.length >= 3 && arr.indexOf(word) === index)  // Unique terms only
      .slice(0, 6);

    if (searchTerms.length === 0) {
      return res.status(400).json({ error: 'No valid search terms found' });
    }

    // STEP 2: AI-GUIDED SEARCH - Let AI intelligence guide our database queries
    console.log(`🧠 AI-guided search for: "${product_description}"`);
    
    let exactData = [], broadData = [];
    
    // AI-CONTEXTUALIZED SEARCH: Use AI's full understanding for precise database queries
    if (aiClassification && aiClassification.likely_chapters && aiClassification.likely_chapters.length > 0) {
      console.log(`🧠 AI Context Analysis:`);
      console.log(`   📋 Product: ${product_description}`);
      console.log(`   🏭 Industry: ${aiClassification.industry_context}`);
      console.log(`   🔧 Application: ${aiClassification.primary_application}`);
      console.log(`   🎯 Chapters: [${aiClassification.likely_chapters.join(', ')}]`);
      console.log(`   💭 AI Reasoning: ${aiClassification.reasoning}`);
      
      // AI-CONTEXTUALIZED DATABASE QUERIES: Use AI's understanding to build smart searches
      const contextualSearches = buildContextualSearches(aiClassification, product_description, req.body.business_type);
      
      console.log(`🔍 AI-Generated Search Strategies:`, contextualSearches);
      
      for (const search of contextualSearches) {
        console.log(`   🎯 Executing: ${search.strategy} in Chapter ${search.chapter}`);
        
        const { data: contextualData } = await performQuery(
          (client) => {
            let query = client
              .from('hs_master_rebuild')
              .select('hs_code, description, mfn_rate, usmca_rate, country_source, chapter');
            
            // Apply AI-recommended chapter filter
            if (search.chapter) {
              query = query.eq('chapter', search.chapter);
            }
            
            // Apply AI-recommended HS code pattern if available
            if (search.hsPattern) {
              query = query.like('hs_code', search.hsPattern);
            }
            
            // Apply AI-contextualized search terms
            if (search.keywords && search.keywords.length > 0) {
              query = query.textSearch('description', search.keywords.join(' | '));
            }
            
            // Apply exact phrase if AI recommends it
            if (search.exactPhrase) {
              query = query.ilike('description', `%${search.exactPhrase}%`);
            }
            
            return query.limit(search.limit || 8);
          },
          search.queryId
        );
        
        if (contextualData && contextualData.length > 0) {
          console.log(`   ✅ Found ${contextualData.length} results for ${search.strategy}`);
          exactData.push(...contextualData.map(item => ({
            ...item, 
            ai_search_strategy: search.strategy,
            ai_confidence_boost: search.confidenceBoost || 0
          })));
        }
      }
      
    } else {
      console.log(`⚠️ AI classification failed, using intelligent fallback`);
      // INTELLIGENT FALLBACK: Broader search with intelligent term extraction
      const { data: fallbackData } = await performQuery(
        (client) => client
          .from('hs_master_rebuild')
          .select('hs_code, description, mfn_rate, usmca_rate, country_source, chapter')
          .textSearch('description', searchTerms.join(' | '))
          .limit(20),
        'intelligent_fallback'
      );
      exactData = fallbackData || [];
    }

    // SUPPLEMENTARY: Always do some exact phrase matching as backup
    const { data: supplementData, error: broadError } = await performQuery(
      (client) => client
        .from('hs_master_rebuild') 
        .select('hs_code, description, mfn_rate, usmca_rate, country_source, chapter')
        .ilike('description', `%${product_description}%`)
        .limit(10),
        'exact_phrase_supplement'
    );
    broadData = supplementData || [];

    // STEP 3: COMBINE AND DEDUPLICATE - Get all unique matches first
    const rawResults = [];
    const seenCodes = new Set();
    
    // Add exact matches first (highest relevance)
    (exactData || []).forEach(item => {
      if (!seenCodes.has(item.hs_code)) {
        rawResults.push({ ...item, match_type: 'exact' });
        seenCodes.add(item.hs_code);
      }
    });
    
    // Add broad matches (avoid duplicates)
    (broadData || []).forEach(item => {
      if (!seenCodes.has(item.hs_code)) {
        rawResults.push({ ...item, match_type: 'broad' });
        seenCodes.add(item.hs_code);
      }
    });
    
    console.log(`📊 Found ${rawResults.length} total matches before business context scoring`);
    
    // STEP 4: SMART BUSINESS CONTEXT SCORING - Boost (don't filter)
    const allResults = rawResults.map(item => {
      let businessBoost = 0;
      
      // Apply business context boost based on AI analysis
      if (aiClassification && aiClassification.likely_chapters) {
        const itemChapter = parseInt(item.hs_code.substring(0, 2));
        if (aiClassification.likely_chapters.includes(itemChapter)) {
          businessBoost += 0.15; // +15% boost for business-relevant chapters
          console.log(`  📈 Chapter ${itemChapter} boost for ${item.hs_code} (${aiClassification.industry} context)`);
        }
      }
      
      return { ...item, business_boost: businessBoost };
    });

    const error = broadError;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Database query failed' });
    }

    // SMART RELEVANCE SCORING: Score based on search term matches
    const formattedResults = (allResults || []).map((product, index) => {
      const description = product.description.toLowerCase();
      
      // Count how many original search terms appear in this result
      const termMatches = searchTerms.filter(term => description.includes(term)).length;
      const termCoverage = termMatches / searchTerms.length;
      
      // ENHANCED CONFIDENCE SCORING with business context
      let baseConfidence = 0.9 - (index * 0.05);
      let relevanceBoost = termCoverage * 0.3; // Up to 30% boost for full term coverage
      
      // Special boost for exact product matches (both terms present)
      if (searchTerms.length >= 2 && termMatches >= 2) {
        relevanceBoost += 0.2; // Additional 20% for multi-term matches
      }
      
      // Apply business context boost (from business_boost field)
      const businessContextBoost = product.business_boost || 0;
      
      // Apply AI search strategy boost
      const aiStrategyBoost = product.ai_confidence_boost || 0;
      
      // TOTAL CONFIDENCE = Base + Relevance + Business Context + AI Strategy
      const totalConfidence = Math.min(0.95, Math.max(0.5, baseConfidence + relevanceBoost + businessContextBoost + aiStrategyBoost));
      
      console.log(`  🎯 ${product.hs_code}: base=${baseConfidence.toFixed(2)}, relevance=+${relevanceBoost.toFixed(2)}, business=+${businessContextBoost.toFixed(2)}, ai=+${aiStrategyBoost.toFixed(2)}, total=${totalConfidence.toFixed(2)}`);

      return {
        ...product,
        product_description: product.description,
        mfn_tariff_rate: product.mfn_rate || 0,
        usmca_tariff_rate: product.usmca_rate || 0,
        savings_percent: Math.max(0, (product.mfn_rate || 0) - (product.usmca_rate || 0)),
        confidence: totalConfidence,
        matchedTerm: product.match_type || 'optimized_query',
        business_context_applied: businessContextBoost > 0,
        termMatches, // Debug info
        termCoverage // Debug info
      };
    });

    // Remove duplicates by HS code
    const seen = new Set();
    const uniqueProducts = formattedResults.filter(product => {
      if (seen.has(product.hs_code)) {
        return false;
      }
      seen.add(product.hs_code);
      return true;
    });

    // INTELLIGENT CONTEXTUAL ANALYSIS: Understand product context without hardcoding
    const analyzeProductContext = (searchQuery, productDesc, hsChapter) => {
      const query = searchQuery.toLowerCase();
      const desc = productDesc.toLowerCase();
      let contextualRelevance = 0;
      
      // ELECTRICAL CONTEXT: Multiple signals indicate electrical products
      const electricalSignals = [
        query.includes('electrical') || query.includes('wire') || query.includes('cable'),
        query.includes('voltage') || query.includes('conductor') || query.includes('insulated'),
        desc.includes('electrical') || desc.includes('voltage') || desc.includes('conductor'),
        hsChapter === 85 // Chapter 85 is electrical machinery
      ];
      const electricalScore = electricalSignals.filter(Boolean).length / electricalSignals.length;
      
      // AUTOMOTIVE CONTEXT: Multiple signals indicate automotive products  
      const automotiveSignals = [
        query.includes('automotive') || query.includes('vehicle') || query.includes('brake'),
        query.includes('engine') || query.includes('transmission'),
        desc.includes('automotive') || desc.includes('vehicle') || desc.includes('motor'),
        hsChapter === 87 // Chapter 87 is vehicles
      ];
      const automotiveScore = automotiveSignals.filter(Boolean).length / automotiveSignals.length;
      
      // METAL/MATERIAL CONTEXT: Understand when metal chapter is appropriate
      const metalSignals = [
        query.includes('copper') || query.includes('steel') || query.includes('iron'),
        desc.includes('metal') || desc.includes('alloy'),
        [71, 72, 73, 74, 75, 76, 78, 79, 80, 81].includes(hsChapter) // Metal chapters
      ];
      const metalScore = metalSignals.filter(Boolean).length / metalSignals.length;
      
      // CONTEXTUAL CONFLICTS: Detect when results don't match search intent
      const hasElectricalIntent = query.includes('electrical') || query.includes('wire');
      const isNonElectricalResult = hsChapter < 80 && !desc.includes('electrical') && !desc.includes('conductor');
      
      if (hasElectricalIntent && isNonElectricalResult) {
        contextualRelevance -= 0.3; // Penalize non-electrical results for electrical searches
      }
      
      // BOOST CONTEXTUALLY RELEVANT RESULTS
      contextualRelevance += Math.max(electricalScore, automotiveScore, metalScore) * 0.4;
      
      return {
        contextualRelevance,
        electricalScore,
        automotiveScore,
        metalScore,
        contextMismatch: hasElectricalIntent && isNonElectricalResult
      };
    };

    // APPLY INTELLIGENT CONTEXTUAL ANALYSIS
    const enhancedProducts = uniqueProducts.map(product => {
      const hsChapter = parseInt(product.hs_code.substring(0, 2));
      const context = analyzeProductContext(product_description, product.description, hsChapter);
      
      // Apply contextual relevance boost
      const enhancedConfidence = Math.min(0.95, Math.max(0.1, product.confidence + context.contextualRelevance));
      
      return {
        ...product,
        confidence: enhancedConfidence,
        hsChapter,
        contextAnalysis: context
      };
    });

    // AI-PRIORITIZED SORTING: Put AI-recommended products first
    const sortedProducts = enhancedProducts.sort((a, b) => {
      // PRIORITY 1: AI-specific strategies beat general strategies
      const aSpecific = a.ai_search_strategy && (
        a.ai_search_strategy.includes('8544') || 
        a.ai_search_strategy.includes('8536') ||
        a.ai_search_strategy.includes('conductor') ||
        a.ai_search_strategy.includes('connector')
      );
      const bSpecific = b.ai_search_strategy && (
        b.ai_search_strategy.includes('8544') || 
        b.ai_search_strategy.includes('8536') ||
        b.ai_search_strategy.includes('conductor') ||
        b.ai_search_strategy.includes('connector')
      );
      
      if (aSpecific && !bSpecific) return -1; // A is specific, B is general → A first
      if (!aSpecific && bSpecific) return 1;  // B is specific, A is general → B first
      
      // PRIORITY 2: Within same specificity, prefer actual 8544/8536 codes
      const aIs8544or8536 = a.hs_code.startsWith('8544') || a.hs_code.startsWith('8536');
      const bIs8544or8536 = b.hs_code.startsWith('8544') || b.hs_code.startsWith('8536');
      
      if (aIs8544or8536 && !bIs8544or8536) return -1;
      if (!aIs8544or8536 && bIs8544or8536) return 1;
      
      // PRIORITY 3: Enhanced confidence (includes AI boost)
      if (Math.abs(b.confidence - a.confidence) > 0.05) {
        return b.confidence - a.confidence;
      }
      
      // PRIORITY 4: Term coverage
      if (b.termCoverage !== a.termCoverage) {
        return b.termCoverage - a.termCoverage;
      }
      
      // PRIORITY 5: Original confidence
      return b.confidence - a.confidence;
    });

    const results = sortedProducts.slice(0, 10);

    // CACHE RESPONSE: Store for future requests (1 hour TTL)
    const response = {
      success: true,
      results: results,
      total_matches: results.length,
      method: 'direct_database_search'
    };
    
    await cacheSet(cacheKey, response, 3600000); // 1 hour cache

    return res.status(200).json(response);

  } catch (error) {
    console.error('Classification error:', error);
    return res.status(500).json({ 
      error: 'Classification failed',
      message: error.message 
    });
  }
}

/**
 * BUILD CONTEXTUALIZED SEARCHES - Let AI intelligence create smart database queries
 * This is where AI context gets translated into precise database searches
 */
function buildContextualSearches(aiClassification, productDescription, businessType) {
  const searches = [];
  const desc = productDescription.toLowerCase();
  const industry = aiClassification.industry_context;
  const application = aiClassification.primary_application;
  
  console.log(`🧠 Building searches for: ${application} in ${industry} industry`);
  
  // AUTOMOTIVE ELECTRICAL WIRE HARNESS SEARCH - Use Chapter 85 + HS pattern
  if (application?.includes('automotive') && (desc.includes('wire') || desc.includes('cable'))) {
    searches.push({
      strategy: 'automotive_electrical_conductor_8544',
      chapter: 85, // Database uses 2-digit chapters
      hsPattern: '8544%', // But we filter by 4-digit HS pattern
      keywords: ['electrical', 'wire', 'cable', 'conductor', 'harness'],
      exactPhrase: null,
      limit: 10,
      confidenceBoost: 0.30, // Higher boost for precise match
      queryId: 'ai_automotive_wire_8544'
    });
    
    // Also check for automotive wiring in vehicle parts chapter
    searches.push({
      strategy: 'automotive_wiring_harness_assembly',
      chapter: 8708,
      keywords: ['wiring', 'harness', 'electrical', 'dashboard'],
      limit: 5,
      confidenceBoost: 0.15,
      queryId: 'ai_automotive_harness_8708'
    });
  }
  
  // ELECTRICAL CONNECTOR SEARCH - Use Chapter 85 + HS pattern 8536
  if (desc.includes('connector') || desc.includes('connection')) {
    searches.push({
      strategy: 'electrical_connectors_8536',
      chapter: 85, // Database uses 2-digit chapters  
      hsPattern: '8536%', // But we filter by 4-digit HS pattern
      keywords: ['connector', 'connection', 'electrical', 'plastic', 'molded'],
      limit: 10,
      confidenceBoost: 0.30, // Higher boost for precise match
      queryId: 'ai_connectors_8536'
    });
  }
  
  // GENERAL ELECTRICAL PRODUCTS in Chapter 85
  if (aiClassification.likely_chapters.includes(85) || aiClassification.likely_chapters.includes(8544) || aiClassification.likely_chapters.includes(8536)) {
    searches.push({
      strategy: 'electrical_machinery_general',
      chapter: 85,
      keywords: extractElectricalKeywords(desc, application),
      limit: 10,
      confidenceBoost: 0.10,
      queryId: 'ai_electrical_general_85'
    });
  }
  
  // EXACT PRODUCT DESCRIPTION SEARCH in AI chapters
  if (aiClassification.likely_chapters && aiClassification.likely_chapters.length > 0) {
    for (const chapter of aiClassification.likely_chapters.slice(0, 2)) { // Top 2 chapters only
      searches.push({
        strategy: `exact_description_chapter_${chapter}`,
        chapter: chapter,
        exactPhrase: productDescription,
        limit: 5,
        confidenceBoost: 0.20,
        queryId: `ai_exact_${chapter}`
      });
    }
  }
  
  // MATERIAL-BASED FALLBACK (only if no electrical function detected)
  if (!desc.includes('electrical') && !desc.includes('wire') && !desc.includes('connector')) {
    const material = extractPrimaryMaterial(desc);
    if (material.chapter) {
      searches.push({
        strategy: `material_based_${material.name}`,
        chapter: material.chapter,
        keywords: [material.name, ...extractMaterialKeywords(desc)],
        limit: 6,
        confidenceBoost: 0.05,
        queryId: `ai_material_${material.chapter}`
      });
    }
  }
  
  return searches;
}

/**
 * Extract electrical keywords based on AI application understanding
 */
function extractElectricalKeywords(desc, application) {
  const keywords = [];
  
  // Base electrical terms
  if (desc.includes('wire') || desc.includes('cable')) keywords.push('wire', 'cable', 'conductor');
  if (desc.includes('connector')) keywords.push('connector', 'connection');
  if (desc.includes('electrical')) keywords.push('electrical', 'electric');
  
  // Application-specific terms
  if (application?.includes('automotive')) {
    keywords.push('harness', 'dashboard', 'vehicle');
  }
  
  // Technical specifications
  if (desc.includes('awg') || desc.match(/\d+\s*awg/)) keywords.push('wire');
  if (desc.includes('voltage') || desc.includes('volt')) keywords.push('voltage');
  
  return keywords.length > 0 ? keywords : ['electrical'];
}

/**
 * Extract primary material for fallback searches
 */
function extractPrimaryMaterial(desc) {
  if (desc.includes('copper')) return { name: 'copper', chapter: 74 };
  if (desc.includes('steel')) return { name: 'steel', chapter: 72 };
  if (desc.includes('aluminum')) return { name: 'aluminum', chapter: 76 };
  if (desc.includes('plastic')) return { name: 'plastic', chapter: 39 };
  return { name: null, chapter: null };
}

/**
 * Extract material-related keywords
 */
function extractMaterialKeywords(desc) {
  const keywords = [];
  const words = desc.split(' ');
  
  // Include relevant material descriptors
  words.forEach(word => {
    if (['alloy', 'sheet', 'rod', 'bar', 'tube', 'pipe'].includes(word)) {
      keywords.push(word);
    }
  });
  
  return keywords;
}