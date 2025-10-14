/**
 * TRUST-VERIFIED CERTIFICATE FORMATTER
 * Professional 9-element USMCA certificate format with trust indicators
 * Integrates trust verification data into official certificate structure
 */

export class TrustVerifiedCertificateFormatter {
  constructor() {
    this.formatVersion = '2.0-TRUST-VERIFIED';
  }

  /**
   * Format trust-verified certificate for download
   * Generates professional 9-element USMCA format with trust elements
   */
  formatForDownload(trustVerifiedCertificate, formatType = 'official') {
    switch (formatType) {
      case 'official':
        return this.formatOfficialUSMCACertificate(trustVerifiedCertificate);
      case 'detailed':
        return this.formatDetailedTrustCertificate(trustVerifiedCertificate);
      case 'simple':
        return this.formatSimpleCertificate(trustVerifiedCertificate);
      default:
        return this.formatOfficialUSMCACertificate(trustVerifiedCertificate);
    }
  }

  /**
   * Format official USMCA certificate with trust verification elements
   */
  formatOfficialUSMCACertificate(cert) {
    const trustLevel = this.getTrustLevelDisplay(cert.trust_verification?.overall_trust_score || 0);
    const expertValidationStatus = cert.trust_verification?.expert_validation?.expert_validation_required ? 
      'EXPERT VALIDATION REQUIRED' : 'AUTO-VALIDATED';

    return `UNITED STATES-MEXICO-CANADA AGREEMENT
CERTIFICATE OF ORIGIN
═══════════════════════════════════════════════════════════════════════════

TRUST-VERIFIED CERTIFICATE
Certificate Number: ${cert.certificate_number || 'PENDING'}
Generated: ${new Date(cert.generation_info?.generated_date).toLocaleDateString()}
Trust Level: ${trustLevel} (${((cert.trust_verification?.overall_trust_score || 0) * 100).toFixed(1)}%)
Validation Status: ${expertValidationStatus}

═══════════════════════════════════════════════════════════════════════════
FIELD 1 - EXPORTER NAME AND ADDRESS:
${cert.exporter?.name || 'TO BE COMPLETED BY EXPORTER'}
${cert.exporter?.address || 'TO BE COMPLETED BY EXPORTER'}
Tax Identification Number: ${cert.exporter?.tax_id || 'TO BE COMPLETED'}
Country: ${cert.exporter?.country || 'TO BE COMPLETED'}

═══════════════════════════════════════════════════════════════════════════
FIELD 2 - PRODUCER NAME AND ADDRESS:
${cert.producer?.name || 'TO BE COMPLETED BY PRODUCER'}  
${cert.producer?.address || 'TO BE COMPLETED BY PRODUCER'}
Tax Identification Number: ${cert.producer?.tax_id || 'TO BE COMPLETED'}
Country: ${cert.producer?.country || 'TO BE COMPLETED'}

═══════════════════════════════════════════════════════════════════════════
FIELD 3 - IMPORTER NAME AND ADDRESS:
${cert.importer?.name || 'TO BE COMPLETED BY IMPORTER'}
${cert.importer?.address || 'TO BE COMPLETED BY IMPORTER'}
Tax Identification Number: ${cert.importer?.tax_id || 'TO BE COMPLETED'}

═══════════════════════════════════════════════════════════════════════════
FIELD 4 - DESCRIPTION OF GOOD(S):
HS Tariff Classification: ${cert.product?.hs_code || 'TO BE VERIFIED'}
Product Description: ${cert.product?.description || 'TO BE COMPLETED'}
Detailed Description: ${cert.product?.detailed_description || 'TO BE COMPLETED WITH SPECIFIC SHIPMENT DETAILS'}

DATA VERIFICATION STATUS:
${this.formatDataVerificationStatus(cert.data_provenance)}

═══════════════════════════════════════════════════════════════════════════
FIELD 5 - PREFERENCE CRITERION:
${cert.preference_criterion || cert.additional_information?.preference_criterion || 'B'} - ${cert.preference_explanation || 'The good is originating because it satisfies the requirements for preferential tariff treatment under the USMCA'}

Qualification Details:
• Regional Value Content (RVC) Achieved: ${cert.additional_information?.regional_value_content || cert.usmca_analysis?.regional_content || 'TBD'}%
• Method of Qualification: ${cert.additional_information?.method_of_qualification || 'TV'} ${this.formatMethodOfQualification(cert.additional_information?.method_of_qualification)}
• Qualification Rule: ${cert.additional_information?.qualification_rule || 'Regional Value Content'}
• RVC Threshold Required: ${cert.additional_information?.rvc_threshold || cert.usmca_analysis?.threshold || '60'}%

═══════════════════════════════════════════════════════════════════════════
FIELD 6 - PRODUCER:
${cert.producer_certification || 'I certify that the information on this document is true and accurate and I assume responsibility for proving such representations.'}

═══════════════════════════════════════════════════════════════════════════
FIELD 7 - BLANKET PERIOD:
From: ${cert.blanket_period?.start_date || 'TO BE COMPLETED'}
To: ${cert.blanket_period?.end_date || 'TO BE COMPLETED'}
Validity: ${cert.blanket_period?.validity_days || 365} days

This certificate applies to multiple shipments of identical goods described 
in Field 4 that are imported into the territory of a Party during the period 
set out above.

═══════════════════════════════════════════════════════════════════════════
FIELD 8 - AUTHORIZED SIGNATURE:
I hereby certify that the information on this document is true and accurate 
and I assume the responsibility for proving such representations.

Name: ${cert.authorized_signature?.signatory_name || 'TO BE COMPLETED BY AUTHORIZED SIGNATORY'}
Title/Capacity: ${cert.authorized_signature?.signatory_title || 'TO BE COMPLETED'}
Date: ${cert.authorized_signature?.signature_date || 'TO BE COMPLETED UPON SIGNING'}
Signature: ${cert.authorized_signature?.signature_placeholder || '________________________'}

═══════════════════════════════════════════════════════════════════════════
FIELD 9 - ADDITIONAL INFORMATION:
Manufacturing Country: ${cert.additional_information?.manufacturing_country || 'TO BE COMPLETED'}

COMPONENT BREAKDOWN WITH TARIFF DETAILS:
${this.formatDetailedComponentBreakdownForCertificate(cert.additional_information?.component_breakdown)}

TRUST VERIFICATION DETAILS:
Overall Trust Score: ${((cert.trust_verification?.overall_trust_score || 0) * 100).toFixed(1)}%
Trust Level: ${cert.trust_verification?.trust_level?.toUpperCase() || 'UNKNOWN'}
Verification Status: ${cert.trust_verification?.verification_status?.toUpperCase() || 'PENDING'}

Data Sources Verified:
${cert.trust_verification?.data_sources_verified?.map(source => `• ${source}`).join('\n') || '• No verified sources available'}

${cert.trust_verification?.expert_validation?.expert_validation_required ? 
  this.formatExpertValidationSection(cert.trust_verification.expert_validation) : 
  '• Certificate auto-validated - ready for completion and use'}

═══════════════════════════════════════════════════════════════════════════
PROFESSIONAL COMPLIANCE INSTRUCTIONS:
═══════════════════════════════════════════════════════════════════════════

1. COMPLETION REQUIREMENTS:
${cert.compliance_instructions?.map((instruction, index) => `   ${index + 1}. ${instruction}`).join('\n') || 
  '   • Complete all "TO BE COMPLETED" fields before use'}

2. TRUST VERIFICATION SUMMARY:
   • Data Source Reliability: ${this.formatReliabilityScore(cert.trust_verification?.overall_trust_score)}
   • Verification Timestamp: ${cert.data_provenance?.verification_timestamp ? 
     new Date(cert.data_provenance.verification_timestamp).toLocaleString() : 'Not available'}
   • Expert Validation: ${cert.trust_verification?.expert_validation?.validation_status?.toUpperCase() || 'PENDING'}

3. PROFESSIONAL DISCLAIMERS:
${cert.professional_disclaimers?.map(disclaimer => `   • ${disclaimer}`).join('\n') || 
  '   • Professional verification recommended before use'}

═══════════════════════════════════════════════════════════════════════════
AUDIT TRAIL INFORMATION:
═══════════════════════════════════════════════════════════════════════════
Certificate ID: ${cert.certificate_id || 'N/A'}
Generation Platform: ${cert.generation_info?.generated_by || 'Triangle Trade Intelligence USMCA Compliance Platform'}
Platform Version: ${cert.generation_info?.platform_version || this.formatVersion}
Processing Time: ${cert.generation_metadata?.processing_time_ms || 'N/A'} ms
Last Updated: ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════════════════════════
END OF CERTIFICATE
═══════════════════════════════════════════════════════════════════════════`;
  }

