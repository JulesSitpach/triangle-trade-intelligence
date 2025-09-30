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

    console.log('[MANUFACTURING FEASIBILITY REPORT] Service request data:', {
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

    // Generate comprehensive manufacturing feasibility report using OpenRouter
    const reportPrompt = `PROFESSIONAL MEXICO MANUFACTURING FEASIBILITY REPORT

BUSINESS CONTEXT:
Company: ${subscriberData.company_name || 'N/A'}
Product: ${subscriberData.product_description || 'N/A'}
Current Manufacturing: ${subscriberData.manufacturing_location || 'N/A'}
Trade Volume: $${subscriberData.trade_volume || 'N/A'}

STAGE 1 - MANUFACTURING STRATEGY:
Manufacturing Type: ${stage1Data.manufacturing_type}
Production Volume: ${stage1Data.production_volume}
Facility Requirements: ${stage1Data.facility_requirements}
Timeline: ${stage1Data.timeline}
Budget Range: ${stage1Data.budget_range}
Priority Level: ${stage1Data.priority_level}

JORGE'S MANUFACTURING ANALYSIS:
Recommended Mexico Locations: ${stage3Data.recommended_locations}
Cost Analysis: ${stage3Data.cost_analysis}
Implementation Roadmap: ${stage3Data.implementation_roadmap}

FINANCIAL CONTEXT:
Current Trade Volume: $${subscriberData.trade_volume || 'N/A'}
USMCA Qualification: ${subscriberData.qualification_status || 'Under review'}
Current Manufacturing Location: ${subscriberData.manufacturing_location || 'N/A'}

COMPLIANCE GAPS:
${Array.isArray(subscriberData.compliance_gaps) ? subscriberData.compliance_gaps.map(gap => `- ${gap}`).join('\n') : 'None identified'}

As Jorge Ochoa, B2B sales expert with proven track record in ${industryContext} sectors exceeding sales targets, bilingual (Spanish/English), deep Mexico manufacturing knowledge through CCVIAL network, with 4+ years experience connecting North American companies with Mexico manufacturing partners:

Generate a professional Mexico Manufacturing Feasibility Report with these sections:

1. EXECUTIVE SUMMARY
   - Manufacturing feasibility objective and business case
   - Mexico manufacturing landscape overview
   - Recommended manufacturing strategy
   - Investment requirements and timeline
   - Expected ROI and USMCA benefits

2. MEXICO MANUFACTURING LANDSCAPE
   - Manufacturing clusters and industrial parks (Monterrey, Guadalajara, Querétaro, Tijuana, Saltillo)
   - Industry-specific manufacturing capabilities
   - Workforce availability and skill levels
   - Infrastructure and logistics advantages
   - Regulatory environment and incentives

3. LOCATION ANALYSIS & RECOMMENDATIONS
   - Specific Mexico locations ranked by suitability
   - Proximity to US markets and transportation corridors
   - Industrial park options with contact information
   - Utility costs (electricity, water, gas) by region
   - Real estate costs and availability
   - Workforce demographics and labor costs

4. COST ANALYSIS & FINANCIAL PROJECTIONS
   - Setup costs (facility, equipment, permits, legal)
   - Monthly operational costs (labor, utilities, rent, compliance)
   - Cost comparison with current manufacturing location
   - USMCA tariff savings projections
   - Total cost of ownership analysis
   - Break-even timeline and ROI calculations

5. IMPLEMENTATION ROADMAP
   - Phase-by-phase implementation plan with timelines
   - Site selection and facility setup milestones
   - Permitting and regulatory compliance steps
   - Equipment procurement and installation timeline
   - Workforce hiring and training schedule
   - Production ramp-up and optimization plan

6. REGULATORY & COMPLIANCE FRAMEWORK
   - Mexican manufacturing regulations and permits
   - Environmental compliance requirements
   - Labor law and employment regulations
   - IMMEX program benefits for maquiladoras
   - USMCA rules of origin compliance
   - Import/export documentation requirements

7. RISK ASSESSMENT & MITIGATION
   - Political and economic risk analysis
   - Supply chain and logistics risks
   - Workforce and labor relations considerations
   - Currency exchange risk management
   - Quality control and standards compliance
   - Business continuity planning

8. USMCA OPTIMIZATION STRATEGY
   - Regional value content (RVC) improvement potential
   - Tariff classification benefits
   - Certificate of origin requirements
   - Supply chain integration with North American operations
   - Long-term USMCA qualification strategy

9. JORGE'S PROFESSIONAL MANUFACTURING NETWORK
Write in first person as Jorge, incorporating his manufacturing intelligence verbatim:

"Using my CCVIAL network and B2B sales experience in Mexico manufacturing, I have assessed the following:

**Recommended Locations:** ${stage3Data.recommended_locations}

**Cost Analysis:** ${stage3Data.cost_analysis}

**Implementation Roadmap:** ${stage3Data.implementation_roadmap}

I will personally facilitate site visits to Monterrey, Guadalajara, Querétaro, or Tijuana industrial parks, introduce you to manufacturing partners from my CCVIAL network, and provide cultural bridge advantage throughout setup. Expected outcome: [SPECIFIC cost savings, production timeline, and USMCA qualification improvement]."

TONE: Direct, implementation-focused, financially-driven. Use actual company name (${subscriberData.company_name}) and Jorge's specific Mexico manufacturing contacts. Show expertise through concrete location recommendations with industrial park names, cost breakdowns, and implementation timelines - not generic advice.

FORBIDDEN PHRASES:
- "comprehensive feasibility study" without specific locations and costs
- "company with undisclosed details" (use ${subscriberData.company_name})
- "additional research required" (provide the feasibility analysis NOW)
- Generic advice like "consider Mexico manufacturing" (name specific cities, industrial parks, partners with contacts)

Format as actionable manufacturing feasibility report with specific Mexico location recommendations, detailed cost analysis with dollar amounts, and quarter-by-quarter implementation roadmap leveraging Jorge's CCVIAL manufacturing network.`;

    console.log('[MANUFACTURING FEASIBILITY REPORT] Calling OpenRouter API...');

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://triangle-intelligence.com',
        'X-Title': 'Triangle Intelligence - Manufacturing Feasibility'
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

    console.log('[MANUFACTURING FEASIBILITY REPORT] OpenRouter response status:', openRouterResponse.status);

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('[MANUFACTURING FEASIBILITY REPORT] OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API call failed: ${openRouterResponse.status} - ${errorText}`);
    }

    const aiResponse = await openRouterResponse.json();
    const reportContent = aiResponse.choices?.[0]?.message?.content || 'Report generation failed';

    // Create email with manufacturing feasibility report
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const emailSubject = `Mexico Manufacturing Feasibility - ${subscriberData.company_name || serviceRequest.client_company} - ${new Date().toLocaleDateString()}`;

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .section { margin-bottom: 30px; }
    .credentials { background: #faf5ff; padding: 15px; border-left: 4px solid #7c3aed; margin: 20px 0; }
    .report-content { white-space: pre-wrap; background: #f9f9f9; padding: 20px; border-radius: 5px; }
    .feasibility-highlight { background: #ede9fe; padding: 15px; border-left: 4px solid #7c3aed; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏭 Mexico Manufacturing Feasibility Report</h1>
    <p>Professional Manufacturing Strategy & Location Analysis</p>
  </div>

  <div class="content">
    <div class="credentials">
      <strong>Manufacturing Feasibility Expert:</strong> Jorge Ochoa<br>
      <strong>Experience:</strong> 4+ years CCVIAL, proven B2B track record in manufacturing sectors<br>
      <strong>Expertise:</strong> Consultative B2B sales methodology, Mexico manufacturing network, bilingual (Spanish/English)<br>
      <strong>Unique Advantage:</strong> Cultural bridge for North American companies, CCVIAL industrial connections<br>
      <strong>Report Date:</strong> ${new Date().toLocaleDateString()}
    </div>

    <div class="section">
      <h2>Client Information</h2>
      <p><strong>Company:</strong> ${subscriberData.company_name || serviceRequest.client_company}</p>
      <p><strong>Manufacturing Type:</strong> ${stage1Data.manufacturing_type}</p>
      <p><strong>Production Volume:</strong> ${stage1Data.production_volume}</p>
      <p><strong>Facility Requirements:</strong> ${stage1Data.facility_requirements}</p>
      <p><strong>Timeline:</strong> ${stage1Data.timeline}</p>
      <p><strong>Priority Level:</strong> ${stage1Data.priority_level}</p>
    </div>

    <div class="feasibility-highlight">
      <h3>Mexico Manufacturing Opportunity</h3>
      <p><strong>Current USMCA Status:</strong> ${subscriberData.qualification_status || 'Under review'}</p>
      <p><strong>Current Manufacturing:</strong> ${subscriberData.manufacturing_location || 'N/A'}</p>
      <p><strong>Recommended Mexico Locations:</strong> ${stage3Data.recommended_locations ? 'Multiple qualified locations identified' : 'In analysis'}</p>
      <p><strong>Cost Analysis:</strong> ${stage3Data.cost_analysis ? 'Complete cost breakdown available' : 'In progress'}</p>
      <p><strong>Implementation Timeline:</strong> ${stage3Data.implementation_roadmap}</p>
    </div>

    <div class="report-content">
      ${reportContent.replace(/\n/g, '<br>')}
    </div>

    <div class="section">
      <h3>Jorge's Personal Manufacturing Setup Execution</h3>
      <p>As your Mexico manufacturing feasibility expert with proven B2B success, I will personally:</p>
      <ul>
        <li>Leverage my CCVIAL network for direct industrial park and partner introductions</li>
        <li>Apply consultative B2B sales methodology for manufacturing partnerships</li>
        <li>Conduct site visits to Monterrey, Guadalajara, Querétaro, and Tijuana facilities</li>
        <li>Provide cultural bridge advantage for smooth negotiations and setup</li>
        <li>Use bilingual fluency to navigate Mexico regulatory and business environment</li>
        <li>Execute facility setup support using 4+ years CCVIAL manufacturing experience</li>
        <li>Coordinate with Mexico attorneys, accountants, and logistics partners</li>
        <li>Monitor implementation progress and provide ongoing optimization support</li>
      </ul>
    </div>

    <div class="section">
      <h3>Why Jorge's Approach Works</h3>
      <p><strong>Proven Track Record:</strong> Consistently exceeded sales targets at CCVIAL using consultative methodology</p>
      <p><strong>Cultural Insider:</strong> Mexican national with deep understanding of manufacturing business culture</p>
      <p><strong>North American Bridge:</strong> Experience helping North American companies establish Mexico manufacturing</p>
      <p><strong>B2B Expertise:</strong> Specialized in ${industryContext} sectors with complex manufacturing requirements</p>
      <p><strong>Network Access:</strong> Direct CCVIAL connections to Mexico industrial parks and manufacturing partners</p>
    </div>

    <div class="section">
      <p><em>This manufacturing feasibility analysis leverages Jorge's proven B2B sales methodology, deep CCVIAL network in Mexico manufacturing, and cultural bridge advantage. Jorge will personally execute location selection, partner introductions, and provide hands-on implementation support to ensure successful Mexico manufacturing establishment.</em></p>
    </div>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: 'Triangle Intelligence - Manufacturing Feasibility <triangleintel@gmail.com>',
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
          manufacturing_type: stage1Data.manufacturing_type,
          production_volume: stage1Data.production_volume,
          recommended_locations: stage3Data.recommended_locations,
          cost_analysis: stage3Data.cost_analysis,
          implementation_roadmap: stage3Data.implementation_roadmap,
          email_sent: true,
          email_to: 'triangleintel@gmail.com',
          completed_at: new Date().toISOString(),
          completed_by: 'Jorge Ochoa - B2B Sales Expert, Mexico Manufacturing Specialist'
        }
      })
      .eq('id', serviceRequestId);

    if (updateError) {
      console.error('Error updating service request:', updateError);
    }

    return res.status(200).json({
      success: true,
      message: 'Mexico Manufacturing Feasibility report generated and sent to triangleintel@gmail.com',
      report_content: reportContent,
      email_subject: emailSubject,
      recommended_locations: stage3Data.recommended_locations
    });

  } catch (error) {
    console.error('Error generating Manufacturing Feasibility report:', error);
    return res.status(500).json({
      error: 'Failed to generate manufacturing feasibility report',
      details: error.message
    });
  }
}
