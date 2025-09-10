/**
 * RSS Polling Control API
 * POST /api/admin/rss-polling - Start/stop RSS polling
 * GET /api/admin/rss-polling - Get polling status
 * Controls the crisis monitoring RSS polling engine
 */

const RSSPollingEngine = require('../../../lib/services/rss-polling-engine');

// Global polling engine instance
let pollingEngine = null;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetPollingStatus(req, res);
  } else if (req.method === 'POST') {
    return handlePollingControl(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * Get current polling status
 */
async function handleGetPollingStatus(req, res) {
  try {
    const status = pollingEngine ? pollingEngine.getStatus() : {
      isPolling: false,
      hasInterval: false,
      uptime: 'Stopped'
    };

    return res.status(200).json({
      polling_status: status,
      engine_initialized: !!pollingEngine,
      message: status.isPolling ? 'RSS crisis monitoring is active' : 'RSS crisis monitoring is stopped'
    });

  } catch (error) {
    console.error('RSS polling status error:', error);
    return res.status(500).json({ 
      error: 'Failed to get polling status',
      message: error.message 
    });
  }
}

/**
 * Control RSS polling (start/stop)
 */
async function handlePollingControl(req, res) {
  try {
    const { action, interval_minutes = 5 } = req.body;

    if (!['start', 'stop', 'poll_once'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action',
        valid_actions: ['start', 'stop', 'poll_once']
      });
    }

    // Initialize engine if not exists
    if (!pollingEngine) {
      pollingEngine = new RSSPollingEngine();
    }

    let result;

    switch (action) {
      case 'start':
        if (pollingEngine.getStatus().isPolling) {
          return res.status(200).json({
            message: 'RSS polling is already running',
            status: pollingEngine.getStatus()
          });
        }
        
        await pollingEngine.startPolling(interval_minutes);
        result = {
          action: 'started',
          message: `RSS crisis monitoring started (polling every ${interval_minutes} minutes)`,
          status: pollingEngine.getStatus()
        };
        break;

      case 'stop':
        pollingEngine.stopPolling();
        result = {
          action: 'stopped',
          message: 'RSS crisis monitoring stopped',
          status: pollingEngine.getStatus()
        };
        break;

      case 'poll_once':
        console.log('🧪 Manual RSS poll requested...');
        const pollResult = await pollingEngine.pollAllFeeds();
        result = {
          action: 'poll_once',
          message: 'Manual RSS poll completed',
          poll_result: pollResult,
          status: pollingEngine.getStatus()
        };
        break;
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('RSS polling control error:', error);
    return res.status(500).json({ 
      error: 'Failed to control RSS polling',
      message: error.message 
    });
  }
}

/**
 * Cleanup on process exit
 */
process.on('SIGTERM', () => {
  if (pollingEngine) {
    pollingEngine.stopPolling();
  }
});

process.on('SIGINT', () => {
  if (pollingEngine) {
    pollingEngine.stopPolling();
  }
});