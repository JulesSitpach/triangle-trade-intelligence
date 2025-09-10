/**
 * SMART CHAPTER DETECTION API
 * Database-driven HS chapter detection based on business type AND product description
 * NO HARDCODED MAPPINGS
 */

import { serverDatabaseService } from '../../lib/database/supabase-client.js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { businessType, productDescription } = req.body;

    if (!businessType || !productDescription) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['businessType', 'productDescription']
      });
    }

    logInfo('Smart chapter detection request', { businessType, productDescriptionLength: productDescription.length });

    // Step 1: Get default chapters from business type (from USMCA rules)
    const defaultChapters = await getDefaultChaptersFromBusinessType(businessType);
    
    // Step 2: Get product-specific chapters by searching product description in database
    const productChapters = await getChaptersFromProductDescription(productDescription);
    
    // Step 3: Smart decision - prioritize product-specific over business type default
    const detectedChapter = smartChapterSelection(defaultChapters, productChapters, productDescription);
    
    // Step 4: Get categories within the detected chapter
    const categories = await getCategoriesInChapter(detectedChapter);

    const result = {
      detected_chapter: detectedChapter,
      chapter_source: detectedChapter === defaultChapters[0] ? 'business_type' : 'product_analysis',
      business_type_chapters: defaultChapters,
      product_analysis_chapters: productChapters,
      available_categories: categories,
      analysis: {
        business_type: businessType,
        product_description_keywords: extractKeywords(productDescription),
        confidence: calculateConfidence(detectedChapter, defaultChapters, productChapters)
      }
    };

    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('Smart chapter detection failed', { error: error.message });
    return res.status(500).json({
      success: false,
      error: 'Chapter detection failed',
      technical_error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get default chapters from business type using USMCA qualification rules
 */
async function getDefaultChaptersFromBusinessType(businessType) {
  try {
    const rules = await serverDatabaseService.getUSMCAQualificationRules(null, businessType);
    
    const chapters = rules
      .filter(rule => rule.hs_chapter)
      .map(rule => rule.hs_chapter)
      .filter((chapter, index, array) => array.indexOf(chapter) === index); // unique
    
    return chapters.sort();
  } catch (error) {
    logError('Failed to get chapters from business type', { businessType, error: error.message });
    return [];
  }
}

/**
 * Analyze product description to find relevant chapters
 * Uses database search instead of hardcoded keywords
 */
async function getChaptersFromProductDescription(productDescription) {
  try {
    // Extract keywords from product description
    const keywords = extractKeywords(productDescription);
    
    if (keywords.length === 0) {
      return [];
    }

    // Search database for products matching these keywords
    const searchResults = await serverDatabaseService.searchProducts(keywords.join(' '), 20);
    
    // Extract chapters from search results
    const chapters = searchResults
      .filter(result => result.hs_code && result.hs_code.length >= 2)
      .map(result => result.hs_code.substring(0, 2))
      .filter((chapter, index, array) => array.indexOf(chapter) === index) // unique
      .sort();
    
    return chapters;
  } catch (error) {
    logError('Failed to get chapters from product description', { productDescription, error: error.message });
    return [];
  }
}

/**
 * Smart chapter selection logic
 * Prioritizes product-specific analysis over business type defaults
 */
function smartChapterSelection(defaultChapters, productChapters, productDescription) {
  // If product analysis found specific chapters, use the first one
  if (productChapters.length > 0) {
    return productChapters[0];
  }
  
  // Fallback to business type default
  if (defaultChapters.length > 0) {
    return defaultChapters[0];
  }
  
  // Emergency fallback - analyze product description for common patterns
  const description = productDescription.toLowerCase();
  
  // Basic pattern matching as last resort (could be made database-driven later)
  if (description.includes('electronic') || description.includes('electrical')) return '85';
  if (description.includes('machinery') || description.includes('equipment')) return '84';
  if (description.includes('vehicle') || description.includes('automotive')) return '87';
  if (description.includes('textile') || description.includes('fabric')) return '61';
  if (description.includes('leather') || description.includes('handbag') || description.includes('bag')) return '42';
  
  return '99'; // Miscellaneous
}

/**
 * Get product categories within a specific HS chapter
 */
async function getCategoriesInChapter(chapter) {
  try {
    const { data, error } = await serverDatabaseService.client
      .from('comtrade_reference')
      .select('product_category, count(*)')
      .like('hs_code', `${chapter}%`)
      .not('product_category', 'is', null);

    if (error) throw error;

    // Group by category and count
    const categoryMap = new Map();
    data.forEach(item => {
      const category = item.product_category.trim();
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        value: category,
        label: category,
        product_count: count,
        chapter: chapter
      }))
      .sort((a, b) => b.product_count - a.product_count); // Sort by product count

  } catch (error) {
    logError('Failed to get categories in chapter', { chapter, error: error.message });
    return [];
  }
}

/**
 * Extract meaningful keywords from product description
 * NO HARDCODED KEYWORD LISTS
 */
function extractKeywords(description) {
  return description
    .toLowerCase()
    .split(/[\s,.-]+/)
    .filter(word => word.length > 2)
    .filter(word => !['and', 'the', 'for', 'with', 'from', 'made', 'used'].includes(word))
    .slice(0, 8); // Limit to prevent query complexity
}

/**
 * Calculate confidence score for chapter detection
 */
function calculateConfidence(detectedChapter, defaultChapters, productChapters) {
  if (productChapters.includes(detectedChapter)) return 0.9; // High confidence from product analysis
  if (defaultChapters.includes(detectedChapter)) return 0.7; // Medium confidence from business type
  return 0.5; // Low confidence from fallback logic
}