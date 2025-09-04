/**
 * AI-POWERED HIERARCHICAL HS CODE CLASSIFIER
 * 
 * Replaces the broken keyword matching system with intelligent classification:
 * - Hierarchical matching within HS chapters
 * - Semantic similarity using product relationships
 * - Context-aware suggestions based on industry patterns
 * - Relevance scoring based on HS code structure
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables if needed
if (typeof process !== 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const dotenv = await import('dotenv');
    dotenv.config({ path: '.env.local' });
  } catch (e) {
    // Ignore if dotenv not available
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mrwitpgbcaxgnirqtavt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yd2l0cGdiY2F4Z25pcnF0YXZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTgyNTEzNCwiZXhwIjoyMDY1NDAxMTM0fQ.ghQeTQAK56uCMX3xkWbeYXb2IAnkSwx7EUhnaZXsFW8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Product category to HS chapter mapping for intelligent classification
 * Based on official HS nomenclature structure
 */
const PRODUCT_CATEGORY_MAPPING = {
  // Electrical & Electronics (Chapters 84-85)
  'electrical': [84, 85],
  'electronic': [85, 90],
  'wire': [85],
  'cable': [85],
  'conductor': [85],
  'connector': [85],
  'semiconductor': [85],
  'circuit': [85],
  'transformer': [85],
  'motor': [85],
  'battery': [85],
  
  // Plastics & Rubber (Chapters 39-40)
  'plastic': [39],
  'polymer': [39],
  'resin': [39],
  'rubber': [40],
  'tube': [39, 85], // Could be plastic tubes OR electrical conduit
  'sheathing': [39, 85],
  
  // Machinery (Chapter 84)
  'machine': [84],
  'engine': [84, 87],
  'pump': [84],
  'compressor': [84],
  'bearing': [84],
  
  // Automotive (Chapter 87)
  'automotive': [87],
  'vehicle': [87],
  'car': [87],
  'truck': [87],
  
  // Metals (Chapters 72-81)
  'steel': [72, 73],
  'iron': [72, 73],
  'aluminum': [76],
  'copper': [74, 85], // Raw copper OR copper electrical products
  'metal': [72, 73, 74, 75, 76],
  
  // Textiles (Chapters 50-63)
  'textile': [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63],
  'fabric': [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
  'clothing': [61, 62],
  'apparel': [61, 62],
  
  // Chemicals (Chapters 28-38)
  'chemical': [28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38],
  'pharmaceutical': [30],
  'paint': [32],
  'cosmetic': [33],
  
  // Wood & Paper (Chapters 44-49)
  'wood': [44],
  'lumber': [44],
  'paper': [48],
  'cardboard': [48],
  
  // Food & Agriculture (Chapters 1-24)
  'food': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  'grain': [10, 11],
  'meat': [2, 16],
  'dairy': [4],
  'fruit': [7, 8, 20],
  'vegetable': [7, 20]
};

/**
 * Advanced semantic product relationships for better matching
 */
const PRODUCT_RELATIONSHIPS = {
  // Electrical products relationships
  'copper wire': ['electrical wire', 'conductor', 'electrical conductor', 'insulated wire'],
  'electrical wire': ['copper wire', 'aluminum wire', 'insulated conductor', 'power cable'],
  'wire connector': ['electrical connector', 'terminal', 'plug', 'socket'],
  'cable': ['wire', 'conductor', 'cord', 'harness'],
  'insulation': ['sheathing', 'covering', 'jacket', 'sleeve'],
  
  // Plastic products relationships  
  'plastic tube': ['plastic pipe', 'conduit', 'tubing', 'hose'],
  'plastic connector': ['fitting', 'coupling', 'adapter', 'joint'],
  'wire sheathing': ['insulation', 'jacket', 'covering', 'sleeve'],
  
  // Automotive relationships
  'automotive wire': ['vehicle wiring', 'car harness', 'ignition wire'],
  'automotive connector': ['vehicle connector', 'car plug', 'terminal block'],
  
  // Generic relationships
  'component': ['part', 'element', 'module', 'assembly'],
  'assembly': ['unit', 'system', 'module', 'subassembly']
};

/**
 * Main AI-powered classification function
 */
export async function classifyProduct(productDescription, options = {}) {
  if (!productDescription || productDescription.length < 3) {
    return {
      success: false,
      error: 'Product description too short',
      suggestions: []
    };
  }

  const startTime = Date.now();
  const normalizedDescription = productDescription.toLowerCase().trim();
  
  try {
    // Step 1: Identify likely product categories and HS chapters
    const targetChapters = identifyTargetChapters(normalizedDescription);
    
    // Step 2: Extract key product terms and synonyms
    const productTerms = extractProductTerms(normalizedDescription);
    
    // Step 3: Hierarchical search within target chapters
    const hierarchicalResults = await performHierarchicalSearch(productTerms, targetChapters);
    
    // Step 4: Semantic similarity matching
    const semanticResults = await performSemanticMatching(normalizedDescription, productTerms);
    
    // Step 5: Combine and score results
    const combinedResults = combineAndScoreResults(hierarchicalResults, semanticResults, productTerms);
    
    // Step 6: Generate contextual suggestions
    const suggestions = await generateContextualSuggestions(combinedResults, productTerms, targetChapters);
    
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      primarySuggestions: suggestions.slice(0, 5),
      alternativeSuggestions: suggestions.slice(5, 10),
      metadata: {
        targetChapters,
        productTerms,
        executionTime,
        totalMatches: suggestions.length
      }
    };
    
  } catch (error) {
    console.error('AI Classification Error:', error);
    return {
      success: false,
      error: error.message,
      suggestions: []
    };
  }
}

