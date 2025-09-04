/**
 * TRUST COMPLETE WORKFLOW API ENDPOINT
 * Main workflow orchestration for USMCA compliance with complete data provenance
 * Replaces the largest part of monolithic trusted-compliance-workflow.js
 * Uses all shared trust services for consistency and maintainability
 */

import { performIntelligentClassification } from '../../../lib/classification/database-driven-classifier.js';
import { databaseDrivenUSMCAEngine } from '../../../lib/core/database-driven-usmca-engine.js';
import { dataProvenanceService } from '../../../lib/services/data-provenance-service.js';
import { expertEndorsementSystem } from '../../../lib/services/expert-endorsement-system.js';
import { professionalReferralSystem } from '../../../lib/services/professional-referral-system.js';
import { trustVerifiedCertificateService } from '../../../lib/services/trust-verified-certificate-service.js';

// Import all shared trust services
import { TRUST_CONFIG, TRUST_MESSAGES, TRUST_PERFORMANCE_CONFIG } from '../../../config/trust-config.js';
import { trustCalculationService } from '../../../lib/services/trust/trust-calculation-service.js';
import { trustSummaryService } from '../../../lib/services/trust/trust-summary-service.js';
import { 
  setTrustHeaders, 
  getTrustIndicators, 
  validateTrustRequest, 
  handleTrustError, 
  setupTrustTimeout, 
  formatTrustResponse, 
  logTrustOperation 
} from '../../../lib/services/trust/trust-common-service.js';
import { logInfo, logError } from '../../../lib/utils/production-logger.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  let timeoutId = null;
  
  // Set trust-building headers
  setTrustHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed_methods: ['POST'],
      trust_indicators: await getTrustIndicators()
    });
  }

  // Setup configurable timeout
  timeoutId = setupTrustTimeout(res, 'completeWorkflow');

  try {
    // Validate request with trust context
    const validation = validateTrustRequest(req);
    if (!validation.valid) {
      clearTimeout(timeoutId);
      return res.status(400).json({
        success: false,
        errors: validation.errors,
        trust_context: validation.trust_context
      });
    }

    const { data } = req.body;
    logInfo('Trust complete workflow started', { 
      company: data.company_name, 
      business_type: data.business_type 
    });

    // Initialize all required systems
    await Promise.all([
      databaseDrivenUSMCAEngine.initialize(),
      expertEndorsementSystem.initializeSystem()
    ]);

    // Execute complete workflow with trust tracking
    const workflowResult = await executeCompleteWorkflow(data);
    
    // Clear timeout before response
    clearTimeout(timeoutId);
    
    // Add trust indicators and format response
    const trustIndicators = await getTrustIndicators();
    const finalResult = formatTrustResponse(workflowResult, trustIndicators, 'complete_workflow');
    
    // Log successful operation
    logTrustOperation('complete_workflow', startTime, req, true, {
      trust_score: workflowResult.trust_assessment?.overall_trust_score,
      expert_validation_required: workflowResult.expert_evaluation?.expert_validation_required
    });

    return res.status(200).json(finalResult);

  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    return handleTrustError(error, res, 'complete_workflow');
  }
}

/**
 * Execute complete USMCA workflow with comprehensive trust tracking
 * Main orchestration function that coordinates all compliance steps
 */
