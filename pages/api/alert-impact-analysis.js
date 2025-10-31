/**
 * ALERT IMPACT ANALYSIS API ENDPOINT
 * Server-side handler for generating strategic alert impact analysis
 *
 * This must be server-side because it needs access to API keys
 */

import AlertImpactAnalysisService from '../../lib/services/alert-impact-analysis-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { existingAnalysis, consolidatedAlerts, userProfile } = req.body;

    // Validate required fields
    if (!consolidatedAlerts || consolidatedAlerts.length === 0) {
      return res.status(400).json({
        error: 'No alerts provided',
        message: 'consolidatedAlerts array is required'
      });
    }

    if (!userProfile) {
      return res.status(400).json({
        error: 'User profile required',
        message: 'userProfile object is required'
      });
    }

    console.log('🔍 Generating alert impact analysis for:', userProfile.companyName || 'Unknown company');

    // Generate analysis using the service
    const analysis = await AlertImpactAnalysisService.generateAlertImpact(
      existingAnalysis || {},
      consolidatedAlerts,
      userProfile
    );

    console.log('✅ Alert impact analysis generated successfully');

    return res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('❌ Alert impact analysis failed:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to generate alert impact analysis',
      message: error.message
    });
  }
}
