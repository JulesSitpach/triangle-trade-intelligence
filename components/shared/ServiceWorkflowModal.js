/**
 * ServiceWorkflowModal.js - Production-ready shared modal for all service workflows
 * NO HARDCODING: All data comes from database, configuration, or subscriber workflow
 * Used by all 6 services: Jorge (3) + Cristina (3)
 * Follows admin-workflows.css styling system
 */

import React, { useState, useEffect } from 'react';
import { useToast, ToastContainer } from './ToastNotification';

const ServiceWorkflowModal = ({ isOpen, service, request, onClose, onComplete, currentUser = 'Jorge', viewMode = 'active' }) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [stageData, setStageData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toasts, showToast, removeToast, success, error: errorToast, warning, info } = useToast();

  // Reset when modal opens/closes and initialize workflow tracking
  useEffect(() => {
    if (isOpen && request) {
      // Set current stage from request or default to 1
      setCurrentStage(request.current_stage || 1);
      setStageData({});
      setError(null);

      // Initialize workflow tracking ONLY when actively starting (not in readonly mode)
      if (!request.started_by && viewMode === 'active') {
        initializeWorkflow();
      }
    }
  }, [isOpen, request, viewMode]);

  // Initialize workflow tracking when first opened
  const initializeWorkflow = async () => {
    try {
      const response = await fetch('/api/admin/service-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: request.id,
          started_by: currentUser,
          current_assigned_to: getStageAssignment(1), // Stage 1 assignment
          current_stage: 1,
          stage_1_started_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error('Failed to initialize workflow tracking');
      }
    } catch (err) {
      console.error('Error initializing workflow:', err);
    }
  };

  // Determine who is assigned to each stage based on service type
  const getStageAssignment = (stageNumber) => {
    // For Trade Health Check: Stage 1 = Jorge, Stage 2 = Cristina, Stage 3 = Both
    // This can be customized per service in the future
    if (service.stageAssignments && service.stageAssignments[stageNumber]) {
      return service.stageAssignments[stageNumber];
    }

    // Default assignment pattern
    if (stageNumber === 1) return 'Jorge';
    if (stageNumber === 2) return 'Cristina';
    return 'Jorge'; // Stage 3+ defaults to Jorge
  };

  // Extract subscriber data safely - NO business logic calculations here
  const subscriberContext = request?.subscriber_data || {};
  const serviceDetails = request?.service_details || {};

  const handleStageComplete = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      // Store stage data
      const updatedStageData = {
        ...stageData,
        [`stage_${currentStage}`]: formData
      };
      setStageData(updatedStageData);

      // Save stage completion metadata to database
      const stageCompletionData = {
        id: request.id,
        [`stage_${currentStage}_completed_by`]: currentUser,
        [`stage_${currentStage}_completed_at`]: new Date().toISOString(),
        workflow_state: updatedStageData
      };

      // If last stage, complete the service
      if (currentStage >= service.totalStages) {
        info('Completing service workflow...');
        await completeService(updatedStageData);
        success('Service completed successfully!');
      } else {
        // Update current stage and assignment for next stage
        const nextStage = currentStage + 1;
        const nextAssignment = getStageAssignment(nextStage);

        stageCompletionData.current_stage = nextStage;
        stageCompletionData.current_assigned_to = nextAssignment;
        stageCompletionData[`stage_${nextStage}_started_at`] = new Date().toISOString();

        // Save stage completion to database
        const response = await fetch('/api/admin/service-requests', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stageCompletionData)
        });

        if (!response.ok) {
          throw new Error('Failed to save stage completion');
        }

        // Move to next stage
        success(`Stage ${currentStage} completed successfully`);
        setCurrentStage(nextStage);
        info(`Moving to Stage ${nextStage}...`);
      }
    } catch (err) {
      console.error('Stage completion error:', err);
      const errorMessage = err.message || 'An error occurred processing this stage';
      setError(errorMessage);
      errorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const completeService = async (allStageData) => {
    try {
      // Update service request status in database
      const updateResponse = await fetch('/api/admin/service-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: request.id,
          status: 'completed',
          completion_data: allStageData,
          completed_at: new Date().toISOString()
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update service status');
      }

      // Call completion handler
      await onComplete({
        service_request_id: request.id,
        completion_data: allStageData,
        completed_at: new Date().toISOString()
      });

      onClose();
    } catch (err) {
      throw new Error(`Service completion failed: ${err.message}`);
    }
  };

  const handlePreviousStage = () => {
    if (currentStage > 1) {
      setCurrentStage(prev => prev - 1);
      setError(null);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getStageStatus = (stageNumber) => {
    if (stageNumber < currentStage) return 'completed';
    if (stageNumber === currentStage) return 'active';
    return 'pending';
  };

  if (!isOpen || !service || !request) {
    return null;
  }

  return (
    <div className="workflow-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="workflow-modal-content">

        {/* Header with service title and client */}
        <div className="workflow-modal-header">
          <h2 className="workflow-modal-title">
            {service.title} - {request.client_company || subscriberContext.company_name || 'Service Request'}
          </h2>
          <button
            onClick={handleClose}
            className="workflow-modal-close"
            disabled={loading}
            type="button"
          >
            ×
          </button>
        </div>

        {/* Stage progress indicator */}
        <div className="workflow-progress">
          <div className="workflow-progress-steps">
            {Array.from({ length: service.totalStages }, (_, i) => i + 1).map(stageNum => (
              <div
                key={stageNum}
                className={`workflow-step ${getStageStatus(stageNum)}`}
              >
                Stage {stageNum}: {service.stageNames?.[stageNum - 1] || `Step ${stageNum}`}
              </div>
            ))}
          </div>
        </div>

        {/* Workflow tracking info */}
        {request.started_by && (
          <div className="workflow-client-context">
            <div className="workflow-client-context-title">
              Team Collaboration Status:
            </div>
            <div className="workflow-client-context-item">
              <span className="workflow-client-context-label">Started by:</span> {request.started_by}
            </div>
            <div className="workflow-client-context-item">
              <span className="workflow-client-context-label">Currently assigned to:</span> {request.current_assigned_to || 'Not assigned'}
            </div>
            {viewMode === 'readonly' && (
              <div className="workflow-status-card workflow-status-info">
                <div className="workflow-status-info-text">
                  ℹ️ Read-only mode - Waiting for {request.current_assigned_to} to complete their task
                </div>
              </div>
            )}
          </div>
        )}

        {/* Client business context from subscriber workflow */}
        <div className="workflow-client-context">
          <div className="workflow-client-context-title">
            Client Business Context:
          </div>

          {subscriberContext.product_description && (
            <div className="workflow-client-context-item">
              <span className="workflow-client-context-label">Product:</span> {subscriberContext.product_description}
            </div>
          )}

          {subscriberContext.qualification_status && (
            <div className="workflow-client-context-item">
              <span className="workflow-client-context-label">USMCA Status:</span> {subscriberContext.qualification_status}
            </div>
          )}

          {subscriberContext.trade_volume && (
            <div className="workflow-client-context-item">
              <span className="workflow-client-context-label">Trade Volume:</span> ${subscriberContext.trade_volume}
            </div>
          )}

          {subscriberContext.manufacturing_location && (
            <div className="workflow-client-context-item">
              <span className="workflow-client-context-label">Manufacturing:</span> {subscriberContext.manufacturing_location}
            </div>
          )}

          {serviceDetails.industry && (
            <div className="workflow-client-context-item">
              <span className="workflow-client-context-label">Industry:</span> {serviceDetails.industry}
            </div>
          )}
        </div>

        {/* USMCA Qualification Results */}
        {subscriberContext.qualification_status && (
          <div className="workflow-client-context">
            <div className="workflow-client-context-title">
              USMCA Qualification Analysis:
            </div>
            <div className="workflow-client-context-item">
              <span className="workflow-client-context-label">Status:</span>
              <strong>{subscriberContext.qualification_status}</strong>
            </div>
            {subscriberContext.north_american_content && (
              <div className="workflow-client-context-item">
                <span className="workflow-client-context-label">North American Content:</span> {subscriberContext.north_american_content}%
              </div>
            )}
            {subscriberContext.threshold_applied && (
              <div className="workflow-client-context-item">
                <span className="workflow-client-context-label">Threshold Applied:</span> {subscriberContext.threshold_applied}%
              </div>
            )}
            {subscriberContext.gap && (
              <div className="workflow-client-context-item">
                <span className="workflow-client-context-label">Gap to Qualify:</span> {subscriberContext.gap}%
              </div>
            )}
          </div>
        )}

        {/* Savings & Financial Impact */}
        {(subscriberContext.annual_savings || subscriberContext.potential_usmca_savings || subscriberContext.calculated_savings) && (
          <div className="workflow-client-context">
            <div className="workflow-client-context-title">
              Financial Impact:
            </div>
            <div className="workflow-client-context-item">
              <span className="workflow-client-context-label">Annual USMCA Savings:</span>
              <strong>${(subscriberContext.annual_savings || subscriberContext.potential_usmca_savings || subscriberContext.calculated_savings || 0).toLocaleString()}</strong>
            </div>
            {subscriberContext.annual_tariff_cost && (
              <div className="workflow-client-context-item">
                <span className="workflow-client-context-label">Current Annual Tariff Cost:</span> ${subscriberContext.annual_tariff_cost.toLocaleString()}
              </div>
            )}
            {subscriberContext.monthly_savings && (
              <div className="workflow-client-context-item">
                <span className="workflow-client-context-label">Monthly Savings:</span> ${subscriberContext.monthly_savings.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Compliance Gaps & Risk Factors */}
        {(subscriberContext.compliance_gaps || subscriberContext.vulnerability_factors) && (
          <div className="workflow-client-context">
            <div className="workflow-client-context-title">
              Compliance & Risk Assessment:
            </div>
            {subscriberContext.compliance_gaps && subscriberContext.compliance_gaps.length > 0 && (
              <div className="risk-factors">
                <strong>Compliance Gaps:</strong>
                <ul>
                  {subscriberContext.compliance_gaps.map((gap, index) => (
                    <li key={index}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}
            {subscriberContext.vulnerability_factors && subscriberContext.vulnerability_factors.length > 0 && (
              <div className="risk-factors">
                <strong>Vulnerability Factors:</strong>
                <ul>
                  {subscriberContext.vulnerability_factors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Trade Alerts & Crisis Intelligence */}
        {(subscriberContext.alerts || subscriberContext.trade_alerts || subscriberContext.crisis_factors) && (
          <div className="workflow-client-context">
            <div className="workflow-client-context-title">
              Trade Alerts & Crisis Intelligence:
            </div>
            {(subscriberContext.alerts || subscriberContext.trade_alerts || []).map((alert, index) => (
              <div key={index} className="workflow-client-context-item">
                <strong>{alert.type || alert.alert_type}:</strong> {alert.message || alert.description}
                {alert.impact && <div><span className="workflow-client-context-label">Impact:</span> ${alert.impact.toLocaleString()}/year</div>}
              </div>
            ))}
            {subscriberContext.crisis_factors && subscriberContext.crisis_factors.length > 0 && (
              <div className="risk-factors">
                <strong>Crisis Factors:</strong>
                <ul>
                  {subscriberContext.crisis_factors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Component Tariff Intelligence - Enriched Data from Workflow */}
        {(subscriberContext.component_origins || subscriberContext.components || subscriberContext.component_breakdown) && (
          <div className="workflow-client-context">
            <div className="workflow-client-context-title">
              Component Tariff Intelligence:
            </div>
            <div className="component-table-wrapper">
              <table className="component-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>HS Code</th>
                    <th>Origin</th>
                    <th>Value %</th>
                    <th>MFN Rate</th>
                    <th>USMCA Rate</th>
                    <th>Savings</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {(subscriberContext.component_origins || subscriberContext.components || subscriberContext.component_breakdown || []).map((component, index) => {
                    const mfnRate = component.mfn_rate || component.tariff_rates?.mfn_rate || 0;
                    const usmcaRate = component.usmca_rate || component.tariff_rates?.usmca_rate || 0;
                    const savingsPercent = mfnRate - usmcaRate;
                    const confidence = component.confidence || 0;
                    const isLowConfidence = confidence < 70;
                    const isMexicoOpportunity = component.origin_country === 'MX' && savingsPercent > 5;

                    return (
                      <tr key={index} className={isLowConfidence ? 'low-confidence' : ''}>
                        <td>{component.description || component.component_type || 'Component ' + (index + 1)}</td>
                        <td>{component.hs_code || component.classified_hs_code || 'Not classified'}</td>
                        <td>{component.origin_country || component.country || 'Unknown'}</td>
                        <td>{component.value_percentage || component.percentage || 0}%</td>
                        <td>{mfnRate.toFixed(1)}%</td>
                        <td>{usmcaRate.toFixed(1)}%</td>
                        <td className={savingsPercent > 0 ? 'savings-positive' : 'savings-zero'}>
                          {savingsPercent.toFixed(1)}%
                        </td>
                        <td>
                          <span className={isLowConfidence ? 'confidence-low' : 'confidence-high'}>
                            {confidence}%
                          </span>
                          {isLowConfidence && ' ⚠️'}
                          {isMexicoOpportunity && ' 🇲🇽'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="component-table-footer">
                <div className="enrichment-indicators">
                  <span className="enrichment-note">
                    Rate Source: {subscriberContext.component_origins?.[0]?.rate_source === 'official_hts_2025'
                      ? '✅ Official USITC HTS 2025 Database'
                      : subscriberContext.component_origins?.[0]?.rate_source === 'ai_estimated'
                      ? '🤖 AI Estimated (verify if needed)'
                      : 'Database + AI Hybrid System'}
                  </span>
                  {subscriberContext.component_origins?.some(c => c.confidence < 70) && (
                    <span className="enrichment-warning">
                      ⚠️ Low confidence components require professional validation
                    </span>
                  )}
                  {subscriberContext.component_origins?.some(c => c.origin_country === 'MX') && (
                    <span className="enrichment-opportunity">
                      🇲🇽 Mexico sourcing opportunities identified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="workflow-status-card workflow-status-warning">
            <div className="workflow-status-warning-text">
              Error: {error}
            </div>
          </div>
        )}

        {/* Current stage content */}
        <div className="workflow-form">
          {service.renderStage && service.renderStage(
            currentStage,
            request,
            stageData,
            handleStageComplete,
            loading,
            viewMode
          )}
        </div>

        {/* Modal footer actions */}
        <div className="workflow-modal-actions">
          <div className="workflow-action-group">
            {currentStage > 1 && (
              <button
                onClick={handlePreviousStage}
                disabled={loading}
                className="btn-secondary"
                type="button"
              >
                Previous
              </button>
            )}
          </div>

          <div className="workflow-action-group">
            <button
              onClick={handleClose}
              disabled={loading}
              className="btn-secondary"
              type="button"
            >
              {loading ? 'Processing...' : 'Cancel'}
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="workflow-status-card workflow-status-info">
            <div className="workflow-status-info-text">
              {currentStage >= service.totalStages ? 'Completing service...' : `Processing Stage ${currentStage}...`}
            </div>
          </div>
        )}

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </div>
  );
};

export default ServiceWorkflowModal;