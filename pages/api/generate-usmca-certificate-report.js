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
    const { serviceRequestId, stage1Data, stage2Data, stage3Data } = req.body;

    if (!serviceRequestId || !stage1Data) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Stage 3 contains Cristina's expert inputs (certificate_validation, compliance_risk_assessment, audit_defense_strategy)
    // Use stage3Data if provided, fallback to stage2Data for backward compatibility
    const cristinaExpertInputs = stage3Data || stage2Data || {};

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

    console.log('[USMCA CERT REPORT] Service request data:', {
      id: serviceRequest.id,
      company: serviceRequest.company_name,
      hasServiceDetails: !!serviceRequest.service_details,
      hasSubscriberData: !!serviceRequest.subscriber_data,
      subscriberDataKeys: Object.keys(subscriberData),
      companyName: subscriberData.company_name,
      productDescription: subscriberData.product_description
    });

    // Calculate actual financial impact
    const tradeVolume = parseFloat(String(subscriberData.trade_volume || '0').replace(/[^0-9.]/g, ''));
    const currentTariffCost = subscriberData.annual_tariff_cost || 0;

    // Get component origins for USMCA analysis
    const componentOrigins = Array.isArray(subscriberData.component_origins) ? subscriberData.component_origins : [];

    console.log('[USMCA CERT REPORT] Component origins:', {
      rawData: subscriberData.component_origins,
      isArray: Array.isArray(subscriberData.component_origins),
      length: componentOrigins.length,
      origins: componentOrigins.map(c => ({
        country: c.country || c.origin_country,
        percentage: c.percentage || c.value_percentage
      }))
    });

    // Support both country codes (CN, MX, US, CA) and full names (China, Mexico, United States, Canada)
    const getCountryPercentage = (codes, names) => {
      const component = componentOrigins.find(c => {
        const countryValue = c.country || c.origin_country;
        return codes.includes(countryValue) || names.includes(countryValue);
      });
      return component?.percentage || component?.value_percentage || 0;
    };

    const chinaPercentage = getCountryPercentage(['CN', 'CHN'], ['China']);
    const mexicoPercentage = getCountryPercentage(['MX', 'MEX'], ['Mexico']);
    const usPercentage = getCountryPercentage(['US', 'USA'], ['United States', 'USA', 'U.S.']);
    const canadaPercentage = getCountryPercentage(['CA', 'CAN'], ['Canada']);

    const northAmericanContent = mexicoPercentage + usPercentage + canadaPercentage;

    // Get tariff rates from subscriber data or use intelligent defaults
    // Priority: subscriber_data > AI analysis > intelligent defaults based on product/industry
    const avgTariffRate = subscriberData.avg_tariff_rate
      || subscriberData.mfn_rate
      || (currentTariffCost && tradeVolume ? currentTariffCost / tradeVolume : null)
      || 0.025; // Fallback: 2.5% average for most products

    const chinaTariffRate = subscriberData.china_tariff_rate
      || 0.25; // Current Section 301 tariff rate for many Chinese goods

    // Get USMCA threshold from AI-researched subscriber data (no hardcoded fallbacks)
    // This value should have been researched and saved by ai-usmca-complete-analysis.js
    const usmcaThreshold = subscriberData.usmca_threshold
      || subscriberData.rvc_requirement
      || subscriberData.required_threshold; // From workflow_sessions table

    if (!usmcaThreshold) {
      throw new Error('USMCA threshold not found in subscriber data. Workflow analysis must be completed first.');
    }

    const partialThreshold = usmcaThreshold * 0.833; // 83.3% of full threshold (e.g., 62.5% for 75% threshold)

    // Current situation assessment
    let currentStatus = '';
    let tariffExposure = 0;
    let usmcaSavings = 0;

    if (northAmericanContent >= usmcaThreshold) {
      // ALREADY QUALIFIED - They're saving money right now
      currentStatus = 'QUALIFIED';
      // They currently pay $0 in tariffs on USMCA-qualified portions
      // Calculate what they WOULD pay without USMCA qualification
      const qualifiedValue = tradeVolume * (northAmericanContent / 100);
      usmcaSavings = Math.round(qualifiedValue * avgTariffRate); // What they're saving NOW

      // Risk: What they could lose if China sourcing increases
      const chinaValue = tradeVolume * (chinaPercentage / 100);
      tariffExposure = Math.round(chinaValue * chinaTariffRate);

    } else if (northAmericanContent >= partialThreshold) {
      // PARTIALLY QUALIFIED - Some savings but not full
      currentStatus = 'PARTIAL';
      const qualifiedValue = tradeVolume * (northAmericanContent / 100);
      const currentSavings = Math.round(qualifiedValue * avgTariffRate);

      // Potential additional savings if they reach full threshold
      const potentialQualifiedValue = tradeVolume * (usmcaThreshold / 100);
      const potentialSavings = Math.round(potentialQualifiedValue * avgTariffRate);
      usmcaSavings = potentialSavings - currentSavings;

      tariffExposure = Math.round((tradeVolume * (chinaPercentage / 100)) * chinaTariffRate);

    } else {
      // NOT QUALIFIED - Paying full tariffs
      currentStatus = 'NOT_QUALIFIED';
      // Calculate potential savings if they reach threshold
      const targetQualifiedValue = tradeVolume * (usmcaThreshold / 100);
      usmcaSavings = Math.round(targetQualifiedValue * avgTariffRate);

      tariffExposure = Math.round((tradeVolume * (chinaPercentage / 100)) * chinaTariffRate);
    }

    console.log('[USMCA CERT REPORT] Financial calculations:', {
      china: chinaPercentage,
      mexico: mexicoPercentage,
      us: usPercentage,
      canada: canadaPercentage,
      northAmerican: northAmericanContent,
      usmcaThreshold: usmcaThreshold,
      partialThreshold: partialThreshold,
      avgTariffRate: avgTariffRate,
      chinaTariffRate: chinaTariffRate,
      currentStatus: currentStatus,
      calculatedSavings: usmcaSavings,
      tariffExposure: tariffExposure,
      dataSource: {
        threshold: subscriberData.usmca_threshold ? 'subscriber_data' : 'default',
        tariffRate: subscriberData.avg_tariff_rate ? 'subscriber_data' : (subscriberData.mfn_rate ? 'mfn_rate' : 'calculated/default')
      }
    });

    // Determine industry context from subscriber data (make expertise relevant to their industry)
    const industryContext = subscriberData.product_category
      || subscriberData.industry_sector
      || (subscriberData.product_description ? `${subscriberData.product_description}` : null)
      || 'international trade';

    // Generate comprehensive USMCA optimization assessment report using OpenRouter
    const reportPrompt = `You are formatting a professional USMCA Optimization Assessment Report for the Triangle Trade Intelligence team (Business Development Specialist - Mexico Trade Expert & Trade Compliance Expert - Licensed Specialist with 17 years of ${industryContext} experience).

CRITICAL INSTRUCTION: The team has already provided their professional assessment. Your job is to format it into a professional report. Use their EXACT words for all sections marked "TEAM'S" or "CRISTINA'S". DO NOT add to, modify, or paraphrase their professional input. This is consulting and guidance - your role is formatting only.

CLIENT BUSINESS PROFILE:
Company: ${subscriberData.company_name || serviceRequest.client_company}
Business Type: ${subscriberData.business_type || 'Importer/Exporter'}
Annual Trade Volume: $${tradeVolume.toLocaleString()}
Product: ${subscriberData.product_description || stage1Data.product_description}
Manufacturing Location: ${subscriberData.manufacturing_location || 'Multiple locations'}
Current USMCA Status: ${subscriberData.qualification_status || 'Under review'}

COMPONENT SOURCING BREAKDOWN:
${componentOrigins.length > 0 ? componentOrigins.map(c => `- ${c.country || c.origin_country}: ${c.percentage || c.value_percentage}% (${c.component_type || c.description || 'components'})`).join('\n') : '- No component origin data provided'}

REGIONAL VALUE CONTENT ANALYSIS:
- North American Content: ${northAmericanContent}% (Mexico: ${mexicoPercentage}%, US: ${usPercentage}%, Canada: ${canadaPercentage}%)
- Non-USMCA Content: ${100 - northAmericanContent}% (China: ${chinaPercentage}%)
- USMCA Qualification: ${subscriberData.qualification_status || (northAmericanContent >= partialThreshold ? 'PARTIAL' : (northAmericanContent >= usmcaThreshold ? 'QUALIFIED' : 'NOT QUALIFIED'))}

FINANCIAL ANALYSIS:
- Annual Trade Volume: $${tradeVolume.toLocaleString()}
- Current USMCA Status: ${currentStatus} (${northAmericanContent}% RVC)
${currentStatus === 'QUALIFIED'
  ? `- Current USMCA Savings: $${usmcaSavings.toLocaleString()}/year (what they're saving RIGHT NOW vs. non-USMCA rates)
- Risk Exposure: $${tariffExposure.toLocaleString()} potential loss if China sourcing increases and USMCA qualification lost`
  : currentStatus === 'PARTIAL'
  ? `- Current Partial Savings: Already saving on ${northAmericanContent}% qualified content
- Additional Savings Opportunity: $${usmcaSavings.toLocaleString()}/year if they increase RVC to 75%
- China Tariff Risk: $${tariffExposure.toLocaleString()} if Section 301 tariffs applied to ${chinaPercentage}% China content`
  : `- Currently Paying Full Tariffs: $${currentTariffCost.toLocaleString()}/year
- Potential USMCA Savings: $${usmcaSavings.toLocaleString()}/year if they achieve 75% RVC qualification
- China Tariff Risk: $${tariffExposure.toLocaleString()} exposure if Section 301 tariffs increase`}

COMPLIANCE GAPS IDENTIFIED:
${Array.isArray(subscriberData.compliance_gaps) && subscriberData.compliance_gaps.length > 0
  ? subscriberData.compliance_gaps.map(gap => `- ${gap}`).join('\n')
  : '- Component origin documentation incomplete\n- USMCA qualification pathway unclear\n- Supplier certification gaps'}

VULNERABILITY FACTORS:
${Array.isArray(subscriberData.vulnerability_factors) && subscriberData.vulnerability_factors.length > 0
  ? subscriberData.vulnerability_factors.map(v => `- ${v}`).join('\n')
  : '- High China sourcing creates tariff exposure\n- Limited USMCA-compliant supplier options\n- Trade agreement uncertainty'}

CRISTINA'S PROFESSIONAL CERTIFICATE VALIDATION:
Certificate Accuracy: ${cristinaExpertInputs.certificate_validation}
Compliance Risk Assessment: ${cristinaExpertInputs.compliance_risk_assessment}
Audit Defense Strategy: ${cristinaExpertInputs.audit_defense_strategy}

YOUR TASK:
Write a professional USMCA Certificate Report that demonstrates your 17 years of ${industryContext} logistics expertise. Be SPECIFIC and ACTIONABLE for THIS specific ${subscriberData.business_type || 'business'}.

REQUIRED SECTIONS:

## 1. EXECUTIVE SUMMARY
${currentStatus === 'QUALIFIED'
  ? `- USMCA Qualification Status: ✅ QUALIFIED (${northAmericanContent}% RVC exceeds ${usmcaThreshold}% requirement)
- Current Annual Savings: $${usmcaSavings.toLocaleString()} (by avoiding non-USMCA tariff rates)
- Risk Exposure: $${tariffExposure.toLocaleString()} potential loss if ${chinaPercentage}% China sourcing increases and qualification is lost
- Key Recommendation: Maintain North American content above ${usmcaThreshold}% to preserve duty-free status`
  : currentStatus === 'PARTIAL'
  ? `- USMCA Qualification Status: ⚠️ PARTIAL (${northAmericanContent}% RVC, need ${usmcaThreshold}% for full qualification)
- Current Partial Savings: $${usmcaSavings.toLocaleString()}/year on qualified portions
- Additional Opportunity: $${tariffExposure.toLocaleString()}/year in savings by shifting China components to Mexico
- Key Recommendation: Increase Mexico sourcing from ${mexicoPercentage}% to reach full ${usmcaThreshold}% USMCA qualification`
  : `- USMCA Qualification Status: ❌ NOT QUALIFIED (${northAmericanContent}% RVC, need ${usmcaThreshold}%)
- Current Annual Tariff Cost: $${currentTariffCost.toLocaleString()}/year
- Potential USMCA Savings: $${usmcaSavings.toLocaleString()}/year if qualified
- Key Recommendation: Shift ${chinaPercentage}% China sourcing to Mexico to achieve ${usmcaThreshold}% RVC and eliminate tariffs`}

## 2. COMPONENT ORIGIN ANALYSIS (CRITICAL FOR USMCA)
- Break down the ${componentOrigins.length > 0 ? componentOrigins.map(c => c.country).join(', ') : 'current sourcing'} components
- Show which components DO qualify for USMCA (Mexico: ${mexicoPercentage}%, US: ${usPercentage}%, Canada: ${canadaPercentage}%)
- Show which DON'T qualify (China: ${chinaPercentage}%, others: ${100 - chinaPercentage - mexicoPercentage - usPercentage - canadaPercentage}%)
- Explain the Regional Value Content (RVC) calculation: Current RVC = ${mexicoPercentage + usPercentage + canadaPercentage}%, Need ${usmcaThreshold}% for full USMCA qualification
- Recommend which China components should be sourced from Mexico instead to increase RVC to ${usmcaThreshold}%

## 3. TARIFF COST BREAKDOWN & SAVINGS OPPORTUNITY
${currentStatus === 'QUALIFIED'
  ? `- Annual Trade Volume: $${tradeVolume.toLocaleString()}
- Current USMCA Status: ✅ QUALIFIED - Paying $0 in tariffs on USMCA-qualified portions
- Annual Savings vs. Non-USMCA Rates: $${usmcaSavings.toLocaleString()}/year (what you're saving RIGHT NOW)
- Risk Exposure: ${chinaPercentage}% China sourcing = $${tariffExposure.toLocaleString()} potential annual loss if qualification is lost
- Protection Strategy: Maintain North American content above ${usmcaThreshold}% to preserve duty-free benefits
- Certificate ROI: This $250 certificate protects $${usmcaSavings.toLocaleString()}/year in savings = ${Math.round(usmcaSavings / 250)}x ROI`
  : currentStatus === 'PARTIAL'
  ? `- Annual Trade Volume: $${tradeVolume.toLocaleString()}
- Current USMCA Status: ⚠️ PARTIAL (${northAmericanContent}% RVC) - Some portions qualify, others don't
- Current Partial Savings: $${usmcaSavings.toLocaleString()}/year on qualified portions
- Additional Savings Opportunity: $${tariffExposure.toLocaleString()}/year if you reach full ${usmcaThreshold}% USMCA qualification
- Action Required: Shift ${Math.ceil(usmcaThreshold - northAmericanContent)}% of components from China to Mexico/US/Canada
- Certificate ROI: $250 certificate to unlock $${tariffExposure.toLocaleString()}/year additional savings = ${Math.round(tariffExposure / 250)}x ROI`
  : `- Annual Trade Volume: $${tradeVolume.toLocaleString()}
- Current USMCA Status: ❌ NOT QUALIFIED (${northAmericanContent}% RVC, need ${usmcaThreshold}%)
- Current Annual Tariff Cost: $${currentTariffCost.toLocaleString()}/year (paying full tariffs)
- Potential USMCA Savings: $${usmcaSavings.toLocaleString()}/year if you achieve ${usmcaThreshold}% RVC qualification
- Action Required: Shift ${Math.ceil(usmcaThreshold - northAmericanContent)}% of components from China (${chinaPercentage}%) to Mexico suppliers
- Certificate ROI: $250 certificate to unlock $${usmcaSavings.toLocaleString()}/year savings = ${Math.round(usmcaSavings / 250)}x ROI
- Break-even: Certificate pays for itself in ${Math.ceil((250 / usmcaSavings) * 365)} days`}

## 4. TEAM'S PROFESSIONAL ASSESSMENT

CRITICAL: This section contains the team's professional assessment based on combined expertise. Use EXACT words from the validation data verbatim. DO NOT paraphrase or expand.

**USMCA Qualification Assessment:**
"${cristinaExpertInputs.certificate_validation}"

**Compliance Risk Evaluation:**
"${cristinaExpertInputs.compliance_risk_assessment}"

**Strategic Implementation Guidance:**
"${cristinaExpertInputs.audit_defense_strategy}"

Triangle Trade Intelligence Team
Trade Compliance Expert - Licensed Specialist (17 years Motorola, Arris, Tekmovil)
Business Development Specialist - Mexico Trade Expert (7 years business ownership, Mexico expertise)

## 5. ACTION PLAN (NEXT 90 DAYS)
Based on the financial analysis above and the team's professional assessment, create a specific 90-day action plan to increase RVC from ${mexicoPercentage + usPercentage + canadaPercentage}% to 75%+, saving $${usmcaSavings.toLocaleString()}/year

TONE: Professional but direct. Use actual numbers from their data. Be specific about which components to shift from China to Mexico. Show the team's combined expertise (17 years enterprise logistics + 7 years SMB operations) through concrete recommendations with dollar amounts and timelines, not generic platitudes.

FORBIDDEN PHRASES:
- "comprehensive strategy" without specific component names and Mexico suppliers
- "company with undisclosed details" (use their actual company name: ${subscriberData.company_name})
- "cannot be determined" when trade volume is $${tradeVolume.toLocaleString()}
- Generic compliance like "obtain certifications" (specify: Mexico supplier USMCA origin certificates)

Format as a formal business report with clear headers, bullet points for key findings, and bold text for critical dollar amounts and percentages.`;

    // ✅ AI FALLBACK CHAIN: OpenRouter → Anthropic → Database Cache
    console.log('[USMCA CERT REPORT] Calling AI with fallback chain...');

    const aiResult = await executeWithFallback({
      prompt: reportPrompt,
      model: 'anthropic/claude-haiku-4.5',
      maxTokens: 4000,
      cacheOptions: {
        table: 'usmca_certificate_reports_cache',
        query: {
          company_name: subscriberData.company_name,
          product_description: subscriberData.product_description
        },
        transform: (cached) => cached.report_content
      }
    });

    // Check if AI generation succeeded
    if (!aiResult.success) {
      console.error('[USMCA CERT REPORT] All AI services failed:', aiResult);
      return res.status(503).json({
        success: false,
        error: 'USMCA Certificate report generation failed',
        source: aiResult.source,
        label: aiResult.label,
        troubleshooting: aiResult.troubleshooting,
        message: 'All AI services (OpenRouter, Anthropic) and cache are unavailable. Please check API keys and try again.'
      });
    }

    const reportContent = aiResult.data;
    console.log(`[USMCA CERT REPORT] Generated successfully via ${aiResult.source}`);

    // Create email using nodemailer
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const emailSubject = `USMCA Certificate Report - ${subscriberData.company_name || serviceRequest.client_company} - ${new Date().toLocaleDateString()}`;

    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #134169; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .section { margin-bottom: 30px; }
    .credentials { background: #f0f8ff; padding: 15px; border-left: 4px solid #134169; margin: 20px 0; }
    .report-content { white-space: pre-wrap; background: #f9f9f9; padding: 20px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>USMCA Optimization Assessment Report</h1>
    <p>Professional Trade Consulting & Analysis</p>
  </div>

  <div class="content">
    <div class="credentials">
      <strong>Team:</strong> Business Development Specialist (Mexico Trade Expert) & Trade Compliance Expert (Licensed Specialist)<br>
      <strong>Cristina's Expertise:</strong> 17 years enterprise logistics (Motorola, Arris, Tekmovil), HTS/INCOTERMS specialist<br>
      <strong>Jorge's Expertise:</strong> 7-year SMB owner, Mexico trade specialist, bilingual capabilities<br>
      <strong>Service Type:</strong> Consulting and Guidance (USMCA Optimization Assessment)<br>
      <strong>Service Date:</strong> ${new Date().toLocaleDateString()}<br>
      <strong>Note:</strong> For official USMCA certificates, we partner with trade compliance experts
    </div>

    <div class="section">
      <h2>Client Information</h2>
      <p><strong>Company:</strong> ${subscriberData.company_name || serviceRequest.client_company}</p>
      <p><strong>Product:</strong> ${subscriberData.product_description || stage1Data.product_description}</p>
      <p><strong>USMCA Status:</strong> ${subscriberData.qualification_status || 'Under Review'}</p>
      <p><strong>Annual Trade Volume:</strong> $${tradeVolume.toLocaleString()}</p>
      <p><strong>Potential USMCA Savings:</strong> $${usmcaSavings.toLocaleString()}/year</p>
    </div>

    <div class="report-content">
      ${reportContent.replace(/\n/g, '<br>')}
    </div>

    <div class="section">
      <p><em>This report has been prepared by our trade consulting team with 17+ years of combined enterprise logistics and SMB trade experience. This is professional guidance and assessment. For official USMCA certificates and formal compliance documents, we partner with trade compliance experts. For questions or clarifications, please contact Triangle Trade Intelligence Platform.</em></p>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: 'Triangle Trade Intelligence <triangleintel@gmail.com>',
      to: 'triangleintel@gmail.com',
      subject: emailSubject,
      html: emailBody
    };

    await transporter.sendMail(mailOptions);

    // ✅ SAVE TO DATABASE CACHE for future fallback
    if (aiResult.source === 'openrouter_api' || aiResult.source === 'anthropic_api') {
      try {
        await supabase
          .from('usmca_certificate_reports_cache')
          .upsert({
            company_name: subscriberData.company_name,
            product_description: subscriberData.product_description,
            report_content: reportContent,
            source: aiResult.source,
            cached_at: new Date().toISOString()
          });
        console.log('[USMCA CERT REPORT] Saved to cache for future fallback');
      } catch (cacheError) {
        console.error('[USMCA CERT REPORT] Cache save failed:', cacheError);
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
          certificate_validation: cristinaExpertInputs.certificate_validation,
          compliance_risk_assessment: cristinaExpertInputs.compliance_risk_assessment,
          audit_defense_strategy: cristinaExpertInputs.audit_defense_strategy,
          email_sent: true,
          email_to: 'triangleintel@gmail.com',
          completed_at: new Date().toISOString(),
          completed_by: 'Triangle Trade Intelligence Team (Business Development Specialist & Trade Compliance Expert)',
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
      message: 'USMCA Certificate report generated and sent to triangleintel@gmail.com',
      report_content: reportContent,
      email_subject: emailSubject,
      // ✅ TRANSPARENT SOURCE LABELING
      source: aiResult.source,
      label: aiResult.label,
      is_cached: aiResult.is_cached,
      cost_estimate: aiResult.cost_estimate
    });

  } catch (error) {
    console.error('Error generating USMCA Certificate report:', error);
    return res.status(500).json({
      error: 'Failed to generate report',
      details: error.message
    });
  }
}