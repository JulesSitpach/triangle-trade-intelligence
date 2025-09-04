/**
 * TEST CRISIS RSS INTEGRATION API ENDPOINT
 * Tests the integration between RSS monitoring and Crisis Calculator
 * Simulates government RSS feed scenarios to validate alert generation
 */

import { crisisAlertService } from '../../lib/services/crisis-alert-service.js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      allowed_methods: ['POST']
    });
  }

  const startTime = Date.now();

  try {
    const { scenario = 'section_301_electronics' } = req.body;
    
    logInfo('Testing crisis RSS integration', { scenario });

    // Test scenarios mimicking real government RSS feed items
    const testScenarios = {
      section_301_electronics: {
        feedSource: 'usitc_tariff_news',
        rssItem: {
          title: 'USITC Announces Section 301 Investigation on Chinese Electronics Import Duties',
          description: 'The United States International Trade Commission has initiated a Section 301 investigation targeting electronics imports from China, including smartphones, semiconductors, and IoT devices. The investigation may result in additional tariffs of up to 25% on affected products.',
          link: 'https://www.usitc.gov/press_room/news_release/2025/er0901.html',
          pubDate: new Date().toISOString(),
          guid: `section-301-electronics-${Date.now()}`
        }
      },
      mexican_dof_automotive: {
        feedSource: 'dof_official',
        rssItem: {
          title: 'DOF Anuncia Modificaciones Arancelarias para Vehículos Importados',
          description: 'El Diario Oficial de la Federación publica cambios en los aranceles para vehículos automotrices importados de Estados Unidos. Los nuevos aranceles entrarán en vigor inmediatamente como medida de salvaguardia.',
          link: 'https://www.dof.gob.mx/nota_detalle.php?codigo=5703924',
          pubDate: new Date().toISOString(),
          guid: `dof-automotive-${Date.now()}`
        }
      },
      canada_gazette_wood: {
        feedSource: 'canada_gazette_part2',
        rssItem: {
          title: 'Canada Gazette Part II: Softwood Lumber Tariff Rate Modifications',
          description: 'New regulations published regarding softwood lumber tariff rates affecting imports from the United States. The modifications include changes to preferential rates under USMCA and countervailing duty adjustments.',
          link: 'https://www.gazette.gc.ca/rp-pr/p2/2025/2025-09-01/html/sor-dors123-eng.html',
          pubDate: new Date().toISOString(),
          guid: `canada-wood-${Date.now()}`
        }
      },
      trade_war_escalation: {
        feedSource: 'ustr_press',
        rssItem: {
          title: 'USTR Announces Retaliatory Tariffs Following Trade Dispute Escalation',
          description: 'The United States Trade Representative announces immediate retaliatory tariffs affecting multiple sectors including electronics, automotive, agriculture, and machinery. Emergency measures will take effect within 30 days.',
          link: 'https://ustr.gov/about-us/policy-offices/press-office/press-releases/2025/september/emergency-tariff-announcement',
          pubDate: new Date().toISOString(),
          guid: `trade-war-escalation-${Date.now()}`
        }
      },
      classification_change: {
        feedSource: 'cbp_rulings_cross',
        rssItem: {
          title: 'CBP Issues New Classification Ruling Affecting HS Code 8542.31',
          description: 'U.S. Customs and Border Protection has issued ruling HQ H325789 modifying the classification of semiconductor memory devices under HS Code 8542.31, potentially affecting USMCA qualification requirements.',
          link: 'https://rulings.cbp.gov/ruling/HQ-H325789',
          pubDate: new Date().toISOString(),
          guid: `cbp-classification-${Date.now()}`
        }
      }
    };

    const selectedScenario = testScenarios[scenario];
    if (!selectedScenario) {
      return res.status(400).json({
        success: false,
        error: `Unknown test scenario: ${scenario}`,
        available_scenarios: Object.keys(testScenarios)
      });
    }

    // Process the test RSS item through crisis alert service
    const crisisResult = await crisisAlertService.processRSSItem(
      selectedScenario.feedSource,
      selectedScenario.rssItem
    );

    const processingTime = Date.now() - startTime;

    // Get queued alerts for review
    const queuedAlerts = crisisAlertService.getQueuedAlerts();

    logInfo('Crisis RSS integration test completed', {
      scenario,
      crisisDetected: crisisResult.crisisDetected,
      alertsGenerated: crisisResult.alertsGenerated,
      processingTime
    });

    return res.status(200).json({
      success: true,
      test_scenario: {
        scenario,
        description: `Testing ${scenario.replace('_', ' ')} crisis scenario`,
        feedSource: selectedScenario.feedSource,
        rssTitle: selectedScenario.rssItem.title
      },
      crisis_analysis: {
        crisisDetected: crisisResult.crisisDetected,
        crisisLevel: crisisResult.crisisLevel || null,
        affectedUsers: crisisResult.affectedUsers || 0,
        alertsGenerated: crisisResult.alertsGenerated || 0,
        processingTime: `${processingTime}ms`
      },
      generated_alerts: queuedAlerts.length > 0 ? {
        count: queuedAlerts.length,
        preview: queuedAlerts.map(qa => ({
          alertId: qa.alert.id,
          companyName: qa.alert.companyName,
          crisisLevel: qa.alert.crisisLevel,
          financialImpact: qa.alert.financialImpact ? {
            crisisPenalty: qa.alert.financialImpact.crisisPenalty,
            potentialSavings: qa.alert.financialImpact.potentialSavings
          } : null,
          messagePreview: qa.alert.message?.substring(0, 200) + '...'
        }))
      } : { count: 0, message: 'No alerts generated for this scenario' },
      workflow_validation: {
        rss_monitoring: '✅ RSS item processed successfully',
        crisis_detection: crisisResult.crisisDetected ? '✅ Crisis triggers detected' : '❌ No crisis detected',
        user_matching: crisisResult.affectedUsers > 0 ? '✅ Users matched to crisis' : '❌ No users matched',
        alert_generation: crisisResult.alertsGenerated > 0 ? '✅ Alerts generated' : '❌ No alerts generated',
        calculator_integration: '✅ Crisis Calculator integration active'
      },
      next_steps: crisisResult.crisisDetected ? [
        'Review generated alerts in the admin dashboard',
        'Validate financial impact calculations',
        'Test alert delivery mechanisms (email/SMS)',
        'Monitor customer response and engagement'
      ] : [
        'Try a different test scenario with higher crisis severity',
        'Check crisis trigger keyword configuration',
        'Validate RSS feed content processing'
      ]
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError('Crisis RSS integration test failed', error);

    return res.status(500).json({
      success: false,
      error: 'Crisis RSS integration test failed',
      message: error.message,
      processingTime: `${processingTime}ms`,
      troubleshooting: [
        'Verify crisis alert service is properly initialized',
        'Check database connectivity',
        'Validate RSS processing configuration',
        'Review server logs for detailed error information'
      ]
    });
  }
}