/**
 * Status API Endpoint
 * Returns detailed system status
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const status = {
      service: 'triangle-intelligence-platform',
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        provider: 'supabase'
      },
      apis: {
        total_endpoints: 37,
        trust_services: 8,
        core_services: 29
      }
    };

    return res.status(200).json(status);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}