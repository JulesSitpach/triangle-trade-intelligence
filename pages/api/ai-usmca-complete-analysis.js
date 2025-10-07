/**
 * AI-POWERED USMCA COMPLETE ANALYSIS
 * Pure AI approach - no local calculations, no config files
 * AI handles: threshold determination, calculation, qualification, recommendations
 * Flexible for changing trade policies
 */

import { protectedApiHandler } from '../../lib/api/apiHandler.js';
import { createClient } from '@supabase/supabase-js';
import { logInfo, logError } from '../../lib/utils/production-logger.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default protectedApiHandler({
  POST: async (req, res) => {
    const startTime = Date.now();
    const userId = req.user.id;

  try {
    const formData = req.body;

    console.log('🤖 ========== AI-POWERED USMCA ANALYSIS: START ==========');
    console.log('📥 Received request:', {
      company: formData.company_name,
      business_type: formData.business_type,
      product: formData.product_description,
      component_count: formData.component_origins?.length
    });

    // Validate required fields
    if (!formData.company_name || !formData.business_type || !formData.component_origins || formData.component_origins.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: company_name, business_type, component_origins'
      });
    }

    // Build comprehensive AI prompt with all context
    const prompt = buildComprehensiveUSMCAPrompt(formData);

    console.log('🎯 ========== SENDING TO OPENROUTER ==========');
    console.log('Prompt length:', prompt.length, 'characters');

    // Call OpenRouter API
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet', // Use more powerful model for complex analysis
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.1 // Low temperature for consistent, factual responses
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenRouter API failed: ${aiResponse.status} ${aiResponse.statusText}`);
    }

    const aiResult = await aiResponse.json();
    const aiText = aiResult.choices?.[0]?.message?.content;

    console.log('🔮 ========== RAW AI RESPONSE ==========');
    console.log(aiText);
    console.log('========== END RAW RESPONSE ==========');

    // Parse AI response (expecting JSON)
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/) || aiText.match(/```\s*([\s\S]*?)\s*```/);
      let jsonText = jsonMatch ? jsonMatch[1] : aiText;

      // If parsing fails, try to extract just the JSON object (between first { and last })
      if (!jsonMatch) {
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        }
      }

      analysis = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      throw new Error(`AI response parsing failed: ${parseError.message}`);
    }

    console.log('✅ Parsed analysis:', {
      qualified: analysis.usmca?.qualified,
      threshold: analysis.usmca?.threshold_applied,
      content: analysis.usmca?.north_american_content,
      recommendation_count: analysis.recommendations?.length
    });

    // Format response for UI
    const result = {
      success: true,
      workflow_completed: true,
      processing_time_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      method: 'ai_powered',

      // Company information (pass through ALL fields for certificate)
      company: {
        name: formData.company_name,
        company_name: formData.company_name, // Alias for compatibility
        business_type: formData.business_type,
        trade_volume: formData.trade_volume,
        supplier_country: formData.supplier_country,
        destination_country: formData.destination_country,

        // Company details for certificate
        company_address: formData.company_address || '',
        address: formData.company_address || '',
        tax_id: formData.tax_id || '',
        contact_person: formData.contact_person || '',
        contact_email: formData.contact_email || '',
        contact_phone: formData.contact_phone || '',
        country: formData.destination_country || 'US',
        exporter_country: formData.destination_country || 'US'
      },

      // Product classification
      product: {
        success: true,
        hs_code: analysis.product?.hs_code || 'AI-classified',
        description: formData.product_description,
        product_description: formData.product_description,
        confidence: analysis.product?.confidence || 85,
        classification_method: 'ai_analysis',
        manufacturing_location: formData.manufacturing_location || ''
      },

      // USMCA qualification (from AI)
      usmca: {
        qualified: analysis.usmca?.qualified || false,
        north_american_content: analysis.usmca?.north_american_content || 0,
        regional_content: analysis.usmca?.north_american_content || 0, // Alias for certificate
        threshold_applied: analysis.usmca?.threshold_applied || 0,
        rule: analysis.usmca?.rule || 'Regional Value Content',
        reason: analysis.usmca?.reason || 'AI analysis complete',
        component_breakdown: analysis.usmca?.component_breakdown || formData.component_origins,
        qualification_level: analysis.usmca?.qualified ? 'qualified' : 'not_qualified',
        qualification_status: analysis.usmca?.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
        preference_criterion: analysis.usmca?.qualified ? 'B' : null,
        manufacturing_location: formData.manufacturing_location || '',
        documentation_required: analysis.usmca?.documentation_required || [
          'Manufacturing records',
          'Bill of materials',
          'Supplier declarations'
        ]
      },

      // Tariff savings (only if qualified for USMCA)
      savings: {
        annual_savings: analysis.usmca?.qualified ? (analysis.savings?.annual_savings || 0) : 0,
        monthly_savings: analysis.usmca?.qualified ? (analysis.savings?.monthly_savings || 0) : 0,
        savings_percentage: analysis.usmca?.qualified ? (analysis.savings?.savings_percentage || 0) : 0,
        mfn_rate: analysis.savings?.mfn_rate || 0,
        usmca_rate: analysis.savings?.usmca_rate || 0
      },

      // Certificate (if qualified)
      certificate: analysis.usmca?.qualified ? {
        qualified: true,
        preference_criterion: 'B',
        blanket_start: new Date().toISOString().split('T')[0],
        blanket_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      } : null,

      // AI-generated recommendations
      recommendations: analysis.recommendations || [],

      // Trust indicators
      trust: {
        ai_powered: true,
        model: 'claude-3.5-sonnet',
        confidence_score: analysis.confidence_score || 85,
        disclaimer: 'AI-powered analysis for informational purposes. Consult licensed customs broker for official compliance.'
      }
    };

    // Also store component origins and workflow context for results/certificate display
    result.component_origins = formData.component_origins;
    result.components = formData.component_origins; // Alias
    result.manufacturing_location = formData.manufacturing_location;
    result.workflow_data = {
      company_name: formData.company_name,
      business_type: formData.business_type,
      product_description: formData.product_description,
      manufacturing_location: formData.manufacturing_location
    };

    logInfo('AI-powered USMCA analysis completed', {
      company: formData.company_name,
      qualified: result.usmca.qualified,
      processing_time: result.processing_time_ms
    });

    // Save workflow to database for dashboard display
    try {
      const { error: insertError } = await supabase
        .from('workflow_sessions')
        .insert({
          user_id: userId,
          session_id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          company_name: formData.company_name,
          business_type: formData.business_type,
          manufacturing_location: formData.manufacturing_location,
          trade_volume: formData.trade_volume ? parseFloat(formData.trade_volume.replace(/[^0-9.-]+/g, '')) : null,
          product_description: formData.product_description,
          hs_code: result.product.hs_code,
          component_origins: formData.component_origins,
          qualification_status: result.usmca.qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
          regional_content_percentage: result.usmca.north_american_content,
          required_threshold: result.usmca.threshold_applied,
          compliance_gaps: result.usmca.qualified ? null : { gap: `${result.usmca.gap}% gap from ${result.usmca.threshold_applied}% threshold` },
          completed_at: new Date().toISOString()
        });

      if (insertError) {
        logError('Failed to save workflow to database', { error: insertError.message });
        // Don't fail the request, just log the error
      } else {
        console.log('✅ Workflow saved to database for user:', userId);
      }
    } catch (dbError) {
      logError('Database save error', { error: dbError.message });
      // Don't fail the request
    }

    return res.status(200).json(result);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError('AI-powered USMCA analysis failed', {
      error: error.message,
      stack: error.stack,
      processing_time: processingTime
    });

    return res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
  }
});

/**
 * Build comprehensive AI prompt with all USMCA rules and context
 */
function buildComprehensiveUSMCAPrompt(formData) {
  // Format component breakdown with full details
  const componentBreakdown = formData.component_origins
    .map((c, i) => `Component ${i + 1}: "${c.description || 'Not specified'}" - ${c.value_percentage}% from ${c.origin_country}${c.hs_code ? ` (HS: ${c.hs_code})` : ''}`)
    .join('\n');

  const prompt = `You are a USMCA trade compliance expert analyzing a product for USMCA qualification. Perform a complete analysis including threshold determination, regional content calculation, qualification check, and recommendations.

