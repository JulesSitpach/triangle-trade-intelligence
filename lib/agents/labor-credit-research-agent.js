/**
 * LABOR CREDIT RESEARCH AGENT
 *
 * Uses AI to research USMCA Article 4.5 labor value credit guidelines
 * and populate industry-specific labor credit percentages.
 *
 * Purpose:
 * - Research typical labor credit percentages by industry
 * - Populate industry_thresholds table with labor_percentage data
 * - Provide baseline values for labor credit calculations
 *
 * Data Sources (via AI):
 * - USMCA Article 4.5 (Labor Value Content)
 * - Industry manufacturing standards
 * - Trade compliance best practices
 */

import { BaseAgent } from './base-agent.js';

export class LaborCreditResearchAgent extends BaseAgent {
  constructor() {
    super({
      name: 'LaborCreditResearch',
      model: 'anthropic/claude-sonnet-4',  // Use Sonnet for better research accuracy
      maxTokens: 2000
    });
  }

  /**
   * Research labor credit percentage for a specific industry
   * @param {string} industry - Industry name (e.g., "Electronics", "Automotive")
   * @param {string} manufacturingLocation - Where manufactured (US, CA, MX)
   * @returns {Promise<Object>} Labor credit research results
   */
  async researchLaborCredit(industry, manufacturingLocation = 'United States') {
    const prompt = `You are a USMCA trade compliance expert researching labor value credit under Article 4.5.

TASK: Determine the typical labor value credit percentage for manufacturing in ${manufacturingLocation} in the ${industry} industry.

USMCA ARTICLE 4.5 GUIDELINES:
- Direct labor costs (assembly, processing, testing, integration)
- Direct overhead (supervision, quality control, facilities, engineering)
- Excludes: Materials, indirect overhead, profit
- Typical range: 5-25% depending on manufacturing complexity

INDUSTRY: ${industry}

Consider:
1. Manufacturing complexity (manual vs automated)
2. Skill level required (assembly vs engineering)
3. Process intensity (simple assembly vs substantial transformation)
4. Industry standards and benchmarks
5. USMCA compliance precedents

NOTE: Research from authoritative sources only. Do not use preset ranges - calculate based on actual industry practices.

Return ONLY valid JSON:
{
  "industry": "${industry}",
  "labor_credit_percentage": 0,
  "labor_credit_decimal": 0.00,
  "manufacturing_location": "${manufacturingLocation}",
  "typical_processes": ["process1", "process2", "process3"],
  "complexity_level": "low|medium|high",
  "reasoning": "Brief explanation of why this percentage",
  "usmca_article": "Article 4.5",
  "confidence": 0,
  "sources": ["USMCA Article 4.5", "Industry standards"]
}`;

    const result = await this.execute(prompt, {
      industry,
      manufacturingLocation,
      temperature: 0.2  // Lower temperature for more consistent research
    });

    if (result.success && result.data.labor_credit_percentage) {
      // Validate percentage is in reasonable range (5-25%)
      if (result.data.labor_credit_percentage < 5 || result.data.labor_credit_percentage > 25) {
        console.warn(`⚠️ [LaborCreditResearch] ${industry}: ${result.data.labor_credit_percentage}% outside typical range (5-25%)`);
      }

      // Calculate decimal format
      result.data.labor_credit_decimal = result.data.labor_credit_percentage / 100;

      console.log(`✅ [LaborCreditResearch] ${industry}: ${result.data.labor_credit_percentage}% labor credit`);
    }

    this.logInteraction(prompt, result, result.success);
    return result;
  }

  /**
   * Research labor credit for multiple industries in batch
   * @param {Array<string>} industries - List of industry names
   * @param {string} manufacturingLocation - Where manufactured
   * @returns {Promise<Array>} Array of research results
   */
  async researchBatch(industries, manufacturingLocation = 'United States') {
    const results = [];

    console.log(`🔍 [LaborCreditResearch] Researching ${industries.length} industries...`);

    for (const industry of industries) {
      const result = await this.researchLaborCredit(industry, manufacturingLocation);
      results.push(result);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successful = results.filter(r => r.success).length;
    console.log(`✅ [LaborCreditResearch] Completed: ${successful}/${industries.length} successful`);

    return results;
  }
}

export default LaborCreditResearchAgent;
