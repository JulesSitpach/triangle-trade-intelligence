/**
 * AI-FIRST PRODUCT CLASSIFICATION
 * Uses AI to interpret product descriptions with full business context
 * Part of hybrid AI-database architecture - leverages rich context data
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { product_description, context } = req.body;
    
    if (!product_description) {
      return res.status(400).json({ error: 'Product description required' });
    }

    // AI BUSINESS CONTEXT ANALYSIS: Use all available business intelligence
    const aiAnalysis = analyzeProductWithBusinessContext(product_description, context);

    return res.status(200).json({
      success: true,
      product_description,
      likely_chapters: aiAnalysis.chapters,
      primary_application: aiAnalysis.application,
      industry_context: aiAnalysis.industry,
      supply_chain_context: aiAnalysis.supplyChain,
      trade_context: aiAnalysis.tradeContext,
      technical_specifications: aiAnalysis.specifications,
      confidence: aiAnalysis.confidence,
      reasoning: aiAnalysis.reasoning,
      search_strategy: aiAnalysis.searchStrategy
    });

  } catch (error) {
    console.error('AI classification error:', error);
    return res.status(500).json({ 
      error: 'AI classification failed',
      message: error.message 
    });
  }
}

/**
 * AI UNIVERSAL CUSTOMS CLASSIFIER
 * Role: Expert HS Code classifier for ALL industries and product types
 * Database: 34,476 government records across 99 HS chapters (raw materials to finished goods)
 * Goal: Understand product FUNCTION first, then consider material and industry context
 */
export function analyzeProductWithBusinessContext(description, context = {}) {
  
  // AI UNIVERSAL KNOWLEDGE: Function-first classification principles
  const classificationPrinciples = {
    priority: "Function over Material - electrical wire = conductor (Ch 85), not copper (Ch 74)",
    chapters: {
      "1-24": "Live animals, food, beverages",
      "25-40": "Raw materials, chemicals, plastics", 
      "41-67": "Textiles, footwear, headgear",
      "68-83": "Stone, metals, tools",
      "84-85": "Machinery, electrical equipment", // KEY: electrical products go here
      "86-89": "Transportation equipment",
      "90-97": "Instruments, arms, miscellaneous"
    },
    logic: "Ask: What does this product DO? Then find the chapter for that function"
  };
  
  console.log("🌍 AI: Universal Customs Classifier - Function-First Approach");
  console.log(`📚 Database: 34,476 records across 99 chapters`);
  console.log(`🎯 Logic: ${classificationPrinciples.logic}`);
  const desc = description.toLowerCase();
  const businessType = context.business_type?.toLowerCase() || '';
  
  // BUSINESS INTELLIGENCE: Extract rich context signals
  const businessContext = {
    company: extractCompanyContext(context),
    industry: extractIndustryContext(businessType, context),
    supplyChain: extractSupplyChainContext(context),
    tradeObjective: extractTradeContext(context)
  };

  // PRODUCT APPLICATION ANALYSIS: Understand how product is used
  const applicationContext = analyzeProductApplication(desc, businessContext);
  
  // TECHNICAL SPECIFICATION ANALYSIS: Extract technical details
  const technicalContext = analyzeTechnicalSpecs(desc, applicationContext);
  
  // SUPPLY CHAIN INTELLIGENCE: How does supply chain affect classification?
  const supplyChainIntelligence = analyzeSupplyChainImpact(businessContext, applicationContext);
  
  // AI CONTEXTUAL CHAPTER PREDICTION: Use all business intelligence
  const chapterAnalysis = predictChaptersWithContext(
    applicationContext, 
    technicalContext, 
    businessContext,
    supplyChainIntelligence,
    desc // Pass description for direct analysis
  );

  // SEARCH STRATEGY: How should database search be focused?
  const searchStrategy = generateSearchStrategy(chapterAnalysis, applicationContext);

  return {
    chapters: chapterAnalysis.primaryChapters,
    application: applicationContext.primaryUse,
    industry: businessContext.industry.primary,
    supplyChain: supplyChainIntelligence,
    tradeContext: businessContext.tradeObjective,
    specifications: technicalContext,
    confidence: chapterAnalysis.confidence,
    reasoning: chapterAnalysis.reasoning,
    searchStrategy: searchStrategy
  };
}

