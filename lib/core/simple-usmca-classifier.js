/**
 * Simple USMCA Classification Logic
 * Direct, focused approach - no over-engineering
 * Uses existing comtrade_reference table with enhanced USMCA data
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export class SimpleUSMCAClassifier {
  
  /**
   * Core function: Product description → HS code classification
   */
  async classifyProduct(productDescription) {
    if (!productDescription || productDescription.length < 10) {
      return {
        success: false,
        error: 'Product description too short (minimum 10 characters)'
      };
    }

    try {
      // Simple keyword-based search in existing database
      const searchTerms = this.extractKeywords(productDescription);
      const { data: matches, error } = await supabase
        .from('comtrade_reference')
        .select('hs_code, product_description, usmca_eligible, mfn_tariff_rate, usmca_tariff_rate')
        .or(searchTerms.map(term => `product_description.ilike.%${term}%`).join(','))
        .limit(5);

      if (error) throw error;

      // Rank matches by relevance
      const rankedMatches = this.rankMatches(matches || [], productDescription);

      return {
        success: true,
        classifications: rankedMatches,
        recommended: rankedMatches[0] || null
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check USMCA origin qualification
   */
  async checkUSMCAQualification(hsCode, componentOrigins, manufacturingLocation) {
    if (!hsCode) {
      return {
        qualified: false,
        error: 'HS code required'
      };
    }

    try {
      // Get USMCA eligibility for this HS code
      const { data: hsData, error } = await supabase
        .from('comtrade_reference')
        .select('hs_code, usmca_eligible, product_description')
        .eq('hs_code', hsCode)
        .single();

      if (error) throw error;

      // Simple USMCA qualification based on existing data
      if (!hsData.usmca_eligible) {
        return {
          qualified: false,
          reason: 'Product not eligible for USMCA preferential treatment',
          manual_review_required: true
        };
      }

      // Apply generic USMCA rule based on HS chapter
      const chapter = hsCode.substring(0, 2);
      const qualification = this.applyGenericUSMCARule(
        chapter,
        componentOrigins,
        manufacturingLocation
      );

      return {
        qualified: qualification.qualified,
        rule_applied: qualification.rule_type,
        reason: qualification.reason,
        documentation_required: qualification.documentation,
        confidence: qualification.confidence
      };

    } catch (error) {
      return {
        qualified: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate tariff savings
   */
  async calculateSavings(hsCode, annualImportValue, supplierCountry = 'CN') {
    if (!hsCode || !annualImportValue) {
      return {
        success: false,
        error: 'HS code and import value required'
      };
    }

    try {
      const { data: tariffData, error } = await supabase
        .from('comtrade_reference')
        .select('hs_code, mfn_tariff_rate, usmca_tariff_rate')
        .eq('hs_code', hsCode)
        .single();

      if (error) throw error;

      const mfnRate = tariffData.mfn_tariff_rate || 0;
      const usmcaRate = tariffData.usmca_tariff_rate || 0;
      const importValue = parseFloat(annualImportValue);

      const mfnTariff = importValue * (mfnRate / 100);
      const usmcaTariff = importValue * (usmcaRate / 100);
      const annualSavings = mfnTariff - usmcaTariff;

      return {
        success: true,
        annual_import_value: importValue,
        mfn_rate: mfnRate,
        usmca_rate: usmcaRate,
        mfn_tariff_cost: mfnTariff,
        usmca_tariff_cost: usmcaTariff,
        annual_savings: annualSavings,
        savings_percentage: annualSavings / importValue * 100,
        monthly_savings: annualSavings / 12
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate USMCA Certificate of Origin data
   */
  async generateCertificateData(submissionData) {
    const {
      companyName,
      hsCode,
      productDescription,
      manufacturingLocation,
      componentOrigins,
      qualified
    } = submissionData;

    if (!qualified) {
      return {
        success: false,
        error: 'Product does not qualify for USMCA preferential treatment'
      };
    }

    const certificateData = {
      // Field 1: Exporter Information
      exporter_name: companyName || '[TO BE COMPLETED]',
      exporter_address: '[TO BE COMPLETED BY USER]',
      
      // Field 2: Blanket Period
      blanket_start: new Date().toISOString().split('T')[0],
      blanket_end: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      
      // Field 4: Product Description and HS Code
      product_description: productDescription,
      hs_tariff_classification: hsCode,
      
      // Field 5: Preference Criterion
      preference_criterion: this.getPreferenceCriterion(submissionData),
      
      // Field 6: Producer
      producer_name: companyName || '[SAME AS EXPORTER]',
      
      // Field 7: Country of Origin
      country_of_origin: manufacturingLocation || 'US',
      
      // Generated metadata
      certificate_date: new Date().toISOString(),
      valid_until: new Date(Date.now() + 365*24*60*60*1000).toISOString()
    };

    return {
      success: true,
      certificate_data: certificateData,
      instructions: [
        'Complete exporter address information',
        'Verify producer information if different from exporter', 
        'Ensure all supporting documentation is available',
        'Certificate valid for one year from issue date'
      ]
    };
  }

  // Helper methods

  extractKeywords(description) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5); // Top 5 keywords
  }

  rankMatches(matches, originalDescription) {
    return matches.map(match => {
      const relevanceScore = this.calculateRelevance(match.product_description, originalDescription);
      return {
        ...match,
        relevance_score: relevanceScore
      };
    }).sort((a, b) => b.relevance_score - a.relevance_score);
  }

  calculateRelevance(dbDescription, userDescription) {
    const dbWords = new Set(this.extractKeywords(dbDescription));
    const userWords = new Set(this.extractKeywords(userDescription));
    const intersection = new Set([...dbWords].filter(word => userWords.has(word)));
    
    if (userWords.size === 0) return 0;
    return intersection.size / userWords.size;
  }

  applyGenericUSMCARule(chapter, componentOrigins, manufacturingLocation) {
    const usmcaCountries = new Set(['US', 'CA', 'MX']);
    
    // Generic rules based on HS chapter
    switch (chapter) {
      case '85': // Electronics
        return this.checkRegionalContent(componentOrigins, 60, 'Electronics Regional Content');
      
      case '87': // Automotive
        return this.checkRegionalContent(componentOrigins, 75, 'Automotive Enhanced Regional Content');
      
      case '84': // Machinery
        return this.checkRegionalContent(componentOrigins, 60, 'Machinery Regional Content');
      
      case '61':
      case '62': // Textiles
        return {
          qualified: false, // Usually requires yarn-forward verification
          rule_type: 'Yarn Forward Rule',
          reason: 'Textile products require yarn-forward rule verification',
          documentation: ['Yarn Origin Certificates', 'Fabric Mill Certificates'],
          confidence: 'manual_review_required'
        };
      
      default:
        return {
          qualified: usmcaCountries.has(manufacturingLocation),
          rule_type: 'Manufacturing Origin',
          reason: `Manufacturing in USMCA territory: ${usmcaCountries.has(manufacturingLocation) ? 'Yes' : 'No'}`,
          documentation: ['Manufacturing Records', 'Bill of Materials'],
          confidence: 'medium'
        };
    }
  }

  applyUSMCARule(rule, componentOrigins, manufacturingLocation) {
    const usmcaCountries = new Set(['US', 'CA', 'MX']);
    
    switch (rule) {
      case 'regional_content_75':
        return this.checkRegionalContent(componentOrigins, 75);
      
      case 'regional_content_60':
        return this.checkRegionalContent(componentOrigins, 60);
      
      case 'yarn_forward_rule':
        return {
          qualified: false, // Usually requires specific documentation
          reason: 'Yarn-forward rule requires verification of yarn and fabric origins',
          documentation: ['Yarn Origin Certificates', 'Fabric Mill Certificates'],
          confidence: 'manual_review_required'
        };
      
      case 'tariff_shift_required':
        return {
          qualified: usmcaCountries.has(manufacturingLocation),
          reason: `Manufacturing in USMCA territory: ${usmcaCountries.has(manufacturingLocation) ? 'Yes' : 'No'}`,
          documentation: ['Bill of Materials', 'Manufacturing Records'],
          confidence: 'high'
        };
      
      default:
        return {
          qualified: false,
          reason: 'Unknown USMCA rule - manual review required',
          documentation: ['Complete Origin Analysis'],
          confidence: 'manual_review_required'
        };
    }
  }

  checkRegionalContent(componentOrigins, requiredPercentage, ruleType = 'Regional Content') {
    if (!componentOrigins || !Array.isArray(componentOrigins)) {
      return {
        qualified: false,
        reason: 'Component origin information required',
        documentation: ['Regional Value Content Worksheet'],
        confidence: 'data_required'
      };
    }

    const usmcaCountries = new Set(['US', 'CA', 'MX']);
    let totalValue = 0;
    let usmcaValue = 0;

    componentOrigins.forEach(component => {
      const value = parseFloat(component.value_percentage) || 0;
      totalValue += value;
      if (usmcaCountries.has(component.origin_country)) {
        usmcaValue += value;
      }
    });

    const regionalPercentage = totalValue > 0 ? (usmcaValue / totalValue) * 100 : 0;
    const qualified = regionalPercentage >= requiredPercentage;

    return {
      qualified,
      rule_type: ruleType,
      reason: `Regional content: ${regionalPercentage.toFixed(1)}% (required: ${requiredPercentage}%)`,
      documentation: ['Regional Value Content Worksheet', 'Supplier Declarations'],
      confidence: qualified ? 'high' : 'definitive',
      calculated_percentage: regionalPercentage
    };
  }

  getPreferenceCriterion(submissionData) {
    // Simplified preference criterion determination based on HS chapter
    const hsCode = submissionData.hsCode;
    const chapter = hsCode ? hsCode.substring(0, 2) : null;
    
    switch (chapter) {
      case '85': // Electronics
      case '84': // Machinery
      case '87': // Automotive
        return 'B'; // RVC method (Regional Value Content)
      
      case '61': // Textiles
      case '62': // Textiles  
        return 'A'; // Specific process (yarn-forward)
        
      default:
        return 'B'; // Default to RVC
    }
  }
}

// Export singleton instance
export const usmcaClassifier = new SimpleUSMCAClassifier();