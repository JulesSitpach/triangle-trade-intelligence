/**
 * Universal Service Report Wizard
 * Generates professional deliverables for any service type
 * Creates PDFs, reports, and client-ready documents
 */

import { useState, useEffect } from 'react';

export default function ServiceReportWizard({
  isOpen,
  onClose,
  request,
  serviceConfig,
  currentStep = 1,
  reportData = {},
  onComplete
}) {
  const [activeStep, setActiveStep] = useState(currentStep);
  const [wizardData, setWizardData] = useState(reportData);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(null);

  const steps = [
    { id: 1, name: 'Template', icon: '📋', description: 'Select report template' },
    { id: 2, name: 'Content', icon: '📝', description: 'Add content and findings' },
    { id: 3, name: 'Review', icon: '👁️', description: 'Review and preview' },
    { id: 4, name: 'Generate', icon: '🚀', description: 'Generate final deliverable' }
  ];

  const handleStepUpdate = (stepId, data) => {
    const updatedData = { ...wizardData, [`step_${stepId}`]: data };
    setWizardData(updatedData);
  };

  const generateReport = async () => {
    try {
      setGenerating(true);

      const reportPayload = {
        service_type: serviceConfig.type,
        client_info: {
          name: request.client_name,
          email: request.client_email,
          company: request.client_company
        },
        report_data: wizardData,
        template: wizardData.step_1?.template || serviceConfig.defaultTemplate,
        delivery_method: wizardData.step_4?.delivery_method || 'email'
      };

      const response = await fetch('/api/admin/generate-service-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportPayload)
      });

      if (response.ok) {
        const result = await response.json();
        setPreview(result.preview_url);

        // Update request status
        await fetch('/api/admin/service-requests', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: request.id,
            status: 'delivered',
            report_data: wizardData,
            deliverable_url: result.download_url
          })
        });

        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const renderStepContent = (step) => {
    const stepKey = `step_${step.id}`;
    const currentStepData = wizardData[stepKey] || {};

    switch (step.id) {
      case 1: // Template Selection
        return (
          <div className="wizard-step">
            <h4 className="step-title">{step.icon} {step.name}</h4>
            <p className="step-description">{step.description}</p>

            <div className="template-grid">
              {serviceConfig.reportTemplates?.map(template => (
                <div
                  key={template.id}
                  className={`template-card ${currentStepData.template === template.id ? 'selected' : ''}`}
                  onClick={() => handleStepUpdate(step.id, {
                    ...currentStepData,
                    template: template.id
                  })}
                >
                  <div className="template-icon">{template.icon}</div>
                  <div className="template-name">{template.name}</div>
                  <div className="template-description">{template.description}</div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Report Title</label>
              <input
                type="text"
                className="form-input"
                placeholder={`${serviceConfig.name} Report - ${request?.client_name}`}
                value={currentStepData.title || `${serviceConfig.name} Report`}
                onChange={(e) => handleStepUpdate(step.id, {
                  ...currentStepData,
                  title: e.target.value
                })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Report Date</label>
              <input
                type="date"
                className="form-input"
                value={currentStepData.date || new Date().toISOString().split('T')[0]}
                onChange={(e) => handleStepUpdate(step.id, {
                  ...currentStepData,
                  date: e.target.value
                })}
              />
            </div>
          </div>
        );

      case 2: // Content Creation
        return (
          <div className="wizard-step">
            <h4 className="step-title">{step.icon} {step.name}</h4>
            <p className="step-description">{step.description}</p>

            <div className="form-group">
              <label className="form-label">Executive Summary</label>
              <textarea
                className="form-textarea"
                placeholder="Brief overview of the service delivery and key outcomes..."
                value={currentStepData.executive_summary || ''}
                onChange={(e) => handleStepUpdate(step.id, {
                  ...currentStepData,
                  executive_summary: e.target.value
                })}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Key Findings</label>
              <textarea
                className="form-textarea"
                placeholder="Main findings and discoveries from the service delivery..."
                value={currentStepData.key_findings || ''}
                onChange={(e) => handleStepUpdate(step.id, {
                  ...currentStepData,
                  key_findings: e.target.value
                })}
                rows={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Recommendations</label>
              <textarea
                className="form-textarea"
                placeholder="Actionable recommendations for the client..."
                value={currentStepData.recommendations || ''}
                onChange={(e) => handleStepUpdate(step.id, {
                  ...currentStepData,
                  recommendations: e.target.value
                })}
                rows={5}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Next Steps</label>
              <textarea
                className="form-textarea"
                placeholder="Immediate next steps and follow-up actions..."
                value={currentStepData.next_steps || ''}
                onChange={(e) => handleStepUpdate(step.id, {
                  ...currentStepData,
                  next_steps: e.target.value
                })}
                rows={3}
              />
            </div>

            {/* Service-specific content sections */}
            {serviceConfig.contentSections?.map(section => (
              <div key={section.id} className="form-group">
                <label className="form-label">{section.label}</label>
                <textarea
                  className="form-textarea"
                  placeholder={section.placeholder}
                  value={currentStepData[section.id] || ''}
                  onChange={(e) => handleStepUpdate(step.id, {
                    ...currentStepData,
                    [section.id]: e.target.value
                  })}
                  rows={section.rows || 3}
                />
              </div>
            ))}
          </div>
        );

      case 3: // Review & Preview
        return (
          <div className="wizard-step">
            <h4 className="step-title">{step.icon} {step.name}</h4>
            <p className="step-description">{step.description}</p>

            <div className="report-preview">
              <div className="preview-header">
                <h3>{wizardData.step_1?.title || `${serviceConfig.name} Report`}</h3>
                <p>Client: {request?.client_name}</p>
                <p>Date: {wizardData.step_1?.date || new Date().toLocaleDateString()}</p>
                <p>Service: {serviceConfig.name}</p>
              </div>

              <div className="preview-content">
                {wizardData.step_2?.executive_summary && (
                  <div className="preview-section">
                    <h4>Executive Summary</h4>
                    <p>{wizardData.step_2.executive_summary}</p>
                  </div>
                )}

                {wizardData.step_2?.key_findings && (
                  <div className="preview-section">
                    <h4>Key Findings</h4>
                    <p>{wizardData.step_2.key_findings}</p>
                  </div>
                )}

                {wizardData.step_2?.recommendations && (
                  <div className="preview-section">
                    <h4>Recommendations</h4>
                    <p>{wizardData.step_2.recommendations}</p>
                  </div>
                )}

                {wizardData.step_2?.next_steps && (
                  <div className="preview-section">
                    <h4>Next Steps</h4>
                    <p>{wizardData.step_2.next_steps}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Quality Review</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Content accuracy verified
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Client information correct
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Recommendations actionable
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Ready for client delivery
                </label>
              </div>
            </div>
          </div>
        );

      case 4: // Generation & Delivery
        return (
          <div className="wizard-step">
            <h4 className="step-title">{step.icon} {step.name}</h4>
            <p className="step-description">{step.description}</p>

            <div className="form-group">
              <label className="form-label">Delivery Method</label>
              <select
                className="form-select"
                value={currentStepData.delivery_method || 'email'}
                onChange={(e) => handleStepUpdate(step.id, {
                  ...currentStepData,
                  delivery_method: e.target.value
                })}
              >
                <option value="email">Email with PDF attachment</option>
                <option value="portal">Upload to client portal</option>
                <option value="secure-link">Generate secure download link</option>
                <option value="meeting">Schedule presentation meeting</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Delivery Message</label>
              <textarea
                className="form-textarea"
                placeholder="Message to include with the report delivery..."
                value={currentStepData.delivery_message || ''}
                onChange={(e) => handleStepUpdate(step.id, {
                  ...currentStepData,
                  delivery_message: e.target.value
                })}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Follow-up Schedule</label>
              <select
                className="form-select"
                value={currentStepData.followup_schedule || 'none'}
                onChange={(e) => handleStepUpdate(step.id, {
                  ...currentStepData,
                  followup_schedule: e.target.value
                })}
              >
                <option value="none">No scheduled follow-up</option>
                <option value="1week">Follow-up in 1 week</option>
                <option value="2weeks">Follow-up in 2 weeks</option>
                <option value="1month">Follow-up in 1 month</option>
                <option value="quarterly">Quarterly review</option>
              </select>
            </div>

            <button
              className="btn-success large"
              onClick={generateReport}
              disabled={generating}
            >
              {generating ? 'Generating Report...' : 'Generate & Deliver Report'}
            </button>

            {preview && (
              <div className="generated-report">
                <h4>Report Generated Successfully!</h4>
                <p>The report has been generated and is ready for delivery.</p>
                <a href={preview} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  View Report
                </a>
              </div>
            )}
          </div>
        );

      default:
        return <div>Step not configured</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container extra-large">
        <div className="modal-header">
          <h3 className="modal-title">
            📄 Generate {serviceConfig.name} Report - {request?.client_name}
          </h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Step Progress Indicator */}
          <div className="wizard-progress">
            {steps.map(step => (
              <div
                key={step.id}
                className={`wizard-step-indicator ${activeStep >= step.id ? 'completed' : ''} ${activeStep === step.id ? 'active' : ''}`}
                onClick={() => setActiveStep(step.id)}
              >
                <div className="step-icon">{step.icon}</div>
                <div className="step-name">{step.name}</div>
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="wizard-container">
            {renderStepContent(steps.find(s => s.id === activeStep))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <div className="wizard-navigation">
            {activeStep > 1 && (
              <button
                className="btn-secondary"
                onClick={() => setActiveStep(activeStep - 1)}
              >
                Previous
              </button>
            )}
            {activeStep < 4 && (
              <button
                className="btn-primary"
                onClick={() => setActiveStep(activeStep + 1)}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}