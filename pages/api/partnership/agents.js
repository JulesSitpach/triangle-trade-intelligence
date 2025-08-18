import { PartnershipSalesAgent, PartnershipAnalyticsAgent } from '../../../lib/partnership-swarm-agents';
import { logger } from '../../../lib/utils/production-logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, params } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const partnershipAgent = new PartnershipSalesAgent();
    const analyticsAgent = new PartnershipAnalyticsAgent();

    let result;

    switch (action) {
      case 'calculate_commission':
        const { annual_savings, commission_rate = 0.15 } = params;
        result = await partnershipAgent.calculateCommission(annual_savings, commission_rate);
        break;

      case 'match_mexican_partners':
        const { industry, product_type, location_preference } = params;
        result = await partnershipAgent.matchMexicanPartners(industry, product_type, location_preference);
        break;

      case 'analyze_partnership_pipeline':
        const { timeframe = '30_days' } = params;
        result = await analyticsAgent.analyzePartnershipPipeline(timeframe);
        break;

      case 'get_top_specialists':
        result = await analyticsAgent.getTopPerformingSpecialists();
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Log the agent action
    logger.logInfo('PARTNERSHIP_AGENT_ACTION', {
      action,
      params: JSON.stringify(params).substring(0, 200), // Log first 200 chars
      resultType: typeof result,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Partnership agent error:', error);
    
    logger.logError('PARTNERSHIP_AGENT_ERROR', {
      action: req.body?.action,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}