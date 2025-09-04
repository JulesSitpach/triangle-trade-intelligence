/**
 * USMCA Thresholds API - Returns regional content thresholds
 * Uses the config file to get threshold data
 */

import { getUSMCAThreshold } from '../../../config/usmca-thresholds.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { businessType, hsCode } = req.query;

  try {
    const threshold = await getUSMCAThreshold(businessType, hsCode);
    
    return res.json({
      success: true,
      threshold: threshold.threshold,
      source: threshold.source,
      rule_type: threshold.rule_type,
      documentation: threshold.documentation
    });
  } catch (error) {
    console.error('Threshold API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get USMCA threshold',
      message: error.message
    });
  }
}