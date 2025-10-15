/**
 * USMCA Document Analysis API - Phase 1 Quick Win
 * When Jorge uploads client documents, AI analyzes and flags missing items
 *
 * Input: Subscriber workflow data
 * Output: Document completeness analysis, missing items, extracted key data
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { serviceRequestId, subscriberData } = req.body;

    if (!subscriberData) {
      return res.status(400).json({ error: 'Subscriber data is required' });
    }

    // Build enhanced AI prompt leveraging Jorge's Mexico-based SMB expertise
    const analysisPrompt = `You are Jorge's AI assistant for USMCA document analysis.

**JORGE'S BACKGROUND**:
- Mexico-based (Mérida, Yucatán) - Native Spanish speaker
- Ran Mexican business (Art Printing) for 7 years
- Understands SMB operational reality AND Mexican business culture
- Direct access to Mexico suppliers as fellow Mexican entrepreneur (not foreign buyer)

**JORGE'S COMPETITIVE ADVANTAGE**:
- Calls Mexico suppliers in native Spanish (cultural insider, not translator)
- Knows how Mexican business works (payment terms, lead times, relationship expectations)
- Can physically visit suppliers if client wants (optional add-on, travel paid separately)
- Time zone aligned with US/Canada clients

**JORGE'S TASK**: Identify what compliance documents are missing, focusing on what's REALISTIC for an SMB to obtain without breaking the bank.

✅ **BUSINESS DATA ALREADY COLLECTED (DO NOT REQUEST AGAIN):**
- Company Name: ${subscriberData.company_name || 'Not provided'}
- Contact Info: ${subscriberData.contact_person || 'Not provided'} (${subscriberData.contact_email || 'Not provided'})
- Business Type: ${subscriberData.business_type || 'Not provided'}
- Product Description: ${subscriberData.product_description || 'Not provided'}
- HS Code (AI-generated): ${subscriberData.classified_hs_code || subscriberData.hs_code || 'Not provided'}
- Annual Trade Volume: $${subscriberData.trade_volume || 'Not provided'}
- Manufacturing Location: ${subscriberData.manufacturing_location || 'Not provided'}
- Component Origins: ${subscriberData.component_origins ? subscriberData.component_origins.map((comp, idx) =>
  `${comp.origin_country} ${comp.value_percentage}% (${comp.description || comp.component_type || 'component'})`
).join(', ') : 'Not provided'}
- USMCA Qualification Status: ${subscriberData.qualification_status || 'Not assessed'}
- Potential Savings: $${subscriberData.potential_usmca_savings || 'Not calculated'}/year

**JORGE'S SMB BUSINESS OWNER PERSPECTIVE** (7 years running Art Printing):
- Don't ask for documents that cost $10,000+ to produce (SMBs can't afford that)
- Focus on supplier certificates they likely already have (most suppliers maintain these)
- Prioritize documents that save money IMMEDIATELY (ROI matters)
- Flag if client needs trade compliance expert partner (some docs require legal expertise)
- Estimate realistic timeline (Jorge knows suppliers take 2-3 weeks to respond, not 2 days)

**COMPLIANCE DOCUMENTS TO EVALUATE**:
Match documents to each supplier country in their supply chain:

1. **Supplier USMCA Origin Certificates** - From ${subscriberData.component_origins ?
   subscriberData.component_origins.filter(c => ['Mexico', 'Canada', 'United States'].includes(c.origin_country)).map(c => c.origin_country).join(', ') || 'USMCA suppliers' : 'USMCA suppliers'}
2. **Bill of Materials (BOM)** - Detailed BOM with part numbers (client may have this already)
3. **Manufacturing Process Documentation** - Proof of substantial transformation (if applicable)
4. **Supplier Declarations** - From ${subscriberData.component_origins ?
   subscriberData.component_origins.map(c => c.origin_country).join(', ') : 'all suppliers'} confirming origin
5. **Commercial Invoices** - Last 3-6 months (client should have these)
6. **Technical Specifications** - To validate HS code ${subscriberData.classified_hs_code || 'classification'}
7. **Customs Entry Documents** - Recent CBP paperwork (if importing)

**ANALYZE WITH JORGE'S SMB LENS**:
For each missing document:
- Which specific supplier needs to provide it? (Be specific to their supply chain)
- Estimated cost to obtain? ($0 if supplier already has it, $500 for legal review, etc.)
- Estimated timeline? (2-3 weeks for supplier certificates is realistic)
- Can client get this themselves or need customs broker partner?
- Does this document save more money than it costs? (Jorge thinks ROI)

**MARKETPLACE INTELLIGENCE TO COLLECT**:
- Supplier responsiveness patterns: Which countries typically provide documents faster?
- Document difficulty: Which docs are hardest for SMBs in ${subscriberData.business_type || 'this industry'} to obtain?
- Common gaps: What do most ${subscriberData.business_type || 'similar businesses'} miss?
- Cost-benefit: Which documents have best ROI for $${subscriberData.trade_volume || 'N/A'}/year volume?

**PREPARE FOR USMCA POLICY CHANGES**:
- Geographic flexibility: How dependent are they on Canada (if trilateral becomes bilateral)?
- Nearshoring readiness: Can they move ${subscriberData.component_origins ?
   subscriberData.component_origins.filter(c => c.origin_country === 'China').map(c => c.value_percentage + '%').join(', ') || '0%' : '0%'} from China to Mexico?
- Mexico relationships: Do they have ${subscriberData.component_origins ?
   subscriberData.component_origins.filter(c => c.origin_country === 'Mexico').length : '0'} Mexico suppliers already?

RETURN JSON FORMAT:
{
  "documents_present": ["List what business data they already provided"],
  "documents_missing": [
    "For each missing doc: 'Document Name - From [Specific Supplier] - Est. Cost: $X - Timeline: Y weeks - DIY or needs customs broker?'"
  ],
  "data_quality_score": "HIGH/MEDIUM/LOW",
  "data_quality_issues": ["Flag ONLY data quality issues, not missing docs"],
  "immediate_actions": [
    "Jorge's next steps: 'Contact [supplier] to request [specific doc]'",
    "Be specific with supplier names and timelines"
  ],
  "hs_code_assessment": "Jorge's perspective: Does ${subscriberData.classified_hs_code || 'this HS code'} make sense for '${subscriberData.product_description || 'this product'}'? (Cristina will validate)",
  "estimated_document_cost": "Total cost for client to obtain all missing docs: $X-Y",
  "estimated_timeline": "Realistic timeline: X-Y weeks (Jorge knows suppliers take time)",
  "ready_for_cristina_review": false,
  "blocking_issues": ["List missing DOCUMENTS that block USMCA qualification"],
  "marketplace_insights": {
    "supplier_responsiveness": "Which countries in their supply chain respond faster?",
    "document_difficulty": "Which docs are hardest for ${subscriberData.business_type || 'this industry'}?",
    "nearshoring_opportunity": "Can they replace ${subscriberData.component_origins ?
      subscriberData.component_origins.filter(c => c.origin_country === 'China').map(c => c.value_percentage + '%').join(', ') || '0%' : '0%'} China with Mexico?"
  }
}

**JORGE'S REALITY CHECK**: Focus on documents that are FREE or low-cost and available within 2-4 weeks. If something requires $5K+ or 6 months, flag it as "Consider trade compliance expert partner for this."`;


    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://triangle-trade-intelligence.vercel.app',
        'X-Title': 'Triangle Trade Intelligence - USMCA Document Analysis'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2500  // Increased for marketplace insights + Jorge's detailed SMB analysis
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API Error:', errorText);
      throw new Error(`OpenRouter API failed: ${openRouterResponse.status}`);
    }

    const aiResult = await openRouterResponse.json();
    const aiContent = aiResult.choices[0].message.content;

    // Parse AI response
    let analysisResult;
    try {
      // Try to extract JSON from AI response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if AI didn't return proper JSON
        analysisResult = {
          documents_present: ['Product description', 'Company information', 'Component origins'],
          documents_missing: ['Supplier certificates - Est. Cost: $0-500 - Timeline: 2-3 weeks'],
          data_quality_score: 'MEDIUM',
          data_quality_issues: ['AI response parsing issue'],
          immediate_actions: ['Jorge will manually review client data and contact suppliers'],
          hs_code_assessment: 'Requires Cristina\'s validation',
          estimated_document_cost: '$0-1000',
          estimated_timeline: '2-4 weeks',
          ready_for_cristina_review: true,
          blocking_issues: [],
          marketplace_insights: {
            supplier_responsiveness: 'Unable to analyze',
            document_difficulty: 'Unable to analyze',
            nearshoring_opportunity: 'Requires manual assessment'
          }
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      analysisResult = {
        documents_present: ['Product description', 'Company information', 'Component origins'],
        documents_missing: ['Unable to analyze - Jorge will review manually'],
        data_quality_score: 'MEDIUM',
        data_quality_issues: ['AI response format issue'],
        immediate_actions: ['Jorge will manually review and contact suppliers'],
        hs_code_assessment: 'Requires Cristina\'s manual validation',
        estimated_document_cost: 'Unable to estimate',
        estimated_timeline: 'TBD after manual review',
        ready_for_cristina_review: true,
        blocking_issues: [],
        marketplace_insights: {
          supplier_responsiveness: 'Unable to analyze',
          document_difficulty: 'Unable to analyze',
          nearshoring_opportunity: 'Requires manual assessment'
        }
      };
    }

    // Add metadata
    analysisResult.analysis_timestamp = new Date().toISOString();
    analysisResult.analyzed_by = 'AI (Claude Haiku)';
    analysisResult.service_request_id = serviceRequestId;

    return res.status(200).json({
      success: true,
      analysis: analysisResult
    });

  } catch (error) {
    console.error('Document analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      fallback_analysis: {
        documents_present: ['Basic client data received'],
        documents_missing: ['AI analysis failed - Jorge will manually review'],
        data_quality_score: 'UNKNOWN',
        data_quality_issues: ['API error occurred'],
        immediate_actions: ['Jorge will proceed with manual document review and supplier contact'],
        hs_code_assessment: 'Requires Cristina\'s validation',
        estimated_document_cost: 'TBD after manual review',
        estimated_timeline: '2-4 weeks (typical)',
        ready_for_cristina_review: true,
        blocking_issues: ['AI analysis failed - Jorge performing manual review'],
        marketplace_insights: {
          supplier_responsiveness: 'Unable to collect',
          document_difficulty: 'Unable to collect',
          nearshoring_opportunity: 'Manual assessment needed'
        }
      }
    });
  }
}
