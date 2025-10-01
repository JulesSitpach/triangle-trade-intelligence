import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { serviceRequestId, stage1Data, stage3Data } = req.body;

    if (!serviceRequestId || !stage1Data || !stage3Data) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Fetch service request to get subscriber data
    const { data: serviceRequest, error: fetchError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', serviceRequestId)
      .single();

    if (fetchError || !serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    // Data is stored in service_details (JSONB column) - not subscriber_data
    const subscriberData = serviceRequest.service_details || serviceRequest.subscriber_data || {};

    console.log('[MARKET ENTRY REPORT] Service request data:', {
      id: serviceRequest.id,
      company: serviceRequest.company_name,
      hasServiceDetails: !!serviceRequest.service_details,
      hasSubscriberData: !!serviceRequest.subscriber_data,
      subscriberDataKeys: Object.keys(subscriberData),
      companyName: subscriberData.company_name,
      productDescription: subscriberData.product_description
    });

    // Determine industry context from subscriber data
    const industryContext = subscriberData.product_category
      || subscriberData.industry_sector
      || (subscriberData.product_description ? `${subscriberData.product_description}` : null)
      || 'international trade';

    // Generate comprehensive market entry report using OpenRouter
    const reportPrompt = `PROFESSIONAL MEXICO MARKET ENTRY STRATEGY REPORT

BUSINESS CONTEXT:
Company: ${subscriberData.company_name || 'N/A'}
Product: ${subscriberData.product_description || 'N/A'}
Current Operations: ${subscriberData.manufacturing_location || 'N/A'}
Trade Volume: $${subscriberData.trade_volume || 'N/A'}

STAGE 1 - MEXICO MARKET STRATEGY:
Target Products for Mexico Market: ${stage1Data.target_products}
Target Markets: ${stage1Data.target_markets}
Current Presence: ${stage1Data.current_presence}
Market Entry Timeline: ${stage1Data.timeline}
Budget Range: ${stage1Data.budget_range}
Priority Level: ${stage1Data.priority_level}

JORGE'S MARKET ENTRY EXPERTISE:
Mexico Market Assessment: ${stage3Data.market_assessment}
Key Relationships to Build: ${stage3Data.key_relationships}
Entry Strategy: ${stage3Data.entry_strategy}

FINANCIAL CONTEXT:
Current Trade Volume: $${subscriberData.trade_volume || 'N/A'}
USMCA Qualification: ${subscriberData.qualification_status || 'Under review'}
Market Opportunity Priority: ${stage1Data.priority_level}

COMPLIANCE GAPS:
${Array.isArray(subscriberData.compliance_gaps) ? subscriberData.compliance_gaps.map(gap => `- ${gap}`).join('\n') : 'None identified'}

As Jorge Ochoa, B2B sales expert with proven track record in ${industryContext} sectors exceeding sales targets, bilingual (Spanish/English), cultural bridge for North American companies, with deep Mexico market knowledge:

Generate a professional Market Entry Strategy Report with these sections:

1. EXECUTIVE SUMMARY
   - Market entry objective and business opportunity
   - Mexico market landscape overview
   - Recommended entry strategy
   - Revenue potential and timeline
   - Investment required and expected ROI

2. MEXICO MARKET ANALYSIS
   - Market size and growth trends
   - Customer segments and buying behavior
   - Demand drivers and market dynamics
   - Regulatory environment and compliance requirements
   - Cultural and business practice considerations

3. COMPETITIVE LANDSCAPE
   - Major competitors and market share analysis
   - Competitive advantages and disadvantages
   - Market positioning opportunities
   - Differentiation strategy recommendations
   - Pricing analysis and strategy

4. ENTRY STRATEGY RECOMMENDATION
   - Recommended market entry mode (direct sales, distributor, joint venture, etc.)
   - Phase-by-phase implementation plan
   - Geographic market prioritization (Mexico City, Monterrey, Guadalajara, etc.)
   - Channel strategy (B2B, B2C, hybrid)
   - Partnership and alliance opportunities

5. DISTRIBUTION & SALES CHANNELS
   - Optimal distribution channel analysis
   - Partner/distributor identification and selection criteria
   - Sales team structure recommendations
   - Logistics and supply chain considerations
   - E-commerce and digital presence strategy

6. MARKETING & BRAND POSITIONING
   - Brand positioning for Mexico market
   - Marketing message adaptation for Mexican culture
   - Promotional strategy and tactics
   - Digital marketing and social media approach
   - Trade show and industry event participation

7. REGULATORY & COMPLIANCE FRAMEWORK
   - Import/export regulations and documentation
   - Product certifications and standards (NOM, etc.)
   - Tax and customs considerations
   - USMCA benefits and compliance
   - Legal entity and business structure recommendations

8. FINANCIAL PROJECTIONS & ROI
   - 3-year revenue projections
   - Market entry investment requirements
   - Operating cost structure in Mexico
   - Break-even analysis and timeline
   - Expected ROI and profitability metrics

9. RISK ASSESSMENT & MITIGATION
   - Political and economic risks
   - Currency exchange risk management
   - Competition and market acceptance risks
   - Operational and supply chain risks
   - Mitigation strategies for each risk category

10. IMPLEMENTATION ROADMAP
   - Phase 1: Market validation and partnership development (Months 1-3)
   - Phase 2: Legal entity setup and regulatory compliance (Months 2-4)
   - Phase 3: Sales team hiring and training (Months 3-5)
   - Phase 4: Pilot launch in priority markets (Months 5-7)
   - Phase 5: Full market expansion and optimization (Months 7-18)

11. JORGE'S PROFESSIONAL VALIDATION
Write in first person as Jorge, incorporating his market entry expertise verbatim:

"With my Mexico trade network and B2B sales experience, I have assessed the following:

**Market Assessment:** ${stage3Data.market_assessment}

**Key Relationships:** ${stage3Data.key_relationships}

**Entry Strategy:** ${stage3Data.entry_strategy}

Based on my professional network, the client should immediately contact [SPECIFIC distributor/partner from my relationships]. I will personally facilitate the introduction and first meeting. Expected outcome: [SPECIFIC revenue projection and market share from entry strategy]."

TONE: Direct, relationship-focused, revenue-driven. Use actual company name (${subscriberData.company_name}) and Jorge's specific Mexico partner names. Show expertise through concrete relationship introductions and market entry steps, not generic advice.

FORBIDDEN PHRASES:
- "comprehensive market analysis" without specific partner names and revenue targets
- "company with undisclosed details" (use ${subscriberData.company_name})
- "requires further research" (provide the partner introductions NOW)
- Generic advice like "build relationships" (name specific Mexico distributors/partners with contacts)

Format as actionable market entry report with specific Mexico partner introductions from Jorge's network, revenue projections from market assessment, and quarter-by-quarter entry strategy.`;

    console.log('[MARKET ENTRY REPORT] Calling OpenRouter API...');

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://triangle-intelligence.com',
        'X-Title': 'Triangle Intelligence - Market Entry'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{
          role: 'user',
          content: reportPrompt
        }],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    console.log('[MARKET ENTRY REPORT] OpenRouter response status:', openRouterResponse.status);

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('[MARKET ENTRY REPORT] OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API call failed: ${openRouterResponse.status} - ${errorText}`);
    }

    const aiResponse = await openRouterResponse.json();
    const reportContent = aiResponse.choices?.[0]?.message?.content;

    if (!reportContent) {
      throw new Error('OpenRouter API returned empty response. No report content generated.');
    }

    // Create email with market entry strategy report
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const emailSubject = `Mexico Market Entry Strategy - ${subscriberData.company_name || serviceRequest.client_company} - ${new Date().toLocaleDateString()}`;

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .section { margin-bottom: 30px; }
    .credentials { background: #eff6ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
    .report-content { white-space: pre-wrap; background: #f9f9f9; padding: 20px; border-radius: 5px; }
    .opportunity-highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Mexico Market Entry Strategy Report</h1>
    <p>Professional B2B Sales & Relationship Building</p>
  </div>

  <div class="content">
    <div class="credentials">
      <strong>Market Entry Expert:</strong> Jorge Ochoa<br>
      <strong>Experience:</strong> 4+ years CCVIAL, proven track record exceeding sales targets<br>
      <strong>Expertise:</strong> Consultative B2B sales methodology, Mexico market knowledge, bilingual (Spanish/English)<br>
      <strong>Unique Advantage:</strong> Cultural bridge for North American companies, deep local network<br>
      <strong>Report Date:</strong> ${new Date().toLocaleDateString()}
    </div>

    <div class="section">
      <h2>Client Information</h2>
      <p><strong>Company:</strong> ${subscriberData.company_name || serviceRequest.client_company}</p>
      <p><strong>Target Products:</strong> ${stage1Data.target_products}</p>
      <p><strong>Target Markets:</strong> ${stage1Data.target_markets}</p>
      <p><strong>Current Presence:</strong> ${stage1Data.current_presence}</p>
      <p><strong>Priority Level:</strong> ${stage1Data.priority_level}</p>
    </div>

    <div class="opportunity-highlight">
      <h3>Mexico Market Opportunity</h3>
      <p><strong>Market Entry Priority:</strong> ${stage1Data.priority_level}</p>
      <p><strong>Timeline:</strong> ${stage1Data.timeline}</p>
      <p><strong>Expected Market Share:</strong> ${stage3Data.expected_market_share || 'To be determined'}</p>
      <p><strong>Revenue Projections:</strong> ${stage3Data.revenue_projections || 'Included in detailed report'}</p>
      <p><strong>Recommended Entry Strategy:</strong> ${stage3Data.entry_strategy}</p>
    </div>

    <div class="report-content">
      ${reportContent.replace(/\n/g, '<br>')}
    </div>

    <div class="section">
      <h3>Jorge's Personal Market Entry Execution</h3>
      <p>As your market entry expert with proven B2B sales success, I will personally:</p>
      <ul>
        <li>Leverage my Mexico market network for strategic introductions</li>
        <li>Apply consultative B2B sales methodology proven to exceed targets</li>
        <li>Build relationships with key distributors, partners, and customers</li>
        <li>Provide cultural bridge advantage for smooth North American → Mexico transition</li>
        <li>Use bilingual fluency to navigate Mexican business culture effectively</li>
        <li>Execute relationship building using 4+ years CCVIAL experience</li>
        <li>Provide ongoing market intelligence and strategy adaptation</li>
        <li>Monitor performance and course-correct based on market feedback</li>
      </ul>
    </div>

    <div class="section">
      <h3>Why Jorge's Approach Works</h3>
      <p><strong>Proven Track Record:</strong> Consistently exceeded sales targets at CCVIAL using consultative methodology</p>
      <p><strong>Cultural Insider:</strong> Mexican national with deep understanding of business culture and practices</p>
      <p><strong>North American Bridge:</strong> Experience working with North American companies entering Mexico</p>
      <p><strong>B2B Expertise:</strong> Specialized in ${industryContext} sectors with complex B2B sales cycles</p>
      <p><strong>Network Access:</strong> Established relationships with key players across Mexico markets</p>
    </div>

    <div class="section">
      <p><em>This market entry strategy leverages Jorge's proven B2B sales methodology, deep Mexico market knowledge, and cultural bridge advantage. Jorge will personally execute relationship building, partnership development, and provide hands-on market entry support to ensure successful Mexico market penetration.</em></p>
    </div>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: 'Triangle Intelligence - Market Entry <triangleintel@gmail.com>',
      to: 'triangleintel@gmail.com',
      subject: emailSubject,
      html: emailBody
    });

    // Update service request with completion data
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({
        status: 'completed',
        completion_data: {
          report_generated: true,
          report_content: reportContent,
          target_products: stage1Data.target_products,
          target_markets: stage1Data.target_markets,
          market_assessment: stage3Data.market_assessment,
          key_relationships: stage3Data.key_relationships,
          entry_strategy: stage3Data.entry_strategy,
          email_sent: true,
          email_to: 'triangleintel@gmail.com',
          completed_at: new Date().toISOString(),
          completed_by: 'Jorge Ochoa - B2B Sales Expert, Mexico Market Specialist'
        }
      })
      .eq('id', serviceRequestId);

    if (updateError) {
      console.error('Error updating service request:', updateError);
    }

    return res.status(200).json({
      success: true,
      message: 'Market Entry Strategy report generated and sent to triangleintel@gmail.com',
      report_content: reportContent,
      email_subject: emailSubject,
      entry_strategy: stage3Data.entry_strategy
    });

  } catch (error) {
    console.error('Error generating Market Entry report:', error);
    return res.status(500).json({
      error: 'Failed to generate market entry strategy report',
      details: error.message
    });
  }
}