  /**
   * Format detailed trust certificate with comprehensive data
   */
  formatDetailedTrustCertificate(cert) {
    return `TRIANGLE INTELLIGENCE - DETAILED TRUST-VERIFIED CERTIFICATE
═══════════════════════════════════════════════════════════════════════════

CERTIFICATE SUMMARY:
Certificate Number: ${cert.certificate_number || 'PENDING'}
Certificate Version: ${cert.certificate_version || this.formatVersion}
Generated: ${new Date(cert.generation_info?.generated_date).toLocaleString()}
Company: ${cert.exporter?.name || 'TO BE COMPLETED'}
Product: ${cert.product?.description || 'TO BE COMPLETED'}
HS Code: ${cert.product?.hs_code || 'TO BE VERIFIED'}

TRUST VERIFICATION ANALYSIS:
═══════════════════════════════════════════════════════════════════════════
Overall Trust Score: ${((cert.trust_verification?.overall_trust_score || 0) * 100).toFixed(1)}%
Trust Level: ${cert.trust_verification?.trust_level?.toUpperCase() || 'UNKNOWN'}
Verification Status: ${cert.trust_verification?.verification_status?.toUpperCase() || 'PENDING'}

DATA PROVENANCE DETAILS:
${this.formatDetailedProvenance(cert.data_provenance)}

EXPERT VALIDATION ANALYSIS:
${cert.trust_verification?.expert_validation?.expert_validation_required ? 
  this.formatDetailedExpertValidation(cert.trust_verification.expert_validation) :
  'Auto-validated - Expert validation not required based on trust score'}

COMPLIANCE QUALIFICATION RESULTS:
═══════════════════════════════════════════════════════════════════════════
Preference Criterion: ${cert.preference_criterion || 'B'}
Regional Value Content: ${cert.additional_information?.regional_value_content || 'TBD'}
Qualification Rule: ${cert.additional_information?.qualification_rule || 'Regional Value Content'}
Manufacturing Location: ${cert.additional_information?.manufacturing_country || 'TO BE COMPLETED'}

Component Analysis:
${this.formatDetailedComponentBreakdown(cert.additional_information?.component_breakdown)}

CERTIFICATE READINESS ASSESSMENT:
═══════════════════════════════════════════════════════════════════════════
${this.formatCertificateReadinessAssessment(cert)}

NEXT STEPS:
═══════════════════════════════════════════════════════════════════════════
${this.formatNextStepsRecommendations(cert)}

═══════════════════════════════════════════════════════════════════════════
Generated by Triangle Trade Intelligence USMCA Compliance Platform
For support and professional consultation, contact your customs broker
═══════════════════════════════════════════════════════════════════════════`;
  }

