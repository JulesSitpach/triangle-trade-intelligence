import { AgentCoordinator } from '../../../lib/agents/agent-coordinator.js';

/**
 * Agent Orchestration API
 *
 * Coordinates multi-agent collaboration for certificate completion
 *
 * POST /api/agents/orchestrate-certificate
 * {
 *   certificateData: { ...partial certificate data },
 *   userContext: {
 *     userId: string,
 *     certificateHistory: array,
 *     userProfile: object
 *   }
 * }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { certificateData, userContext } = req.body;

    if (!certificateData) {
      return res.status(400).json({
        error: 'certificateData is required'
      });
    }

    console.log('🎭 Agent Orchestration Request:', {
      userId: userContext?.userId,
      fieldsProvided: Object.keys(certificateData).length
    });

    const coordinator = new AgentCoordinator();

    const startTime = Date.now();
    const result = await coordinator.orchestrateCertificateCompletion(
      certificateData,
      userContext || {}
    );
    const duration = Date.now() - startTime;

    console.log(`✅ Orchestration complete in ${duration}ms:`, {
      success: result.success,
      confidence: result.orchestrationSummary?.overallConfidence,
      readyToSubmit: result.orchestrationSummary?.readyToSubmit
    });

    if (!result.success) {
      return res.status(500).json({
        error: 'Orchestration failed',
        details: result.error
      });
    }

    return res.status(200).json({
      success: true,
      orchestrationId: result.orchestrationId,
      duration,
      certificateData: result.certificateData,
      agentResults: result.agentResults,
      orchestrationSummary: result.orchestrationSummary,
      userGuidance: result.userGuidance,
      metadata: {
        timestamp: new Date().toISOString(),
        agentsUsed: ['FormAssistant', 'Classification', 'Validation']
      }
    });

  } catch (error) {
    console.error('❌ Agent Orchestration Error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}