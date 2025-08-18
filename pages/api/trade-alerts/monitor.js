/**
 * Trade Alert Monitor API
 * Manual monitoring endpoint to test RSS feed detection
 * Usage: GET /api/trade-alerts/monitor
 */

import tradeMonitor from '../../../lib/trade-alert-monitor.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🚀 Starting manual trade alert monitoring...');
    
    const alerts = await tradeMonitor.checkAllFeeds();
    
    // Sort by relevance and urgency
    const sortedAlerts = alerts.sort((a, b) => 
      (b.relevanceScore + b.urgencyScore) - (a.relevanceScore + a.urgencyScore)
    );
    
    // Prepare response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalAlerts: alerts.length,
        highUrgency: alerts.filter(a => a.urgencyScore > 30).length,
        withSolutions: alerts.filter(a => a.solutions && a.solutions.length > 0).length,
        sources: [...new Set(alerts.map(a => a.sourceName))]
      },
      alerts: sortedAlerts.map(alert => ({
        source: alert.sourceName,
        title: alert.title,
        link: alert.link,
        pubDate: alert.pubDate,
        relevanceScore: alert.relevanceScore,
        urgencyScore: alert.urgencyScore,
        
        detected: {
          countries: alert.detected.countries,
          products: alert.detected.products,
          tariffRates: alert.detected.tariffRates,
          hsCodes: alert.detected.hsCodes,
          deadlines: alert.detected.deadlines
        },
        
        databaseMatches: alert.databaseMatches ? {
          count: alert.databaseMatches.length,
          totalValue: alert.databaseMatches.reduce((sum, match) => sum + match.totalValue, 0),
          affectedRoutes: alert.databaseMatches.reduce((sum, match) => sum + match.affectedRoutes, 0)
        } : null,
        
        solutions: alert.solutions ? alert.solutions.map(solution => ({
          type: solution.type,
          route: solution.route,
          description: solution.description,
          estimatedSavings: solution.estimatedSavings,
          urgency: solution.urgency
        })) : []
      }))
    };
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Trade alert monitoring error:', error);
    return res.status(500).json({
      success: false,
      error: 'Monitoring failed',
      message: error.message
    });
  }
}