async function executeCompleteWorkflow(formData) {
  const startTime = Date.now();
  
  try {
    // Step 1: Classification with Data Provenance
    const classificationResult = await performClassificationWithTrust(formData);
    
    // Step 2: USMCA Qualification with Source Verification
    const usmcaResult = await performUSMCAWithTrust(classificationResult, formData);
    
    // Step 3: Tariff Savings with Rate Verification
    const savingsResult = await performSavingsWithTrust(classificationResult, formData);

    // Step 4: Expert Evaluation
    const expertEvaluation = await evaluateExpertNeeds(classificationResult, usmcaResult, savingsResult);

    // Step 5: Generate Certificate (if qualified)
    const certificateResult = usmcaResult.qualified 
      ? await generateCertificateWithTrust(classificationResult, usmcaResult, formData)
      : null;

    // Step 6: Consolidate Trust Assessment
    const trustAssessment = await trustSummaryService.generateTrustSummary([
      classificationResult, usmcaResult, savingsResult
    ]);

    // Step 7: Generate Workflow Summary
    const workflowSummary = await trustSummaryService.generateWorkflowSummary(
      classificationResult, usmcaResult, savingsResult
    );

    return {
      success: true,
      workflow_type: 'trusted_complete_workflow',
      processing_time_ms: Date.now() - startTime,
      
      // Company and request information
      company: {
        name: formData.company_name,
        business_type: formData.business_type,
        trade_volume: formData.trade_volume,
        supplier_country: formData.supplier_country
      },
      
      // Classification results with trust data
      product: {
        ...classificationResult,
        trust_indicators: trustCalculationService.generateTrustIndicators(classificationResult)
      },
      
      // USMCA qualification with verification
      usmca: {
        ...usmcaResult,
        trust_indicators: trustCalculationService.generateTrustIndicators(usmcaResult)
      },
      
      // Savings calculation with rate verification
      savings: {
        ...savingsResult,
        trust_indicators: trustCalculationService.generateTrustIndicators(savingsResult)
      },
      
      // Certificate (if applicable)
      certificate: certificateResult,
      
      // Expert evaluation results
      expert_evaluation: expertEvaluation,
      
      // Comprehensive trust assessment
      trust_assessment: trustAssessment,
      
      // Workflow summary with audit trail
      workflow_summary: workflowSummary,
      
      // Professional disclaimers with trust context
      disclaimers: [
        ...workflowSummary.professional_disclaimers,
        TRUST_MESSAGES.provenance.provenanceComplete,
        'Expert validation available for high-value transactions'
      ]
    };

  } catch (error) {
    logError('Complete workflow execution failed', { error: error.message });
    throw new Error('Workflow execution failed - expert validation required');
  }
}

/**
 * Perform classification with complete trust integration
 */
async function performClassificationWithTrust(formData) {
  const classificationResult = await performIntelligentClassification({
    productDescription: formData.product_description,
    businessType: formData.business_type,
    sourceCountry: formData.supplier_country
  });

  if (!classificationResult.success || !classificationResult.results?.length) {
    return {
      ...classificationResult,
      trust_score: TRUST_CONFIG.provenance.sourceReliabilityScores.cbp * 0.3,
      requires_expert_validation: true
    };
  }

  const topResult = classificationResult.results[0];
  
  // Get data provenance
  const provenanceData = await dataProvenanceService.getDataWithProvenance('hs_codes', topResult.hs_code);
  
  // Calculate trust score using shared service
  const trustScore = trustCalculationService.calculateTrustScore(provenanceData, classificationResult);

  return {
    success: true,
    hs_code: topResult.hs_code,
    description: topResult.product_description,
    confidence: topResult.confidenceScore,
    method: 'database_driven_with_provenance',
    provenance: provenanceData.success ? provenanceData.provenance : null,
    trust_score: trustScore,
    needs_verification: provenanceData.needs_verification || false
  };
}

/**
 * Perform USMCA qualification with source verification
 */
async function performUSMCAWithTrust(classificationResult, formData) {
  if (!classificationResult.success || !classificationResult.hs_code) {
    return {
      qualified: false,
      reason: 'Cannot verify USMCA qualification without valid HS code',
      trust_score: TRUST_CONFIG.provenance.sourceReliabilityScores.cbp * 0.2
    };
  }

  const usmcaResult = await databaseDrivenUSMCAEngine.checkUSMCAQualification(
    classificationResult.hs_code,
    formData.component_origins || [],
    formData.manufacturing_location,
    formData.business_type
  );

  const rulesProvenance = await dataProvenanceService.getDataWithProvenance('usmca_rules', classificationResult.hs_code);
  const trustScore = trustCalculationService.calculateUSMCATrustScore(usmcaResult, rulesProvenance);

  return {
    ...usmcaResult,
    provenance: rulesProvenance.success ? rulesProvenance.provenance : null,
    trust_score: trustScore,
    needs_expert_review: trustScore < TRUST_CONFIG.expertValidation.autoApprovalThreshold
  };
}

