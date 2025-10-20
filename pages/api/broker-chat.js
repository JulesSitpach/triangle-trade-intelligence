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
        model: "anthropic/claude-sonnet-4.5", // UPGRADED: Real-time SMB advice needs quality responses
        messages: [{
          role: "user",
          content: `Help SMB importer understand trade terminology using the database below. Respond in friendly, encouraging broker tone.

TRADE TERMS DATABASE (use only this information):
${JSON.stringify(allResponses, null, 2)}

User Question: "${question}"
Current Context: ${formField || 'general workflow'}

Return JSON only:
{
  "broker_response": "Friendly explanation using database terms (prioritize form_field match if relevant)",
  "quick_tip": "Helpful tip or null",
  "real_example": "Real example or null",
  "encouragement": "Encouraging message",
  "related_questions": ["Related question 1", "Related question 2", "Related question 3"],
  "matched_term": "Name of matched term or null"
}

If no match: acknowledge and suggest related terms.`
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

    // Parse AI response (should be JSON) - Multi-strategy extraction
    let parsedResponse;
    try {
      // Strategy 1: Direct JSON parse
      if (aiMessage.trim().startsWith('{')) {
        parsedResponse = JSON.parse(aiMessage);
      } else {
        // Strategy 2: Extract from code block
        const codeBlockMatch = aiMessage.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          parsedResponse = JSON.parse(codeBlockMatch[1]);
        } else {
          // Strategy 3: Find JSON between first { and last }
          const firstBrace = aiMessage.indexOf('{');
          const lastBrace = aiMessage.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonString = aiMessage.substring(firstBrace, lastBrace + 1);
            parsedResponse = JSON.parse(jsonString);
          } else {
            throw new Error('No JSON found in response');
          }
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiMessage.substring(0, 200));
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
