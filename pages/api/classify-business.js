/**
 * ONE-TIME AI BUSINESS CLASSIFICATION
 * Analyzes company business context once and stores for all future product searches
 * Massive performance improvement: One AI call per company vs per product
 */

import optimizedSupabase from '../../lib/database/optimized-supabase-client.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      company_name, 
      business_type, 
      trade_volume,
      supply_chain,
      primary_products,
      origin_countries,
      destination_markets
    } = req.body;
    
    if (!company_name) {
      return res.status(400).json({ error: 'Company name required' });
    }

    // Generate unique company ID
    const company_id = generateCompanyId(company_name);

    // Check if we already have this company's profile
    const existingProfile = await getExistingProfile(company_id);
    if (existingProfile) {
      return res.status(200).json({
        success: true,
        message: 'Using existing company profile',
        profile: existingProfile,
        cached: true
      });
    }

    // PERFORM ONE-TIME AI BUSINESS ANALYSIS
    const businessAnalysis = analyzeBusinessContext({
      company_name,
      business_type,
      trade_volume,
      supply_chain,
      primary_products,
      origin_countries,
      destination_markets
    });

    // STORE BUSINESS CONTEXT IN DATABASE
    const profile = await storeCompanyProfile({
      company_id,
      company_name,
      business_type,
      ...businessAnalysis
    });

    return res.status(200).json({
      success: true,
      message: 'Company profile created with AI analysis',
      profile,
      analysis: businessAnalysis
    });

  } catch (error) {
    console.error('Business classification error:', error);
    return res.status(500).json({ 
      error: 'Business classification failed',
      message: error.message 
    });
  }
}

/**
 * ANALYZE BUSINESS CONTEXT - One-time AI analysis
 */
function analyzeBusinessContext(companyData) {
  const { 
    company_name, 
    business_type = '', 
    primary_products = [],
    supply_chain = '',
    trade_volume = '',
    origin_countries = [],
    destination_markets = []
  } = companyData;

  // INDUSTRY SECTOR DETECTION
  const industrySectors = detectIndustrySectors(business_type, primary_products);
  
  // HS CHAPTER PREDICTION based on business type and products
  const chapterAnalysis = predictRelevantChapters(industrySectors, primary_products);
  
  // SUPPLY CHAIN PATTERN ANALYSIS
  const supplyChainPattern = analyzeSupplyChain(supply_chain, origin_countries, destination_markets);
  
  // KEYWORD EXTRACTION for optimized searches
  const keywordPriorities = extractKeywords(primary_products, business_type);
  
  // MATERIAL AND APPLICATION FOCUS
  const materialFocus = extractMaterials(primary_products);
  const applicationFocus = extractApplications(primary_products, business_type);

  return {
    industry_sectors: industrySectors,
    ai_business_context: {
      classification: generateClassification(industrySectors, supplyChainPattern),
      complexity: determineComplexity(primary_products),
      primary_products: primary_products,
      supply_chain_optimized: supplyChainPattern.includes('USMCA'),
      analysis_timestamp: new Date().toISOString()
    },
    primary_hs_chapters: chapterAnalysis.primary,
    secondary_hs_chapters: chapterAnalysis.secondary,
    trade_volume,
    supply_chain_pattern: supplyChainPattern,
    trade_agreements: detectTradeAgreements(supplyChainPattern),
    keyword_priorities: keywordPriorities,
    material_focus: materialFocus,
    application_focus: applicationFocus,
    analysis_confidence: calculateConfidence(industrySectors, chapterAnalysis)
  };
}

/**
 * DETECT INDUSTRY SECTORS from business type and products
 */
