/**
 * Granular Categories API
 * Database-driven approach using direct queries - ZERO hardcoded values
 */

import { getSupabaseServiceClient } from '../../lib/database/supabase-client.js';
import { logInfo, logError, logPerformance } from '../../lib/utils/production-logger.js';

const supabase = getSupabaseServiceClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed - use GET' 
    });
  }

  const startTime = Date.now();
  const { businessType, productDescription } = req.query;

  if (!businessType) {
    return res.status(400).json({
      success: false,
      error: 'Business type parameter is required'
    });
  }

  try {
    logInfo('Granular categories request', {
      businessType,
      hasProductDescription: !!productDescription
    });

    const granularCategories = await getGranularCategoriesFromDatabase(businessType, productDescription);

    const processingTime = Date.now() - startTime;

    logPerformance('Granular categories generated', processingTime, {
      businessType,
      categoriesFound: granularCategories.length,
      method: 'direct_database_search'
    });

    return res.status(200).json({
      success: true,
      businessType,
      categories: granularCategories,
      processing_time_ms: processingTime,
      analysis_method: 'direct_database_search'
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logError('Granular categories failed', error?.message || 'Unknown error', {
      processingTimeMs: processingTime,
      businessType,
      productDescription: productDescription || 'none',
      stack: error?.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to generate granular categories',
      technical_error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      processing_time_ms: processingTime
    });
  }
}

/**
 * Get granular categories directly from database using simple ILIKE searches
 * ZERO hardcoded patterns, keywords, or mappings
 */
async function getGranularCategoriesFromDatabase(businessType, productDescription = '') {
  try {
    // Step 1: Find products that match the business type and product description
    let query = supabase
      .from('comtrade_reference')
      .select('hs_code, product_description, product_category')
      .not('product_category', 'is', null);

    // Filter by business type first to constrain scope
    if (businessType) {
      const businessWords = businessType.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      const businessConditions = businessWords.map(word => 
        `product_category.ilike.%${word}%`
      );
      query = query.or(businessConditions.join(','));
    }

    const { data: businessScopedData, error: businessError } = await query.limit(200);

    if (businessError) {
      throw new Error(`Database error: ${businessError.message}`);
    }

    // Step 2: Further filter by product description if provided
    let relevantData = businessScopedData || [];
    
    if (productDescription && relevantData.length > 0) {
      const productWords = productDescription.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      
      // Filter products that match at least one product description word
      const matchingProducts = relevantData.filter(item => {
        const description = item.product_description.toLowerCase();
        return productWords.some(word => description.includes(word));
      });
      
      // If we find matching products, use those; otherwise fall back to business-scoped data
      if (matchingProducts.length > 0) {
        relevantData = matchingProducts;
      }
    }

    // Step 3: Check if we have sufficient relevant data
    if (!relevantData || relevantData.length === 0) {
      return getProductNotFoundResponse(businessType, productDescription);
    }

    // Step 4: Group by relevant categories only
    const categoryGroups = new Map();
    
    relevantData.forEach(item => {
      const category = item.product_category || 'Other Products';
      const chapter = item.hs_code.substring(0, 2);
      
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, {
          count: 0,
          chapters: new Set(),
          examples: []
        });
      }
      
      const group = categoryGroups.get(category);
      group.count++;
      group.chapters.add(chapter);
      
      if (group.examples.length < 2) {
        group.examples.push(item.product_description.substring(0, 50) + '...');
      }
    });

    // Step 5: Convert to result format
    let categories = Array.from(categoryGroups.entries()).map(([categoryName, data]) => ({
      value: categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      label: categoryName,
      product_count: data.count,
      chapter: Array.from(data.chapters).sort().join(', '),
      description: `${categoryName} (${data.count} products in Chapter${data.chapters.size > 1 ? 's' : ''} ${Array.from(data.chapters).sort().join(', ')})`
    }));

    // Sort by product count (most relevant first)
    categories.sort((a, b) => b.product_count - a.product_count);

    // Step 6: Check if top category has sufficient matches
    if (categories.length > 0 && categories[0].product_count < 3 && productDescription) {
      // Low matches suggest product might not be in database
      return getProductNotFoundResponse(businessType, productDescription, categories);
    }

    // Limit to top 5 most relevant categories
    if (categories.length > 5) {
      categories = categories.slice(0, 5);
    }

    // Always add "Product Not Listed" option
    categories.push({
      value: 'product_not_found',
      label: 'My Product Isn\'t Listed',
      product_count: 0,
      description: 'Request to add your specific product to our database'
    });

    logInfo('Generated constrained categories from database', {
      totalCategories: categories.length - 1,
      totalProducts: relevantData.length,
      businessType,
      productDescription: productDescription || 'none',
      topCategory: categories[0]?.label,
      topCategoryCount: categories[0]?.product_count
    });

    return categories;

  } catch (error) {
    logError('Database category search failed', error.message, { businessType, productDescription });
    
    return getProductNotFoundResponse(businessType, productDescription, []);
  }
}

/**
 * Handle cases where product is not found in database
 */
function getProductNotFoundResponse(businessType, productDescription, existingCategories = []) {
  const response = [];
  
  // Include any existing categories with low match counts
  if (existingCategories.length > 0) {
    response.push(...existingCategories.slice(0, 3));
  }
  
  // Primary option: Product not found
  response.push({
    value: 'product_not_found',
    label: 'My Product Isn\'t Listed',
    product_count: 0,
    description: 'Your product isn\'t in our database yet - we\'ll research and add it within 2-3 business days'
  });
  
  // Fallback option
  response.push({
    value: 'general_classification',
    label: 'General Classification',
    product_count: 0,
    description: 'Use general product classification while we add your specific product'
  });

  logInfo('Product not found - returning research request options', {
    businessType,
    productDescription: productDescription || 'none',
    existingCategoriesCount: existingCategories.length
  });

  return response;
}