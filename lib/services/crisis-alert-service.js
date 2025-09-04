/**
 * CRISIS ALERT SERVICE
 * Integrates RSS monitoring with Crisis Calculator for personalized alerts
 * Triggers financial impact calculations when government feeds detect crisis scenarios
 */

import { crisisCalculatorService } from './crisis-calculator-service.js';
import { serverDatabaseService } from '../database/supabase-client.js';
import { logInfo, logError, logPerformance } from '../utils/production-logger.js';

export class CrisisAlertService {
  constructor() {
    this.db = serverDatabaseService;
    this.crisisCalculator = crisisCalculatorService;
    this.alertQueue = new Map();
    
    // Enhanced crisis trigger keywords by severity - Multi-language USMCA Triangle
    this.crisisTriggers = {
      CRITICAL: [
        // 🇺🇸 US - Trump-style Section 301 tariffs (CRITICAL threats)
        'section 301', 'section301', 'trade war', 'tariff increase', 
        'usmca withdrawal', 'usmca termination', 'nafta termination',
        'emergency tariff', 'retaliatory tariff', 'border tax',
        'china tariffs', 'trump tariffs', 'biden tariffs',
        'national security tariff', '232 investigation',
        
        // 🇲🇽 Mexico - Spanish CRITICAL triggers
        'aumento de arancel', 'terminación tmec', 'guerra comercial',
        'aranceles de emergencia', 'suspensión comercial',
        'investigación sección 301', 'terminación del tlcan',
        
        // 🇨🇦 Canada - French CRITICAL triggers  
        'augmentation tarifaire', 'guerre commerciale', 'terminaison aléna',
        'tarifs d\'urgence', 'suspension commerciale',
        
        // Multi-national CRITICAL patterns
        'immediate implementation', 'effective immediately',
        'emergency measure', 'provisional measure',
        'suspension of benefits', 'withdrawal from agreement'
      ],
      HIGH: [
        // Investigations & formal trade actions
        'antidumping investigation', 'countervailing duty', 'trade dispute',
        'renegotiation', 'safeguard measure', 'quota restriction',
        'sunset review', 'circumvention inquiry', 'scope inquiry',
        'changed circumstances review', 'administrative review',
        
        // Spanish HIGH triggers
        'investigación antidumping', 'renegociación', 'medida de salvaguardia',
        'derechos compensatorios', 'disputa comercial', 'revisión administrativa',
        'investigación de elusión', 'medida provisional',
        
        // French HIGH triggers
        'enquête antidumping', 'droits compensateurs', 'différend commercial',
        'renégociation', 'mesure de sauvegarde', 'restriction de quota',
        
        // Regulatory changes with economic impact
        'rate modification', 'duty adjustment', 'preferential rate removal',
        'origin requirement change', 'documentation requirement',
        'certificate suspension'
      ],
      MEDIUM: [
        // Administrative & procedural changes
        'classification change', 'rule modification', 'procedure update',
        'administrative notice', 'clarification', 'guidance update',
        'form revision', 'reporting requirement',
        
        // Spanish MEDIUM triggers
        'cambio de clasificación', 'modificación de regla', 'actualización de procedimiento',
        'aviso administrativo', 'aclaración', 'revisión de formulario',
        
        // French MEDIUM triggers
        'changement de classification', 'modification de règle', 'mise à jour procédure',
        'avis administratif', 'clarification', 'révision de formulaire',
        
        // Technical updates
        'technical correction', 'clerical error correction',
        'schedule update', 'rate schedule adjustment'
      ]
    };

    // Enhanced HS Code categories for targeted alerts - Comprehensive USMCA coverage
    this.hsCategories = {
      electronics: {
        hsCodes: ['8517', '8542', '8471', '8473', '8504', '9013', '8534', '8528', '8543'],
        keywords: ['electronics', 'smartphones', 'computers', 'semiconductors', 'iot devices', 
                  'circuit boards', 'cell phones', 'tablets', 'smart devices', 'wireless',
                  'electrónicos', 'teléfonos inteligentes', 'computadoras', 'semiconductores',
                  'électronique', 'téléphones intelligents', 'ordinateurs', 'semi-conducteurs'],
        crisisImpact: 'HIGH' // Electronics often targeted in trade wars
      },
      automotive: {
        hsCodes: ['8703', '8708', '8711', '8544', '4016', '8706', '8707', '8714'],
        keywords: ['automotive', 'cars', 'vehicles', 'auto parts', 'wire harnesses', 
                  'motor vehicles', 'automobile', 'truck', 'motorcycle',
                  'automotriz', 'autos', 'vehículos', 'partes auto', 'arneses',
                  'automobile', 'voitures', 'véhicules', 'pièces auto', 'faisceaux'],
        crisisImpact: 'CRITICAL' // Major trade dependency
      },
      textiles: {
        hsCodes: ['6109', '6110', '6204', '6203', '5208', '5407', '6205', '6206', '5801'],
        keywords: ['textiles', 'apparel', 'clothing', 'fabric', 'garments', 'cotton',
                  'shirts', 'pants', 'dresses', 'suits', 't-shirts',
                  'textiles', 'ropa', 'prendas', 'tela', 'algodón', 'camisas',
                  'textiles', 'vêtements', 'habits', 'tissu', 'coton', 'chemises'],
        crisisImpact: 'HIGH'
      },
      agriculture: {
        hsCodes: ['0201', '0203', '0406', '0409', '1001', '1005', '0402', '1701', '2008'],
        keywords: ['agriculture', 'food', 'agricultural products', 'dairy', 'meat',
                  'beef', 'pork', 'cheese', 'milk', 'wheat', 'corn', 'soybeans',
                  'agricultura', 'alimentos', 'productos agrícolas', 'lácteos', 'carne',
                  'agriculture', 'alimentation', 'produits agricoles', 'laitier', 'viande'],
        crisisImpact: 'CRITICAL' // Food security implications
      },
      machinery: {
        hsCodes: ['8421', '8422', '8424', '8443', '8477', '8479', '8418', '8419', '8426'],
        keywords: ['machinery', 'industrial equipment', 'manufacturing equipment',
                  'pumps', 'printing machines', 'packaging equipment', 'plastic machinery',
                  'maquinaria', 'equipo industrial', 'equipo manufacturero',
                  'machinerie', 'équipement industriel', 'équipement de fabrication'],
        crisisImpact: 'HIGH'
      },
      wood_products: {
        hsCodes: ['4407', '4409', '4412', '4418', '4421', '4403', '4408', '4410'],
        keywords: ['wood products', 'lumber', 'plywood', 'engineered wood', 'timber',
                  'hardwood', 'softwood', 'wood panels', 'wood flooring',
                  'productos de madera', 'madera', 'contrachapado', 'madera diseñada',
                  'produits du bois', 'bois d\'œuvre', 'contreplaqué', 'bois d\'ingénierie'],
        crisisImpact: 'MEDIUM'
      },
      energy: {
        hsCodes: ['2709', '2710', '2711', '8401', '8402', '8406', '8501', '8502'],
        keywords: ['energy', 'oil', 'gas', 'petroleum', 'solar panels', 'wind turbines',
                  'generators', 'transformers', 'energy equipment',
                  'energía', 'petróleo', 'gas', 'paneles solares', 'turbinas',
                  'énergie', 'pétrole', 'gaz', 'panneaux solaires', 'turbines'],
        crisisImpact: 'CRITICAL'
      },
      chemicals: {
        hsCodes: ['2902', '2903', '2916', '2917', '3901', '3902', '3903', '3907'],
        keywords: ['chemicals', 'petrochemicals', 'plastics', 'polymers', 'resins',
                  'chemical products', 'industrial chemicals',
                  'químicos', 'petroquímicos', 'plásticos', 'polímeros',
                  'produits chimiques', 'pétrochimiques', 'plastiques', 'polymères'],
        crisisImpact: 'HIGH'
      }
    };
  }

