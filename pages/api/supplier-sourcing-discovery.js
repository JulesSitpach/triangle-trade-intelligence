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
    console.log('[SUPPLIER DISCOVERY] RAW REQUEST BODY:', JSON.stringify(req.body, null, 2));

    const { request_id, subscriber_data, sourcing_requirements } = req.body;

    console.log('[SUPPLIER DISCOVERY] Starting AI supplier discovery...');
    console.log('[SUPPLIER DISCOVERY] request_id:', request_id);
    console.log('[SUPPLIER DISCOVERY] subscriber_data:', JSON.stringify(subscriber_data, null, 2));
    console.log('[SUPPLIER DISCOVERY] sourcing_requirements:', JSON.stringify(sourcing_requirements, null, 2));

    // Build comprehensive business context from subscriber data
    const businessContext = {
      company: {
        name: subscriber_data?.company_name || 'Company',
        business_type: subscriber_data?.business_type,
        industry: subscriber_data?.industry,
        contact: subscriber_data?.contact_name,
        email: subscriber_data?.contact_email,
        phone: subscriber_data?.contact_phone
      },
      product: {
        description: subscriber_data?.product_description || 'manufacturing',
        category: subscriber_data?.product_category,
        manufacturing_location: subscriber_data?.manufacturing_location,
        component_origins: subscriber_data?.component_origins || []
      },
      trade: {
        annual_volume: subscriber_data?.trade_volume,
        supplier_country: subscriber_data?.supplier_country,
        target_markets: subscriber_data?.target_markets || [],
        import_frequency: subscriber_data?.import_frequency,
        current_usmca_status: subscriber_data?.qualification_status
      },
      financial_impact: {
        annual_tariff_cost: subscriber_data?.annual_tariff_cost,
        potential_usmca_savings: subscriber_data?.potential_usmca_savings
      },
      risk_assessment: {
        compliance_gaps: subscriber_data?.compliance_gaps || [],
        vulnerability_factors: subscriber_data?.vulnerability_factors || [],
        regulatory_requirements: subscriber_data?.regulatory_requirements || []
      },
      sourcing_requirements: {
        monthly_volume: sourcing_requirements?.monthly_volume,
        certifications: sourcing_requirements?.certifications || [],
        payment_terms: sourcing_requirements?.payment_terms,
        timeline: sourcing_requirements?.timeline,
        usmca_priority: sourcing_requirements?.usmca_priority
      }
    };

    // Get current suppliers from component origins
    const currentSuppliers = businessContext.product.component_origins.map(c => c.country).filter(c => c !== 'United States' && c !== 'Mexico');

    // Call OpenRouter for AI strategic supplier discovery with full business context
    console.log('[SUPPLIER DISCOVERY] Calling OpenRouter API for supplier discovery...');

    const aiPrompt = `You are helping Business Development Specialist, a B2B sales expert at CCVIAL, find Mexico suppliers for this client.

CLIENT: ${businessContext.company.name}
INDUSTRY: ${businessContext.company.industry}
PRODUCT: ${businessContext.product.description}

CURRENT SUPPLY CHAIN (what they need Mexico to replace):
${businessContext.product.component_origins.map(c => `- ${c.country}: ${c.percentage}% - ${c.description || c.component_type || 'components'}`).join('\n')}

REQUIREMENTS:
- Trade Volume: $${businessContext.trade.annual_volume}
- Quality Certifications Needed: ${businessContext.sourcing_requirements.certifications.join(', ')}
- Monthly Volume: ${businessContext.sourcing_requirements.monthly_volume || 'Not specified'}
- Payment Terms: ${businessContext.sourcing_requirements.payment_terms || 'Negotiable'}
- Timeline: ${businessContext.sourcing_requirements.timeline || 'Standard'}

Find 5-7 Mexico suppliers who can manufacture the components they currently import from ${businessContext.product.component_origins.filter(c => c.country !== 'United States' && c.country !== 'Mexico').map(c => c.country).join(' and ')}.

Return JSON array:
[
  {
    "name": "Mexico company name",
    "location": "City, State",
    "capabilities": "What they manufacture (match component needs)",
    "website": "https://www.[name].com.mx",
    "company_size": "Small: <50 | Medium: 50-250 | Large: 250+",
    "certifications": ["ISO 9001", "ISO 13485", "FDA"],
    "production_capacity": "Units/month or volume level",
    "usmca_ready": "High/Medium/Low",
    "contact_approach": "Direct website contact | CCVIAL network introduction",
    "match_reason": "Why this supplier fits their needs",
    "confidence": 0.9
  }
]`;

    let discoveredSuppliers = [];

    try {
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Triangle Trade Intelligence - Supplier Discovery'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4.5', // UPGRADED: Supplier vetting affects USMCA qualification and product quality
          messages: [{
            role: 'user',
            content: aiPrompt
          }],
          temperature: 0.7,
          max_tokens: 3000 // Increased for comprehensive supplier analysis
        })
      });

      if (openRouterResponse.ok) {
        const openRouterData = await openRouterResponse.json();
        const aiResponseText = openRouterData.choices[0]?.message?.content || '';

        console.log('[SUPPLIER DISCOVERY] OpenRouter API response received');
        console.log('[SUPPLIER DISCOVERY] AI Response preview:', aiResponseText.substring(0, 500));

        // Parse JSON array from AI response
        try {
          const jsonMatch = aiResponseText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            console.log('[SUPPLIER DISCOVERY] JSON match found, length:', jsonMatch[0].length);
            discoveredSuppliers = JSON.parse(jsonMatch[0]);
            console.log(`✅ [SUPPLIER DISCOVERY] Successfully parsed ${discoveredSuppliers.length} AI-discovered suppliers`);
          } else {
            console.warn('[SUPPLIER DISCOVERY] No JSON array found in response');
            console.log('[SUPPLIER DISCOVERY] Full response:', aiResponseText);
          }
        } catch (parseError) {
          console.error('[SUPPLIER DISCOVERY] JSON parse error:', parseError.message);
          console.log('[SUPPLIER DISCOVERY] Failed to parse:', jsonMatch?.[0]?.substring(0, 200));
          discoveredSuppliers = [];
        }
      } else {
        console.error(`[SUPPLIER DISCOVERY] OpenRouter API error: ${openRouterResponse.status}`);
      }
    } catch (aiError) {
      console.error('[SUPPLIER DISCOVERY] OpenRouter AI discovery failed:', aiError);
      throw new Error(`AI supplier discovery failed: ${aiError.message}`);
    }

    // Save AI-discovered suppliers to database - Jorge will add detailed info later
    console.log(`[DATABASE SAVE] Starting to save ${discoveredSuppliers.length} suppliers to database...`);

    for (const supplier of discoveredSuppliers) {
      try {
        const { data: existing } = await supabase
          .from('suppliers')
          .select('id')
          .eq('name', supplier.name)
          .single();

        if (!existing) {
          console.log(`[DATABASE SAVE] Saving new supplier: ${supplier.name}`);

          // Save minimal info - Jorge builds out the rest
          const { error: insertError } = await supabase
            .from('suppliers')
            .insert({
              name: supplier.name,
              company_name: supplier.name,
              location: supplier.location || 'Mexico',
              country: 'Mexico',
              website: supplier.website || null,
              verification_status: 'ai_discovered',
              partnership_level: 'prospect',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            console.error(`[DATABASE SAVE] Insert error for ${supplier.name}:`, insertError);
          } else {
            console.log(`✅ [DATABASE SAVE] Successfully saved: ${supplier.name}`);
          }
        } else {
          console.log(`[DATABASE SAVE] Supplier already exists: ${supplier.name}`);
        }
      } catch (dbError) {
        console.error(`[DATABASE SAVE] Exception for ${supplier.name}:`, dbError.message);
      }
    }

    console.log(`[DATABASE SAVE] Completed database save process`);

    // Return response - match UI expectations for Jorge's workflow
    return res.status(200).json({
      success: true,
      ai_analysis: {
        prioritized_suppliers: discoveredSuppliers.map(supplier => ({
          supplier_name: supplier.name,
          location: supplier.location,
          capabilities: supplier.capabilities,
          website: supplier.website,
          fit_score: supplier.confidence ? Math.round(supplier.confidence * 10) : 8,
          reasoning: supplier.match_reason || `Matches ${businessContext.product.description} requirements`,
          usmca_benefit: supplier.usmca_ready === 'High' ? 'Full USMCA qualification ready' : 'USMCA compliant',
          contact_info: {
            company_size: supplier.company_size,
            certifications: supplier.certifications,
            production_capacity: supplier.production_capacity,
            contact_approach: supplier.contact_approach
          }
        })),
        usmca_strategy: {
          regional_value_improvement: `Switch from ${currentSuppliers.join(', ')} to Mexico suppliers`,
          tariff_savings_potential: `$${Number(businessContext.financial_impact.potential_usmca_savings || 0).toLocaleString()}/year`,
          qualification_timeline: '3-6 months for USMCA qualification'
        },
        jorge_b2b_approach: {
          spanish_talking_points: [
            `Volumen anual: $${Number(businessContext.trade.annual_volume || 0).toLocaleString()}`,
            `Cliente establecido busca proveedor México confiable`,
            `Relación comercial a largo plazo`,
            `Certificaciones: ${businessContext.sourcing_requirements.certifications.join(', ')}`
          ],
          next_steps: [
            'Contact suppliers via website or CCVIAL network',
            'Schedule capability calls',
            'Request samples and certifications',
            'Negotiate pricing',
            'Coordinate site visits'
          ]
        }
      },
      suppliers: discoveredSuppliers,
      total_found: discoveredSuppliers.length
    });

  } catch (error) {
    console.error('[SUPPLIER DISCOVERY] Fatal error:', error);
    return res.status(500).json({
      success: false,
      error: 'Supplier discovery failed',
      message: error.message
    });
  }
}