  /**
   * Format simple certificate for quick reference
   */
  formatSimpleCertificate(cert) {
    return `USMCA CERTIFICATE OF ORIGIN - SIMPLE FORMAT
Generated: ${new Date().toLocaleDateString()}
Trust Level: ${this.getTrustLevelDisplay(cert.trust_verification?.overall_trust_score || 0)}

COMPANY INFORMATION:
Company: ${cert.exporter?.name || 'TO BE COMPLETED'}
Manufacturing Location: ${cert.additional_information?.manufacturing_country || 'TO BE COMPLETED'}

PRODUCT INFORMATION:
Description: ${cert.product?.description || 'TO BE COMPLETED'}
HS Code: ${cert.product?.hs_code || 'TO BE VERIFIED'}
Preference Criterion: ${cert.preference_criterion || 'B'}

QUALIFICATION RESULTS:
Regional Value Content: ${cert.additional_information?.regional_value_content || 'TBD'}
Trust Score: ${((cert.trust_verification?.overall_trust_score || 0) * 100).toFixed(1)}%

CERTIFICATE VALIDITY:
From: ${cert.blanket_period?.start_date || 'TO BE COMPLETED'}
To: ${cert.blanket_period?.end_date || 'TO BE COMPLETED'}

${cert.trust_verification?.expert_validation?.expert_validation_required ? 
  'EXPERT VALIDATION REQUIRED - Contact customs broker before use' :
  'Certificate ready for completion and use'}

NOTE: This is a simplified certificate template. Complete all fields and 
obtain proper signatures before submission to customs authorities.`;
  }