  /**
   * Process RSS feed item and trigger crisis alerts if needed
   */
  async processRSSItem(feedSource, item) {
    const startTime = Date.now();

    try {
      logInfo('Processing RSS item for crisis detection', {
        source: feedSource,
        title: item.title?.substring(0, 100),
        pubDate: item.pubDate
      });

      // Analyze content for crisis keywords
      const crisisAnalysis = this.analyzeCrisisContent(item);
      
      if (crisisAnalysis.crisisLevel === 'NONE') {
        return { processed: true, crisisDetected: false };
      }

      logInfo('Crisis detected in RSS feed', {
        source: feedSource,
        crisisLevel: crisisAnalysis.crisisLevel,
        triggers: crisisAnalysis.triggeredKeywords,
        affectedCategories: crisisAnalysis.affectedCategories
      });

      // Get affected users based on HS codes and trade volume
      const affectedUsers = await this.getAffectedUsers(crisisAnalysis);

      // Generate personalized crisis alerts
      const alertsGenerated = await this.generateCrisisAlerts(
        feedSource,
        item,
        crisisAnalysis,
        affectedUsers
      );

      logPerformance('RSS crisis processing completed', Date.now() - startTime, {
        crisisLevel: crisisAnalysis.crisisLevel,
        affectedUsers: affectedUsers.length,
        alertsGenerated: alertsGenerated.length
      });

      return {
        processed: true,
        crisisDetected: true,
        crisisLevel: crisisAnalysis.crisisLevel,
        affectedUsers: affectedUsers.length,
        alertsGenerated: alertsGenerated.length
      };

    } catch (error) {
      logError('RSS crisis processing failed', error, {
        source: feedSource,
        title: item.title
      });
      
      return {
        processed: false,
        error: error.message,
        crisisDetected: false
      };
    }
  }