===== COMPANY PROFILE =====
Company: ${formData.company_name}
Business Type: ${formData.business_type}
Annual Trade Volume: ${formData.trade_volume || 'Not specified'}
Primary Supplier: ${formData.primary_supplier_country || formData.supplier_country || 'Not specified'}
Manufacturing/Assembly: ${formData.manufacturing_location || 'Not specified'}
Export Destination: ${formData.export_destination || formData.destination_country || 'United States'}

===== PRODUCT DETAILS =====
Product: ${formData.product_description}

===== COMPONENT BREAKDOWN =====
${componentBreakdown}

Total Components: ${formData.component_origins?.length || 0}
Total Percentage: ${formData.component_origins?.reduce((sum, c) => sum + (parseFloat(c.value_percentage) || 0), 0)}%

USMCA THRESHOLD RULES (Official Treaty Standards):
1. **Textiles & Apparel**: 55% regional content threshold (yarn-forward rule applies)
2. **Automotive & Transportation**: 75% regional content threshold (strict requirements)
3. **Electronics & Technology**: 65% regional content threshold
4. **Machinery & Equipment**: 60% regional content threshold
5. **Chemicals & Pharmaceuticals**: 62.5% regional content threshold
6. **Food & Agriculture**: 60% regional content threshold (product-specific rules may apply)
7. **General Manufacturing**: 62.5% regional content threshold (default)

