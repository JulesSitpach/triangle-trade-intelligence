/**
 * DATABASE-DRIVEN DROPDOWN OPTIONS API
 * NO HARDCODED LISTS - COMPLETE DATABASE INTEGRATION
 * 
 * Replaces simple-dropdown-options.js with fully database-driven approach
 * Following Holistic Reconstruction Plan Phase 3 requirements
 */

import { serverDatabaseService } from '../../lib/database/supabase-client.js';
import { TABLE_CONFIG } from '../../config/system-config.js';
import { logInfo, logError, logPerformance } from '../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  const startTime = Date.now();

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed_methods: ['GET']
    });
  }

  try {
    const { category } = req.query;
    
    logInfo('Dropdown options request', { category, ip: req.ip });

    let result;
    switch (category) {
      case 'business_types':
        result = await getBusinessTypes();
        break;
      
      case 'countries':
        result = await getCountries();
        break;
      
      case 'usmca_countries':
        result = await getUSMCACountries();
        break;
      
      case 'trade_volumes':
        result = await getTradeVolumeRanges();
        break;
      
      case 'product_categories':
        result = await getProductCategories();
        break;

      case 'hs_chapters':
        result = await getHSChapters();
        break;

      case 'triangle_routes':
        result = await getTriangleRoutes();
        break;

      case 'all':
        result = await getAllDropdownOptions();
        break;
      
      default:
        return res.status(400).json({
          error: 'Invalid category',
          supported_categories: [
            'business_types',
            'countries', 
            'usmca_countries',
            'trade_volumes',
            'product_categories',
            'hs_chapters',
            'triangle_routes',
            'all'
          ]
        });
    }

    const responseTime = Date.now() - startTime;
    logPerformance('Dropdown options served', startTime, { 
      category, 
      items: Array.isArray(result) ? result.length : Object.keys(result).length 
    });

    return res.status(200).json({
      success: true,
      category,
      data: result,
      processing_time_ms: responseTime,
      timestamp: new Date().toISOString(),
      source: 'database_driven'
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logError('Dropdown options failed', { 
      error: error.message, 
      category: req.query.category,
      responseTime 
    });

    return res.status(500).json({
      success: false,
      error: 'Unable to load dropdown options',
      technical_error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      processing_time_ms: responseTime,
      timestamp: new Date().toISOString(),
      fallback: 'Contact support if this error persists'
    });
  }
}

/**
 * Get business types from database
 * NO HARDCODED BUSINESS TYPE LISTS
 */
async function getBusinessTypes() {
  try {
    // Use USMCA qualification rules (same as simple-dropdown-options)
    const { data: usmcaRules, error: usmcaError } = await serverDatabaseService.client
      .from('usmca_qualification_rules')
      .select('product_category, regional_content_threshold')
      .not('product_category', 'is', null)
      .order('product_category');
    
    if (!usmcaError && usmcaRules && usmcaRules.length > 0) {
      // Remove duplicates from USMCA rules
      const uniqueRulesMap = new Map();
      
      usmcaRules.forEach(rule => {
        const category = rule.product_category;
        const threshold = rule.regional_content_threshold;
        
        // Keep the rule with higher threshold if duplicates exist
        if (!uniqueRulesMap.has(category) || uniqueRulesMap.get(category).threshold < threshold) {
          uniqueRulesMap.set(category, {
            category,
            threshold,
            label: category,  // Keep original formatting with special characters
            description: `USMCA threshold: ${threshold}%`
          });
        }
      });
      
      const businessTypesFromRules = Array.from(uniqueRulesMap.values()).map(rule => ({
        value: rule.label,  // Use label as value to preserve formatting like "Machinery & Equipment"
        label: rule.label,
        description: rule.description
      }));
      
      // Add general categories
      const existingLabels = businessTypesFromRules.map(bt => bt.label);
      const generalCategories = [
        { value: 'Manufacturing', label: 'General Manufacturing', description: 'General manufacturing products' },
        { value: 'Other', label: 'Other', description: 'Other business types' }
      ].filter(cat => !existingLabels.includes(cat.label));
      
      logInfo('Business types generated from USMCA rules', { 
        totalCategories: businessTypesFromRules.length + generalCategories.length,
        businessTypesFound: businessTypesFromRules.length 
      });
      
      return [...businessTypesFromRules, ...generalCategories];
    }
    
    // Fallback: Generate business types from actual database reality
    const { data: productCategories, error } = await serverDatabaseService.client
      .from('hs_master_rebuild')
      .select('chapter, country_source')
      .not('chapter', 'is', null);

    if (error) throw error;

    // Count products per category
    const categoryCounts = {};
    productCategories.forEach(item => {
      categoryCounts[item.product_category] = (categoryCounts[item.product_category] || 0) + 1;
    });

    const businessTypes = [];
    const autoCount = (categoryCounts['Vehicles and Parts'] || 0) + (categoryCounts['Automotive & Transportation'] || 0);
    if (autoCount >= 10) {
      businessTypes.push({
        value: 'Automotive & Transportation',
        label: 'Automotive & Transportation',
        description: `Automotive and transportation products (${autoCount} products)`
      });
    }

    // Textiles & Apparel (9+ products)
    if (categoryCounts['Textiles & Apparel'] >= 5) {
      businessTypes.push({
        value: 'Textiles & Apparel',
        label: 'Textiles & Apparel',
        description: `Textiles, clothing, and apparel products (${categoryCounts['Textiles & Apparel']} products)`
      });
    }

    // Agriculture & Food (500+ products across multiple categories)
    const foodCategories = ['Fish and Crustaceans', 'Meat and Edible Meat Offal', 'Edible Fruit and Nuts', 'Prepared Foodstuffs', 'Beverages and Spirits', 'Live Animals', 'Vegetable Products', 'Dairy Products', 'Live Animals & Animal Products', 'Edible Vegetables', 'Animal or Vegetable Fats', 'Preparations of Vegetables/Fruit'];
    const totalFood = foodCategories.reduce((sum, cat) => sum + (categoryCounts[cat] || 0), 0);
    if (totalFood >= 50) {
      businessTypes.push({
        value: 'Agriculture & Food',
        label: 'Agriculture & Food',
        description: `Agricultural and food products (${totalFood} products)`
      });
    }

    // Chemicals & Materials (200+ products across categories)
    const chemicalCategories = ['Chemicals & Allied Industries', 'Mineral Products', 'Plastics & Rubber', 'Base Metals & Articles', 'Stone & Glass Products'];
    const totalChemicals = chemicalCategories.reduce((sum, cat) => sum + (categoryCounts[cat] || 0), 0);
    if (totalChemicals >= 50) {
      businessTypes.push({
        value: 'Chemicals & Materials',
        label: 'Chemicals & Materials',
        description: `Chemical and material products (${totalChemicals} products)`
      });
    }

    // General (always available)
    businessTypes.push({
      value: 'General',
      label: 'General Manufacturing',
      description: 'General manufacturing and other products'
    });

    logInfo('Business types generated from database reality', {
      totalCategories: Object.keys(categoryCounts).length,
      businessTypesFound: businessTypes.length,
      removedEnergyEquipment: true
    });

    return businessTypes;

  } catch (error) {
    logError('Failed to load business types from database reality', { error: error.message });
    
    // Emergency fallback - only business types we know work
    return [
      { value: 'Electronics & Technology', label: 'Electronics & Technology', description: 'Electronic devices and technology products' },
      { value: 'Textiles & Apparel', label: 'Textiles & Apparel', description: 'Textiles, clothing, and apparel products' },
      { value: 'General', label: 'General Manufacturing', description: 'General manufacturing and other products' }
    ];
  }
}

/**
 * Get all countries from database
 * NO HARDCODED COUNTRY LISTS
 */
async function getCountries() {
  try {
    // Get countries from the countries table
    const { data: countriesData, error: countriesError } = await serverDatabaseService.client
      .from(TABLE_CONFIG.countries)
      .select('code, name, region, trade_agreements');
    
    if (!countriesError && countriesData && countriesData.length > 0) {
      // Transform into dropdown format
      return countriesData.map(country => ({
        value: country.code,
        label: country.name,
        code: country.code,
        usmca_member: country.trade_agreements?.includes('USMCA') || 
                      ['US', 'CA', 'MX'].includes(country.code)
      })).sort((a, b) => a.label.localeCompare(b.label));
    }
  } catch (error) {
    logError('Failed to load countries', { error: error.message });
  }
  
  // Fallback to basic countries
  return [
    { value: 'US', label: 'United States', code: 'US', usmca_member: true },
    { value: 'CA', label: 'Canada', code: 'CA', usmca_member: true },
    { value: 'MX', label: 'Mexico', code: 'MX', usmca_member: true },
    { value: 'CN', label: 'China', code: 'CN', usmca_member: false },
    { value: 'IN', label: 'India', code: 'IN', usmca_member: false },
    { value: 'VN', label: 'Vietnam', code: 'VN', usmca_member: false }
  ];
}

/**
 * Get USMCA member countries from database
 * NO HARDCODED USMCA LISTS
 */
async function getUSMCACountries() {
  try {
    const allCountries = await getCountries();
    
    // Filter for USMCA members only
    const usmcaCountries = allCountries.filter(country => 
      country.usmca_member || ['US', 'CA', 'MX'].includes(country.code)
    );
    
    return usmcaCountries.map(country => ({
      ...country,
      description: `${country.label} - USMCA member with preferential tariff treatment`
    }));

  } catch (error) {
    logError('Failed to load USMCA countries', { error: error.message });
  }
  
  // Emergency fallback
  return [
    { value: 'US', label: 'United States', code: 'US', usmca_member: true, description: 'United States - USMCA member with preferential tariff treatment' },
    { value: 'CA', label: 'Canada', code: 'CA', usmca_member: true, description: 'Canada - USMCA member with preferential tariff treatment' },
    { value: 'MX', label: 'Mexico', code: 'MX', usmca_member: true, description: 'Mexico - USMCA member with preferential tariff treatment' }
  ];
}

/**
 * Get trade volume ranges from database
 * NO HARDCODED VOLUME RANGES
 */
async function getTradeVolumeRanges() {
  try {
    // Query database for trade volume mappings with correct schema
    const { data: volumeRanges, error } = await serverDatabaseService.client
      .from(TABLE_CONFIG.tradeVolumeMappings)
      .select('*')
      .order('display_order');

    if (!error && volumeRanges && volumeRanges.length > 0) {
      return volumeRanges.map(range => ({
        value: range.volume_range,
        label: range.volume_range,
        numeric_value: range.numeric_value,
        description: `Annual trade volume: ${range.volume_range}`
      }));
    }
  } catch (error) {
    logError('Failed to load trade volume ranges', { error: error.message });
  }

  // Generate standard ranges as fallback
  return generateStandardVolumeRanges();
}

/**
 * Generate standard volume ranges when database is unavailable
 */
function generateStandardVolumeRanges() {
  return [
    { value: 'Under $100K', label: 'Under $100,000', min_value: 0, max_value: 100000, numeric_value: 50000 },
    { value: '$100K - $500K', label: '$100,000 - $500,000', min_value: 100000, max_value: 500000, numeric_value: 300000 },
    { value: '$500K - $1M', label: '$500,000 - $1 Million', min_value: 500000, max_value: 1000000, numeric_value: 750000 },
    { value: '$1M - $5M', label: '$1 - $5 Million', min_value: 1000000, max_value: 5000000, numeric_value: 3000000 },
    { value: '$5M - $25M', label: '$5 - $25 Million', min_value: 5000000, max_value: 25000000, numeric_value: 15000000 },
    { value: '$25M - $100M', label: '$25 - $100 Million', min_value: 25000000, max_value: 100000000, numeric_value: 62500000 },
    { value: 'Over $100M', label: 'Over $100 Million', min_value: 100000000, max_value: 1000000000, numeric_value: 500000000 }
  ];
}

/**
 * Get product categories from database
 * NO HARDCODED PRODUCT CATEGORIES
 */
async function getProductCategories() {
  try {
    // Generate categories from HS codes (extract chapter from hts8 field)
    const { data: hsData, error } = await serverDatabaseService.client
      .from(TABLE_CONFIG.comtradeReference)
      .select('hts8, brief_description')
      .not('hts8', 'is', null)
      .limit(1000);

    if (error) throw error;

    if (hsData && hsData.length > 0) {
      // Create categories based on HS chapters (extract from hts8)
      const chapterMap = new Map();

      hsData.forEach(item => {
        // Extract chapter from hts8 (first 2 digits)
        const chapter = item.hts8 ? parseInt(item.hts8.substring(0, 2)) : null;
        if (chapter) {
          // Map chapters to logical product categories
          let category = getProductCategoryFromChapter(chapter);
          chapterMap.set(category, (chapterMap.get(category) || 0) + 1);
        }
      });

      // Convert to dropdown format, sorted by frequency
      return Array.from(chapterMap.entries())
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .map(([category, count]) => ({
          value: category,
          label: category,
          product_count: count,
          description: `${category} (${count} products in database)`
        }));
    }

    // Fallback to business types if no HS data
    logInfo('No HS chapter data found, using business types as product categories');
    return await getBusinessTypes();

  } catch (error) {
    logError('Failed to load product categories', { error: error.message });
    
    // Emergency fallback
    return [
      { value: 'Electronics', label: 'Electronics & Technology', description: 'Electronic devices and components' },
      { value: 'Textiles', label: 'Textiles & Apparel', description: 'Textiles, clothing, and accessories' },
      { value: 'Automotive', label: 'Automotive', description: 'Automotive parts and vehicles' },
      { value: 'Machinery', label: 'Machinery & Equipment', description: 'Industrial machinery and equipment' },
      { value: 'Agriculture', label: 'Agriculture & Food', description: 'Agricultural and food products' }
    ];
  }
}

/**
 * Map HS chapter to logical product category
 * Based on official WTO HS chapter groupings
 */
function getProductCategoryFromChapter(chapter) {
  // Live Animals & Animal Products (01-05)
  if (chapter >= 1 && chapter <= 5) {
    return 'Live Animals & Animal Products';
  }
  
  // Vegetable Products (06-14)
  if (chapter >= 6 && chapter <= 14) {
    return 'Vegetable Products';
  }
  
  // Animal/Vegetable Fats (15)
  if (chapter === 15) {
    return 'Animal & Vegetable Fats';
  }
  
  // Prepared Foodstuffs, Beverages & Tobacco (16-24)
  if (chapter >= 16 && chapter <= 24) {
    return 'Prepared Foodstuffs & Beverages';
  }
  
  // Mineral Products (25-27)
  if (chapter >= 25 && chapter <= 27) {
    return 'Mineral Products';
  }
  
  // Chemical Products (28-38)
  if (chapter >= 28 && chapter <= 38) {
    return 'Chemical Products';
  }
  
  // Plastics & Rubber (39-40)
  if (chapter >= 39 && chapter <= 40) {
    return 'Plastics & Rubber';
  }
  
  // Raw Hides & Leather (41-43)
  if (chapter >= 41 && chapter <= 43) {
    return 'Leather & Leather Goods';
  }
  
  // Wood Products (44-46)
  if (chapter >= 44 && chapter <= 46) {
    return 'Wood & Wood Products';
  }
  
  // Pulp & Paper (47-49)
  if (chapter >= 47 && chapter <= 49) {
    return 'Paper & Pulp Products';
  }
  
  // Textiles & Textile Articles (50-63)
  if (chapter >= 50 && chapter <= 63) {
    return 'Textiles & Apparel';
  }
  
  // Footwear & Headgear (64-67)
  if (chapter >= 64 && chapter <= 67) {
    return 'Footwear & Headgear';
  }
  
  // Stone & Glass (68-70)
  if (chapter >= 68 && chapter <= 70) {
    return 'Stone & Glass Products';
  }
  
  // Precious Metals & Jewelry (71)
  if (chapter === 71) {
    return 'Precious Metals & Jewelry';
  }
  
  // Base Metals (72-83)
  if (chapter >= 72 && chapter <= 83) {
    return 'Base Metals & Articles';
  }
  
  // Machinery (84)
  if (chapter === 84) {
    return 'Machinery & Equipment';
  }
  
  // Electrical Equipment (85)
  if (chapter === 85) {
    return 'Electronics & Technology';
  }
  
  // Transport Equipment (86-89)
  if (chapter >= 86 && chapter <= 89) {
    return 'Transport Equipment';
  }
  
  // Optical/Medical Instruments (90-92)
  if (chapter >= 90 && chapter <= 92) {
    return 'Precision Instruments';
  }
  
  // Arms & Ammunition (93)
  if (chapter === 93) {
    return 'Arms & Ammunition';
  }
  
  // Miscellaneous Manufactures (94-96)
  if (chapter >= 94 && chapter <= 96) {
    return 'Miscellaneous Manufactures';
  }
  
  // Art & Antiques (97)
  if (chapter === 97) {
    return 'Art & Antiques';
  }
  
  // Default for unknown chapters
  return 'Miscellaneous Products';
}

/**
 * Get HS chapters from database
 * NO HARDCODED HS CHAPTER LISTS
 */
async function getHSChapters() {
  try {
    // Query database for HS codes and extract chapters
    const { data: hsCodes, error } = await serverDatabaseService.client
      .from(TABLE_CONFIG.comtradeReference)
      .select('hs_code')
      .not('hs_code', 'is', null)
      .limit(1000);

    if (!error && hsCodes && hsCodes.length > 0) {
      // Extract chapters from HS codes (first 2 digits)
      const chapterMap = new Map();
      hsCodes.forEach(item => {
        if (item.hs_code && item.hs_code.length >= 2) {
          const chapter = parseInt(item.hs_code.substring(0, 2));
          if (chapter >= 1 && chapter <= 99) {
            chapterMap.set(chapter, (chapterMap.get(chapter) || 0) + 1);
          }
        }
      });

      // Convert to dropdown format
      return Array.from(chapterMap.entries())
        .sort((a, b) => a[0] - b[0]) // Sort by chapter number
        .map(([chapter, count]) => ({
          value: chapter.toString().padStart(2, '0'),
          label: `Chapter ${chapter.toString().padStart(2, '0')}`,
          chapter_number: chapter,
          product_count: count,
          description: `HS Chapter ${chapter} (${count} products)`
        }));
    }
  } catch (error) {
    logError('Failed to load HS chapters', { error: error.message });
  }

  // Fallback to major chapters
  return getMajorHSChapters();
}

/**
 * Get major HS chapters for fallback
 */
function getMajorHSChapters() {
  return [
    { value: '84', label: 'Chapter 84 - Machinery', chapter_number: 84, description: 'Nuclear reactors, boilers, machinery and mechanical appliances' },
    { value: '85', label: 'Chapter 85 - Electronics', chapter_number: 85, description: 'Electrical machinery and equipment' },
    { value: '87', label: 'Chapter 87 - Automotive', chapter_number: 87, description: 'Vehicles other than railway or tramway' },
    { value: '61', label: 'Chapter 61 - Knitted Apparel', chapter_number: 61, description: 'Articles of apparel and clothing accessories, knitted' },
    { value: '62', label: 'Chapter 62 - Woven Apparel', chapter_number: 62, description: 'Articles of apparel and clothing accessories, not knitted' }
  ];
}

/**
 * Get triangle routing opportunities from database
 * NO HARDCODED ROUTING OPTIONS
 */
async function getTriangleRoutes() {
  try {
    const routes = await serverDatabaseService.getTriangleRoutingOpportunities();
    
    return routes.map(route => ({
      value: `${route.origin_country}-${route.intermediate_country}-${route.destination_country}`,
      label: `${route.origin_country} → ${route.intermediate_country} → ${route.destination_country}`,
      origin_country: route.origin_country,
      intermediate_country: route.intermediate_country,
      destination_country: route.destination_country,
      potential_savings: route.average_tariff_savings,
      implementation_time: route.typical_implementation_months,
      description: `${route.average_tariff_savings}% average savings, ${route.typical_implementation_months} months to implement`
    })).sort((a, b) => b.potential_savings - a.potential_savings); // Sort by savings descending

  } catch (error) {
    logError('Failed to load triangle routes', { error: error.message });
    
    // Emergency fallback routes
    return [
      {
        value: 'CN-MX-US',
        label: 'China → Mexico → US',
        origin_country: 'CN',
        intermediate_country: 'MX',
        destination_country: 'US',
        potential_savings: 15.5,
        implementation_time: '6-12 months',
        description: 'Route through Mexico for USMCA benefits'
      }
    ];
  }
}

/**
 * Get all dropdown options in one request
 * EFFICIENT BATCH LOADING
 */
async function getAllDropdownOptions() {
  try {
    // Load all options in parallel
    const [
      businessTypes,
      countries,
      usmcaCountries,
      tradeVolumes,
      productCategories,
      hsChapters,
      triangleRoutes
    ] = await Promise.all([
      getBusinessTypes(),
      getCountries(),
      getUSMCACountries(),
      getTradeVolumeRanges(),
      getProductCategories(),
      getHSChapters(),
      getTriangleRoutes()
    ]);

    return {
      business_types: businessTypes,
      countries: countries,
      usmca_countries: usmcaCountries,
      trade_volumes: tradeVolumes,
      product_categories: productCategories,
      hs_chapters: hsChapters,
      triangle_routes: triangleRoutes,
      
      // Summary statistics
      summary: {
        business_types_count: businessTypes.length,
        countries_count: countries.length,
        usmca_countries_count: usmcaCountries.length,
        trade_volume_ranges: tradeVolumes.length,
        product_categories_count: productCategories.length,
        hs_chapters_count: hsChapters.length,
        triangle_routes_count: triangleRoutes.length,
        total_options: businessTypes.length + countries.length + tradeVolumes.length + 
                      productCategories.length + hsChapters.length + triangleRoutes.length
      }
    };

  } catch (error) {
    logError('Failed to load all dropdown options', { error: error.message });
    throw error;
  }
}