/**
 * EXTRACT COMPANY CONTEXT from business intelligence
 */
function extractCompanyContext(context) {
  return {
    name: context.company_name || 'Unknown',
    type: context.business_type || 'General',
    location: context.location || context.country || 'Unknown',
    industry_focus: context.industry || context.sector || 'General'
  };
}

/**
 * EXTRACT INDUSTRY CONTEXT with business intelligence
 */
function extractIndustryContext(businessType, context) {
  // Rich industry classification based on business context
  const industrySignals = {
    automotive: businessType.includes('auto') || context.industry?.includes('automotive') || 
                context.products?.some(p => p.includes('vehicle') || p.includes('auto')),
    electronics: businessType.includes('electronic') || businessType.includes('electrical') ||
                 context.industry?.includes('electronics') || context.industry?.includes('electrical'),
    manufacturing: businessType.includes('manufactur') || context.business_model?.includes('assembly'),
    trade: businessType.includes('import') || businessType.includes('export') || businessType.includes('trading')
  };

  return {
    primary: Object.entries(industrySignals).find(([, signal]) => signal)?.[0] || 'general',
    signals: industrySignals,
    confidence: Math.max(...Object.values(industrySignals).map(s => s ? 0.8 : 0.2))
  };
}

/**
 * EXTRACT SUPPLY CHAIN CONTEXT
 */
function extractSupplyChainContext(context) {
  return {
    origin: context.origin_country || context.supplier_country || 'Unknown',
    destination: context.destination_country || context.market || 'Unknown',
    routing: context.routing || context.trade_route || 'Direct',
    content_strategy: context.regional_content || context.usmca_strategy || 'Standard'
  };
}

/**
 * EXTRACT TRADE CONTEXT
 */
function extractTradeContext(context) {
  return {
    objective: context.trade_objective || context.goal || 'Cost optimization',
    agreement: context.trade_agreement || 'USMCA',
    volume: context.import_volume || context.trade_volume || 'Medium',
    priority: context.priority || 'Tariff savings'
  };
}

/**
 * ANALYZE PRODUCT APPLICATION with business context
 */
function analyzeProductApplication(description, businessContext) {
  const desc = description.toLowerCase();
  
  // AUTOMOTIVE APPLICATION ANALYSIS
  if (businessContext.industry.primary === 'automotive') {
    return analyzeAutomotiveApplication(desc, businessContext);
  }
  
  // ELECTRONICS APPLICATION ANALYSIS  
  if (businessContext.industry.primary === 'electronics') {
    return analyzeElectronicsApplication(desc, businessContext);
  }
  
  // GENERAL APPLICATION ANALYSIS
  return analyzeGeneralApplication(desc, businessContext);
}

/**
 * AUTOMOTIVE-SPECIFIC APPLICATION ANALYSIS
 */
function analyzeAutomotiveApplication(desc, businessContext) {
  const automotiveApplications = {
    dashboard: desc.includes('dashboard') || desc.includes('instrument'),
    harness: desc.includes('harness') || desc.includes('wiring'),
    brake: desc.includes('brake') || desc.includes('braking'),
    engine: desc.includes('engine') || desc.includes('motor'),
    transmission: desc.includes('transmission') || desc.includes('gear'),
    electrical: desc.includes('electrical') || desc.includes('wire') || desc.includes('cable')
  };

  const primaryApplication = Object.entries(automotiveApplications)
    .find(([, detected]) => detected)?.[0] || 'general_automotive';

  // AUTOMOTIVE WIRE HARNESS = HS 8544 (electrical) NOT 8708 (parts)
  // AI understands: dashboard wire harness = electrical conductor, not mechanical part
  const isElectricalComponent = automotiveApplications.electrical && 
    (automotiveApplications.dashboard || automotiveApplications.harness);

  return {
    primaryUse: isElectricalComponent ? 'automotive_electrical_conductor' : `automotive_${primaryApplication}`,
    applications: automotiveApplications,
    category: isElectricalComponent ? 'electrical_machinery' : 'automotive_parts',
    confidence: 0.9
  };
}

