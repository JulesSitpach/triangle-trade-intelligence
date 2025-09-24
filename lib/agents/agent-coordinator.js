import { FormAssistantAgent } from './form-assistant-agent.js';
import { ClassificationAgent } from './classification-agent.js';
import { ValidationAgent } from './validation-agent.js';

/**
 * Agent Coordinator - Orchestrates multi-agent collaboration
 *
 * This is the intelligence layer that manages:
 * 1. Agent-to-agent communication
 * 2. Sequential and parallel agent execution
 * 3. Conflict resolution between agent suggestions
 * 4. Performance monitoring and logging
 * 5. Smart escalation decisions
 */
export class AgentCoordinator {
  constructor() {
    this.formAssistant = new FormAssistantAgent();
    this.classification = new ClassificationAgent();
    this.validation = new ValidationAgent();

    this.interactionLog = [];
    this.performanceMetrics = {
      totalInteractions: 0,
      successfulInteractions: 0,
      averageConfidence: 0,
      escalationRate: 0,
      agentPerformance: {
        formAssistant: { calls: 0, avgConfidence: 0 },
        classification: { calls: 0, avgConfidence: 0 },
        validation: { calls: 0, avgConfidence: 0 }
      }
    };
  }

  /**
   * Orchestrate certificate completion with multi-agent collaboration
   *
   * Flow:
   * 1. Form Assistant suggests auto-population
   * 2. Classification Agent validates/suggests HS codes
   * 3. Validation Agent checks overall compliance
   * 4. Coordinator synthesizes recommendations
   */
  async orchestrateCertificateCompletion(certificateData, userContext) {
    const startTime = Date.now();
    const orchestrationId = this.generateOrchestrationId();

    this.log(orchestrationId, 'start', { certificateData, userContext });

    try {
      // Phase 1: Form Assistant - Auto-populate and suggest
      const formSuggestions = await this.executeFormAssistance(
        certificateData,
        userContext,
        orchestrationId
      );

      // Merge form suggestions with existing data
      const enhancedData = {
        ...certificateData,
        ...formSuggestions.data.populated_fields
      };

      // Phase 2: Classification Agent - Validate/suggest HS codes
      const classificationResult = await this.executeClassification(
        enhancedData,
        orchestrationId
      );

      // Merge classification results
      if (classificationResult.success && classificationResult.data.hsCode) {
        enhancedData.hs_code = classificationResult.data.hsCode;
        enhancedData.classification_confidence = classificationResult.data.confidence;
      }

      // Phase 3: Validation Agent - Comprehensive compliance check
      const validationResult = await this.executeValidation(
        enhancedData,
        orchestrationId
      );

      // Phase 4: Synthesize and decide
      const orchestrationResult = this.synthesizeResults({
        formSuggestions,
        classificationResult,
        validationResult,
        enhancedData
      });

      // Log successful orchestration
      const duration = Date.now() - startTime;
      this.log(orchestrationId, 'complete', {
        duration,
        result: orchestrationResult
      });

      this.updatePerformanceMetrics(orchestrationResult);

      return {
        success: true,
        orchestrationId,
        duration,
        ...orchestrationResult
      };

    } catch (error) {
      console.error('[AgentCoordinator] Orchestration failed:', error);
      this.log(orchestrationId, 'error', { error: error.message });

      return {
        success: false,
        orchestrationId,
        error: error.message
      };
    }
  }

  async executeFormAssistance(certificateData, userContext, orchestrationId) {
    this.log(orchestrationId, 'agent_start', { agent: 'FormAssistant' });

    const result = await this.formAssistant.autoPopulateForm(
      certificateData,
      userContext.certificateHistory || []
    );

    this.log(orchestrationId, 'agent_complete', {
      agent: 'FormAssistant',
      confidence: result.data?.overall_confidence,
      fieldsPopulated: Object.keys(result.data?.populated_fields || {}).length
    });

    this.performanceMetrics.agentPerformance.formAssistant.calls++;
    this.performanceMetrics.agentPerformance.formAssistant.avgConfidence =
      this.updateAverage(
        this.performanceMetrics.agentPerformance.formAssistant.avgConfidence,
        result.data?.overall_confidence || 0,
        this.performanceMetrics.agentPerformance.formAssistant.calls
      );

    return result;
  }

