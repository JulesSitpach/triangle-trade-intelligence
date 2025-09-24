import { ClassificationAgent } from '../../../lib/agents/classification-agent.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, productDescription, hsCode, componentOrigins, additionalContext } = req.body;

    const agent = new ClassificationAgent();

    switch (action) {
      case 'suggest_hs_code':
        if (!productDescription) {
          return res.status(400).json({ error: 'productDescription required' });
        }

        const suggestion = await agent.suggestWithConfidenceBreakdown(
          productDescription,
          componentOrigins || []
        );

        return res.status(200).json(suggestion);

      case 'validate_hs_code':
        if (!hsCode || !productDescription) {
          return res.status(400).json({
            error: 'hsCode and productDescription required'
          });
        }

        const validation = await agent.validateHSCode(hsCode, productDescription);

        return res.status(200).json(validation);

      case 'get_alternatives':
        if (!hsCode || !productDescription) {
          return res.status(400).json({
            error: 'hsCode and productDescription required'
          });
        }

        const alternatives = await agent.getAlternativeClassifications(
          productDescription,
          hsCode
        );

        return res.status(200).json(alternatives);

      case 'search_similar':
        if (!productDescription) {
          return res.status(400).json({ error: 'productDescription required' });
        }

        const similarCodes = await agent.searchSimilarHSCodes(productDescription);

        return res.status(200).json({
          success: true,
          data: similarCodes
        });

      default:
        return res.status(400).json({
          error: 'Invalid action',
          validActions: ['suggest_hs_code', 'validate_hs_code', 'get_alternatives', 'search_similar']
        });
    }

  } catch (error) {
    console.error('[Classification API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}