  /**
   * Format data verification status
   */
  formatDataVerificationStatus(dataProvenance) {
    if (!dataProvenance) {
      return '• Data verification unavailable - manual verification required';
    }

    const verifications = [];
    
    if (dataProvenance.hs_code_source) {
      verifications.push(`• HS Code: ${dataProvenance.hs_code_source}`);
    }
    
    if (dataProvenance.tariff_rates_source) {
      verifications.push(`• Tariff Rates: ${dataProvenance.tariff_rates_source}`);
    }
    
    if (dataProvenance.usmca_rules_source) {
      verifications.push(`• USMCA Rules: ${dataProvenance.usmca_rules_source}`);
    }

    return verifications.length > 0 ? verifications.join('\n') : '• No verified data sources available';
  }

  /**
   * Format expert validation section
   */
  formatExpertValidationSection(expertValidation) {
    const lines = ['• EXPERT VALIDATION REQUIRED:'];
    
    if (expertValidation.current_trust_score) {
      lines.push(`  - Current Trust Score: ${(expertValidation.current_trust_score * 100).toFixed(1)}%`);
    }
    
    if (expertValidation.trust_score_threshold) {
      lines.push(`  - Required Threshold: ${(expertValidation.trust_score_threshold * 100).toFixed(1)}%`);
    }
    
    if (expertValidation.estimated_review_time_hours) {
      lines.push(`  - Estimated Review Time: ${expertValidation.estimated_review_time_hours} hours`);
    }
    
    if (expertValidation.expert_contact_info) {
      lines.push(`  - Expert Available: ${expertValidation.expert_contact_info.expert_name || 'Contact customs broker'}`);
    } else {
      lines.push('  - Expert Contact: Consult licensed customs broker');
    }

    return lines.join('\n');
  }

  /**
   * Format Method of Qualification description
   */
  formatMethodOfQualification(method) {
    if (!method) return '(Transaction Value Method)';

    switch(method) {
      case 'TV': return '(Transaction Value Method - RVC based on transaction value)';
      case 'NC': return '(Net Cost Method - RVC based on net cost)';
      case 'TS': return '(Tariff Shift Only - No RVC required)';
      case 'NO': return '(No Origin Requirement)';
      default: return '(Transaction Value Method)';
    }
  }

  /**
   * Format component breakdown
   */
  formatComponentBreakdown(components) {
    if (!components || components.length === 0) {
      return 'TO BE COMPLETED WITH COMPONENT DETAILS';
    }

    return components.map(comp =>
      `${comp.origin_country}: ${comp.value_percentage}% (${comp.is_usmca_member ? 'USMCA' : 'Non-USMCA'})`
    ).join(', ');
  }