  /**
   * Analyze RSS content for crisis indicators
   */
  analyzeCrisisContent(item) {
    const content = `${item.title || ''} ${item.description || ''} ${item.summary || ''}`.toLowerCase();
    
    let crisisLevel = 'NONE';
    let triggeredKeywords = [];
    let affectedCategories = [];

    // Check for crisis triggers by severity
    for (const [level, keywords] of Object.entries(this.crisisTriggers)) {
      const matches = keywords.filter(keyword => content.includes(keyword.toLowerCase()));
      if (matches.length > 0) {
        if (level === 'CRITICAL' || (level === 'HIGH' && crisisLevel !== 'CRITICAL')) {
          crisisLevel = level;
        } else if (level === 'MEDIUM' && crisisLevel === 'NONE') {
          crisisLevel = level;
        }
        triggeredKeywords.push(...matches);
      }
    }

    // Identify affected HS code categories using enhanced structure
    for (const [category, categoryData] of Object.entries(this.hsCategories)) {
      const hasKeywordMatch = categoryData.keywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      );
      const hasHSCodeMatch = categoryData.hsCodes.some(code => 
        content.includes(code)
      );
      
      if (hasKeywordMatch || hasHSCodeMatch) {
        affectedCategories.push({
          name: category,
          impactLevel: categoryData.crisisImpact,
          matchedKeywords: categoryData.keywords.filter(keyword => 
            content.includes(keyword.toLowerCase())
          ),
          matchedHSCodes: categoryData.hsCodes.filter(code => 
            content.includes(code)
          )
        });
      }
    }

