/**
 * Enhanced Claude Report Generation API
 * Integrates uploaded document data with AI-generated reports
 * Supports: Supplier verification, Market entry consultation, Intelligence analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    type,
    supplier,
    client,
    form_data = {},
    uploaded_documents = [],
    consultation_data = {},
    intelligence_data = {}
  } = req.body;

  if (!type) {
    return res.status(400).json({ error: 'Report type is required' });
  }

  try {
    // Get uploaded documents from database if entity ID provided
    let documentData = uploaded_documents;
    if ((supplier?.id || client?.id) && documentData.length === 0) {
      try {
        const entityId = supplier?.id || client?.id;
        const { data: docs } = await supabase
          .from('jorge_documents')
          .select('*')
          .eq('entity_id', entityId)
          .order('uploaded_at', { ascending: false });

        documentData = docs || [];
      } catch (dbError) {
        console.warn('Could not fetch documents from database:', dbError);
      }
    }

    // Generate report based on type
    let reportContent, reportValue, deliverableType;

    switch (type) {
      case 'supplier_verification_enhanced':
        ({ reportContent, reportValue, deliverableType } = await generateSupplierReport(
          supplier, form_data, documentData
        ));
        break;

      case 'market_entry_consultation':
        ({ reportContent, reportValue, deliverableType } = await generateMarketEntryReport(
          client, consultation_data, documentData
        ));
        break;

      case 'intelligence_analysis_enhanced':
        ({ reportContent, reportValue, deliverableType } = await generateIntelligenceReport(
          intelligence_data, documentData
        ));
        break;

      default:
        return res.status(400).json({ error: 'Unknown report type' });
    }

    res.json({
      success: true,
      report: {
        deliverable_type: deliverableType,
        billable_value: reportValue,
        content: reportContent,
        generated_at: new Date().toISOString(),
        document_count: documentData.length,
        has_attachments: documentData.length > 0
      }
    });

  } catch (error) {
    console.error('Enhanced report generation error:', error);

    if (error.message.includes('Invalid API key')) {
      return res.status(500).json({
        error: 'AI service configuration error'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate enhanced report',
      details: error.message
    });
  }
}

async function generateSupplierReport(supplier, formData, documents) {
  const documentSummary = documents.length > 0
    ? `\n\n## DOCUMENT ANALYSIS\nAnalyzed ${documents.length} uploaded documents:\n${documents.map(doc => `- ${doc.document_type}: ${doc.original_name}`).join('\n')}`
    : '';

  const prompt = `Generate a comprehensive supplier verification report for Jorge's Mexico trade services.

**SUPPLIER:** ${supplier?.name || 'Unknown Supplier'}
**LOCATION:** ${supplier?.location || 'Not specified'}

**VERIFICATION DATA:**
${Object.entries(formData).map(([key, value]) => `${key}: ${value}`).join('\n')}

**UPLOADED DOCUMENTS:** ${documents.length} documents analyzed${documentSummary}

Create a professional report that includes:
1. Executive Summary
2. Verification Status Assessment
3. Risk Analysis (Financial, Operational, Compliance)
4. Document Review Summary
5. USMCA Trade Compliance Evaluation
6. Partnership Recommendation
7. Next Steps and Monitoring Plan

Make this report worth $800 in professional value. Include specific findings from document analysis. Format professionally for client delivery.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  });

  return {
    reportContent: response.content[0].text,
    reportValue: 800,
    deliverableType: 'Supplier Verification Report'
  };
}

async function generateMarketEntryReport(client, consultationData, documents) {
  const documentSummary = documents.length > 0
    ? `\n\n## DOCUMENT ANALYSIS\nAnalyzed ${documents.length} consultation documents:\n${documents.map(doc => `- ${doc.document_type}: ${doc.original_name}`).join('\n')}`
    : '';

  const totalHours = consultationData.total_hours || 0;
  const billingRate = 400;
  const consultationFee = totalHours * billingRate;

  const prompt = `Generate a comprehensive Mexico market entry consultation report for Jorge's trade services.

**CLIENT:** ${client?.company_name || 'Client Company'}
**CONSULTATION DURATION:** ${totalHours} hours at $${billingRate}/hour
**TOTAL CONSULTATION FEE:** $${consultationFee}

**CONSULTATION DATA:**
${Object.entries(consultationData).map(([key, value]) => typeof value === 'object' ? `${key}: ${JSON.stringify(value)}` : `${key}: ${value}`).join('\n')}

**SUPPORTING DOCUMENTS:** ${documents.length} documents analyzed${documentSummary}

Create a professional market entry strategy report that includes:
1. Executive Summary
2. Mexico Market Analysis
3. Regulatory Requirements Assessment
4. Competitive Landscape Analysis
5. Go-to-Market Strategy
6. Partnership Recommendations
7. Implementation Timeline
8. Risk Assessment and Mitigation
9. Financial Projections for Mexico Market
10. Next Steps and Success Metrics

Make this report worth $${Math.max(consultationFee, 2000)} in professional value. Include specific insights from document analysis and consultation sessions.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  return {
    reportContent: response.content[0].text,
    reportValue: Math.max(consultationFee, 2000),
    deliverableType: 'Mexico Market Entry Strategy Report'
  };
}

async function generateIntelligenceReport(intelligenceData, documents) {
  const documentSummary = documents.length > 0
    ? `\n\n## DOCUMENT ANALYSIS\nAnalyzed ${documents.length} intelligence documents:\n${documents.map(doc => `- ${doc.original_name}`).join('\n')}`
    : '';

  const prompt = `Generate a strategic trade intelligence briefing for Jorge's Mexico trade practice.

**INTELLIGENCE SOURCE DATA:**
${JSON.stringify(intelligenceData, null, 2)}

**SUPPORTING DOCUMENTS:** ${documents.length} documents analyzed${documentSummary}

Create a professional intelligence briefing that includes:
1. Executive Summary
2. Market Intelligence Highlights
3. Regulatory Changes Impact Analysis
4. Supplier Network Implications
5. Client Opportunity Identification
6. Risk Alerts and Considerations
7. Strategic Recommendations
8. Action Items for Jorge's Practice
9. Revenue Opportunities Assessment
10. Monitoring and Follow-up Plan

Focus on actionable insights for Mexico trade routes, USMCA compliance, and partnership opportunities. Make this briefing worth $500 in strategic value.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  });

  return {
    reportContent: response.content[0].text,
    reportValue: 500,
    deliverableType: 'Strategic Trade Intelligence Briefing'
  };
}