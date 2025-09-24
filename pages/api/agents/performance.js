import { AgentCoordinator } from '../../../lib/agents/agent-coordinator.js';

// Singleton coordinator for performance tracking across requests
let globalCoordinator = null;

function getCoordinator() {
  if (!globalCoordinator) {
    globalCoordinator = new AgentCoordinator();
  }
  return globalCoordinator;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.query;
    const coordinator = getCoordinator();

    switch (action) {
      case 'metrics':
        const metrics = coordinator.getPerformanceMetrics();
        return res.status(200).json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString()
        });

      case 'logs':
        const limit = parseInt(req.query.limit) || 100;
        const logs = coordinator.getInteractionLogs(limit);
        return res.status(200).json({
          success: true,
          data: logs,
          count: logs.length
        });

      case 'patterns':
        const patterns = coordinator.analyzeCollaborationPatterns();
        return res.status(200).json({
          success: true,
          data: patterns,
          timestamp: new Date().toISOString()
        });

      case 'status':
        const status = {
          coordinatorActive: globalCoordinator !== null,
          metrics: coordinator.getPerformanceMetrics(),
          recentActivity: coordinator.getInteractionLogs(10)
        };
        return res.status(200).json({
          success: true,
          data: status
        });

      default:
        return res.status(400).json({
          error: 'Invalid action',
          validActions: ['metrics', 'logs', 'patterns', 'status']
        });
    }

  } catch (error) {
    console.error('[Agent Performance API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}