/**
 * Identify target HS chapters based on product description
 */
function identifyTargetChapters(description) {
  const detectedChapters = new Set();
  
  // Look for explicit product category keywords
  Object.entries(PRODUCT_CATEGORY_MAPPING).forEach(([keyword, chapters]) => {
    if (description.includes(keyword)) {
      chapters.forEach(ch => detectedChapters.add(ch));
    }
  });
  
  // Special handling for compound products
  if (description.includes('wire') && description.includes('plastic')) {
    detectedChapters.add(85); // Likely insulated electrical wire
    detectedChapters.add(39); // Could also be plastic tubing
  }
  
  if (description.includes('copper') && (description.includes('wire') || description.includes('cable'))) {
    detectedChapters.add(85); // Electrical conductors, not raw copper
  }
  
  if (description.includes('connector') && description.includes('electrical')) {
    detectedChapters.add(85); // Electrical connectors
  }
  
  // Default fallback - if no specific chapters identified, search broadly but prioritize common categories
  if (detectedChapters.size === 0) {
    return [85, 84, 39, 73, 87]; // Electronics, machinery, plastics, iron/steel, automotive
  }
  
  return Array.from(detectedChapters).sort((a, b) => a - b);
}

/**
 * Extract key product terms and their synonyms
 */
function extractProductTerms(description) {
  const words = description.split(/\s+/).filter(w => w.length > 2);
  const stopWords = ['the', 'and', 'for', 'with', 'from', 'into', 'are', 'was', 'been', 'have', 'has', 'had'];
  const productWords = words.filter(w => !stopWords.includes(w));
  
  const terms = new Set(productWords);
  
  // Add related terms based on semantic relationships
  productWords.forEach(word => {
    const relationships = PRODUCT_RELATIONSHIPS[word] || PRODUCT_RELATIONSHIPS[description];
    if (relationships) {
      relationships.forEach(related => terms.add(related));
    }
  });
  
  return Array.from(terms);
}

/**
 * Perform hierarchical search within target chapters
 */
