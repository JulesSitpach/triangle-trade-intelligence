/**
 * HS Code Database Search Engine
 * Searches through 6,237+ HS codes from Supabase database
 * Database-driven search - no file system required
 */

import { getSupabaseClient } from './supabase-client.js';

const supabase = getSupabaseClient();

// Cache for HS codes (loaded once)
let hsCodesCache = null;

/**
 * Load HS codes from database into memory
 */
export async function loadHSCodes() {
  if (hsCodesCache) return hsCodesCache;
  
  try {
    const { data, error } = await supabase
      .from('comtrade_reference')
      .select('hs_code, product_description, product_category')
      .order('hs_code');
      
    if (error) throw error;
    
    hsCodesCache = data.map(row => ({
      hs_code: row.hs_code,
      product_description: row.product_description || `Classification ${row.hs_code}`,
      product_category: row.product_category || 'General',
      hierarchy_level: row.hs_code ? row.hs_code.toString().length : 2,
      chapter: row.hs_code ? row.hs_code.toString().substring(0, 2) : '00'
    }));
    
    console.log(`✅ Loaded ${hsCodesCache.length} HS codes from database`);
    return hsCodesCache;
    
  } catch (error) {
    console.error('❌ Failed to load HS codes from database:', error);
    return [];
  }
}

/**
 * Search HS codes by product description
 */
export async function searchHSCodes(productDescription, businessType = '', maxResults = 6) {
  const hsCodes = await loadHSCodes();
  
  if (!productDescription || hsCodes.length === 0) {
    return [];
  }
  
  // Enhanced dynamic term extraction - completely flexible
  const searchTerms = extractMeaningfulTerms(productDescription);
  const businessTerms = extractMeaningfulTerms(businessType);
  const allTerms = [...searchTerms, ...businessTerms].filter((term, index, arr) => arr.indexOf(term) === index);
  
  // Score each HS code
  const scoredResults = hsCodes.map(hsCode => {
    const description = (hsCode.product_description || '').toLowerCase();
    const category = (hsCode.product_category || '').toLowerCase();
    let score = 0;
    
    // Exact phrase match (highest score)
    if (description.includes(productDescription.toLowerCase())) {
      score += 100;
    }
    
    // Boost for exact functional matches (dynamic keyword detection)
    const functionalKeywords = allTerms.filter(term => term.length > 4); // Focus on specific terms
    functionalKeywords.forEach(keyword => {
      if (description.includes(keyword)) {
        score += 25; // Significant boost for functional matches
      }
    });
    
    // Dynamic intelligent term matching - completely flexible
    allTerms.forEach(term => {
      let termScore = 0;
      const termLength = term.length;
      
      // Score based on where and how the term matches
      if (description.includes(term)) {
        // Longer, more specific terms get higher scores
        termScore += Math.min(50, termLength * 3);
        
        // Bonus for terms that appear at the beginning (more likely to be main descriptor)
        if (description.startsWith(term)) {
          termScore += 15;
        }
      }
      
      if (category.includes(term)) {
        termScore += Math.min(20, termLength * 2);
      }
      
      // Context bonus: if multiple related terms match, boost all of them
      const relatedMatches = allTerms.filter(otherTerm => 
        otherTerm !== term && (description.includes(otherTerm) || category.includes(otherTerm))
      ).length;
      
      if (relatedMatches > 0) {
        termScore *= (1 + relatedMatches * 0.1); // Up to 50% bonus for related matches
      }
      
      score += termScore;
    });
    
    // Prefer more specific codes (6-digit over 2-digit)
    if (hsCode.hierarchy_level === 6) {
      score += 5; // Subheading level (most specific)
    } else if (hsCode.hierarchy_level === 4) {
      score += 3; // Heading level
    }
    
    // Dynamic keyword-based relevance scoring (completely flexible)
    // Check if search terms appear in multiple relevant fields
    const searchText = (productDescription + ' ' + businessType).toLowerCase();
    const descriptionLower = description.toLowerCase();
    const categoryLower = category.toLowerCase();
    
    // Multi-field relevance boost - more matches = higher confidence
    let relevanceMultiplier = 1;
    searchTerms.forEach(term => {
      if (term.length > 3) { // Focus on meaningful terms
        if (descriptionLower.includes(term) && categoryLower.includes(term)) {
          relevanceMultiplier += 0.5; // Term appears in both description and category
        }
        if (descriptionLower.includes(term) && hsCode.chapter && 
            categoryLower.includes(searchText.split(' ').find(t => t.includes(term)))) {
          relevanceMultiplier += 0.3; // Cross-field correlation
        }
      }
    });
    
    score = Math.round(score * relevanceMultiplier);
    
    // Penalize generic or vague descriptions that match too broadly
    const vagueTerms = ['other', 'n.e.c', 'not elsewhere', 'general', 'misc'];
    const hasVagueTerm = vagueTerms.some(vague => descriptionLower.includes(vague));
    if (hasVagueTerm && score < 50) {
      score *= 0.7; // Reduce score for vague matches
    }
    
    return {
      ...hsCode,
      score
    };
  }).filter(result => result.score > 0);
  
  // Sort by score and return top results
  scoredResults.sort((a, b) => b.score - a.score);
  
  return scoredResults.slice(0, maxResults).map(result => ({
    code: formatHSCode(result.hs_code),
    description: result.product_description,
    confidence: Math.min(98, Math.round(70 + (result.score / 10))),
    category: result.product_category,
    source: 'csv_9679_codes',
    hierarchyLevel: result.hierarchy_level,
    chapter: result.chapter,
    matchScore: result.score
  }));
}

