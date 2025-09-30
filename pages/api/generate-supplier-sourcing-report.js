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

    // Generate comprehensive supplier sourcing report using OpenRouter
    const reportPrompt = `PROFESSIONAL MEXICO SUPPLIER SOURCING REPORT

BUSINESS CONTEXT:
Company: ${subscriberData.company_name || 'N/A'}
Product: ${subscriberData.product_description || 'N/A'}
Current Manufacturing: ${subscriberData.manufacturing_location || 'N/A'}
Trade Volume: $${subscriberData.trade_volume || 'N/A'}

STAGE 1 - USMCA SOURCING STRATEGY:
Target Product Categories: ${stage1Data.product_categories}
Current Supplier Countries: ${stage1Data.current_suppliers}
USMCA Qualification Goals: ${stage1Data.usmca_goals}
Timeline: ${stage1Data.timeline}
Budget Range: ${stage1Data.budget_range}

JORGE'S SUPPLIER INTELLIGENCE:
Mexico Suppliers Identified: ${stage3Data.mexico_suppliers}
Relationship Building Strategy: ${stage3Data.relationship_strategy}
USMCA Optimization Plan: ${stage3Data.usmca_optimization}
Implementation Timeline: ${stage3Data.implementation_timeline}

FINANCIAL CONTEXT:
Current Trade Volume: $${subscriberData.trade_volume || 'N/A'}
USMCA Qualification: ${subscriberData.qualification_status || 'Under review'}
Annual Tariff Cost: $${subscriberData.annual_tariff_cost || 'N/A'}
Potential USMCA Savings: $${subscriberData.potential_usmca_savings || 'N/A'}

COMPLIANCE GAPS:
${Array.isArray(subscriberData.compliance_gaps) ? subscriberData.compliance_gaps.map(gap => `- ${gap}`).join('\n') : 'None identified'}

As Jorge Ochoa, B2B sales expert with proven track record in ${industryContext} sectors exceeding sales targets, bilingual (Spanish/English), deep Mexico supplier network through CCVIAL connections, with 4+ years experience in consultative B2B sales methodology:

Generate a professional Mexico Supplier Sourcing Report with these sections:

1. EXECUTIVE SUMMARY
   - Supplier sourcing objective and USMCA benefits
   - Mexico supplier landscape for target products
   - Recommended sourcing strategy
   - Cost savings and timeline
   - USMCA qualification improvement

2. MEXICO SUPPLIER MARKET ANALYSIS
   - Supplier availability and capabilities for target products
   - Manufacturing clusters in Mexico (Monterrey, Guadalajara, Querétaro, Tijuana)
   - Quality standards and certifications (ISO, industry-specific)
   - Pricing competitiveness vs. current suppliers
   - Lead times and logistics considerations

3. SUPPLIER IDENTIFICATION & VETTING
   - Specific Mexico suppliers identified (company names and contacts)
   - Capabilities assessment for each supplier
   - Quality certifications and compliance status
   - Production capacity and scalability
   - Financial stability and business history

4. USMCA OPTIMIZATION STRATEGY
   - Current regional value content (RVC) calculation
   - Target RVC improvement with Mexico sourcing
   - Product categories to shift to Mexico suppliers
   - USMCA qualification timeline and milestones
   - Tariff savings projections ($$ amounts)

5. RELATIONSHIP BUILDING & NEGOTIATION
   - Jorge's B2B sales methodology for supplier partnerships
   - Cultural considerations for Mexico supplier relationships
   - Negotiation strategy and key terms
   - Quality assurance and performance metrics
   - Long-term partnership development approach

6. IMPLEMENTATION ROADMAP
   - Phase 1: Initial supplier contact and introductions (Weeks 1-2)
   - Phase 2: Facility visits and capability verification (Weeks 3-4)
   - Phase 3: Sample production and quality testing (Weeks 5-8)
   - Phase 4: Contract negotiation and finalization (Weeks 9-12)
   - Phase 5: Production ramp-up and relationship management (Months 4-6)

7. RISK ASSESSMENT & MITIGATION
   - Supplier concentration risk management
   - Quality control and monitoring systems
   - Logistics and supply chain risks
   - Currency exchange considerations
   - Contingency plans for supply disruptions

8. FINANCIAL ANALYSIS
   - Mexico supplier pricing vs. current suppliers
   - USMCA tariff savings calculations
   - Total cost of ownership analysis
   - ROI projections and break-even timeline
   - Working capital and payment terms

9. JORGE'S PROFESSIONAL SUPPLIER NETWORK
Write in first person as Jorge, incorporating his supplier intelligence verbatim:

"Using my CCVIAL network and B2B sales experience in Mexico, I have identified the following suppliers:

**Mexico Suppliers:** ${stage3Data.mexico_suppliers}

**Relationship Strategy:** ${stage3Data.relationship_strategy}

**USMCA Optimization:** ${stage3Data.usmca_optimization}

**Implementation Timeline:** ${stage3Data.implementation_timeline}

I will personally facilitate introductions, conduct facility visits in Spanish, negotiate terms leveraging my cultural bridge advantage, and ensure successful supplier relationships. Expected outcome: [SPECIFIC cost savings and USMCA qualification improvement]."

TONE: Direct, relationship-focused, results-driven. Use actual company name (${subscriberData.company_name}) and Jorge's specific Mexico supplier contacts from CCVIAL network. Show expertise through concrete supplier introductions with company names, contact information, and specific capabilities - not generic advice.

FORBIDDEN PHRASES:
- "comprehensive supplier research" without specific company names and contacts
- "company with undisclosed details" (use ${subscriberData.company_name})
- "additional vetting required" (provide the vetted suppliers NOW)
- Generic advice like "find suppliers" (name specific Mexico suppliers with contacts)

Format as actionable supplier sourcing report with specific Mexico supplier introductions from Jorge's CCVIAL network, concrete pricing and capability details, and month-by-month implementation plan.`;

    console.log('[SUPPLIER SOURCING REPORT] Calling OpenRouter API...');

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://triangle-intelligence.com',
        'X-Title': 'Triangle Intelligence - Supplier Sourcing'
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

    console.log('[SUPPLIER SOURCING REPORT] OpenRouter response status:', openRouterResponse.status);

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('[SUPPLIER SOURCING REPORT] OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API call failed: ${openRouterResponse.status} - ${errorText}`);
    }

    const aiResponse = await openRouterResponse.json();
    const reportContent = aiResponse.choices?.[0]?.message?.content || 'Report generation failed';

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
      from: 'Triangle Intelligence - Supplier Sourcing <triangleintel@gmail.com>',
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
          product_categories: stage1Data.product_categories,
          usmca_goals: stage1Data.usmca_goals,
          mexico_suppliers: stage3Data.mexico_suppliers,
          relationship_strategy: stage3Data.relationship_strategy,
          usmca_optimization: stage3Data.usmca_optimization,
          implementation_timeline: stage3Data.implementation_timeline,
          email_sent: true,
          email_to: 'triangleintel@gmail.com',
          completed_at: new Date().toISOString(),
          completed_by: 'Jorge Ochoa - B2B Sales Expert, Mexico Supplier Network Specialist'
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
      mexico_suppliers: stage3Data.mexico_suppliers
    });

  } catch (error) {
    console.error('Error generating Supplier Sourcing report:', error);
    return res.status(500).json({
      error: 'Failed to generate supplier sourcing strategy report',
      details: error.message
    });
  }
}
