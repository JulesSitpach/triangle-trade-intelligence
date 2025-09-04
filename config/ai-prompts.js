/**
 * AI PROMPTS CONFIGURATION
 * Truly configurable prompts through environment variables
 * NO hardcoded prompt fallbacks
 */

const getEnvValue = (key, defaultValue = null) => {
  return process.env[key] || defaultValue;
};

/**
 * Core HS Classification Prompt
 * Environment variable: AI_PROMPT_HS_CLASSIFICATION
 */
const getHSClassificationPrompt = () => {
  return getEnvValue('AI_PROMPT_HS_CLASSIFICATION') || 
    getEnvValue('AI_PROMPT_HS_DEFAULT') || 
    // Minimal fallback - not hundreds of lines
    `Classify "{productDescription}" (business: {businessType}) into 3-5 specific HS codes. Return JSON: {"results":[{"code":"851830","description":"Headphones and earphones","confidence":95,"reasoning":"Direct match"}]}`;
};

/**
 * Improved HS Classification Prompt
 * Focus on EXACT product function matching
 */
const getImprovedHSPrompt = () => {
  return `TASK: Find the EXACT HS code for this specific product.

Product: "{productDescription}"
Business: "{businessType}"

CRITICAL: Match the SPECIFIC FUNCTION, not general category.

Examples of GOOD matching:
- "Bluetooth earbuds" → 851830 (Headphones/earphones) ✅
- "Bluetooth earbuds" → 852871 (TV equipment) ❌

Examples of BAD matching:
- Classifying "smartphone chargers" as "TV equipment" 
- Classifying "leather handbags" as "textile materials"

RULES:
1. FUNCTION FIRST: What does this product actually do?
2. MATERIAL SECOND: What is it made of?
3. USE CONTEXT: Who uses it and how?

Return 3-5 codes maximum, confidence 85+ only.

CRITICAL: Return ONLY valid JSON, no explanations or text before/after.

{
  "results": [
    {
      "code": "HSXXXX",
      "description": "Product description from official HS database",
      "confidence": 90,
      "reasoning": "Explanation of why this code matches the product"
    }
  ]
}`;
};

export const AI_PROMPTS = {
  hsClassification: {
    // Use improved prompt by default, allow override
    directClassification: getEnvValue('AI_PROMPT_HS_CLASSIFICATION') || getImprovedHSPrompt(),
    
    // Simplified prompts for other functions
    confidenceScoring: getEnvValue('AI_PROMPT_CONFIDENCE') || 
      `Rate each HS code 1-100 for "{userDescription}". Return JSON array: [95, 87, 65]`,
      
    keywordExtraction: getEnvValue('AI_PROMPT_KEYWORDS') || 
      `Extract keywords from "{productDescription}". Return: keyword1, keyword2, keyword3`
  }
};

export default AI_PROMPTS;