/**
 * Perform savings calculation with rate verification
 */
async function performSavingsWithTrust(classificationResult, formData) {
  if (!classificationResult.success || !classificationResult.hs_code) {
    return {
      annual_savings: 0,
      error: 'Cannot calculate savings without valid HS code',
      trust_score: TRUST_CONFIG.provenance.sourceReliabilityScores.cbp * 0.2
    };
  }

  const savingsResult = await databaseDrivenUSMCAEngine.calculateTariffSavings(
    classificationResult.hs_code,
    formData.trade_volume || TRUST_CONFIG.successStories.minSavingsAmountUSD,
    formData.supplier_country
  );

  const ratesProvenance = await dataProvenanceService.getDataWithProvenance('tariff_rates', classificationResult.hs_code);
  const trustScore = trustCalculationService.calculateSavingsTrustScore(savingsResult, ratesProvenance);

  return {
    ...savingsResult,
    provenance: ratesProvenance.success ? ratesProvenance.provenance : null,
    trust_score: trustScore,
    rate_verification_status: ratesProvenance.success ? 'verified' : 'unverified'
  };
}

/**
 * Evaluate expert validation needs using shared calculation service
 */
async function evaluateExpertNeeds(classificationResult, usmcaResult, savingsResult) {
  const averageTrustScore = [
    classificationResult.trust_score || 0,
    usmcaResult.trust_score || 0,
    savingsResult.trust_score || 0
  ].reduce((sum, score) => sum + score, 0) / 3;

  // Use shared trust calculation service for expert evaluation
  const expertValidation = trustCalculationService.evaluateExpertValidationNeed(averageTrustScore);
  
  // Check for professional referral
  const referralEvaluation = await professionalReferralSystem.evaluateReferralNeed(
    classificationResult, usmcaResult, savingsResult
  );

  return {
    ...expertValidation,
    professional_referral_required: referralEvaluation.requires_professional,
    severity: referralEvaluation.severity,
    recommendations: referralEvaluation.referral_details?.recommendations || [],
    average_trust_score: averageTrustScore
  };
}

/**
 * Generate certificate with complete trust verification
 * Uses enhanced trust-verified certificate service
 */
async function generateCertificateWithTrust(classificationResult, usmcaResult, formData) {
  try {
    logInfo('Generating trust-verified certificate', { 
      company: formData.company_name,
      hsCode: classificationResult?.hs_code 
    });

    // Use the enhanced trust-verified certificate service
    const certificateResult = await trustVerifiedCertificateService.generateTrustVerifiedCertificate(
      classificationResult, 
      usmcaResult, 
      formData,
      { 
        includeAuditTrail: true,
        requireExpertValidation: false // Let service decide based on trust score
      }
    );

    if (!certificateResult.success) {
      logError('Trust-verified certificate generation failed', { 
        error: certificateResult.error,
        company: formData.company_name 
      });
      
      return {
        error: certificateResult.error || 'Certificate generation failed',
        trust_score: 0.1,
        fallback: certificateResult.fallback || {
          recommendation: 'Manual certificate preparation required with customs broker',
          expert_consultation_required: true
        }
      };
    }

    // Return the complete trust-verified certificate
    return {
      ...certificateResult.certificate,
      trust_verification: certificateResult.trust_verification,
      generation_metadata: certificateResult.generation_metadata,
      trust_indicators: trustCalculationService.generateTrustIndicators({
        overall_trust_score: certificateResult.trust_verification.trust_score
      })
    };

  } catch (error) {
    logError('Certificate generation with trust failed', { error: error.message });
    return {
      error: 'Trust-verified certificate generation failed',
      trust_score: 0.1,
      fallback: {
        recommendation: 'Expert consultation required - contact licensed customs broker',
        expert_validation_required: true,
        error_details: error.message
      }
    };
  }
}