  async executeClassification(certificateData, orchestrationId) {
    if (!certificateData.product_description) {
      return {
        success: false,
        message: 'Product description required for classification'
      };
    }

    this.log(orchestrationId, 'agent_start', { agent: 'Classification' });

    const result = await this.classification.suggestWithConfidenceBreakdown(
      certificateData.product_description,
      certificateData.component_origins || []
    );

    this.log(orchestrationId, 'agent_complete', {
      agent: 'Classification',
      confidence: result.data?.adjustedConfidence,
      hsCode: result.data?.hsCode
    });

    this.performanceMetrics.agentPerformance.classification.calls++;
    this.performanceMetrics.agentPerformance.classification.avgConfidence =
      this.updateAverage(
        this.performanceMetrics.agentPerformance.classification.avgConfidence,
        result.data?.adjustedConfidence || 0,
        this.performanceMetrics.agentPerformance.classification.calls
      );

    return result;
  }

  async executeValidation(certificateData, orchestrationId) {
    this.log(orchestrationId, 'agent_start', { agent: 'Validation' });

    const result = await this.validation.validateCertificate(certificateData);

    this.log(orchestrationId, 'agent_complete', {
      agent: 'Validation',
      valid: result.data?.valid,
      confidence: result.data?.confidence,
      errors: result.data?.errors?.length
    });

    this.performanceMetrics.agentPerformance.validation.calls++;
    this.performanceMetrics.agentPerformance.validation.avgConfidence =
      this.updateAverage(
        this.performanceMetrics.agentPerformance.validation.avgConfidence,
        result.data?.confidence || 0,
        this.performanceMetrics.agentPerformance.validation.calls
      );

    return result;
  }

  synthesizeResults({ formSuggestions, classificationResult, validationResult, enhancedData }) {
    const overallConfidence = this.calculateOverallConfidence({
      form: formSuggestions.data?.overall_confidence || 50,
      classification: classificationResult.data?.adjustedConfidence || 50,
      validation: validationResult.data?.confidence || 50
    });

    const readyToSubmit = validationResult.data?.valid && overallConfidence >= 85;

    const expertRecommendation = this.determineExpertRecommendation({
      overallConfidence,
      validationErrors: validationResult.data?.errors?.length || 0,
      classificationConfidence: classificationResult.data?.adjustedConfidence || 50
    });

    return {
      certificateData: enhancedData,
      agentResults: {
        formSuggestions: formSuggestions.data,
        classification: classificationResult.data,
        validation: validationResult.data
      },
      orchestrationSummary: {
        overallConfidence,
        readyToSubmit,
        acceptanceProbability: readyToSubmit ? overallConfidence : Math.max(overallConfidence - 20, 0),
        expertRecommendation
      },
      userGuidance: this.generateUserGuidance({
        readyToSubmit,
        overallConfidence,
        validationResult,
        expertRecommendation
      })
    };
  }

  calculateOverallConfidence({ form, classification, validation }) {
    // Weighted average: validation most important, then classification, then form
    const weighted = (
      form * 0.2 +
      classification * 0.35 +
      validation * 0.45
    );

    return Math.round(weighted);
  }

  determineExpertRecommendation({ overallConfidence, validationErrors, classificationConfidence }) {
    // Critical issues = immediate expert completion
    if (validationErrors > 3 || overallConfidence < 60) {
      return {
        recommended: true,
        service: 'expert_completion',
        price: 200,
        reason: 'Multiple compliance issues detected - expert completion recommended',
        urgency: 'high'
      };
    }

    // Medium complexity = expert review suggested
    if (overallConfidence < 75 || classificationConfidence < 70) {
      return {
        recommended: true,
        service: 'expert_review',
        price: 50,
        reason: 'Complex classification or compliance nuances - expert review recommended',
        urgency: 'medium'
      };
    }

    // High confidence = DIY with confidence
    if (overallConfidence >= 85) {
      return {
        recommended: false,
        service: 'none',
        price: 0,
        reason: 'Certificate meets all requirements - ready to submit',
        urgency: 'none'
      };
    }

    // Default case
    return {
      recommended: true,
      service: 'expert_review',
      price: 50,
      reason: 'Consider expert review for additional peace of mind',
      urgency: 'low'
    };
  }

