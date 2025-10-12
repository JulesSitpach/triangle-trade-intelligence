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

    console.log('[SUPPLIER SOURCING REPORT] Service request data:', {
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
    const reportPrompt = `You are Jorge Ochoa, Mexico supplier sourcing expert. Create a SHORT, actionable report for ${subscriberData.company_name || 'the client'}.

CLIENT NEEDS:
- Product: ${subscriberData.product_description || 'manufacturing'}
- Current suppliers: ${stage1Data.current_suppliers || 'non-USMCA countries'}
- Goal: Find Mexico suppliers for USMCA compliance

SUPPLIERS JORGE FOUND:
${stage3Data.mexico_suppliers}

JORGE'S PLAN:
${stage3Data.relationship_strategy}

Create a 1-2 page report with:

**MEXICO SUPPLIERS WE FOUND (5 companies)**
For each supplier:
- Company name, location, contact
- What they make (match to client needs)
- Certifications (ISO, FDA, etc.)
- Why Jorge recommends them

**WHAT YOU (CLIENT) DO NEXT - 4 WEEK PLAN**
Week 1: [Specific action client takes]
Week 2: [What client needs to do]
Week 3: [Client responsibilities]
Week 4: [Expected outcome]

**WHAT JORGE DOES FOR YOU**
- Contact suppliers in Spanish
- Verify capabilities
- Facilitate introductions
- Negotiate initial terms

**USMCA SAVINGS ESTIMATE**
- Current tariff cost: $${subscriberData.annual_tariff_cost || 'TBD'}
- Estimated savings: $${subscriberData.potential_usmca_savings || 'TBD'}/year
- Timeline to qualification: 3-6 months

Keep it under 500 words. Focus on ACTION, not analysis. Client needs to know: "What do I DO with this info?"`;

    // ✅ AI FALLBACK CHAIN: OpenRouter → Anthropic → Database Cache
    console.log('[SUPPLIER SOURCING REPORT] Calling AI with fallback chain...');

    const aiResult = await executeWithFallback({
      prompt: reportPrompt,
      model: 'anthropic/claude-3-haiku',
      maxTokens: 4000,
      cacheOptions: {
        table: 'supplier_sourcing_reports_cache',
        query: {
          company_name: subscriberData.company_name,
          product_categories: stage1Data.product_categories
        },
        transform: (cached) => cached.report_content
      }
    });

    // Check if AI generation succeeded
    if (!aiResult.success) {
      console.error('[SUPPLIER SOURCING REPORT] All AI services failed:', aiResult);
      return res.status(503).json({
        success: false,
        error: 'Supplier Sourcing report generation failed',
        source: aiResult.source,
        label: aiResult.label,
        troubleshooting: aiResult.troubleshooting,
        message: 'All AI services (OpenRouter, Anthropic) and cache are unavailable. Please check API keys and try again.'
      });
    }

    const reportContent = aiResult.data;
    console.log(`[SUPPLIER SOURCING REPORT] Generated successfully via ${aiResult.source}`);

    // Create email with supplier sourcing strategy report
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const emailSubject = `Mexico Supplier Sourcing Strategy - ${subscriberData.company_name || serviceRequest.client_company} - ${new Date().toLocaleDateString()}`;

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .section { margin-bottom: 30px; }
    .credentials { background: #f0fdf4; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0; }
    .report-content { white-space: pre-wrap; background: #f9f9f9; padding: 20px; border-radius: 5px; }
    .savings-highlight { background: #dcfce7; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🇲🇽 Mexico Supplier Sourcing Strategy Report</h1>
    <p>Professional B2B Supplier Network & USMCA Optimization</p>
  </div>

  <div class="content">
    <div class="credentials">
      <strong>Supplier Sourcing Expert:</strong> Jorge Ochoa<br>
      <strong>Experience:</strong> 4+ years CCVIAL, proven B2B sales track record<br>
      <strong>Expertise:</strong> Consultative B2B sales methodology, Mexico supplier network, bilingual (Spanish/English)<br>
      <strong>Unique Advantage:</strong> Cultural bridge for North American companies, deep CCVIAL connections<br>
      <strong>Report Date:</strong> ${new Date().toLocaleDateString()}
    </div>

    <div class="section">
      <h2>Client Information</h2>
      <p><strong>Company:</strong> ${subscriberData.company_name || serviceRequest.client_company}</p>
      <p><strong>Product Categories:</strong> ${stage1Data.product_categories}</p>
      <p><strong>Current Suppliers:</strong> ${stage1Data.current_suppliers}</p>
      <p><strong>USMCA Goals:</strong> ${stage1Data.usmca_goals}</p>
      <p><strong>Timeline:</strong> ${stage1Data.timeline}</p>
    </div>

    <div class="savings-highlight">
      <h3>USMCA Optimization Opportunity</h3>
      <p><strong>Current USMCA Status:</strong> ${subscriberData.qualification_status || 'Under review'}</p>
      <p><strong>Potential Annual Savings:</strong> $${subscriberData.potential_usmca_savings || 'To be calculated'}</p>
      <p><strong>Current Annual Tariff Cost:</strong> $${subscriberData.annual_tariff_cost || 'N/A'}</p>
      <p><strong>Mexico Suppliers Identified:</strong> ${stage3Data.mexico_suppliers ? 'Multiple qualified suppliers' : 'In progress'}</p>
      <p><strong>Implementation Timeline:</strong> ${stage3Data.implementation_timeline}</p>
    </div>

    <div class="report-content">
      ${reportContent.replace(/\n/g, '<br>')}
    </div>

    <div class="section">
      <h3>Jorge's Personal Supplier Relationship Execution</h3>
      <p>As your Mexico supplier sourcing expert with proven B2B success, I will personally:</p>
      <ul>
        <li>Leverage my CCVIAL network for direct Mexico supplier introductions</li>
        <li>Apply consultative B2B sales methodology for partnership development</li>
        <li>Conduct facility visits and capability assessments in Spanish</li>
        <li>Provide cultural bridge advantage for smooth supplier negotiations</li>
        <li>Use bilingual fluency to ensure clear communication and expectations</li>
        <li>Execute relationship building using 4+ years CCVIAL experience</li>
        <li>Monitor supplier performance and maintain ongoing partnerships</li>
        <li>Optimize USMCA qualification through strategic Mexico sourcing</li>
      </ul>
    </div>

    <div class="section">
      <h3>Why Jorge's Approach Works</h3>
      <p><strong>Proven Track Record:</strong> Consistently exceeded sales targets at CCVIAL using consultative methodology</p>
      <p><strong>Cultural Insider:</strong> Mexican national with deep understanding of supplier relationships</p>
      <p><strong>North American Bridge:</strong> Experience working with North American companies sourcing in Mexico</p>
      <p><strong>B2B Expertise:</strong> Specialized in ${industryContext} sectors with complex supplier relationships</p>
      <p><strong>Network Access:</strong> Direct CCVIAL connections to verified Mexico suppliers</p>
    </div>

    <div class="section">
      <p><em>This supplier sourcing strategy leverages Jorge's proven B2B sales methodology, deep CCVIAL network in Mexico, and cultural bridge advantage. Jorge will personally execute supplier introductions, facility visits, and relationship building to ensure successful Mexico supplier partnerships and USMCA optimization.</em></p>
    </div>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: 'Triangle Trade Intelligence - Supplier Sourcing <triangleintel@gmail.com>',
      to: 'triangleintel@gmail.com',
      subject: emailSubject,
      html: emailBody
    });

    // ✅ SAVE TO DATABASE CACHE for future fallback
    if (aiResult.source === 'openrouter_api' || aiResult.source === 'anthropic_api') {
      try {
        await supabase
          .from('supplier_sourcing_reports_cache')
          .upsert({
            company_name: subscriberData.company_name,
            product_categories: stage1Data.product_categories,
            report_content: reportContent,
            source: aiResult.source,
            cached_at: new Date().toISOString()
          });
        console.log('[SUPPLIER SOURCING REPORT] Saved to cache for future fallback');
      } catch (cacheError) {
        console.error('[SUPPLIER SOURCING REPORT] Cache save failed:', cacheError);
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
          product_categories: stage1Data.product_categories,
          usmca_goals: stage1Data.usmca_goals,
          mexico_suppliers: stage3Data.mexico_suppliers,
          relationship_strategy: stage3Data.relationship_strategy,
          usmca_optimization: stage3Data.usmca_optimization,
          implementation_timeline: stage3Data.implementation_timeline,
          email_sent: true,
          email_to: 'triangleintel@gmail.com',
          completed_at: new Date().toISOString(),
          completed_by: 'Jorge Ochoa - B2B Sales Expert, Mexico Supplier Network Specialist',
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
      message: 'Mexico Supplier Sourcing report generated and sent to triangleintel@gmail.com',
      report_content: reportContent,
      email_subject: emailSubject,
      mexico_suppliers: stage3Data.mexico_suppliers,
      // ✅ TRANSPARENT SOURCE LABELING
      source: aiResult.source,
      label: aiResult.label,
      is_cached: aiResult.is_cached,
      cost_estimate: aiResult.cost_estimate
    });

  } catch (error) {
    console.error('Error generating Supplier Sourcing report:', error);
    return res.status(500).json({
      error: 'Failed to generate supplier sourcing strategy report',
      details: error.message
    });
  }
}
