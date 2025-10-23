/**
 * CRISIS ALERT SERVICE
 * Integrates RSS monitoring with Crisis Calculator for personalized alerts
 * Triggers financial impact calculations when government feeds detect crisis scenarios
 */

import { randomUUID } from 'crypto';
import { crisisCalculatorService } from './crisis-calculator-service.js';
import { serverDatabaseService } from '../database/supabase-client.js';
import { logInfo, logError, logPerformance } from '../utils/production-logger.js';
import { logDevIssue, DevIssue } from '../utils/logDevIssue.js';

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
   * 🔴 WEEK 1 ENHANCEMENT #5: Filters by supplier_country, industry_sector, and prioritizes high trade volume
   */
  async getAffectedUsers(crisisAnalysis) {
    try {
      // Query database for users with workflow data
      const { data: workflows, error } = await this.db.client
        .from('workflow_sessions')
        .select(`
          user_id,
          company_name,
          industry_sector,
          component_origins,
          trade_volume,
          user_profiles!inner(email, contact_person, subscription_tier)
        `)
        .not('user_profiles.email', 'is', null);

      if (error) {
        console.error('Database query error:', error);
        await DevIssue.apiError('crisis_alert_service', 'getAffectedUsers database query', error, {
          crisisLevel: crisisAnalysis.crisisLevel
        });
        return [];
      }

      if (!workflows || workflows.length === 0) {
        // ✅ FAIL LOUDLY: No fallback to sample users
        // Crisis alerts require REAL user data - cannot send alerts about fake companies to fake emails
        console.error('❌ No workflow data found for crisis analysis - cannot generate alerts without real user data');
        return [];  // Return empty list instead of fake data
      }

      // 🔴 WEEK 1 ENHANCEMENT #5: Filter by supplier_country and industry_sector
      const affectedUsers = workflows
        .filter(workflow => {
          // Filter by industry_sector (if crisis affects specific industry)
          if (crisisAnalysis.affectedCategories.length > 0) {
            const industryMatch = crisisAnalysis.affectedCategories.some(cat =>
              workflow.industry_sector?.toLowerCase().includes(cat.name.replace('_', ' '))
            );
            if (!industryMatch) return false;
          }

          // Filter by supplier_country (check component origins)
          if (workflow.component_origins && Array.isArray(workflow.component_origins)) {
            const hasAffectedSupplier = workflow.component_origins.some(comp => {
              // Check if component origin matches crisis-affected countries
              const affectedCountries = this.getAffectedCountries(crisisAnalysis);
              return affectedCountries.includes(comp.origin_country || comp.country);
            });
            if (!hasAffectedSupplier && crisisAnalysis.crisisLevel !== 'CRITICAL') {
              return false;
            }
          }

          // Always alert CRITICAL crises regardless of filters
          return true;
        })
        .map(workflow => ({
          id: workflow.user_id,
          companyName: workflow.company_name,
          email: workflow.user_profiles?.email,
          contactPerson: workflow.user_profiles?.contact_person, // 🔴 WEEK 1 ENHANCEMENT #6
          subscriptionTier: workflow.user_profiles?.subscription_tier,
          annualTradeVolume: workflow.trade_volume || 0,
          industrySecor: workflow.industry_sector,
          componentOrigins: workflow.component_origins,
          // VIP flag for personalization
          isVIP: (workflow.trade_volume || 0) >= 1000000 // $1M+ trade volume
        }));

      // 🔴 WEEK 1 ENHANCEMENT #5: Prioritize by trade volume (high-value users first)
      affectedUsers.sort((a, b) => b.annualTradeVolume - a.annualTradeVolume);

      console.log(`✅ Found ${affectedUsers.length} affected users (filtered by industry & supplier)`);
      console.log(`   VIP users ($1M+): ${affectedUsers.filter(u => u.isVIP).length}`);

      return affectedUsers;

    } catch (error) {
      await logDevIssue({
        type: 'api_error',
        severity: 'high',
        component: 'database_service',
        message: 'Failed to query affected users for crisis alert',
        data: {
          error: error.message,
          stack: error.stack,
          crisisLevel: crisisAnalysis.crisisLevel,
          affectedCategories: crisisAnalysis.affectedCategories.map(c => c.name)
        }
      });
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
        sessionId: `crisis-alert-${user.id}-${randomUUID()}` // ✅ UUID prevents collisions
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
   * ✅ ISSUE #7 FIX: Now includes workflow context from latest USMCA analysis
   */
  async createPersonalizedAlert(feedSource, rssItem, crisisAnalysis, user, crisisImpact) {
    // ✅ ISSUE #7 FIX: Load user's latest workflow for USMCA context
    let workflowContext = null;
    try {
      const latestWorkflow = await this.getLatestUserWorkflow(user.id);
      if (latestWorkflow) {
        workflowContext = {
          rvcPercentage: latestWorkflow.regional_content_percentage,
          threshold: latestWorkflow.required_threshold,
          qualified: latestWorkflow.qualification_status === 'QUALIFIED',
          components: latestWorkflow.component_origins?.length || 0,
          annualSavings: latestWorkflow.enrichment_data?.savings?.annual_savings,
          productDescription: latestWorkflow.product_description,
          destinationCountry: latestWorkflow.destination_country
        };
      }
    } catch (err) {
      logError('Failed to load workflow context for alert', { userId: user.id, error: err.message });
      // Continue without workflow context if load fails
    }

    const alert = {
      id: `crisis-alert-${user.id}-${randomUUID()}`, // ✅ UUID prevents ID collisions in batch processing
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

      // User-Specific Data (Enhanced with workflow context)
      userContext: {
        primaryHSCode: user.primaryHSCode,
        annualTradeVolume: user.annualTradeVolume,
        businessType: user.businessType,
        affectedProducts: this.getAffectedProducts(user, crisisAnalysis),
        // ✅ ISSUE #7 FIX: Include workflow context for personalized alerts
        workflow: workflowContext
      },

      // Alert Message (Now includes workflow context)
      message: this.generateAlertMessage(user, crisisAnalysis, crisisImpact, rssItem, workflowContext),

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
   * ✅ ISSUE #7 FIX: Retrieve user's latest workflow from database
   * @param {String} userId - User ID
   * @returns {Object} Latest workflow session with USMCA analysis
   */
  async getLatestUserWorkflow(userId) {
    try {
      const { data, error } = await this.db.supabase
        .from('workflow_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        logError('Failed to retrieve user workflow', { userId, error: error.message });
        return null;
      }

      return data;
    } catch (err) {
      logError('Exception loading user workflow', { userId, error: err.message });
      return null;
    }
  }

  /**
   * Generate the actual alert message text
   * ✅ ISSUE #7 FIX: Now accepts workflow context for personalized recommendations
   */
  generateAlertMessage(user, crisisAnalysis, crisisImpact, rssItem, workflowContext = null) {
    const urgencyEmoji = crisisAnalysis.crisisLevel === 'CRITICAL' ? '🚨' :
                        crisisAnalysis.crisisLevel === 'HIGH' ? '⚠️' : 'ℹ️';

    let message = `${urgencyEmoji} CRISIS ALERT: ${user.companyName}\n\n`;

    // ✅ ISSUE #7 FIX: Personalized intro using workflow context
    if (workflowContext?.productDescription) {
      message += `Your product "${workflowContext.productDescription}" is affected by:\n`;
    }
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

    // ✅ ISSUE #7 FIX: Add personalized qualification status
    if (workflowContext) {
      message += `YOUR USMCA QUALIFICATION STATUS:\n`;
      message += `• Status: ${workflowContext.qualified ? '✅ QUALIFIED' : '❌ NOT QUALIFIED'}\n`;
      if (workflowContext.rvcPercentage !== undefined) {
        message += `• Regional Content: ${workflowContext.rvcPercentage.toFixed(1)}% (Threshold: ${workflowContext.threshold}%)\n`;
      }
      if (workflowContext.annualSavings !== undefined && workflowContext.annualSavings > 0) {
        message += `• Annual USMCA Savings: $${workflowContext.annualSavings.toLocaleString()}\n`;
      }
      message += `• Destination: ${workflowContext.destinationCountry}\n\n`;
    }

    message += `AFFECTED PRODUCTS:\n`;
    const affectedProducts = this.getAffectedProducts(user, crisisAnalysis);
    affectedProducts.forEach(product => {
      message += `• ${product.name} (HS ${product.hsCode}) - ${product.impactLevel} Impact\n`;
    });
    message += `• Annual Trade Volume: $${user.annualTradeVolume?.toLocaleString()}\n\n`;

    // ✅ ISSUE #7 FIX: Context-aware recommendations
    message += `IMMEDIATE ACTIONS AVAILABLE:\n`;
    if (workflowContext?.qualified) {
      message += `• Your USMCA qualification provides protection - Review latest analysis\n`;
    } else if (workflowContext) {
      message += `• Improve USMCA qualification to strengthen crisis protection\n`;
    }
    message += `• Emergency USMCA Filing ($2,500)\n`;
    message += `• Crisis Consultation with Trade Expert\n`;
    message += `• Expedited Certificate of Origin\n\n`;

    message += `This alert was generated from official government sources and personalized based on your latest USMCA analysis.`;

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

  /**
   * Get affected countries from crisis analysis (🔴 WEEK 1 ENHANCEMENT #5)
   * Extracts countries mentioned in crisis triggers
   */
  getAffectedCountries(crisisAnalysis) {
    const affectedCountries = [];

    // Check triggered keywords for country mentions
    const countryMentions = {
      'china': 'CN',
      'chinese': 'CN',
      'mexico': 'MX',
      'mexican': 'MX',
      'canada': 'CA',
      'canadian': 'CA'
    };

    crisisAnalysis.triggeredKeywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      Object.entries(countryMentions).forEach(([mention, code]) => {
        if (lowerKeyword.includes(mention) && !affectedCountries.includes(code)) {
          affectedCountries.push(code);
        }
      });
    });

    // Default to China for Section 301 / trade war scenarios
    if (affectedCountries.length === 0 &&
        (crisisAnalysis.triggeredKeywords.some(kw => kw.includes('301')) ||
         crisisAnalysis.triggeredKeywords.some(kw => kw.includes('trade war')))) {
      affectedCountries.push('CN');
    }

    return affectedCountries;
  }

  // ✅ REMOVED: getSampleAffectedUsers function
  // No more fake users, sample data, or demo@example.com alerts
  // Crisis alerts require real workflow data from real authenticated users
}

export const crisisAlertService = new CrisisAlertService();