  /**
   * Format detailed component breakdown for certificate with HS codes and tariff rates
   */
  formatDetailedComponentBreakdownForCertificate(components) {
    if (!components || components.length === 0) {
      return 'TO BE COMPLETED WITH COMPONENT DETAILS';
    }

    return components.map((comp, index) => {
      const lines = [];
      lines.push(`Component ${index + 1}: ${comp.description || 'Component Description'}`);
      lines.push(`  • HS Code: ${comp.hs_code || comp.classified_hs_code || 'To be verified'}`);
      lines.push(`  • Origin Country: ${comp.origin_country}`);
      lines.push(`  • Value Percentage: ${comp.value_percentage}%`);
      lines.push(`  • USMCA Status: ${comp.is_usmca_member ? 'Qualifying' : 'Non-qualifying'}`);

      // Add tariff rates if available
      const mfnRate = comp.mfn_rate || comp.tariff_rates?.mfn_rate;
      const usmcaRate = comp.usmca_rate || comp.tariff_rates?.usmca_rate;

      if (mfnRate !== undefined && usmcaRate !== undefined) {
        lines.push(`  • MFN Tariff Rate: ${mfnRate.toFixed(1)}%`);
        lines.push(`  • USMCA Tariff Rate: ${usmcaRate.toFixed(1)}%`);
        const savings = mfnRate - usmcaRate;
        if (savings > 0) {
          lines.push(`  • Tariff Savings: ${savings.toFixed(1)}%`);
        }
      }

      return lines.join('\n');
    }).join('\n\n');
  }

  /**
   * Format detailed component breakdown
   */
  formatDetailedComponentBreakdown(components) {
    if (!components || components.length === 0) {
      return 'Component analysis not available - manual breakdown required';
    }

    return components.map((comp, index) => 
      `${index + 1}. Origin: ${comp.origin_country}, Value: ${comp.value_percentage}%, USMCA Member: ${comp.is_usmca_member ? 'Yes' : 'No'}`
    ).join('\n');
  }

  /**
   * Format detailed provenance information
   */
  formatDetailedProvenance(dataProvenance) {
    if (!dataProvenance) {
      return 'Data provenance information unavailable';
    }

    const sections = [];
    
    sections.push(`Verification Timestamp: ${dataProvenance.verification_timestamp ? 
      new Date(dataProvenance.verification_timestamp).toLocaleString() : 'Not available'}`);
    
    if (dataProvenance.hs_code_source) {
      sections.push(`HS Code Source: ${dataProvenance.hs_code_source}`);
    }
    
    if (dataProvenance.tariff_rates_source) {
      sections.push(`Tariff Rates Source: ${dataProvenance.tariff_rates_source}`);
    }
    
    if (dataProvenance.usmca_rules_source) {
      sections.push(`USMCA Rules Source: ${dataProvenance.usmca_rules_source}`);
    }

    return sections.length > 1 ? sections.join('\n') : 'Limited provenance data available';
  }

  /**
   * Format detailed expert validation
   */
  formatDetailedExpertValidation(expertValidation) {
    const details = [];
    
    details.push(`Validation Required: ${expertValidation.expert_validation_required ? 'YES' : 'NO'}`);
    details.push(`Validation Status: ${expertValidation.validation_status?.toUpperCase() || 'PENDING'}`);
    details.push(`Trust Score: ${(expertValidation.current_trust_score * 100).toFixed(1)}%`);
    details.push(`Threshold: ${(expertValidation.trust_score_threshold * 100).toFixed(1)}%`);
    
    if (expertValidation.expert_contact_info) {
      details.push(`Expert Available: ${expertValidation.expert_contact_info.expert_name || 'Available'}`);
    }

    return details.join('\n');
  }

