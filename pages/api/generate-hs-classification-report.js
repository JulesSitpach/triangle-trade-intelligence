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
    const { serviceRequestId, stage1Data, stage2Data, stage3Data } = req.body;

    // Support both stage2Data (what component sends) and stage3Data (old naming)
    const validationData = stage3Data || stage2Data;

    if (!serviceRequestId || !validationData) {
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

    console.log('[HS CLASSIFICATION REPORT] Service request data:', {
      id: serviceRequest.id,
      company: serviceRequest.company_name,
      hasServiceDetails: !!serviceRequest.service_details,
      hasSubscriberData: !!serviceRequest.subscriber_data,
      subscriberDataKeys: Object.keys(subscriberData),
      companyName: subscriberData.company_name,
      productDescription: subscriberData.product_description
    });

    // Parse trade volume from string formats like "$2.1M", "$2,100,000", "2100000"
    const parseTradeVolume = (volume) => {
      if (!volume) return 0;
      if (typeof volume === 'number') return volume;

      const volumeStr = String(volume).toLowerCase();
      console.log('[REPORT] Parsing trade volume:', volumeStr);

      // Extract numeric value
      const numericMatch = volumeStr.match(/[\d,\.]+/);
      if (!numericMatch) return 0;
      const numeric = parseFloat(numericMatch[0].replace(/,/g, ''));

      // Handle M, K suffixes
      let result = numeric;
      if (volumeStr.includes('m') || volumeStr.includes('million')) {
        result = numeric * 1000000;
      } else if (volumeStr.includes('k') || volumeStr.includes('thousand')) {
        result = numeric * 1000;
      }

      console.log('[REPORT] Extracted trade volume:', result);
      return result;
    };

    // Calculate actual financial impact
    const tradeVolume = parseTradeVolume(subscriberData.trade_volume);
    const currentTariffCost = subscriberData.annual_tariff_cost || 0;

    // Get component origins for USMCA analysis
    const componentOrigins = subscriberData.component_origins || [];

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

    // Get USMCA threshold from subscriber data or use product-specific defaults
    const usmcaThreshold = subscriberData.usmca_threshold
      || subscriberData.rvc_requirement
      || 75; // USMCA default for most products (automotive 75%, textiles 85%, etc.)

    // Get Mexico cost premium from subscriber data or use intelligent defaults
    const mexicoCostPremium = subscriberData.mexico_cost_premium
      || subscriberData.nearshoring_cost_premium
      || 0.10; // Default: 10% higher component costs for Mexico vs China

    // Extract Cristina's recommended shift percentage from her compliance recommendations
    // Look for patterns like "shift 30%", "move 25%", "migrate 40%"
    const shiftPercentageMatch = validationData.compliance_recommendations?.match(/(?:shift|move|migrate|source)\s+(\d+)%/i);
    let recommendedShiftPercentage = shiftPercentageMatch ? parseInt(shiftPercentageMatch[1]) : 30; // Default to 30% if not found

    // Calculate if this recommendation will reach USMCA threshold
    const currentRVC = mexicoPercentage + usPercentage + canadaPercentage;
    const newRVC = currentRVC + recommendedShiftPercentage;
    const needsAdditionalShift = newRVC < usmcaThreshold;
    const additionalShiftNeeded = needsAdditionalShift ? (usmcaThreshold - newRVC) : 0;

    // Get tariff rates from subscriber data or use intelligent defaults
    const avgTariffRate = subscriberData.avg_tariff_rate
      || subscriberData.mfn_rate
      || (currentTariffCost && tradeVolume ? currentTariffCost / tradeVolume : null)
      || 0.025; // Fallback: 2.5% average for most products

    // Calculate potential USMCA savings based on actual component origins
    let usmcaSavings = 0;
    if (currentRVC < usmcaThreshold) {
      // Calculate savings on non-USMCA qualifying content
      const nonQualifyingContent = 100 - currentRVC;
      const nonQualifyingValue = tradeVolume * (nonQualifyingContent / 100);
      usmcaSavings = Math.round(nonQualifyingValue * avgTariffRate);
    } else {
      // Already qualified, savings would be from maintaining qualification
      usmcaSavings = currentTariffCost;
    }

    console.log('[REPORT] Cristina recommended shift percentage:', recommendedShiftPercentage);
    console.log('[REPORT] Current RVC:', currentRVC, '% | New RVC after shift:', newRVC, '% | Additional needed:', additionalShiftNeeded, '%');
    console.log('[REPORT] Financial data:', { tradeVolume, currentTariffCost, calculatedSavings: usmcaSavings });

    // Determine industry context from subscriber data (make expertise relevant to their industry)
    const industryContext = subscriberData.product_category
      || subscriberData.industry_sector
      || (subscriberData.product_description ? `${subscriberData.product_description}` : null)
      || 'international trade';

    // Generate comprehensive report using OpenRouter
    const reportPrompt = `You are formatting a professional HS Classification Report for Cristina Escalante, Licensed Customs Broker #4601913 with 17 years of ${industryContext} logistics experience.

CRITICAL INSTRUCTION: Cristina has already provided her professional analysis. Your job is to format it into a professional report. Use her EXACT words for all sections marked "CRISTINA'S". DO NOT add to, modify, or paraphrase her professional input. She is the licensed expert - your role is formatting only.

CLIENT BUSINESS PROFILE:
Company: ${subscriberData.company_name || serviceRequest.client_company}
Business Type: ${subscriberData.business_type || 'Importer/Exporter'}
Annual Trade Volume: $${tradeVolume.toLocaleString()}
Product: ${subscriberData.product_description || stage1Data.product_description}
Manufacturing Location: ${subscriberData.manufacturing_location || 'Multiple locations'}
Current USMCA Status: ${subscriberData.qualification_status || 'Under review'}

COMPONENT SOURCING BREAKDOWN:
${componentOrigins.length > 0 ? componentOrigins.map(c => `- ${c.country}: ${c.percentage}% (${c.component_type || 'components'})`).join('\n') : '- No component origin data provided'}

FINANCIAL EXPOSURE:
- Annual Trade Volume: $${tradeVolume.toLocaleString()}
- Current Tariff Cost: $${currentTariffCost.toLocaleString()}/year
- Potential USMCA Savings: $${usmcaSavings.toLocaleString()}/year
- China Sourcing Risk: ${chinaPercentage}% exposure to tariff changes

COMPLIANCE GAPS IDENTIFIED:
${Array.isArray(subscriberData.compliance_gaps) && subscriberData.compliance_gaps.length > 0
  ? subscriberData.compliance_gaps.map(gap => `- ${gap}`).join('\n')
  : '- Component origin documentation incomplete\n- USMCA qualification pathway unclear\n- Supplier certification gaps'}

VULNERABILITY FACTORS:
${Array.isArray(subscriberData.vulnerability_factors) && subscriberData.vulnerability_factors.length > 0
  ? subscriberData.vulnerability_factors.map(v => `- ${v}`).join('\n')
  : '- High China sourcing creates tariff exposure\n- Limited USMCA-compliant supplier options\n- Trade agreement uncertainty'}

HS CODE CLASSIFICATION:
Validated HS Code: ${validationData.validated_hs_code}
Classification Confidence: ${validationData.confidence_level}% (Cristina's professional assessment)

CRISTINA'S PROFESSIONAL ANALYSIS:
Broker Notes: ${validationData.broker_notes}
Specific Risks Identified: ${validationData.specific_risks}
Compliance Recommendations: ${validationData.compliance_recommendations}
Audit Defense Strategy: ${validationData.audit_defense}

YOUR TASK:
Write a professional HS Classification Report that demonstrates your 17 years of ${industryContext} logistics expertise. Be SPECIFIC and ACTIONABLE for THIS specific ${subscriberData.business_type || 'business'}.

REQUIRED SECTIONS:

## 1. EXECUTIVE SUMMARY
- State the validated HS code with ${validationData.confidence_level}% confidence level
- Calculate exact duty cost: With annual trade volume of $${tradeVolume.toLocaleString()}, and current tariff cost of $${currentTariffCost.toLocaleString()}, show the effective duty rate calculation
- Show USMCA savings opportunity: If they shift sourcing from China to Mexico, they could save up to $${usmcaSavings.toLocaleString()}/year
- CRITICAL MATH CLARITY: Of your $${currentTariffCost.toLocaleString()} annual tariff cost, $${(currentTariffCost * chinaPercentage / 100).toFixed(0)} is due to Chinese-sourced components (${chinaPercentage}% of total sourcing). The remaining $${(currentTariffCost * (100 - chinaPercentage) / 100).toFixed(0)} comes from non-USMCA compliant components from other countries.

CRITICAL: The client's actual trade volume is $${tradeVolume.toLocaleString()}/year. DO NOT write "if trade volume is $0" or any variation. Use the actual $${tradeVolume.toLocaleString()} figure in all calculations.

## 2. COMPONENT ORIGIN ANALYSIS (CRITICAL FOR USMCA)

Show the breakdown with BOTH percentages AND dollar amounts for each component source:
${componentOrigins.length > 0 ? componentOrigins.map(c => `- ${c.country}: ${c.percentage}% = $${(tradeVolume * c.percentage / 100).toLocaleString()} in ${c.component_type || 'components'}`).join('\n') : '- Component data not available'}

USMCA QUALIFICATION ANALYSIS:
- Currently qualifies for USMCA: Mexico ${mexicoPercentage}%, US ${usPercentage}%, Canada ${canadaPercentage}% = Total RVC: ${mexicoPercentage + usPercentage + canadaPercentage}%
- Does NOT qualify: China ${chinaPercentage}% ($${(tradeVolume * chinaPercentage / 100).toLocaleString()}), Taiwan ${componentOrigins.find(c => c.country === 'Taiwan')?.percentage || 0}%
- USMCA requirement: ${usmcaThreshold}% Regional Value Content
- Gap to close: ${usmcaThreshold - (mexicoPercentage + usPercentage + canadaPercentage)}% more RVC needed

When Cristina recommends shifting Chinese sourcing to Mexico, show this EXACT calculation format:
- China components total value: $${(tradeVolume * chinaPercentage / 100).toLocaleString()}
- Cristina recommends shifting: ${recommendedShiftPercentage}% of Chinese components (from her compliance recommendations)
- That's: ${recommendedShiftPercentage}% × $${(tradeVolume * chinaPercentage / 100).toLocaleString()} = $${(tradeVolume * chinaPercentage / 100 * recommendedShiftPercentage / 100).toLocaleString()} to migrate

## 3. TARIFF COST BREAKDOWN & ROI ANALYSIS

**CURRENT STATE:**
- Total annual trade volume: $${tradeVolume.toLocaleString()}
- China sourcing: ${chinaPercentage}% × $${tradeVolume.toLocaleString()} = $${(tradeVolume * chinaPercentage / 100).toLocaleString()} in Chinese components
- Annual tariff on Chinese components: $${(currentTariffCost * chinaPercentage / 100).toLocaleString()}
- Total annual tariff cost: $${currentTariffCost.toLocaleString()}
- Current USMCA Regional Value Content: ${mexicoPercentage + usPercentage + canadaPercentage}% (NOT qualified - need ${usmcaThreshold}%)

**IF YOU FOLLOW CRISTINA'S RECOMMENDATION:**

Step 1: What to migrate
- Shift ${recommendedShiftPercentage}% of Chinese ${componentOrigins.find(c => {
  const countryValue = c.country || c.origin_country;
  return ['CN', 'CHN', 'China'].includes(countryValue);
})?.component_type || componentOrigins.find(c => {
  const countryValue = c.country || c.origin_country;
  return ['CN', 'CHN', 'China'].includes(countryValue);
})?.description || 'electronics'} from China to Mexico
- ${recommendedShiftPercentage}% of $${(tradeVolume * chinaPercentage / 100).toLocaleString()} = **$${(tradeVolume * chinaPercentage / 100 * recommendedShiftPercentage / 100).toLocaleString()} worth of sourcing to migrate**

Step 2: New component breakdown
- China: ${chinaPercentage - recommendedShiftPercentage}% (down from ${chinaPercentage}%)
- Mexico: ${mexicoPercentage + recommendedShiftPercentage}% (up from ${mexicoPercentage}%)
- Taiwan: ${componentOrigins.find(c => {
  const countryValue = c.country || c.origin_country;
  return ['TW', 'TWN', 'Taiwan'].includes(countryValue);
})?.percentage || componentOrigins.find(c => {
  const countryValue = c.country || c.origin_country;
  return ['TW', 'TWN', 'Taiwan'].includes(countryValue);
})?.value_percentage || 25}% (unchanged)
- US: ${usPercentage}% (unchanged)
- Canada: ${canadaPercentage}% (unchanged)

Step 3: New USMCA qualification
- New Regional Value Content: ${newRVC}%
- **Status: ${newRVC >= usmcaThreshold ? '✅ QUALIFIES for USMCA preferential treatment (meets ' + usmcaThreshold + '% threshold)' : '⚠️  PARTIAL PROGRESS - Still ' + additionalShiftNeeded + '% short of ' + usmcaThreshold + '% threshold'}**
${needsAdditionalShift ? `
- **IMPORTANT**: This ${recommendedShiftPercentage}% shift is a strong first step, but to fully qualify for USMCA preferential treatment, you'll need to:
  1. Complete this initial ${recommendedShiftPercentage}% shift to Mexico (gets you to ${newRVC}% RVC)
  2. Then shift an additional ${additionalShiftNeeded}% from non-USMCA countries to reach the ${usmcaThreshold}% threshold
  3. Alternative: Obtain USMCA supplier declarations for Taiwan components if eligible` : ''}

Step 4: Annual savings
- Tariff savings from USMCA qualification: **$${usmcaSavings.toLocaleString()}/year**
- Every year after transition: $${usmcaSavings.toLocaleString()} in reduced tariff costs

Step 5: Cost of transition & ROI
- Typical Mexico vs China cost premium: ~${(mexicoCostPremium * 100).toFixed(0)}% higher component costs
- One-time transition investment: $${(tradeVolume * chinaPercentage / 100 * recommendedShiftPercentage / 100).toLocaleString()} × ${(mexicoCostPremium * 100).toFixed(0)}% = **$${(tradeVolume * chinaPercentage / 100 * recommendedShiftPercentage / 100 * mexicoCostPremium).toLocaleString()}**
- Annual savings: $${usmcaSavings.toLocaleString()}
- **Break-even timeline: ${((tradeVolume * chinaPercentage / 100 * recommendedShiftPercentage / 100 * mexicoCostPremium) / usmcaSavings).toFixed(1)} years**
- After break-even: $${usmcaSavings.toLocaleString()}/year in ongoing savings

**CONCLUSION:** This is a concrete, financially justified business decision. You invest $${(tradeVolume * chinaPercentage / 100 * recommendedShiftPercentage / 100 * mexicoCostPremium).toLocaleString()} to save $${usmcaSavings.toLocaleString()} annually. The investment pays for itself in ${((tradeVolume * chinaPercentage / 100 * recommendedShiftPercentage / 100 * mexicoCostPremium) / usmcaSavings).toFixed(1)} years.

## 4. CRISTINA'S PROFESSIONAL COMPLIANCE RECOMMENDATIONS

CRITICAL: These are Cristina's professional recommendations based on her 17 years of experience. Use her EXACT words verbatim. DO NOT paraphrase, add to, or modify in any way.

"${validationData.compliance_recommendations}"

Format this exactly as she wrote it. If she numbered them, keep the numbers. If she used bullet points, keep the bullets. This is her professional opinion backed by her customs broker license.

## 5. CRISTINA'S AUDIT DEFENSE STRATEGY

CRITICAL: This is Cristina's professional audit defense strategy. Use her EXACT words verbatim. DO NOT add explanations or expand on it.

"${validationData.audit_defense}"

This is based on her 17 years of experience defending classifications in customs audits across multiple industries including ${industryContext}.

## 6. CRISTINA'S PROFESSIONAL ASSESSMENT

CRITICAL: Write this section in first person as Cristina, using her EXACT input verbatim. DO NOT paraphrase or modify her words.

**Classification Validation:**
"${validationData.broker_notes}"

**Risk Assessment:**
"${validationData.specific_risks}"

**My Professional Recommendations:**
"${validationData.compliance_recommendations}"

**Audit Defense Preparation:**
"${validationData.audit_defense}"

Signed,
Cristina Escalante
Licensed Customs Broker #4601913
17 Years Electronics/Telecom Logistics Experience

TONE: Professional but direct. Use actual numbers. Be specific. Show your expertise through concrete recommendations, not generic platitudes.

Format as a formal business report with clear headers, bullet points for key findings, and bold text for critical recommendations.`;

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{
          role: 'user',
          content: reportPrompt
        }]
      })
    });

    if (!openRouterResponse.ok) {
      throw new Error('OpenRouter API call failed');
    }

    const aiResponse = await openRouterResponse.json();
    const reportContent = aiResponse.choices?.[0]?.message?.content;

    if (!reportContent) {
      throw new Error('OpenRouter API returned empty response. No report content generated.');
    }

    // Create email draft using Gmail API (requires nodemailer)
    const nodemailer = require('nodemailer');

    // Configure Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const emailSubject = `HS Classification Report - ${subscriberData.company_name || serviceRequest.client_company} - ${new Date().toLocaleDateString()}`;

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
    <h1>HS Classification Report</h1>
    <p>Professional Customs Broker Analysis</p>
  </div>

  <div class="content">
    <div class="credentials">
      <strong>Licensed Customs Broker:</strong> Cristina Escalante<br>
      <strong>License Number:</strong> #4601913<br>
      <strong>Expertise:</strong> 17 years international logistics experience specializing in ${industryContext}<br>
      <strong>Service Date:</strong> ${new Date().toLocaleDateString()}
    </div>

    <div class="section">
      <h2>Client Information</h2>
      <p><strong>Company:</strong> ${subscriberData.company_name || serviceRequest.client_company}</p>
      <p><strong>Product:</strong> ${subscriberData.product_description || stage1Data?.product_description}</p>
      <p><strong>Validated HS Code:</strong> ${validationData.validated_hs_code}</p>
    </div>

    <div class="report-content">
      ${reportContent.replace(/\n/g, '<br>')}
    </div>

    <div class="section">
      <p><em>This report has been prepared by a licensed customs broker and is backed by professional liability insurance. For questions or clarifications, please contact Triangle Intelligence Platform.</em></p>
    </div>

    <div class="section" style="background: #f0f9ff; padding: 20px; border-left: 4px solid #2563eb; margin-top: 30px;">
      <h3 style="color: #2563eb; margin-top: 0;">📄 Download Your Official USMCA Certificate</h3>
      <p>Your professional USMCA Certificate of Origin (all 12 required fields) is available for download:</p>
      <p style="margin: 20px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?view=certificates&id=${serviceRequestId}"
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
          Download USMCA Certificate (PDF)
        </a>
      </p>
      <p style="font-size: 14px; color: #6b7280;">This certificate includes all 12 USMCA-required fields and is signed by Cristina Escalante, Licensed Customs Broker #4601913</p>
    </div>
  </div>
