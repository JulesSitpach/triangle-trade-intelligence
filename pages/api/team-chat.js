/**
 * TEAM CHAT API: Intelligent Multi-Agent Chatbot System
 * POST /api/team-chat - Process team messages with AI agents
 * Integrates SAM.gov, Comtrade, Census, and OpenRouter APIs
 */

import TeamChatbotOrchestrator from '../../lib/ai/chatbot-orchestrator';

const chatbot = new TeamChatbotOrchestrator();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, sender, context = {}, language = 'english' } = req.body;

    if (!message || !sender) {
      return res.status(400).json({
        error: 'Message and sender are required',
        example: {
          message: "Check SAM registration for ABC Corp",
          sender: "jorge",
          context: { dashboard: "broker" }
        }
      });
    }

    console.log(`🤖 Team chat request from ${sender}: ${message}`);

    // Process message with intelligent agent orchestration
    const response = await chatbot.processTeamMessage(message, sender, { ...context, language });

    // Return structured response
    res.status(200).json({
      success: true,
      response: response.response,
      agent: response.agent,
      confidence: response.confidence,
      data: response.data || {},
      suggestions: response.suggestions || [],
      collaboration: response.collaboration || null,
      timestamp: response.timestamp,
      context: {
        sender,
        dashboard: context.dashboard,
        message_id: generateMessageId()
      }
    });

  } catch (error) {
    console.error('Team chat API error:', error);

    // Return helpful error response
    res.status(500).json({
      success: false,
      error: 'Team chatbot encountered an issue',
      message: 'The team AI is temporarily unavailable. Please try again or contact support.',
      fallback: {
        response: "I'm having trouble processing your request right now. You can try:",
        suggestions: [
          "Check the admin dashboards for recent data",
          "Contact team members directly",
          "Try rephrasing your question"
        ]
      },
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Generate unique message ID for tracking
 */
function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}