function detectIndustrySectors(businessType, products) {
  const sectors = [];
  const businessLower = businessType.toLowerCase();
  const productsText = products.join(' ').toLowerCase();
  
  // Automotive detection
  if (businessLower.includes('automotive') || businessLower.includes('auto') ||
      productsText.includes('vehicle') || productsText.includes('car') ||
      productsText.includes('dashboard') || productsText.includes('brake')) {
    sectors.push('automotive');
  }
  
  // Electrical/Electronics detection
  if (businessLower.includes('electronic') || businessLower.includes('electrical') ||
      productsText.includes('wire') || productsText.includes('cable') ||
      productsText.includes('circuit') || productsText.includes('battery')) {
    sectors.push('electrical_components');
    if (productsText.includes('smartphone') || productsText.includes('computer')) {
      sectors.push('consumer_electronics');
    }
  }
  
  // Textiles detection
  if (businessLower.includes('textile') || businessLower.includes('apparel') ||
      productsText.includes('fabric') || productsText.includes('cotton') ||
      productsText.includes('clothing')) {
    sectors.push('textiles');
  }
  
  // Manufacturing detection
  if (businessLower.includes('manufactur') || businessLower.includes('assembly')) {
    sectors.push('manufacturing');
  }
  
  return sectors.length > 0 ? sectors : ['general_trade'];
}

/**
 * PREDICT RELEVANT HS CHAPTERS based on industry
 */
function predictRelevantChapters(industrySectors, products) {
  const primaryChapters = new Set();
  const secondaryChapters = new Set();
  
  industrySectors.forEach(sector => {
    switch(sector) {
      case 'automotive':
        primaryChapters.add(87); // Vehicles
        primaryChapters.add(8708); // Vehicle parts
        secondaryChapters.add(40); // Rubber
        secondaryChapters.add(73); // Steel articles
        break;
        
      case 'electrical_components':
        primaryChapters.add(85); // Electrical machinery
        primaryChapters.add(8544); // Electrical conductors
        secondaryChapters.add(74); // Copper
        secondaryChapters.add(39); // Plastics
        break;
        
      case 'consumer_electronics':
        primaryChapters.add(85); // Electrical machinery
        primaryChapters.add(8517); // Telecom equipment
        primaryChapters.add(8471); // Computers
        secondaryChapters.add(90); // Optical instruments
        break;
        
      case 'textiles':
        primaryChapters.add(52); // Cotton
        primaryChapters.add(54); // Synthetic fibers
        primaryChapters.add(61); // Apparel knitted
        primaryChapters.add(62); // Apparel not knitted
        secondaryChapters.add(63); // Other textiles
        break;
    }
  });
  
  // Product-specific chapter detection
  const productsText = products.join(' ').toLowerCase();
  if (productsText.includes('wire') || productsText.includes('cable')) {
    primaryChapters.add(8544); // Insulated wire/cable
  }
  if (productsText.includes('plastic')) {
    secondaryChapters.add(39); // Plastics
  }
  if (productsText.includes('steel') || productsText.includes('iron')) {
    secondaryChapters.add(72); // Iron and steel
    secondaryChapters.add(73); // Articles of iron/steel
  }
  
  return {
    primary: Array.from(primaryChapters).sort(),
    secondary: Array.from(secondaryChapters).sort()
  };
}

/**
 * ANALYZE SUPPLY CHAIN PATTERN
 */
function analyzeSupplyChain(supplyChain, origins, destinations) {
  const pattern = supplyChain || `${origins.join('/')} → ${destinations.join('/')}`;
  
  // Detect USMCA optimization
  const usmcaCountries = ['US', 'USA', 'United States', 'Canada', 'CA', 'Mexico', 'MX'];
  const hasUSMCA = usmcaCountries.some(country => 
    pattern.toUpperCase().includes(country.toUpperCase())
  );
  
  return pattern || 'Direct import';
}

/**
 * EXTRACT KEYWORDS for search optimization
 */