    return {
      crisisLevel,
      triggeredKeywords: [...new Set(triggeredKeywords)],
      affectedCategories,
      content: content.substring(0, 500) // Store snippet for reference
    };
  }

  /**
   * Enhanced crisis impact scoring based on category and triggers
   */
  calculateCrisisImpactScore(crisisAnalysis) {
    let baseScore = 0;
    
    // Crisis level scoring
    switch (crisisAnalysis.crisisLevel) {
      case 'CRITICAL': baseScore = 100; break;
      case 'HIGH': baseScore = 75; break;
      case 'MEDIUM': baseScore = 50; break;
      default: baseScore = 0;
    }
    
    // Category impact multipliers
    let categoryMultiplier = 1.0;
    if (crisisAnalysis.affectedCategories.length > 0) {
      const highestImpact = crisisAnalysis.affectedCategories.reduce((max, cat) => {
        const impactValue = cat.impactLevel === 'CRITICAL' ? 1.5 : 
                           cat.impactLevel === 'HIGH' ? 1.3 : 1.1;
        return Math.max(max, impactValue);
      }, 1.0);
      categoryMultiplier = highestImpact;
    }
    
    // Multiple keyword trigger bonus
    const keywordBonus = Math.min(crisisAnalysis.triggeredKeywords.length * 5, 25);
    
    return Math.round(baseScore * categoryMultiplier + keywordBonus);
  }

  /**
   * Get users affected by crisis based on their trade profiles
   */
  async getAffectedUsers(crisisAnalysis) {
    try {
      // For demo purposes, return sample users
      // In production, query user database for matching profiles
      const sampleUsers = [
        {
          id: 'phoenix-electronics-001',
          companyName: 'Phoenix Electronics Inc',
          email: 'compliance@phoenix-electronics.com',
          primaryHSCode: '8517.62',
          secondaryHSCodes: ['8542.31', '8534.00'],
          annualTradeVolume: 8500000,
          businessType: 'ElectronicsTechnology',
          categories: ['electronics'],
          alertPreferences: {
            crisisAlerts: true,
            emailNotifications: true,
            smsAlerts: false
          }
        },
        {
          id: 'maple-manufacturing-002',
          companyName: 'Maple Manufacturing Ltd',
          email: 'export@maple-mfg.ca',
          primaryHSCode: '4412.10',
          secondaryHSCodes: ['4407.10', '4421.99'],
          annualTradeVolume: 12000000,
          businessType: 'AgricultureFood',
          categories: ['wood_products'],
          alertPreferences: {
            crisisAlerts: true,
            emailNotifications: true,
            smsAlerts: true
          }
        }
      ];

      // Filter users based on enhanced affected categories
      const affectedUsers = sampleUsers.filter(user => {
        // Check if user's categories match any affected categories
        const categoryMatches = user.categories.some(userCat => 
          crisisAnalysis.affectedCategories.some(affectedCat => 
            affectedCat.name === userCat
          )
        );
        
        // Check if user's HS codes match any affected HS codes
        const hsCodeMatches = crisisAnalysis.affectedCategories.some(affectedCat =>
          affectedCat.matchedHSCodes.some(hsCode =>
            user.primaryHSCode.startsWith(hsCode) || 
            user.secondaryHSCodes.some(secHs => secHs.startsWith(hsCode))
          )
        );
        
        // Alert all users if crisis is CRITICAL or no specific categories identified
        const criticalOrGeneral = crisisAnalysis.crisisLevel === 'CRITICAL' || 
                                 crisisAnalysis.affectedCategories.length === 0;
        
        return categoryMatches || hsCodeMatches || criticalOrGeneral;
      });

      return affectedUsers;

    } catch (error) {
      logError('Failed to get affected users', error);
      return [];
    }
  }

  /**
   * Generate personalized crisis alerts for affected users
   */
  async generateCrisisAlerts(feedSource, rssItem, crisisAnalysis, users) {
    const alerts = [];

    for (const user of users) {
      try {
        // Calculate crisis impact using Crisis Calculator
        const crisisImpact = await this.calculateUserCrisisImpact(user, crisisAnalysis);

        // Generate personalized alert
        const alert = await this.createPersonalizedAlert(
          feedSource,
          rssItem,
          crisisAnalysis,
          user,
          crisisImpact
        );

        alerts.push(alert);

        // Queue alert for delivery
        this.queueAlert(alert);

        logInfo('Crisis alert generated', {
          userId: user.id,
          companyName: user.companyName,
          crisisLevel: crisisAnalysis.crisisLevel,
          potentialSavings: crisisImpact?.total_savings || 0
        });

      } catch (error) {
        logError('Failed to generate crisis alert for user', error, {
          userId: user.id,
          companyName: user.companyName
        });
      }
    }

    return alerts;
  }

  /**
   * Calculate specific crisis impact for a user
   */
  async calculateUserCrisisImpact(user, crisisAnalysis) {
    try {
      // Determine crisis scenario parameters
      const scenarioParams = this.getCrisisScenarioParams(crisisAnalysis);

      // Use Crisis Calculator to get personalized impact
      const impact = await this.crisisCalculator.calculateCrisisPenalty({
        tradeVolume: user.annualTradeVolume,
        hsCode: user.primaryHSCode,
        originCountry: 'CN', // Default to China for crisis scenarios
        destinationCountry: 'US',
        businessType: user.businessType,
        sessionId: `crisis-alert-${user.id}-${Date.now()}`
      });

      return impact.success ? impact.crisis_impact : null;

    } catch (error) {
      logError('Crisis impact calculation failed', error, {
        userId: user.id,
        hsCode: user.primaryHSCode,
        tradeVolume: user.annualTradeVolume
      });
      return null;
    }
  }

  /**
   * Get crisis scenario parameters based on analysis
   */
  getCrisisScenarioParams(crisisAnalysis) {
    // Default crisis rates based on historical data
    let crisisRate = 0.25; // 25% Section 301 style
    let scenarioType = 'general_crisis';

    // Adjust based on triggered keywords
    if (crisisAnalysis.triggeredKeywords.some(kw => kw.includes('section 301'))) {
      crisisRate = 0.25;
      scenarioType = 'section_301';
    } else if (crisisAnalysis.triggeredKeywords.some(kw => kw.includes('trade war'))) {
      crisisRate = 0.30;
      scenarioType = 'trade_war';
    } else if (crisisAnalysis.triggeredKeywords.some(kw => kw.includes('emergency'))) {
      crisisRate = 0.35;
      scenarioType = 'emergency_tariff';
    }

    return { crisisRate, scenarioType };
  }

  /**
   * Create personalized alert message for user
   */
  async createPersonalizedAlert(feedSource, rssItem, crisisAnalysis, user, crisisImpact) {
    const alert = {
      id: `crisis-alert-${user.id}-${Date.now()}`,
      userId: user.id,
      companyName: user.companyName,
      email: user.email,
      crisisLevel: crisisAnalysis.crisisLevel,
      timestamp: new Date().toISOString(),
      
      // RSS Source Information
      source: {
        feedName: feedSource,
        title: rssItem.title,
        link: rssItem.link,
        pubDate: rssItem.pubDate,
        triggeredKeywords: crisisAnalysis.triggeredKeywords
      },

      // Financial Impact (from Crisis Calculator)
      financialImpact: crisisImpact ? {
        crisisPenalty: crisisImpact.crisis_penalty,
        currentPenalty: crisisImpact.current_penalty,
        usmcaPenalty: crisisImpact.usmca_penalty,
        potentialSavings: crisisImpact.savings_vs_crisis,
        savingsPercent: crisisImpact.crisis_savings_percent
      } : null,

      // User-Specific Data
      userContext: {
        primaryHSCode: user.primaryHSCode,
        annualTradeVolume: user.annualTradeVolume,
        businessType: user.businessType,
        affectedProducts: this.getAffectedProducts(user, crisisAnalysis)
      },

      // Alert Message
      message: this.generateAlertMessage(user, crisisAnalysis, crisisImpact, rssItem),

      // Delivery Preferences
      delivery: {
        email: user.alertPreferences.emailNotifications,
        sms: user.alertPreferences.smsAlerts,
        priority: crisisAnalysis.crisisLevel
      }
    };

    return alert;
  }

  /**
   * Generate the actual alert message text
   */
  generateAlertMessage(user, crisisAnalysis, crisisImpact, rssItem) {
    const urgencyEmoji = crisisAnalysis.crisisLevel === 'CRITICAL' ? '🚨' : 
                        crisisAnalysis.crisisLevel === 'HIGH' ? '⚠️' : 'ℹ️';

    let message = `${urgencyEmoji} CRISIS ALERT: ${user.companyName}\n\n`;
    
    message += `${rssItem.title}\n`;
    message += `Source: Official ${rssItem.source || 'Government'} Feed\n\n`;

    if (crisisImpact) {
      message += `FINANCIAL IMPACT TO YOUR BUSINESS:\n`;
      message += `• Crisis scenario cost: $${crisisImpact.crisis_penalty?.toLocaleString()}/year\n`;
      message += `• Current annual cost: $${crisisImpact.current_penalty?.toLocaleString()}/year\n`;
      message += `• With USMCA qualification: $${crisisImpact.usmca_penalty?.toLocaleString()}/year\n\n`;
      
      if (crisisImpact.savings_vs_crisis > 0) {
        message += `🛡️ USMCA PROTECTION AVAILABLE:\n`;
        message += `• Crisis protection saves: $${crisisImpact.savings_vs_crisis?.toLocaleString()}/year\n`;
        message += `• Savings percentage: ${crisisImpact.crisis_savings_percent}%\n\n`;
      }
    }

    message += `AFFECTED PRODUCTS:\n`;
    const affectedProducts = this.getAffectedProducts(user, crisisAnalysis);
    affectedProducts.forEach(product => {
      message += `• ${product.name} (HS ${product.hsCode}) - ${product.impactLevel} Impact\n`;
    });
    message += `• Annual Trade Volume: $${user.annualTradeVolume?.toLocaleString()}\n\n`;

    message += `IMMEDIATE ACTIONS AVAILABLE:\n`;
    message += `• Emergency USMCA Filing ($2,500)\n`;
    message += `• Crisis Consultation with Trade Expert\n`;
    message += `• Expedited Certificate of Origin\n\n`;

    message += `This alert was generated from official government sources and personalized for your trade profile.`;

    return message;
  }

  /**
   * Get products affected by crisis for this user using enhanced categories
   */
  getAffectedProducts(user, crisisAnalysis) {
    const affected = [];
    
    // Check each affected category for user matches
    for (const affectedCat of crisisAnalysis.affectedCategories) {
      const categoryData = this.hsCategories[affectedCat.name];
      if (!categoryData) continue;
      
      // Check if user's primary HS code matches any affected HS codes
      const primaryMatch = categoryData.hsCodes.some(hsCode => 
        user.primaryHSCode.startsWith(hsCode)
      );
      
      // Check secondary HS codes
      const secondaryMatch = user.secondaryHSCodes?.some(secHs =>
        categoryData.hsCodes.some(hsCode => secHs.startsWith(hsCode))
      );
      
      if (primaryMatch || secondaryMatch) {
        // Generate specific product names based on category and user's HS codes
        const productName = this.generateProductName(user, affectedCat.name, categoryData);
        affected.push({
          name: productName,
          category: affectedCat.name,
          impactLevel: affectedCat.impactLevel,
          hsCode: primaryMatch ? user.primaryHSCode : 
                  user.secondaryHSCodes?.find(secHs =>
                    categoryData.hsCodes.some(hsCode => secHs.startsWith(hsCode))
                  )
        });
      }
    }
    
    return affected.length > 0 ? affected : [{
      name: 'General Trade Products',
      category: 'general',
      impactLevel: 'MEDIUM',
      hsCode: user.primaryHSCode
    }];
  }
  
  /**
   * Generate specific product names based on category and HS code
   */
  generateProductName(user, category, categoryData) {
    const productMappings = {
      electronics: {
        '8517': 'Smart Home IoT Devices',
        '8542': 'Semiconductor Components', 
        '8471': 'Computer Equipment',
        '8473': 'Computer Parts & Accessories',
        '8504': 'Power Supply Units',
        '9013': 'Optical Devices'
      },
      automotive: {
        '8703': 'Motor Vehicles',
        '8708': 'Vehicle Parts & Components',
        '8711': 'Motorcycles',
        '8544': 'Wire Harnesses',
        '4016': 'Rubber Auto Parts'
      },
      wood_products: {
        '4407': 'Lumber & Wood Products',
        '4409': 'Wood Millwork',
        '4412': 'Engineered Wood Products',
        '4418': 'Wood Construction Materials',
        '4421': 'Wooden Articles'
      },
      textiles: {
        '6109': 'T-shirts & Tank Tops',
        '6110': 'Sweaters & Pullovers',
        '6204': 'Women\'s Suits',
        '6203': 'Men\'s Suits',
        '5208': 'Cotton Fabrics'
      }
    };
    
    const mapping = productMappings[category];
    if (mapping) {
      for (const [hsPrefix, productName] of Object.entries(mapping)) {
        if (user.primaryHSCode.startsWith(hsPrefix)) {
          return productName;
        }
      }
    }
    
    // Fallback to generic category name
    return `${category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')} Products`;
  }

  /**
   * Queue alert for delivery
   */
  queueAlert(alert) {
    this.alertQueue.set(alert.id, {
      alert,
      status: 'queued',
      queuedAt: new Date().toISOString(),
      retryCount: 0
    });

    // In production, this would trigger email/SMS delivery
    logInfo('Crisis alert queued for delivery', {
      alertId: alert.id,
      userId: alert.userId,
      crisisLevel: alert.crisisLevel,
      deliveryMethods: Object.keys(alert.delivery).filter(k => alert.delivery[k])
    });
  }

  /**
   * Get queued alerts (for admin monitoring)
   */
  getQueuedAlerts() {
    return Array.from(this.alertQueue.values());
  }

  /**
   * Clear processed alerts from queue
   */
  clearProcessedAlerts() {
    const processed = [];
    for (const [id, queuedItem] of this.alertQueue.entries()) {
      if (queuedItem.status === 'delivered') {
        processed.push(queuedItem);
        this.alertQueue.delete(id);
      }
    }
    return processed;
  }
}

export const crisisAlertService = new CrisisAlertService();