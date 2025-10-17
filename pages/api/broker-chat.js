/**
 * Broker Chat API - AI-Powered Trade Terminology Assistant
 * Haiku AI + Database approach for intelligent, contextual responses
 * ~$0.001 per request, <500ms response time
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, formField, sessionId } = req.body;

  if (!question || question.trim().length < 2) {
    return res.status(400).json({ error: 'Question required' });
  }

  try {
    // Fetch all broker responses from database (source of truth)
    const { data: allResponses, error: dbError } = await supabase
      .from('broker_chat_responses')
      .select('*');

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Failed to load chat responses'
      });
    }

    // AI Agent approach - Haiku understands intent, uses database as source
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://triangle-trade-intelligence.vercel.app",
        "X-Title": "Triangle Trade Intelligence - Broker Chat"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages: [{
          role: "user",
          content: `You are a friendly customs broker with 17 years of experience helping SMB importers understand trade terminology. You use real examples, encourage users, and keep things practical.

**DATABASE OF TRADE TERMS** (your source of truth - never make up information):
${JSON.stringify(allResponses, null, 2)}

**USER QUESTION**: "${question}"
**CURRENT FORM FIELD**: ${formField || 'general workflow'}

**YOUR TASK**:
1. Find the most relevant term(s) from the database that answer the user's question
2. Respond in your friendly broker voice using ONLY information from the database
3. Include the following structure (use database fields):
   - Main explanation (broker_response)
   - Quick tip if relevant (quick_tip)
   - Real example if helpful (real_example)
   - Encouragement (encouragement)
   - Related questions (related_questions array)

**IMPORTANT RULES**:
- Use ONLY information from the database terms above
- If no term matches, say "I don't have that one in my database yet!" and suggest they ask differently
- Keep your friendly, encouraging tone
- Use emojis sparingly (only where database does)
- If the current form field matches a term's form_field, prioritize that term

**FORMAT YOUR RESPONSE AS JSON**:
{
  "broker_response": "your friendly explanation here",
  "quick_tip": "helpful tip or null",
  "real_example": "real example or null",
  "encouragement": "encouraging message",
  "related_questions": ["question 1", "question 2", "question 3"],
  "matched_term": "name of matched term or null"
}

Respond with ONLY the JSON object, no other text.`
        }]
      })
    });

    if (!aiResponse.ok) {
      console.error('OpenRouter API error:', await aiResponse.text());
      return res.status(500).json({
        success: false,
        error: 'AI service unavailable'
      });
    }

    const aiResult = await aiResponse.json();
    const aiMessage = aiResult.choices[0].message.content;

    // Parse AI response (should be JSON)
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiMessage);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiMessage);
      // Fallback to simple response
      parsedResponse = {
        broker_response: aiMessage,
        encouragement: "Let me know if you have more questions! 👍"
      };
    }

    // Log interaction for analytics
    await logInteraction(req, sessionId, question, parsedResponse.matched_term, formField);

    return res.status(200).json({
      success: true,
      response: parsedResponse,
      matchType: 'ai_agent',
      cost: '~$0.001' // Haiku pricing
    });

  } catch (error) {
    console.error('Broker chat error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get response',
      details: error.message
    });
  }
}

// Log user interaction for analytics
async function logInteraction(req, sessionId, question, matchedTerm, formField) {
  try {
    const userId = req.user?.id || null; // If authenticated

    await supabase
      .from('broker_chat_interactions')
      .insert({
        user_id: userId,
        session_id: sessionId,
        question: question,
        response_id: null, // AI-generated, no specific response ID
        form_context: formField,
        matched_term: matchedTerm // Track which term AI matched
      });
  } catch (error) {
    // Non-blocking - don't fail the request if logging fails
    console.error('Failed to log interaction:', error);
  }
}
