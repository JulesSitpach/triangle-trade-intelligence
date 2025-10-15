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

    console.log('[CRISIS REPORT] Service request data:', {
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

    // Calculate urgency level based on crisis description
    const calculateUrgencyLevel = () => {
      const impactLower = (stage1Data.current_impact || '').toLowerCase();
      const timelineLower = (stage1Data.timeline || '').toLowerCase();

      if (impactLower.includes('stopped') || impactLower.includes('halted') || timelineLower.includes('immediate') || timelineLower.includes('urgent')) {
        return 'Critical';
      }
      if (impactLower.includes('severe') || impactLower.includes('significant') || timelineLower.includes('today') || timelineLower.includes('yesterday')) {
        return 'High';
      }
      return 'Medium';
    };

    const urgencyLevel = calculateUrgencyLevel();

    // Calculate financial exposure from subscriber data
    const calculateFinancialExposure = () => {
      const tradeVolume = Number(subscriberData.trade_volume || 0);
      const tariffCost = Number(subscriberData.annual_tariff_cost || 0);

      if (tariffCost > 0) {
        return `$${tariffCost.toLocaleString()} annual tariff exposure`;
      }
      if (tradeVolume > 0) {
        return `$${tradeVolume.toLocaleString()} annual trade volume at risk`;
      }
      return stage1Data.current_impact || 'Analyzing financial impact';
    };

    const financialExposure = calculateFinancialExposure();

    // Generate comprehensive crisis response action plan using OpenRouter
    const reportPrompt = `You are formatting a professional Crisis Response Action Plan for the Triangle Trade Intelligence team (Business Development Specialist - Mexico Trade Expert & Trade Compliance Expert - Licensed Specialist with 17 years of ${industryContext} logistics management experience).

CRITICAL INSTRUCTION: The team has already provided their professional crisis management plan. Your job is to format it into a professional report. Use their EXACT words for all crisis management sections. DO NOT add to, modify, or paraphrase their professional input. This is consulting and guidance - your role is formatting only.

BUSINESS CONTEXT:
Company: ${subscriberData.company_name || 'N/A'}
Product: ${subscriberData.product_description || 'N/A'}
Crisis Type: ${stage1Data.crisis_type}
Timeline: ${stage1Data.timeline}

STAGE 1 - CRISIS DETAILS:
Current Impact: ${stage1Data.current_impact}
Immediate Concerns: ${stage1Data.immediate_concerns}

TEAM'S PROFESSIONAL CRISIS ASSESSMENT (USE VERBATIM):
Crisis Severity Assessment: "${stage3Data.crisis_severity_assessment}"
Immediate Action Recommendations (24-48h): "${stage3Data.immediate_actions}"
Recovery Timeline Analysis: "${stage3Data.recovery_timeline}"
Risk Mitigation Strategy: "${stage3Data.risk_mitigation}"

COMPLIANCE & RISK CONTEXT:
Vulnerability Factors: ${Array.isArray(subscriberData.vulnerability_factors) ? subscriberData.vulnerability_factors.map(v => `- ${v}`).join('\n') : 'Standard risk profile'}
Compliance Gaps: ${Array.isArray(subscriberData.compliance_gaps) ? subscriberData.compliance_gaps.map(gap => `- ${gap}`).join('\n') : 'None identified'}

FINANCIAL IMPACT:
Annual Trade Volume: $${Number(subscriberData.trade_volume || 0).toLocaleString()}
Current Tariff Cost: $${Number(subscriberData.annual_tariff_cost || 0).toLocaleString()}
Crisis Financial Exposure: ${financialExposure}

As the Triangle Trade Intelligence team with 17 years of enterprise ${industryContext} logistics experience combined with 7 years of SMB trade operations, specializing in crisis response for ${subscriberData.business_type || 'importers/exporters'}:

Generate a professional Crisis Response Analysis and Recommendations with these sections:

1. EXECUTIVE SUMMARY
   - Crisis situation overview
   - Business impact assessment
   - Urgency level and timeline
   - Critical next steps

2. CRISIS ANALYSIS
   - Root cause analysis
   - Supply chain vulnerability assessment
   - Compliance implications
   - Financial exposure quantification

3. IMMEDIATE ACTION PLAN (24-48 Hours)
   - Emergency response procedures
   - Stakeholder communication plan
   - Regulatory compliance measures
   - Supply chain stabilization steps

4. SHORT-TERM RECOVERY STRATEGY (1-4 Weeks)
   - Alternative supplier activation
   - Shipment rerouting options
   - Documentation and compliance management
   - Customer communication protocols

5. LONG-TERM RESILIENCE BUILDING
   - Supply chain diversification recommendations
   - Risk mitigation strategies
   - USMCA optimization opportunities
   - Vendor relationship strengthening

6. IMPLEMENTATION TIMELINE
   - Hour-by-hour action plan for first 48 hours
   - Week-by-week milestones for recovery
   - Key decision points and stakeholders
   - Success metrics and monitoring

7. TEAM'S PROFESSIONAL CRISIS ASSESSMENT

CRITICAL: This section contains the team's professional crisis management recommendations. Use EXACT words from the assessment data verbatim. DO NOT paraphrase or expand.

**Crisis Severity Assessment:**
"${stage3Data.crisis_severity_assessment}"

**Immediate Action Recommendations (24-48 Hours):**
"${stage3Data.immediate_actions}"

**Recovery Timeline Analysis:**
"${stage3Data.recovery_timeline}"

**Risk Mitigation Strategy:**
"${stage3Data.risk_mitigation}"

Triangle Trade Intelligence Team
Trade Compliance Expert - Licensed Specialist (17 years Motorola, Arris, Tekmovil)
Business Development Specialist - Mexico Trade Expert (7 years business ownership, Mexico expertise)

TONE: Direct, urgent, actionable. Use actual company name (${subscriberData.company_name}) and specific crisis details. Show expertise through concrete crisis response steps with exact timelines, not generic advice.

FORBIDDEN PHRASES:
- "comprehensive strategy" without specific suppliers/actions
- "company with undisclosed details" (use ${subscriberData.company_name})
- "additional planning required" (provide the plan NOW)
- Generic advice like "contact suppliers" (name specific suppliers or actions)

Format as urgent professional crisis action plan with hour-by-hour first 48 hours, clear accountability, and specific dollar impacts.`;

    // ✅ AI FALLBACK CHAIN: OpenRouter → Anthropic → Database Cache
    console.log('[CRISIS REPORT] Calling AI with fallback chain...');

    const aiResult = await executeWithFallback({
      prompt: reportPrompt,
      model: 'anthropic/claude-3-haiku',
      maxTokens: 4000,
      cacheOptions: {
        table: 'crisis_response_reports_cache',
        query: {
          company_name: subscriberData.company_name,
          crisis_type: stage1Data.crisis_type
        },
        transform: (cached) => cached.report_content
      }
    });

    // Check if AI generation succeeded
    if (!aiResult.success) {
      console.error('[CRISIS REPORT] All AI services failed:', aiResult);
      return res.status(503).json({
        success: false,
        error: 'Crisis Response report generation failed',
        source: aiResult.source,
        label: aiResult.label,
        troubleshooting: aiResult.troubleshooting,
        message: 'All AI services (OpenRouter, Anthropic) and cache are unavailable. Please check API keys and try again.'
      });
    }

    const reportContent = aiResult.data;
    console.log(`[CRISIS REPORT] Generated successfully via ${aiResult.source}`);

    // Create email with urgent crisis response action plan
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const emailSubject = `🚨 URGENT: Crisis Response Action Plan - ${subscriberData.company_name || serviceRequest.client_company} - ${stage1Data.crisis_type}`;

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .urgent-banner { background: #fef2f2; border: 2px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .content { padding: 20px; }
    .section { margin-bottom: 30px; }
    .credentials { background: #f0f8ff; padding: 15px; border-left: 4px solid #134169; margin: 20px 0; }
    .report-content { white-space: pre-wrap; background: #f9f9f9; padding: 20px; border-radius: 5px; }
    .timeline { background: #fff7ed; padding: 15px; border-left: 4px solid #ea580c; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 PROCESS SUPPORT & CRISIS ANALYSIS</h1>
    <p>Professional Trade Consulting & Crisis Management Guidance</p>
  </div>

  <div class="content">
    <div class="urgent-banner">
      <h2 style="margin-top: 0; color: #dc2626;">URGENT - ${urgencyLevel} Priority</h2>
      <p><strong>Situation Type:</strong> ${stage1Data.crisis_type}</p>
      <p><strong>Timeline:</strong> ${stage1Data.timeline}</p>
      <p><strong>Action Required:</strong> Review strategic recommendations and implementation guidance</p>
    </div>

    <div class="credentials">
      <strong>Team:</strong> Business Development Specialist (Mexico Trade Expert) & Trade Compliance Expert (Licensed Specialist)<br>
      <strong>Cristina's Expertise:</strong> 17 years enterprise logistics (Motorola, Arris, Tekmovil), crisis management, supply chain optimization<br>
      <strong>Jorge's Expertise:</strong> 7-year SMB owner, Mexico trade specialist, bilingual capabilities<br>
      <strong>Service Type:</strong> Consulting and Guidance (Process Support & Crisis Analysis)<br>
      <strong>Response Date:</strong> ${new Date().toLocaleString()}<br>
      <strong>Note:</strong> For emergency customs broker services, we partner with licensed professionals
    </div>

    <div class="section">
      <h2>Client Information</h2>
      <p><strong>Company:</strong> ${subscriberData.company_name || serviceRequest.client_company}</p>
      <p><strong>Product Affected:</strong> ${subscriberData.product_description || 'Multiple products'}</p>
      <p><strong>Crisis Type:</strong> ${stage1Data.crisis_type}</p>
      <p><strong>Financial Exposure:</strong> ${financialExposure}</p>
    </div>

    <div class="timeline">
      <h3>Critical Timeline</h3>
      <p><strong>Assessment Completed:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Crisis Timeline:</strong> ${stage1Data.timeline}</p>
      <p><strong>Recovery Timeline:</strong> ${stage3Data.recovery_timeline}</p>
    </div>

    <div class="report-content">
      ${reportContent.replace(/\n/g, '<br>')}
    </div>

    <div class="section">
      <h3>Next Steps</h3>
      <p><strong>1. Review strategic recommendations immediately</strong></p>
      <p><strong>2. Determine which actions to implement</strong></p>
      <p><strong>3. Consult with our team on implementation approach</strong></p>
      <p><strong>4. Contact licensed professionals for emergency customs services if needed</strong></p>
    </div>

    <div class="section">
      <p><em>This crisis analysis leverages 17+ years of combined enterprise logistics and SMB trade experience. This is professional guidance and strategic recommendations. For emergency customs broker services and official compliance actions, we partner with licensed professionals. Our team is available to provide ongoing consulting support throughout the crisis resolution process.</em></p>
    </div>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: 'Triangle Trade Intelligence - Crisis Response <triangleintel@gmail.com>',
      to: 'triangleintel@gmail.com',
      subject: emailSubject,
      html: emailBody,
      priority: 'high'
    });

    // ✅ SAVE TO DATABASE CACHE for future fallback
    if (aiResult.source === 'openrouter_api' || aiResult.source === 'anthropic_api') {
      try {
        await supabase
          .from('crisis_response_reports_cache')
          .upsert({
            company_name: subscriberData.company_name,
            crisis_type: stage1Data.crisis_type,
            report_content: reportContent,
            source: aiResult.source,
            cached_at: new Date().toISOString()
          });
        console.log('[CRISIS REPORT] Saved to cache for future fallback');
      } catch (cacheError) {
        console.error('[CRISIS REPORT] Cache save failed:', cacheError);
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
          crisis_type: stage1Data.crisis_type,
          urgency_level: urgencyLevel,
          financial_exposure: financialExposure,
          crisis_severity_assessment: stage3Data.crisis_severity_assessment,
          immediate_actions: stage3Data.immediate_actions,
          recovery_timeline: stage3Data.recovery_timeline,
          risk_mitigation: stage3Data.risk_mitigation,
          email_sent: true,
          email_to: 'triangleintel@gmail.com',
          completed_at: new Date().toISOString(),
          completed_by: `Triangle Trade Intelligence Team (Business Development Specialist & Trade Compliance Expert)`,
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
      message: '🚨 Crisis Response Action Plan generated and sent to triangleintel@gmail.com',
      report_content: reportContent,
      email_subject: emailSubject,
      crisis_type: stage1Data.crisis_type,
      urgency_level: urgencyLevel,
      financial_exposure: financialExposure,
      // ✅ TRANSPARENT SOURCE LABELING
      source: aiResult.source,
      label: aiResult.label,
      is_cached: aiResult.is_cached,
      cost_estimate: aiResult.cost_estimate
    });

  } catch (error) {
    console.error('Error generating Crisis Response report:', error);
    return res.status(500).json({
      error: 'Failed to generate crisis response plan',
      details: error.message
    });
  }
}