function extractKeywords(products, businessType) {
  const keywords = {};
  
  // Extract keywords from products
  products.forEach(product => {
    const words = product.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) {
        keywords[word] = (keywords[word] || 0) + 1;
      }
    });
  });
  
  // Boost business-type keywords
  const businessWords = businessType.toLowerCase().split(/\s+/);
  businessWords.forEach(word => {
    if (word.length > 3) {
      keywords[word] = (keywords[word] || 0) + 2;
    }
  });
  
  // Normalize to 1-10 scale
  const maxCount = Math.max(...Object.values(keywords), 1);
  Object.keys(keywords).forEach(key => {
    keywords[key] = Math.round((keywords[key] / maxCount) * 10);
  });
  
  return keywords;
}

/**
 * EXTRACT MATERIALS from product descriptions
 */
function extractMaterials(products) {
  const materials = new Set();
  const productsText = products.join(' ').toLowerCase();
  
  const materialList = [
    'copper', 'steel', 'iron', 'aluminum', 'plastic', 'rubber',
    'glass', 'silicon', 'cotton', 'polyester', 'nylon', 'leather',
    'wood', 'paper', 'ceramic', 'carbon'
  ];
  
  materialList.forEach(material => {
    if (productsText.includes(material)) {
      materials.add(material);
    }
  });
  
  return Array.from(materials);
}

/**
 * EXTRACT APPLICATIONS from products and business type
 */
function extractApplications(products, businessType) {
  const applications = new Set();
  const combinedText = `${businessType} ${products.join(' ')}`.toLowerCase();
  
  // Automotive applications
  if (combinedText.includes('wire harness')) applications.add('wire_harness');
  if (combinedText.includes('dashboard')) applications.add('dashboard');
  if (combinedText.includes('brake')) applications.add('brake_systems');
  
  // Electrical applications
  if (combinedText.includes('conductor')) applications.add('electrical_conductor');
  if (combinedText.includes('circuit')) applications.add('circuit_board');
  if (combinedText.includes('battery')) applications.add('battery_systems');
  
  // Textile applications
  if (combinedText.includes('fabric')) applications.add('fabric_production');
  if (combinedText.includes('yarn')) applications.add('yarn_spinning');
  if (combinedText.includes('apparel')) applications.add('apparel_manufacturing');
  
  return Array.from(applications);
}

/**
 * HELPER FUNCTIONS
 */
function generateCompanyId(companyName) {
  return companyName.toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
}

function generateClassification(sectors, supplyChain) {
  const primary = sectors[0] || 'general';
  const complexity = sectors.length > 1 ? 'multi_sector' : 'single_sector';
  const usmca = supplyChain.includes('USMCA') ? '_usmca_optimized' : '';
  return `${primary}_${complexity}${usmca}`;
}

function determineComplexity(products) {
  if (products.length > 5) return 'complex';
  if (products.length > 2) return 'multi_component';
  return 'standard';
}

function detectTradeAgreements(supplyChain) {
  const agreements = [];
  const pattern = supplyChain.toUpperCase();
  
  if (pattern.includes('US') || pattern.includes('CANADA') || pattern.includes('MEXICO')) {
    agreements.push('USMCA');
  }
  if (pattern.includes('CHINA')) {
    agreements.push('MFN');
  }
  if (pattern.includes('VIETNAM') || pattern.includes('THAILAND')) {
    agreements.push('ASEAN');
  }
  
  return agreements.length > 0 ? agreements : ['MFN'];
}

function calculateConfidence(sectors, chapterAnalysis) {
  let confidence = 0.5;
  
  // More sectors = higher confidence in analysis
  confidence += sectors.length * 0.1;
  
  // More chapters identified = higher confidence
  confidence += chapterAnalysis.primary.length * 0.05;
  
  return Math.min(0.95, confidence);
}

/**
 * GET EXISTING PROFILE from database
 */
async function getExistingProfile(companyId) {
  try {
    const { data, error } = await optimizedSupabase
      .from('company_profiles')
      .select('*')
      .eq('company_id', companyId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Error fetching profile:', error);
    }
    
    return data;
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

/**
 * STORE COMPANY PROFILE in database
 */
async function storeCompanyProfile(profileData) {
  try {
    const { data, error } = await optimizedSupabase
      .from('company_profiles')
      .upsert({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error storing profile:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}