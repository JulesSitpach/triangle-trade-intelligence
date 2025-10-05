import { FormAssistantAgent } from '../../../lib/agents/form-assistant-agent.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, fieldName, partialData, userContext } = req.body;

    // Log request for debugging
    if (!action) {
      console.warn('[FormAssistant API] No action provided in request:', req.body);
    }

    const agent = new FormAssistantAgent();

    switch (action) {
      case 'suggest_field':
        if (!fieldName) {
          return res.status(400).json({ error: 'fieldName required' });
        }

        const suggestion = await agent.suggestFieldValue(
          fieldName,
          userContext || {},
          userContext?.certificateHistory || []
        );

        return res.status(200).json(suggestion);

      case 'auto_populate':
        const autoPopulated = await agent.autoPopulateForm(
          partialData || {},
          userContext?.certificateHistory || []
        );

        return res.status(200).json(autoPopulated);

      case 'suggest_from_history':
        if (!fieldName || !userContext?.userId) {
          return res.status(400).json({
            error: 'fieldName and userContext.userId required'
          });
        }

        const historySuggestion = await agent.suggestFromHistory(
          userContext.userId,
          fieldName,
          userContext.certificateHistory || []
        );

        return res.status(200).json(historySuggestion);

      case 'validate_input':
        if (!fieldName || !req.body.value) {
          return res.status(400).json({
            error: 'fieldName and value required'
          });
        }

        const validation = await agent.validateUserInput(
          fieldName,
          req.body.value,
          partialData || {}
        );

        return res.status(200).json(validation);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          validActions: ['suggest_field', 'auto_populate', 'suggest_from_history', 'validate_input']
        });
    }

  } catch (error) {
    console.error('[FormAssistant API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}