import { BaseAgent } from './base-agent.js';
import { createClient } from '@supabase/supabase-js';

export class ValidationAgent extends BaseAgent {
  constructor() {
    super({
      name: 'Validation',
      model: 'claude-3-haiku-20240307',
      maxTokens: 2500
    });

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async validateCertificate(certificateData) {
    const requiredFieldsCheck = this.checkRequiredFields(certificateData);
    const usmcaComplianceCheck = await this.checkUSMCACompliance(certificateData);
    const dataConsistencyCheck = this.checkDataConsistency(certificateData);

    const allChecks = {
      requiredFields: requiredFieldsCheck,
      usmcaCompliance: usmcaComplianceCheck,
      dataConsistency: dataConsistencyCheck
    };

    const overallValid = requiredFieldsCheck.valid &&
                         usmcaComplianceCheck.valid &&
                         dataConsistencyCheck.valid;

    const allErrors = [
      ...requiredFieldsCheck.errors,
      ...usmcaComplianceCheck.errors,
      ...dataConsistencyCheck.errors
    ];

    const allWarnings = [
      ...requiredFieldsCheck.warnings,
      ...usmcaComplianceCheck.warnings,
      ...dataConsistencyCheck.warnings
    ];

    const confidence = this.calculateOverallConfidence(allChecks);

    const escalation = this.shouldEscalateToExpert(confidence, this.assessComplexity(certificateData));

    return {
      success: true,
      data: {
        valid: overallValid,
        confidence: confidence,
        errors: allErrors,
        warnings: allWarnings,
        checks: allChecks,
        escalationRecommendation: escalation,
        acceptanceProbability: overallValid ? confidence : Math.max(confidence - 30, 0)
      }
    };
  }

  checkRequiredFields(certificateData) {
    const requiredFields = [
      'exporter_name',
      'exporter_address',
      'importer_name',
      'importer_address',
      'product_description',
      'hs_code',
      'origin_criterion',
      'producer_name'
    ];

    const errors = [];
    const warnings = [];
    const missingFields = [];

    requiredFields.forEach(field => {
      if (!certificateData[field] || certificateData[field].trim() === '') {
        errors.push({
          field: field,
          severity: 'error',
          message: `Required field "${field}" is missing`,
          suggestion: `Please provide ${field.replace(/_/g, ' ')}`
        });
        missingFields.push(field);
      }
    });

    const optionalButRecommended = [
      'blanket_period_from',
      'blanket_period_to',
      'authorized_signature'
    ];

    optionalButRecommended.forEach(field => {
      if (!certificateData[field] || certificateData[field].trim() === '') {
        warnings.push({
          field: field,
          severity: 'warning',
          message: `Recommended field "${field}" is missing`,
          suggestion: `Consider adding ${field.replace(/_/g, ' ')} for complete documentation`
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missingFields,
      completionRate: ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
    };
  }

  async checkUSMCACompliance(certificateData) {
    const errors = [];
    const warnings = [];

    const hsCodeValidation = await this.validateHSCodeFormat(certificateData.hs_code);
    if (!hsCodeValidation.valid) {
      errors.push({
        field: 'hs_code',
        severity: 'error',
        message: hsCodeValidation.message,
        suggestion: 'Verify HS code format (should be 6-10 digits)'
      });
    }

    if (certificateData.origin_criterion) {
      const criterionValidation = this.validateOriginCriterion(
        certificateData.origin_criterion,
        certificateData.product_description
      );

      if (!criterionValidation.valid) {
        errors.push({
          field: 'origin_criterion',
          severity: 'error',
          message: criterionValidation.message,
          suggestion: criterionValidation.suggestion
        });
      }
    }

    if (certificateData.blanket_period_from && certificateData.blanket_period_to) {
      const periodValidation = this.validateBlanketPeriod(
        certificateData.blanket_period_from,
        certificateData.blanket_period_to
      );

      if (!periodValidation.valid) {
        warnings.push({
          field: 'blanket_period',
          severity: 'warning',
          message: periodValidation.message,
          suggestion: 'Blanket period should not exceed 12 months'
        });
      }
    }

    const countryValidation = this.validateUSMCACountries(certificateData);
    if (!countryValidation.valid) {
      errors.push({
        field: 'countries',
        severity: 'error',
        message: countryValidation.message,
        suggestion: 'Ensure all parties are from USMCA countries (US, Canada, Mexico)'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      usmcaCompliant: errors.length === 0
    };
  }

  async validateHSCodeFormat(hsCode) {
    if (!hsCode) {
      return { valid: false, message: 'HS code is required' };
    }

    const normalized = hsCode.replace(/[\.\s\-]/g, '');

    if (!/^\d{6,10}$/.test(normalized)) {
      return {
        valid: false,
        message: `Invalid HS code format: ${hsCode}. Must be 6-10 digits.`
      };
    }

    try {
      const { data } = await this.supabase
        .from('hs_master_rebuild')
        .select('hts_code, description')
        .eq('hts_code', normalized)
        .single();

      if (data) {
        return {
          valid: true,
          message: 'HS code validated against database',
          matchedDescription: data.description
        };
      } else {
        return {
          valid: true,
          message: 'HS code format valid, but not found in database (may be valid)',
          warning: true
        };
      }
    } catch (error) {
      return {
        valid: true,
        message: 'HS code format valid',
        warning: true
      };
    }
  }

  validateOriginCriterion(criterion, productDescription) {
    const validCriteria = ['A', 'B', 'C', 'D', 'E', 'F'];

    const criterionLetter = criterion.trim().toUpperCase().charAt(0);

    if (!validCriteria.includes(criterionLetter)) {
      return {
        valid: false,
        message: `Invalid origin criterion: ${criterion}`,
        suggestion: 'Must be A, B, C, D, E, or F per USMCA rules'
      };
    }

    return {
      valid: true,
      message: `Origin criterion ${criterionLetter} is valid`
    };
  }

  validateBlanketPeriod(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return {
        valid: false,
        message: 'Invalid date format for blanket period'
      };
    }

    if (to <= from) {
      return {
        valid: false,
        message: 'End date must be after start date'
      };
    }

    const monthsDiff = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());

    if (monthsDiff > 12) {
      return {
        valid: false,
        message: `Blanket period is ${monthsDiff} months, exceeds 12-month maximum`
      };
    }

    return {
      valid: true,
      message: `Blanket period valid (${monthsDiff} months)`
    };
  }

  validateUSMCACountries(certificateData) {
    const usmcaCountries = ['US', 'USA', 'UNITED STATES', 'CA', 'CANADA', 'MX', 'MEXICO'];

    const exporterCountry = this.extractCountry(certificateData.exporter_address);
    const importerCountry = this.extractCountry(certificateData.importer_address);

    const exporterValid = usmcaCountries.some(c => exporterCountry.toUpperCase().includes(c));
    const importerValid = usmcaCountries.some(c => importerCountry.toUpperCase().includes(c));

    if (!exporterValid || !importerValid) {
      return {
        valid: false,
        message: 'Exporter and importer must be located in USMCA countries'
      };
    }

    return {
      valid: true,
      message: 'All parties are from USMCA countries'
    };
  }

  extractCountry(address) {
    if (!address) return '';

    const countryPatterns = [
      /\b(USA|UNITED STATES|US)\b/i,
      /\b(CANADA|CA)\b/i,
      /\b(MEXICO|MX)\b/i
    ];

    for (const pattern of countryPatterns) {
      const match = address.match(pattern);
      if (match) return match[0];
    }

    const lines = address.split('\n');
    return lines[lines.length - 1] || '';
  }

  checkDataConsistency(certificateData) {
    const errors = [];
    const warnings = [];

    if (certificateData.exporter_name && certificateData.producer_name) {
      if (certificateData.exporter_name.toLowerCase() !== certificateData.producer_name.toLowerCase()) {
        warnings.push({
          field: 'producer_name',
          severity: 'info',
          message: 'Producer differs from exporter',
          suggestion: 'Verify if producer and exporter are different entities'
        });
      }
    }

    if (certificateData.product_description && certificateData.hs_code) {
      if (certificateData.product_description.length < 20) {
        warnings.push({
          field: 'product_description',
          severity: 'warning',
          message: 'Product description seems brief',
          suggestion: 'Consider adding more detail for customs clarity'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  calculateOverallConfidence(checks) {
    let score = 100;

    score -= checks.requiredFields.errors.length * 15;
    score -= checks.requiredFields.warnings.length * 5;

    score -= checks.usmcaCompliance.errors.length * 20;
    score -= checks.usmcaCompliance.warnings.length * 5;

    score -= checks.dataConsistency.errors.length * 10;
    score -= checks.dataConsistency.warnings.length * 3;

    return Math.max(score, 0);
  }

  assessComplexity(certificateData) {
    let complexityScore = 0;

    if (certificateData.origin_criterion && ['C', 'D', 'E', 'F'].includes(certificateData.origin_criterion)) {
      complexityScore += 30;
    }

    if (certificateData.producer_name !== certificateData.exporter_name) {
      complexityScore += 20;
    }

    if (certificateData.blanket_period_from && certificateData.blanket_period_to) {
      complexityScore += 10;
    }

    if (complexityScore > 40) return 'high';
    if (complexityScore > 20) return 'medium';
    return 'low';
  }

  async getValidationSummary(certificateData) {
    const validation = await this.validateCertificate(certificateData);

    return {
      success: validation.success,
      data: {
        ready_to_submit: validation.data.valid && validation.data.confidence > 85,
        acceptance_probability: validation.data.acceptanceProbability,
        critical_issues: validation.data.errors.length,
        warnings: validation.data.warnings.length,
        expert_review_recommended: validation.data.escalationRecommendation.escalate,
        summary_message: this.generateSummaryMessage(validation.data)
      }
    };
  }

  generateSummaryMessage(validationData) {
    if (validationData.valid && validationData.confidence > 90) {
      return `Certificate is ready to submit with ${validationData.confidence}% acceptance probability. Excellent work!`;
    }

    if (validationData.valid && validationData.confidence > 75) {
      return `Certificate is valid but has ${validationData.warnings.length} warnings. Review before submission.`;
    }

    if (validationData.errors.length > 0) {
      return `Certificate has ${validationData.errors.length} critical issues that must be resolved before submission.`;
    }

    if (validationData.escalationRecommendation.escalate) {
      return `Complex case detected. Expert review recommended for ${validationData.escalationRecommendation.estimatedPrice} to ensure compliance.`;
    }

    return 'Certificate validation complete. Review results above.';
  }
}

export default ValidationAgent;