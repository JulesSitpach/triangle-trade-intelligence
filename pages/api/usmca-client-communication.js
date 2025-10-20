/**
 * USMCA Client Communication API - Phase 1 Quick Win
 * AI drafts Jorge's client follow-up email in business-friendly language
 *
 * Input: Technical findings from Cristina, client data, roadmap
 * Output: Business-friendly email draft for Jorge to send
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { serviceRequestId, subscriberData, cristinaFindings, roadmap } = req.body;

    if (!subscriberData || !cristinaFindings) {
      return res.status(400).json({ error: 'Subscriber data and findings are required' });
    }

    // Build client communication prompt
    const communicationPrompt = `You are Jorge, a professional B2B trade consultant drafting a follow-up email to a client after their USMCA certificate service.

CLIENT INFORMATION:
- Company: ${subscriberData.company_name}
- Contact: ${subscriberData.contact_person || 'Client'}
- Product: ${subscriberData.product_description}
- USMCA Status: ${subscriberData.qualification_status}
- Potential Annual Savings: $${subscriberData.potential_usmca_savings?.toLocaleString() || 'To be calculated'}

TECHNICAL FINDINGS (From Cristina):
- Professional Assessment: ${cristinaFindings.compliance_confidence_level?.replace(/_/g, ' ') || 'Certificate validated'}
- Risk Level: ${cristinaFindings.customs_audit_risk || 'Standard monitoring'}
- Key Recommendations: ${cristinaFindings.professional_recommendations || 'Continue current practices'}

IMPLEMENTATION ROADMAP SUMMARY:
${roadmap ? `- Executive Summary: ${roadmap.executive_summary}
- First 30 Days Focus: ${roadmap.first_30_days?.objectives?.join(', ') || 'Documentation organization'}
- Expected ROI Timeline: ${roadmap.cost_benefit_projection?.roi_timeline || '3-6 months'}
- Annual Savings Potential: ${roadmap.cost_benefit_projection?.annual_savings_potential || '$50,000+'}` : 'Roadmap being finalized'}

Draft warm, action-oriented email focusing on business impact (savings, risk reduction). Keep concise (3-4 paragraphs) with clear next steps.

Return JSON:
{
  "subject_line": "Compelling subject line",
  "greeting": "Hi [Contact Name],",
  "body_paragraphs": [
    "Paragraph 1: Opening with good news/key finding",
    "Paragraph 2: Business impact (savings, risk reduction, competitive advantage)",
    "Paragraph 3: Next steps and implementation timeline",
    "Paragraph 4: Call to action and support offer"
  ],
  "closing": "Best regards,\\nBusiness Development Specialist\\nMexico Trade Specialist\\nTriangle Trade Intelligence",
  "ps_note": "Optional P.S. with urgency or value reminder"
}`;

    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://triangle-trade-intelligence.vercel.app',
        'X-Title': 'Triangle Trade Intelligence - Client Communication Draft'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-haiku-4.5',
        messages: [
          {
            role: 'user',
            content: communicationPrompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1000
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API Error:', errorText);
      throw new Error(`OpenRouter API failed: ${openRouterResponse.status}`);
    }

    const aiResult = await openRouterResponse.json();
    const aiContent = aiResult.choices[0].message.content;

    // Parse AI response
    let emailDraft;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        emailDraft = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback email template
        emailDraft = {
          subject_line: `Your USMCA Certificate is Ready - ${subscriberData.company_name}`,
          greeting: `Hi ${subscriberData.contact_person || 'there'},`,
          body_paragraphs: [
            `Great news! Cristina has completed the professional review of your USMCA certificate for ${subscriberData.product_description}.`,
            `The bottom line: Your ${subscriberData.qualification_status === 'QUALIFIED' ? 'products qualify for USMCA benefits' : 'we\'ve identified opportunities to improve your USMCA qualification'}, which could save you up to $${subscriberData.potential_usmca_savings?.toLocaleString() || '50,000'} annually in tariff costs.`,
            `Next steps are straightforward: I've attached a 30/60/90 day implementation roadmap to guide you. The first 30 days focus on organizing your compliance documentation - something you can start this week.`,
            `I'm here to help you implement this. Let's schedule a 15-minute call this week to walk through the roadmap and answer any questions. Does Thursday or Friday work better for you?`
          ],
          closing: "Best regards,\nBusiness Development Specialist\nMexico Trade Specialist\nTriangle Trade Intelligence\nPhone: [Your Number]\nEmail: jorge@triangleintel.com",
          ps_note: "P.S. The sooner we implement, the faster you'll see those tariff savings hit your bottom line."
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI email:', parseError);
      emailDraft = {
        subject_line: `USMCA Certificate Update - ${subscriberData.company_name}`,
        greeting: `Hi ${subscriberData.contact_person || 'there'},`,
        body_paragraphs: [
          "Your USMCA certificate service has been completed by our team.",
          "Please find the attached certificate and implementation recommendations.",
          "Let me know if you have any questions or need clarification on the next steps.",
          "I'm available for a call this week to discuss the details."
        ],
        closing: "Best regards,\nBusiness Development Specialist\nTriangle Trade Intelligence",
        ps_note: ""
      };
    }

    // Add metadata
    emailDraft.generated_timestamp = new Date().toISOString();
    emailDraft.generated_by = 'AI (Claude Haiku)';
    emailDraft.service_request_id = serviceRequestId;
    emailDraft.ready_to_send = false; // Jorge must review before sending
    emailDraft.instructions_for_jorge = "Review this draft, personalize it with your voice, add specific details from your conversations with the client, then send.";

    return res.status(200).json({
      success: true,
      email_draft: emailDraft
    });

  } catch (error) {
    console.error('Client communication error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      fallback_email: {
        subject_line: `USMCA Certificate Completed - ${subscriberData?.company_name || 'Your Company'}`,
        greeting: "Hi there,",
        body_paragraphs: [
          "Your USMCA certificate service has been completed.",
          "Please review the attached documentation.",
          "Let me know if you have questions.",
          "Happy to schedule a call to discuss."
        ],
        closing: "Best regards,\nBusiness Development Specialist",
        ps_note: ""
      }
    });
  }
}
