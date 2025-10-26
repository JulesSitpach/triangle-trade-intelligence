/**
 * Lightweight HS Code Lookup Endpoint
 * Provides simple HS code suggestions without full AI analysis
 * Used by ComponentOriginsStepEnhanced when user needs quick lookup
 */

import { ClassificationAgent } from '../../lib/agents/classification-agent.js';
import { logDevIssue, DevIssue } from '../../lib/utils/logDevIssue.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productDescription, businessContext } = req.body;

    // Validate required fields
    if (!productDescription || productDescription.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Product description must be at least 3 characters'
      });
    }

    // Use ClassificationAgent for quick HS code lookup
    const agent = new ClassificationAgent();
    const result = await agent.classify(productDescription, {
      businessType: businessContext?.companyType || 'general'
    });

    if (!result.success || !result.data) {
      return res.status(400).json({
        success: false,
        error: 'Could not classify product'
      });
    }

    // Format response to match expected structure
    const suggestions = [{
      hsCode: result.data.hsCode,
      description: result.data.description || productDescription,
      accuracy: Math.round((result.data.confidence || 0.85) * 100),
      reasoning: result.data.explanation || 'AI classification completed',
      source: 'Classification Agent'
    }];

    return res.status(200).json({
      success: true,
      suggestions: suggestions
    });

  } catch (error) {
    console.error('Lightweight HS lookup error:', error);

    await DevIssue.apiError('lightweight_hs_lookup', '/api/lightweight-hs-lookup', error, {
      productDescription: req.body?.productDescription
    });

    return res.status(500).json({
      success: false,
      error: 'HS code lookup failed',
      suggestions: []
    });
  }
}
