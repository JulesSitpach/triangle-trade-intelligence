import { BaseAgent } from './base-agent.js';
import { createClient } from '@supabase/supabase-js';

export class ClassificationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Classification',
      model: 'claude-3-haiku-20240307',
      maxTokens: 2000
    });

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async suggestHSCode(productDescription, componentOrigins = [], additionalContext = {}) {
    const similarCodes = await this.searchSimilarHSCodes(productDescription);

    const prompt = `Classify this product and suggest the correct HS code for USMCA compliance.

Product Description: ${productDescription}

Component Origins: ${JSON.stringify(componentOrigins, null, 2)}

Additional Context: ${JSON.stringify(additionalContext, null, 2)}

Similar HS codes from database (for reference):
${JSON.stringify(similarCodes.slice(0, 5), null, 2)}

Task: Determine the most accurate HS code based on:
1. Product description and technical specifications
2. Harmonized Tariff Schedule classification rules
3. Component origins for USMCA qualification
4. Similar products in our database (34,476 codes)

Return JSON:
{
  "hsCode": "8-10 digit HS code",
  "confidence": 0-100,
  "explanation": "detailed reasoning for this classification",
  "usmcaQualification": "likely|possible|unlikely",
  "alternativeCodes": [
    {
      "code": "alternative code",
      "confidence": 0-100,
      "reason": "when to use this instead"
    }
  ],
  "requiredDocumentation": ["doc1", "doc2"],
  "tariffRate": "estimated rate if known"
}`;

    const result = await this.execute(prompt, {
      productDescription,
      componentOrigins,
      similarCodesFound: similarCodes.length
    });

    if (result.success && result.data.hsCode) {
      const dbValidation = await this.validateAgainstDatabase(result.data.hsCode);
      result.data.databaseMatch = dbValidation;
    }

    this.logInteraction(prompt, result, result.success);

    return result;
  }

  async searchSimilarHSCodes(productDescription) {
    try {
      const keywords = this.extractKeywords(productDescription);

      const { data, error } = await this.supabase
        .from('hs_master_rebuild')
        .select('*')
        .or(keywords.map(kw => `description.ilike.%${kw}%`).join(','))
        .limit(10);

      if (error) {
        console.error('[Classification] Database search error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[Classification] Search error:', error);
      return [];
    }
  }

  extractKeywords(description) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];

    const words = description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));

    return [...new Set(words)].slice(0, 5);
  }

  async validateAgainstDatabase(hsCode) {
    try {
      const normalized = hsCode.replace(/[\.\s\-]/g, '');

      const { data, error } = await this.supabase
        .from('hs_master_rebuild')
        .select('*')
        .eq('hts_code', normalized)
        .single();

      if (error || !data) {
        const partialMatch = await this.findPartialMatch(normalized);
        return {
          exactMatch: false,
          partialMatch: partialMatch !== null,
          matchedCode: partialMatch,
          confidence: partialMatch ? 60 : 0
        };
      }

      return {
        exactMatch: true,
        data: data,
        description: data.description,
        tariffRate: data.general_rate || data.special_rate,
        confidence: 95
      };
    } catch (error) {
      console.error('[Classification] Database validation error:', error);
      return { exactMatch: false, error: error.message };
    }
  }

  async findPartialMatch(hsCode) {
    try {
      const patterns = [
        hsCode.substring(0, 8),
        hsCode.substring(0, 6),
        hsCode.substring(0, 4)
      ];

      for (const pattern of patterns) {
        const { data } = await this.supabase
          .from('hs_master_rebuild')
          .select('*')
          .like('hts_code', `${pattern}%`)
          .limit(1);

        if (data && data.length > 0) {
          return data[0];
        }
      }

      return null;
    } catch (error) {
      console.error('[Classification] Partial match error:', error);
      return null;
    }
  }

  async validateHSCode(hsCode, productDescription) {
    const prompt = `Validate if HS code ${hsCode} is correct for this product.

Product Description: ${productDescription}

Task: Check if this HS code assignment is accurate based on:
1. Product characteristics vs HS code definition
2. Harmonized Tariff Schedule rules
3. Common classification errors
4. Industry best practices

Return JSON:
{
  "valid": true|false,
  "confidence": 0-100,
  "issues": [
    {
      "severity": "error|warning|info",
      "message": "description of issue"
    }
  ],
  "recommendation": "keep code|suggest alternative|need expert review",
  "alternativeCode": "suggested code if applicable"
}`;

    const result = await this.execute(prompt, {
      hsCode,
      productDescription
    });

    const dbCheck = await this.validateAgainstDatabase(hsCode);
    if (result.success) {
      result.data.databaseValidation = dbCheck;
    }

    return result;
  }

  async suggestWithConfidenceBreakdown(productDescription, componentOrigins) {
    const result = await this.suggestHSCode(productDescription, componentOrigins);

    if (!result.success) return result;

    const confidenceFactors = {
      productClarity: this.assessProductClarity(productDescription),
      databaseMatch: result.data.databaseMatch?.confidence || 0,
      componentConsistency: this.assessComponentConsistency(componentOrigins),
      aiConfidence: result.data.confidence || 50
    };

    const adjustedConfidence = (
      confidenceFactors.productClarity * 0.3 +
      confidenceFactors.databaseMatch * 0.3 +
      confidenceFactors.componentConsistency * 0.2 +
      confidenceFactors.aiConfidence * 0.2
    );

    result.data.confidenceBreakdown = confidenceFactors;
    result.data.adjustedConfidence = Math.round(adjustedConfidence);

    const escalation = this.shouldEscalateToExpert(
      result.data.adjustedConfidence,
      productDescription.length < 50 ? 'high' : 'medium'
    );

    result.data.expertRecommendation = escalation;

    return result;
  }

  assessProductClarity(description) {
    let score = 50;

    if (description.length > 100) score += 20;
    if (description.length > 200) score += 10;

    const technicalTerms = ['voltage', 'material', 'dimensions', 'weight', 'capacity', 'specification'];
    const foundTerms = technicalTerms.filter(term => description.toLowerCase().includes(term));
    score += foundTerms.length * 5;

    return Math.min(score, 100);
  }

  assessComponentConsistency(componentOrigins) {
    if (!componentOrigins || componentOrigins.length === 0) {
      return 30;
    }

    const usmcaCountries = ['US', 'CA', 'MX', 'United States', 'Canada', 'Mexico'];
    const usmcaComponents = componentOrigins.filter(comp =>
      usmcaCountries.some(country =>
        comp.origin?.toUpperCase().includes(country.toUpperCase())
      )
    );

    const usmcaPercentage = (usmcaComponents.length / componentOrigins.length) * 100;

    return usmcaPercentage > 60 ? 90 : usmcaPercentage > 40 ? 70 : 50;
  }

  async getAlternativeClassifications(productDescription, primaryHSCode) {
    const prompt = `The primary HS code suggestion for this product is ${primaryHSCode}.

Product: ${productDescription}

Task: Provide 2-3 alternative HS code classifications that might also be valid.
Consider:
1. Different interpretation angles
2. Edge cases and special circumstances
3. Regional classification variations
4. Common industry alternatives

Return JSON:
{
  "alternatives": [
    {
      "code": "HS code",
      "confidence": 0-100,
      "useCase": "when to use this instead of primary",
      "tradeoffs": "advantages and disadvantages"
    }
  ]
}`;

    const result = await this.execute(prompt, { productDescription, primaryHSCode });
    return result;
  }
}

export default ClassificationAgent;