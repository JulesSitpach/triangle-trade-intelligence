/**
 * Universal Service Processing Modal
 * 4-stage workflow engine that adapts to any service type
 * Handles the core service delivery process
 */

import { useState, useEffect } from 'react';

export default function ServiceProcessingModal({
  isOpen,
  onClose,
  request,
  serviceConfig,
  currentStage = 1,
  formData = {},
  onUpdate
}) {
  const [activeStage, setActiveStage] = useState(currentStage);
  const [stageData, setStageData] = useState(formData);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});

  const stages = serviceConfig.stages || [
    { id: 1, name: 'Intake', icon: '📋', description: 'Initial setup and data collection' },
    { id: 2, name: 'Processing', icon: '⚙️', description: 'Analysis and main work' },
    { id: 3, name: 'Generation', icon: '📄', description: 'Create deliverables' },
    { id: 4, name: 'Delivery', icon: '✅', description: 'Client delivery and follow-up' }
  ];

  const handleStageUpdate = async (stageId, data) => {
    try {
      setLoading(true);

      // Update local state
      const updatedData = { ...stageData, [`stage_${stageId}`]: data };
      setStageData(updatedData);

      // Save to backend
      const response = await fetch('/api/admin/service-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: request.id,
          processing_data: updatedData,
          current_stage: stageId,
          status: getStatusFromStage(stageId)
        })
      });

      if (response.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating stage:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusFromStage = (stageId) => {
    const statusMap = {
      1: 'in-progress',
      2: 'processing',
      3: 'generation',
      4: 'completed'
    };
    return statusMap[stageId] || 'pending';
  };

  const renderStageContent = (stage) => {
    const stageKey = `stage_${stage.id}`;
    const currentStageData = stageData[stageKey] || {};

    switch (stage.id) {
      case 1: // Intake Stage
        return (
          <div className="stage-content">
            <h4 className="stage-title">{stage.icon} {stage.name}</h4>
            <p className="stage-description">{stage.description}</p>

            <div className="form-group">
              <label className="form-label">Service Requirements</label>
              <textarea
                className="form-textarea"
                placeholder={`Specific requirements for ${serviceConfig.name}...`}
                value={currentStageData.requirements || ''}
                onChange={(e) => setStageData({
                  ...stageData,
                  [stageKey]: { ...currentStageData, requirements: e.target.value }
                })}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select
                className="form-select"
                value={currentStageData.priority || 'standard'}
                onChange={(e) => setStageData({
                  ...stageData,
                  [stageKey]: { ...currentStageData, priority: e.target.value }
                })}
              >
                <option value="standard">Standard</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Supporting Documents</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(stage.id, e.target.files)}
                  className="file-input"
                />
                <p className="file-upload-text">Upload relevant documents for {serviceConfig.name}</p>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => handleStageUpdate(stage.id, currentStageData)}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Complete Intake'}
            </button>
          </div>
        );

      case 2: // Processing Stage
        return (
          <div className="stage-content">
            <h4 className="stage-title">{stage.icon} {stage.name}</h4>
            <p className="stage-description">{stage.description}</p>

            <div className="form-group">
              <label className="form-label">Analysis Notes</label>
              <textarea
                className="form-textarea"
                placeholder={`Analysis and processing notes for ${serviceConfig.name}...`}
                value={currentStageData.analysis || ''}
                onChange={(e) => setStageData({
                  ...stageData,
                  [stageKey]: { ...currentStageData, analysis: e.target.value }
                })}
                rows={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Findings & Recommendations</label>
              <textarea
                className="form-textarea"
                placeholder="Key findings and recommendations..."
                value={currentStageData.findings || ''}
                onChange={(e) => setStageData({
                  ...stageData,
                  [stageKey]: { ...currentStageData, findings: e.target.value }
                })}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Processing Status</label>
              <select
                className="form-select"
                value={currentStageData.processing_status || 'in-progress'}
                onChange={(e) => setStageData({
                  ...stageData,
                  [stageKey]: { ...currentStageData, processing_status: e.target.value }
                })}
              >
                <option value="in-progress">In Progress</option>
                <option value="review-needed">Review Needed</option>
                <option value="ready-for-generation">Ready for Generation</option>
              </select>
            </div>

            <button
              className="btn-primary"
              onClick={() => handleStageUpdate(stage.id, currentStageData)}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Complete Processing'}
            </button>
          </div>
        );

      case 3: // Generation Stage
        return (
          <div className="stage-content">
            <h4 className="stage-title">{stage.icon} {stage.name}</h4>
            <p className="stage-description">{stage.description}</p>

            <div className="form-group">
              <label className="form-label">Deliverable Type</label>
              <select
                className="form-select"
                value={currentStageData.deliverable_type || serviceConfig.defaultDeliverable}
                onChange={(e) => setStageData({
                  ...stageData,
                  [stageKey]: { ...currentStageData, deliverable_type: e.target.value }
                })}
              >
                {serviceConfig.deliverableTypes?.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Report Summary</label>
              <textarea
                className="form-textarea"
                placeholder="Executive summary of findings and recommendations..."
                value={currentStageData.summary || ''}
                onChange={(e) => setStageData({
                  ...stageData,
                  [stageKey]: { ...currentStageData, summary: e.target.value }
                })}
                rows={5}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Next Steps</label>
              <textarea
                className="form-textarea"
                placeholder="Recommended next steps for the client..."
                value={currentStageData.next_steps || ''}
                onChange={(e) => setStageData({
                  ...stageData,
                  [stageKey]: { ...currentStageData, next_steps: e.target.value }
                })}
                rows={3}
              />
            </div>

            <button
              className="btn-primary"
              onClick={() => handleStageUpdate(stage.id, currentStageData)}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Generate Deliverable'}
            </button>
          </div>
        );

      case 4: // Delivery Stage
        return (
          <div className="stage-content">
            <h4 className="stage-title">{stage.icon} {stage.name}</h4>
            <p className="stage-description">{stage.description}</p>

            <div className="form-group">
              <label className="form-label">Delivery Method</label>
              <select
                className="form-select"
                value={currentStageData.delivery_method || 'email'}
                onChange={(e) => setStageData({
                  ...stageData,
                  [stageKey]: { ...currentStageData, delivery_method: e.target.value }
                })}
              >
                <option value="email">Email Delivery</option>
                <option value="portal">Client Portal</option>
                <option value="meeting">Presentation Meeting</option>
                <option value="secure-link">Secure Download Link</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Client Communication</label>
              <textarea
                className="form-textarea"
                placeholder="Message to include with delivery..."
                value={currentStageData.delivery_message || ''}
                onChange={(e) => setStageData({
                  ...stageData,
                  [stageKey]: { ...currentStageData, delivery_message: e.target.value }
                })}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Follow-up Required</label>
              <select
                className="form-select"
                value={currentStageData.followup || 'none'}
                onChange={(e) => setStageData({
                  ...stageData,
                  [stageKey]: { ...currentStageData, followup: e.target.value }
                })}
              >
                <option value="none">No Follow-up</option>
                <option value="1week">1 Week Follow-up</option>
                <option value="1month">1 Month Follow-up</option>
                <option value="quarterly">Quarterly Review</option>
              </select>
            </div>

            <button
              className="btn-success"
              onClick={() => handleStageUpdate(stage.id, currentStageData)}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Complete Delivery'}
            </button>
          </div>
        );

      default:
        return <div>Stage not configured</div>;
    }
  };

  const handleFileUpload = (stageId, files) => {
    // Handle file upload logic
    console.log(`Uploading files for stage ${stageId}:`, files);
    // TODO: Implement actual file upload
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container large">
        <div className="modal-header">
          <h3 className="modal-title">
            {serviceConfig.icon} {serviceConfig.name} - {request?.client_name}
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Stage Progress Indicator */}
          <div className="stage-progress">
            {stages.map(stage => (
              <div
                key={stage.id}
                className={`stage-indicator ${activeStage >= stage.id ? 'completed' : ''} ${activeStage === stage.id ? 'active' : ''}`}
                onClick={() => setActiveStage(stage.id)}
              >
                <div className="stage-icon">{stage.icon}</div>
                <div className="stage-name">{stage.name}</div>
              </div>
            ))}
          </div>

          {/* Current Stage Content */}
          <div className="stage-container">
            {renderStageContent(stages.find(s => s.id === activeStage))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <div className="stage-navigation">
            {activeStage > 1 && (
              <button
                className="btn-secondary"
                onClick={() => setActiveStage(activeStage - 1)}
              >
                Previous Stage
              </button>
            )}
            {activeStage < 4 && (
              <button
                className="btn-primary"
                onClick={() => setActiveStage(activeStage + 1)}
              >
                Next Stage
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}