</body>
</html>
    `;

    // Save as draft in Gmail
    const mailOptions = {
      from: 'Triangle Intelligence <triangleintel@gmail.com>',
      to: 'triangleintel@gmail.com',
      subject: emailSubject,
      html: emailBody
    };

    // Send email (will go to drafts if using Gmail API properly, or sent folder for testing)
    await transporter.sendMail(mailOptions);

    // Update service request with completion data
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({
        status: 'completed',
        completion_data: {
          report_generated: true,
          report_content: reportContent,
          validated_hs_code: validationData.validated_hs_code,
          broker_notes: validationData.broker_notes,
          email_sent: true,
          email_to: 'triangleintel@gmail.com',
          completed_at: new Date().toISOString(),
          completed_by: 'Cristina Escalante - License #4601913'
        }
      })
      .eq('id', serviceRequestId);

    if (updateError) {
      console.error('Error updating service request:', updateError);
    }

    return res.status(200).json({
      success: true,
      message: 'HS Classification report generated and sent to triangleintel@gmail.com',
      report_content: reportContent,
      email_subject: emailSubject,
      validated_hs_code: validationData.validated_hs_code
    });

  } catch (error) {
    console.error('Error generating HS Classification report:', error);
    return res.status(500).json({
      error: 'Failed to generate report',
      details: error.message
    });
  }
}