async function performHierarchicalSearch(productTerms, targetChapters) {
  const results = [];
  
  // Search within each target chapter with term combinations
  for (const chapter of targetChapters) {
    // Exact phrase matching within chapter
    for (let i = 0; i < productTerms.length; i++) {
      for (let j = i + 1; j < productTerms.length; j++) {
        const phrase = `${productTerms[i]} ${productTerms[j]}`;
        
        try {
          const { data } = await supabase
            .from('hs_master_rebuild')
            .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
            .eq('chapter', chapter)
            .ilike('description', `%${phrase}%`)
            .limit(5);
            
          if (data && data.length > 0) {
            data.forEach(match => {
              results.push({
                ...match,
                confidence: 85 + (chapter === targetChapters[0] ? 10 : 0), // Boost primary chapter
                matchType: 'hierarchical_phrase',
                matchingTerms: [productTerms[i], productTerms[j]]
              });
            });
          }
        } catch (error) {
          console.error(`Chapter ${chapter} phrase search error:`, error);
        }
      }
    }
    
    // Individual term matching within chapter
    for (const term of productTerms.slice(0, 4)) { // Limit to avoid too many queries
      try {
        const { data } = await supabase
          .from('hs_master_rebuild')
          .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
          .eq('chapter', chapter)
          .ilike('description', `%${term}%`)
          .limit(8);
          
        if (data && data.length > 0) {
          data.forEach(match => {
            results.push({
              ...match,
              confidence: 70 + (chapter === targetChapters[0] ? 10 : 0),
              matchType: 'hierarchical_term',
              matchingTerms: [term]
            });
          });
        }
      } catch (error) {
        console.error(`Chapter ${chapter} term search error:`, error);
      }
    }
  }
  
  return results;
}

/**
 * Perform semantic matching across the database
 */
async function performSemanticMatching(originalDescription, productTerms) {
  const results = [];
  
  // Look for products with similar structure/purpose
  const semanticQueries = generateSemanticQueries(originalDescription, productTerms);
  
  for (const query of semanticQueries.slice(0, 3)) { // Limit semantic searches
    try {
      const { data } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
        .ilike('description', query)
        .limit(6);
        
      if (data && data.length > 0) {
        data.forEach(match => {
          results.push({
            ...match,
            confidence: 60,
            matchType: 'semantic',
            matchingTerms: extractMatchingTerms(match.description, productTerms)
          });
        });
      }
    } catch (error) {
      console.error('Semantic search error:', error);
    }
  }
  
  return results;
}

/**
 * Generate semantic search queries
 */
function generateSemanticQueries(description, terms) {
  const queries = [];
  
  // Look for similar product categories
  if (description.includes('wire') || description.includes('cable')) {
    queries.push('%conductor%');
    queries.push('%electrical%wire%');
    queries.push('%insulated%');
  }
  
  if (description.includes('connector') || description.includes('connection')) {
    queries.push('%connector%');
    queries.push('%terminal%');
    queries.push('%plug%');
  }
  
  if (description.includes('plastic') && description.includes('tube')) {
    queries.push('%conduit%');
    queries.push('%tubing%');
    queries.push('%pipe%');
  }
  
  // Generic term-based queries
  const primaryTerms = terms.filter(t => t.length > 4).slice(0, 2);
  primaryTerms.forEach(term => {
    queries.push(`%${term}%`);
  });
  
  return queries;
}

/**
 * Extract matching terms between description and product terms
 */
function extractMatchingTerms(description, productTerms) {
  const descLower = description.toLowerCase();
  return productTerms.filter(term => descLower.includes(term));
}

/**
 * Combine and score results from different search strategies
 */
function combineAndScoreResults(hierarchicalResults, semanticResults, productTerms) {
  const allResults = [...hierarchicalResults, ...semanticResults];
  const seenCodes = new Set();
  const uniqueResults = [];
  
  // Deduplicate and enhance scoring
  allResults.forEach(result => {
    if (!seenCodes.has(result.hs_code)) {
      seenCodes.add(result.hs_code);
      
      // Calculate enhanced confidence score
      const termMatchCount = result.matchingTerms ? result.matchingTerms.length : 0;
      const termBonus = Math.min(20, termMatchCount * 5);
      const enhancedConfidence = Math.min(95, result.confidence + termBonus);
      
      uniqueResults.push({
        ...result,
        confidence: enhancedConfidence,
        termMatchCount
      });
    }
  });
  
  // Sort by confidence and relevance
  return uniqueResults.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return b.termMatchCount - a.termMatchCount;
  });
}

/**
 * Generate contextual suggestions with proper formatting
 */
