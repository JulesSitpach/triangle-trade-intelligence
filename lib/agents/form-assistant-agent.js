import { BaseAgent } from './base-agent.js';

export class FormAssistantAgent extends BaseAgent {
  constructor() {
    super({
      name: 'FormAssistant',
      model: 'claude-3-haiku-20240307',
      maxTokens: 1500
    });
  }

  async suggestFieldValue(fieldName, userContext, previousCertificates = []) {
    const prompt = `User is completing a USMCA certificate and needs help with the "${fieldName}" field.

Current context:
${JSON.stringify(userContext, null, 2)}

Previous certificates from this user:
${JSON.stringify(previousCertificates.slice(0, 3), null, 2)}

Task: Suggest the most appropriate value for "${fieldName}" based on:
1. User's previous certificate patterns
2. Current form context (other fields filled in)
3. Industry best practices
4. USMCA compliance requirements

Return JSON:
{
  "suggestion": "suggested value",
  "confidence": 0-100,
  "explanation": "why this suggestion makes sense",
  "source": "where suggestion came from (previous cert, industry standard, etc)"
}`;

    const result = await this.execute(prompt, {
      fieldName,
      userContext,
      previousCertificates: previousCertificates.length
    });

    this.logInteraction(prompt, result, result.success);

    return result;
  }

  async autoPopulateForm(partialData, userHistory) {
    const prompt = `User is starting a new USMCA certificate. Auto-populate as many fields as possible.

Partial data already entered:
${JSON.stringify(partialData, null, 2)}

User's certificate history:
${JSON.stringify(userHistory.slice(0, 5), null, 2)}

Task: Fill in missing fields intelligently based on:
1. Most recent patterns from user history
2. Consistency with partially entered data
3. USMCA compliance requirements
4. Common business practices

Return JSON:
{
  "populated_fields": {
    "field_name": {
      "value": "suggested value",
      "confidence": 0-100,
      "source": "why this value was chosen"
    }
  },
  "overall_confidence": 0-100,
  "fields_requiring_attention": ["field1", "field2"]
}`;

    const result = await this.execute(prompt, {
      partialData,
      historyCount: userHistory.length
    });

    this.logInteraction(prompt, result, result.success);

    return result;
  }

  async suggestCompletionOrder(formData, requiredFields) {
    const prompt = `User is filling out a USMCA certificate. Suggest the optimal order to complete remaining fields.

Current progress:
${JSON.stringify(formData, null, 2)}

Required fields still empty:
${JSON.stringify(requiredFields, null, 2)}

Task: Determine the most logical order to complete fields based on:
1. Dependencies (some fields need others first)
2. Complexity (easier fields first builds momentum)
3. Data availability (suggest fields user likely has info for)
4. USMCA workflow best practices

Return JSON:
{
  "suggested_order": [
    {
      "field": "field_name",
      "reason": "why this should be next",
      "estimated_difficulty": "easy|medium|hard"
    }
  ],
  "completion_percentage": 0-100,
  "estimated_time_remaining": "X minutes"
}`;

    const result = await this.execute(prompt, {
      currentProgress: Object.keys(formData).length,
      remainingFields: requiredFields.length
    });

    return result;
  }

  async validateUserInput(fieldName, value, formContext) {
    const prompt = `User entered "${value}" for field "${fieldName}". Validate this input.

Current form context:
${JSON.stringify(formContext, null, 2)}

Task: Check if the input is:
1. Valid format for this field type
2. Consistent with other form data
3. Compliant with USMCA requirements
4. Reasonable for this industry/product type

Return JSON:
{
  "valid": true|false,
  "issues": [
    {
      "severity": "error|warning|info",
      "message": "description of issue",
      "suggestion": "how to fix it"
    }
  ],
  "confidence": 0-100
}`;

    const result = await this.execute(prompt, {
      fieldName,
      value,
      formContext
    });

    return result;
  }

  async suggestFromHistory(userId, fieldName, certificateHistory) {
    if (!certificateHistory || certificateHistory.length === 0) {
      return {
        success: false,
        message: 'No history available for suggestions'
      };
    }

    const recentValues = certificateHistory
      .slice(0, 5)
      .map(cert => cert[fieldName])
      .filter(Boolean);

    if (recentValues.length === 0) {
      return {
        success: false,
        message: `No previous values found for ${fieldName}`
      };
    }

    const mostCommon = this.findMostCommonValue(recentValues);
    const uniqueValues = [...new Set(recentValues)];

    return {
      success: true,
      data: {
        suggestion: mostCommon,
        confidence: (recentValues.filter(v => v === mostCommon).length / recentValues.length) * 100,
        alternatives: uniqueValues.filter(v => v !== mostCommon).slice(0, 2),
        source: 'user_history',
        explanation: `Used most frequently in your last ${recentValues.length} certificates`
      }
    };
  }

  findMostCommonValue(values) {
    const frequency = {};
    let maxCount = 0;
    let mostCommon = values[0];

    values.forEach(value => {
      frequency[value] = (frequency[value] || 0) + 1;
      if (frequency[value] > maxCount) {
        maxCount = frequency[value];
        mostCommon = value;
      }
    });

    return mostCommon;
  }

  async getSmartDefaults(formType, userProfile) {
    const prompt = `Provide smart default values for a ${formType} based on user profile.

User profile:
${JSON.stringify(userProfile, null, 2)}

Task: Suggest default values that make sense for this user based on:
1. Their business type and industry
2. Their typical trade patterns
3. Their location and trading partners
4. USMCA certificate standards

Return JSON:
{
  "defaults": {
    "field_name": {
      "value": "default value",
      "confidence": 0-100,
      "explanation": "why this is a good default"
    }
  }
}`;

    const result = await this.execute(prompt, { formType, userProfile });
    return result;
  }
}

export default FormAssistantAgent;