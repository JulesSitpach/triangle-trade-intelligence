/**
 * CRISIS ALERTS API ENDPOINT
 * Manages crisis alert system integrated with RSS monitoring
 * Provides testing and monitoring capabilities for crisis detection
 */

import { crisisAlertService } from '../../lib/services/crisis-alert-service.js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const startTime = Date.now();
  const { action, data = {} } = req.method === 'POST' ? req.body : req.query;

  try {
    logInfo('Crisis alerts API called', { action, method: req.method });

    switch (action) {
      case 'test_rss_crisis_detection':
        return await handleTestRSSCrisisDetection(req, res, data);
      
      case 'simulate_crisis_scenario':
        return await handleSimulateCrisisScenario(req, res, data);
        
      case 'get_queued_alerts':
        return await handleGetQueuedAlerts(req, res);
        
      case 'generate_sample_alert':
        return await handleGenerateSampleAlert(req, res, data);
        
      case 'test_phoenix_electronics':
        return await handleTestPhoenixElectronics(req, res);
        
      case 'get_active_alerts':
        return await handleGetActiveAlerts(req, res, data);
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
          supported_actions: [
            'test_rss_crisis_detection',
            'simulate_crisis_scenario', 
            'get_queued_alerts',
            'generate_sample_alert',
            'test_phoenix_electronics',
            'get_active_alerts'
          ]
        });
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logError('Crisis alerts API error', error, { action, responseTime });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Test RSS item processing for crisis detection
 */
