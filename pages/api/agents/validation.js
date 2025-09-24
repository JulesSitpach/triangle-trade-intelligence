import { ValidationAgent } from '../../../lib/agents/validation-agent.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, certificateData } = req.body;

    if (!certificateData) {
      return res.status(400).json({ error: 'certificateData required' });
    }

    const agent = new ValidationAgent();

    switch (action) {
      case 'validate_certificate':
        const validation = await agent.validateCertificate(certificateData);
        return res.status(200).json(validation);

      case 'get_summary':
        const summary = await agent.getValidationSummary(certificateData);
        return res.status(200).json(summary);

      case 'check_required_fields':
        const requiredCheck = agent.checkRequiredFields(certificateData);
        return res.status(200).json({
          success: true,
          data: requiredCheck
        });

      case 'check_usmca_compliance':
        const usmcaCheck = await agent.checkUSMCACompliance(certificateData);
        return res.status(200).json({
          success: true,
          data: usmcaCheck
        });

      default:
        return res.status(400).json({
          error: 'Invalid action',
          validActions: ['validate_certificate', 'get_summary', 'check_required_fields', 'check_usmca_compliance']
        });
    }

  } catch (error) {
    console.error('[Validation API] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}