  /**
   * Format certificate readiness assessment
   */
  formatCertificateReadinessAssessment(cert) {
    const assessment = [];
    
    const trustScore = cert.trust_verification?.overall_trust_score || 0;
    
    if (trustScore >= 0.95) {
      assessment.push('✓ HIGH CONFIDENCE: Certificate data verified from official sources');
    } else if (trustScore >= 0.80) {
      assessment.push('⚠ MEDIUM CONFIDENCE: Professional verification recommended');
    } else {
      assessment.push('⚠ LOW CONFIDENCE: Expert validation required before use');
    }
    
    if (cert.trust_verification?.expert_validation?.expert_validation_required) {
      assessment.push('⚠ EXPERT REVIEW REQUIRED: Contact licensed customs broker');
    } else {
      assessment.push('✓ AUTO-VALIDATED: Ready for completion and use');
    }
    
    const missingFields = this.identifyMissingFields(cert);
    if (missingFields.length > 0) {
      assessment.push(`⚠ MISSING FIELDS: ${missingFields.join(', ')}`);
    } else {
      assessment.push('✓ ALL TEMPLATE FIELDS PRESENT: Complete remaining details');
    }

    return assessment.join('\n');
  }

  /**
   * Format next steps recommendations
   */
  formatNextStepsRecommendations(cert) {
    const steps = [];
    
    if (cert.trust_verification?.expert_validation?.expert_validation_required) {
      steps.push('1. CONTACT EXPERT: Schedule professional customs broker review');
      steps.push('2. AWAIT VALIDATION: Expert response within 24-72 hours');
      steps.push('3. COMPLETE CERTIFICATE: Fill remaining fields after expert approval');
    } else {
      steps.push('1. COMPLETE FIELDS: Fill all "TO BE COMPLETED" sections');
      steps.push('2. VERIFY ACCURACY: Double-check all information');
      steps.push('3. OBTAIN SIGNATURES: Get authorized signatory approval');
    }
    
    steps.push('4. MAINTAIN DOCUMENTATION: Keep supporting records for 5 years');
    steps.push('5. SUBMIT TO CUSTOMS: Present certificate with qualifying shipments');

    return steps.join('\n');
  }

  /**
   * Get trust level display text
   */
  getTrustLevelDisplay(trustScore) {
    if (trustScore >= 0.95) return 'VERY HIGH';
    if (trustScore >= 0.85) return 'HIGH';
    if (trustScore >= 0.70) return 'MEDIUM';
    if (trustScore >= 0.50) return 'LOW';
    return 'VERY LOW';
  }

  /**
   * Format reliability score
   */
  formatReliabilityScore(trustScore) {
    const percentage = ((trustScore || 0) * 100).toFixed(1);
    const level = this.getTrustLevelDisplay(trustScore || 0);
    return `${percentage}% (${level})`;
  }

  /**
   * Identify missing required fields
   */
  identifyMissingFields(cert) {
    const missing = [];
    
    if (!cert.exporter?.name || cert.exporter.name.includes('TO BE COMPLETED')) {
      missing.push('Exporter Name');
    }
    
    if (!cert.product?.hs_code || cert.product.hs_code.includes('TO BE')) {
      missing.push('HS Code');
    }
    
    if (!cert.product?.description || cert.product.description.includes('TO BE COMPLETED')) {
      missing.push('Product Description');
    }
    
    if (!cert.authorized_signature?.signatory_name || cert.authorized_signature.signatory_name.includes('TO BE COMPLETED')) {
      missing.push('Authorized Signatory');
    }

    return missing;
  }

  /**
   * Generate download filename
   */
  generateDownloadFilename(cert, formatType = 'official') {
    const company = (cert.exporter?.name || 'Unknown_Company').replace(/[^a-zA-Z0-9]/g, '_');
    const hsCode = cert.product?.hs_code || 'Unknown_HS';
    const date = new Date().toISOString().split('T')[0];
    const format = formatType.toLowerCase();
    
    return `USMCA_Certificate_${company}_${hsCode}_${date}_${format}.txt`;
  }
}

// Export singleton instance
export const trustVerifiedCertificateFormatter = new TrustVerifiedCertificateFormatter();

export default trustVerifiedCertificateFormatter;