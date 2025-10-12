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