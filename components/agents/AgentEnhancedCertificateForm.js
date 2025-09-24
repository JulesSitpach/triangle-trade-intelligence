import { useState } from 'react';
import useAgentOrchestration from '../../hooks/useAgentOrchestration';
import AgentSuggestionBadge from './AgentSuggestionBadge';
import ValidationStatusPanel from './ValidationStatusPanel';
import OrchestrationStatusBar from './OrchestrationStatusBar';

/**
 * Agent-Enhanced Certificate Form
 *
 * Wraps certificate form fields with real-time AI assistance
 */
export default function AgentEnhancedCertificateForm({
  certificateData,
  onCertificateDataChange,
  userContext
}) {
  const [fieldSuggestions, setFieldSuggestions] = useState({});

  const {
    isOrchestrating,
    overallConfidence,
    readyToSubmit,
    userGuidance,
    agentSuggestions,
    expertRecommendation,
    getFieldSuggestion,
    getHSCodeSuggestion,
  } = useAgentOrchestration(certificateData, userContext);

  // Handle field focus - get AI suggestion
  const handleFieldFocus = async (fieldName) => {
    if (!fieldSuggestions[fieldName]) {
      const suggestion = await getFieldSuggestion(fieldName);
      if (suggestion && suggestion.success) {
        setFieldSuggestions(prev => ({
          ...prev,
          [fieldName]: suggestion
        }));
      }
    }
  };

  // Accept AI suggestion
  const handleAcceptSuggestion = (fieldName, value) => {
    onCertificateDataChange({
      ...certificateData,
      [fieldName]: value
    });

    setFieldSuggestions(prev => ({
      ...prev,
      [fieldName]: null
    }));
  };

  // Dismiss suggestion
  const handleDismissSuggestion = (fieldName) => {
    setFieldSuggestions(prev => ({
      ...prev,
      [fieldName]: null
    }));
  };

  // Get HS code suggestion on product description change
  const handleProductDescriptionChange = async (value) => {
    onCertificateDataChange({
      ...certificateData,
      product_description: value
    });

    if (value.length > 20) {
      const suggestion = await getHSCodeSuggestion(
        value,
        certificateData.component_origins || []
      );

      if (suggestion && suggestion.success) {
        setFieldSuggestions(prev => ({
          ...prev,
          hs_code: suggestion
        }));
      }
    }
  };

  return (
    <>
      {/* Import agent styles */}
      <link rel="stylesheet" href="/styles/agent-components.css" />

      {/* Orchestration Status Bar */}
      <OrchestrationStatusBar
        isOrchestrating={isOrchestrating}
        overallConfidence={overallConfidence}
        readyToSubmit={readyToSubmit}
        userGuidance={userGuidance}
      />

      {/* Form Fields with Agent Assistance */}
      <div className="form-group">
        <label className="form-label">Exporter Name</label>
        <input
          type="text"
          className="form-control"
          value={certificateData.exporter_name || ''}
          onChange={(e) => onCertificateDataChange({
            ...certificateData,
            exporter_name: e.target.value
          })}
          onFocus={() => handleFieldFocus('exporter_name')}
        />
        {fieldSuggestions.exporter_name && (
          <AgentSuggestionBadge
            suggestion={fieldSuggestions.exporter_name}
            onAccept={(value) => handleAcceptSuggestion('exporter_name', value)}
            onDismiss={() => handleDismissSuggestion('exporter_name')}
          />
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Product Description</label>
        <textarea
          className="form-control"
          rows="4"
          value={certificateData.product_description || ''}
          onChange={(e) => handleProductDescriptionChange(e.target.value)}
          onFocus={() => handleFieldFocus('product_description')}
          placeholder="Describe your product in detail..."
        />
        {fieldSuggestions.product_description && (
          <AgentSuggestionBadge
            suggestion={fieldSuggestions.product_description}
            onAccept={(value) => handleAcceptSuggestion('product_description', value)}
            onDismiss={() => handleDismissSuggestion('product_description')}
          />
        )}
      </div>

      <div className="form-group">
        <label className="form-label">HS Code</label>
        <input
          type="text"
          className="form-control"
          value={certificateData.hs_code || ''}
          onChange={(e) => onCertificateDataChange({
            ...certificateData,
            hs_code: e.target.value
          })}
          onFocus={() => handleFieldFocus('hs_code')}
          placeholder="e.g., 8517.62.00"
        />
        {fieldSuggestions.hs_code && (
          <AgentSuggestionBadge
            suggestion={fieldSuggestions.hs_code}
            onAccept={(value) => handleAcceptSuggestion('hs_code', value)}
            onDismiss={() => handleDismissSuggestion('hs_code')}
          />
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Origin Criterion</label>
        <select
          className="form-control"
          value={certificateData.origin_criterion || ''}
          onChange={(e) => onCertificateDataChange({
            ...certificateData,
            origin_criterion: e.target.value
          })}
          onFocus={() => handleFieldFocus('origin_criterion')}
        >
          <option value="">Select Criterion</option>
          <option value="A">A - Wholly Obtained or Produced</option>
          <option value="B">B - Produced Entirely from Originating Materials</option>
          <option value="C">C - Satisfies Regional Value Content</option>
          <option value="D">D - Satisfies Change in Tariff Classification</option>
        </select>
        {fieldSuggestions.origin_criterion && (
          <AgentSuggestionBadge
            suggestion={fieldSuggestions.origin_criterion}
            onAccept={(value) => handleAcceptSuggestion('origin_criterion', value)}
            onDismiss={() => handleDismissSuggestion('origin_criterion')}
          />
        )}
      </div>

      {/* Validation Status Panel */}
      {agentSuggestions.validation && (
        <ValidationStatusPanel
          validationResult={agentSuggestions.validation}
          expertRecommendation={expertRecommendation}
        />
      )}

      {/* Classification Details */}
      {agentSuggestions.classification && agentSuggestions.classification.data && (
        <div className="agent-classification-panel">
          <h4>🏷️ HS Code Classification Analysis</h4>
          <div className="classification-details">
            <div className="classification-item">
              <span className="label">Suggested Code:</span>
              <span className="value">{agentSuggestions.classification.data.hsCode}</span>
            </div>
            <div className="classification-item">
              <span className="label">Confidence:</span>
              <span className="value">{agentSuggestions.classification.data.adjustedConfidence}%</span>
            </div>
            <div className="classification-item">
              <span className="label">USMCA Qualification:</span>
              <span className="value">{agentSuggestions.classification.data.usmcaQualification}</span>
            </div>
            {agentSuggestions.classification.data.explanation && (
              <div className="classification-explanation">
                {agentSuggestions.classification.data.explanation}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}