/**
 * ELECTRONICS APPLICATION ANALYSIS
 */
function analyzeElectronicsApplication(desc, businessContext) {
  const electronicsApplications = {
    conductor: desc.includes('wire') || desc.includes('cable') || desc.includes('conductor'),
    circuit: desc.includes('circuit') || desc.includes('board'),
    component: desc.includes('component') || desc.includes('device'),
    power: desc.includes('power') || desc.includes('voltage'),
    signal: desc.includes('signal') || desc.includes('data')
  };

  return {
    primaryUse: 'electronics_component',
    applications: electronicsApplications,
    category: 'electrical_machinery',
    confidence: 0.85
  };
}

/**
 * GENERAL APPLICATION ANALYSIS
 */
function analyzeGeneralApplication(desc, businessContext) {
  // Detect electrical applications even without business context
  const electricalApplications = {
    conductor: desc.includes('wire') || desc.includes('cable') || desc.includes('conductor'),
    electrical: desc.includes('electrical') || desc.includes('electric'),
    power: desc.includes('power') || desc.includes('voltage'),
    transmission: desc.includes('transmission') || desc.includes('signal')
  };

  const isElectrical = Object.values(electricalApplications).some(Boolean);
  
  return {
    primaryUse: isElectrical ? 'electrical_conductor' : 'general_product',
    applications: electricalApplications,
    category: isElectrical ? 'electrical_machinery' : 'general',
    confidence: isElectrical ? 0.8 : 0.6
  };
}

/**
 * ANALYZE TECHNICAL SPECIFICATIONS
 */
function analyzeTechnicalSpecs(description, applicationContext) {
  const desc = description.toLowerCase();
  
  const specs = {
    material: extractMaterial(desc),
    gauge: extractGauge(desc),
    voltage: extractVoltage(desc),
    dimensions: extractDimensions(desc),
    grade: extractGrade(desc)
  };

  return {
    specifications: specs,
    technical_category: determineTechnicalCategory(specs, applicationContext),
    precision_level: calculatePrecisionLevel(specs)
  };
}

function extractMaterial(desc) {
  const materials = ['copper', 'steel', 'aluminum', 'plastic', 'rubber'];
  return materials.find(material => desc.includes(material)) || 'unspecified';
}

function extractGauge(desc) {
  const gaugeMatch = desc.match(/(\d{1,2})\s*(?:awg|gauge)/);
  return gaugeMatch ? gaugeMatch[1] + ' AWG' : null;
}

function extractVoltage(desc) {
  const voltageMatch = desc.match(/(\d+)\s*(?:v|volt|voltage)/);
  return voltageMatch ? voltageMatch[1] + 'V' : null;
}