  generateUserGuidance({ readyToSubmit, overallConfidence, validationResult, expertRecommendation }) {
    if (readyToSubmit) {
      return {
        status: 'success',
        message: `✅ Certificate ready to submit! ${overallConfidence}% acceptance probability`,
        nextStep: 'Review final details and submit',
        confidence: overallConfidence
      };
    }

    if (validationResult.data?.errors?.length > 0) {
      return {
        status: 'error',
        message: `⚠️ ${validationResult.data.errors.length} critical issue(s) must be resolved`,
        nextStep: 'Review errors below and correct before submission',
        issues: validationResult.data.errors,
        expertOption: expertRecommendation
      };
    }

    if (expertRecommendation.recommended) {
      return {
        status: 'warning',
        message: `🤔 Complex case detected (${overallConfidence}% confidence)`,
        nextStep: expertRecommendation.reason,
        expertOption: expertRecommendation
      };
    }

    return {
      status: 'info',
      message: 'Certificate in progress - continue completing fields',
      nextStep: 'Fill remaining required fields',
      confidence: overallConfidence
    };
  }

  // Inter-agent communication logging for Phase 2 preparation
  log(orchestrationId, event, data) {
    const logEntry = {
      orchestrationId,
      timestamp: new Date().toISOString(),
      event,
      data
    };

    this.interactionLog.push(logEntry);

    // Keep only last 1000 interactions in memory
    if (this.interactionLog.length > 1000) {
      this.interactionLog = this.interactionLog.slice(-1000);
    }

    console.log(`[Orchestration:${orchestrationId}] ${event}:`, data);
  }

  generateOrchestrationId() {
    return `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateAverage(currentAvg, newValue, count) {
    return ((currentAvg * (count - 1)) + newValue) / count;
  }

  updatePerformanceMetrics(orchestrationResult) {
    this.performanceMetrics.totalInteractions++;

    if (orchestrationResult.orchestrationSummary?.readyToSubmit) {
      this.performanceMetrics.successfulInteractions++;
    }

    if (orchestrationResult.orchestrationSummary?.expertRecommendation?.recommended) {
      this.performanceMetrics.escalationRate =
        ((this.performanceMetrics.escalationRate * (this.performanceMetrics.totalInteractions - 1)) + 1) /
        this.performanceMetrics.totalInteractions;
    }

    this.performanceMetrics.averageConfidence = this.updateAverage(
      this.performanceMetrics.averageConfidence,
      orchestrationResult.orchestrationSummary?.overallConfidence || 0,
      this.performanceMetrics.totalInteractions
    );
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      successRate: this.performanceMetrics.totalInteractions > 0
        ? (this.performanceMetrics.successfulInteractions / this.performanceMetrics.totalInteractions) * 100
        : 0
    };
  }

  getInteractionLogs(limit = 100) {
    return this.interactionLog.slice(-limit);
  }

  // Phase 2 preparation: Analyze agent collaboration patterns
  analyzeCollaborationPatterns() {
    const patterns = {
      formToClassification: 0,
      classificationToValidation: 0,
      validationEscalations: 0,
      successfulCompletions: 0
    };

    this.interactionLog.forEach((log, index) => {
      if (log.event === 'agent_complete') {
        const nextLog = this.interactionLog[index + 1];
        if (nextLog?.event === 'agent_start') {
          if (log.data.agent === 'FormAssistant' && nextLog.data.agent === 'Classification') {
            patterns.formToClassification++;
          }
          if (log.data.agent === 'Classification' && nextLog.data.agent === 'Validation') {
            patterns.classificationToValidation++;
          }
        }
      }

      if (log.event === 'complete' && log.data.result?.orchestrationSummary?.readyToSubmit) {
        patterns.successfulCompletions++;
      }

      if (log.data?.expertRecommendation?.recommended) {
        patterns.validationEscalations++;
      }
    });

    return patterns;
  }
}

export default AgentCoordinator;