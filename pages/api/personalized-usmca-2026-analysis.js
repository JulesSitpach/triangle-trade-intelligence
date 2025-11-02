/**
 * PERSONALIZED USMCA 2026 ANALYSIS ENDPOINT
 *
 * Takes user's actual component data and generates personalized analysis
 * of how USMCA 2026 renegotiation affects THEIR supply chain
 */

import PersonalizedUSMCA2026AnalysisService from '../../lib/services/personalized-usmca-2026-analysis-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userProfile } = req.body;

    if (!userProfile) {
      return res.status(400).json({
        error: 'User profile required',
        message: 'userProfile with componentOrigins and tradeVolume required'
      });
    }

    if (!userProfile.componentOrigins || userProfile.componentOrigins.length === 0) {
      return res.status(400).json({
        error: 'Components required',
        message: 'User must have components in their workflow to generate personalized analysis'
      });
    }

    console.log('🔍 Generating personalized USMCA 2026 analysis for:', userProfile.companyName);

    const analysis = await PersonalizedUSMCA2026AnalysisService.generatePersonalizedAnalysis(userProfile);

    return res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('❌ Personalized analysis failed:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to generate personalized analysis',
      message: error.message
    });
  }
}
