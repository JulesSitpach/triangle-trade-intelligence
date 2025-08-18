import { PartnershipChatBot } from '../../../lib/partnership-swarm-agents';
import productionLogger from '../../../lib/utils/production-logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, sessionId, language = 'en' } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Initialize Partnership ChatBot
    const chatBot = new PartnershipChatBot();

    // Get session context (could be enhanced with user auth)
    const sessionContext = {
      sessionId,
      language,
      timestamp: new Date().toISOString()
    };

    // Process the message through our partnership agents
    const botResponse = await chatBot.handleMessage(question, sessionContext);

    // Log the interaction
    productionLogger.log('PARTNERSHIP_CHAT', {
      sessionId,
      question: question.substring(0, 100), // First 100 chars for privacy
      responseLength: botResponse.length,
      language
    });

    return res.status(200).json({
      success: true,
      response: botResponse,
      sessionId,
      timestamp: new Date().toISOString(),
      agent: 'partnership_specialist'
    });

  } catch (error) {
    console.error('Partnership chat error:', error);
    
    productionLogger.log('PARTNERSHIP_CHAT_ERROR', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      response: `🤝 Mexican Partnership Specialist

I'm temporarily experiencing technical difficulties. However, I can still help you with:

💰 **Commission Calculations** - Share your deal details
🎯 **Partner Matching** - Tell me the industry and location  
📊 **Performance Analytics** - Request pipeline analysis
🔍 **Lead Qualification** - Provide client information

Please try your question again, or contact technical support if the issue persists.

¡Estoy aquí para ayudarte con partnerships mexicanos!`
    });
  }
}