async function handleTestRSSCrisisDetection(req, res, data) {
  try {
    // Sample RSS items for testing different crisis scenarios
    const testRSSItems = {
      section_301_electronics: {
        title: 'USITC Announces Section 301 Investigation on Chinese Electronics and Semiconductors',
        description: 'The U.S. International Trade Commission today announced initiation of Section 301 investigations covering electronics, smartphones, IoT devices, and semiconductor products imported from China. New tariff rates of 25% will apply to HS codes 8517.62, 8542.31, and related electronic components effective 30 days from publication.',
        link: 'https://usitc.gov/press_room/news_releases/2025/pr_001.html',
        pubDate: new Date().toISOString(),
        source: 'USITC Tariff News'
      },
      
      usmca_threat: {
        title: 'USTR Announces Review of USMCA Trade Agreement Effectiveness',
        description: 'The Office of the United States Trade Representative announces comprehensive review of USMCA agreement effectiveness, including potential renegotiation of automotive and electronics trade provisions. Industry stakeholders have 60 days to provide comments on proposed modifications to regional content requirements.',
        link: 'https://ustr.gov/press-releases/2025/usmca-review',
        pubDate: new Date().toISOString(),
        source: 'USTR Press'
      },
      
      emergency_tariff: {
        title: 'CBP Implements Emergency Tariff Measures on Consumer Electronics',
        description: 'U.S. Customs and Border Protection announces immediate implementation of emergency tariff measures affecting consumer electronics, smart home devices, and related products. Emergency rates of 35% apply to imports from specified countries effective immediately.',
        link: 'https://cbp.gov/newsroom/emergency-tariff-2025',
        pubDate: new Date().toISOString(),
        source: 'CBP News'
      }
    };

    const scenario = data.scenario || 'section_301_electronics';
    const testItem = testRSSItems[scenario];

    if (!testItem) {
      return res.status(400).json({
        success: false,
        error: `Unknown test scenario: ${scenario}`,
        available_scenarios: Object.keys(testRSSItems)
      });
    }

    // Process the test RSS item through crisis detection
    const result = await crisisAlertService.processRSSItem(
      testItem.source,
      testItem
    );

    return res.json({
      success: true,
      test_scenario: scenario,
      test_item: {
        title: testItem.title,
        source: testItem.source,
        pubDate: testItem.pubDate
      },
      crisis_detection_result: result,
      processing_time_ms: Date.now() - Date.now(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('RSS crisis detection test failed', error);
    return res.status(500).json({
      success: false,
      error: 'Crisis detection test failed',
      details: error.message
    });
  }
}

/**
 * Simulate a complete crisis scenario for testing
 */
async function handleSimulateCrisisScenario(req, res, data) {
  try {
    const scenarios = {
      trade_war_escalation: {
        name: 'Trade War Escalation',
        description: 'Simulates escalation of trade tensions with 30% emergency tariffs',
        crisisRate: 0.30,
        affectedCategories: ['electronics', 'automotive', 'machinery'],
        urgency: 'CRITICAL'
      },
      
      usmca_withdrawal: {
        name: 'USMCA Withdrawal Threat',
        description: 'Simulates threat of USMCA agreement withdrawal',
        crisisRate: 0.25,
        affectedCategories: ['all'],
        urgency: 'CRITICAL'
      },
      
      sector_specific_tariffs: {
        name: 'Sector-Specific Tariffs',
        description: 'Simulates targeted tariffs on specific industry sectors',
        crisisRate: 0.20,
        affectedCategories: ['electronics'],
        urgency: 'HIGH'
      }
    };

    const scenarioKey = data.scenario || 'trade_war_escalation';
    const scenario = scenarios[scenarioKey];

    if (!scenario) {
      return res.status(400).json({
        success: false,
        error: `Unknown scenario: ${scenarioKey}`,
        available_scenarios: Object.keys(scenarios)
      });
    }

    // Create mock RSS item based on scenario
    const mockRSSItem = {
      title: `BREAKING: ${scenario.name} - ${scenario.description}`,
      description: `Official government announcement regarding ${scenario.name.toLowerCase()}. New tariff rates of ${(scenario.crisisRate * 100)}% will affect multiple industry sectors. Immediate action required for trade compliance.`,
      link: `https://government-source.gov/crisis-${scenarioKey}`,
      pubDate: new Date().toISOString(),
      source: 'Crisis Simulation'
    };

    // Process through crisis detection
    const crisisResult = await crisisAlertService.processRSSItem(
      'Crisis Simulation',
      mockRSSItem
    );

    return res.json({
      success: true,
      scenario: {
        key: scenarioKey,
        ...scenario
      },
      simulation_input: mockRSSItem,
      crisis_analysis: crisisResult,
      recommendations: [
        'Review affected product classifications',
        'Assess USMCA qualification status',
        'Calculate financial impact using crisis calculator',
        'Consider expedited compliance filing'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('Crisis scenario simulation failed', error);
    return res.status(500).json({
      success: false,
      error: 'Crisis scenario simulation failed',
      details: error.message
    });
  }
}

/**
 * Get currently queued crisis alerts
 */
async function handleGetQueuedAlerts(req, res) {
  try {
    const queuedAlerts = crisisAlertService.getQueuedAlerts();
    
    const summary = {
      total_alerts: queuedAlerts.length,
      by_crisis_level: {},
      by_status: {},
      recent_alerts: queuedAlerts
        .filter(item => Date.now() - new Date(item.queuedAt).getTime() < 24 * 60 * 60 * 1000)
        .length
    };

    // Calculate summaries
    queuedAlerts.forEach(item => {
      const level = item.alert.crisisLevel;
      const status = item.status;
      
      summary.by_crisis_level[level] = (summary.by_crisis_level[level] || 0) + 1;
      summary.by_status[status] = (summary.by_status[status] || 0) + 1;
    });

    return res.json({
      success: true,
      summary,
      queued_alerts: queuedAlerts.map(item => ({
        id: item.alert.id,
        company: item.alert.companyName,
        crisisLevel: item.alert.crisisLevel,
        potentialSavings: item.alert.financialImpact?.potentialSavings || 0,
        status: item.status,
        queuedAt: item.queuedAt,
        source: item.alert.source.feedName
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('Failed to get queued alerts', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get queued alerts',
      details: error.message
    });
  }
}

/**
 * Generate a sample crisis alert for demonstration
 */
async function handleGenerateSampleAlert(req, res, data) {
  try {
    const company = data.company || 'Phoenix Electronics Inc';
    
    // Create sample RSS item
    const sampleRSSItem = {
      title: `${company} Crisis Alert Test - Section 301 Electronics Investigation`,
      description: `Test crisis alert for ${company} regarding potential Section 301 tariff increases on electronics and IoT devices. This is a demonstration of the crisis alert system.`,
      link: 'https://example.com/crisis-test',
      pubDate: new Date().toISOString(),
      source: 'Crisis Alert Test'
    };

    // Process through crisis system
    const result = await crisisAlertService.processRSSItem(
      'Crisis Alert Test',
      sampleRSSItem
    );

    return res.json({
      success: true,
      test_company: company,
      sample_rss_item: sampleRSSItem,
      crisis_processing_result: result,
      note: 'This is a test alert generated for demonstration purposes',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('Sample alert generation failed', error);
    return res.status(500).json({
      success: false,
      error: 'Sample alert generation failed',
      details: error.message
    });
  }
}

/**
 * Get active crisis alerts from RSS monitoring data
 */
async function handleGetActiveAlerts(req, res, data) {
  try {
    const userProfile = data.user_profile || null;
    
    // Get queued alerts from crisis alert service
    const queuedAlerts = crisisAlertService.getQueuedAlerts();
    
    if (queuedAlerts.length === 0) {
      return res.json({
        success: true,
        crisis_analysis: { crisisDetected: false },
        generated_alerts: { count: 0, preview: [] },
        message: 'No active crisis alerts detected'
      });
    }

    // Filter alerts for user if profile provided
    let relevantAlerts = queuedAlerts;
    if (userProfile && (userProfile.companyName || userProfile.primaryHSCode)) {
      relevantAlerts = queuedAlerts.filter(qa => {
        const companyMatch = userProfile.companyName && 
          qa.alert.companyName.toLowerCase().includes(userProfile.companyName.toLowerCase());
        const hsCodeMatch = userProfile.primaryHSCode && 
          qa.alert.userContext.primaryHSCode === userProfile.primaryHSCode;
        return companyMatch || hsCodeMatch;
      });
    }

    return res.json({
      success: true,
      crisis_analysis: {
        crisisDetected: relevantAlerts.length > 0,
        crisisLevel: relevantAlerts.length > 0 ? relevantAlerts[0].alert.crisisLevel : 'NONE',
        affectedUsers: relevantAlerts.length,
        alertsGenerated: relevantAlerts.length
      },
      generated_alerts: {
        count: relevantAlerts.length,
        preview: relevantAlerts.slice(0, 3).map(qa => ({
          alertId: qa.alert.id,
          companyName: qa.alert.companyName,
          crisisLevel: qa.alert.crisisLevel,
          financialImpact: qa.alert.financialImpact,
          messagePreview: qa.alert.message?.substring(0, 200) + '...',
          source: qa.alert.source?.feedName || 'Government RSS'
        }))
      },
      user_filter_applied: !!userProfile,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('Failed to get active alerts', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get active alerts',
      details: error.message
    });
  }
}

/**
 * Test the complete Phoenix Electronics crisis scenario
 */
async function handleTestPhoenixElectronics(req, res) {
  try {
    // Phoenix Electronics specific crisis scenario
    const phoenixCrisisRSS = {
      title: 'BREAKING: USITC Announces Section 301 Investigation Targeting Smart Home IoT Devices',
      description: 'The U.S. International Trade Commission today announced initiation of Section 301 investigation specifically targeting smart home IoT devices, internet-connected sensors, and home automation systems under HS codes 8517.62 and related classifications. Proposed tariff rates of 25% will apply to imports from China effective in 30 days. Companies currently importing these products should review their USMCA qualification status immediately to avoid significant cost increases. The investigation covers products manufactured by companies similar to Phoenix Electronics Inc and related IoT device manufacturers.',
      link: 'https://usitc.gov/press_room/phoenix-iot-investigation-2025',
      pubDate: new Date().toISOString(),
      source: 'USITC Tariff News - Smart Home Division',
      guid: `phoenix-crisis-test-${Date.now()}`
    };

    // Process through complete crisis system
    const crisisResult = await crisisAlertService.processRSSItem(
      'USITC Tariff News',
      phoenixCrisisRSS
    );

    // Get the generated alerts
    const queuedAlerts = crisisAlertService.getQueuedAlerts();
    const phoenixAlerts = queuedAlerts.filter(item => 
      item.alert.companyName.includes('Phoenix Electronics')
    );

    return res.json({
      success: true,
      test_scenario: 'Phoenix Electronics IoT Crisis',
      rss_trigger: {
        title: phoenixCrisisRSS.title,
        source: phoenixCrisisRSS.source,
        targeted_hs_codes: ['8517.62', '8542.31', '8534.00'],
        crisis_rate: '25%'
      },
      crisis_detection: crisisResult,
      phoenix_specific_alerts: phoenixAlerts.map(item => ({
        company: item.alert.companyName,
        crisisLevel: item.alert.crisisLevel,
        message: item.alert.message,
        financialImpact: item.alert.financialImpact,
        deliveryPreferences: item.alert.delivery
      })),
      business_impact_summary: phoenixAlerts.length > 0 ? {
        annual_crisis_cost: phoenixAlerts[0]?.alert.financialImpact?.crisisPenalty,
        current_annual_cost: phoenixAlerts[0]?.alert.financialImpact?.currentPenalty,
        usmca_qualified_cost: phoenixAlerts[0]?.alert.financialImpact?.usmcaPenalty,
        potential_savings: phoenixAlerts[0]?.alert.financialImpact?.potentialSavings,
        savings_percentage: phoenixAlerts[0]?.alert.financialImpact?.savingsPercent
      } : null,
      recommendations: [
        'File emergency USMCA certificate for IoT devices',
        'Review component origin documentation',
        'Calculate precise financial impact using crisis calculator',
        'Consider expedited customs broker consultation',
        'Update supply chain compliance procedures'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logError('Phoenix Electronics test failed', error);
    return res.status(500).json({
      success: false,
      error: 'Phoenix Electronics crisis test failed',
      details: error.message
    });
  }
}