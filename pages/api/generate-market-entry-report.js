import { createClient } from '@supabase/supabase-js';
import { executeWithFallback } from '../../lib/utils/ai-fallback-chain.js';

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

    // Generate CLIENT-FOCUSED action plan (not AI theater)
    const reportPrompt = `You are Business Development Specialist, Mexico market entry expert. Create a SHORT, actionable report for ${subscriberData.company_name || 'the client'}.

CLIENT NEEDS:
- Product: ${subscriberData.product_description || 'product/service'}
- Goal: Enter Mexico market
- Target: ${stage1Data.target_markets || 'Mexico market'}

MARKET OPPORTUNITIES JORGE RESEARCHED:
${stage3Data.market_assessment}

CLIENT DIY PLAN:
${stage3Data.key_relationships}

JORGE'S HOURLY SERVICES:
${stage3Data.entry_strategy}

Create a 1-2 page report with:

**MEXICO MARKET OPPORTUNITIES WE FOUND (3-4 opportunities)**
For each opportunity:
- Market sector/segment
- Market size and growth
- Competition level
- Entry barriers

**WHAT YOU (CLIENT) DO NEXT - 4 WEEK PLAN**
Week 1: [Specific action client takes]
Week 2: [What client needs to do]
Week 3: [Client responsibilities]
Week 4: [Expected outcome]

**WHAT JORGE DOES FOR YOU**
- Local partnership introductions
- Regulatory guidance in Spanish
- Market launch coordination
- Cultural bridge support

**REVENUE & INVESTMENT ESTIMATE**
- Market opportunity: $[amount]
- Entry investment: $[amount]
- Year 1 revenue potential: $[amount]
- Timeline to first revenue: [months]

Keep it under 500 words. Focus on ACTION, not analysis. Client needs to know: "What do I DO with this info?"`;

    // ✅ AI FALLBACK CHAIN: OpenRouter → Anthropic → Database Cache
    console.log('[MARKET ENTRY REPORT] Calling AI with fallback chain...');

    const aiResult = await executeWithFallback({
      prompt: reportPrompt,
      model: 'anthropic/claude-haiku-4.5',
      maxTokens: 4000,
      cacheOptions: {
        table: 'market_entry_reports_cache',
        query: {
          company_name: subscriberData.company_name,
          target_markets: stage1Data.target_markets
        },
        transform: (cached) => cached.report_content
      }
    });

    // Check if AI generation succeeded
    if (!aiResult.success) {
      console.error('[MARKET ENTRY REPORT] All AI services failed:', aiResult);
      return res.status(503).json({
        success: false,
        error: 'Market Entry report generation failed',
        source: aiResult.source,
        label: aiResult.label,
        troubleshooting: aiResult.troubleshooting,
        message: 'All AI services (OpenRouter, Anthropic) and cache are unavailable. Please check API keys and try again.'
      });
    }

    const reportContent = aiResult.data;
    console.log(`[MARKET ENTRY REPORT] Generated successfully via ${aiResult.source}`);

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
      <strong>Market Entry Expert:</strong> Business Development Specialist<br>
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
      from: 'Triangle Trade Intelligence - Market Entry <triangleintel@gmail.com>',
      to: 'triangleintel@gmail.com',
      subject: emailSubject,
      html: emailBody
    });

    // ✅ SAVE TO DATABASE CACHE for future fallback
    if (aiResult.source === 'openrouter_api' || aiResult.source === 'anthropic_api') {
      try {
        await supabase
          .from('market_entry_reports_cache')
          .upsert({
            company_name: subscriberData.company_name,
            target_markets: stage1Data.target_markets,
            report_content: reportContent,
            source: aiResult.source,
            cached_at: new Date().toISOString()
          });
        console.log('[MARKET ENTRY REPORT] Saved to cache for future fallback');
      } catch (cacheError) {
        console.error('[MARKET ENTRY REPORT] Cache save failed:', cacheError);
        // Non-blocking - don't fail the request
      }
    }

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
          completed_by: 'Business Development Specialist - B2B Sales Expert, Mexico Market Specialist',
          // ✅ AI SOURCE TRACKING
          ai_source: aiResult.source,
          ai_label: aiResult.label,
          ai_cost_estimate: aiResult.cost_estimate
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
      entry_strategy: stage3Data.entry_strategy,
      // ✅ TRANSPARENT SOURCE LABELING
      source: aiResult.source,
      label: aiResult.label,
      is_cached: aiResult.is_cached,
      cost_estimate: aiResult.cost_estimate
    });

  } catch (error) {
    console.error('Error generating Market Entry report:', error);
    return res.status(500).json({
      error: 'Failed to generate market entry strategy report',
      details: error.message
    });
  }
}