async function generateContextualSuggestions(results, productTerms, targetChapters) {
  const suggestions = results.slice(0, 15).map(result => ({
    hsCode: result.hs_code,
    description: result.description,
    confidence: Math.round(result.confidence),
    matchType: result.matchType,
    chapter: result.chapter,
    mfnRate: result.mfn_rate || 0,
    usmcaRate: result.usmca_rate || 0,
    country: result.country_source || 'Multi',
    displayText: formatDisplayText(result.hs_code, result.description),
    confidenceText: getConfidenceText(result.confidence),
    matchingTerms: result.matchingTerms || [],
    savingsPotential: calculateSavingsPotential(result.mfn_rate, result.usmca_rate)
  }));
  
  return suggestions;
}

/**
 * Format display text for UI
 */
function formatDisplayText(hsCode, description) {
  const maxLength = 85;
  const formattedCode = formatHSCode(hsCode);
  const truncatedDesc = description.length > maxLength ? 
    description.substring(0, maxLength) + '...' : description;
  return `${formattedCode} - ${truncatedDesc}`;
}

/**
 * Format HS code with dots for readability (8544.42.20.00)
 */
function formatHSCode(hsCode) {
  if (hsCode.length >= 8) {
    return `${hsCode.substring(0, 4)}.${hsCode.substring(4, 6)}.${hsCode.substring(6, 8)}${
      hsCode.length > 8 ? '.' + hsCode.substring(8) : ''
    }`;
  }
  return hsCode;
}

/**
 * Get confidence text description
 */
function getConfidenceText(confidence) {
  if (confidence >= 90) return 'Excellent match';
  if (confidence >= 80) return 'Very good match';  
  if (confidence >= 70) return 'Good match';
  if (confidence >= 60) return 'Possible match';
  if (confidence >= 50) return 'Fair match';
  return 'Low confidence';
}

/**
 * Calculate potential savings from USMCA
 */
function calculateSavingsPotential(mfnRate, usmcaRate) {
  if (!mfnRate || !usmcaRate) return 'Unknown';
  const savings = mfnRate - usmcaRate;
  if (savings > 0.05) return 'High savings potential';
  if (savings > 0.02) return 'Moderate savings';
  if (savings > 0) return 'Some savings';
  return 'No tariff advantage';
}

/**
 * Lookup specific HS code with intelligent fallback
 */
export async function lookupSpecificHSCode(hsCode) {
  if (!hsCode) return null;
  
  const normalizedCode = hsCode.replace(/[^0-9]/g, '');
  
  try {
    // Try exact match first
    let { data } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
      .eq('hs_code', normalizedCode)
      .single();
    
    if (data) {
      return {
        hsCode: data.hs_code,
        description: data.description,
        confidence: 100,
        matchType: 'exact',
        chapter: data.chapter,
        mfnRate: data.mfn_rate || 0,
        usmcaRate: data.usmca_rate || 0,
        country: data.country_source,
        displayText: formatDisplayText(data.hs_code, data.description),
        confidenceText: 'Exact match'
      };
    }

    // Try hierarchical fallback (10->8->6->4 digit)
    const fallbackLengths = [8, 6, 4];
    for (const length of fallbackLengths) {
      if (normalizedCode.length > length) {
        const shortCode = normalizedCode.substring(0, length);
        const { data: matches } = await supabase
          .from('hs_master_rebuild')
          .select('hs_code, description, chapter, mfn_rate, usmca_rate, country_source')
          .ilike('hs_code', `${shortCode}%`)
          .order('hs_code')
          .limit(1);

        if (matches && matches.length > 0) {
          const match = matches[0];
          return {
            hsCode: match.hs_code,
            description: match.description,
            confidence: 90 - (10 - length),
            matchType: `category_${length}digit`,
            chapter: match.chapter,
            mfnRate: match.mfn_rate || 0,
            usmcaRate: match.usmca_rate || 0,
            country: match.country_source,
            displayText: formatDisplayText(match.hs_code, match.description),
            confidenceText: `Category match (${length}-digit)`
          };
        }
      }
    }
    
    return null;

  } catch (error) {
    console.error('HS code lookup error:', error);
    return null;
  }
}

/**
 * Batch classification for multiple components
 */
export async function classifyMultipleProducts(productDescriptions) {
  const results = [];
  
  for (const description of productDescriptions.slice(0, 10)) { // Limit batch size
    const classification = await classifyProduct(description);
    results.push({
      productDescription: description,
      classification
    });
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}