/**
 * Format HS code for display
 */
export function formatHSCode(code) {
  if (!code) return '';
  
  const cleaned = code.toString().replace(/\D/g, '');
  
  if (cleaned.length <= 2) {
    return cleaned; // Chapter
  } else if (cleaned.length <= 4) {
    return `${cleaned.substring(0, 2)}.${cleaned.substring(2)}`; // Heading
  } else if (cleaned.length <= 6) {
    return `${cleaned.substring(0, 4)}.${cleaned.substring(4)}`; // Subheading  
  } else {
    return `${cleaned.substring(0, 4)}.${cleaned.substring(4, 6)}.${cleaned.substring(6)}`; // Full
  }
}

/**
 * Get specific HS code by code
 */
export async function getHSCodeByCode(hsCode) {
  const hsCodes = await loadHSCodes();
  const cleaned = hsCode.toString().replace(/\D/g, '');
  
  return hsCodes.find(code => 
    code.hs_code.replace(/\D/g, '') === cleaned
  );
}

/**
 * Extract meaningful terms dynamically from any text - completely flexible
 */
function extractMeaningfulTerms(text) {
  if (!text) return [];
  
  const cleanText = text.toLowerCase().trim();
  
  // Split on various delimiters and clean
  const rawTerms = cleanText
    .split(/[\s,;:\-_()\/\\]+/)
    .filter(term => term.length > 2)
    .map(term => term.replace(/[^\w]/g, ''))
    .filter(term => term.length > 2);
  
  // Remove common stop words that don't add meaning
  const stopWords = new Set([
    'and', 'the', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'were',
    'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may',
    'can', 'all', 'any', 'some', 'not', 'but', 'our', 'your', 'their'
  ]);
  
  const meaningfulTerms = rawTerms.filter(term => 
    !stopWords.has(term) && 
    term.length >= 3 &&
    !/^\d+$/.test(term) // Remove pure numbers
  );
  
  // Sort by length (longer terms are usually more specific)
  return meaningfulTerms.sort((a, b) => b.length - a.length);
}

/**
 * Get all codes in a chapter
 */
export async function getChapterCodes(chapter) {
  const hsCodes = await loadHSCodes();
  const chapterStr = chapter.toString().padStart(2, '0');
  
  return hsCodes.filter(code => code.chapter === chapterStr);
}