/**
 * PDF Content Extraction API using Claude AI
 * Extracts and analyzes content from uploaded documents
 * Supports: Supplier verification, Market entry, Intelligence analysis
 */

import pdf from 'pdf-parse';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { file_path, field, context_type = 'supplier' } = req.body;

  if (!file_path || !field) {
    return res.status(400).json({
      error: 'Missing required parameters: file_path and field'
    });
  }

  try {
    const fullPath = `./public${file_path}`;

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        error: 'File not found'
      });
    }

    let extractedText = '';

    // Extract text based on file type
    if (file_path.toLowerCase().endsWith('.pdf')) {
      const pdfBuffer = fs.readFileSync(fullPath);
      const pdfData = await pdf(pdfBuffer);
      extractedText = pdfData.text;
    } else if (file_path.toLowerCase().endsWith('.txt')) {
      extractedText = fs.readFileSync(fullPath, 'utf8');
    } else {
      // For images and other documents, we'll let Claude know it's an image
      extractedText = `[Document type: ${file_path.split('.').pop().toUpperCase()} file - Visual content analysis needed]`;
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({
        error: 'Could not extract meaningful text from document'
      });
    }

    // Generate context-specific prompt for Claude
    const prompt = generateExtractionPrompt(field, context_type, extractedText);

    // Use Claude to extract and analyze relevant information
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const analysisContent = response.content[0].text;

    res.json({
      success: true,
      content: analysisContent,
      original_text_preview: extractedText.substring(0, 300) + '...',
      field: field,
      context_type: context_type,
      extraction_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PDF extraction error:', error);

    if (error.message.includes('Invalid API key')) {
      return res.status(500).json({
        error: 'AI service configuration error'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to extract and analyze document content',
      details: error.message
    });
  }
}

function generateExtractionPrompt(field, contextType, documentText) {
  const basePrompt = `As Jorge's AI assistant for Mexico trade services, analyze this document and extract relevant information.

Document content:
${documentText}

Context: ${contextType}
Field: ${field}

`;

  // Supplier verification prompts
  if (contextType === 'supplier') {
    const fieldPrompts = {
      business_docs: `Extract business registration information including:
- Company legal name and registration number
- Date of incorporation
- Business address and jurisdiction
- Legal entity type (LLC, Corporation, etc.)
- Current registration status
- Key officers or directors mentioned

Format as a professional summary for supplier verification.`,

      tax_docs: `Extract tax and compliance information including:
- Tax identification numbers (VAT, EIN, etc.)
- Tax registration status and jurisdiction
- Compliance history or issues mentioned
- Filing status and dates
- Any tax-related certifications

Format as a professional tax compliance summary.`,

      certifications: `Extract certification and licensing information including:
- Industry certifications (ISO, quality standards)
- Professional licenses
- Export/import permits
- Regulatory approvals
- Certification expiry dates
- Issuing authorities

Format as a professional certifications summary.`,

      insurance: `Extract insurance coverage information including:
- Types of insurance coverage
- Coverage limits and amounts
- Policy numbers and carriers
- Effective dates and renewals
- Specific coverage for trade/export activities
- Any claims history mentioned

Format as a professional insurance coverage summary.`,

      financials: `Extract financial information including:
- Annual revenue figures
- Profit margins or financial performance
- Assets and liabilities
- Credit ratings or financial stability indicators
- Banking relationships
- Financial trends or concerns

Format as a professional financial summary for supplier assessment.`,

      legal_compliance: `Extract legal and compliance information including:
- Any legal disputes or litigation
- Regulatory violations or penalties
- Compliance certifications
- Legal entity good standing
- Any sanctions or restrictions
- Corporate governance matters

Format as a professional legal compliance summary.`
    };

    return basePrompt + (fieldPrompts[field] || 'Extract relevant business information for supplier verification.');
  }

  // Market entry prompts
  if (contextType === 'market_entry') {
    const fieldPrompts = {
      requirements: `Extract client requirements including:
- Target market objectives
- Products/services to be offered
- Timeline expectations
- Budget considerations
- Specific Mexico market goals
- Success metrics mentioned

Format as a client requirements summary for market entry consultation.`,

      market_definition: `Extract market definition information including:
- Target regions in Mexico
- Industry sectors of interest
- Customer demographics
- Market size indicators
- Competition landscape
- Regulatory environment factors

Format as a Mexico market definition summary.`,

      competitive_analysis: `Extract competitive analysis information including:
- Competitor companies identified
- Market positioning strategies
- Pricing information
- Competitive advantages/disadvantages
- Market share data
- Competitive threats or opportunities

Format as a competitive analysis summary for Mexico market entry.`,

      regulatory_requirements: `Extract regulatory information including:
- Legal requirements for market entry
- Permits and licenses needed
- Regulatory compliance obligations
- Industry-specific regulations
- Import/export requirements
- Government relationships or approvals

Format as a regulatory requirements summary for Mexico market entry.`
    };

    return basePrompt + (fieldPrompts[field] || 'Extract relevant information for Mexico market entry consultation.');
  }

  // Intelligence analysis prompts
  if (contextType === 'intelligence') {
    return basePrompt + `Extract strategic intelligence including:
- Market trends and developments
- Regulatory changes or announcements
- Competitive intelligence
- Supply chain disruptions or opportunities
- Economic indicators affecting Mexico trade
- Industry news and implications
- Client opportunity identification

Format as a strategic intelligence briefing with actionable insights for Jorge's Mexico trade practice.`;
  }

  // Default prompt
  return basePrompt + `Extract and summarize the key information relevant to "${field}" for Jorge's Mexico trade services practice. Focus on actionable insights and professional analysis.`;
}