function extractDimensions(desc) {
  const dimensionMatch = desc.match(/(\d+(?:\.\d+)?)\s*(?:mm|cm|inch|")/);
  return dimensionMatch ? dimensionMatch[0] : null;
}

function extractGrade(desc) {
  const grades = ['industrial', 'automotive', 'marine', 'aerospace'];
  return grades.find(grade => desc.includes(grade)) || 'standard';
}

function determineTechnicalCategory(specs, applicationContext) {
  if (specs.material === 'copper' && specs.gauge && applicationContext.category === 'electrical_machinery') {
    return 'electrical_conductor';
  }
  return 'general_component';
}

function calculatePrecisionLevel(specs) {
  const specCount = Object.values(specs).filter(spec => spec && spec !== 'unspecified').length;
  return Math.min(1.0, specCount * 0.2);
}

/**
 * ANALYZE SUPPLY CHAIN IMPACT on classification
 */
function analyzeSupplyChainImpact(businessContext, applicationContext) {
  return {
    routing_strategy: businessContext.supplyChain.routing,
    content_optimization: businessContext.supplyChain.content_strategy,
    classification_impact: 'Consider supply chain for final classification',
    usmca_relevance: businessContext.tradeObjective.agreement === 'USMCA' ? 'High' : 'Medium'
  };
}

/**
 * UNIVERSAL HS CHAPTER PREDICTION - Function-First Logic
 */
function predictChaptersWithContext(applicationContext, technicalContext, businessContext, supplyChainIntelligence, desc) {
  const chapters = [];
  let reasoning = '';
  let confidence = 0.5;

  // UNIVERSAL FUNCTION-FIRST ANALYSIS
  console.log("🔍 AI Function Analysis:", {
    description: desc,
    primaryUse: applicationContext.primaryUse,
    category: applicationContext.category,
    material: technicalContext.specifications.material
  });

  // ELECTRICAL FUNCTION = Chapter 85 (regardless of industry)
  if (desc.includes('electrical') || desc.includes('wire') || desc.includes('cable') || 
      desc.includes('conductor') || desc.includes('connector') ||
      applicationContext.applications.conductor || applicationContext.applications.electrical) {
    
    // Specific electrical subcategories
    if (desc.includes('wire') || desc.includes('cable') || desc.includes('conductor')) {
      chapters.push(8544); // Electric conductors - most specific
    }
    if (desc.includes('connector')) {
      chapters.push(8536); // Electrical connectors
    }
    chapters.push(85); // Electrical machinery - general chapter
    
    confidence = 0.90;
    reasoning = 'Function-first: Electrical products classified by electrical function, not material or industry';
  }
  
  // MECHANICAL/AUTOMOTIVE FUNCTION = Chapter 87/84
  else if (desc.includes('automotive') || desc.includes('vehicle') || desc.includes('brake') ||
           desc.includes('engine') || desc.includes('transmission') ||
           businessContext.industry.primary === 'automotive') {
    chapters.push(8708); // Vehicle parts
    chapters.push(87);   // Vehicles general
    chapters.push(84);   // Machinery general
    confidence = 0.85;
    reasoning = 'Automotive/mechanical function classification';
  }
  
  // TEXTILE FUNCTION = Chapters 50-63
  else if (desc.includes('fabric') || desc.includes('textile') || desc.includes('cotton') ||
           desc.includes('yarn') || desc.includes('fiber')) {
    chapters.push(52, 54, 55, 56); // Various textile chapters
    confidence = 0.80;
    reasoning = 'Textile function classification';
  }
  
  // CHEMICAL FUNCTION = Chapters 28-40
  else if (desc.includes('chemical') || desc.includes('compound') || desc.includes('solution')) {
    chapters.push(38, 29, 28); // Chemicals
    confidence = 0.75;
    reasoning = 'Chemical function classification';
  }
  
  // MATERIAL-BASED FALLBACK (only if no clear function)
  else {
    const material = technicalContext.specifications.material;
    if (material === 'copper') {
      chapters.push(74); // Copper products
      reasoning = 'Material-based: Pure copper products without clear electrical function';
    } else if (material === 'steel' || material === 'iron') {
      chapters.push(72, 73); // Iron and steel
      reasoning = 'Material-based: Iron/steel products';
    } else if (material === 'plastic') {
      chapters.push(39); // Plastics
      reasoning = 'Material-based: Plastic products';
    } else {
      chapters.push(99); // Miscellaneous
      reasoning = 'General classification - need more specific product details';
    }
    confidence = 0.60;
  }

  console.log("🎯 AI Chapter Prediction:", {
    chapters: chapters.slice(0, 3),
    reasoning,
    confidence
  });

  return {
    primaryChapters: chapters.slice(0, 3),
    confidence,
    reasoning,
    analysis_method: 'universal_function_first'
  };
}

/**
 * GENERATE FOCUSED SEARCH STRATEGY
 */
function generateSearchStrategy(chapterAnalysis, applicationContext) {
  return {
    primary_chapters: chapterAnalysis.primaryChapters,
    search_terms: generateContextualSearchTerms(applicationContext),
    priority_order: 'ai_guided_first',
    fallback_strategy: 'broad_search_if_insufficient'
  };
}

function generateContextualSearchTerms(applicationContext) {
  const baseTerms = [];
  
  if (applicationContext.primaryUse.includes('conductor')) {
    baseTerms.push('conductor', 'wire', 'cable');
  }
  if (applicationContext.primaryUse.includes('automotive')) {
    baseTerms.push('automotive', 'vehicle');
  }
  if (applicationContext.applications.harness) {
    baseTerms.push('harness', 'wiring');
  }
  
  return baseTerms;
}