USMCA MEMBER COUNTRIES:
- United States (US)
- Mexico (MX)
- Canada (CA)

ANALYSIS INSTRUCTIONS:

1. **Determine Applicable Threshold**: Based on the business type, identify which threshold applies (55%, 60%, 62.5%, 65%, or 75%)

2. **Calculate Regional Content**:
   - Add up ALL component percentages from US, MX, and CA
   - This is the "North American Content %"
   - Formula: SUM(components from US + MX + CA)

3. **Qualification Check**:
   - Compare North American Content % to Threshold %
   - If North American Content >= Threshold: QUALIFIED
   - If North American Content < Threshold: NOT QUALIFIED
   - Calculate the gap: (Threshold - North American Content)

4. **Generate Recommendations** (ONLY if NOT QUALIFIED):
   - Identify specific non-USMCA components to replace
   - Suggest which USMCA countries/regions for sourcing
   - Be product-specific (textiles→fabric mills, electronics→component manufacturers, automotive→supplier hubs)
   - Provide 3-4 actionable steps, each under 20 words

5. **Estimate Tariff Savings** (if data available):
   - Typical MFN rates by product category
   - USMCA preferential rate: 0%
   - Estimate annual savings based on trade volume

REQUIRED OUTPUT FORMAT (JSON):

{
  "product": {
    "hs_code": "classified HS code or best estimate",
    "confidence": 85
  },
  "usmca": {
    "qualified": true or false,
    "threshold_applied": number (e.g., 55, 60, 62.5, 65, or 75),
    "north_american_content": number (calculated percentage),
    "gap": number (threshold - content, or 0 if qualified),
    "rule": "Regional Value Content (XX% required)",
    "reason": "Product meets/does not meet required XX% North American content threshold.",
    "component_breakdown": [
      {
        "description": "component description",
        "origin_country": "country code",
        "value_percentage": number,
        "is_usmca_member": true or false
      }
    ],
    "documentation_required": ["list of required documents"]
  },
  "savings": {
    "annual_savings": estimated number,
    "monthly_savings": estimated number,
    "savings_percentage": estimated percentage,
    "mfn_rate": estimated rate,
    "usmca_rate": 0
  },
  "recommendations": [
    "specific recommendation 1",
    "specific recommendation 2",
    "specific recommendation 3"
  ],
  "confidence_score": 85
}

CRITICAL RULES:
- Be mathematically precise in calculations
- Use exact threshold for business type (don't round or estimate)
- Show your work in the "reason" field
- Recommendations must reference SPECIFIC components by description
- If qualified, recommendations array can be empty or contain optimization tips
- Always return valid JSON

Perform the analysis now:`;

  return prompt;
}
